import { getSupabase } from '../lib/supabase'

export type AutomacaoRegra = {
  id: string
  codigo: string
  nome: string
  descricao?: string
  evento: string
  acao: string
  ativo: boolean
  atualizadoEm?: string
}

type AutomacaoRegraRow = {
  id: string
  codigo: string
  nome: string
  descricao: string | null
  evento: string
  acao: string
  ativo: boolean
  atualizado_em: string | null
}

const defaultRules: AutomacaoRegra[] = [
  {
    id: 'local-proposta-vencida',
    codigo: 'orcamento-vencido-followup',
    nome: 'Proposta vencida gera follow-up',
    descricao: 'Cria tarefa para proposta aberta que passou da validade.',
    evento: 'orcamento_vencido',
    acao: 'criar_tarefa',
    ativo: true,
  },
  {
    id: 'local-campanha-respondeu',
    codigo: 'campanha-respondeu-followup',
    nome: 'Resposta de campanha gera tarefa',
    descricao: 'Prioriza contatos que responderam ou pediram orcamento.',
    evento: 'campanha_respondeu',
    acao: 'criar_tarefa',
    ativo: true,
  },
  {
    id: 'local-sem-proxima-acao',
    codigo: 'cliente-sem-proxima-acao',
    nome: 'Cliente sem proxima acao entra na rotina',
    descricao: 'Sinaliza carteira parada sem tarefa ou proposta aberta.',
    evento: 'cliente_sem_proxima_acao',
    acao: 'sinalizar_rotina',
    ativo: true,
  },
  {
    id: 'local-cliente-risco',
    codigo: 'cliente-risco-oportunidade',
    nome: 'Cliente em risco vira oportunidade',
    descricao: 'Reativa clientes sem compra recente e alto historico.',
    evento: 'cliente_risco',
    acao: 'criar_oportunidade',
    ativo: false,
  },
]

export async function listAutomacaoRegras(): Promise<AutomacaoRegra[]> {
  const supabase = await getSupabase()
  if (!supabase) return defaultRules

  const { data, error } = await supabase
    .from('automacao_regras')
    .select('id,codigo,nome,descricao,evento,acao,ativo,atualizado_em')
    .order('nome', { ascending: true })

  if (error) throw error
  return (data as AutomacaoRegraRow[] | null ?? []).map(mapAutomacaoRegra)
}

export async function setAutomacaoRegraAtiva(codigo: string, ativo: boolean): Promise<AutomacaoRegra> {
  const supabase = await getSupabase()
  if (!supabase) {
    const rule = defaultRules.find((item) => item.codigo === codigo)
    if (!rule) throw new Error('Regra de automacao nao encontrada.')
    return { ...rule, ativo }
  }

  const { data, error } = await supabase
    .from('automacao_regras')
    .update({ ativo })
    .eq('codigo', codigo)
    .select('id,codigo,nome,descricao,evento,acao,ativo,atualizado_em')
    .single()

  if (error) throw error
  await supabase.from('automacao_logs').insert({
    regra_codigo: codigo,
    entidade_tipo: 'automacao_regra',
    entidade_id: null,
    resultado: ativo ? 'Regra ativada pelo painel gerencial.' : 'Regra desativada pelo painel gerencial.',
  })
  return mapAutomacaoRegra(data as AutomacaoRegraRow)
}

function mapAutomacaoRegra(row: AutomacaoRegraRow): AutomacaoRegra {
  return {
    id: row.id,
    codigo: row.codigo,
    nome: row.nome,
    descricao: row.descricao ?? undefined,
    evento: row.evento,
    acao: row.acao,
    ativo: row.ativo,
    atualizadoEm: row.atualizado_em ?? undefined,
  }
}
