import { getSupabase } from '../lib/supabase'

export type DashboardResumo = {
  clientesTotal: number
  clientesAtivos90: number
  clientesInativos90: number
  acoesVencidas: number
  clientesSemVendedor: number
  clientesSemWhatsapp: number
  clientesSemContato60: number
  clientesCapital: number
  clientesRodobens: number
  clientesOrigemDesconhecida: number
  totalComprado: number
  totalServicos: number
  tarefasVencidas: number
  tarefasAbertas: number
  pipelineAberto: number
  orcamentosAbertos: number
  orcamentosGanhos: number
  orcamentosTotal: number
  oportunidadesAtivas: number
  oportunidadesTotal: number
  oportunidadesAtualizadoEm?: string
  oportunidadesSemVendedor: number
  oportunidadesRodobens: number
  oportunidadesOrcamentoVencido: number
  campanhasPendentes: number
  campanhasEnviadas: number
  campanhasResponderam: number
  campanhasViraramOrcamento: number
}

export type VendedorResumo = {
  vendedorId: string
  vendedorNome: string
  role: string
  clientes: number
  clientesRisco: number
  contatos: number
  tarefasAbertas: number
  tarefasVencidas: number
  pipeline: number
  totalCarteira: number
}

export type RankingResumo = {
  label: string
  itens: number
  quantidade: number
  valorTotal: number
}

export type FunilGerencialResumo = {
  vendedorId: string
  vendedorNome: string
  clientes: number
  leadsRodobens: number
  contatos30d: number
  orcamentos30d: number
  ganhos30d: number
  perdidos30d: number
  pipelineAberto: number
  tempoMedioFechamento: number
  tarefasVencidas: number
}

export type MotivoPerdaResumo = {
  motivo: string
  total: number
  valorTotal: number
  ultimoRegistro?: string
}

export type AtividadeDiaResumo = {
  vendedorId: string
  vendedorNome: string
  contatosHoje: number
  orcamentosHoje: number
  tarefasConcluidasHoje: number
  tarefasVencidas: number
}

export type TarefaSlaVendedorResumo = {
  vendedorId: string
  vendedorNome: string
  tarefasAbertas: number
  atrasadas: number
  vencemHoje: number
  altaPrioridade: number
  campanhasAtrasadas: number
  orcamentosAtrasados: number
  rodobensAtrasados: number
  oportunidadesAtrasadas: number
  ultimoVencimento?: string
}

export type ForecastVendedorResumo = {
  vendedorId: string
  vendedorNome: string
  propostasAbertas: number
  pipelineAberto: number
  forecastPonderado: number
  ganhoMes: number
  vencidas: number
  vencem7d: number
  ultimoMovimento?: string
  gargaloPrincipal: string
}

type DashboardResumoRow = {
  clientes_total: number
  clientes_ativos_90: number
  clientes_inativos_90: number
  acoes_vencidas: number
  clientes_sem_vendedor: number
  clientes_sem_whatsapp: number
  clientes_sem_contato_60: number
  clientes_capital: number
  clientes_rodobens: number
  clientes_origem_desconhecida: number
  total_comprado: number
  total_servicos: number
  tarefas_vencidas: number
  tarefas_abertas: number
  pipeline_aberto: number
  orcamentos_abertos: number
  orcamentos_ganhos: number
  orcamentos_total: number
  oportunidades_ativas: number
  oportunidades_total: number
  oportunidades_atualizado_em: string | null
  oportunidades_sem_vendedor: number
  oportunidades_rodobens: number
  oportunidades_orcamento_vencido: number
  campanhas_pendentes: number
  campanhas_enviadas: number
  campanhas_responderam: number
  campanhas_viraram_orcamento: number
}

type VendedorResumoRow = {
  vendedor_id: string
  vendedor_nome: string
  role: string
  clientes: number
  clientes_risco: number
  contatos: number
  tarefas_abertas: number
  tarefas_vencidas: number
  pipeline: number
  total_carteira: number
}

type RankingResumoRow = {
  label: string
  itens: number
  quantidade: number
  valor_total: number
}

type FunilGerencialRow = {
  vendedor_id: string
  vendedor_nome: string
  clientes: number
  leads_rodobens: number
  contatos_30d: number
  orcamentos_30d: number
  ganhos_30d: number
  perdidos_30d: number
  pipeline_aberto: number
  tempo_medio_fechamento: number
  tarefas_vencidas: number
}

type MotivoPerdaRow = {
  motivo: string
  total: number
  valor_total: number
  ultimo_registro: string | null
}

type AtividadeDiaRow = {
  vendedor_id: string
  vendedor_nome: string
  contatos_hoje: number
  orcamentos_hoje: number
  tarefas_concluidas_hoje: number
  tarefas_vencidas: number
}

type TarefaSlaVendedorRow = {
  vendedor_id: string
  vendedor_nome: string
  tarefas_abertas: number
  atrasadas: number
  vencem_hoje: number
  alta_prioridade: number
  campanhas_atrasadas: number
  orcamentos_atrasados: number
  rodobens_atrasados: number
  oportunidades_atrasadas: number
  ultimo_vencimento: string | null
}

type ForecastVendedorRow = {
  vendedor_id: string
  vendedor_nome: string
  propostas_abertas: number
  pipeline_aberto: number
  forecast_ponderado: number
  ganho_mes: number
  vencidas: number
  vencem_7d: number
  ultimo_movimento: string | null
  gargalo_principal: string
}

export async function getDashboardResumo(): Promise<DashboardResumo | undefined> {
  const supabase = await getSupabase()
  if (!supabase) return undefined

  const { data, error } = await supabase
    .from('vw_dashboard_resumo')
    .select('*')
    .single()

  if (error) throw error
  return mapDashboardResumo(data as DashboardResumoRow)
}

export async function listVendedoresResumo(): Promise<VendedorResumo[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('vw_vendedores_resumo')
    .select('*')
    .order('vendedor_nome', { ascending: true })

  if (error) throw error
  return (data as VendedorResumoRow[] | null ?? []).map(mapVendedorResumo)
}

export async function listRankingMedidas(limit = 5): Promise<RankingResumo[]> {
  return listRanking('vw_ranking_medidas_vendidas', limit)
}

export async function listRankingServicos(limit = 5): Promise<RankingResumo[]> {
  return listRanking('vw_ranking_servicos_recorrentes', limit)
}

export async function listFunilGerencial(): Promise<FunilGerencialResumo[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('vw_funil_gerencial')
    .select('*')
    .order('pipeline_aberto', { ascending: false })

  if (error) throw error
  return (data as FunilGerencialRow[] | null ?? []).map((row) => ({
    vendedorId: row.vendedor_id,
    vendedorNome: row.vendedor_nome,
    clientes: Number(row.clientes ?? 0),
    leadsRodobens: Number(row.leads_rodobens ?? 0),
    contatos30d: Number(row.contatos_30d ?? 0),
    orcamentos30d: Number(row.orcamentos_30d ?? 0),
    ganhos30d: Number(row.ganhos_30d ?? 0),
    perdidos30d: Number(row.perdidos_30d ?? 0),
    pipelineAberto: Number(row.pipeline_aberto ?? 0),
    tempoMedioFechamento: Number(row.tempo_medio_fechamento ?? 0),
    tarefasVencidas: Number(row.tarefas_vencidas ?? 0),
  }))
}

export async function listMotivosPerda(): Promise<MotivoPerdaResumo[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('vw_motivos_perda')
    .select('*')
    .order('total', { ascending: false })
    .limit(10)

  if (error) throw error
  return (data as MotivoPerdaRow[] | null ?? []).map((row) => ({
    motivo: row.motivo,
    total: Number(row.total ?? 0),
    valorTotal: Number(row.valor_total ?? 0),
    ultimoRegistro: row.ultimo_registro ?? undefined,
  }))
}

export async function listAtividadesDia(): Promise<AtividadeDiaResumo[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('vw_atividades_dia')
    .select('*')

  if (error) throw error
  return (data as AtividadeDiaRow[] | null ?? []).map((row) => ({
    vendedorId: row.vendedor_id,
    vendedorNome: row.vendedor_nome,
    contatosHoje: Number(row.contatos_hoje ?? 0),
    orcamentosHoje: Number(row.orcamentos_hoje ?? 0),
    tarefasConcluidasHoje: Number(row.tarefas_concluidas_hoje ?? 0),
    tarefasVencidas: Number(row.tarefas_vencidas ?? 0),
  }))
}

export async function listTarefasSlaVendedor(): Promise<TarefaSlaVendedorResumo[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('vw_tarefas_sla_vendedor')
    .select('*')
    .order('atrasadas', { ascending: false })
    .order('alta_prioridade', { ascending: false })

  if (error) throw error
  return (data as TarefaSlaVendedorRow[] | null ?? []).map((row) => ({
    vendedorId: row.vendedor_id,
    vendedorNome: row.vendedor_nome,
    tarefasAbertas: Number(row.tarefas_abertas ?? 0),
    atrasadas: Number(row.atrasadas ?? 0),
    vencemHoje: Number(row.vencem_hoje ?? 0),
    altaPrioridade: Number(row.alta_prioridade ?? 0),
    campanhasAtrasadas: Number(row.campanhas_atrasadas ?? 0),
    orcamentosAtrasados: Number(row.orcamentos_atrasados ?? 0),
    rodobensAtrasados: Number(row.rodobens_atrasados ?? 0),
    oportunidadesAtrasadas: Number(row.oportunidades_atrasadas ?? 0),
    ultimoVencimento: row.ultimo_vencimento ?? undefined,
  }))
}

export async function listForecastVendedor(): Promise<ForecastVendedorResumo[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('vw_forecast_vendedor')
    .select('*')
    .order('forecast_ponderado', { ascending: false })

  if (error) throw error
  return (data as ForecastVendedorRow[] | null ?? []).map((row) => ({
    vendedorId: row.vendedor_id,
    vendedorNome: row.vendedor_nome,
    propostasAbertas: Number(row.propostas_abertas ?? 0),
    pipelineAberto: Number(row.pipeline_aberto ?? 0),
    forecastPonderado: Number(row.forecast_ponderado ?? 0),
    ganhoMes: Number(row.ganho_mes ?? 0),
    vencidas: Number(row.vencidas ?? 0),
    vencem7d: Number(row.vencem_7d ?? 0),
    ultimoMovimento: row.ultimo_movimento ?? undefined,
    gargaloPrincipal: row.gargalo_principal,
  }))
}

async function listRanking(viewName: string, limit: number): Promise<RankingResumo[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from(viewName)
    .select('*')
    .limit(limit)

  if (error) throw error
  return (data as RankingResumoRow[] | null ?? []).map((row) => ({
    label: row.label,
    itens: Number(row.itens ?? 0),
    quantidade: Number(row.quantidade ?? 0),
    valorTotal: Number(row.valor_total ?? 0),
  }))
}

function mapDashboardResumo(row: DashboardResumoRow): DashboardResumo {
  return {
    clientesTotal: Number(row.clientes_total ?? 0),
    clientesAtivos90: Number(row.clientes_ativos_90 ?? 0),
    clientesInativos90: Number(row.clientes_inativos_90 ?? 0),
    acoesVencidas: Number(row.acoes_vencidas ?? 0),
    clientesSemVendedor: Number(row.clientes_sem_vendedor ?? 0),
    clientesSemWhatsapp: Number(row.clientes_sem_whatsapp ?? 0),
    clientesSemContato60: Number(row.clientes_sem_contato_60 ?? 0),
    clientesCapital: Number(row.clientes_capital ?? 0),
    clientesRodobens: Number(row.clientes_rodobens ?? 0),
    clientesOrigemDesconhecida: Number(row.clientes_origem_desconhecida ?? 0),
    totalComprado: Number(row.total_comprado ?? 0),
    totalServicos: Number(row.total_servicos ?? 0),
    tarefasVencidas: Number(row.tarefas_vencidas ?? 0),
    tarefasAbertas: Number(row.tarefas_abertas ?? 0),
    pipelineAberto: Number(row.pipeline_aberto ?? 0),
    orcamentosAbertos: Number(row.orcamentos_abertos ?? 0),
    orcamentosGanhos: Number(row.orcamentos_ganhos ?? 0),
    orcamentosTotal: Number(row.orcamentos_total ?? 0),
    oportunidadesAtivas: Number(row.oportunidades_ativas ?? 0),
    oportunidadesTotal: Number(row.oportunidades_total ?? 0),
    oportunidadesAtualizadoEm: row.oportunidades_atualizado_em ?? undefined,
    oportunidadesSemVendedor: Number(row.oportunidades_sem_vendedor ?? 0),
    oportunidadesRodobens: Number(row.oportunidades_rodobens ?? 0),
    oportunidadesOrcamentoVencido: Number(row.oportunidades_orcamento_vencido ?? 0),
    campanhasPendentes: Number(row.campanhas_pendentes ?? 0),
    campanhasEnviadas: Number(row.campanhas_enviadas ?? 0),
    campanhasResponderam: Number(row.campanhas_responderam ?? 0),
    campanhasViraramOrcamento: Number(row.campanhas_viraram_orcamento ?? 0),
  }
}

function mapVendedorResumo(row: VendedorResumoRow): VendedorResumo {
  return {
    vendedorId: row.vendedor_id,
    vendedorNome: row.vendedor_nome,
    role: row.role,
    clientes: Number(row.clientes ?? 0),
    clientesRisco: Number(row.clientes_risco ?? 0),
    contatos: Number(row.contatos ?? 0),
    tarefasAbertas: Number(row.tarefas_abertas ?? 0),
    tarefasVencidas: Number(row.tarefas_vencidas ?? 0),
    pipeline: Number(row.pipeline ?? 0),
    totalCarteira: Number(row.total_carteira ?? 0),
  }
}
