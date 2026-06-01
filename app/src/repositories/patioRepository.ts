import { getSupabase } from '../lib/supabase'
import type {
  ClienteContatoRecomendado,
  PatioAtendimentoItemResumo,
  PatioAtendimentoResumo,
  PatioAlocacaoVeiculo,
  PatioAreaPendente,
  PatioBox,
  PatioBoxServico,
  PatioCatalogoServico,
  PatioEntradaInput,
  PatioFeedbackPendente,
  PatioFilaPainel,
  PatioFilaItem,
  PatioFuncionario,
  PatioPainelBox,
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
  veiculo_descricao: string | null
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

type AlocacaoVeiculoRow = {
  patio_veiculo_id: number
  cliente_id: string | null
  veiculo_id: string | null
  placa: string | null
  cliente_nome: string | null
  veiculo_descricao: string | null
  pendentes: number | null
  em_andamento: number | null
  primeira_solicitacao: string | null
}

type AreaPendenteRow = {
  patio_veiculo_id: number
  area: PatioAreaPendente['area']
  quilometragem: number | null
  total_itens: number | null
}

type FuncionarioRow = {
  patio_funcionario_id: number
  nome: string
  ativo: boolean | null
}

type BoxRow = {
  patio_box_id: number
  area: string | null
  ocupado: boolean | null
  ativo: boolean | null
}

type PainelBoxRow = {
  box_id: number
  box_area: string | null
  patio_execucao_id: number | null
  patio_veiculo_id: number | null
  cliente_id: string | null
  veiculo_id: string | null
  placa: string | null
  cliente_nome: string | null
  nome_motorista: string | null
  contato_motorista: string | null
  quilometragem: number | null
  veiculo_descricao: string | null
  funcionario_nome: string | null
  lista_servicos: string | null
}

type BoxServicoRow = {
  id: string
  patio_execucao_id: number
  area: PatioBoxServico['area']
  servico_nome: string | null
  quantidade: number | null
  observacao_cadastro: string | null
  observacao_execucao: string | null
  status: string | null
  box_id: number | null
}

type CatalogoServicoRow = {
  area: PatioCatalogoServico['area']
  nome: string
}

type FilaPainelRow = {
  patio_veiculo_id: number | null
  cliente_id: string | null
  veiculo_id: string | null
  placa: string | null
  cliente_nome: string | null
  primeira_solicitacao: string | null
  lista_servicos: string | null
  total_itens: number | null
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

export async function listPatioVeiculoAtendimentos(patioVeiculoId: number): Promise<PatioAtendimentoResumo[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('patio_atendimentos')
    .select('patio_execucao_id,cliente_id,veiculo_id,placa_snapshot,cliente_nome_snapshot,quilometragem,status,inicio_execucao,fim_execucao,nome_motorista,contato_motorista,data_feedback')
    .eq('patio_veiculo_id', patioVeiculoId)
    .order('inicio_execucao', { ascending: false, nullsFirst: false })
    .limit(80)

  if (error) throw error
  return (data as AtendimentoRow[] | null ?? []).map(mapAtendimento)
}

export async function listPatioVeiculoAtendimentoItens(patioExecucaoIds: number[]): Promise<PatioAtendimentoItemResumo[]> {
  const supabase = await getSupabase()
  if (!supabase || patioExecucaoIds.length === 0) return []

  const { data, error } = await supabase
    .from('patio_atendimento_itens')
    .select('id,patio_execucao_id,cliente_id,veiculo_id,area,servico_nome,descricao,quantidade,status,quilometragem,solicitado_em,tipo_atendimento')
    .in('patio_execucao_id', patioExecucaoIds)
    .order('area', { ascending: true })
    .order('servico_nome', { ascending: true })

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

export async function updatePatioClienteDados(input: {
  clienteId: string
  nome?: string
  responsavel?: string
  telefone?: string
  whatsapp?: string
  cidade?: string
  uf?: string
}): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase) return

  const patch: Record<string, string | undefined> = {
    nome: input.nome?.trim() || undefined,
    responsavel_nome: input.responsavel?.trim() || undefined,
    telefone_principal: input.telefone?.trim() || undefined,
    whatsapp_principal: input.whatsapp?.trim() || undefined,
    cidade: input.cidade?.trim() || undefined,
    uf: input.uf?.trim().toUpperCase() || undefined,
  }

  const { error } = await supabase
    .from('clientes')
    .update(patch)
    .eq('id', input.clienteId)

  if (error) throw error
}

export async function updatePatioVeiculoDados(input: {
  patioVeiculoId: number
  veiculoId?: string
  modelo?: string
  nomeMotorista?: string
  contatoMotorista?: string
  mediaKmDiaria?: number
}): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase) return

  const { error: snapshotError } = await supabase
    .from('patio_veiculos_snapshot')
    .update({
      modelo: input.modelo?.trim() || undefined,
      nome_motorista: input.nomeMotorista?.trim() || undefined,
      contato_motorista: input.contatoMotorista?.trim() || undefined,
      media_km_diaria: Number.isFinite(input.mediaKmDiaria) ? input.mediaKmDiaria : undefined,
      data_atualizacao_contato: new Date().toISOString(),
    })
    .eq('patio_veiculo_id', input.patioVeiculoId)

  if (snapshotError) throw snapshotError

  if (input.veiculoId && input.modelo?.trim()) {
    const { error: vehicleError } = await supabase
      .from('veiculos')
      .update({ descricao: input.modelo.trim() })
      .eq('id', input.veiculoId)

    if (vehicleError) throw vehicleError
  }
}

export async function registerPatioEntrada(input: PatioEntradaInput): Promise<number> {
  const supabase = await getSupabase()
  if (!supabase) throw new Error('Supabase nao configurado.')

  const { data, error } = await supabase.rpc('registrar_entrada_patio_crm', {
    p_patio_veiculo_id: input.patioVeiculoId,
    p_quilometragem: input.quilometragem ?? null,
    p_nome_motorista: input.nomeMotorista?.trim() ?? '',
    p_contato_motorista: input.contatoMotorista?.trim() ?? '',
    p_servicos: input.servicos.map((servico) => ({
      area: servico.area,
      servico_nome: servico.servicoNome.trim(),
      descricao: servico.descricao?.trim() || servico.servicoNome.trim(),
      quantidade: Math.max(1, Math.round(Number(servico.quantidade) || 1)),
      observacao: servico.observacao?.trim() ?? '',
    })),
    p_observacao: input.observacaoGeral?.trim() || null,
  })

  if (error) throw error
  return Number(data)
}

export async function listPatioAlocacaoVeiculos(): Promise<PatioAlocacaoVeiculo[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('vw_patio_alocacao_veiculos')
    .select('*')
    .order('primeira_solicitacao', { ascending: true, nullsFirst: false })

  if (error) throw error
  return (data as AlocacaoVeiculoRow[] | null ?? []).map(mapAlocacaoVeiculo)
}

export async function listPatioAreasPendentes(patioVeiculoId: number): Promise<PatioAreaPendente[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('vw_patio_areas_pendentes')
    .select('*')
    .eq('patio_veiculo_id', patioVeiculoId)
    .order('area', { ascending: true })

  if (error) throw error
  return (data as AreaPendenteRow[] | null ?? []).map(mapAreaPendente)
}

export async function listPatioFuncionarios(): Promise<PatioFuncionario[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('patio_funcionarios_snapshot')
    .select('patio_funcionario_id,nome,ativo')
    .eq('ativo', true)
    .order('nome', { ascending: true })

  if (error) throw error
  return (data as FuncionarioRow[] | null ?? []).map(mapFuncionario)
}

export async function listPatioBoxesLivres(): Promise<PatioBox[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('patio_boxes_snapshot')
    .select('patio_box_id,area,ocupado,ativo')
    .eq('ativo', true)
    .eq('ocupado', false)
    .order('patio_box_id', { ascending: true })

  if (error) throw error
  return (data as BoxRow[] | null ?? []).map(mapBox)
}

export async function listPatioCatalogoServicos(): Promise<PatioCatalogoServico[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('vw_patio_catalogo_servicos')
    .select('area,nome')
    .order('area', { ascending: true })
    .order('nome', { ascending: true })

  if (error) throw error
  return (data as CatalogoServicoRow[] | null ?? []).map((row) => ({
    area: row.area,
    nome: row.nome,
  }))
}

export async function listPatioBoxesPainel(): Promise<PatioPainelBox[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('vw_patio_boxes_painel')
    .select('*')
    .order('box_id', { ascending: true })

  if (error) throw error
  return (data as PainelBoxRow[] | null ?? []).map(mapPainelBox)
}

export async function listPatioFilaPainel(): Promise<PatioFilaPainel[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('vw_patio_fila_painel')
    .select('*')
    .order('primeira_solicitacao', { ascending: true, nullsFirst: false })

  if (error) throw error
  return (data as FilaPainelRow[] | null ?? []).map(mapFilaPainel)
}

export async function allocatePatioServices(input: {
  patioVeiculoId: number
  area: PatioAreaPendente['area']
  boxId: number
  funcionarioId: number
}): Promise<number> {
  const supabase = await getSupabase()
  if (!supabase) throw new Error('Supabase nao configurado.')

  const { data, error } = await supabase.rpc('alocar_servicos_patio_crm', {
    p_patio_veiculo_id: input.patioVeiculoId,
    p_area: input.area,
    p_box_id: input.boxId,
    p_funcionario_id: input.funcionarioId,
  })

  if (error) throw error
  return Number(data)
}

export async function listPatioBoxServicos(patioExecucaoId: number): Promise<PatioBoxServico[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('vw_patio_box_servicos')
    .select('*')
    .eq('patio_execucao_id', patioExecucaoId)
    .order('area', { ascending: true })
    .order('servico_nome', { ascending: true })

  if (error) throw error
  return (data as BoxServicoRow[] | null ?? []).map(mapBoxServico)
}

export async function addPatioBoxServico(input: {
  patioExecucaoId: number
  area: PatioBoxServico['area']
  servicoNome: string
  quantidade: number
}): Promise<string> {
  const supabase = await getSupabase()
  if (!supabase) throw new Error('Supabase nao configurado.')

  const { data, error } = await supabase.rpc('adicionar_servico_box_patio_crm', {
    p_patio_execucao_id: input.patioExecucaoId,
    p_area: input.area,
    p_servico_nome: input.servicoNome.trim(),
    p_quantidade: Math.max(1, Math.round(Number(input.quantidade) || 1)),
  })

  if (error) throw error
  return String(data)
}

export async function unassignPatioBox(patioExecucaoId: number): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase) throw new Error('Supabase nao configurado.')

  const { error } = await supabase.rpc('retirar_box_patio_crm', {
    p_patio_execucao_id: patioExecucaoId,
  })
  if (error) throw error
}

export async function finishPatioBox(input: {
  patioExecucaoId: number
  servicos: Array<{ id: string; quantidade: number; observacaoExecucao?: string }>
  observacaoFinal?: string
}): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase) throw new Error('Supabase nao configurado.')

  const { error } = await supabase.rpc('finalizar_box_patio_crm', {
    p_patio_execucao_id: input.patioExecucaoId,
    p_servicos: input.servicos.map((servico) => ({
      id: servico.id,
      quantidade: Math.max(0, Math.round(Number(servico.quantidade) || 0)),
      observacao_execucao: servico.observacaoExecucao?.trim() ?? '',
    })),
    p_observacao_final: input.observacaoFinal?.trim() || null,
  })
  if (error) throw error
}

export async function revertPatioVisit(patioExecucaoId: number): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase) throw new Error('Supabase nao configurado.')

  const { error } = await supabase.rpc('reverter_visita_patio_crm', {
    p_patio_execucao_id: patioExecucaoId,
  })
  if (error) throw error
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
    veiculo_descricao: null,
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
  const to = from + input.pageSize
  let query = supabase
    .from('vw_patio_concluidos')
    .select('patio_execucao_id,cliente_id,veiculo_id,placa,veiculo_descricao,cliente_nome,quilometragem,status,inicio_execucao,fim_execucao,nome_motorista,contato_motorista,data_feedback')
    .order('fim_execucao', { ascending: false, nullsFirst: false })
    .range(from, to)

  if (input.query?.trim()) {
    const term = `%${input.query.trim()}%`
    query = query.or(`cliente_nome.ilike.${term},placa.ilike.${term},nome_motorista.ilike.${term}`)
  }

  const { data, error } = await query
  if (error) throw error
  const rows = data as Array<AtendimentoRow & { placa?: string | null; cliente_nome?: string | null }> | null ?? []
  const hasMore = rows.length > input.pageSize
  const pageRows = hasMore ? rows.slice(0, input.pageSize) : rows
  return {
    items: pageRows.map((row) => mapAtendimento({
      ...row,
      placa_snapshot: row.placa ?? null,
      cliente_nome_snapshot: row.cliente_nome ?? null,
    })),
    total: from + pageRows.length + (hasMore ? 1 : 0),
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
    veiculoDescricao: row.veiculo_descricao ?? undefined,
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

function mapAlocacaoVeiculo(row: AlocacaoVeiculoRow): PatioAlocacaoVeiculo {
  return {
    patioVeiculoId: Number(row.patio_veiculo_id),
    clienteId: row.cliente_id ?? undefined,
    veiculoId: row.veiculo_id ?? undefined,
    placa: row.placa ?? undefined,
    clienteNome: row.cliente_nome ?? undefined,
    veiculoDescricao: row.veiculo_descricao ?? undefined,
    pendentes: Number(row.pendentes ?? 0),
    emAndamento: Number(row.em_andamento ?? 0),
    primeiraSolicitacao: row.primeira_solicitacao ?? undefined,
  }
}

function mapAreaPendente(row: AreaPendenteRow): PatioAreaPendente {
  return {
    patioVeiculoId: Number(row.patio_veiculo_id),
    area: row.area,
    quilometragem: row.quilometragem ?? undefined,
    totalItens: Number(row.total_itens ?? 0),
  }
}

function mapFuncionario(row: FuncionarioRow): PatioFuncionario {
  return {
    patioFuncionarioId: Number(row.patio_funcionario_id),
    nome: row.nome,
    ativo: Boolean(row.ativo ?? true),
  }
}

function mapBox(row: BoxRow): PatioBox {
  return {
    patioBoxId: Number(row.patio_box_id),
    area: row.area ?? undefined,
    ocupado: Boolean(row.ocupado),
    ativo: Boolean(row.ativo ?? true),
  }
}

function mapPainelBox(row: PainelBoxRow): PatioPainelBox {
  return {
    boxId: Number(row.box_id),
    boxArea: row.box_area ?? undefined,
    patioExecucaoId: row.patio_execucao_id ?? undefined,
    patioVeiculoId: row.patio_veiculo_id ?? undefined,
    clienteId: row.cliente_id ?? undefined,
    veiculoId: row.veiculo_id ?? undefined,
    placa: row.placa ?? undefined,
    clienteNome: row.cliente_nome ?? undefined,
    nomeMotorista: row.nome_motorista ?? undefined,
    contatoMotorista: row.contato_motorista ?? undefined,
    quilometragem: row.quilometragem ?? undefined,
    veiculoDescricao: row.veiculo_descricao ?? undefined,
    funcionarioNome: row.funcionario_nome ?? undefined,
    listaServicos: row.lista_servicos ?? '',
  }
}

function mapBoxServico(row: BoxServicoRow): PatioBoxServico {
  return {
    id: row.id,
    patioExecucaoId: Number(row.patio_execucao_id),
    area: row.area,
    servicoNome: row.servico_nome ?? undefined,
    quantidade: Number(row.quantidade ?? 1),
    observacaoCadastro: row.observacao_cadastro ?? undefined,
    observacaoExecucao: row.observacao_execucao ?? undefined,
    status: row.status ?? undefined,
    boxId: row.box_id ?? undefined,
  }
}

function mapFilaPainel(row: FilaPainelRow): PatioFilaPainel {
  return {
    patioVeiculoId: row.patio_veiculo_id ?? undefined,
    clienteId: row.cliente_id ?? undefined,
    veiculoId: row.veiculo_id ?? undefined,
    placa: row.placa ?? undefined,
    clienteNome: row.cliente_nome ?? undefined,
    primeiraSolicitacao: row.primeira_solicitacao ?? undefined,
    listaServicos: row.lista_servicos ?? '',
    totalItens: Number(row.total_itens ?? 0),
  }
}
