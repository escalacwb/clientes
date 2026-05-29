import { orcamentoItens as mockOrcamentoItens, orcamentos as mockOrcamentos } from '../data/mockData'
import { getSupabase } from '../lib/supabase'
import { syncPipelineFromOrcamento } from './pipelineRepository'
import { pauseActiveSequencesForClient } from './sequenciasRepository'
import type { Orcamento, OrcamentoAprovacao, OrcamentoCondicao, OrcamentoCondicaoInput, OrcamentoInput, OrcamentoItem, OrcamentoItemInput, OrcamentoVersao } from '../types'

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
  enviado_por: string | null
  enviado_em: string | null
  proximo_followup_em: string | null
  prazo_entrega: string | null
  prazo_execucao: string | null
  observacao: string | null
}

type OrcamentoItemRow = {
  id: string
  orcamento_id: string
  catalogo_item_id: string | null
  codigo: string | null
  descricao: string
  tipo: OrcamentoItem['tipo']
  apresentacao: OrcamentoItem['apresentacao'] | null
  quantidade: number
  valor_unitario: number
  valor_total: number
  desconto_percentual: number | null
  observacao: string | null
}

type OrcamentoCondicaoRow = {
  id: string
  orcamento_id: string
  label: string
  ajuste_percentual: number
  valor_total: number
  parcelas: number | null
  observacao: string | null
  ordem: number
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

type OrcamentoAprovacaoRow = {
  id: string
  orcamento_id: string
  acao: OrcamentoAprovacao['acao']
  motivo: string | null
  usuario_id: string | null
  users?: { nome: string | null } | null
  criado_em: string
  raw_data: Record<string, unknown> | null
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
  const condicoes = await listOrcamentoCondicoes(orcamentos.map((orcamento) => orcamento.id))

  return orcamentos.map((orcamento) => ({
    ...orcamento,
    itens: itens.filter((item) => item.orcamentoId === orcamento.id),
    condicoes: condicoes.filter((item) => item.orcamentoId === orcamento.id),
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
    .select('*,clientes(nome),users!orcamentos_vendedor_id_fkey(nome)', { count: 'exact' })
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
  const condicoes = await listOrcamentoCondicoes(orcamentos.map((orcamento) => orcamento.id))

  return {
    orcamentos: orcamentos.map((orcamento) => ({
      ...orcamento,
      itens: itens.filter((item) => item.orcamentoId === orcamento.id),
      condicoes: condicoes.filter((item) => item.orcamentoId === orcamento.id),
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

export async function listOrcamentoAprovacoes(orcamentoId: string): Promise<OrcamentoAprovacao[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('orcamento_aprovacoes')
    .select('*,users!orcamento_aprovacoes_usuario_id_fkey(nome)')
    .eq('orcamento_id', orcamentoId)
    .order('criado_em', { ascending: false })

  if (error) {
    console.warn('Nao foi possivel carregar aprovacoes do orcamento.', error.message)
    return []
  }

  return (data as OrcamentoAprovacaoRow[]).map(mapOrcamentoAprovacao)
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
      apresentacao: item.apresentacao ?? 'normal',
    }))

    return {
      id,
      data: input.data ?? new Date().toISOString().slice(0, 10),
      status: input.status ?? 'aberto',
      ...input,
      itens: createdItems,
      condicoes: input.condicoes?.map((condicao, index) => ({
        id: `oc-${Date.now()}-${index}`,
        orcamentoId: id,
        ...condicao,
      })),
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
      enviado_por: input.enviadoPor ?? null,
      enviado_em: input.enviadoEm ?? null,
      proximo_followup_em: input.proximoFollowupEm ?? null,
      prazo_entrega: input.prazoEntrega ?? null,
      prazo_execucao: input.prazoExecucao ?? null,
      observacao: input.observacao ?? null,
    })
    .select('*')
    .single()

  if (error) throw error

  const orcamento = mapOrcamento(data as OrcamentoRow)

  const createdItems = itens.length > 0 ? await createOrcamentoItens(orcamento.id, itens) : []
  const createdConditions = input.condicoes?.length ? await createOrcamentoCondicoes(orcamento.id, input.condicoes) : []
  const created = { ...orcamento, itens: createdItems, condicoes: createdConditions }

  await createOrcamentoVersao(created, {
    mensagem: input.versaoMensagem,
    origem: input.versaoOrigem,
  })
  if (created.status === 'aguardando_aprovacao') {
    await createOrcamentoAprovacao(created.id, 'solicitada', created.aprovacaoMotivo, input.vendedorId, {
      valorTotal: created.valorTotal,
    })
  }
  if (created.status === 'enviado') {
    await createOrcamentoAprovacao(created.id, 'enviada', 'Proposta criada e marcada como enviada.', input.enviadoPor ?? input.vendedorId, {
      valorTotal: created.valorTotal,
    })
  }
  await syncPipelineFromOrcamento(created)
  await pauseActiveSequencesForClient(created.clienteId, 'Orcamento criado para o cliente.')

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
        apresentacao: item.apresentacao ?? 'normal',
      })),
      condicoes: input.condicoes?.map((condicao, index) => ({
        id: `oc-rev-${Date.now()}-${index}`,
        orcamentoId: id,
        ...condicao,
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
      enviado_por: input.enviadoPor ?? null,
      enviado_em: input.enviadoEm ?? null,
      proximo_followup_em: input.proximoFollowupEm ?? null,
      prazo_entrega: input.prazoEntrega ?? null,
      prazo_execucao: input.prazoExecucao ?? null,
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
  const { error: conditionsDeleteError } = await supabase
    .from('orcamento_condicoes')
    .delete()
    .eq('orcamento_id', id)

  if (conditionsDeleteError) throw conditionsDeleteError

  const createdConditions = input.condicoes?.length ? await createOrcamentoCondicoes(id, input.condicoes) : []
  const revised = { ...orcamento, itens: createdItems, condicoes: createdConditions }

  await createOrcamentoVersao(revised, {
    mensagem: input.versaoMensagem,
    origem: input.versaoOrigem,
  })
  if (revised.status === 'aguardando_aprovacao') {
    await createOrcamentoAprovacao(revised.id, 'solicitada', revised.aprovacaoMotivo, input.vendedorId, {
      valorTotal: revised.valorTotal,
      origem: 'revisao',
    })
  }
  await syncPipelineFromOrcamento(revised)
  await pauseActiveSequencesForClient(revised.clienteId, 'Orcamento revisado para o cliente.')

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
  if (status === 'enviado') {
    patch.enviado_por = aprovadoPor ?? undefined
    patch.enviado_em = new Date().toISOString()
    patch.proximo_followup_em = nextBusinessDate(2)
  }

  const { error } = await supabase
    .from('orcamentos')
    .update(patch)
    .eq('id', id)

  if (error) throw error

  const { data: updated, error: fetchError } = await supabase
    .from('orcamentos')
    .select('*,clientes(nome),users!orcamentos_vendedor_id_fkey(nome)')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError
  const changed = mapOrcamento(updated as OrcamentoRow)
  if (status === 'enviado') {
    await createOrcamentoAprovacao(
      id,
      aprovadoPor ? 'aprovada' : 'enviada',
      aprovadoPor ? 'Aprovado e liberado para envio.' : 'Marcado como enviado.',
      aprovadoPor,
      { status },
    )
  }
  if (status === 'perdido' && motivoPerda?.startsWith('aprovacao_rejeitada:')) {
    await createOrcamentoAprovacao(id, 'rejeitada', motivoPerda.replace('aprovacao_rejeitada:', ''), aprovadoPor, { status })
  }
  await syncPipelineFromOrcamento(changed)
  if (status === 'ganho' || status === 'perdido') {
    await pauseActiveSequencesForClient(changed.clienteId, `Orcamento marcado como ${status}.`)
  }
}

export async function deleteOrcamento(id: string): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase) return

  const steps = [
    supabase.from('campanha_envios').update({ orcamento_id: null, virou_orcamento: false }).eq('orcamento_id', id),
    supabase.from('interacoes').update({ orcamento_id: null }).eq('orcamento_id', id),
    supabase.from('oportunidades').delete().eq('orcamento_id', id),
    supabase.from('orcamento_itens').delete().eq('orcamento_id', id),
    supabase.from('orcamento_condicoes').delete().eq('orcamento_id', id),
    supabase.from('orcamento_aprovacoes').delete().eq('orcamento_id', id),
    supabase.from('orcamento_versoes').delete().eq('orcamento_id', id),
    supabase.from('orcamentos').delete().eq('id', id),
  ]

  for (const step of steps) {
    const { error } = await step
    if (error) throw error
  }
}

async function createOrcamentoAprovacao(
  orcamentoId: string,
  acao: OrcamentoAprovacao['acao'],
  motivo?: string,
  usuarioId?: string,
  rawData: Record<string, unknown> = {},
): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase) return

  const { error } = await supabase
    .from('orcamento_aprovacoes')
    .insert({
      orcamento_id: orcamentoId,
      acao,
      motivo: motivo ?? null,
      usuario_id: usuarioId ?? null,
      raw_data: rawData,
    })

  if (error) {
    console.warn('Nao foi possivel registrar historico de aprovacao.', error.message)
  }
}

function nextBusinessDate(days: number) {
  const date = new Date()
  let remaining = days
  while (remaining > 0) {
    date.setDate(date.getDate() + 1)
    const weekday = date.getDay()
    if (weekday !== 0 && weekday !== 6) remaining -= 1
  }
  return date.toISOString().slice(0, 10)
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

async function listOrcamentoCondicoes(orcamentoIds: string[]): Promise<OrcamentoCondicao[]> {
  const supabase = await getSupabase()
  if (!supabase) return []
  if (orcamentoIds.length === 0) return []

  const { data, error } = await supabase
    .from('orcamento_condicoes')
    .select('*')
    .in('orcamento_id', orcamentoIds)
    .order('ordem', { ascending: true })

  if (error) throw error

  return (data as OrcamentoCondicaoRow[]).map(mapOrcamentoCondicao)
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
        apresentacao: item.apresentacao ?? 'normal',
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

async function createOrcamentoCondicoes(orcamentoId: string, condicoes: OrcamentoCondicaoInput[]): Promise<OrcamentoCondicao[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('orcamento_condicoes')
    .insert(
      condicoes.map((condicao, index) => ({
        orcamento_id: orcamentoId,
        label: condicao.label,
        ajuste_percentual: condicao.ajustePercentual,
        valor_total: condicao.valorTotal,
        parcelas: condicao.parcelas ?? null,
        observacao: condicao.observacao ?? null,
        ordem: condicao.ordem ?? index,
      })),
    )
    .select('*')

  if (error) throw error

  return (data as OrcamentoCondicaoRow[]).map(mapOrcamentoCondicao)
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
    apresentacao: item.apresentacao,
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
    enviadoPor: row.enviado_por ?? undefined,
    enviadoEm: row.enviado_em ?? undefined,
    proximoFollowupEm: row.proximo_followup_em ?? undefined,
    prazoEntrega: row.prazo_entrega ?? undefined,
    prazoExecucao: row.prazo_execucao ?? undefined,
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
    apresentacao: row.apresentacao ?? 'normal',
    quantidade: row.quantidade,
    valorUnitario: row.valor_unitario,
    valorTotal: row.valor_total,
    descontoPercentual: row.desconto_percentual ?? undefined,
    observacao: row.observacao ?? undefined,
  }
}

function mapOrcamentoCondicao(row: OrcamentoCondicaoRow): OrcamentoCondicao {
  return {
    id: row.id,
    orcamentoId: row.orcamento_id,
    label: row.label,
    ajustePercentual: row.ajuste_percentual,
    valorTotal: row.valor_total,
    parcelas: row.parcelas ?? undefined,
    observacao: row.observacao ?? undefined,
    ordem: row.ordem,
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

function mapOrcamentoAprovacao(row: OrcamentoAprovacaoRow): OrcamentoAprovacao {
  return {
    id: row.id,
    orcamentoId: row.orcamento_id,
    acao: row.acao,
    motivo: row.motivo ?? undefined,
    usuarioId: row.usuario_id ?? undefined,
    usuarioNome: row.users?.nome ?? undefined,
    criadoEm: row.criado_em,
    rawData: row.raw_data ?? undefined,
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
