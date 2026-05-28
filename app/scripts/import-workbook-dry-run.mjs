import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import XLSX from 'xlsx'
import { mapCliente, mapServico, mapVenda, summarize } from './workbook-mappers.mjs'

const filePath = process.argv[2]
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
const limit = limitArg ? Number(limitArg.split('=')[1]) : 100

if (!filePath) {
  console.error('Uso: npm run dry-run:workbook -- ../sell_out_final_com_vendas_e_servicos.xlsx --limit=100')
  process.exit(1)
}

const absolutePath = path.resolve(filePath)

if (!fs.existsSync(absolutePath)) {
  console.error(`Arquivo nao encontrado: ${absolutePath}`)
  process.exit(1)
}

const workbook = XLSX.readFile(absolutePath, {
  sheetRows: limit + 1,
  cellDates: true,
})

const clientes = readSheet('Clientes consolidado').map(mapCliente)
const vendas = readSheet('Vendas por cliente').map(mapVenda)
const servicos = readSheet('Serviços por cliente').map(mapServico)

const summary = {
  file: absolutePath,
  limit,
  clientes: summarize(clientes, ['codigo_erp', 'cpf_cnpj']),
  vendas: summarize(vendas, ['chave_unica']),
  servicos: summarize(servicos, ['chave_unica']),
  samples: {
    clientes: clientes.slice(0, 3),
    vendas: vendas.slice(0, 3),
    servicos: servicos.slice(0, 3),
  },
}

console.log(JSON.stringify(summary, null, 2))

function readSheet(sheetName) {
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) return []
  return XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true })
}
