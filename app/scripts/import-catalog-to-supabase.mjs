import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import xlsx from 'xlsx'
import { createClient } from '@supabase/supabase-js'

loadEnvFile('.env')
loadEnvFile('.env.local')

const filePath = process.argv[2]
const listName = getArg('--lista') || 'Tabela principal'
const validFrom = getArg('--vigencia-inicio') || null
const validTo = getArg('--vigencia-fim') || null
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const batchSize = 500

if (!filePath) {
  console.error('Uso: node scripts/import-catalog-to-supabase.mjs arquivo.xlsx --lista="Tabela principal"')
  process.exit(1)
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
const rows = readRows(filePath).map(normalizeRow).filter((row) => row.codigo && row.descricao)

if (!rows.length) {
  console.error('Nenhum produto valido encontrado. Verifique cabecalhos de codigo e descricao.')
  process.exit(1)
}

const listId = await ensurePriceList(listName, validFrom, validTo)
await upsertProducts(rows)
const productIds = await loadProductIds(rows.map((row) => row.codigo))
await upsertAliases(rows, productIds)
const prices = rows.filter((row) => row.valor > 0 && productIds.has(row.codigo))
await upsertPrices(prices, productIds, listId, validFrom, validTo)

console.log(JSON.stringify({
  arquivo: path.basename(filePath),
  produtos_lidos: rows.length,
  produtos_com_preco: prices.length,
  lista_preco: listName,
  vigencia_inicio: validFrom,
  vigencia_fim: validTo,
}, null, 2))

function readRows(sourcePath) {
  const workbook = xlsx.readFile(sourcePath, { cellDates: true })
  return workbook.SheetNames.flatMap((sheetName) =>
    xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' }).map((row) => ({ ...row, _sheet: sheetName })),
  )
}

function normalizeRow(row) {
  return {
    codigo: text(pick(row, ['codigo', 'código', 'cod', 'codigo produto', 'código produto', 'codigo_produto', 'sku'])),
    descricao: text(pick(row, ['descricao', 'descrição', 'produto', 'nome', 'modelo / produto'])),
    marca: text(pick(row, ['marca', 'fabricante'])),
    modelo: text(pick(row, ['modelo', 'linha'])),
    medida: text(pick(row, ['medida', 'aro', 'dimensao', 'dimensão'])),
    categoria: text(pick(row, ['categoria', 'tipo', 'tipo produto', 'tipo do produto'])),
    valor: number(pick(row, ['preco', 'preço', 'valor', 'valor unitario', 'valor unitário', 'preco venda', 'preço venda'])),
    desconto_maximo: numberOrNull(pick(row, ['desconto maximo', 'desconto máximo', 'desconto_maximo'])),
    origem: text(row._sheet),
    alias: text(pick(row, ['alias', 'nome alternativo', 'descricao alternativa', 'descrição alternativa'])),
  }
}

async function ensurePriceList(nome, vigenciaInicio, vigenciaFim) {
  const { data: existing, error: existingError } = await supabase
    .from('listas_preco')
    .select('id')
    .eq('nome', nome)
    .maybeSingle()
  if (existingError) throw existingError
  if (existing) return existing.id

  const { data, error } = await supabase
    .from('listas_preco')
    .insert({ nome, vigencia_inicio: vigenciaInicio, vigencia_fim: vigenciaFim, ativo: true })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

async function upsertProducts(rows) {
  const payload = rows.map((row) => ({
    codigo: row.codigo,
    descricao: row.descricao,
    marca: row.marca || null,
    modelo: row.modelo || null,
    medida: row.medida || null,
    categoria: row.categoria || null,
    origem: row.origem || null,
    ativo: true,
    atualizado_em: new Date().toISOString(),
  }))

  for (const batch of chunks(payload, batchSize)) {
    const { error } = await supabase.from('produtos').upsert(batch, { onConflict: 'codigo' })
    if (error) throw error
  }
}

async function loadProductIds(codes) {
  const ids = new Map()
  for (const batch of chunks(Array.from(new Set(codes)), 1000)) {
    const { data, error } = await supabase.from('produtos').select('id,codigo').in('codigo', batch)
    if (error) throw error
    data.forEach((product) => ids.set(product.codigo, product.id))
  }
  return ids
}

async function upsertAliases(rows, productIds) {
  const payload = rows
    .flatMap((row) => [row.alias, row.descricao].filter(Boolean).map((alias) => ({
      produto_id: productIds.get(row.codigo),
      alias,
      origem: row.origem || null,
    })))
    .filter((row) => row.produto_id)

  for (const batch of chunks(payload, batchSize)) {
    const { error } = await supabase.from('produto_aliases').upsert(batch, { onConflict: 'produto_id,alias' })
    if (error) throw error
  }
}

async function upsertPrices(rows, productIds, listaPrecoId, vigenciaInicio, vigenciaFim) {
  const payload = rows.map((row) => ({
    produto_id: productIds.get(row.codigo),
    lista_preco_id: listaPrecoId,
    valor: row.valor,
    desconto_maximo: row.desconto_maximo,
    vigencia_inicio: vigenciaInicio,
    vigencia_fim: vigenciaFim,
  }))

  for (const batch of chunks(payload, batchSize)) {
    const { error } = await supabase
      .from('produto_precos')
      .upsert(batch, { onConflict: 'produto_id,lista_preco_id,vigencia_inicio' })
    if (error) throw error
  }
}

function pick(row, names) {
  const entries = Object.entries(row)
  for (const name of names) {
    const found = entries.find(([key]) => normalizeHeader(key) === normalizeHeader(name))
    if (found) return found[1]
  }
  return ''
}

function normalizeHeader(value) {
  return text(value).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function text(value) {
  return value === null || value === undefined ? '' : String(value).trim()
}

function number(value) {
  if (typeof value === 'number') return value
  const parsed = Number(text(value).replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

function numberOrNull(value) {
  const parsed = number(value)
  return parsed > 0 ? parsed : null
}

function chunks(items, size) {
  const result = []
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size))
  return result
}

function getArg(name) {
  const arg = process.argv.find((item) => item.startsWith(`${name}=`))
  return arg ? arg.slice(name.length + 1).replace(/^['"]|['"]$/g, '') : ''
}

function loadEnvFile(fileName) {
  const envPath = path.resolve(fileName)
  if (!fs.existsSync(envPath)) return

  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const separator = trimmed.indexOf('=')
    if (separator === -1) return
    const key = trimmed.slice(0, separator).trim()
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')
    if (!process.env[key]) process.env[key] = value
  })
}
