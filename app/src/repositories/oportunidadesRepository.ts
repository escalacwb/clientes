import { buildOportunidades } from '../lib/oportunidades'
import { getSupabase } from '../lib/supabase'
import type { Cliente, Oportunidade, Orcamento } from '../types'

type OportunidadeRow = {
  cliente_id: string
  cliente_nome: string
  tipo: string
  motivo: string
  proxima_acao: string
  prioridade: number
  bloqueada: boolean
}

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
    bloqueada: row.bloqueada,
  }))
}
