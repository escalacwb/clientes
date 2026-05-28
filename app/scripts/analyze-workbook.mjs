import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import XLSX from 'xlsx'

const filePath = process.argv[2]

if (!filePath) {
  console.error('Uso: npm run analyze:workbook -- ../sell_out_final_com_vendas_e_servicos.xlsx')
  process.exit(1)
}

const absolutePath = path.resolve(filePath)

if (!fs.existsSync(absolutePath)) {
  console.error(`Arquivo nao encontrado: ${absolutePath}`)
  process.exit(1)
}

const workbook = XLSX.readFile(absolutePath, { sheetRows: 25, cellDates: true })

const report = workbook.SheetNames.map((sheetName) => {
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })
  const headers = rows[0] ?? []
  return {
    sheetName,
    sampledRows: Math.max(rows.length - 1, 0),
    headers,
  }
})

console.log(JSON.stringify({ file: absolutePath, sheets: report }, null, 2))
