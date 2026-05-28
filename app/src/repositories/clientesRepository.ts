import { clientes as mockClientes } from '../data/mockData'
import { getSupabase } from '../lib/supabase'
import type { Cliente } from '../types'

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
