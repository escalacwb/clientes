import path from 'node:path'
import fs from 'node:fs'
import xlsx from 'xlsx'

const files = [
  '../arquivos referencia/carrosatendidos.xls',
  '../arquivos referencia/listaclientessistema.xls',
  '../arquivos referencia/precoprodutos.xls',
  '../arquivos referencia/precoservicos.xls',
  '../arquivos referencia/vendasprodutos.xls',
  '../arquivos referencia/vendasservicos.xls',
  '../arquivos referencia/lancamentosvendasmichelin.xlsx',
]

for (const file of files) {
  const workbook = readWorkbook(file)
  const groups = new Map()
  console.log('\n###', path.basename(file))
  console.log('sheet count:', workbook.SheetNames.length)

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' })
    const headerIndex = findHeaderIndex(rows)
    if (headerIndex === -1) continue

    const headers = cleanRow(rows[headerIndex])
    const key = headers.join(' | ')
    const dataRows = rows.slice(headerIndex + 1).map(cleanRow).filter((row) => row.some(Boolean))
    const current = groups.get(key) ?? {
      count: 0,
      sheets: [],
      rows: 0,
      headers,
      sample: [],
    }

    current.count += 1
    current.rows += dataRows.length
    if (current.sheets.length < 5) current.sheets.push(sheetName)
    if (current.sample.length < 3) current.sample.push(...dataRows.slice(0, 3 - current.sample.length))
    groups.set(key, current)
  }

  const relevantGroups = [...groups.values()]
    .filter((group) => group.headers.length >= 3)
    .sort((a, b) => b.rows - a.rows)
    .slice(0, 8)

  for (const group of relevantGroups) {
    console.log(`\nlayout x${group.count} sheets=${group.sheets.join(', ')} rows~${group.rows}`)
    console.log('headers:', group.headers.join(' | '))
    console.log('sample:')
    group.sample.forEach((row) => {
      console.log(' -', group.headers.map((header, index) => `${header}: ${formatCell(row[index])}`).join(' | '))
    })
  }
}

function readWorkbook(file) {
  const buffer = fs.readFileSync(file)
  const textStart = buffer.subarray(0, 256).toString('utf8')

  if (!textStart.includes('MIME-Version')) {
    return xlsx.read(buffer, { type: 'buffer', sheetRows: 25, cellDates: true })
  }

  const text = buffer.toString('latin1')
  const htmlStart = text.search(/<html[\s>]/i)
  if (htmlStart === -1) {
    return xlsx.read(buffer, { type: 'buffer', sheetRows: 25, cellDates: true })
  }

  const htmlEnd = text.search(/--separador--/i)
  const html = text.slice(htmlStart, htmlEnd > htmlStart ? htmlEnd : undefined)
  return xlsx.read(html, { type: 'string', sheetRows: 25, cellDates: true })
}

function findHeaderIndex(rows) {
  let bestIndex = -1
  let bestScore = 0

  rows.slice(0, 30).forEach((row, index) => {
    const cells = cleanRow(row)
    const joined = normalize(cells.join(' '))
    const filled = cells.filter(Boolean).length
    const terms = ['item', 'codigo', 'pedido', 'nota', 'data', 'cliente', 'placa', 'chassi', 'preco', 'valor', 'vendedor']
    const hits = terms.filter((term) => joined.includes(term)).length
    const score = hits * 10 + filled
    if (filled >= 3 && score > bestScore) {
      bestIndex = index
      bestScore = score
    }
  })

  return bestScore >= 13 ? bestIndex : -1
}

function cleanRow(row) {
  return row.map((cell) => String(cell ?? '').replace(/\s+/g, ' ').trim()).filter((cell, index, all) => cell || all.slice(index + 1).some(Boolean))
}

function normalize(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function formatCell(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value ?? '').replace(/\s+/g, ' ').slice(0, 80)
}
