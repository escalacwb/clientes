import { servicosItens as mockServicos, vendasItens as mockVendas } from '../data/mockData'
import { getSupabase } from '../lib/supabase'
import type { ServicoItem, VendaItem } from '../types'

type VendaRow = {
  id: string
  cliente_id: string
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
  vendedor_nome: string | null
  unidade: string | null
}

type ServicoRow = {
  id: string
  cliente_id: string
  data_servico: string
  pedido: string | null
  servico_codigo: string | null
  servico_nome: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  placa: string | null
  observacao: string | null
  vendedor_nome: string | null
  unidade: string | null
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
    vendedorNome: row.vendedor_nome ?? undefined,
    unidade: row.unidade ?? undefined,
  }
}

function mapServico(row: ServicoRow): ServicoItem {
  return {
    id: row.id,
    clienteId: row.cliente_id,
    dataServico: row.data_servico,
    pedido: row.pedido ?? undefined,
    servicoCodigo: row.servico_codigo ?? undefined,
    servicoNome: row.servico_nome,
    quantidade: row.quantidade,
    valorUnitario: row.valor_unitario,
    valorTotal: row.valor_total,
    placa: row.placa ?? undefined,
    observacao: row.observacao ?? undefined,
    vendedorNome: row.vendedor_nome ?? undefined,
    unidade: row.unidade ?? undefined,
  }
}
