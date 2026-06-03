export type ReferenceFileKind =
  | 'carrosatendidos'
  | 'listaclientessistema'
  | 'vendasprodutos'
  | 'vendasservicos'
  | 'precoprodutos'
  | 'precoservicos'

export type ReferenceFilePreview = {
  kind: ReferenceFileKind
  label: string
  fileName: string
  required: boolean
  status: 'ok' | 'missing' | 'unexpected' | 'invalid'
  totalRows: number
  clientes: number
  ordens: number
  itens: number
  placas: number
  kms: number
  avisos: string[]
}

export type ReferenceImportPreview = {
  arquivoNome: string
  ready: boolean
  totalRows: number
  clientesDetectados: number
  ordensDetectadas: number
  itensDetectados: number
  placasDetectadas: number
  kmsDetectados: number
  files: ReferenceFilePreview[]
  unexpectedFiles: string[]
  avisos: string[]
}

const expectedFiles: Array<{ kind: ReferenceFileKind; label: string; required: boolean; aliases: string[] }> = [
  { kind: 'carrosatendidos', label: 'Carros atendidos', required: true, aliases: ['carrosatendidos'] },
  { kind: 'listaclientessistema', label: 'Lista clientes sistema', required: true, aliases: ['listaclientessistema'] },
  { kind: 'vendasprodutos', label: 'Vendas produtos', required: true, aliases: ['vendasprodutos'] },
  { kind: 'vendasservicos', label: 'Vendas servicos', required: true, aliases: ['vendasservicos'] },
  { kind: 'precoprodutos', label: 'Preco produtos', required: false, aliases: ['precoprodutos', 'listaeprecoprodutos', 'listaprecoprodutos'] },
  { kind: 'precoservicos', label: 'Preco servicos', required: false, aliases: ['precoservicos', 'precosservicos', 'listaeprecoservicos', 'listaeprecoservicos', 'listaprecoservicos'] },
]

export async function previewReferenceImportFiles(files: FileList | File[]): Promise<ReferenceImportPreview> {
  const fileArray = Array.from(files)
  const recognized = new Map<ReferenceFileKind, File[]>()
  const unexpectedFiles: string[] = []

  fileArray.forEach((file) => {
    const spec = identifyReferenceFile(file.name)
    if (!spec) {
      unexpectedFiles.push(file.name)
      return
    }
    recognized.set(spec.kind, [...(recognized.get(spec.kind) ?? []), file])
  })

  const previews: ReferenceFilePreview[] = await Promise.all(expectedFiles.map(async (spec): Promise<ReferenceFilePreview> => {
    const files = recognized.get(spec.kind) ?? []
    if (files.length === 0) return emptyPreview(spec)

    const filePreviews: ReferenceFilePreview[] = await Promise.all(files.map(async (file): Promise<ReferenceFilePreview> => {
      const rows = readHtmlRows(await readLatin1(file))
      if (!matchesExpectedContent(spec.kind, rows)) {
        return invalidPreview(spec, file.name, rows)
      }
      return previewRows(spec, file.name, rows)
    }))

    if (filePreviews.length === 1) return filePreviews[0]
    const invalid = filePreviews.filter((preview) => preview.status === 'invalid')
    const ok = filePreviews.filter((preview) => preview.status === 'ok')
    if (invalid.length > 0) {
      return {
        ...combinePreviews(spec, filePreviews),
        status: 'invalid',
        avisos: invalid.flatMap((preview) => preview.avisos),
      }
    }
    return combinePreviews(spec, ok)
  }))
  const requiredMissing = previews.filter((file) => file.required && file.status === 'missing')
  const invalidFiles = previews.filter((file) => file.status === 'invalid')
  const avisos = [
    ...requiredMissing.map((file) => `Arquivo obrigatorio ausente: ${file.label}.`),
    ...invalidFiles.map((file) => `${file.fileName} tem nome de ${file.label}, mas o cabecalho/conteudo nao bate com esse relatorio.`),
    ...unexpectedFiles.map((fileName) => `Arquivo ignorado por nome fora do padrao: ${fileName}.`),
    ...previews.flatMap((file) => file.avisos),
  ]

  return {
    arquivoNome: buildPackageName(previews),
    ready: requiredMissing.length === 0 && invalidFiles.length === 0 && previews.some((file) => file.itens > 0),
    totalRows: sum(previews, 'totalRows'),
    clientesDetectados: sum(previews, 'clientes'),
    ordensDetectadas: sum(previews, 'ordens'),
    itensDetectados: sum(previews, 'itens'),
    placasDetectadas: sum(previews, 'placas'),
    kmsDetectados: sum(previews, 'kms'),
    files: previews,
    unexpectedFiles,
    avisos,
  }
}

export async function previewCatalogPriceFiles(files: FileList | File[]): Promise<ReferenceImportPreview> {
  const preview = await previewReferenceImportFiles(files)
  const catalogFiles = preview.files.filter((file) => file.kind === 'precoprodutos' || file.kind === 'precoservicos')
  const selectedCatalogFiles = catalogFiles.filter((file) => file.status === 'ok')
  const itensDetectados = selectedCatalogFiles.reduce((sum, file) => sum + file.itens, 0)
  const unexpectedFiles = preview.unexpectedFiles
  const avisos = [
    ...unexpectedFiles.map((fileName) => `Arquivo ignorado por nome fora do padrao: ${fileName}.`),
    ...selectedCatalogFiles.flatMap((file) => file.avisos),
    ...(selectedCatalogFiles.length === 0 ? ['Selecione lista de produtos e/ou lista de servicos.'] : []),
    ...(selectedCatalogFiles.length > 0 && itensDetectados === 0 ? ['Nenhum produto ou servico com preco foi reconhecido.'] : []),
  ]

  return {
    arquivoNome: selectedCatalogFiles.map((file) => file.fileName).filter(Boolean).join(' + ') || 'catalogo-precos',
    ready: selectedCatalogFiles.length > 0 && itensDetectados > 0,
    totalRows: selectedCatalogFiles.reduce((sum, file) => sum + file.totalRows, 0),
    clientesDetectados: 0,
    ordensDetectadas: 0,
    itensDetectados,
    placasDetectadas: 0,
    kmsDetectados: 0,
    files: catalogFiles,
    unexpectedFiles,
    avisos,
  }
}

function identifyReferenceFile(fileName: string) {
  const normalized = normalizeKey(fileName.replace(/\.[^.]+$/, ''))
  return expectedFiles.find((spec) => spec.aliases.some((alias) => normalized.includes(normalizeKey(alias))))
}

function matchesExpectedContent(kind: ReferenceFileKind, rows: string[][]) {
  const normalizedRows = rows.map((row) => normalizeKey(row.join(' ')))
  if (kind === 'listaclientessistema') return normalizedRows.some((row) => row.includes('itemcodigonomefantasiavendedor'))
  if (kind === 'carrosatendidos') return normalizedRows.some((row) => row.includes('itempedidonotadatacarroplacachassiclientevalor'))
  if (kind === 'vendasprodutos' || kind === 'vendasservicos') {
    const hasSalesHeader = normalizedRows.some((row) => row.includes('emissaonotapedido') && row.includes('vendedor'))
    const hasClientGroups = rows.some((row) => /^.+?\s+\(\d{1,8}\)\s+CPF\/CNPJ/i.test(text(row[0])))
    return hasSalesHeader && hasClientGroups
  }
  if (kind === 'precoprodutos' || kind === 'precoservicos') {
    return normalizedRows.some((row) => row.includes('itemcodigodescricao') && row.includes('preco'))
  }
  return false
}

function previewRows(
  spec: { kind: ReferenceFileKind; label: string; required: boolean },
  fileName: string,
  rows: string[][],
): ReferenceFilePreview {
  if (spec.kind === 'listaclientessistema') return previewClientes(spec, fileName, rows)
  if (spec.kind === 'carrosatendidos') return previewCarros(spec, fileName, rows)
  if (spec.kind === 'vendasprodutos' || spec.kind === 'vendasservicos') return previewMovimento(spec, fileName, rows)
  return previewPreco(spec, fileName, rows)
}

function combinePreviews(
  spec: { kind: ReferenceFileKind; label: string; required: boolean },
  previews: ReferenceFilePreview[],
): ReferenceFilePreview {
  return {
    kind: spec.kind,
    label: spec.label,
    fileName: previews.map((preview) => preview.fileName).filter(Boolean).join(' + '),
    required: spec.required,
    status: previews.some((preview) => preview.status === 'invalid') ? 'invalid' : 'ok',
    totalRows: sum(previews, 'totalRows'),
    clientes: sum(previews, 'clientes'),
    ordens: sum(previews, 'ordens'),
    itens: sum(previews, 'itens'),
    placas: sum(previews, 'placas'),
    kms: sum(previews, 'kms'),
    avisos: previews.flatMap((preview) => preview.avisos),
  }
}

function previewClientes(
  spec: { kind: ReferenceFileKind; label: string; required: boolean },
  fileName: string,
  rows: string[][],
): ReferenceFilePreview {
  const totalRows = rows.filter((row) => /^\d+$/.test(text(row[0])) && text(row[1])).length
  return makePreview(spec, fileName, { totalRows, clientes: totalRows })
}

function previewCarros(
  spec: { kind: ReferenceFileKind; label: string; required: boolean },
  fileName: string,
  rows: string[][],
): ReferenceFilePreview {
  const dataRows = rows.filter((row) => /^\d+$/.test(text(row[0])) && /\d{1,2}\/\d{1,2}\/\d{4}/.test(text(row[3])))
  const placas = new Set(dataRows.map((row) => normalizePlate(row[5])).filter(Boolean)).size
  const kms = dataRows.filter((row) => extractKm(row.join(' '))).length
  return makePreview(spec, fileName, { totalRows: dataRows.length, ordens: dataRows.length, placas, kms })
}

function previewMovimento(
  spec: { kind: ReferenceFileKind; label: string; required: boolean },
  fileName: string,
  rows: string[][],
): ReferenceFilePreview {
  const clientes = new Set<string>()
  const ordens = new Set<string>()
  let itens = 0
  let placas = 0
  let kms = 0
  let clienteAtual = ''
  let ordemAtual = ''

  for (const row of rows) {
    const cells = row.map(text)
    const first = cells[0] ?? ''
    const normalized = normalizeKey(cells.join(' '))
    if (normalized.includes('total geral')) break
    const clienteMatch = first.match(/^(.+?)\s+\((\d{1,8})\)\s+CPF\/CNPJ/i)
    if (clienteMatch) {
      clienteAtual = clienteMatch[2].padStart(5, '0')
      clientes.add(clienteAtual)
      continue
    }
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(first) && cells.length >= 9) {
      ordemAtual = [spec.kind, clienteAtual, cells[1], cells[2], first].join('|')
      ordens.add(ordemAtual)
      continue
    }
    if (isVehicleNoteRow(cells)) {
      if (extractPlate(cells.join(' '))) placas += 1
      if (extractKm(cells.join(' '))) kms += 1
      continue
    }
    if (clienteAtual && ordemAtual && /^\d+$/.test(first) && cells.length >= 7) itens += 1
  }

  return makePreview(spec, fileName, {
    totalRows: rows.length,
    clientes: clientes.size,
    ordens: ordens.size,
    itens,
    placas,
    kms,
  })
}

function previewPreco(
  spec: { kind: ReferenceFileKind; label: string; required: boolean },
  fileName: string,
  rows: string[][],
): ReferenceFilePreview {
  const itens = rows.filter((row) => /^\d+$/.test(text(row[0])) && text(row[1])).length
  return makePreview(spec, fileName, { totalRows: itens, itens })
}

function makePreview(
  spec: { kind: ReferenceFileKind; label: string; required: boolean },
  fileName: string,
  values: Partial<Pick<ReferenceFilePreview, 'totalRows' | 'clientes' | 'ordens' | 'itens' | 'placas' | 'kms'>>,
): ReferenceFilePreview {
  const avisos = []
  if (spec.required && !values.totalRows) avisos.push(`${spec.label} nao trouxe linhas reconhecidas.`)
  return {
    kind: spec.kind,
    label: spec.label,
    fileName,
    required: spec.required,
    status: 'ok',
    totalRows: values.totalRows ?? 0,
    clientes: values.clientes ?? 0,
    ordens: values.ordens ?? 0,
    itens: values.itens ?? 0,
    placas: values.placas ?? 0,
    kms: values.kms ?? 0,
    avisos,
  }
}

function invalidPreview(
  spec: { kind: ReferenceFileKind; label: string; required: boolean },
  fileName: string,
  rows: string[][],
): ReferenceFilePreview {
  return {
    kind: spec.kind,
    label: spec.label,
    fileName,
    required: spec.required,
    status: 'invalid',
    totalRows: rows.length,
    clientes: 0,
    ordens: 0,
    itens: 0,
    placas: 0,
    kms: 0,
    avisos: [`Formato invalido para ${spec.label}: confira se o relatorio exportado e o mesmo modelo dos arquivos de referencia.`],
  }
}

function emptyPreview(spec: { kind: ReferenceFileKind; label: string; required: boolean }): ReferenceFilePreview {
  return {
    kind: spec.kind,
    label: spec.label,
    fileName: '',
    required: spec.required,
    status: 'missing',
    totalRows: 0,
    clientes: 0,
    ordens: 0,
    itens: 0,
    placas: 0,
    kms: 0,
    avisos: [],
  }
}

async function readLatin1(file: File) {
  const buffer = await file.arrayBuffer()
  return new TextDecoder('iso-8859-1').decode(buffer)
}

function readHtmlRows(content: string) {
  const htmlStart = content.search(/<html[\s>]/i)
  const htmlEnd = content.search(/--separador--/i)
  const html = htmlStart === -1 ? content : content.slice(htmlStart, htmlEnd > htmlStart ? htmlEnd : undefined)
  return html
    .split(/<tr\b/i)
    .slice(1)
    .map((part) => Array.from(part.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)).map((match) => htmlToText(match[1])))
    .filter((row) => row.some(Boolean))
}

function isVehicleNoteRow(cells: string[]) {
  if (cells.length > 4) return false
  const raw = cells.join(' ')
  return /\bPLACA\b/i.test(raw) || /\bKMS?\s*[:\/-]?\s*\d/i.test(raw)
}

function extractPlate(value: string) {
  const match =
    value.toUpperCase().match(/\bPLACA\s+([A-Z]{3})\s*-?\s*([0-9][A-Z0-9][0-9]{2}|[0-9]{4})\b/) ||
    value.toUpperCase().match(/\b([A-Z]{3})\s*-?\s*([0-9][A-Z0-9][0-9]{2}|[0-9]{4})\b/)
  return match ? normalizePlate(`${match[1]}${match[2]}`) : ''
}

function extractKm(value: string) {
  const match = value.toUpperCase().match(/\bKMS?\s*[:\/-]?\s*([0-9][0-9.\s]{0,14})/)
  return match ? Number(match[1].replace(/\D/g, '')) : 0
}

function htmlToText(value: string) {
  return text(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?13;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildPackageName(files: ReferenceFilePreview[]) {
  const date = new Date().toISOString().slice(0, 10)
  const okFiles = files.filter((file) => file.status === 'ok').length
  return `importacao-diaria-${date}-${okFiles}-arquivos`
}

function sum(files: ReferenceFilePreview[], key: keyof Pick<ReferenceFilePreview, 'totalRows' | 'clientes' | 'ordens' | 'itens' | 'placas' | 'kms'>) {
  return files.reduce((total, file) => total + file[key], 0)
}

function normalizePlate(value: string | undefined) {
  return text(value).toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function normalizeKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function text(value: unknown) {
  return value === null || value === undefined ? '' : String(value).trim()
}
