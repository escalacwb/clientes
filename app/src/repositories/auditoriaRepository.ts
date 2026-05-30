import { alteracoes as mockAlteracoes } from '../data/mockData'
import { getSupabase } from '../lib/supabase'
import type { ClienteAlteracao } from '../types'

type AlteracaoRow = {
  id: string
  cliente_id: string
  usuario_id: string | null
  campo: string
  valor_anterior: string | null
  valor_novo: string | null
  origem: string | null
  criado_em: string
  clientes?: { nome: string } | null
  usuario?: { nome: string } | null
}

export type AuditoriaEvento = {
  id: string
  data: string
  categoria: 'cliente' | 'orcamento' | 'automacao' | 'saneamento'
  titulo: string
  detalhe: string
  entidade?: string
  usuarioNome?: string
  severidade: 'info' | 'atencao' | 'critico'
}

type OrcamentoAprovacaoAuditRow = {
  id: string
  acao: string
  motivo: string | null
  criado_em: string
  users?: { nome: string | null } | Array<{ nome: string | null }> | null
  orcamentos?: {
    id: string
    valor_total: number | null
    clientes?: { nome: string | null } | Array<{ nome: string | null }> | null
  } | Array<{
    id: string
    valor_total: number | null
    clientes?: { nome: string | null } | Array<{ nome: string | null }> | null
  }> | null
}

type AutomacaoLogAuditRow = {
  id: string
  regra_codigo: string
  entidade_tipo: string
  entidade_id: string | null
  resultado: string
  criado_em: string
}

type SaneamentoAuditRow = {
  issue_id: string
  issue_type: string
  assigned_to: string | null
  resolved_at: string | null
  resolved_by: string | null
  resolution_note: string | null
  updated_at: string | null
}

export async function listClienteAlteracoes(): Promise<ClienteAlteracao[]> {
  const supabase = await getSupabase()
  if (!supabase) return mockAlteracoes

  const { data, error } = await supabase
    .from('cliente_alteracoes')
    .select('*, clientes(nome), usuario:users!cliente_alteracoes_usuario_id_fkey(nome)')
    .order('criado_em', { ascending: false })
    .limit(100)

  if (error) throw error

  return (data as AlteracaoRow[]).map((row) => ({
    id: row.id,
    clienteId: row.cliente_id,
    clienteNome: row.clientes?.nome ?? 'Cliente',
    usuarioNome: row.usuario?.nome ?? 'Sistema',
    campo: row.campo,
    valorAnterior: row.valor_anterior ?? undefined,
    valorNovo: row.valor_novo ?? undefined,
    origem: row.origem ?? 'app',
    criadoEm: row.criado_em,
  }))
}

export async function listAuditoriaEventos(): Promise<AuditoriaEvento[]> {
  const supabase = await getSupabase()
  if (!supabase) {
    return mockAlteracoes.map((alteracao) => ({
      id: `cliente-${alteracao.id}`,
      data: alteracao.criadoEm,
      categoria: 'cliente',
      titulo: `${alteracao.campo} alterado`,
      detalhe: `${alteracao.valorAnterior ?? 'Vazio'} -> ${alteracao.valorNovo ?? 'Vazio'}`,
      entidade: alteracao.clienteNome,
      usuarioNome: alteracao.usuarioNome,
      severidade: isSensitiveAuditField(alteracao.campo) ? 'atencao' : 'info',
    }))
  }

  const [alteracoes, aprovacoes, automacoes, saneamento] = await Promise.allSettled([
    listClienteAlteracoes(),
    supabase
      .from('orcamento_aprovacoes')
      .select('id,acao,motivo,criado_em,users!orcamento_aprovacoes_usuario_id_fkey(nome),orcamentos(id,valor_total,clientes(nome))')
      .order('criado_em', { ascending: false })
      .limit(80),
    supabase
      .from('automacao_logs')
      .select('id,regra_codigo,entidade_tipo,entidade_id,resultado,criado_em')
      .order('criado_em', { ascending: false })
      .limit(80),
    supabase
      .from('importacao_saneamento_resolucoes')
      .select('issue_id,issue_type,assigned_to,resolved_at,resolved_by,resolution_note,updated_at')
      .order('updated_at', { ascending: false })
      .limit(80),
  ])

  const events: AuditoriaEvento[] = []

  if (alteracoes.status === 'fulfilled') {
    events.push(...alteracoes.value.map((alteracao) => ({
      id: `cliente-${alteracao.id}`,
      data: alteracao.criadoEm,
      categoria: 'cliente' as const,
      titulo: `${alteracao.campo} alterado`,
      detalhe: `${alteracao.valorAnterior ?? 'Vazio'} -> ${alteracao.valorNovo ?? 'Vazio'}`,
      entidade: alteracao.clienteNome,
      usuarioNome: alteracao.usuarioNome,
      severidade: isSensitiveAuditField(alteracao.campo) ? 'atencao' as const : 'info' as const,
    })))
  }

  if (aprovacoes.status === 'fulfilled' && !aprovacoes.value.error) {
    const rows = (aprovacoes.value.data as unknown as OrcamentoAprovacaoAuditRow[] | null) ?? []
    events.push(...rows.map((row) => ({
      id: `orcamento-${row.id}`,
      data: row.criado_em,
      categoria: 'orcamento' as const,
      titulo: `Proposta ${approvalAuditLabel(row.acao)}`,
      detalhe: row.motivo || `Valor: ${Number(firstRelation(row.orcamentos)?.valor_total ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      entidade: firstRelation(firstRelation(row.orcamentos)?.clientes)?.nome ?? firstRelation(row.orcamentos)?.id ?? 'Orcamento',
      usuarioNome: firstRelation(row.users)?.nome ?? 'Sistema',
      severidade: row.acao === 'rejeitada' ? 'critico' as const : row.acao === 'solicitada' ? 'atencao' as const : 'info' as const,
    })))
  }

  if (automacoes.status === 'fulfilled' && !automacoes.value.error) {
    const rows = (automacoes.value.data as AutomacaoLogAuditRow[] | null) ?? []
    events.push(...rows.map((row) => ({
      id: `automacao-${row.id}`,
      data: row.criado_em,
      categoria: 'automacao' as const,
      titulo: row.regra_codigo,
      detalhe: row.resultado,
      entidade: [row.entidade_tipo, row.entidade_id].filter(Boolean).join(' '),
      usuarioNome: 'Sistema',
      severidade: row.resultado.toLowerCase().includes('erro') ? 'critico' as const : 'info' as const,
    })))
  }

  if (saneamento.status === 'fulfilled' && !saneamento.value.error) {
    const rows = (saneamento.value.data as SaneamentoAuditRow[] | null) ?? []
    events.push(...rows.map((row) => ({
      id: `saneamento-${row.issue_id}`,
      data: row.resolved_at ?? row.updated_at ?? new Date().toISOString(),
      categoria: 'saneamento' as const,
      titulo: row.resolved_at ? 'Saneamento resolvido' : 'Saneamento atribuido',
      detalhe: row.resolution_note || row.issue_type,
      entidade: row.issue_id,
      usuarioNome: row.resolved_by ?? row.assigned_to ?? 'Sistema',
      severidade: row.resolved_at ? 'info' as const : 'atencao' as const,
    })))
  }

  return events
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 200)
}

function isSensitiveAuditField(field: string) {
  const normalized = field.toLowerCase()
  return ['whatsapp', 'telefone', 'vendedor', 'responsavel', 'status', 'lead', 'nao_contatar'].some((item) => normalized.includes(item))
}

function approvalAuditLabel(action: string) {
  if (action === 'solicitada') return 'aguardando aprovacao'
  if (action === 'aprovada') return 'aprovada'
  if (action === 'rejeitada') return 'rejeitada'
  if (action === 'enviada') return 'enviada'
  return action
}

function firstRelation<T>(value: T | T[] | null | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value ?? undefined
}
