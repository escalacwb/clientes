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

export async function listOportunidades(clientes: Cliente[], orcamentos: Orcamento[]): Promise<Oportunidade[]> {
  const supabase = await getSupabase()
  if (!supabase) return buildOportunidades(clientes, orcamentos)

  const { data, error } = await supabase
    .from('oportunidades_clientes')
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
  vendedorId?: string
}): Promise<{ oportunidades: Oportunidade[]; total: number }> {
  const supabase = await getSupabase()
  if (!supabase) return { oportunidades: [], total: 0 }

  const from = (input.page - 1) * input.pageSize
  const to = from + input.pageSize - 1
  let query = supabase
    .from('oportunidades_clientes')
    .select('*', { count: 'exact' })
    .order('bloqueada', { ascending: true })
    .order('tarefa_existente', { ascending: true })
    .order('prioridade', { ascending: false })
    .range(from, to)

  if (input.filter === 'ativas') query = query.eq('bloqueada', false).eq('tarefa_existente', false)
  if (input.filter === 'bloqueadas') {
    query = query.or('bloqueada.eq.true,tarefa_existente.eq.true')
  }
  if (input.vendedorId) query = query.eq('vendedor_id', input.vendedorId)

  const { data, error, count } = await query
  if (error) throw error

  return {
    oportunidades: (data as OportunidadeRow[] | null ?? []).map(mapOportunidade),
    total: count ?? 0,
  }
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
