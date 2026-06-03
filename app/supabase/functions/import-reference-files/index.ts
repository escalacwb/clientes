import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1'

type ReferenceKind =
  | 'carrosatendidos'
  | 'listaclientessistema'
  | 'vendasprodutos'
  | 'vendasservicos'
  | 'precoprodutos'
  | 'precoservicos'

type ClienteRow = {
  codigo_erp: string
  nome: string
  nome_fantasia: string
  vendedor_nome: string
  canal_venda: string
  cidade: string
  uf: string
  telefone_principal: string
  cpf_cnpj: string
  email: string
  email_comercial: string
  tipo_cliente: string
  raw: Record<string, string>
}

type CarroRow = {
  pedido: string
  nota: string
  data_atendimento: string
  veiculo_nome: string
  placa: string
  chassi: string
  km: number | null
  codigo_cliente_erp: string
  cliente_nome: string
  valor: number
  raw: Record<string, string>
  origem?: string
}

type MovimentoRow = {
  tipo: 'produto' | 'servico'
  codigo_cliente_erp: string
  cpf_cnpj: string
  cliente_nome: string
  telefone_principal?: string
  data: string
  nota: string
  pedido: string
  cfop: string
  vendedor_nome: string
  unidade: string
  produto_codigo: string
  produto_nome: string
  lote_serie: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  total_pedido: number
  placa?: string
  km?: number | null
  veiculo_descricao?: string
  raw_vehicle_note?: string
  veiculo_match?: string
  veiculo_ref?: VehicleRef | null
  chave_unica: string
}

type VehicleRef = {
  placa: string
  chassi: string
  km: number | null
  veiculo_nome: string
  raw_vehicle_note?: string
  codigo_cliente_erp: string
  data_atendimento?: string
  match: string
}

type CatalogRow = {
  tipo: 'produto' | 'servico'
  codigo: string
  descricao: string
  unidade: string
  estoque: number
  preco: number
  desconto_maximo: number
  grupo: string
  subgrupo: string
  raw: Record<string, string>
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return json({ ok: true })
  if (request.method !== 'POST') return json({ error: 'Metodo nao permitido.' }, 405)

  let activeImportacaoId = ''
  let service: ReturnType<typeof createClient> | null = null
  try {
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) return json({ error: 'Sessao ausente.' }, 401)

    const supabaseUrl = requiredEnv('SUPABASE_URL')
    const serviceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    service = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    await assertAdmin(token, service)

    const form = await request.formData()
    const files = form.getAll('files').filter((item): item is File => item instanceof File)
    if (!files.length) return json({ error: 'Nenhum arquivo enviado.' }, 400)
    const mode = String(form.get('mode') ?? 'daily')

    const parsed = await parseFiles(files)
    if (mode === 'catalogo-precos') {
      const catalogRows = [...parsed.precosProdutos, ...parsed.precosServicos]
      if (!catalogRows.length) return json({ error: 'Nenhum produto ou servico com preco foi reconhecido.' }, 400)

      const importacao = await createCatalogImportacao(service, parsed, catalogRows)
      activeImportacaoId = importacao.id
      const arquivos = await registerFiles(service, importacao.id, parsed)
      const catalogo = await upsertCatalogo(service, catalogRows, arquivos)

      await service
        .from('importacoes')
        .update({
          total_linhas: catalogRows.length,
          clientes_encontrados: 0,
          clientes_criados: 0,
          conflitos: 0,
          itens_criados: catalogo.precosNovos + catalogo.precosAlterados,
          itens_ignorados: catalogo.precosInalterados,
          status: 'processada',
        })
        .eq('id', importacao.id)

      return json({
        ok: true,
        importacaoId: importacao.id,
        clientes: 0,
        veiculos: 0,
        ordens: 0,
        vendas: { created: 0, ignored: 0, conflitos: 0 },
        servicos: { created: 0, ignored: 0, conflitos: 0 },
        catalogo,
        movimentosComVeiculo: 0,
        movimentosSemVeiculo: 0,
      })
    }

    const missing = ['carrosatendidos', 'listaclientessistema', 'vendasprodutos', 'vendasservicos']
      .filter((kind) => !parsed.files.has(kind as ReferenceKind))
    if (missing.length) return json({ error: `Arquivos obrigatorios ausentes: ${missing.join(', ')}.` }, 400)

    const movimentos = [...parsed.vendasProdutos, ...parsed.vendasServicos]
    const clientesImportacao = buildClientesImportacao(parsed.clientes, movimentos, parsed.carros)
    const resolver = buildVehicleResolver(parsed.carros)
    const movimentosComVeiculo = movimentos.map((movimento) => ({
      ...movimento,
      veiculo_ref: directVehicleRef(movimento) || resolver.resolve(movimento),
    }))
    const vehicleRows = [
      ...parsed.carros,
      ...movimentosComVeiculo
        .filter((row) => row.veiculo_ref)
        .map((row) => ({
          pedido: row.pedido,
          nota: row.nota,
          data_atendimento: row.data,
          veiculo_nome: row.veiculo_ref?.veiculo_nome || row.veiculo_descricao || '',
          placa: row.veiculo_ref?.placa || '',
          chassi: row.veiculo_ref?.chassi || '',
          km: row.veiculo_ref?.km ?? row.km ?? null,
          codigo_cliente_erp: row.codigo_cliente_erp,
          cliente_nome: row.cliente_nome,
          valor: row.valor_total || 0,
          raw: row as unknown as Record<string, string>,
          origem: row.veiculo_ref?.match || 'observacao_movimento',
        })),
    ]

    const importacao = await createImportacao(service, parsed, movimentosComVeiculo)
    activeImportacaoId = importacao.id
    const arquivos = await registerFiles(service, importacao.id, parsed)
    const appUsers = await fetchAppUsers(service)
    const clienteIndex = await upsertClientes(service, clientesImportacao, appUsers)
    const veiculoIndex = await upsertVeiculos(service, vehicleRows, clienteIndex)
    const ordemIndex = await upsertOrdens(service, movimentosComVeiculo, clienteIndex, veiculoIndex, importacao.id)
    const vendas = await upsertVendas(service, movimentosComVeiculo.filter((item) => item.tipo === 'produto'), clienteIndex, veiculoIndex, ordemIndex, importacao.id)
    const servicos = await upsertServicos(service, movimentosComVeiculo.filter((item) => item.tipo === 'servico'), clienteIndex, veiculoIndex, ordemIndex, importacao.id)
    const catalogo = await upsertCatalogo(service, [...parsed.precosProdutos, ...parsed.precosServicos], arquivos)
    const postProcess = await finalizarImportacaoDiaria(service)

    await service
      .from('importacoes')
      .update({
        total_linhas: parsed.clientes.length + parsed.carros.length + movimentos.length + parsed.precosProdutos.length + parsed.precosServicos.length,
        clientes_encontrados: clientesImportacao.length,
        clientes_criados: clienteIndex.size,
        conflitos: vendas.conflitos + servicos.conflitos,
        itens_criados: vendas.created + servicos.created,
        itens_ignorados: vendas.ignored + servicos.ignored,
        status: vendas.conflitos + servicos.conflitos ? 'com_conflitos' : 'processada',
      })
      .eq('id', importacao.id)

    return json({
      ok: true,
      importacaoId: importacao.id,
      clientes: clientesImportacao.length,
      veiculos: veiculoIndex.size,
      ordens: ordemIndex.size,
      vendas,
      servicos,
      catalogo,
      postProcess,
      movimentosComVeiculo: movimentosComVeiculo.filter((item) => item.veiculo_ref).length,
      movimentosSemVeiculo: movimentosComVeiculo.filter((item) => !item.veiculo_ref).length,
    })
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    if (activeImportacaoId && service) {
      await service
        .from('importacoes')
        .update({
          status: 'erro',
        })
        .eq('id', activeImportacaoId)
    }
    return json({ error: error instanceof Error ? error.message : 'Erro inesperado na importacao.' }, status)
  }
})

async function assertAdmin(token: string, service: ReturnType<typeof createClient>) {
  const { data: authData, error: authError } = await service.auth.getUser(token)
  if (authError || !authData.user) throw new HttpError('Sessao invalida.', 401)

  const { data, error } = await service
    .from('users')
    .select('role,ativo')
    .eq('auth_user_id', authData.user.id)
    .maybeSingle()
  if (error) throw error
  if (!data?.ativo || data.role !== 'admin') throw new HttpError('Apenas administradores podem importar arquivos.', 403)
}

async function finalizarImportacaoDiaria(service: ReturnType<typeof createClient>) {
  const { data, error } = await service.rpc('finalizar_importacao_diaria')
  if (error) throw error
  return data as { clientes_atualizados?: number; oportunidades_geradas?: number }
}

async function parseFiles(files: File[]) {
  const parsed = {
    files: new Map<ReferenceKind, File>(),
    fileStats: new Map<ReferenceKind, { hash: string; totalRows: number }>(),
    clientes: [] as ClienteRow[],
    carros: [] as CarroRow[],
    vendasProdutos: [] as MovimentoRow[],
    vendasServicos: [] as MovimentoRow[],
    precosProdutos: [] as CatalogRow[],
    precosServicos: [] as CatalogRow[],
  }

  for (const file of files) {
    const kind = identifyFile(file.name)
    if (!kind) continue
    const buffer = await file.arrayBuffer()
    const rows = readHtmlRows(readLatin1(buffer))
    if (!matchesExpectedContent(kind, rows)) {
      throw new HttpError(`${file.name} tem nome de ${kind}, mas o cabecalho/conteudo nao bate com o modelo esperado.`, 400)
    }
    parsed.files.set(kind, file)
    parsed.fileStats.set(kind, { hash: await sha256(buffer), totalRows: rows.length })
    if (kind === 'listaclientessistema') parsed.clientes = parseClientes(rows)
    if (kind === 'carrosatendidos') parsed.carros = parseCarros(rows)
    if (kind === 'vendasprodutos') parsed.vendasProdutos = parseMovimento(rows, 'produto')
    if (kind === 'vendasservicos') parsed.vendasServicos = parseMovimento(rows, 'servico')
    if (kind === 'precoprodutos') parsed.precosProdutos = parseListaPreco(rows, 'produto')
    if (kind === 'precoservicos') parsed.precosServicos = parseListaPreco(rows, 'servico')
  }

  return parsed
}

function readLatin1(buffer: ArrayBuffer) {
  return new TextDecoder('iso-8859-1').decode(buffer)
}

async function sha256(buffer: ArrayBuffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function identifyFile(fileName: string): ReferenceKind | null {
  const normalized = normalizeKey(fileName.replace(/\.[^.]+$/, ''))
  const aliases: Array<[ReferenceKind, string[]]> = [
    ['carrosatendidos', ['carrosatendidos']],
    ['listaclientessistema', ['listaclientessistema']],
    ['vendasprodutos', ['vendasprodutos']],
    ['vendasservicos', ['vendasservicos']],
    ['precoprodutos', ['precoprodutos', 'listaeprecoprodutos', 'listaprecoprodutos']],
    ['precoservicos', ['precoservicos', 'precosservicos', 'listaeprecoservicos', 'listaeprecoservicos', 'listaprecoservicos']],
  ]
  return aliases.find(([, names]) => names.some((name) => normalized.includes(normalizeKey(name))))?.[0] ?? null
}

function parseClientes(rows: string[][]): ClienteRow[] {
  const headerIndex = rows.findIndex((row) => normalize(row.join(' ')).includes('codigo nome fantasia vendedor'))
  if (headerIndex === -1) return []
  const headers = rows[headerIndex].map(normalizeHeader)
  return rows.slice(headerIndex + 1)
    .filter((row) => /^\d+$/.test(text(row[0])) && text(row[1]))
    .map((row) => objectFromRow(headers, row))
    .map((row) => ({
      codigo_erp: leftPad(row.codigo, 5),
      nome: text(row.nome),
      nome_fantasia: text(row.fantasia),
      vendedor_nome: text(row.vendedor),
      canal_venda: text(row.canal_de_venda),
      cidade: text(row.cidade),
      uf: text(row.uf),
      telefone_principal: normalizePhone(row.telefones),
      cpf_cnpj: onlyDigits(row.cpf_cnpj),
      email: lower(row.email),
      email_comercial: lower(row.email_comercial),
      tipo_cliente: text(row.tipo_de_cliente),
      raw: row,
    }))
}

function parseCarros(rows: string[][]): CarroRow[] {
  const headerIndex = rows.findIndex((row) => normalize(row.join(' ')).includes('item pedido nota data carro placa chassi cliente valor'))
  if (headerIndex === -1) return []
  const headers = rows[headerIndex].map(normalizeHeader)
  return rows.slice(headerIndex + 1)
    .filter((row) => /^\d+$/.test(text(row[0])) && toIsoDate(row[3]))
    .map((row) => objectFromRow(headers, row))
    .map((row) => {
      const cliente = splitCodigoNome(row.cliente)
      const vehicle = parseVehicleNote([row.carro, row.placa, row.chassi].join(' '))
      return {
        pedido: leftPad(row.pedido, 7),
        nota: leftPad(row.nota, 7),
        data_atendimento: toIsoDate(row.data),
        veiculo_nome: text(row.carro),
        placa: normalizePlate(row.placa),
        chassi: normalizeChassi(row.chassi),
        km: vehicle?.km ?? null,
        codigo_cliente_erp: cliente.codigo,
        cliente_nome: cliente.nome,
        valor: number(row.valor),
        raw: row,
      }
    })
}

function parseMovimento(rows: string[][], tipo: 'produto' | 'servico'): MovimentoRow[] {
  const items: MovimentoRow[] = []
  let cliente: { nome: string; codigo_erp: string; cpf_cnpj: string; telefone_principal: string } | null = null
  let movimento: Record<string, string | number | VehicleRef | null> | null = null
  let orderItems: MovimentoRow[] = []

  for (const row of rows) {
    const cells = row.map(text)
    const first = cells[0] ?? ''
    const normalized = normalize(cells.join(' '))
    if (normalized.includes('total geral')) break
    if (normalized.includes('emissao nota pedido') || normalized.includes('vendas por cliente')) continue
    if (normalized.includes('total do cliente') || normalized.includes('total da fazenda')) continue

    const clienteMatch = first.match(/^(.+?)\s+\((\d{1,8})\)\s+CPF\/CNPJ\s+([^ ]+)(?:\s+TEL\s*:\s*(.*))?$/i)
    if (clienteMatch) {
      cliente = {
        nome: text(clienteMatch[1]),
        codigo_erp: leftPad(clienteMatch[2], 5),
        cpf_cnpj: onlyDigits(clienteMatch[3]),
        telefone_principal: normalizePhone(clienteMatch[4] || ''),
      }
      movimento = null
      orderItems = []
      continue
    }

    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(first) && cells.length >= 9) {
      movimento = {
        data: toIsoDate(first),
        nota: leftPad(cells[1], 7),
        pedido: leftPad(cells[2], 7),
        cfop: cells[4],
        vendedor_nome: cells[7],
        total_pedido: number(cells[9]),
        unidade: cells[10] || '',
        vehicle_note: null,
      }
      orderItems = []
      continue
    }

    if (cliente && movimento && isVehicleNoteRow(cells)) {
      const note = parseVehicleNote(cells.join(' '))
      if (note) {
        movimento.vehicle_note = note as unknown as VehicleRef
        orderItems.forEach((item) => applyVehicleNote(item, note))
      }
      continue
    }

    if (!cliente || !movimento || !/^\d+$/.test(first) || cells.length < 7) continue
    if (!isMovementItemDataRow(cells)) continue
    const item: MovimentoRow = {
      tipo,
      codigo_cliente_erp: cliente.codigo_erp,
      cpf_cnpj: cliente.cpf_cnpj,
      cliente_nome: cliente.nome,
      telefone_principal: cliente.telefone_principal,
      data: String(movimento.data),
      nota: String(movimento.nota),
      pedido: String(movimento.pedido),
      cfop: cells[4] || String(movimento.cfop),
      vendedor_nome: String(movimento.vendedor_nome),
      unidade: String(movimento.unidade),
      produto_codigo: leftPad(first, 9),
      produto_nome: cells[1],
      lote_serie: cells[3] || '',
      quantidade: number(cells[5]),
      valor_unitario: number(cells[6]),
      valor_total: number(cells[7]),
      total_pedido: Number(movimento.total_pedido),
      chave_unica: [tipo, String(movimento.nota), String(movimento.pedido), cliente.codigo_erp, leftPad(first, 9), String(movimento.data), number(cells[5]), number(cells[7])].join('|'),
    }
    if (movimento.vehicle_note) applyVehicleNote(item, movimento.vehicle_note as unknown as ReturnType<typeof parseVehicleNote>)
    items.push(item)
    orderItems.push(item)
  }
  return items
}

function matchesExpectedContent(kind: ReferenceKind, rows: string[][]) {
  const normalizedRows = rows.map((row) => normalizeKey(row.join(' ')))
  if (kind === 'listaclientessistema') return normalizedRows.some((row) => row.includes('itemcodigonomefantasiavendedor'))
  if (kind === 'carrosatendidos') return normalizedRows.some((row) => row.includes('itempedidonotadatacarroplacachassiclientevalor'))
  if (kind === 'vendasprodutos' || kind === 'vendasservicos') {
    const hasMovementHeader = normalizedRows.some((row) => row.includes('emissaonotapedido') && row.includes('vendedor'))
    const hasClientGroups = rows.some((row) => /^.+?\s+\(\d{1,8}\)\s+CPF\/CNPJ/i.test(text(row[0])))
    return hasMovementHeader && hasClientGroups
  }
  if (kind === 'precoprodutos' || kind === 'precoservicos') {
    return normalizedRows.some((row) => row.includes('itemcodigodescricao') && row.includes('preco'))
  }
  return false
}

function isMovementItemDataRow(cells: string[]) {
  const quantity = number(cells[5])
  const unit = number(cells[6])
  const total = number(cells[7])
  if (!quantity || quantity < 0 || quantity > 10000) return false
  if (unit < 0 || total < 0) return false
  return unit > 0 || total > 0
}

function buildClientesImportacao(clientes: ClienteRow[], movimentos: MovimentoRow[], carros: CarroRow[]) {
  const byCodigo = new Map<string, ClienteRow>()
  const add = (row: ClienteRow, overwrite = false) => {
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

function parseListaPreco(rows: string[][], tipo: 'produto' | 'servico'): CatalogRow[] {
  const headerIndex = rows.findIndex((row) => normalize(row.join(' ')).includes('item codigo descricao') && normalize(row.join(' ')).includes('preco'))
  if (headerIndex === -1) return []
  const headers = rows[headerIndex].map(normalizeHeader)
  let grupo = ''
  let subgrupo = ''
  return rows.slice(headerIndex + 1).flatMap((row) => {
    const first = text(row[0])
    if (first.startsWith('GRUPO')) {
      grupo = first
      return []
    }
    if (first.startsWith('SUBGRUPO')) {
      subgrupo = first
      return []
    }
    if (!/^\d+$/.test(first)) return []
    const item = objectFromRow(headers, row)
    return [{
      tipo,
      codigo: leftPad(item.codigo, 9),
      descricao: text(item.descricao || item.descricao_),
      unidade: text(item.un),
      estoque: number(item.estoque),
      preco: number(item.preco),
      desconto_maximo: number(item.desconto),
      grupo,
      subgrupo,
      raw: item,
    }]
  })
}

async function createImportacao(service: ReturnType<typeof createClient>, parsed: Awaited<ReturnType<typeof parseFiles>>, movimentos: MovimentoRow[]) {
  const { data, error } = await service
    .from('importacoes')
    .insert({
      tipo: 'referencias-diarias',
      arquivo_nome: 'pacote importacao diaria',
      total_linhas: parsed.clientes.length + parsed.carros.length + movimentos.length,
      clientes_encontrados: parsed.clientes.length,
      status: 'processando',
    })
    .select('id')
    .single()
  if (error) throw error
  return data as { id: string }
}

async function createCatalogImportacao(service: ReturnType<typeof createClient>, parsed: Awaited<ReturnType<typeof parseFiles>>, catalogRows: CatalogRow[]) {
  const fileNames = [...parsed.files.values()].map((file) => file.name).join(' + ') || 'catalogo-precos'
  const { data, error } = await service
    .from('importacoes')
    .insert({
      tipo: 'catalogo-precos',
      arquivo_nome: fileNames,
      total_linhas: catalogRows.length,
      clientes_encontrados: 0,
      clientes_criados: 0,
      conflitos: 0,
      itens_criados: 0,
      itens_ignorados: 0,
      status: 'processando',
    })
    .select('id')
    .single()
  if (error) throw error
  return data as { id: string }
}

async function registerFiles(service: ReturnType<typeof createClient>, importacaoId: string, parsed: Awaited<ReturnType<typeof parseFiles>>) {
  const payload = [...parsed.files.entries()].map(([tipo, file]) => ({
    importacao_id: importacaoId,
    tipo,
    arquivo_nome: file.name,
    arquivo_hash: parsed.fileStats.get(tipo)?.hash ?? `${file.name}-${file.size}-${file.lastModified}`,
    obrigatorio: ['carrosatendidos', 'listaclientessistema', 'vendasprodutos', 'vendasservicos'].includes(tipo),
    total_linhas: parsed.fileStats.get(tipo)?.totalRows ?? 0,
    processado_em: new Date().toISOString(),
  }))
  await upsert(service, 'importacao_arquivos', payload, 'tipo,arquivo_hash')

  const hashes = payload.map((item) => item.arquivo_hash)
  const { data, error } = await service
    .from('importacao_arquivos')
    .select('id,tipo,arquivo_hash')
    .in('arquivo_hash', hashes)
  if (error) throw error
  return new Map((data ?? []).map((item: { id: string; tipo: ReferenceKind }) => [item.tipo, item.id]))
}

async function fetchAppUsers(service: ReturnType<typeof createClient>) {
  const { data, error } = await service.from('users').select('id,nome').eq('ativo', true)
  if (error) throw error
  return new Map((data ?? []).map((user: { id: string; nome: string }) => [normalizeVendor(user.nome), user.id]))
}

async function upsertClientes(service: ReturnType<typeof createClient>, rows: ClienteRow[], appUsers: Map<string, string>) {
  const payload = dedupe(rows, (row) => row.codigo_erp).map((cliente) => {
    const vendedor = splitVendor(cliente.vendedor_nome)
    return {
      codigo_erp: cliente.codigo_erp,
      cpf_cnpj: cliente.cpf_cnpj || null,
      nome: cliente.nome || cliente.nome_fantasia || 'Cliente sem nome',
      nome_fantasia: cliente.nome_fantasia || null,
      tipo_cliente: cliente.tipo_cliente || null,
      cidade: cliente.cidade || null,
      uf: cliente.uf || null,
      telefone_principal: cliente.telefone_principal || null,
      whatsapp_principal: cliente.telefone_principal || null,
      email: cliente.email || cliente.email_comercial || null,
      vendedor_id: appUsers.get(normalizeVendor(vendedor.nome)) ?? null,
      vendedor_codigo_erp: vendedor.codigo || null,
      vendedor_nome_erp: vendedor.nome || null,
      canal_venda: cliente.canal_venda || null,
      status_comercial: 'novo',
      origem: cliente.raw.origem_arquivo || 'listaclientessistema',
      origem_base: inferOrigemBase(cliente.raw, 'capital_truck'),
      origem_detalhe: inferOrigemDetalhe(cliente.raw, cliente.raw.origem_arquivo ? `Cadastro minimo criado por ${cliente.raw.origem_arquivo}` : 'Cadastro ERP Capital Truck Center'),
      raw_data: cliente.raw,
    }
  })
  await upsert(service, 'clientes', payload, 'codigo_erp')
  return fetchIndex(service, 'clientes', 'id,codigo_erp,cpf_cnpj,nome', 'codigo_erp', payload.map((item) => item.codigo_erp), addClienteKeys)
}

async function upsertVeiculos(service: ReturnType<typeof createClient>, rows: CarroRow[], clienteIndex: Map<string, string>) {
  const deduped = dedupe(rows.filter((row) => row.placa || row.chassi || row.veiculo_nome), (row) => row.placa || row.chassi || `${row.codigo_cliente_erp}|${normalizeKey(row.veiculo_nome)}`)
  const payload = deduped.map((row) => ({
    cliente_id: resolveClienteId(clienteIndex, row) || null,
    codigo_cliente_erp: row.codigo_cliente_erp || null,
    placa: row.placa || null,
    chassi: row.chassi || null,
    descricao: row.veiculo_nome || null,
    ultimo_km: row.km ?? null,
    km_atualizado_em: row.km ? row.data_atendimento : null,
    primeiro_atendimento_em: row.data_atendimento || null,
    ultimo_atendimento_em: row.data_atendimento || null,
    total_atendimentos: 1,
    valor_total_atendimentos: row.valor || 0,
    origem: row.origem || 'carrosatendidos',
    raw_data: row.raw,
  }))
  await upsert(service, 'veiculos', payload.filter((item) => item.placa), 'placa')
  await upsert(service, 'veiculos', payload.filter((item) => !item.placa && item.chassi), 'chassi')
  const index = new Map<string, string>()
  const plates = payload.map((item) => item.placa).filter(Boolean) as string[]
  for (const batch of chunks(plates, 800)) {
    const { data, error } = await service.from('veiculos').select('id,placa,chassi,codigo_cliente_erp,descricao').in('placa', batch)
    if (error) throw error
    ;(data ?? []).forEach((veiculo) => addVeiculoKeys(index, veiculo))
  }
  return index
}

async function upsertOrdens(service: ReturnType<typeof createClient>, rows: MovimentoRow[], clienteIndex: Map<string, string>, veiculoIndex: Map<string, string>, importacaoId: string) {
  const payload = dedupe(rows, orderKey).flatMap((row) => {
    const clienteId = resolveClienteId(clienteIndex, row)
    if (!clienteId) return []
    return [{
      tipo: row.tipo,
      cliente_id: clienteId,
      veiculo_id: resolveVeiculoId(veiculoIndex, row.veiculo_ref),
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
      veiculo_descricao_extraida: row.veiculo_ref?.veiculo_nome || row.veiculo_descricao || null,
      veiculo_observacao: row.veiculo_ref?.raw_vehicle_note || row.raw_vehicle_note || null,
      veiculo_match: row.veiculo_ref?.match || row.veiculo_match || null,
      origem_arquivo: row.tipo === 'produto' ? 'vendasprodutos' : 'vendasservicos',
      importacao_id: importacaoId,
      raw_data: row,
      chave_unica: orderKey(row),
    }]
  })
  await upsert(service, 'ordens_movimento', payload, 'chave_unica')
  return fetchIndex(service, 'ordens_movimento', 'id,chave_unica', 'chave_unica', payload.map((item) => item.chave_unica), (index, row) => index.set(`ordem:${row.chave_unica}`, row.id))
}

async function upsertVendas(service: ReturnType<typeof createClient>, rows: MovimentoRow[], clienteIndex: Map<string, string>, veiculoIndex: Map<string, string>, ordemIndex: Map<string, string>, importacaoId: string) {
  return upsertItens(service, 'vendas_itens', rows, clienteIndex, veiculoIndex, ordemIndex, importacaoId)
}

async function upsertServicos(service: ReturnType<typeof createClient>, rows: MovimentoRow[], clienteIndex: Map<string, string>, veiculoIndex: Map<string, string>, ordemIndex: Map<string, string>, importacaoId: string) {
  return upsertItens(service, 'servicos_itens', rows, clienteIndex, veiculoIndex, ordemIndex, importacaoId)
}

async function upsertItens(service: ReturnType<typeof createClient>, table: 'vendas_itens' | 'servicos_itens', rows: MovimentoRow[], clienteIndex: Map<string, string>, veiculoIndex: Map<string, string>, ordemIndex: Map<string, string>, importacaoId: string) {
  let ignored = 0
  const payload = rows.flatMap((row) => {
    const clienteId = resolveClienteId(clienteIndex, row)
    if (!clienteId || !row.data) {
      ignored += 1
      return []
    }
    const common = {
      cliente_id: clienteId,
      ordem_id: ordemIndex.get(`ordem:${orderKey(row)}`) ?? null,
      veiculo_id: resolveVeiculoId(veiculoIndex, row.veiculo_ref),
      codigo_cliente_erp: row.codigo_cliente_erp || null,
      nota: row.nota || null,
      pedido: row.pedido || null,
      quantidade: row.quantidade || 0,
      valor_unitario: row.valor_unitario || 0,
      valor_total: row.valor_total || 0,
      vendedor_nome: normalizeVendor(row.vendedor_nome) || null,
      unidade: row.unidade || null,
      lote_serie: row.lote_serie || null,
      cfop: row.cfop || null,
      total_pedido: row.total_pedido || 0,
      km_extraido: row.veiculo_ref?.km ?? row.km ?? null,
      veiculo_observacao: row.veiculo_ref?.raw_vehicle_note || row.raw_vehicle_note || null,
      importacao_id: importacaoId,
      raw_data: row,
      chave_unica: row.chave_unica,
    }
    if (table === 'vendas_itens') {
      return [{ ...common, data_venda: row.data, produto_codigo: row.produto_codigo, produto_nome: row.produto_nome || 'Produto sem descricao' }]
    }
    return [{ ...common, data_servico: row.data, servico_codigo: row.produto_codigo, servico_nome: row.produto_nome || 'Servico sem descricao', placa: row.veiculo_ref?.placa || null, observacao: row.veiculo_ref ? `Veiculo vinculado por ${row.veiculo_ref.match}` : null }]
  })
  await upsert(service, table, payload, 'chave_unica')
  return { created: payload.length, ignored, conflitos: ignored }
}

async function upsertCatalogo(service: ReturnType<typeof createClient>, rows: CatalogRow[], arquivos: Map<ReferenceKind, string>) {
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
  await upsert(service, 'catalogo_itens', payload, 'tipo,codigo')

  const catalogIndex = new Map<string, string>()
  for (const batch of chunks(payload.map((item) => item.codigo), 800)) {
    const { data, error } = await service.from('catalogo_itens').select('id,tipo,codigo').in('codigo', batch)
    if (error) throw error
    ;(data ?? []).forEach((item: { id: string; tipo: string; codigo: string }) => {
      catalogIndex.set(`${item.tipo}|${item.codigo}`, item.id)
    })
  }

  const pricePayload = deduped.flatMap((row) => {
    const catalogoItemId = catalogIndex.get(`${row.tipo}|${row.codigo}`)
    if (!catalogoItemId) return []
    return [{
      catalogo_item_id: catalogoItemId,
      valor: row.preco || 0,
      desconto_maximo: row.desconto_maximo || null,
      estoque: row.estoque || null,
      importacao_arquivo_id: arquivos.get(row.tipo === 'produto' ? 'precoprodutos' : 'precoservicos') ?? null,
      raw_data: row.raw,
    }]
  })
  const latestPrices = await fetchLatestCatalogPrices(service, Array.from(catalogIndex.values()))
  const changedPrices = pricePayload.filter((price) => {
    const latest = latestPrices.get(String(price.catalogo_item_id))
    if (!latest) return true
    return number(latest.valor) !== number(price.valor)
      || nullableNumber(latest.desconto_maximo) !== nullableNumber(price.desconto_maximo)
      || nullableNumber(latest.estoque) !== nullableNumber(price.estoque)
  })
  await upsert(service, 'catalogo_precos', changedPrices, 'catalogo_item_id,vigencia_inicio,importacao_arquivo_id')
  return {
    itens: payload.length,
    precos: changedPrices.length,
    precosNovos: changedPrices.filter((price) => !latestPrices.has(String(price.catalogo_item_id))).length,
    precosAlterados: changedPrices.filter((price) => latestPrices.has(String(price.catalogo_item_id))).length,
    precosInalterados: pricePayload.length - changedPrices.length,
  }
}

async function fetchLatestCatalogPrices(service: ReturnType<typeof createClient>, itemIds: string[]) {
  const latest = new Map<string, { valor: number; desconto_maximo: number | null; estoque: number | null }>()
  for (const batch of chunks(itemIds, 800)) {
    const { data, error } = await service
      .from('catalogo_precos')
      .select('catalogo_item_id,valor,desconto_maximo,estoque,vigencia_inicio,criado_em')
      .in('catalogo_item_id', batch)
      .order('vigencia_inicio', { ascending: false })
      .order('criado_em', { ascending: false })
    if (error) throw error
    ;(data ?? []).forEach((price: { catalogo_item_id: string; valor: number; desconto_maximo: number | null; estoque: number | null }) => {
      if (!latest.has(price.catalogo_item_id)) latest.set(price.catalogo_item_id, price)
    })
  }
  return latest
}

async function upsert(service: ReturnType<typeof createClient>, table: string, payload: Record<string, unknown>[], onConflict: string) {
  for (const batch of chunks(payload, 100)) {
    if (!batch.length) continue
    const { error } = await service.from(table).upsert(batch, { onConflict })
    if (error) throw error
  }
}

async function fetchIndex(service: ReturnType<typeof createClient>, table: string, columns: string, field: string, values: string[], add: (index: Map<string, string>, row: Record<string, string>) => void) {
  const index = new Map<string, string>()
  for (const batch of chunks(values.filter(Boolean), 800)) {
    const { data, error } = await service.from(table).select(columns).in(field, batch)
    if (error) throw error
    ;(data ?? []).forEach((row) => add(index, row as Record<string, string>))
  }
  return index
}

function buildVehicleResolver(carRows: CarroRow[]) {
  const byPedido = new Map<string, CarroRow[]>()
  const byNotaData = new Map<string, CarroRow[]>()
  const byClienteData = new Map<string, CarroRow[]>()
  carRows.forEach((carro) => {
    addUnique(byPedido, `${carro.codigo_cliente_erp}|${carro.pedido}`, carro)
    if (carro.nota) addUnique(byNotaData, `${carro.codigo_cliente_erp}|${carro.nota}|${carro.data_atendimento}`, carro)
    addUnique(byClienteData, `${carro.codigo_cliente_erp}|${carro.data_atendimento}`, carro)
  })
  return {
    resolve(row: MovimentoRow): VehicleRef | null {
      const byPedidoHit = uniqueValue(byPedido, `${row.codigo_cliente_erp}|${row.pedido}`)
      if (byPedidoHit) return { ...vehicleFromCar(byPedidoHit), match: 'cliente+pedido' }
      const byNotaHit = uniqueValue(byNotaData, `${row.codigo_cliente_erp}|${row.nota}|${row.data}`)
      if (byNotaHit) return { ...vehicleFromCar(byNotaHit), match: 'cliente+nota+data' }
      const byDateHit = uniqueValue(byClienteData, `${row.codigo_cliente_erp}|${row.data}`)
      if (byDateHit) return { ...vehicleFromCar(byDateHit), match: 'cliente+data unica' }
      return null
    },
  }
}

function vehicleFromCar(carro: CarroRow): Omit<VehicleRef, 'match'> {
  return { placa: carro.placa, chassi: carro.chassi, km: carro.km, veiculo_nome: carro.veiculo_nome, codigo_cliente_erp: carro.codigo_cliente_erp, data_atendimento: carro.data_atendimento }
}

function directVehicleRef(row: MovimentoRow): VehicleRef | null {
  if (!row.placa && !row.km && !row.veiculo_descricao) return null
  return { placa: row.placa || '', chassi: '', km: row.km ?? null, veiculo_nome: row.veiculo_descricao || '', raw_vehicle_note: row.raw_vehicle_note || '', codigo_cliente_erp: row.codigo_cliente_erp, data_atendimento: row.data, match: row.veiculo_match || 'observacao_movimento' }
}

function parseVehicleNote(value: string) {
  const raw = text(value)
  if (!raw) return null
  const upper = raw.toUpperCase().replace(/\s+/g, ' ').trim()
  const kmMatch = upper.match(/\bKMS?\s*[:\/-]?\s*([0-9][0-9.\s]{0,14})/)
  const km = kmMatch ? Number(kmMatch[1].replace(/\D/g, '')) : null
  const plateMatch = upper.match(/\bPLACA\s+([A-Z]{3})\s*-?\s*([0-9][A-Z0-9][0-9]{2}|[0-9]{4})\b/) || upper.match(/\b([A-Z]{3})\s*-?\s*([0-9][A-Z0-9][0-9]{2}|[0-9]{4})\b/)
  const placa = plateMatch ? normalizePlate(`${plateMatch[1]}${plateMatch[2]}`) : ''
  const veiculo_descricao = upper
    .replace(/\bPLACA\b/g, ' ')
    .replace(/\bKMS?\s*[:\/-]?\s*[0-9][0-9.\s]{0,14}/g, ' ')
    .replace(/[./-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!placa && !km && !veiculo_descricao) return null
  return { placa, km, veiculo_descricao, raw_vehicle_note: raw, match: 'observacao_movimento' }
}

function applyVehicleNote(item: MovimentoRow, note: NonNullable<ReturnType<typeof parseVehicleNote>>) {
  if (!item.placa && note.placa) item.placa = note.placa
  if (!item.km && note.km) item.km = note.km
  if (!item.veiculo_descricao && note.veiculo_descricao) item.veiculo_descricao = note.veiculo_descricao
  if (!item.raw_vehicle_note && note.raw_vehicle_note) item.raw_vehicle_note = note.raw_vehicle_note
  if (!item.veiculo_match && note.match) item.veiculo_match = note.match
}

function isVehicleNoteRow(cells: string[]) {
  if (cells.length > 4) return false
  const raw = cells.join(' ')
  const normalized = normalize(raw)
  if (!raw || normalized.includes('fazenda') || normalized.includes('total')) return false
  return /\bPLACA\b/i.test(raw) || /\bKMS?\s*[:\/-]?\s*\d/i.test(raw)
}

function addUnique<T>(map: Map<string, T[]>, key: string, value: T) {
  if (!key) return
  const current = map.get(key) ?? []
  current.push(value)
  map.set(key, current)
}

function uniqueValue<T>(map: Map<string, T[]>, key: string) {
  const values = map.get(key) ?? []
  return values.length === 1 ? values[0] : null
}

function resolveClienteId(index: Map<string, string>, row: { codigo_cliente_erp?: string; codigo_erp?: string; cpf_cnpj?: string; cliente_nome?: string; nome?: string }) {
  return index.get(`erp:${row.codigo_cliente_erp || row.codigo_erp}`) || index.get(`doc:${row.cpf_cnpj}`) || index.get(`nome:${normalizeKey(row.cliente_nome || row.nome || '')}`) || null
}

function inferOrigemBase(raw: Record<string, unknown> = {}, fallback = 'desconhecida') {
  const haystack = Object.values(raw).join(' ').toLowerCase()
  if (haystack.includes('rodobens')) return 'rodobens'
  if (haystack.includes('capital truck') || haystack.includes('capital service')) return 'capital_truck'
  return fallback
}

function inferOrigemDetalhe(raw: Record<string, unknown> = {}, fallback = '') {
  const haystack = Object.values(raw).join(' ').toLowerCase()
  if (haystack.includes('rodobens')) return 'Sinal Rodobens identificado no arquivo de referencia'
  return fallback
}

function addClienteKeys(index: Map<string, string>, cliente: Record<string, string>) {
  if (cliente.codigo_erp) index.set(`erp:${cliente.codigo_erp}`, cliente.id)
  if (cliente.cpf_cnpj) index.set(`doc:${cliente.cpf_cnpj}`, cliente.id)
  if (cliente.nome) index.set(`nome:${normalizeKey(cliente.nome)}`, cliente.id)
}

function resolveVeiculoId(index: Map<string, string>, ref?: VehicleRef | null) {
  if (!ref) return null
  return index.get(`placa:${ref.placa}`) || index.get(`chassi:${ref.chassi}`) || index.get(`desc:${ref.codigo_cliente_erp}|${normalizeKey(ref.veiculo_nome)}`) || null
}

function addVeiculoKeys(index: Map<string, string>, veiculo: Record<string, string>) {
  if (veiculo.placa) index.set(`placa:${veiculo.placa}`, veiculo.id)
  if (veiculo.chassi) index.set(`chassi:${veiculo.chassi}`, veiculo.id)
  if (veiculo.codigo_cliente_erp && veiculo.descricao) index.set(`desc:${veiculo.codigo_cliente_erp}|${normalizeKey(veiculo.descricao)}`, veiculo.id)
}

function orderKey(row: MovimentoRow) {
  return [row.tipo, row.codigo_cliente_erp, row.nota, row.pedido, row.data].join('|')
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

function objectFromRow(headers: string[], row: string[]) {
  return Object.fromEntries(headers.map((header, index) => [header, row[index] ?? '']))
}

function splitCodigoNome(value: string) {
  const raw = text(value)
  const match = raw.match(/^(\d{1,8})\s+(.+)$/)
  return match ? { codigo: leftPad(match[1], 5), nome: text(match[2]) } : { codigo: '', nome: raw }
}

function splitVendor(value: string) {
  const raw = String(value || '').replace(/\([^)]*\)/g, '').trim()
  const match = raw.match(/^(\d+)\s+(.+)$/)
  return match ? { codigo: match[1], nome: match[2].trim() } : { codigo: '', nome: raw }
}

function normalizeVendor(value: string) {
  return splitVendor(value).nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase()
}

function normalizeHeader(value: string) {
  return normalize(value).replace(/%/g, 'percentual').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

function normalize(value: string) {
  return text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function normalizeKey(value: string) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function normalizePlate(value: string) {
  return text(value).toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function normalizeChassi(value: string) {
  const cleaned = text(value).toUpperCase().replace(/\s+/g, '')
  if (!cleaned || cleaned.length !== 17 || cleaned.includes('KM') || cleaned.includes('SEM') || !/^[A-Z0-9]+$/.test(cleaned)) return ''
  return cleaned
}

function normalizePhone(value: string) {
  const digits = onlyDigits(value)
  return digits ? digits.startsWith('55') ? digits : `55${digits}` : ''
}

function onlyDigits(value: string) {
  return text(value).replace(/\D/g, '')
}

function lower(value: string) {
  return text(value).toLowerCase()
}

function leftPad(value: string, size: number) {
  const raw = text(value).replace(/\D/g, '')
  return raw ? raw.padStart(size, '0') : ''
}

function number(value: string | number) {
  if (typeof value === 'number') return value
  const raw = text(value)
  if (!raw) return 0
  const parsed = Number(raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw)
  return Number.isFinite(parsed) ? parsed : 0
}

function nullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  return number(value as string | number)
}

function toIsoDate(value: string) {
  const match = text(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!match) return ''
  return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
}

function inferMarca(descricao: string) {
  const normalized = normalizeKey(descricao)
  if (normalized.includes('michelin')) return 'MICHELIN'
  if (normalized.includes('bfg')) return 'BFGOODRICH'
  if (normalized.includes('dunlop')) return 'DUNLOP'
  return null
}

function dedupe<T>(rows: T[], keyFn: (row: T) => string) {
  const map = new Map<string, T>()
  rows.forEach((row) => {
    const key = keyFn(row)
    if (key && !map.has(key)) map.set(key, row)
  })
  return [...map.values()]
}

function chunks<T>(items: T[], size: number) {
  const output: T[][] = []
  for (let index = 0; index < items.length; index += size) output.push(items.slice(index, index + size))
  return output
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Variavel ${name} nao configurada.`)
  return value
}

class HttpError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

function text(value: unknown) {
  return value === null || value === undefined ? '' : String(value).trim()
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
