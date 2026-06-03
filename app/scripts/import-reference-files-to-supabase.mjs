import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'
import {
  REFERENCE_FILES,
  parseCarrosAtendidos,
  parseClientesSistema,
  parseListaPreco,
  parseMovimento,
} from './reference-file-reader.mjs'

loadEnvFile('.env')
loadEnvFile('.env.local')

const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined
const batchSize = Number(process.argv.find((arg) => arg.startsWith('--batch='))?.split('=')[1] ?? 500)
const orderBatchSize = Number(process.argv.find((arg) => arg.startsWith('--order-batch='))?.split('=')[1] ?? Math.min(batchSize, 50))
const dryRun = process.argv.includes('--dry-run')

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
})

const carrosFiles = [
  REFERENCE_FILES.carrosAtendidos,
  REFERENCE_FILES.carrosAtendidosService,
  REFERENCE_FILES.carrosAtendidosTruck,
].filter((file) => fs.existsSync(path.resolve(file)))

const required = [
  ['listaclientessistema', REFERENCE_FILES.clientesSistema],
  ['vendasprodutos', REFERENCE_FILES.vendasProdutos],
  ['vendasservicos', REFERENCE_FILES.vendasServicos],
]

if (carrosFiles.length === 0) {
  console.error(`Arquivo obrigatorio nao encontrado: ${REFERENCE_FILES.carrosAtendidos} ou relatorios service/truck`)
  process.exit(1)
}

for (const [, file] of required) {
  if (!fs.existsSync(path.resolve(file))) {
    console.error(`Arquivo obrigatorio nao encontrado: ${file}`)
    process.exit(1)
  }
}

console.log('Lendo arquivos de referencia...')
const clientes = take(parseClientesSistema(), limit)
const carros = take(carrosFiles.flatMap((file) => {
  const origemArquivo = inferCarrosFileOrigin(file)
  return parseCarrosAtendidos(file).map((carro) => ({
    ...carro,
    origem: origemArquivo,
    raw: { ...carro.raw, origem_arquivo: origemArquivo },
  }))
}), limit)
const precosProdutos = take(parseListaPreco(REFERENCE_FILES.precoProdutos, 'produto'), limit)
const precosServicos = take(parseListaPreco(REFERENCE_FILES.precoServicos, 'servico'), limit)
const vendasProdutos = take(parseMovimento(REFERENCE_FILES.vendasProdutos, 'produto'), limit)
const vendasServicos = take(parseMovimento(REFERENCE_FILES.vendasServicos, 'servico'), limit)
const movimentos = [...vendasProdutos, ...vendasServicos]
const clientesImportacao = buildClientesImportacao(clientes, movimentos, carros)

const veiculoResolver = buildVehicleResolver(carros)
const movimentosComVeiculo = movimentos.map((movimento) => ({
  ...movimento,
  veiculo_ref: directVehicleRef(movimento) || veiculoResolver.resolve(movimento),
}))
const veiculoSourceRows = [
  ...carros,
  ...movimentosComVeiculo
    .filter((row) => row.veiculo_ref)
    .map((row) => ({
      pedido: row.pedido,
      nota: row.nota,
      data_atendimento: row.data,
      veiculo_nome: row.veiculo_ref.veiculo_nome || row.veiculo_ref.veiculo_descricao || row.veiculo_descricao || '',
      placa: row.veiculo_ref.placa || '',
      chassi: row.veiculo_ref.chassi || '',
      km: row.veiculo_ref.km ?? row.km ?? null,
      raw_vehicle_note: row.veiculo_ref.raw_vehicle_note || row.raw_vehicle_note || '',
      codigo_cliente_erp: row.codigo_cliente_erp,
      cliente_nome: row.cliente_nome,
      valor: row.valor_total || 0,
      raw: row,
      origem: row.veiculo_ref.match || 'observacao_movimento',
    })),
]

const summary = {
  clientes: clientesImportacao.length,
  clientesCadastro: clientes.length,
  carrosAtendidos: carros.length,
  vendasProdutos: vendasProdutos.length,
  vendasServicos: vendasServicos.length,
  precosProdutos: precosProdutos.length,
  precosServicos: precosServicos.length,
  movimentosComVeiculo: movimentosComVeiculo.filter((item) => item.veiculo_ref).length,
  movimentosSemVeiculo: movimentosComVeiculo.filter((item) => !item.veiculo_ref).length,
}

console.log(JSON.stringify(summary, null, 2))
if (dryRun) process.exit(0)

let importacao
try {
  importacao = await step('criando importacao', () => createImportacao(summary))
  const arquivos = await step('registrando arquivos', () => upsertImportacaoArquivos(importacao.id))
  const appUsers = await step('carregando usuarios do app', () => fetchAppUsers())
  const clienteIndex = await step('importando clientes', () => upsertClientes(clientesImportacao, appUsers))
  const veiculoIndex = await step('importando veiculos', () => upsertVeiculos(veiculoSourceRows, clienteIndex))
  const ordemIndex = await step('importando ordens/pedidos', () => upsertOrdens(movimentosComVeiculo, clienteIndex, veiculoIndex, importacao.id))
  const vendasResult = await step('importando itens de produtos', () => upsertVendas(movimentosComVeiculo.filter((item) => item.tipo === 'produto'), clienteIndex, veiculoIndex, ordemIndex, importacao.id))
  const servicosResult = await step('importando itens de servicos', () => upsertServicos(movimentosComVeiculo.filter((item) => item.tipo === 'servico'), clienteIndex, veiculoIndex, ordemIndex, importacao.id))
  const catalogoResult = await step('importando catalogo/precos', () => upsertCatalogo([...precosProdutos, ...precosServicos], arquivos))

  const postProcessResult = await step('finalizando importacao e oportunidades', () => finalizarImportacaoDiaria())
  await updateImportacao(importacao.id, {
    total_linhas: clientesImportacao.length + carros.length + movimentos.length + precosProdutos.length + precosServicos.length,
    clientes_encontrados: clientesImportacao.length,
    clientes_criados: clientesImportacao.length,
    conflitos: vendasResult.conflitos + servicosResult.conflitos,
    itens_criados: vendasResult.created + servicosResult.created,
    itens_ignorados: vendasResult.ignored + servicosResult.ignored,
    status: vendasResult.conflitos + servicosResult.conflitos ? 'com_conflitos' : 'processada',
  })

  console.log(JSON.stringify({
    importacaoId: importacao.id,
    clientes: clienteIndex.size,
    veiculos: veiculoIndex.size,
    ordens: ordemIndex.size,
    vendas: vendasResult,
    servicos: servicosResult,
    catalogo: catalogoResult,
    postProcess: postProcessResult,
  }, null, 2))
} catch (error) {
  if (importacao?.id) {
    await updateImportacao(importacao.id, { status: 'erro' }).catch(() => {})
  }
  console.error(JSON.stringify({
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    context: error?.context,
    error,
  }, null, 2))
  process.exit(1)
}

async function step(label, run) {
  console.log(`> ${label}...`)
  const result = await run()
  console.log(`< ${label} concluido`)
  return result
}

async function createImportacao(stats) {
  const { data, error } = await supabase
    .from('importacoes')
    .insert({
      tipo: 'referencias-diarias',
      arquivo_nome: 'arquivos referencia',
      total_linhas: Object.values(stats).reduce((total, value) => total + Number(value || 0), 0),
      status: 'processando',
    })
    .select('id')
    .single()

  if (error) throw error
  return data
}

function buildClientesImportacao(clientes, movimentos, carros) {
  const byCodigo = new Map()
  const add = (row, overwrite = false) => {
    if (!row.codigo_erp) return
    if (!overwrite && byCodigo.has(row.codigo_erp)) return
    byCodigo.set(row.codigo_erp, row)
  }

  carros.forEach((carro) => add({
    codigo_erp: carro.codigo_cliente_erp,
    nome: carro.cliente_nome,
    nome_fantasia: '',
    vendedor_nome: '',
    canal_venda: '',
    cidade: '',
    uf: '',
    telefone_principal: '',
    cpf_cnpj: '',
    email: '',
    email_comercial: '',
    tipo_cliente: '',
    raw: { ...carro.raw, origem_arquivo: 'carrosatendidos' },
  }))

  movimentos.forEach((movimento) => add({
    codigo_erp: movimento.codigo_cliente_erp,
    nome: movimento.cliente_nome,
    nome_fantasia: '',
    vendedor_nome: movimento.vendedor_nome,
    canal_venda: '',
    cidade: '',
    uf: '',
    telefone_principal: movimento.telefone_principal || '',
    cpf_cnpj: movimento.cpf_cnpj,
    email: '',
    email_comercial: '',
    tipo_cliente: '',
    raw: {
      origem_arquivo: movimento.tipo === 'produto' ? 'vendasprodutos' : 'vendasservicos',
      codigo_erp: movimento.codigo_cliente_erp,
      nome: movimento.cliente_nome,
      cpf_cnpj: movimento.cpf_cnpj,
      telefones: movimento.telefone_principal || '',
      vendedor: movimento.vendedor_nome,
    },
  }))

  clientes.forEach((cliente) => add(cliente, true))
  return [...byCodigo.values()]
}

async function upsertImportacaoArquivos(importacaoId) {
  const specs = [
    ...carrosFiles.map((file) => ['carrosatendidos', file, true, parseCarrosAtendidos(file).length]),
    ['listaclientessistema', REFERENCE_FILES.clientesSistema, true, clientes.length],
    ['vendasprodutos', REFERENCE_FILES.vendasProdutos, true, vendasProdutos.length],
    ['vendasservicos', REFERENCE_FILES.vendasServicos, true, vendasServicos.length],
    ['precoprodutos', REFERENCE_FILES.precoProdutos, false, precosProdutos.length],
    ['precoservicos', REFERENCE_FILES.precoServicos, false, precosServicos.length],
  ].filter(([, file]) => fs.existsSync(path.resolve(file)))

  const payload = specs.map(([tipo, file, obrigatorio, total]) => ({
    importacao_id: importacaoId,
    tipo,
    arquivo_nome: path.basename(file),
    arquivo_hash: hashFile(file),
    obrigatorio,
    total_linhas: total,
    processado_em: new Date().toISOString(),
  }))

  for (const batch of chunks(payload, batchSize)) {
    const { error } = await supabase.from('importacao_arquivos').upsert(batch, { onConflict: 'tipo,arquivo_hash' })
    if (error) throw error
  }

  const { data, error } = await supabase
    .from('importacao_arquivos')
    .select('id,tipo,arquivo_hash')
    .in('arquivo_hash', payload.map((item) => item.arquivo_hash))
  if (error) throw error

  return new Map(data.map((item) => [item.tipo, item.id]))
}

function inferCarrosFileOrigin(file) {
  const normalized = normalizeKey(path.basename(file))
  if (normalized.includes('service')) return 'carrosatendidosservice'
  if (normalized.includes('truck')) return 'carrosatendidostruck'
  return 'carrosatendidos'
}

async function fetchAppUsers() {
  const { data, error } = await supabase.from('users').select('id,nome,email,role').eq('ativo', true)
  if (error) throw error

  return new Map(data.map((user) => [normalizeVendor(user.nome), user.id]))
}

async function upsertClientes(rows, appUsers) {
  const deduped = dedupe(rows, (row) => row.codigo_erp || row.cpf_cnpj || normalizeKey(row.nome))
  const payload = deduped.map((cliente) => {
    const vendedor = splitVendor(cliente.vendedor_nome)
    return {
      codigo_erp: cliente.codigo_erp || null,
      cpf_cnpj: cliente.cpf_cnpj || null,
      nome: cliente.nome || cliente.nome_fantasia || 'Cliente sem nome',
      nome_fantasia: cliente.nome_fantasia || null,
      tipo_cliente: cliente.tipo_cliente || null,
      cidade: cliente.cidade || null,
      uf: cliente.uf || null,
      endereco: joinAddress(cliente),
      bairro: cliente.bairro || null,
      cep: cliente.cep || null,
      telefone_principal: cliente.telefone_principal || null,
      whatsapp_principal: cliente.telefone_principal || null,
      email: cliente.email || cliente.email_comercial || null,
      vendedor_id: appUsers.get(normalizeVendor(vendedor.nome)) ?? null,
      vendedor_codigo_erp: vendedor.codigo || null,
      vendedor_nome_erp: vendedor.nome || null,
      canal_venda: cliente.canal_venda || null,
      cadastro_erp_em: cliente.cadastro_em || null,
      status_comercial: 'novo',
      origem: cliente.raw?.origem_arquivo || 'listaclientessistema',
      origem_base: inferOrigemBase(cliente.raw, 'capital_truck'),
      origem_detalhe: inferOrigemDetalhe(cliente.raw, cliente.raw?.origem_arquivo ? `Cadastro minimo criado por ${cliente.raw.origem_arquivo}` : 'Cadastro ERP Capital Truck Center'),
      raw_data: cliente.raw,
    }
  })

  for (const batch of chunks(payload, batchSize)) {
    const { error } = await supabase.from('clientes').upsert(batch, { onConflict: 'codigo_erp' })
    if (error) throw error
  }

  const index = new Map()
  for (const batch of chunks(payload.map((item) => item.codigo_erp).filter(Boolean), 1000)) {
    const { data, error } = await supabase.from('clientes').select('id,codigo_erp,cpf_cnpj,nome').in('codigo_erp', batch)
    if (error) throw error
    data.forEach((cliente) => addClienteKeys(index, cliente))
  }
  return index
}

async function upsertVeiculos(rows, clienteIndex) {
  const deduped = dedupe(rows.filter((row) => row.placa || row.chassi || row.veiculo_nome), (row) => row.placa || row.chassi || `${row.codigo_cliente_erp}|${normalizeKey(row.veiculo_nome)}`)
  const aggregates = new Map()

  for (const row of rows) {
    const key = row.placa || row.chassi || `${row.codigo_cliente_erp}|${normalizeKey(row.veiculo_nome)}`
    const current = aggregates.get(key) ?? { total: 0, valor: 0, first: row.data_atendimento, last: row.data_atendimento, ultimoKm: null, kmDate: null }
    current.total += 1
    current.valor += row.valor || 0
    current.first = minDate(current.first, row.data_atendimento)
    current.last = maxDate(current.last, row.data_atendimento)
    if (row.km && (!current.kmDate || row.data_atendimento >= current.kmDate)) {
      current.ultimoKm = row.km
      current.kmDate = row.data_atendimento
    }
    aggregates.set(key, current)
  }

  const payload = deduped.map((row) => {
    const stats = aggregates.get(row.placa || row.chassi || `${row.codigo_cliente_erp}|${normalizeKey(row.veiculo_nome)}`)
    return {
      cliente_id: resolveClienteId(clienteIndex, row) || null,
      codigo_cliente_erp: row.codigo_cliente_erp || null,
      placa: row.placa || null,
      chassi: row.chassi || null,
      descricao: row.veiculo_nome || null,
      primeiro_atendimento_em: stats?.first || row.data_atendimento || null,
      ultimo_atendimento_em: stats?.last || row.data_atendimento || null,
      total_atendimentos: stats?.total ?? 1,
      valor_total_atendimentos: stats?.valor ?? row.valor ?? 0,
      ultimo_km: stats?.ultimoKm ?? row.km ?? null,
      km_atualizado_em: stats?.kmDate ?? (row.km ? row.data_atendimento : null),
      origem: row.origem || 'carrosatendidos',
      raw_data: row.raw,
    }
  })

  const withPlate = payload.filter((item) => item.placa)
  for (const batch of chunks(withPlate, batchSize)) {
    const { error } = await supabase.from('veiculos').upsert(batch, { onConflict: 'placa' })
    if (error) throw error
  }

  const noPlateWithChassi = payload.filter((item) => !item.placa && item.chassi)
  for (const batch of chunks(noPlateWithChassi, batchSize)) {
    const { error } = await supabase.from('veiculos').upsert(batch, { onConflict: 'chassi' })
    if (error) throw error
  }

  const noPlateNoChassi = payload.filter((item) => !item.placa && !item.chassi)
  for (const batch of chunks(noPlateNoChassi, batchSize)) {
    const { error } = await supabase.from('veiculos').insert(batch)
    if (error) throw error
  }

  const index = new Map()
  const lookupPlates = withPlate.map((item) => item.placa).filter(Boolean)
  for (const batch of chunks(lookupPlates, 1000)) {
    const { data, error } = await supabase.from('veiculos').select('id,placa,chassi,codigo_cliente_erp,descricao').in('placa', batch)
    if (error) throw error
    data.forEach((veiculo) => addVeiculoKeys(index, veiculo))
  }
  const lookupChassis = noPlateWithChassi.map((item) => item.chassi).filter(Boolean)
  for (const batch of chunks(lookupChassis, 1000)) {
    const { data, error } = await supabase.from('veiculos').select('id,placa,chassi,codigo_cliente_erp,descricao').in('chassi', batch)
    if (error) throw error
    data.forEach((veiculo) => addVeiculoKeys(index, veiculo))
  }
  return index
}

async function upsertOrdens(rows, clienteIndex, veiculoIndex, importacaoId) {
  const orders = dedupe(rows, orderKey)
  const payload = orders.flatMap((row) => {
    const clienteId = resolveClienteId(clienteIndex, row)
    if (!clienteId) return []
    const veiculoId = resolveVeiculoId(veiculoIndex, row.veiculo_ref)
    return [{
      tipo: row.tipo,
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      codigo_cliente_erp: row.codigo_cliente_erp || null,
      cliente_nome_snapshot: row.cliente_nome || null,
      data_movimento: row.data,
      nota: row.nota || null,
      pedido: row.pedido || null,
      cfop: row.cfop || null,
      vendedor_nome: normalizeVendor(row.vendedor_nome) || null,
      unidade: row.unidade || null,
      total_pedido: row.total_pedido || 0,
      placa_extraida: row.veiculo_ref?.placa || row.placa || null,
      km_extraido: row.veiculo_ref?.km ?? row.km ?? null,
      veiculo_descricao_extraida: row.veiculo_ref?.veiculo_nome || row.veiculo_ref?.veiculo_descricao || row.veiculo_descricao || null,
      veiculo_observacao: row.veiculo_ref?.raw_vehicle_note || row.raw_vehicle_note || null,
      veiculo_match: row.veiculo_ref?.match || row.veiculo_match || null,
      origem_arquivo: row.tipo === 'produto' ? 'vendasprodutos' : 'vendasservicos',
      importacao_id: importacaoId,
      raw_data: row,
      chave_unica: orderKey(row),
    }]
  })

  await upsertOrdensViaPostgres(payload)

  const index = new Map()
  const client = await createPgClient()
  try {
    for (const batch of chunks(payload.map((item) => item.chave_unica), 1000)) {
      const { rows: data } = await client.query(
        'select id, chave_unica from public.ordens_movimento where chave_unica = any($1::text[])',
        [batch],
      )
      data.forEach((ordem) => index.set(ordem.chave_unica, ordem.id))
    }
  } finally {
    await client.end()
  }
  return index
}

async function upsertOrdensViaPostgres(payload) {
  if (!payload.length) return

  const client = await createPgClient()
  try {
    for (const batch of chunks(payload, Math.max(orderBatchSize, 200))) {
      await client.query(`
        insert into public.ordens_movimento (
          tipo,
          cliente_id,
          veiculo_id,
          codigo_cliente_erp,
          cliente_nome_snapshot,
          data_movimento,
          nota,
          pedido,
          cfop,
          vendedor_nome,
          unidade,
          total_pedido,
          placa_extraida,
          km_extraido,
          veiculo_descricao_extraida,
          veiculo_observacao,
          veiculo_match,
          origem_arquivo,
          importacao_id,
          raw_data,
          chave_unica
        )
        select
          tipo,
          cliente_id,
          veiculo_id,
          codigo_cliente_erp,
          cliente_nome_snapshot,
          data_movimento,
          nota,
          pedido,
          cfop,
          vendedor_nome,
          unidade,
          total_pedido,
          placa_extraida,
          km_extraido,
          veiculo_descricao_extraida,
          veiculo_observacao,
          veiculo_match,
          origem_arquivo,
          importacao_id,
          raw_data,
          chave_unica
        from jsonb_to_recordset($1::jsonb) as x(
          tipo text,
          cliente_id uuid,
          veiculo_id uuid,
          codigo_cliente_erp text,
          cliente_nome_snapshot text,
          data_movimento date,
          nota text,
          pedido text,
          cfop text,
          vendedor_nome text,
          unidade text,
          total_pedido numeric,
          placa_extraida text,
          km_extraido integer,
          veiculo_descricao_extraida text,
          veiculo_observacao text,
          veiculo_match text,
          origem_arquivo text,
          importacao_id uuid,
          raw_data jsonb,
          chave_unica text
        )
        on conflict (chave_unica) do update set
          cliente_id = excluded.cliente_id,
          veiculo_id = excluded.veiculo_id,
          codigo_cliente_erp = excluded.codigo_cliente_erp,
          cliente_nome_snapshot = excluded.cliente_nome_snapshot,
          data_movimento = excluded.data_movimento,
          nota = excluded.nota,
          pedido = excluded.pedido,
          cfop = excluded.cfop,
          vendedor_nome = excluded.vendedor_nome,
          unidade = excluded.unidade,
          total_pedido = excluded.total_pedido,
          placa_extraida = excluded.placa_extraida,
          km_extraido = excluded.km_extraido,
          veiculo_descricao_extraida = excluded.veiculo_descricao_extraida,
          veiculo_observacao = excluded.veiculo_observacao,
          veiculo_match = excluded.veiculo_match,
          origem_arquivo = excluded.origem_arquivo,
          importacao_id = excluded.importacao_id,
          raw_data = excluded.raw_data;
      `, [JSON.stringify(batch)])
    }
  } finally {
    await client.end()
  }
}

async function upsertVendas(rows, clienteIndex, veiculoIndex, ordemIndex, importacaoId) {
  const payload = []
  let ignored = 0
  let conflitos = 0

  for (const row of rows) {
    const clienteId = resolveClienteId(clienteIndex, row)
    if (!clienteId || !row.data) {
      ignored += 1
      conflitos += 1
      continue
    }
    const veiculoRef = row.veiculo_ref
    payload.push({
      cliente_id: clienteId,
      ordem_id: ordemIndex.get(orderKey(row)) ?? null,
      veiculo_id: resolveVeiculoId(veiculoIndex, veiculoRef),
      codigo_cliente_erp: row.codigo_cliente_erp || null,
      data_venda: row.data,
      nota: row.nota || null,
      pedido: row.pedido || null,
      produto_codigo: row.produto_codigo || null,
      produto_nome: row.produto_nome || 'Produto sem descricao',
      quantidade: row.quantidade || 0,
      valor_unitario: row.valor_unitario || 0,
      valor_total: row.valor_total || 0,
      vendedor_nome: normalizeVendor(row.vendedor_nome) || null,
      unidade: row.unidade || null,
      lote_serie: row.lote_serie || null,
      cfop: row.cfop || null,
      total_pedido: row.total_pedido || 0,
      km_extraido: veiculoRef?.km ?? row.km ?? null,
      veiculo_observacao: veiculoRef?.raw_vehicle_note || row.raw_vehicle_note || null,
      importacao_id: importacaoId,
      raw_data: row,
      chave_unica: row.chave_unica,
    })
  }

  for (const batch of chunks(payload, batchSize)) {
    const { error } = await supabase.from('vendas_itens').upsert(batch, { onConflict: 'chave_unica' })
    if (error) throw error
  }

  return { created: payload.length, ignored, conflitos }
}

async function upsertServicos(rows, clienteIndex, veiculoIndex, ordemIndex, importacaoId) {
  const payload = []
  let ignored = 0
  let conflitos = 0

  for (const row of rows) {
    const clienteId = resolveClienteId(clienteIndex, row)
    if (!clienteId || !row.data) {
      ignored += 1
      conflitos += 1
      continue
    }
    const veiculoRef = row.veiculo_ref
    payload.push({
      cliente_id: clienteId,
      ordem_id: ordemIndex.get(orderKey(row)) ?? null,
      veiculo_id: resolveVeiculoId(veiculoIndex, veiculoRef),
      codigo_cliente_erp: row.codigo_cliente_erp || null,
      data_servico: row.data,
      nota: row.nota || null,
      pedido: row.pedido || null,
      servico_codigo: row.produto_codigo || null,
      servico_nome: row.produto_nome || 'Servico sem descricao',
      quantidade: row.quantidade || 0,
      valor_unitario: row.valor_unitario || 0,
      valor_total: row.valor_total || 0,
      placa: veiculoRef?.placa || null,
      observacao: veiculoRef ? `Veiculo vinculado por ${veiculoRef.match}` : null,
      vendedor_nome: normalizeVendor(row.vendedor_nome) || null,
      unidade: row.unidade || null,
      lote_serie: row.lote_serie || null,
      cfop: row.cfop || null,
      total_pedido: row.total_pedido || 0,
      km_extraido: veiculoRef?.km ?? row.km ?? null,
      veiculo_observacao: veiculoRef?.raw_vehicle_note || row.raw_vehicle_note || null,
      importacao_id: importacaoId,
      raw_data: row,
      chave_unica: row.chave_unica,
    })
  }

  for (const batch of chunks(payload, batchSize)) {
    const { error } = await supabase.from('servicos_itens').upsert(batch, { onConflict: 'chave_unica' })
    if (error) throw error
  }

  return { created: payload.length, ignored, conflitos }
}

async function upsertCatalogo(rows, arquivos) {
  const deduped = dedupe(rows, (row) => `${row.tipo}|${row.codigo}`)
  const payload = deduped.map((row) => ({
    tipo: row.tipo,
    codigo: row.codigo,
    descricao: row.descricao,
    unidade: row.unidade || null,
    grupo: row.grupo || null,
    subgrupo: row.subgrupo || null,
    marca: inferMarca(row.descricao),
    raw_data: row.raw,
  }))

  for (const batch of chunks(payload, batchSize)) {
    const { error } = await supabase.from('catalogo_itens').upsert(batch, { onConflict: 'tipo,codigo' })
    if (error) throw error
  }

  const catalogIndex = new Map()
  for (const batch of chunks(payload.map((item) => item.codigo), 1000)) {
    const { data, error } = await supabase.from('catalogo_itens').select('id,tipo,codigo').in('codigo', batch)
    if (error) throw error
    data.forEach((item) => catalogIndex.set(`${item.tipo}|${item.codigo}`, item.id))
  }

  const pricePayload = deduped.flatMap((row) => {
    const id = catalogIndex.get(`${row.tipo}|${row.codigo}`)
    if (!id) return []
    return [{
      catalogo_item_id: id,
      valor: row.preco || 0,
      desconto_maximo: row.desconto_maximo || null,
      estoque: row.estoque || null,
      importacao_arquivo_id: arquivos.get(row.tipo === 'produto' ? 'precoprodutos' : 'precoservicos') ?? null,
      raw_data: row.raw,
    }]
  })

  const latestPrices = await fetchLatestCatalogPrices(Array.from(catalogIndex.values()))
  const changedPrices = pricePayload.filter((price) => {
    const latest = latestPrices.get(String(price.catalogo_item_id))
    if (!latest) return true
    return Number(latest.valor || 0) !== Number(price.valor || 0)
      || nullableNumber(latest.desconto_maximo) !== nullableNumber(price.desconto_maximo)
      || nullableNumber(latest.estoque) !== nullableNumber(price.estoque)
  })

  for (const batch of chunks(changedPrices, batchSize)) {
    const { error } = await supabase.from('catalogo_precos').upsert(batch, { onConflict: 'catalogo_item_id,vigencia_inicio,importacao_arquivo_id' })
    if (error) throw error
  }

  return {
    itens: payload.length,
    precos: changedPrices.length,
    precosNovos: changedPrices.filter((price) => !latestPrices.has(String(price.catalogo_item_id))).length,
    precosAlterados: changedPrices.filter((price) => latestPrices.has(String(price.catalogo_item_id))).length,
    precosInalterados: pricePayload.length - changedPrices.length,
  }
}

async function fetchLatestCatalogPrices(itemIds) {
  const latest = new Map()
  for (const batch of chunks(itemIds, 1000)) {
    const { data, error } = await supabase
      .from('catalogo_precos')
      .select('catalogo_item_id,valor,desconto_maximo,estoque,vigencia_inicio,criado_em')
      .in('catalogo_item_id', batch)
      .order('vigencia_inicio', { ascending: false })
      .order('criado_em', { ascending: false })
    if (error) throw error
    data.forEach((price) => {
      if (!latest.has(price.catalogo_item_id)) latest.set(price.catalogo_item_id, price)
    })
  }
  return latest
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === '') return null
  return Number(value)
}

async function finalizarImportacaoDiaria() {
  const { data, error } = await supabase.rpc('finalizar_importacao_diaria')
  if (error) throw error
  return data
}

async function createPgClient() {
  const pg = await import('pg')
  const dbUrl = process.env.SUPABASE_DB_DIRECT_URL || process.env.SUPABASE_DB_URL
  if (!dbUrl) throw new Error('Configure SUPABASE_DB_DIRECT_URL ou SUPABASE_DB_URL em .env.local.')
  const client = new pg.default.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  return client
}

async function updateImportacao(id, patch) {
  const { error } = await supabase.from('importacoes').update(patch).eq('id', id)
  if (error) throw error
}

function buildVehicleResolver(carRows) {
  const byPedido = new Map()
  const byNotaData = new Map()
  const byClienteData = new Map()

  for (const carro of carRows) {
    addUnique(byPedido, `${carro.codigo_cliente_erp}|${carro.pedido}`, carro)
    if (carro.nota) addUnique(byNotaData, `${carro.codigo_cliente_erp}|${carro.nota}|${carro.data_atendimento}`, carro)
    addUnique(byClienteData, `${carro.codigo_cliente_erp}|${carro.data_atendimento}`, carro)
  }

  return {
    resolve(row) {
      const byPedidoHit = uniqueValue(byPedido, `${row.codigo_cliente_erp}|${row.pedido}`)
      if (byPedidoHit) return { ...byPedidoHit, match: 'cliente+pedido' }
      const byNotaHit = uniqueValue(byNotaData, `${row.codigo_cliente_erp}|${row.nota}|${row.data}`)
      if (byNotaHit) return { ...byNotaHit, match: 'cliente+nota+data' }
      const byDateHit = uniqueValue(byClienteData, `${row.codigo_cliente_erp}|${row.data}`)
      if (byDateHit) return { ...byDateHit, match: 'cliente+data unica' }
      return null
    },
  }
}

function directVehicleRef(row) {
  if (!row.placa && !row.km && !row.veiculo_descricao) return null
  return {
    placa: row.placa || '',
    chassi: '',
    km: row.km ?? null,
    veiculo_nome: row.veiculo_descricao || '',
    veiculo_descricao: row.veiculo_descricao || '',
    raw_vehicle_note: row.raw_vehicle_note || '',
    codigo_cliente_erp: row.codigo_cliente_erp,
    data_atendimento: row.data,
    match: row.veiculo_match || 'observacao_movimento',
  }
}

function addUnique(map, key, value) {
  if (!key || key.includes('|undefined')) return
  const current = map.get(key) ?? []
  current.push(value)
  map.set(key, current)
}

function uniqueValue(map, key) {
  const values = map.get(key) ?? []
  return values.length === 1 ? values[0] : null
}

function resolveVeiculoId(index, ref) {
  if (!ref) return null
  return index.get(`placa:${ref.placa}`) || index.get(`chassi:${ref.chassi}`) || index.get(`desc:${ref.codigo_cliente_erp}|${normalizeKey(ref.veiculo_nome)}`) || null
}

function addVeiculoKeys(index, veiculo) {
  if (veiculo.placa) index.set(`placa:${veiculo.placa}`, veiculo.id)
  if (veiculo.chassi) index.set(`chassi:${veiculo.chassi}`, veiculo.id)
  if (veiculo.codigo_cliente_erp && veiculo.descricao) index.set(`desc:${veiculo.codigo_cliente_erp}|${normalizeKey(veiculo.descricao)}`, veiculo.id)
}

function resolveClienteId(index, row) {
  return index.get(`erp:${row.codigo_cliente_erp || row.codigo_erp}`) || index.get(`doc:${row.cpf_cnpj}`) || index.get(`nome:${normalizeKey(row.cliente_nome || row.nome)}`) || null
}

function inferOrigemBase(raw = {}, fallback = 'desconhecida') {
  const haystack = Object.values(raw).join(' ').toLowerCase()
  if (haystack.includes('rodobens')) return 'rodobens'
  if (haystack.includes('capital truck') || haystack.includes('capital service')) return 'capital_truck'
  return fallback
}

function inferOrigemDetalhe(raw = {}, fallback = '') {
  const haystack = Object.values(raw).join(' ').toLowerCase()
  if (haystack.includes('rodobens')) return 'Sinal Rodobens identificado no arquivo de referencia'
  return fallback
}

function addClienteKeys(index, cliente) {
  if (cliente.codigo_erp) index.set(`erp:${cliente.codigo_erp}`, cliente.id)
  if (cliente.cpf_cnpj) index.set(`doc:${cliente.cpf_cnpj}`, cliente.id)
  if (cliente.nome) index.set(`nome:${normalizeKey(cliente.nome)}`, cliente.id)
}

function orderKey(row) {
  return [row.tipo, row.codigo_cliente_erp, row.nota, row.pedido, row.data].join('|')
}

function splitVendor(value) {
  const raw = String(value || '').replace(/\([^)]*\)/g, '').trim()
  const match = raw.match(/^(\d+)\s+(.+)$/)
  return match ? { codigo: match[1], nome: match[2].trim() } : { codigo: '', nome: raw }
}

function normalizeVendor(value) {
  return splitVendor(value).nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

function normalizeKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function joinAddress(cliente) {
  return [cliente.endereco, cliente.numero].filter(Boolean).join(', ') || null
}

function inferMarca(descricao) {
  const normalized = normalizeKey(descricao)
  if (normalized.includes('michelin')) return 'MICHELIN'
  if (normalized.includes('bfg')) return 'BFGOODRICH'
  if (normalized.includes('dunlop')) return 'DUNLOP'
  return null
}

function dedupe(rows, keyFn) {
  const map = new Map()
  rows.forEach((row) => {
    const key = keyFn(row)
    if (key && !map.has(key)) map.set(key, row)
  })
  return [...map.values()]
}

function minDate(left, right) {
  if (!left) return right
  if (!right) return left
  return left < right ? left : right
}

function maxDate(left, right) {
  if (!left) return right
  if (!right) return left
  return left > right ? left : right
}

function hashFile(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.resolve(file))).digest('hex')
}

function take(items, max) {
  return max ? items.slice(0, max) : items
}

function chunks(items, size) {
  const output = []
  for (let index = 0; index < items.length; index += size) output.push(items.slice(index, index + size))
  return output
}

function loadEnvFile(fileName) {
  const envPath = path.resolve(fileName)
  if (!fs.existsSync(envPath)) return

  fs.readFileSync(envPath, 'utf8')
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
