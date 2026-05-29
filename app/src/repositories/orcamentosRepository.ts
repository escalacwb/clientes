import { orcamentoItens as mockOrcamentoItens, orcamentos as mockOrcamentos } from '../data/mockData'
import { getSupabase } from '../lib/supabase'
import type { Orcamento, OrcamentoInput, OrcamentoItem, OrcamentoItemInput } from '../types'

type OrcamentoRow = {
  id: string
  cliente_id: string
  vendedor_id: string
  data_orcamento: string
  status: Orcamento['status']
  valor_total: number
  validade: string
  previsao_fechamento: string | null
  forma_pagamento: string | null
  motivo_perda: string | null
  aprovacao_motivo: string | null
  aprovado_por: string | null
  aprovado_em: string | null
  observacao: string | null
}

type OrcamentoItemRow = {
  id: string
  orcamento_id: string
  catalogo_item_id: string | null
  codigo: string | null
  descricao: string
  tipo: OrcamentoItem['tipo']
  quantidade: number
  valor_unitario: number
  valor_total: number
  desconto_percentual: number | null
  observacao: string | null
}

export async function listOrcamentos(): Promise<Orcamento[]> {
  const supabase = await getSupabase()
  if (!supabase) return attachMockItems(mockOrcamentos)

  const { data, error } = await supabase
    .from('orcamentos')
    .select('*')
    .order('data_orcamento', { ascending: false })

  if (error) throw error

  const orcamentos = (data as OrcamentoRow[]).map(mapOrcamento)
  const itens = await listOrcamentoItens(orcamentos.map((orcamento) => orcamento.id))

  return orcamentos.map((orcamento) => ({
    ...orcamento,
    itens: itens.filter((item) => item.orcamentoId === orcamento.id),
  }))
}

export async function createOrcamento(input: OrcamentoInput, itens: OrcamentoItemInput[] = []): Promise<Orcamento> {
  const supabase = await getSupabase()
  if (!supabase) {
    const id = `o-${Date.now()}`
    const createdItems = itens.map((item, index) => ({
      id: `oi-${Date.now()}-${index}`,
      orcamentoId: id,
      descricao: item.descricao,
      tipo: item.tipo,
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario,
      valorTotal: item.valorTotal ?? item.quantidade * item.valorUnitario,
      observacao: item.observacao,
    }))

    return {
      id,
      data: input.data ?? new Date().toISOString().slice(0, 10),
      status: input.status ?? 'aberto',
      ...input,
      itens: createdItems,
    }
  }

  const { data, error } = await supabase
    .from('orcamentos')
    .insert({
      cliente_id: input.clienteId,
      vendedor_id: input.vendedorId,
      data_orcamento: input.data ?? new Date().toISOString().slice(0, 10),
      status: input.status ?? 'aberto',
      valor_total: input.valorTotal,
      validade: input.validade,
      previsao_fechamento: input.previsaoFechamento ?? null,
      forma_pagamento: input.formaPagamento ?? null,
      motivo_perda: input.motivoPerda ?? null,
      aprovacao_motivo: input.aprovacaoMotivo ?? null,
      aprovado_por: input.aprovadoPor ?? null,
      aprovado_em: input.aprovadoEm ?? null,
      observacao: input.observacao ?? null,
    })
    .select('*')
    .single()

  if (error) throw error

  const orcamento = mapOrcamento(data as OrcamentoRow)

  if (itens.length > 0) {
    const createdItems = await createOrcamentoItens(orcamento.id, itens)
    return { ...orcamento, itens: createdItems }
  }

  return orcamento
}

export async function updateOrcamentoStatus(
  id: string,
  status: Orcamento['status'],
  motivoPerda?: string,
  aprovadoPor?: string,
): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase) return

  const patch: Record<string, string | null | undefined> = {
    status,
    motivo_perda: motivoPerda ?? null,
  }
  if (status === 'enviado' && aprovadoPor) {
    patch.aprovado_por = aprovadoPor
    patch.aprovado_em = new Date().toISOString()
  }

  const { error } = await supabase
    .from('orcamentos')
    .update(patch)
    .eq('id', id)

  if (error) throw error
}

async function listOrcamentoItens(orcamentoIds: string[]): Promise<OrcamentoItem[]> {
  const supabase = await getSupabase()
  if (!supabase) return mockOrcamentoItens
  if (orcamentoIds.length === 0) return []

  const { data, error } = await supabase
    .from('orcamento_itens')
    .select('*')
    .in('orcamento_id', orcamentoIds)

  if (error) throw error

  return (data as OrcamentoItemRow[]).map(mapOrcamentoItem)
}

async function createOrcamentoItens(orcamentoId: string, itens: OrcamentoItemInput[]): Promise<OrcamentoItem[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('orcamento_itens')
    .insert(
      itens.map((item) => ({
        orcamento_id: orcamentoId,
        catalogo_item_id: item.catalogoItemId ?? null,
        codigo: item.codigo ?? null,
        descricao: item.descricao,
        tipo: item.tipo,
        quantidade: item.quantidade,
        valor_unitario: item.valorUnitario,
        valor_total: item.valorTotal ?? item.quantidade * item.valorUnitario,
        desconto_percentual: item.descontoPercentual ?? null,
        observacao: item.observacao ?? null,
      })),
    )
    .select('*')

  if (error) throw error

  return (data as OrcamentoItemRow[]).map(mapOrcamentoItem)
}

function mapOrcamento(row: OrcamentoRow): Orcamento {
  return {
    id: row.id,
    clienteId: row.cliente_id,
    vendedorId: row.vendedor_id,
    data: row.data_orcamento,
    status: row.status,
    valorTotal: row.valor_total,
    validade: row.validade,
    previsaoFechamento: row.previsao_fechamento ?? undefined,
    formaPagamento: row.forma_pagamento ?? undefined,
    motivoPerda: row.motivo_perda ?? undefined,
    aprovacaoMotivo: row.aprovacao_motivo ?? undefined,
    aprovadoPor: row.aprovado_por ?? undefined,
    aprovadoEm: row.aprovado_em ?? undefined,
    observacao: row.observacao ?? undefined,
  }
}

function mapOrcamentoItem(row: OrcamentoItemRow): OrcamentoItem {
  return {
    id: row.id,
    orcamentoId: row.orcamento_id,
    catalogoItemId: row.catalogo_item_id ?? undefined,
    codigo: row.codigo ?? undefined,
    descricao: row.descricao,
    tipo: row.tipo,
    quantidade: row.quantidade,
    valorUnitario: row.valor_unitario,
    valorTotal: row.valor_total,
    descontoPercentual: row.desconto_percentual ?? undefined,
    observacao: row.observacao ?? undefined,
  }
}

function attachMockItems(orcamentos: Orcamento[]): Orcamento[] {
  return orcamentos.map((orcamento) => ({
    ...orcamento,
    itens: mockOrcamentoItens.filter((item) => item.orcamentoId === orcamento.id),
  }))
}
