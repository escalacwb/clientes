import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'
import { mapCliente, mapServico, mapVenda } from './workbook-mappers.mjs'

loadEnvFile('.env')
loadEnvFile('.env.local')

const workbookPath = path.resolve(process.argv[2] ?? '../sell_out_final_com_vendas_e_servicos.xlsx')
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined
const batchSize = Number(process.argv.find((arg) => arg.startsWith('--batch='))?.split('=')[1] ?? 500)
const defaultCommercialVendorName = 'Mateus Silva'
const defaultCommercialVendorEmail = 'mateus.silva@capitaltruck.local'
const defaultCommercialVendorKey = normalizeVendorName(defaultCommercialVendorName)

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local.')
  process.exit(1)
}

if (!fs.existsSync(workbookPath)) {
  console.error(`Planilha nao encontrada: ${workbookPath}`)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
})

console.log(`Lendo planilha: ${workbookPath}`)
const workbook = XLSX.readFile(workbookPath, {
  cellDates: true,
  sheetRows: limit ? limit + 1 : undefined,
})

const clientes = dedupeClientes(readSheet('Clientes consolidado').map(mapCliente))
const vendas = dedupeItems(readSheet('Vendas por cliente').map(mapVenda))
const servicos = dedupeItems(readSheet('Serviços por cliente').map(mapServico))

console.log(`Amostra preparada: ${clientes.length} clientes, ${vendas.length} vendas, ${servicos.length} servicos.`)

const importacao = await insertImportacao()
const vendedores = await upsertVendedores()
const clienteIndex = await upsertClientes(clientes, vendedores)
const vendasResult = await upsertVendas(vendas, clienteIndex, importacao.id)
const servicosResult = await upsertServicos(servicos, clienteIndex, importacao.id)
const conflitos = [...vendasResult.conflitos, ...servicosResult.conflitos]

if (conflitos.length) {
  await insertConflitos(importacao.id, conflitos)
}

await updateImportacao(importacao.id, {
  total_linhas: clientes.length + vendas.length + servicos.length,
  clientes_encontrados: clientes.length,
  clientes_criados: clienteIndex.size,
  conflitos: conflitos.length,
  itens_criados: vendasResult.created + servicosResult.created,
  itens_ignorados: vendasResult.ignored + servicosResult.ignored,
  status: conflitos.length ? 'com_conflitos' : 'processada',
})

console.log(JSON.stringify({
  importacaoId: importacao.id,
  users: vendedores.size,
  clientes: clienteIndex.size,
  vendas: vendasResult,
  servicos: servicosResult,
  conflitos: conflitos.length,
}, null, 2))

function readSheet(sheetName) {
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) return []
  return XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true })
}

async function insertImportacao() {
  const { data, error } = await supabase
    .from('importacoes')
    .insert({
      tipo: 'base-inicial',
      arquivo_nome: path.basename(workbookPath),
      status: 'processando',
    })
    .select('id')
    .single()

  if (error) throw error
  return data
}

async function updateImportacao(id, patch) {
  const { error } = await supabase.from('importacoes').update(patch).eq('id', id)
  if (error) throw error
}

async function upsertVendedores() {
  const payload = [
    { nome: 'Administracao Capital', email: 'admin@capitaltruck.local', role: 'admin', ativo: true },
    { nome: defaultCommercialVendorName, email: defaultCommercialVendorEmail, role: 'vendedor', ativo: true },
  ]

  for (const batch of chunks(payload, batchSize)) {
    const { error } = await supabase.from('users').upsert(batch, { onConflict: 'email' })
    if (error) throw error
  }

  const { data, error } = await supabase.from('users').select('id,nome,email,role')
  if (error) throw error

  const defaultVendor = data.find((user) => normalizeVendorName(user.nome) === defaultCommercialVendorKey)
  if (!defaultVendor) {
    throw new Error(`Usuario comercial padrao nao encontrado: ${defaultCommercialVendorName}`)
  }

  return new Map([[defaultCommercialVendorKey, defaultVendor.id]])
}

async function upsertClientes(clienteRows, vendedores) {
  const payload = clienteRows
    .filter((cliente) => cliente.codigo_erp || cliente.cpf_cnpj || cliente.nome)
    .map((cliente) => ({
      codigo_erp: cliente.codigo_erp || null,
      cpf_cnpj: cliente.cpf_cnpj || null,
      nome: cliente.nome || cliente.nome_fantasia || 'Cliente sem nome',
      nome_fantasia: cliente.nome_fantasia || null,
      tipo_cliente: cliente.tipo_cliente || null,
      cidade: cliente.cidade || null,
      uf: cliente.uf || null,
      cep: cliente.cep || null,
      telefone_principal: cliente.telefone_principal || null,
      whatsapp_principal: cliente.telefone_principal || null,
      email: cliente.email || null,
      endereco: cliente.endereco || null,
      bairro: cliente.bairro || null,
      vendedor_id: vendedores.get(defaultCommercialVendorKey) ?? null,
      status_comercial: inferStatus(cliente),
      origem: cliente.origem || 'base inicial',
      origem_base: cliente.origem_base || 'desconhecida',
      origem_detalhe: cliente.origem_detalhe || null,
      primeira_compra_em: cliente.primeira_compra_em || null,
      ultima_compra_em: cliente.ultima_compra_em || null,
      ultimo_servico_em: cliente.ultimo_servico_em || null,
      total_comprado: cliente.total_comprado ?? 0,
      total_servicos: cliente.total_servicos ?? 0,
      score_oportunidade: 0,
      tags: cliente.tags ?? [],
    }))

  const withCode = payload.filter((cliente) => cliente.codigo_erp)
  for (const batch of chunks(withCode, batchSize)) {
    const { error } = await supabase.from('clientes').upsert(batch, { onConflict: 'codigo_erp' })
    if (error) throw error
  }

  const withoutCode = payload.filter((cliente) => !cliente.codigo_erp)
  for (const batch of chunks(withoutCode, batchSize)) {
    const { error } = await supabase.from('clientes').insert(batch)
    if (error) throw error
  }

  const index = new Map()
  for (const batch of chunks(withCode.map((cliente) => cliente.codigo_erp), 1000)) {
    const { data, error } = await supabase
      .from('clientes')
      .select('id,codigo_erp,cpf_cnpj,nome')
      .in('codigo_erp', batch)
    if (error) throw error
    data.forEach((cliente) => addClienteKeys(index, cliente))
  }

  if (withoutCode.length) {
    const { data, error } = await supabase
      .from('clientes')
      .select('id,codigo_erp,cpf_cnpj,nome')
      .is('codigo_erp', null)
    if (error) throw error
    data.forEach((cliente) => addClienteKeys(index, cliente))
  }

  return index
}

async function upsertVendas(vendaRows, clienteIndex, importacaoId) {
  const { payload, conflitos, ignored } = buildItemPayload(vendaRows, clienteIndex, 'venda', (venda, clienteId) => ({
    cliente_id: clienteId,
    codigo_cliente_erp: venda.codigo_cliente_erp || null,
    data_venda: venda.data_venda || null,
    nota: venda.nota || null,
    pedido: venda.pedido || null,
    produto_codigo: venda.produto_codigo || null,
    produto_nome: venda.produto_nome || 'Produto sem descricao',
    quantidade: venda.quantidade ?? 0,
    valor_unitario: venda.valor_unitario ?? 0,
    valor_total: venda.valor_total ?? 0,
    vendedor_nome: defaultCommercialVendorName,
    unidade: venda.unidade || null,
    importacao_id: importacaoId,
    chave_unica: venda.chave_unica,
  }))

  let created = 0
  for (const batch of chunks(payload, batchSize)) {
    const { error } = await supabase.from('vendas_itens').upsert(batch, { onConflict: 'chave_unica' })
    if (error) throw error
    created += batch.length
  }

  return { created, ignored, conflitos }
}

async function upsertServicos(servicoRows, clienteIndex, importacaoId) {
  const { payload, conflitos, ignored } = buildItemPayload(servicoRows, clienteIndex, 'servico', (servico, clienteId) => ({
    cliente_id: clienteId,
    codigo_cliente_erp: servico.codigo_cliente_erp || null,
    data_servico: servico.data_servico || null,
    pedido: servico.pedido || null,
    servico_codigo: servico.servico_codigo || null,
    servico_nome: servico.servico_nome || 'Servico sem descricao',
    quantidade: servico.quantidade ?? 0,
    valor_unitario: servico.valor_unitario ?? 0,
    valor_total: servico.valor_total ?? 0,
    observacao: servico.observacao || null,
    vendedor_nome: defaultCommercialVendorName,
    unidade: servico.unidade || null,
    importacao_id: importacaoId,
    chave_unica: servico.chave_unica,
  }))

  let created = 0
  for (const batch of chunks(payload, batchSize)) {
    const { error } = await supabase.from('servicos_itens').upsert(batch, { onConflict: 'chave_unica' })
    if (error) throw error
    created += batch.length
  }

  return { created, ignored, conflitos }
}

function buildItemPayload(rows, clienteIndex, tipo, mapRow) {
  const payload = []
  const conflitos = []
  let ignored = 0

  rows.forEach((row) => {
    const clienteId = resolveClienteId(clienteIndex, row)
    if (!clienteId || !row.chave_unica) {
      ignored += 1
      conflitos.push({
        tipo_conflito: `${tipo}_sem_cliente`,
        resumo: `Nao foi possivel vincular item de ${tipo} ao cliente.`,
        dados_recebidos: JSON.stringify({
          codigo_cliente_erp: row.codigo_cliente_erp,
          cpf_cnpj: row.cpf_cnpj,
          cliente_nome: row.cliente_nome,
          chave_unica: row.chave_unica,
        }),
        possiveis_clientes: [],
      })
      return
    }

    const mapped = mapRow(row, clienteId)
    if ((tipo === 'venda' && !mapped.data_venda) || (tipo === 'servico' && !mapped.data_servico)) {
      ignored += 1
      conflitos.push({
        tipo_conflito: `${tipo}_sem_data`,
        resumo: `Item de ${tipo} sem data obrigatoria.`,
        dados_recebidos: JSON.stringify({
          codigo_cliente_erp: row.codigo_cliente_erp,
          cpf_cnpj: row.cpf_cnpj,
          cliente_nome: row.cliente_nome,
          chave_unica: row.chave_unica,
        }),
        possiveis_clientes: [],
      })
      return
    }

    payload.push(mapped)
  })

  return { payload, conflitos, ignored }
}

async function insertConflitos(importacaoId, conflitos) {
  const payload = conflitos.slice(0, 5000).map((conflito) => ({
    importacao_id: importacaoId,
    ...conflito,
  }))

  for (const batch of chunks(payload, batchSize)) {
    const { error } = await supabase.from('importacao_conflitos').insert(batch)
    if (error) throw error
  }
}

function dedupeClientes(rows) {
  const map = new Map()
  rows.forEach((row) => {
    const key = row.codigo_erp || row.cpf_cnpj || `${row.nome}|${row.cidade}|${row.uf}`
    if (!key) return
    const existing = map.get(key)
    if (!existing || (row.total_comprado ?? 0) + (row.total_servicos ?? 0) > (existing.total_comprado ?? 0) + (existing.total_servicos ?? 0)) {
      map.set(key, row)
    }
  })
  return Array.from(map.values())
}

function dedupeItems(rows) {
  const map = new Map()
  rows.forEach((row) => {
    if (!row.chave_unica) return
    map.set(row.chave_unica, row)
  })
  return Array.from(map.values())
}

function addClienteKeys(index, cliente) {
  if (cliente.codigo_erp) index.set(`erp:${cliente.codigo_erp}`, cliente.id)
  if (cliente.cpf_cnpj) index.set(`doc:${cliente.cpf_cnpj}`, cliente.id)
  if (cliente.nome) index.set(`nome:${normalizeKey(cliente.nome)}`, cliente.id)
}

function resolveClienteId(index, row) {
  return (
    index.get(`erp:${row.codigo_cliente_erp}`) ||
    index.get(`doc:${row.cpf_cnpj}`) ||
    index.get(`nome:${normalizeKey(row.cliente_nome)}`)
  )
}

function inferStatus(cliente) {
  if (cliente.status_origem?.toLowerCase().includes('novo')) return 'novo'
  if (!cliente.ultima_compra_em) return 'reativar'

  const days = Math.round((Date.now() - new Date(cliente.ultima_compra_em).getTime()) / 86400000)
  if (days > 180) return 'reativar'
  if (days > 90) return 'em_acompanhamento'
  return 'ativo'
}

function normalizeVendorName(value) {
  return text(value)
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeKey(value) {
  return text(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function text(value) {
  return value === null || value === undefined ? '' : String(value).trim()
}

function chunks(items, size) {
  const output = []
  for (let index = 0; index < items.length; index += size) output.push(items.slice(index, index + size))
  return output
}

function loadEnvFile(fileName) {
  const filePath = path.resolve(fileName)
  if (!fs.existsSync(filePath)) return

  fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      const separator = trimmed.indexOf('=')
      if (separator === -1) return

      const key = trimmed.slice(0, separator).trim()
      const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')
      if (!process.env[key]) process.env[key] = value
    })
}
