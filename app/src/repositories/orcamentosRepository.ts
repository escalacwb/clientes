import { orcamentoItens as mockOrcamentoItens, orcamentos as mockOrcamentos } from '../data/mockData'
import { getSupabase } from '../lib/supabase'
import type { Orcamento, OrcamentoInput, OrcamentoItem, OrcamentoItemInput, OrcamentoVersao } from '../types'

type OrcamentoRow = {
  id: string
  cliente_id: string
  clientes?: { nome: string | null } | null
  vendedor_id: string
  users?: { nome: string | null } | null
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

type OrcamentoVersaoRow = {
  id: string
  orcamento_id: string
  numero: number
  status: Orcamento['status']
  valor_total: number
  validade: string | null
  forma_pagamento: string | null
  observacao: string | null
  mensagem: string | null
  origem: string | null
  itens: OrcamentoItemInput[]
  criado_em: string
}

export type OrcamentoListFilter = Orcamento['status'] | 'todos' | 'vencidos'

export async function listOrcamentos(limit = 100): Promise<Orcamento[]> {
  const supabase = await getSupabase()
  if (!supabase) return attachMockItems(mockOrcamentos)

  const query = supabase
    .from('orcamentos')
    .select('*')
    .order('data_orcamento', { ascending: false })
    .limit(limit)

  const { data, error } = await query

  if (error) throw error

  const orcamentos = (data as OrcamentoRow[]).map(mapOrcamento)
  const itens = await listOrcamentoItens(orcamentos.map((orcamento) => orcamento.id))

  return orcamentos.map((orcamento) => ({
    ...orcamento,
    itens: itens.filter((item) => item.orcamentoId === orcamento.id),
  }))
}

export async function listOrcamentosPage(input: {
  page: number
  pageSize: number
  status?: OrcamentoListFilter
  vendedorId?: string
}): Promise<{ orcamentos: Orcamento[]; total: number }> {
  const supabase = await getSupabase()
  if (!supabase) {
    const filtered = filterMockOrcamentos(attachMockItems(mockOrcamentos), input.status, input.vendedorId)
    const from = (input.page - 1) * input.pageSize
    return {
      orcamentos: filtered.slice(from, from + input.pageSize),
      total: filtered.length,
    }
  }

  const from = (input.page - 1) * input.pageSize
  const to = from + input.pageSize - 1
  let query = supabase
    .from('orcamentos')
    .select('*,clientes(nome),users(nome)', { count: 'exact' })
    .order('data_orcamento', { ascending: false })
    .range(from, to)

  if (input.vendedorId) query = query.eq('vendedor_id', input.vendedorId)
  if (input.status && input.status !== 'todos' && input.status !== 'vencidos') {
    query = query.eq('status', input.status)
  }
  if (input.status === 'vencidos') {
    query = query
      .in('status', ['aberto', 'aguardando_aprovacao', 'enviado', 'negociando'])
      .lt('validade', new Date().toISOString().slice(0, 10))
  }

  const { data, error, count } = await query
  if (error) throw error

  const orcamentos = (data as OrcamentoRow[]).map(mapOrcamento)
  const itens = await listOrcamentoItens(orcamentos.map((orcamento) => orcamento.id))

  return {
    orcamentos: orcamentos.map((orcamento) => ({
      ...orcamento,
      itens: itens.filter((item) => item.orcamentoId === orcamento.id),
    })),
    total: count ?? orcamentos.length,
  }
}

export async function listOrcamentoVersoes(orcamentoId: string): Promise<OrcamentoVersao[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('orcamento_versoes')
    .select('*')
    .eq('orcamento_id', orcamentoId)
    .order('numero', { ascending: false })

  if (error) {
    console.warn('Nao foi possivel carregar versoes do orcamento.', error.message)
    return []
  }

  return (data as OrcamentoVersaoRow[]).map(mapOrcamentoVersao)
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

  const createdItems = itens.length > 0 ? await createOrcamentoItens(orcamento.id, itens) : []
  const created = { ...orcamento, itens: createdItems }

  await createOrcamentoVersao(created, {
    mensagem: input.versaoMensagem,
    origem: input.versaoOrigem,
  })

  return created
}

export async function reviseOrcamento(
  id: string,
  input: OrcamentoInput,
  itens: OrcamentoItemInput[] = [],
): Promise<Orcamento> {
  const supabase = await getSupabase()
  if (!supabase) {
    return {
      id,
      data: input.data ?? new Date().toISOString().slice(0, 10),
      status: input.status ?? 'aberto',
      ...input,
      itens: itens.map((item, index) => ({
        id: `oi-rev-${Date.now()}-${index}`,
        orcamentoId: id,
        descricao: item.descricao,
        tipo: item.tipo,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
        valorTotal: item.valorTotal ?? item.quantidade * item.valorUnitario,
        observacao: item.observacao,
      })),
    }
  }

  const { data, error } = await supabase
    .from('orcamentos')
    .update({
      cliente_id: input.clienteId,
      vendedor_id: input.vendedorId,
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
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error

  const orcamento = mapOrcamento(data as OrcamentoRow)
  const { error: deleteError } = await supabase
    .from('orcamento_itens')
    .delete()
    .eq('orcamento_id', id)

  if (deleteError) throw deleteError

  const createdItems = itens.length > 0 ? await createOrcamentoItens(id, itens) : []
  const revised = { ...orcamento, itens: createdItems }

  await createOrcamentoVersao(revised, {
    mensagem: input.versaoMensagem,
    origem: input.versaoOrigem,
  })

  return revised
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

async function createOrcamentoVersao(
  orcamento: Orcamento,
  metadata: { mensagem?: string; origem?: string } = {},
): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase) return

  const itensSnapshot = (orcamento.itens ?? []).map((item) => ({
    catalogoItemId: item.catalogoItemId,
    codigo: item.codigo,
    descricao: item.descricao,
    tipo: item.tipo,
    quantidade: item.quantidade,
    valorUnitario: item.valorUnitario,
    valorTotal: item.valorTotal,
    descontoPercentual: item.descontoPercentual,
    observacao: item.observacao,
  }))

  const { data: lastVersion } = await supabase
    .from('orcamento_versoes')
    .select('numero')
    .eq('orcamento_id', orcamento.id)
    .order('numero', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextVersion = Number(lastVersion?.numero ?? 0) + 1
  const { error } = await supabase
    .from('orcamento_versoes')
    .insert({
      orcamento_id: orcamento.id,
      numero: nextVersion,
      status: orcamento.status,
      valor_total: orcamento.valorTotal,
      validade: orcamento.validade ?? null,
      forma_pagamento: orcamento.formaPagamento ?? null,
      observacao: orcamento.observacao ?? null,
      mensagem: metadata.mensagem ?? null,
      origem: metadata.origem ?? null,
      itens: itensSnapshot,
    })

  if (error) {
    console.warn('Nao foi possivel registrar versao do orcamento.', error.message)
  }
}

function mapOrcamento(row: OrcamentoRow): Orcamento {
  return {
    id: row.id,
    clienteId: row.cliente_id,
    clienteNome: row.clientes?.nome ?? undefined,
    vendedorId: row.vendedor_id,
    vendedorNome: row.users?.nome ?? undefined,
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

function mapOrcamentoVersao(row: OrcamentoVersaoRow): OrcamentoVersao {
  return {
    id: row.id,
    orcamentoId: row.orcamento_id,
    numero: row.numero,
    status: row.status,
    valorTotal: row.valor_total,
    validade: row.validade ?? undefined,
    formaPagamento: row.forma_pagamento ?? undefined,
    observacao: row.observacao ?? undefined,
    mensagem: row.mensagem ?? undefined,
    origem: row.origem ?? undefined,
    itens: Array.isArray(row.itens) ? row.itens : [],
    criadoEm: row.criado_em,
  }
}

function attachMockItems(orcamentos: Orcamento[]): Orcamento[] {
  return orcamentos.map((orcamento) => ({
    ...orcamento,
    itens: mockOrcamentoItens.filter((item) => item.orcamentoId === orcamento.id),
  }))
}

function filterMockOrcamentos(
  orcamentos: Orcamento[],
  status: OrcamentoListFilter = 'todos',
  vendedorId?: string,
): Orcamento[] {
  const openStatuses: Orcamento['status'][] = ['aberto', 'aguardando_aprovacao', 'enviado', 'negociando']
  return orcamentos.filter((orcamento) => {
    if (vendedorId && orcamento.vendedorId !== vendedorId) return false
    if (status === 'todos') return true
    if (status === 'vencidos') return openStatuses.includes(orcamento.status) && new Date(orcamento.validade) < new Date()
    return orcamento.status === status
  })
}
