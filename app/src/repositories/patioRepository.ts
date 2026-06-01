import { getSupabase } from '../lib/supabase'
import type { ClienteContatoRecomendado, PatioAtendimentoItemResumo, PatioAtendimentoResumo } from '../types'

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
