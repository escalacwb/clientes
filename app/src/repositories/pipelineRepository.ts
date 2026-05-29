import { getSupabase } from '../lib/supabase'
import type { Oportunidade, OportunidadeEstagio, OportunidadePipeline, OportunidadePipelineInput } from '../types'

type OportunidadePipelineRow = {
  id: string
  cliente_id: string
  clientes?: { nome: string | null } | null
  titulo: string
  estagio: OportunidadeEstagio
  origem: string
  valor_estimado: number | null
  probabilidade: number | null
  previsao_fechamento: string | null
  responsavel_id: string | null
  users?: { nome: string | null } | null
  campanha_id: string | null
  orcamento_id: string | null
  motivo_perda: string | null
  observacao: string | null
  criado_em: string
  atualizado_em: string
  encerrada_em: string | null
}

export async function listPipelineOportunidades(limit = 100): Promise<OportunidadePipeline[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('oportunidades')
    .select('*,clientes(nome),users!oportunidades_responsavel_id_fkey(nome)')
    .order('encerrada_em', { ascending: true, nullsFirst: true })
    .order('atualizado_em', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data as OportunidadePipelineRow[] | null ?? []).map(mapPipelineOportunidade)
}

export async function createPipelineOportunidade(input: OportunidadePipelineInput): Promise<OportunidadePipeline> {
  const supabase = await getSupabase()
  if (!supabase) {
    return {
      ...input,
      id: `deal-${Date.now()}`,
      clienteNome: '',
      responsavelNome: '',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    }
  }

  const { data, error } = await supabase
    .from('oportunidades')
    .insert(toPipelineRow(input))
    .select('*,clientes(nome),users!oportunidades_responsavel_id_fkey(nome)')
    .single()

  if (error) throw error
  return mapPipelineOportunidade(data as OportunidadePipelineRow)
}

export async function createPipelineFromSuggestion(
  oportunidade: Oportunidade,
  responsavelId?: string,
): Promise<OportunidadePipeline> {
  return createPipelineOportunidade({
    clienteId: oportunidade.clienteId,
    titulo: opportunityTitle(oportunidade),
    estagio: initialStageFromType(oportunidade.tipo),
    origem: `fila:${oportunidade.tipo}`,
    valorEstimado: 0,
    probabilidade: initialProbabilityFromType(oportunidade.tipo),
    previsaoFechamento: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().slice(0, 10),
    responsavelId,
    observacao: `${oportunidade.motivo} Proxima acao: ${oportunidade.proximaAcao}.`,
  })
}

export async function updatePipelineStage(
  id: string,
  estagio: OportunidadeEstagio,
  motivoPerda?: string,
): Promise<OportunidadePipeline> {
  const supabase = await getSupabase()
  if (!supabase) throw new Error('Supabase nao configurado.')

  const shouldClose = estagio === 'ganho' || estagio === 'perdido'
  const { data, error } = await supabase
    .from('oportunidades')
    .update({
      estagio,
      motivo_perda: motivoPerda ?? null,
      encerrada_em: shouldClose ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select('*,clientes(nome),users!oportunidades_responsavel_id_fkey(nome)')
    .single()

  if (error) throw error
  return mapPipelineOportunidade(data as OportunidadePipelineRow)
}

function mapPipelineOportunidade(row: OportunidadePipelineRow): OportunidadePipeline {
  return {
    id: row.id,
    clienteId: row.cliente_id,
    clienteNome: row.clientes?.nome ?? '',
    titulo: row.titulo,
    estagio: row.estagio,
    origem: row.origem,
    valorEstimado: Number(row.valor_estimado ?? 0),
    probabilidade: Number(row.probabilidade ?? 0),
    previsaoFechamento: row.previsao_fechamento ?? undefined,
    responsavelId: row.responsavel_id ?? undefined,
    responsavelNome: row.users?.nome ?? undefined,
    campanhaId: row.campanha_id ?? undefined,
    orcamentoId: row.orcamento_id ?? undefined,
    motivoPerda: row.motivo_perda ?? undefined,
    observacao: row.observacao ?? undefined,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
    encerradaEm: row.encerrada_em ?? undefined,
  }
}

function toPipelineRow(input: OportunidadePipelineInput) {
  return {
    cliente_id: input.clienteId,
    titulo: input.titulo,
    estagio: input.estagio,
    origem: input.origem,
    valor_estimado: input.valorEstimado,
    probabilidade: input.probabilidade,
    previsao_fechamento: input.previsaoFechamento ?? null,
    responsavel_id: input.responsavelId ?? null,
    campanha_id: input.campanhaId ?? null,
    orcamento_id: input.orcamentoId ?? null,
    motivo_perda: input.motivoPerda ?? null,
    observacao: input.observacao ?? null,
    encerrada_em: input.encerradaEm ?? null,
  }
}

function initialStageFromType(tipo: string): OportunidadeEstagio {
  if (tipo.includes('orcamento')) return 'orcamento'
  if (tipo.includes('rodobens') || tipo.includes('sem_cadastro')) return 'novo_lead'
  return 'contato_iniciado'
}

function initialProbabilityFromType(tipo: string) {
  if (tipo.includes('orcamento')) return 55
  if (tipo.includes('alto_valor')) return 45
  if (tipo.includes('recompra')) return 40
  return 25
}

function opportunityTitle(oportunidade: Oportunidade) {
  if (oportunidade.tipo.includes('orcamento')) return 'Retomar proposta em aberto'
  if (oportunidade.tipo.includes('rodobens')) return 'Qualificar cliente de lista externa'
  if (oportunidade.tipo.includes('recompra')) return 'Oportunidade de recompra'
  if (oportunidade.tipo.includes('sem_vendedor')) return 'Distribuir e iniciar atendimento'
  return oportunidade.proximaAcao
}
