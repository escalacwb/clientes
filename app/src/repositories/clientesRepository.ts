import { clientes as mockClientes } from '../data/mockData'
import { getSupabase } from '../lib/supabase'
import type { CarteiraFiltro, Cliente } from '../types'

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
  status_comercial: string
  origem: string | null
  origem_base: Cliente['origemBase'] | null
  origem_detalhe: string | null
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

interface ClienteQueryBuilder {
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
      .select('*,users(nome)')
      .is('excluido_em', null)
      .order('nome', { ascending: true })
      .range(from, to),
  )

  return data.map(mapCliente)
}

export async function listClientesPage(input: {
  page: number
  pageSize: number
  query?: string
  origemBase?: Cliente['origemBase'] | 'todos'
  filtro?: CarteiraFiltro
  vendedorId?: string
}): Promise<{ clientes: Cliente[]; total: number }> {
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
    .select('*,users(nome)', { count: 'exact' })
    .is('excluido_em', null)

  const origemBase = input.origemBase ?? origemBaseFromFiltro(input.filtro)
  if (origemBase && origemBase !== 'todos') query = query.eq('origem_base', origemBase)
  if (input.vendedorId) query = query.eq('vendedor_id', input.vendedorId)
  query = applyClienteFiltro(query, input.filtro)
  if (input.query?.trim()) {
    const term = `%${input.query.trim()}%`
    query = query.or(`nome.ilike.${term},cidade.ilike.${term},cpf_cnpj.ilike.${term},codigo_erp.ilike.${term}`)
  }

  const { data, error, count } = await query
    .order('nome', { ascending: true })
    .range(from, to)

  if (error) throw error

  return {
    clientes: (data as ClienteRow[]).map(mapCliente),
    total: count ?? 0,
  }
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

export async function updateClienteComercial(
  clienteId: string,
  input: {
    telefone?: string
    whatsapp?: string
    responsavel?: string
    status?: string
    observacoes?: string
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
    })
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
    status: 'Novo',
    origem: row.origem ?? 'Supabase',
    origemBase: row.origem_base ?? 'desconhecida',
    origemDetalhe: row.origem_detalhe ?? undefined,
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

function filterMockClientes(
  clientes: Cliente[],
  input: { query?: string; origemBase?: Cliente['origemBase'] | 'todos'; filtro?: CarteiraFiltro; vendedorId?: string },
) {
  const term = input.query?.trim().toLowerCase()
  return clientes.filter((cliente) => {
    const origemBase = input.origemBase ?? origemBaseFromFiltro(input.filtro)
    if (origemBase && origemBase !== 'todos' && cliente.origemBase !== origemBase) return false
    if (input.vendedorId && cliente.vendedorId !== input.vendedorId) return false
    if (!term) return true
    return `${cliente.nome} ${cliente.cidade} ${cliente.cpfCnpj ?? ''} ${cliente.codigoErp}`.toLowerCase().includes(term)
  })
}
