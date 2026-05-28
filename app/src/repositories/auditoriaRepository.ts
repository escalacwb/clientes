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
  users?: { nome: string } | null
}

export async function listClienteAlteracoes(): Promise<ClienteAlteracao[]> {
  const supabase = await getSupabase()
  if (!supabase) return mockAlteracoes

  const { data, error } = await supabase
    .from('cliente_alteracoes')
    .select('*, clientes(nome), users(nome)')
    .order('criado_em', { ascending: false })
    .limit(100)

  if (error) throw error

  return (data as AlteracaoRow[]).map((row) => ({
    id: row.id,
    clienteId: row.cliente_id,
    clienteNome: row.clientes?.nome ?? 'Cliente',
    usuarioNome: row.users?.nome ?? 'Sistema',
    campo: row.campo,
    valorAnterior: row.valor_anterior ?? undefined,
    valorNovo: row.valor_novo ?? undefined,
    origem: row.origem ?? 'app',
    criadoEm: row.criado_em,
  }))
}
