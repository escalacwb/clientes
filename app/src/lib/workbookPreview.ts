type WorkbookRow = Record<string, string | number>

export type WorkbookSheetPreview = {
  sheetName: string
  role: 'clientes' | 'vendas' | 'servicos' | 'resumo' | 'outros'
  totalRows: number
  headers: string[]
  clientKeys: string[]
  uniqueClientKeys: number
  duplicateClientKeys: number
  duplicateSamples: string[]
  missingClientName: number
  missingDocument: number
  sampleRows: WorkbookRow[]
}

export type WorkbookImportPreview = {
  arquivoNome: string
  totalRows: number
  clientesDetectados: number
  clientesDuplicados: number
  sheets: WorkbookSheetPreview[]
  avisos: string[]
}

export async function previewWorkbookFiles(files: FileList | File[]): Promise<WorkbookImportPreview[]> {
  return Promise.all(Array.from(files).map(previewWorkbookFile))
}

async function previewWorkbookFile(file: File): Promise<WorkbookImportPreview> {
  const xlsx = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const workbook = xlsx.read(buffer, { type: 'array', cellDates: true })

  const sheets = workbook.SheetNames.map((sheetName) => {
    const rows = xlsx.utils.sheet_to_json<Array<string | number | Date>>(workbook.Sheets[sheetName], {
      header: 1,
      defval: '',
      raw: false,
    })
    return buildSheetPreview(sheetName, rows)
  })
  const allClientKeys = sheets.flatMap((sheet) => sheet.clientKeys)

  return {
    arquivoNome: file.name,
    totalRows: sheets.reduce((total, sheet) => total + sheet.totalRows, 0),
    clientesDetectados: new Set(allClientKeys).size,
    clientesDuplicados: countDuplicateKeys(allClientKeys).length,
    sheets,
    avisos: buildWarnings(sheets),
  }
}

function buildSheetPreview(sheetName: string, rows: Array<Array<string | number | Date>>): WorkbookSheetPreview {
  const headerIndex = rows.findIndex((row) => row.some((cell) => text(cell)))
  const headers = headerIndex >= 0 ? rows[headerIndex].map((cell) => text(cell)) : []
  const dataRows = headerIndex >= 0 ? rows.slice(headerIndex + 1).filter((row) => row.some((cell) => text(cell))) : []
  const objects = dataRows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header || `Coluna ${index + 1}`, normalizeCell(row[index])])),
  )
  const clientKeys = objects.map(clientKey).filter(Boolean)
  const duplicateSamples = countDuplicateKeys(clientKeys).slice(0, 3)

  return {
    sheetName,
    role: inferRole(sheetName, headers),
    totalRows: objects.length,
    headers,
    clientKeys,
    uniqueClientKeys: new Set(clientKeys).size,
    duplicateClientKeys: countDuplicateKeys(clientKeys).length,
    duplicateSamples,
    missingClientName: objects.filter((row) => !findValue(row, ['nome do cliente', 'cliente encontrado arquivo xls'])).length,
    missingDocument: objects.filter((row) => !clientKey(row)).length,
    sampleRows: objects.slice(0, 3),
  }
}

function inferRole(sheetName: string, headers: string[]): WorkbookSheetPreview['role'] {
  const haystack = normalizeKey(`${sheetName} ${headers.join(' ')}`)
  if (haystack.includes('resumo') || haystack.includes('metrica')) return 'resumo'
  if (haystack.includes('servico')) return 'servicos'
  if (haystack.includes('venda') || haystack.includes('sellout')) return 'vendas'
  if (haystack.includes('cliente')) return 'clientes'
  return 'outros'
}

function buildWarnings(sheets: WorkbookSheetPreview[]) {
  const avisos = []
  if (!sheets.some((sheet) => sheet.role === 'clientes')) avisos.push('Nenhuma aba de clientes foi identificada automaticamente.')
  if (!sheets.some((sheet) => sheet.role === 'vendas')) avisos.push('Nenhuma aba de vendas foi identificada automaticamente.')
  if (!sheets.some((sheet) => sheet.role === 'servicos')) avisos.push('Nenhuma aba de servicos foi identificada automaticamente.')
  if (sheets.some((sheet) => sheet.missingClientName > 0)) avisos.push('Ha linhas sem nome de cliente em uma ou mais abas.')
  if (sheets.some((sheet) => sheet.missingDocument > 0 && sheet.role !== 'resumo')) avisos.push('Ha linhas sem CPF/CNPJ, codigo ERP ou nome de cliente.')
  if (sheets.some((sheet) => sheet.duplicateClientKeys > 0)) avisos.push('Ha clientes repetidos em uma ou mais abas.')
  return avisos
}

function clientKey(row: WorkbookRow) {
  return (
    onlyDigits(findValue(row, ['cpf cnpj'])) ||
    normalizeKey(findValue(row, ['codigo cliente arquivo xls', 'codigo cliente', 'codigo erp'])) ||
    normalizeKey(findValue(row, ['nome do cliente', 'cliente encontrado arquivo xls']))
  )
}

function findValue(row: WorkbookRow, candidates: string[]) {
  const found = Object.entries(row).find(([key, value]) =>
    candidates.some((candidate) => normalizeKey(key).includes(normalizeKey(candidate))) && text(value),
  )
  return found ? text(found[1]) : ''
}

function countDuplicateKeys(keys: string[]) {
  const counts = new Map<string, number>()
  keys.forEach((key) => counts.set(key, (counts.get(key) ?? 0) + 1))
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([key]) => key)
}

function normalizeCell(value: string | number | Date | undefined) {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'number') return value
  return text(value)
}

function normalizeKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

function text(value: unknown) {
  return value === null || value === undefined ? '' : String(value).trim()
}
