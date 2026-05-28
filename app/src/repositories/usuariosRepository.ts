import { vendedores as mockUsuarios } from '../data/mockData'
import { getSupabase } from '../lib/supabase'
import type { Vendedor } from '../types'

type UsuarioRow = {
  id: string
  nome: string
  email: string
  role: Vendedor['role']
  ativo: boolean
}

export async function listUsuarios(): Promise<Vendedor[]> {
  const supabase = await getSupabase()
  if (!supabase) return mockUsuarios

  const { data, error } = await supabase
    .from('users')
    .select('id,nome,email,role,ativo')
    .eq('ativo', true)
    .order('nome', { ascending: true })

  if (error) throw error

  return (data as UsuarioRow[]).map((row) => ({
    id: row.id,
    nome: row.nome,
    email: row.email,
    role: row.role,
  }))
}
