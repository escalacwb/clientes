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
  PatioRevisaoResultadoStatus,
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
  atualizado_em: string | null
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
  total_count?: number | null
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

type PatioContatoClienteRow = {
  id: string
  nome: string | null
  responsavel_nome: string | null
  telefone_principal: string | null
  whatsapp_principal: string | null
  data_atualizacao_contato: string | null
  data_ultima_exportacao: string | null
}

type PatioContatoMotoristaRow = {
  patio_veiculo_id: number
  empresa: string | null
  placa: string | null
  modelo: string | null
  nome_motorista: string | null
  contato_motorista: string | null
  data_atualizacao_contato: string | null
  data_ultima_exportacao: string | null
}

type PatioRelatorioServicoRow = {
  id: string
  patio_execucao_id: number
  cliente_nome: string | null
  placa: string | null
  area: string | null
  servico_nome: string | null
  quantidade: number | null
  box_id: number | null
  box_nome: string | null
  funcionario_nome: string | null
  inicio_execucao: string | null
  fim_execucao: string | null
  duracao_minutos: number | null
  quilometragem: number | null
}

type PatioRevisaoResultadoRow = {
  patio_veiculo_id: number
  cliente_id: string
  cliente_nome: string | null
  vendedor_id: string | null
  veiculo_id: string | null
  placa: string | null
  veiculo_descricao: string | null
  nome_motorista: string | null
  contato_motorista: string | null
  data_revisao_proativa: string | null
  retorno_patio_execucao_id: number | null
  retorno_em: string | null
  retorno_km: number | null
  resultado: string | null
  dias_desde_acao: number | null
  janela_dias: number | null
}

type PatioRevisaoEfetividadeResumoRow = {
  fonte: string
  fonte_label: string
  contatos_total: number | null
  retornaram_janela: number | null
  sem_retorno_janela: number | null
  aguardando: number | null
  taxa_total: number | string | null
  taxa_maturada: number | string | null
  primeira_acao: string | null
  ultima_acao: string | null
  janela_dias: number | null
}

export type PatioContatoExportacao = {
  tipo: 'Responsavel' | 'Motorista'
  sourceId: string
  nome: string
  empresa: string
  placa?: string
  modelo?: string
  telefone: string
  telefonePadronizado: string
  observacao: string
  atualizadoEm?: string
  ultimaExportacao?: string
}

export type PatioRelatorioServico = {
  id: string
  patioExecucaoId: number
  clienteNome?: string
  placa?: string
  area?: string
  servicoNome?: string
  quantidade: number
  boxId?: number
  boxNome?: string
  funcionarioNome?: string
  inicioExecucao?: string
  fimExecucao?: string
  duracaoMinutos?: number
  quilometragem?: number
}

export type PatioRevisaoResultado = {
  patioVeiculoId: number
  clienteId: string
  clienteNome?: string
  vendedorId?: string
  veiculoId?: string
  placa?: string
  veiculoDescricao?: string
  nomeMotorista?: string
  contatoMotorista?: string
  dataRevisaoProativa?: string
  retornoPatioExecucaoId?: number
  retornoEm?: string
  retornoKm?: number
  resultado: PatioRevisaoResultadoStatus
  diasDesdeAcao: number
  janelaDias: number
}

export type PatioRevisaoEfetividadeResumo = {
  fonte: 'total' | 'crm' | string
  fonteLabel: string
  contatosTotal: number
  retornaramJanela: number
  semRetornoJanela: number
  aguardando: number
  taxaTotal: number
  taxaMaturada: number
  primeiraAcao?: string
  ultimaAcao?: string
  janelaDias: number
}

export type PatioPlateConsultResult = {
  placa: string
  modelo: string
  anoModelo?: number | string | null
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

export async function listPatioConcluidoAtendimentoItens(patioExecucaoIds: number[]): Promise<PatioAtendimentoItemResumo[]> {
  const supabase = await getSupabase()
  if (!supabase || patioExecucaoIds.length === 0) return []

  const { data, error } = await supabase
    .from('patio_atendimento_itens')
    .select('id,patio_execucao_id,cliente_id,veiculo_id,area,servico_nome,descricao,quantidade,status,quilometragem,solicitado_em,atualizado_em,tipo_atendimento')
    .in('patio_execucao_id', patioExecucaoIds)
    .order('area', { ascending: true })
    .order('servico_nome', { ascending: true })

  if (error) throw error
  return (data as AtendimentoItemRow[] | null ?? []).map(mapAtendimentoItem)
}

export async function updatePatioAtendimentoItemTipo(id: string, tipoAtendimento: string): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase) return

  const { error } = await supabase
    .from('patio_atendimento_itens')
    .update({ tipo_atendimento: tipoAtendimento })
    .eq('id', id)

  if (error) throw error
}

export async function listPatioFeedbackPendente(input: {
  page: number
  pageSize: number
  vendedorId?: string
  query?: string
  ageFilter?: 'recentes' | 'antigos'
}): Promise<{ items: PatioFeedbackPendente[]; total: number }> {
  const supabase = await getSupabase()
  if (!supabase) return { items: [], total: 0 }

  const from = (input.page - 1) * input.pageSize
  const to = from + input.pageSize - 1
  let query = supabase
    .from('vw_patio_feedback_pendente')
    .select('*', { count: 'exact' })
    .order('fim_execucao', { ascending: false, nullsFirst: false })
    .range(from, to)

  if (input.vendedorId) query = query.eq('vendedor_id', input.vendedorId)
  const cutoff = new Date(Date.now() - 3 * 86400000).toISOString()
  if (input.ageFilter === 'recentes') query = query.gte('fim_execucao', cutoff)
  if (input.ageFilter === 'antigos') query = query.lt('fim_execucao', cutoff)
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

  const offset = (input.page - 1) * input.pageSize
  const { data, error } = await supabase.rpc('listar_patio_revisao_proativa', {
    p_km_min: input.kmMin ?? null,
    p_dias_min: input.diasMin ?? null,
    p_query: input.query?.trim() || null,
    p_vendedor_id: input.vendedorId ?? null,
    p_limit: input.pageSize,
    p_offset: offset,
  })
  if (error) throw error
  const rows = data as RevisaoRow[] | null ?? []
  return { items: rows.map(mapRevisao), total: Number(rows[0]?.total_count ?? 0) }
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

  const { data: rpcData, error: rpcError } = await supabase
    .rpc('buscar_patio_veiculos', {
      p_query: queryText.trim(),
      p_limit: 30,
    })

  if (!rpcError) return (rpcData as VeiculoBuscaRow[] | null ?? []).map(mapVeiculoBusca)

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

export async function updatePatioVeiculoMediaKm(input: {
  patioVeiculoId: number
  veiculoId?: string
  mediaKmDiaria: number
}): Promise<void> {
  await updatePatioVeiculoDados({
    patioVeiculoId: input.patioVeiculoId,
    veiculoId: input.veiculoId,
    mediaKmDiaria: input.mediaKmDiaria,
  })
}

export async function updatePatioAtendimentoKm(input: {
  patioExecucaoId: number
  quilometragem: number
}): Promise<number | undefined> {
  const supabase = await getSupabase()
  if (!supabase) throw new Error('Supabase nao configurado.')

  const { data, error } = await supabase.rpc('corrigir_km_atendimento_patio_crm', {
    p_patio_execucao_id: input.patioExecucaoId,
    p_quilometragem: Math.round(Number(input.quilometragem) || 0),
  })

  if (error) throw error
  return data == null ? undefined : Number(data)
}

export async function listPatioContatosExportacao(input?: { query?: string; reExportAll?: boolean }): Promise<PatioContatoExportacao[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const term = input?.query?.trim()
  let clientesQuery = supabase
    .from('clientes')
    .select('id,nome,responsavel_nome,telefone_principal,whatsapp_principal,data_atualizacao_contato,data_ultima_exportacao')
    .not('responsavel_nome', 'is', null)
    .limit(input?.reExportAll ? 2000 : 1000)

  let motoristasQuery = supabase
    .from('patio_veiculos_snapshot')
    .select('patio_veiculo_id,empresa,placa,modelo,nome_motorista,contato_motorista,data_atualizacao_contato,data_ultima_exportacao')
    .not('nome_motorista', 'is', null)
    .limit(input?.reExportAll ? 2000 : 1000)

  if (term) {
    const like = `%${term}%`
    clientesQuery = clientesQuery.or(`nome.ilike.${like},responsavel_nome.ilike.${like},telefone_principal.ilike.${like},whatsapp_principal.ilike.${like}`)
    motoristasQuery = motoristasQuery.or(`empresa.ilike.${like},placa.ilike.${like},nome_motorista.ilike.${like},contato_motorista.ilike.${like}`)
  }

  const [{ data: clientes, error: clientesError }, { data: motoristas, error: motoristasError }] = await Promise.all([
    clientesQuery,
    motoristasQuery,
  ])

  if (clientesError) throw clientesError
  if (motoristasError) throw motoristasError

  const responsaveis = (clientes as PatioContatoClienteRow[] | null ?? [])
    .filter((row) => input?.reExportAll || !row.data_ultima_exportacao || !row.data_atualizacao_contato || row.data_atualizacao_contato > row.data_ultima_exportacao)
    .map((row) => {
      const telefone = row.whatsapp_principal || row.telefone_principal || ''
      return {
        tipo: 'Responsavel' as const,
        sourceId: row.id,
        nome: row.responsavel_nome?.trim() || row.nome?.trim() || 'Responsavel',
        empresa: row.nome?.trim() || '',
        telefone,
        telefonePadronizado: normalizeBrazilPhone(telefone),
        observacao: `Contato da empresa ${row.nome?.trim() || ''}`.trim(),
        atualizadoEm: row.data_atualizacao_contato ?? undefined,
        ultimaExportacao: row.data_ultima_exportacao ?? undefined,
      }
    })
    .filter((item) => item.telefonePadronizado)

  const contatosMotoristas = (motoristas as PatioContatoMotoristaRow[] | null ?? [])
    .filter((row) => input?.reExportAll || !row.data_ultima_exportacao || !row.data_atualizacao_contato || row.data_atualizacao_contato > row.data_ultima_exportacao)
    .map((row) => {
      const telefone = row.contato_motorista || ''
      return {
        tipo: 'Motorista' as const,
        sourceId: String(row.patio_veiculo_id),
        nome: row.nome_motorista?.trim() || 'Motorista',
        empresa: row.empresa?.trim() || '',
        placa: row.placa?.trim() || undefined,
        modelo: row.modelo?.trim() || undefined,
        telefone,
        telefonePadronizado: normalizeBrazilPhone(telefone),
        observacao: `Motorista do veiculo ${row.placa?.trim() || ''} - ${row.empresa?.trim() || ''}`.trim(),
        atualizadoEm: row.data_atualizacao_contato ?? undefined,
        ultimaExportacao: row.data_ultima_exportacao ?? undefined,
      }
    })
    .filter((item) => item.telefonePadronizado)

  return [...responsaveis, ...contatosMotoristas]
}

export async function markPatioContatosExportados(items: PatioContatoExportacao[]): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase || items.length === 0) return

  const now = new Date().toISOString()
  const clienteIds = items.filter((item) => item.tipo === 'Responsavel').map((item) => item.sourceId)
  const patioVeiculoIds = items.filter((item) => item.tipo === 'Motorista').map((item) => Number(item.sourceId)).filter(Number.isFinite)

  const updates = []
  if (clienteIds.length > 0) {
    updates.push(supabase.from('clientes').update({ data_ultima_exportacao: now }).in('id', clienteIds))
  }
  if (patioVeiculoIds.length > 0) {
    updates.push(supabase.from('patio_veiculos_snapshot').update({ data_ultima_exportacao: now }).in('patio_veiculo_id', patioVeiculoIds))
  }

  const results = await Promise.all(updates)
  const error = results.find((result) => result.error)?.error
  if (error) throw error
}

export async function listPatioRelatorioServicos(input: {
  startDate: string
  endDate: string
}): Promise<PatioRelatorioServico[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const endExclusive = new Date(`${input.endDate}T00:00:00`)
  endExclusive.setDate(endExclusive.getDate() + 1)
  const pageSize = 1000
  const rows: PatioRelatorioServicoRow[] = []

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('vw_patio_relatorio_servicos')
      .select('*')
      .gte('fim_execucao', `${input.startDate}T00:00:00`)
      .lt('fim_execucao', endExclusive.toISOString())
      .order('fim_execucao', { ascending: false })
      .range(from, from + pageSize - 1)

    if (error) throw error
    const batch = data as PatioRelatorioServicoRow[] | null
    rows.push(...(batch ?? []))
    if (!batch || batch.length < pageSize) break
  }

  return rows.map(mapPatioRelatorioServico)
}

function mapPatioRelatorioServico(row: PatioRelatorioServicoRow): PatioRelatorioServico {
  return {
    id: row.id,
    patioExecucaoId: Number(row.patio_execucao_id),
    clienteNome: row.cliente_nome ?? undefined,
    placa: row.placa ?? undefined,
    area: row.area ?? undefined,
    servicoNome: row.servico_nome ?? undefined,
    quantidade: Number(row.quantidade ?? 1),
    boxId: row.box_id ?? undefined,
    boxNome: row.box_nome ?? undefined,
    funcionarioNome: row.funcionario_nome ?? undefined,
    inicioExecucao: row.inicio_execucao ?? undefined,
    fimExecucao: row.fim_execucao ?? undefined,
    duracaoMinutos: row.duracao_minutos ? Number(row.duracao_minutos) : undefined,
    quilometragem: row.quilometragem ?? undefined,
  }
}

export async function listPatioRevisaoResultados(input: {
  status?: 'todos' | 'retornou' | 'sem_retorno' | 'aguardando'
  limit?: number
  janelaDias?: number
} = {}): Promise<PatioRevisaoResultado[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data: rpcData, error: rpcError } = await supabase
    .rpc('listar_patio_revisao_resultados', {
      p_status: input.status ?? 'todos',
      p_limit: input.limit ?? 300,
      p_dias_janela: input.janelaDias ?? 30,
    })

  if (!rpcError) {
    return (rpcData as PatioRevisaoResultadoRow[] | null ?? []).map(mapPatioRevisaoResultado)
  }

  let query = supabase
    .from('vw_patio_revisao_resultados')
    .select('*')
    .order('data_revisao_proativa', { ascending: false })
    .limit(input.limit ?? 300)

  if (input.status && input.status !== 'todos') {
    const legacyStatus = input.status === 'retornou' ? 'retornou_15d' : input.status === 'sem_retorno' ? 'sem_retorno_15d' : input.status
    query = query.eq('resultado', legacyStatus)
  }

  const { data, error } = await query
  if (error) throw error
  return (data as PatioRevisaoResultadoRow[] | null ?? []).map(mapPatioRevisaoResultado)
}

export async function listPatioRevisaoEfetividadeResumo(input: {
  janelaDias?: number
  startDate?: string
  endDate?: string
} = {}): Promise<PatioRevisaoEfetividadeResumo[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase.rpc('resumo_patio_revisao_efetividade', {
    p_dias_janela: input.janelaDias ?? 30,
    p_data_inicio: input.startDate || null,
    p_data_fim: input.endDate || null,
  })

  if (error) throw error
  return (data as PatioRevisaoEfetividadeResumoRow[] | null ?? []).map(mapPatioRevisaoEfetividadeResumo)
}

function mapPatioRevisaoResultado(row: PatioRevisaoResultadoRow): PatioRevisaoResultado {
  return {
    patioVeiculoId: Number(row.patio_veiculo_id),
    clienteId: row.cliente_id,
    clienteNome: row.cliente_nome ?? undefined,
    vendedorId: row.vendedor_id ?? undefined,
    veiculoId: row.veiculo_id ?? undefined,
    placa: row.placa ?? undefined,
    veiculoDescricao: row.veiculo_descricao ?? undefined,
    nomeMotorista: row.nome_motorista ?? undefined,
    contatoMotorista: row.contato_motorista ?? undefined,
    dataRevisaoProativa: row.data_revisao_proativa ?? undefined,
    retornoPatioExecucaoId: row.retorno_patio_execucao_id ?? undefined,
    retornoEm: row.retorno_em ?? undefined,
    retornoKm: row.retorno_km ?? undefined,
    resultado: normalizePatioRevisaoResultado(row.resultado),
    diasDesdeAcao: Number(row.dias_desde_acao ?? 0),
    janelaDias: Number(row.janela_dias ?? 15),
  }
}

function normalizePatioRevisaoResultado(value: string | null | undefined): PatioRevisaoResultado['resultado'] {
  if (value === 'retornou_15d') return 'retornou_janela'
  if (value === 'sem_retorno_15d') return 'sem_retorno_janela'
  if (value === 'retornou_janela' || value === 'sem_retorno_janela' || value === 'aguardando') return value
  return 'aguardando'
}

function mapPatioRevisaoEfetividadeResumo(row: PatioRevisaoEfetividadeResumoRow): PatioRevisaoEfetividadeResumo {
  return {
    fonte: row.fonte,
    fonteLabel: row.fonte_label,
    contatosTotal: Number(row.contatos_total ?? 0),
    retornaramJanela: Number(row.retornaram_janela ?? 0),
    semRetornoJanela: Number(row.sem_retorno_janela ?? 0),
    aguardando: Number(row.aguardando ?? 0),
    taxaTotal: Number(row.taxa_total ?? 0),
    taxaMaturada: Number(row.taxa_maturada ?? 0),
    primeiraAcao: row.primeira_acao ?? undefined,
    ultimaAcao: row.ultima_acao ?? undefined,
    janelaDias: Number(row.janela_dias ?? 30),
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

export async function consultPatioPlate(placa: string): Promise<PatioPlateConsultResult> {
  const supabase = await getSupabase()
  if (!supabase) throw new Error('Supabase nao configurado para consultar placa.')

  const { data, error } = await supabase.functions.invoke('consult-vehicle-plate', {
    body: { placa },
  })

  if (error) throw error
  if (!data?.ok || !data.vehicle) throw new Error(data?.error ?? 'Nao foi possivel consultar a placa.')
  return data.vehicle as PatioPlateConsultResult
}

export async function notifyPatioBoxFinalized(input: {
  patioExecucaoId: number
  finalizadoPor?: string
  observacaoFinal?: string
}): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase) return

  const { data, error } = await supabase.functions.invoke('send-patio-telegram', {
    body: input,
  })

  if (error) throw error
  if (data && data.ok === false) throw new Error(data.error ?? 'Nao foi possivel enviar notificacao do patio.')
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
  const to = from + input.pageSize
  let query = supabase
    .from('patio_atendimento_itens')
    .select('id,patio_item_id,patio_tabela_origem,patio_execucao_id,cliente_id,veiculo_id,area,servico_nome,descricao,quantidade,status,box_id,funcionario_id,quilometragem,tipo_atendimento,solicitado_em,atualizado_em')
    .eq('status', 'pendente')
    .order('solicitado_em', { ascending: true, nullsFirst: false })
    .range(from, to)

  if (input.area && input.area !== 'todas') query = query.eq('area', input.area)
  if (input.query?.trim()) {
    const term = `%${input.query.trim()}%`
    query = query.or(`servico_nome.ilike.${term},descricao.ilike.${term}`)
  }

  const { data, error } = await query
  if (error) throw error
  const rows = data as FilaRow[] | null ?? []
  const hasMore = rows.length > input.pageSize
  const pageRows = hasMore ? rows.slice(0, input.pageSize) : rows
  return { items: pageRows.map(mapFila), total: from + pageRows.length + (hasMore ? 1 : 0) }
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
  startDate?: string
  endDate?: string
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

  if (input.startDate) query = query.gte('fim_execucao', `${input.startDate}T00:00:00`)
  if (input.endDate) query = query.lte('fim_execucao', `${input.endDate}T23:59:59`)
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
    atualizadoEm: row.atualizado_em ?? undefined,
    tipoAtendimento: row.tipo_atendimento ?? undefined,
  }
}

function normalizeBrazilPhone(value?: string | null) {
  if (!value) return ''
  let digits = value.replace(/\D/g, '')
  if (digits.startsWith('55')) digits = digits.slice(2)
  if (digits.length > 10 && digits.startsWith('0')) digits = digits.slice(1)
  if (digits.length === 10) {
    const phone = digits.slice(2)
    if (/^[6789]/.test(phone)) digits = `${digits.slice(0, 2)}9${phone}`
  }
  if (![10, 11].includes(digits.length)) return ''
  return `+55${digits}`
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
