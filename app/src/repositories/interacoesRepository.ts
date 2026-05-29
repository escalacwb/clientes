import { interacoes as mockInteracoes } from '../data/mockData'
import { getSupabase } from '../lib/supabase'
import type { Interacao, InteracaoInput } from '../types'

type InteracaoRow = {
  id: string
  cliente_id: string
  vendedor_id: string
  data_interacao: string
  canal: Interacao['canal']
  tipo: string
  resumo: string
  resultado: string
  proxima_acao: string | null
  data_proxima_acao: string | null
  campanha_id: string | null
  orcamento_id: string | null
}

export async function listInteracoes(limit = 200): Promise<Interacao[]> {
  const supabase = await getSupabase()
  if (!supabase) return mockInteracoes

  const { data, error } = await supabase
    .from('interacoes')
    .select('*')
    .order('data_interacao', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data as InteracaoRow[]).map(mapInteracao)
}

export async function createInteracao(input: InteracaoInput): Promise<Interacao> {
  const supabase = await getSupabase()
  if (!supabase) {
    return {
      id: `i-${Date.now()}`,
      data: input.data ?? new Date().toISOString(),
      ...input,
    }
  }

  if (input.campanhaId && input.canal === 'Campanha') {
    const existing = await findCampanhaInteracao(input)
    if (existing) return existing
  }

  const { data, error } = await supabase
    .from('interacoes')
    .insert({
      cliente_id: input.clienteId,
      vendedor_id: input.vendedorId,
      data_interacao: input.data ?? new Date().toISOString(),
      canal: input.canal,
      tipo: input.tipo,
      resumo: input.resumo,
      resultado: input.resultado,
      proxima_acao: input.proximaAcao ?? null,
      data_proxima_acao: input.dataProximaAcao ?? null,
      campanha_id: input.campanhaId ?? null,
      orcamento_id: input.orcamentoId ?? null,
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505' && input.campanhaId && input.canal === 'Campanha') {
      const existing = await findCampanhaInteracao(input)
      if (existing) return existing
    }
    throw error
  }

  return mapInteracao(data as InteracaoRow)
}

async function findCampanhaInteracao(input: InteracaoInput): Promise<Interacao | null> {
  const supabase = await getSupabase()
  if (!supabase || !input.campanhaId) return null

  const { data, error } = await supabase
    .from('interacoes')
    .select('*')
    .eq('cliente_id', input.clienteId)
    .eq('campanha_id', input.campanhaId)
    .eq('canal', 'Campanha')
    .eq('resultado', input.resultado)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data ? mapInteracao(data as InteracaoRow) : null
}

function mapInteracao(row: InteracaoRow): Interacao {
  return {
    id: row.id,
    clienteId: row.cliente_id,
    vendedorId: row.vendedor_id,
    data: row.data_interacao,
    canal: row.canal,
    tipo: row.tipo,
    resumo: row.resumo,
    resultado: row.resultado,
    proximaAcao: row.proxima_acao ?? undefined,
    dataProximaAcao: row.data_proxima_acao ?? undefined,
    campanhaId: row.campanha_id ?? undefined,
    orcamentoId: row.orcamento_id ?? undefined,
  }
}
