import { servicosItens as mockServicos, vendasItens as mockVendas } from '../data/mockData'
import { getSupabase } from '../lib/supabase'
import type { ClienteVeiculoResumo, ServicoItem, VendaItem } from '../types'

type VendaRow = {
  id: string
  cliente_id: string
  veiculo_id: string | null
  ordem_id: string | null
  data_venda: string
  nota: string | null
  pedido: string | null
  produto_codigo: string | null
  produto_nome: string
  marca: string | null
  modelo: string | null
  medida: string | null
  quantidade: number
  valor_unitario: number
  valor_total: number
  km_extraido: number | null
  veiculo_observacao: string | null
  vendedor_nome: string | null
  unidade: string | null
}

type ServicoRow = {
  id: string
  cliente_id: string
  veiculo_id: string | null
  ordem_id: string | null
  data_servico: string
  pedido: string | null
  servico_codigo: string | null
  servico_nome: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  placa: string | null
  km_extraido: number | null
  veiculo_observacao: string | null
  observacao: string | null
  vendedor_nome: string | null
  unidade: string | null
}

type VeiculoRow = {
  id: string
  cliente_id: string | null
  placa: string | null
  chassi: string | null
  descricao: string | null
  ultimo_km: number | null
  km_atualizado_em: string | null
  primeiro_atendimento_em: string | null
  ultimo_atendimento_em: string | null
  total_atendimentos: number | null
  valor_total_atendimentos: number | null
  origem: string | null
}

export async function listVendasItens(): Promise<VendaItem[]> {
  const supabase = await getSupabase()
  if (!supabase) return mockVendas

  const data = await fetchAllPages<VendaRow>((from, to) =>
    supabase
      .from('vendas_itens')
      .select('*')
      .order('data_venda', { ascending: false })
      .range(from, to),
  )

  return data.map(mapVenda)
}

export async function listClienteVendasItens(clienteId: string): Promise<VendaItem[]> {
  const supabase = await getSupabase()
  if (!supabase) return mockVendas.filter((venda) => venda.clienteId === clienteId)

  const data = await fetchAllPages<VendaRow>((from, to) =>
    supabase
      .from('vendas_itens')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('data_venda', { ascending: false })
      .range(from, to),
  )

  return data.map(mapVenda)
}

export async function listServicosItens(): Promise<ServicoItem[]> {
  const supabase = await getSupabase()
  if (!supabase) return mockServicos

  const data = await fetchAllPages<ServicoRow>((from, to) =>
    supabase
      .from('servicos_itens')
      .select('*')
      .order('data_servico', { ascending: false })
      .range(from, to),
  )

  return data.map(mapServico)
}

export async function listClienteServicosItens(clienteId: string): Promise<ServicoItem[]> {
  const supabase = await getSupabase()
  if (!supabase) return mockServicos.filter((servico) => servico.clienteId === clienteId)

  const data = await fetchAllPages<ServicoRow>((from, to) =>
    supabase
      .from('servicos_itens')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('data_servico', { ascending: false })
      .range(from, to),
  )

  return data.map(mapServico)
}

export async function listClienteVeiculos(clienteId: string): Promise<ClienteVeiculoResumo[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('veiculos')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('ultimo_atendimento_em', { ascending: false, nullsFirst: false })
    .limit(200)

  if (error) throw error
  return (data as VeiculoRow[] | null ?? []).map(mapVeiculo)
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

function mapVenda(row: VendaRow): VendaItem {
  return {
    id: row.id,
    clienteId: row.cliente_id,
    veiculoId: row.veiculo_id ?? undefined,
    ordemId: row.ordem_id ?? undefined,
    dataVenda: row.data_venda,
    nota: row.nota ?? undefined,
    pedido: row.pedido ?? undefined,
    produtoCodigo: row.produto_codigo ?? undefined,
    produtoNome: row.produto_nome,
    marca: row.marca ?? undefined,
    modelo: row.modelo ?? undefined,
    medida: row.medida ?? undefined,
    quantidade: row.quantidade,
    valorUnitario: row.valor_unitario,
    valorTotal: row.valor_total,
    kmExtraido: row.km_extraido ?? undefined,
    veiculoObservacao: row.veiculo_observacao ?? undefined,
    vendedorNome: row.vendedor_nome ?? undefined,
    unidade: row.unidade ?? undefined,
  }
}

function mapServico(row: ServicoRow): ServicoItem {
  return {
    id: row.id,
    clienteId: row.cliente_id,
    veiculoId: row.veiculo_id ?? undefined,
    ordemId: row.ordem_id ?? undefined,
    dataServico: row.data_servico,
    pedido: row.pedido ?? undefined,
    servicoCodigo: row.servico_codigo ?? undefined,
    servicoNome: row.servico_nome,
    quantidade: row.quantidade,
    valorUnitario: row.valor_unitario,
    valorTotal: row.valor_total,
    placa: row.placa ?? undefined,
    kmExtraido: row.km_extraido ?? undefined,
    veiculoObservacao: row.veiculo_observacao ?? undefined,
    observacao: row.observacao ?? undefined,
    vendedorNome: row.vendedor_nome ?? undefined,
    unidade: row.unidade ?? undefined,
  }
}

function mapVeiculo(row: VeiculoRow): ClienteVeiculoResumo {
  return {
    id: row.id,
    clienteId: row.cliente_id ?? undefined,
    placa: row.placa ?? undefined,
    chassi: row.chassi ?? undefined,
    descricao: row.descricao ?? undefined,
    ultimoKm: row.ultimo_km ?? undefined,
    kmAtualizadoEm: row.km_atualizado_em ?? undefined,
    primeiroAtendimentoEm: row.primeiro_atendimento_em ?? undefined,
    ultimoAtendimentoEm: row.ultimo_atendimento_em ?? undefined,
    totalAtendimentos: row.total_atendimentos ?? 0,
    valorTotalAtendimentos: row.valor_total_atendimentos ?? 0,
    origem: row.origem ?? undefined,
  }
}
