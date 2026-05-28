import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import XLSX from 'xlsx'
import { mapCliente, mapServico, mapVenda, summarize } from './workbook-mappers.mjs'

const filePath = process.argv[2]
const outDirArg = process.argv.find((arg) => arg.startsWith('--out='))
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
const outDir = path.resolve(outDirArg ? outDirArg.split('=')[1] : 'exports')
const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined

if (!filePath) {
  console.error('Uso: npm run export:workbook-json -- ../sell_out_final_com_vendas_e_servicos.xlsx --out=exports --limit=1000')
  process.exit(1)
}

const absolutePath = path.resolve(filePath)

if (!fs.existsSync(absolutePath)) {
  console.error(`Arquivo nao encontrado: ${absolutePath}`)
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })

const workbook = XLSX.readFile(absolutePath, {
  cellDates: true,
  sheetRows: limit ? limit + 1 : undefined,
})

const clientes = readSheet('Clientes consolidado').map(mapCliente)
const vendas = readSheet('Vendas por cliente').map(mapVenda)
const servicos = readSheet('Serviços por cliente').map(mapServico)

writeJson('clientes.json', clientes)
writeJson('vendas_itens.json', vendas)
writeJson('servicos_itens.json', servicos)
writeJson('summary.json', {
  file: absolutePath,
  limit: limit ?? null,
  exportedAt: new Date().toISOString(),
  clientes: summarize(clientes, ['codigo_erp', 'cpf_cnpj']),
  vendas: summarize(vendas, ['chave_unica']),
  servicos: summarize(servicos, ['chave_unica']),
})

console.log(`Exportacao concluida em ${outDir}`)

function readSheet(sheetName) {
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) return []
  return XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true })
}

function writeJson(fileName, data) {
  fs.writeFileSync(path.join(outDir, fileName), `${JSON.stringify(data, null, 2)}\n`)
}
