import { getSupabase } from '../lib/supabase'
import type {
  ClienteContatoRecomendado,
  PatioAtendimentoItemResumo,
  PatioAtendimentoResumo,
  PatioFeedbackPendente,
  PatioFilaItem,
  PatioRevisaoProativa,
  PatioVeiculoBusca,
} from '../types'

type ContatoRow = {
  cliente_id: string
  contato_id: string | null
  nome: string | null
  tipo: string | null
  whatsapp: string | null
  email: string | null
  origem_sistema: string | null
  prioridade: number | null
  atualizado_em: string | null
}

type AtendimentoRow = {
  patio_execucao_id: number
  cliente_id: string | null
  veiculo_id: string | null
  placa_snapshot: string | null
  cliente_nome_snapshot: string | null
  quilometragem: number | null
  status: string | null
  inicio_execucao: string | null
  fim_execucao: string | null
  nome_motorista: string | null
  contato_motorista: string | null
  data_feedback: string | null
}

type AtendimentoItemRow = {
  id: string
  patio_execucao_id: number | null
  cliente_id: string | null
  veiculo_id: string | null
  area: PatioAtendimentoItemResumo['area']
  servico_nome: string | null
  descricao: string | null
  quantidade: number | null
  status: string | null
  quilometragem: number | null
  solicitado_em: string | null
  tipo_atendimento: string | null
}

type FeedbackRow = {
  patio_execucao_id: number
  cliente_id: string
  cliente_nome: string
  vendedor_id: string | null
  veiculo_id: string | null
  placa: string | null
  veiculo_descricao: string | null
  quilometragem: number | null
  fim_execucao: string | null
  nome_motorista: string | null
  contato_motorista: string | null
  contato_recomendado: string | null
  contato_nome: string | null
  contato_tipo: string | null
  servicos: string[] | null
}

type RevisaoRow = {
  patio_veiculo_id: number
  cliente_id: string
  cliente_nome: string
  vendedor_id: string | null
  veiculo_id: string | null
  placa: string | null
  veiculo_descricao: string | null
  nome_motorista: string | null
  contato_motorista: string | null
  media_km_diaria: number | null
  data_revisao_proativa: string | null
  ultimo_km: number | null
  ultimo_atendimento_em: string | null
  dias_desde_ultima_visita: number | null
  km_estimado_desde_visita: number | null
  contato_recomendado: string | null
  contato_nome: string | null
  contato_tipo: string | null
}

type VeiculoBuscaRow = {
  patio_veiculo_id: number
  cliente_id: string | null
  cliente_nome: string | null
  vendedor_id: string | null
  veiculo_id: string | null
  placa: string | null
  veiculo_descricao: string | null
  ano_modelo: number | null
  nome_motorista: string | null
  contato_motorista: string | null
  media_km_diaria: number | null
  data_revisao_proativa: string | null
  ultimo_patio_execucao_id: number | null
  ultimo_km: number | null
  ultimo_atendimento_em: string | null
  contato_recomendado: string | null
  contato_nome: string | null
  contato_tipo: string | null
}

type FilaRow = {
  id: string
  patio_item_id: number
  patio_tabela_origem: string
  patio_execucao_id: number | null
  cliente_id: string | null
  cliente_nome: string | null
  vendedor_id: string | null
  veiculo_id: string | null
  placa: string | null
  area: PatioFilaItem['area']
  servico_nome: string | null
  descricao: string | null
  quantidade: number | null
  status: string | null
  box_id: number | null
  funcionario_id: number | null
  quilometragem: number | null
  tipo_atendimento: string | null
  solicitado_em: string | null
  atualizado_em: string | null
}

export async function getClienteContatoRecomendado(clienteId: string): Promise<ClienteContatoRecomendado | undefined> {
  const supabase = await getSupabase()
  if (!supabase) return undefined

  const { data, error } = await supabase
    .from('vw_cliente_contatos_recomendados')
    .select('*')
    .eq('cliente_id', clienteId)
    .maybeSingle()

  if (error) throw error
  return data ? mapContato(data as ContatoRow) : undefined
}

export async function listClientePatioAtendimentos(clienteId: string): Promise<PatioAtendimentoResumo[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('patio_atendimentos')
    .select('patio_execucao_id,cliente_id,veiculo_id,placa_snapshot,cliente_nome_snapshot,quilometragem,status,inicio_execucao,fim_execucao,nome_motorista,contato_motorista,data_feedback')
    .eq('cliente_id', clienteId)
    .order('fim_execucao', { ascending: false, nullsFirst: false })
    .limit(80)

  if (error) throw error
  return (data as AtendimentoRow[] | null ?? []).map(mapAtendimento)
}

export async function listClientePatioAtendimentoItens(clienteId: string): Promise<PatioAtendimentoItemResumo[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('patio_atendimento_itens')
    .select('id,patio_execucao_id,cliente_id,veiculo_id,area,servico_nome,descricao,quantidade,status,quilometragem,solicitado_em,tipo_atendimento')
    .eq('cliente_id', clienteId)
    .order('solicitado_em', { ascending: false, nullsFirst: false })
    .limit(200)

  if (error) throw error
  return (data as AtendimentoItemRow[] | null ?? []).map(mapAtendimentoItem)
}

export async function listPatioFeedbackPendente(input: {
  page: number
  pageSize: number
  vendedorId?: string
  query?: string
}): Promise<{ items: PatioFeedbackPendente[]; total: number }> {
  const supabase = await getSupabase()
  if (!supabase) return { items: [], total: 0 }

  const from = (input.page - 1) * input.pageSize
  const to = from + input.pageSize - 1
  let query = supabase
    .from('vw_patio_feedback_pendente')
    .select('*', { count: 'exact' })
    .order('fim_execucao', { ascending: true })
    .range(from, to)

  if (input.vendedorId) query = query.eq('vendedor_id', input.vendedorId)
  if (input.query?.trim()) {
    const term = `%${input.query.trim()}%`
    query = query.or(`cliente_nome.ilike.${term},placa.ilike.${term},nome_motorista.ilike.${term}`)
  }

  const { data, error, count } = await query
  if (error) throw error
  return { items: (data as FeedbackRow[] | null ?? []).map(mapFeedback), total: count ?? 0 }
}

export async function listPatioRevisaoProativa(input: {
  page: number
  pageSize: number
  vendedorId?: string
  query?: string
  kmMin?: number
  diasMin?: number
}): Promise<{ items: PatioRevisaoProativa[]; total: number }> {
  const supabase = await getSupabase()
  if (!supabase) return { items: [], total: 0 }

  const from = (input.page - 1) * input.pageSize
  const to = from + input.pageSize - 1
  let query = supabase
    .from('vw_patio_revisao_proativa')
    .select('*', { count: 'exact' })
    .order('km_estimado_desde_visita', { ascending: false })
    .order('dias_desde_ultima_visita', { ascending: false })
    .range(from, to)

  if (input.vendedorId) query = query.eq('vendedor_id', input.vendedorId)
  if (input.kmMin) query = query.gte('km_estimado_desde_visita', input.kmMin)
  if (input.diasMin) query = query.gte('dias_desde_ultima_visita', input.diasMin)
  if (input.query?.trim()) {
    const term = `%${input.query.trim()}%`
    query = query.or(`cliente_nome.ilike.${term},placa.ilike.${term},nome_motorista.ilike.${term}`)
  }

  const { data, error, count } = await query
  if (error) throw error
  return { items: (data as RevisaoRow[] | null ?? []).map(mapRevisao), total: count ?? 0 }
}

export async function markPatioFeedbackDone(patioExecucaoId: number): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase) return

  const { error } = await supabase.rpc('registrar_feedback_patio', {
    p_patio_execucao_id: patioExecucaoId,
  })
  if (error) throw error
}

export async function markPatioRevisaoDone(patioVeiculoId: number): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase) return

  const { error } = await supabase.rpc('registrar_revisao_proativa_patio', {
    p_patio_veiculo_id: patioVeiculoId,
  })
  if (error) throw error
}

export async function searchPatioVeiculos(queryText: string): Promise<PatioVeiculoBusca[]> {
  const supabase = await getSupabase()
  if (!supabase || queryText.trim().length < 2) return []

  const term = `%${queryText.trim()}%`
  const { data, error } = await supabase
    .from('vw_patio_veiculos_busca')
    .select('*')
    .or(`placa.ilike.${term},cliente_nome.ilike.${term},nome_motorista.ilike.${term}`)
    .order('ultimo_atendimento_em', { ascending: false, nullsFirst: false })
    .limit(30)

  if (error) throw error
  return (data as VeiculoBuscaRow[] | null ?? []).map(mapVeiculoBusca)
}

export async function listPatioFilaItens(input: {
  page: number
  pageSize: number
  area?: PatioFilaItem['area'] | 'todas'
  query?: string
}): Promise<{ items: PatioFilaItem[]; total: number }> {
  const supabase = await getSupabase()
  if (!supabase) return { items: [], total: 0 }

  const from = (input.page - 1) * input.pageSize
  const to = from + input.pageSize - 1
  let query = supabase
    .from('vw_patio_fila_itens')
    .select('*', { count: 'exact' })
    .order('solicitado_em', { ascending: true, nullsFirst: false })
    .range(from, to)

  if (input.area && input.area !== 'todas') query = query.eq('area', input.area)
  if (input.query?.trim()) {
    const term = `%${input.query.trim()}%`
    query = query.or(`cliente_nome.ilike.${term},placa.ilike.${term},servico_nome.ilike.${term}`)
  }

  const { data, error, count } = await query
  if (error) throw error
  return { items: (data as FilaRow[] | null ?? []).map(mapFila), total: count ?? 0 }
}

export async function listPatioBoxesAtivos(): Promise<PatioAtendimentoResumo[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('vw_patio_boxes_ativos')
    .select('patio_execucao_id,cliente_id,veiculo_id,placa,cliente_nome,quilometragem,status,inicio_execucao,nome_motorista,contato_motorista')
    .order('box_id', { ascending: true, nullsFirst: false })

  if (error) throw error
  return (data as Array<AtendimentoRow & { placa?: string | null; cliente_nome?: string | null }> | null ?? []).map((row) => mapAtendimento({
    ...row,
    placa_snapshot: row.placa ?? null,
    cliente_nome_snapshot: row.cliente_nome ?? null,
    fim_execucao: null,
    data_feedback: null,
  }))
}

export async function listPatioConcluidos(input: {
  page: number
  pageSize: number
  query?: string
}): Promise<{ items: PatioAtendimentoResumo[]; total: number }> {
  const supabase = await getSupabase()
  if (!supabase) return { items: [], total: 0 }

  const from = (input.page - 1) * input.pageSize
  const to = from + input.pageSize - 1
  let query = supabase
    .from('vw_patio_concluidos')
    .select('patio_execucao_id,cliente_id,veiculo_id,placa,cliente_nome,quilometragem,status,inicio_execucao,fim_execucao,nome_motorista,contato_motorista,data_feedback', { count: 'exact' })
    .order('fim_execucao', { ascending: false, nullsFirst: false })
    .range(from, to)

  if (input.query?.trim()) {
    const term = `%${input.query.trim()}%`
    query = query.or(`cliente_nome.ilike.${term},placa.ilike.${term},nome_motorista.ilike.${term}`)
  }

  const { data, error, count } = await query
  if (error) throw error
  return {
    items: (data as Array<AtendimentoRow & { placa?: string | null; cliente_nome?: string | null }> | null ?? []).map((row) => mapAtendimento({
      ...row,
      placa_snapshot: row.placa ?? null,
      cliente_nome_snapshot: row.cliente_nome ?? null,
    })),
    total: count ?? 0,
  }
}

function mapContato(row: ContatoRow): ClienteContatoRecomendado {
  return {
    clienteId: row.cliente_id,
    contatoId: row.contato_id ?? undefined,
    nome: row.nome ?? undefined,
    tipo: row.tipo ?? 'cadastro',
    whatsapp: row.whatsapp ?? undefined,
    email: row.email ?? undefined,
    origemSistema: row.origem_sistema ?? 'crm',
    prioridade: Number(row.prioridade ?? 0),
    atualizadoEm: row.atualizado_em ?? undefined,
  }
}

function mapAtendimento(row: AtendimentoRow): PatioAtendimentoResumo {
  return {
    patioExecucaoId: Number(row.patio_execucao_id),
    clienteId: row.cliente_id ?? undefined,
    veiculoId: row.veiculo_id ?? undefined,
    placa: row.placa_snapshot ?? undefined,
    clienteNome: row.cliente_nome_snapshot ?? undefined,
    quilometragem: row.quilometragem ?? undefined,
    status: row.status ?? undefined,
    inicioExecucao: row.inicio_execucao ?? undefined,
    fimExecucao: row.fim_execucao ?? undefined,
    nomeMotorista: row.nome_motorista ?? undefined,
    contatoMotorista: row.contato_motorista ?? undefined,
    dataFeedback: row.data_feedback ?? undefined,
  }
}

function mapAtendimentoItem(row: AtendimentoItemRow): PatioAtendimentoItemResumo {
  return {
    id: row.id,
    patioExecucaoId: row.patio_execucao_id ?? undefined,
    clienteId: row.cliente_id ?? undefined,
    veiculoId: row.veiculo_id ?? undefined,
    area: row.area,
    servicoNome: row.servico_nome ?? undefined,
    descricao: row.descricao ?? undefined,
    quantidade: row.quantidade ?? undefined,
    status: row.status ?? undefined,
    quilometragem: row.quilometragem ?? undefined,
    solicitadoEm: row.solicitado_em ?? undefined,
    tipoAtendimento: row.tipo_atendimento ?? undefined,
  }
}

function mapFeedback(row: FeedbackRow): PatioFeedbackPendente {
  return {
    patioExecucaoId: Number(row.patio_execucao_id),
    clienteId: row.cliente_id,
    clienteNome: row.cliente_nome,
    vendedorId: row.vendedor_id ?? undefined,
    veiculoId: row.veiculo_id ?? undefined,
    placa: row.placa ?? undefined,
    veiculoDescricao: row.veiculo_descricao ?? undefined,
    quilometragem: row.quilometragem ?? undefined,
    fimExecucao: row.fim_execucao ?? undefined,
    nomeMotorista: row.nome_motorista ?? undefined,
    contatoMotorista: row.contato_motorista ?? undefined,
    contatoRecomendado: row.contato_recomendado ?? undefined,
    contatoNome: row.contato_nome ?? undefined,
    contatoTipo: row.contato_tipo ?? undefined,
    servicos: row.servicos ?? [],
  }
}

function mapRevisao(row: RevisaoRow): PatioRevisaoProativa {
  return {
    patioVeiculoId: Number(row.patio_veiculo_id),
    clienteId: row.cliente_id,
    clienteNome: row.cliente_nome,
    vendedorId: row.vendedor_id ?? undefined,
    veiculoId: row.veiculo_id ?? undefined,
    placa: row.placa ?? undefined,
    veiculoDescricao: row.veiculo_descricao ?? undefined,
    nomeMotorista: row.nome_motorista ?? undefined,
    contatoMotorista: row.contato_motorista ?? undefined,
    mediaKmDiaria: row.media_km_diaria ?? undefined,
    dataRevisaoProativa: row.data_revisao_proativa ?? undefined,
    ultimoKm: row.ultimo_km ?? undefined,
    ultimoAtendimentoEm: row.ultimo_atendimento_em ?? undefined,
    diasDesdeUltimaVisita: Number(row.dias_desde_ultima_visita ?? 0),
    kmEstimadoDesdeVisita: Number(row.km_estimado_desde_visita ?? 0),
    contatoRecomendado: row.contato_recomendado ?? undefined,
    contatoNome: row.contato_nome ?? undefined,
    contatoTipo: row.contato_tipo ?? undefined,
  }
}

function mapVeiculoBusca(row: VeiculoBuscaRow): PatioVeiculoBusca {
  return {
    patioVeiculoId: Number(row.patio_veiculo_id),
    clienteId: row.cliente_id ?? undefined,
    clienteNome: row.cliente_nome ?? undefined,
    vendedorId: row.vendedor_id ?? undefined,
    veiculoId: row.veiculo_id ?? undefined,
    placa: row.placa ?? undefined,
    veiculoDescricao: row.veiculo_descricao ?? undefined,
    anoModelo: row.ano_modelo ?? undefined,
    nomeMotorista: row.nome_motorista ?? undefined,
    contatoMotorista: row.contato_motorista ?? undefined,
    mediaKmDiaria: row.media_km_diaria ?? undefined,
    dataRevisaoProativa: row.data_revisao_proativa ?? undefined,
    ultimoPatioExecucaoId: row.ultimo_patio_execucao_id ?? undefined,
    ultimoKm: row.ultimo_km ?? undefined,
    ultimoAtendimentoEm: row.ultimo_atendimento_em ?? undefined,
    contatoRecomendado: row.contato_recomendado ?? undefined,
    contatoNome: row.contato_nome ?? undefined,
    contatoTipo: row.contato_tipo ?? undefined,
  }
}

function mapFila(row: FilaRow): PatioFilaItem {
  return {
    id: row.id,
    patioItemId: Number(row.patio_item_id),
    patioTabelaOrigem: row.patio_tabela_origem,
    patioExecucaoId: row.patio_execucao_id ?? undefined,
    clienteId: row.cliente_id ?? undefined,
    clienteNome: row.cliente_nome ?? undefined,
    vendedorId: row.vendedor_id ?? undefined,
    veiculoId: row.veiculo_id ?? undefined,
    placa: row.placa ?? undefined,
    area: row.area,
    servicoNome: row.servico_nome ?? undefined,
    descricao: row.descricao ?? undefined,
    quantidade: row.quantidade ?? undefined,
    status: row.status ?? undefined,
    boxId: row.box_id ?? undefined,
    funcionarioId: row.funcionario_id ?? undefined,
    quilometragem: row.quilometragem ?? undefined,
    tipoAtendimento: row.tipo_atendimento ?? undefined,
    solicitadoEm: row.solicitado_em ?? undefined,
    atualizadoEm: row.atualizado_em ?? undefined,
  }
}
