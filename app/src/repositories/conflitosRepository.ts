import { conflitos as mockConflitos } from '../data/mockData'
import { getSupabase } from '../lib/supabase'
import type { ImportacaoConflito } from '../types'

type ConflitoRow = {
  id: string
  importacao_id: string
  tipo_conflito: string
  dados_recebidos: Record<string, unknown>
  possiveis_clientes: unknown
  resolvido: boolean
}

export async function listConflitos(limit = 200): Promise<ImportacaoConflito[]> {
  const supabase = await getSupabase()
  if (!supabase) return mockConflitos

  const { data, error } = await supabase
    .from('importacao_conflitos')
    .select('*')
    .order('resolvido', { ascending: true })
    .limit(limit)

  if (error) throw error

  return (data as ConflitoRow[]).map((row) => mapConflito(row))
}

export async function resolveConflito(
  id: string,
  decisao: NonNullable<ImportacaoConflito['decisao']>,
): Promise<ImportacaoConflito | null> {
  const supabase = await getSupabase()
  if (!supabase) {
    const conflito = mockConflitos.find((item) => item.id === id)
    return conflito ? { ...conflito, resolvido: true, decisao } : null
  }

  const { data, error } = await supabase
    .from('importacao_conflitos')
    .update({
      resolvido: true,
      dados_recebidos: { decisao },
      resolvido_em: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error

  return mapConflito(data as ConflitoRow, decisao)
}

function mapConflito(row: ConflitoRow, decisao?: NonNullable<ImportacaoConflito['decisao']>): ImportacaoConflito {
  const possiveisClientes = Array.isArray(row.possiveis_clientes)
    ? row.possiveis_clientes.map(String)
    : []

  return {
    id: row.id,
    importacaoId: row.importacao_id,
    tipo: row.tipo_conflito,
    resumo: conflictLabel(row.tipo_conflito),
    dadosRecebidos: JSON.stringify(row.dados_recebidos),
    possiveisClientes,
    resolvido: row.resolvido,
    decisao,
  }
}

function conflictLabel(tipo: string) {
  const labels: Record<string, string> = {
    mesmo_telefone: 'Mesmo telefone encontrado em clientes diferentes.',
    cpf_nome_divergente: 'Documento existente com nome divergente.',
    cliente_sem_documento: 'Cliente recebido sem documento.',
  }
  return labels[tipo] ?? tipo
}
