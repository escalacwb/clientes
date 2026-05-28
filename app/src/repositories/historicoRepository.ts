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

  const { data, error } = await supabase
    .from('vendas_itens')
    .select('*')
    .order('data_venda', { ascending: false })
    .limit(1000)

  if (error) throw error

  return (data as VendaRow[]).map(mapVenda)
}

export async function listServicosItens(): Promise<ServicoItem[]> {
  const supabase = await getSupabase()
  if (!supabase) return mockServicos

  const { data, error } = await supabase
    .from('servicos_itens')
    .select('*')
    .order('data_servico', { ascending: false })
    .limit(1000)

  if (error) throw error

  return (data as ServicoRow[]).map(mapServico)
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
