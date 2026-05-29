import { buildOportunidades } from '../lib/oportunidades'
import { getSupabase } from '../lib/supabase'
import type { Cliente, Oportunidade, Orcamento } from '../types'

type OportunidadeRow = {
  cliente_id: string
  cliente_nome: string
  vendedor_id: string | null
  tipo: string
  motivo: string
  proxima_acao: string
  prioridade: number
  bloqueada: boolean
  tarefa_existente: boolean | null
}

export type OportunidadeFilter = 'ativas' | 'bloqueadas' | 'todas'

export type OportunidadeResumo = {
  tipo: string
  total: number
  ativas: number
  bloqueadas: number
  prioridadeMedia: number
  prioridadeMaxima: number
}

type OportunidadeResumoRow = {
  tipo: string
  total: number
  ativas: number
  bloqueadas: number
  prioridade_media: number
  prioridade_maxima: number
}

export async function listOportunidades(clientes: Cliente[], orcamentos: Orcamento[]): Promise<Oportunidade[]> {
  const supabase = await getSupabase()
  if (!supabase) return buildOportunidades(clientes, orcamentos)

  const { data, error } = await supabase
    .from('oportunidades_cache')
    .select('*')
    .order('bloqueada', { ascending: true })
    .order('prioridade', { ascending: false })

  if (error) throw error

  return (data as OportunidadeRow[]).map((row) => ({
    id: `${row.cliente_id}-${row.tipo}`,
    clienteId: row.cliente_id,
    clienteNome: row.cliente_nome,
    tipo: row.tipo,
    motivo: row.motivo,
    proximaAcao: row.proxima_acao,
    prioridade: row.prioridade,
    bloqueada: row.bloqueada || Boolean(row.tarefa_existente),
    tarefaExistente: Boolean(row.tarefa_existente),
  }))
}

export async function listOportunidadesPage(input: {
  page: number
  pageSize: number
  filter: OportunidadeFilter
  tipo?: string
  vendedorId?: string
}): Promise<{ oportunidades: Oportunidade[]; total: number }> {
  const supabase = await getSupabase()
  if (!supabase) return { oportunidades: [], total: 0 }

  const from = (input.page - 1) * input.pageSize
  const to = from + input.pageSize - 1
  let query = supabase
    .from('oportunidades_cache')
    .select('*', { count: 'exact' })
    .order('bloqueada', { ascending: true })
    .order('tarefa_existente', { ascending: true })
    .order('prioridade', { ascending: false })
    .range(from, to)

  if (input.filter === 'ativas') query = query.eq('bloqueada', false).eq('tarefa_existente', false)
  if (input.filter === 'bloqueadas') {
    query = query.or('bloqueada.eq.true,tarefa_existente.eq.true')
  }
  if (input.tipo && input.tipo !== 'todos') query = query.eq('tipo', input.tipo)
  if (input.vendedorId) query = query.eq('vendedor_id', input.vendedorId)

  const { data, error, count } = await query
  if (error) throw error

  return {
    oportunidades: (data as OportunidadeRow[] | null ?? []).map(mapOportunidade),
    total: count ?? 0,
  }
}

export async function listOportunidadesResumo(vendedorId?: string): Promise<OportunidadeResumo[]> {
  const supabase = await getSupabase()
  if (!supabase) return []

  let query = supabase
    .from('vw_oportunidades_resumo_cache')
    .select('*')
    .order('ativas', { ascending: false })
    .order('prioridade_maxima', { ascending: false })

  if (vendedorId) query = query.eq('vendedor_id', vendedorId)

  const { data, error } = await query
  if (error) throw error

  const grouped = new Map<string, OportunidadeResumo>()
  ;(data as Array<OportunidadeResumoRow & { vendedor_id?: string | null }> | null ?? []).forEach((row) => {
    const current = grouped.get(row.tipo) ?? {
      tipo: row.tipo,
      total: 0,
      ativas: 0,
      bloqueadas: 0,
      prioridadeMedia: 0,
      prioridadeMaxima: 0,
    }
    const total = Number(row.total ?? 0)
    const priority = Number(row.prioridade_media ?? 0)
    grouped.set(row.tipo, {
      tipo: row.tipo,
      total: current.total + total,
      ativas: current.ativas + Number(row.ativas ?? 0),
      bloqueadas: current.bloqueadas + Number(row.bloqueadas ?? 0),
      prioridadeMedia: current.total + total ? Math.round(((current.prioridadeMedia * current.total) + (priority * total)) / (current.total + total)) : 0,
      prioridadeMaxima: Math.max(current.prioridadeMaxima, Number(row.prioridade_maxima ?? 0)),
    })
  })

  return [...grouped.values()].sort((a, b) => b.ativas - a.ativas || b.prioridadeMaxima - a.prioridadeMaxima)
}

export async function refreshOportunidadesCache(): Promise<number> {
  const supabase = await getSupabase()
  if (!supabase) return 0

  const { data, error } = await supabase.rpc('refresh_oportunidades_cache')
  if (error) throw error
  return Number(data ?? 0)
}

export async function markOportunidadeComTarefa(clienteId: string, tipo: string): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase) return

  const { error } = await supabase.rpc('marcar_oportunidade_com_tarefa', {
    p_cliente_id: clienteId,
    p_tipo: tipo,
  })
  if (error) throw error
}

function mapOportunidade(row: OportunidadeRow): Oportunidade {
  return {
    id: `${row.cliente_id}-${row.tipo}`,
    clienteId: row.cliente_id,
    clienteNome: row.cliente_nome,
    tipo: row.tipo,
    motivo: row.motivo,
    proximaAcao: row.proxima_acao,
    prioridade: row.prioridade,
    bloqueada: row.bloqueada || Boolean(row.tarefa_existente),
    tarefaExistente: Boolean(row.tarefa_existente),
  }
}
