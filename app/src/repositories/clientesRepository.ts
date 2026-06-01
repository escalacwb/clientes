import { clientes as mockClientes } from '../data/mockData'
import { getSupabase } from '../lib/supabase'
import type { CarteiraFiltro, Cliente, LeadQualificacaoStatus } from '../types'

type ClienteRow = {
  id: string
  codigo_erp: string | null
  cpf_cnpj: string | null
  nome: string
  nome_fantasia: string | null
  tipo_cliente: string | null
  cidade: string | null
  uf: string | null
  telefone_principal: string | null
  whatsapp_principal: string | null
  email: string | null
  responsavel_nome: string | null
  vendedor_id: string | null
  vendedor_codigo_erp: string | null
  vendedor_nome_erp: string | null
  status_comercial: string
  origem: string | null
  origem_base: Cliente['origemBase'] | null
  origem_detalhe: string | null
  lead_qualificacao_status: LeadQualificacaoStatus | null
  lead_qualificacao_observacao: string | null
  lead_qualificado_em: string | null
  primeira_compra_em: string | null
  ultima_compra_em: string | null
  ultimo_servico_em: string | null
  ultimo_contato_em: string | null
  proxima_acao_em: string | null
  total_comprado: number | null
  total_servicos: number | null
  score_oportunidade: number | null
  tags: string[] | null
  observacoes_comerciais: string | null
  users?: { nome: string | null } | null
}

export type ClientePageFilters = {
  query?: string
  origemBase?: Cliente['origemBase'] | 'todos'
  leadQualificacaoStatus?: LeadQualificacaoStatus | 'todos'
  filtro?: CarteiraFiltro
  vendedorId?: string
  vendedorHistoricoNome?: string
  cidade?: string
  uf?: string
  status?: Cliente['status'] | 'todos'
  clienteIds?: string[]
  diasSemCompraMin?: number
  diasSemContatoMin?: number
  valorMin?: number
  somenteComWhatsapp?: boolean
}

export type VendedorHistoricoResumo = {
  codigo: string
  nome: string
  clientes: number
  semResponsavel: number
  capitalTruck: number
  rodobens: number
  clientesRisco: number
  totalComprado: number
}

type VendedorHistoricoResumoRow = {
  vendedor_codigo_erp: string
  vendedor_nome_erp: string
  clientes: number
  sem_responsavel: number
  capital_truck: number
  rodobens: number
  clientes_risco: number
  total_comprado: number
}

interface ClienteQueryBuilder {
  eq: (column: string, value: unknown) => this
  ilike: (column: string, pattern: string) => this
  not: (column: string, operator: string, value: unknown) => this
  lte: (column: string, value: unknown) => this
  or: (filters: string) => this
  is: (column: string, value: unknown) => this
  in: (column: string, values: unknown[]) => this
  gte: (column: string, value: unknown) => this
}

export async function listClientes(): Promise<Cliente[]> {
  const supabase = await getSupabase()
  if (!supabase) return mockClientes

  const data = await fetchAllPages<ClienteRow>((from, to) =>
    supabase
      .from('clientes')
      .select('*,users!clientes_vendedor_id_fkey(nome)')
      .is('excluido_em', null)
      .order('nome', { ascending: true })
      .range(from, to),
  )

  return data.map(mapCliente)
}

export async function listClientesPage(input: {
  page: number
  pageSize: number
} & ClientePageFilters): Promise<{ clientes: Cliente[]; total: number }> {
  const supabase = await getSupabase()
  if (!supabase) {
    const filtered = filterMockClientes(mockClientes, input)
    return {
      clientes: filtered.slice((input.page - 1) * input.pageSize, input.page * input.pageSize),
      total: filtered.length,
    }
  }

  const from = (input.page - 1) * input.pageSize
  const to = from + input.pageSize - 1
  let query = supabase
    .from('clientes')
    .select('*,users!clientes_vendedor_id_fkey(nome)', { count: 'planned' })
    .is('excluido_em', null)

  query = applyClienteFilters(query, input)

  const { data, error, count } = await query
    .order('nome', { ascending: true })
    .range(from, to)

  if (error) throw error

  return {
    clientes: (data as ClienteRow[]).map(mapCliente),
    total: count ?? 0,
  }
}

export async function assignClientesVendedorByFilter(input: ClientePageFilters & { vendedorIdDestino: string }): Promise<number> {
  const supabase = await getSupabase()
  if (!supabase) return filterMockClientes(mockClientes, input).length

  let query = supabase
    .from('clientes')
    .update({ vendedor_id: input.vendedorIdDestino })
    .is('excluido_em', null)

  query = applyClienteFilters(query, input)

  const { data, error } = await query.select('id')
  if (error) throw error
  return data?.length ?? 0
}

export async function listVendedoresHistoricosResumo(): Promise<VendedorHistoricoResumo[]> {
  const supabase = await getSupabase()
  if (!supabase) return summarizeMockHistoricos()

  const { data, error } = await supabase
    .from('vw_vendedores_historicos_resumo')
    .select('*')
    .order('clientes', { ascending: false })
    .limit(50)

  if (error) throw error
  return (data as VendedorHistoricoResumoRow[] | null ?? []).map(mapVendedorHistoricoResumo)
}

export type RodobensFunilResumo = {
  status: LeadQualificacaoStatus
  total: number
  comWhatsapp: number
  comVendedor: number
}

type RodobensFunilResumoRow = {
  status: LeadQualificacaoStatus
  total: number
  com_whatsapp: number
  com_vendedor: number
}

export async function listRodobensLeads(input: {
  page: number
  pageSize: number
  query?: string
  status?: LeadQualificacaoStatus | 'todos'
}): Promise<{ clientes: Cliente[]; total: number }> {
  return listClientesPage({
    page: input.page,
    pageSize: input.pageSize,
    query: input.query,
    origemBase: 'rodobens',
    leadQualificacaoStatus: input.status,
  })
}

export async function listRodobensFunilResumo(): Promise<RodobensFunilResumo[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('vw_rodobens_funil')
    .select('*')

  if (error) throw error
  return (data as RodobensFunilResumoRow[] | null ?? []).map((row) => ({
    status: row.status,
    total: Number(row.total ?? 0),
    comWhatsapp: Number(row.com_whatsapp ?? 0),
    comVendedor: Number(row.com_vendedor ?? 0),
  }))
}

export async function assignClienteVendedor(clienteId: string, vendedorId: string): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase) return

  const { error } = await supabase
    .from('clientes')
    .update({ vendedor_id: vendedorId })
    .eq('id', clienteId)

  if (error) throw error
}

export async function assignClientesVendedor(clienteIds: string[], vendedorId: string): Promise<number> {
  const supabase = await getSupabase()
  if (!supabase) return clienteIds.length
  if (clienteIds.length === 0) return 0

  const { data, error } = await supabase
    .from('clientes')
    .update({ vendedor_id: vendedorId })
    .in('id', clienteIds)
    .select('id')

  if (error) throw error
  return data?.length ?? 0
}

export async function updateClienteComercial(
  clienteId: string,
  input: {
    telefone?: string
    whatsapp?: string
    responsavel?: string
  status?: string
  observacoes?: string
  optOutMotivo?: string
  optOutPor?: string
  },
): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase) return

  const { error } = await supabase
    .from('clientes')
    .update({
      telefone_principal: input.telefone,
      whatsapp_principal: input.whatsapp,
      responsavel_nome: input.responsavel,
      status_comercial: input.status ? toDbStatus(input.status) : undefined,
      observacoes_comerciais: input.observacoes,
      whatsapp_opt_out_motivo: input.optOutMotivo,
      whatsapp_opt_out_por: input.optOutPor,
      whatsapp_opt_out_em: input.optOutMotivo ? new Date().toISOString() : undefined,
    })
    .eq('id', clienteId)

  if (error) throw error
}

export async function updateRodobensQualificacao(
  clienteId: string,
  status: LeadQualificacaoStatus,
  observacao?: string,
): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase) return

  const patch: Record<string, unknown> = {
    lead_qualificacao_status: status,
    lead_qualificacao_observacao: observacao,
    lead_qualificado_em: ['qualificado', 'virou_cliente', 'descartado', 'nao_contatar'].includes(status) ? new Date().toISOString() : undefined,
  }

  if (status === 'virou_cliente') {
    patch.origem_base = 'capital_truck'
    patch.status_comercial = 'ativo'
    patch.tags = ['convertido_rodobens']
  }

  if (status === 'nao_contatar') patch.status_comercial = 'nao_contatar'
  if (status === 'contatado' || status === 'qualificado') patch.status_comercial = 'em_acompanhamento'

  const { error } = await supabase
    .from('clientes')
    .update(patch)
    .eq('id', clienteId)

  if (error) throw error
}

function toDbStatus(status: string) {
  const statuses: Record<string, string> = {
    Novo: 'novo',
    Ativo: 'ativo',
    'Em acompanhamento': 'em_acompanhamento',
    'Orcamento aberto': 'orcamento_aberto',
    Reativar: 'reativar',
    Inativo: 'inativo',
    'Nao contatar': 'nao_contatar',
  }
  return statuses[status] ?? status
}

function fromDbStatus(status: string): Cliente['status'] {
  const statuses: Record<string, Cliente['status']> = {
    novo: 'Novo',
    ativo: 'Ativo',
    em_acompanhamento: 'Em acompanhamento',
    orcamento_aberto: 'Orcamento aberto',
    reativar: 'Reativar',
    inativo: 'Inativo',
    nao_contatar: 'Nao contatar',
  }
  return statuses[status] ?? 'Novo'
}

function mapCliente(row: ClienteRow): Cliente {
  return {
    id: row.id,
    codigoErp: row.codigo_erp ?? '',
    cpfCnpj: row.cpf_cnpj ?? undefined,
    nome: row.nome,
    nomeFantasia: row.nome_fantasia ?? undefined,
    tipoCliente: row.tipo_cliente ?? 'Empresa',
    cidade: row.cidade ?? '',
    uf: row.uf ?? '',
    telefone: row.telefone_principal ?? undefined,
    whatsapp: row.whatsapp_principal ?? undefined,
    email: row.email ?? undefined,
    responsavel: row.responsavel_nome ?? undefined,
    vendedorId: row.vendedor_id ?? undefined,
    vendedorNome: row.users?.nome ?? undefined,
    vendedorHistoricoNome: row.vendedor_nome_erp ?? undefined,
    vendedorHistoricoCodigo: row.vendedor_codigo_erp ?? undefined,
    status: fromDbStatus(row.status_comercial),
    origem: row.origem ?? 'Supabase',
    origemBase: row.origem_base ?? 'desconhecida',
    origemDetalhe: row.origem_detalhe ?? undefined,
    leadQualificacaoStatus: row.lead_qualificacao_status ?? 'novo',
    leadQualificacaoObservacao: row.lead_qualificacao_observacao ?? undefined,
    leadQualificadoEm: row.lead_qualificado_em ?? undefined,
    primeiraCompraEm: row.primeira_compra_em ?? undefined,
    ultimaCompraEm: row.ultima_compra_em ?? undefined,
    ultimoServicoEm: row.ultimo_servico_em ?? undefined,
    ultimoContatoEm: row.ultimo_contato_em ?? undefined,
    proximaAcaoEm: row.proxima_acao_em ?? undefined,
    totalComprado: row.total_comprado ?? 0,
    totalServicos: row.total_servicos ?? 0,
    tags: row.tags ?? [],
    observacoes: row.observacoes_comerciais ?? undefined,
  }
}

async function fetchAllPages<T>(
  queryPage: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>,
): Promise<T[]> {
  const pageSize = 1000
  const rows: T[] = []

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await queryPage(from, from + pageSize - 1)
    if (error) throw error
    const page = (data ?? []) as T[]
    rows.push(...page)
    if (page.length < pageSize) return rows
  }
}

function origemBaseFromFiltro(filtro?: CarteiraFiltro): Cliente['origemBase'] | 'todos' | undefined {
  if (filtro === 'origem-capital') return 'capital_truck'
  if (filtro === 'origem-rodobens') return 'rodobens'
  if (filtro === 'origem-desconhecida') return 'desconhecida'
  return undefined
}

function applyClienteFiltro<T extends ClienteQueryBuilder>(query: T, filtro?: CarteiraFiltro): T {
  const today = '2026-05-28'
  const ninetyDaysAgo = '2026-02-27'
  const sixtyDaysAgo = '2026-03-29'

  switch (filtro) {
    case 'acao-hoje':
      return query.not('proxima_acao_em', 'is', null).lte('proxima_acao_em', today)
    case 'sem-compra-90':
      return query.or(`ultima_compra_em.is.null,ultima_compra_em.lt.${ninetyDaysAgo}`)
    case 'sem-contato-60':
      return query.or(`ultimo_contato_em.is.null,ultimo_contato_em.lt.${sixtyDaysAgo}`)
    case 'sem-whatsapp':
      return query.or('whatsapp_principal.is.null,whatsapp_principal.eq.')
    case 'sem-vendedor':
      return query.is('vendedor_id', null)
    case 'orcamento-aberto':
      return query.in('status_comercial', ['orcamento_aberto'])
    case 'alto-potencial':
      return query.gte('score_oportunidade', 60)
    default:
      return query
  }
}

function applyClienteFilters<T extends ClienteQueryBuilder>(query: T, input: ClientePageFilters): T {
  const origemBase = input.origemBase ?? origemBaseFromFiltro(input.filtro)
  let next = query
  if (origemBase && origemBase !== 'todos') next = next.eq('origem_base', origemBase)
  if (input.leadQualificacaoStatus && input.leadQualificacaoStatus !== 'todos') next = next.eq('lead_qualificacao_status', input.leadQualificacaoStatus)
  if (input.vendedorId) next = next.eq('vendedor_id', input.vendedorId)
  if (input.vendedorHistoricoNome?.trim()) next = next.ilike('vendedor_nome_erp', `%${input.vendedorHistoricoNome.trim()}%`)
  if (input.cidade?.trim()) next = next.ilike('cidade', `%${input.cidade.trim()}%`)
  if (input.uf?.trim()) next = next.ilike('uf', input.uf.trim())
  if (input.status && input.status !== 'todos') next = next.eq('status_comercial', toDbStatus(input.status))
  if (input.diasSemCompraMin && input.diasSemCompraMin > 0) next = next.or(`ultima_compra_em.is.null,ultima_compra_em.lt.${dateDaysAgo(input.diasSemCompraMin)}`)
  if (input.diasSemContatoMin && input.diasSemContatoMin > 0) next = next.or(`ultimo_contato_em.is.null,ultimo_contato_em.lt.${dateDaysAgo(input.diasSemContatoMin)}`)
  if (input.valorMin && input.valorMin > 0) next = next.gte('total_comprado', input.valorMin)
  if (input.somenteComWhatsapp) next = next.not('whatsapp_principal', 'is', null).not('whatsapp_principal', 'eq', '')
  if (input.clienteIds) next = input.clienteIds.length > 0 ? next.in('id', input.clienteIds) : next.in('id', ['00000000-0000-0000-0000-000000000000'])
  next = applyClienteFiltro(next, input.filtro)
  if (input.query?.trim()) {
    const term = `%${input.query.trim()}%`
    next = next.or(`nome.ilike.${term},cidade.ilike.${term},cpf_cnpj.ilike.${term},codigo_erp.ilike.${term}`)
  }
  return next
}

function dateDaysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

function mapVendedorHistoricoResumo(row: VendedorHistoricoResumoRow): VendedorHistoricoResumo {
  return {
    codigo: row.vendedor_codigo_erp,
    nome: row.vendedor_nome_erp,
    clientes: Number(row.clientes ?? 0),
    semResponsavel: Number(row.sem_responsavel ?? 0),
    capitalTruck: Number(row.capital_truck ?? 0),
    rodobens: Number(row.rodobens ?? 0),
    clientesRisco: Number(row.clientes_risco ?? 0),
    totalComprado: Number(row.total_comprado ?? 0),
  }
}

function summarizeMockHistoricos(): VendedorHistoricoResumo[] {
  const rows = new Map<string, VendedorHistoricoResumo>()
  mockClientes.forEach((cliente) => {
    const nome = cliente.vendedorHistoricoNome ?? cliente.vendedorNome ?? 'Nao informado'
    const current = rows.get(nome) ?? {
      codigo: cliente.vendedorHistoricoCodigo ?? 'sem_codigo',
      nome,
      clientes: 0,
      semResponsavel: 0,
      capitalTruck: 0,
      rodobens: 0,
      clientesRisco: 0,
      totalComprado: 0,
    }
    current.clientes += 1
    if (!cliente.vendedorId) current.semResponsavel += 1
    if (cliente.origemBase === 'capital_truck') current.capitalTruck += 1
    if (cliente.origemBase === 'rodobens') current.rodobens += 1
    if (daysSinceLocal(cliente.ultimaCompraEm) > 180) current.clientesRisco += 1
    current.totalComprado += cliente.totalComprado
    rows.set(nome, current)
  })
  return [...rows.values()].sort((a, b) => b.clientes - a.clientes)
}

function daysSinceLocal(date?: string) {
  if (!date) return 9999
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
}

function filterMockClientes(
  clientes: Cliente[],
  input: ClientePageFilters,
) {
  const term = input.query?.trim().toLowerCase()
  const cidade = input.cidade?.trim().toLowerCase()
  const uf = input.uf?.trim().toLowerCase()
  return clientes.filter((cliente) => {
    const origemBase = input.origemBase ?? origemBaseFromFiltro(input.filtro)
    if (origemBase && origemBase !== 'todos' && cliente.origemBase !== origemBase) return false
    if (input.vendedorId && cliente.vendedorId !== input.vendedorId) return false
    if (input.vendedorHistoricoNome && cliente.vendedorHistoricoNome !== input.vendedorHistoricoNome) return false
    if (cidade && !cliente.cidade.toLowerCase().includes(cidade)) return false
    if (uf && cliente.uf.toLowerCase() !== uf) return false
    if (input.status && input.status !== 'todos' && cliente.status !== input.status) return false
    if (input.diasSemCompraMin && daysSinceLocal(cliente.ultimaCompraEm) < input.diasSemCompraMin) return false
    if (input.diasSemContatoMin && daysSinceLocal(cliente.ultimoContatoEm) < input.diasSemContatoMin) return false
    if (input.valorMin && cliente.totalComprado < input.valorMin) return false
    if (input.somenteComWhatsapp && !cliente.whatsapp) return false
    if (input.clienteIds && !input.clienteIds.includes(cliente.id)) return false
    if (!term) return true
    return `${cliente.nome} ${cliente.cidade} ${cliente.cpfCnpj ?? ''} ${cliente.codigoErp}`.toLowerCase().includes(term)
  })
}
