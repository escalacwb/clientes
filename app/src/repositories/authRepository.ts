import { vendedores as mockUsuarios } from '../data/mockData'
import { getSupabase } from '../lib/supabase'
import type { SessaoUsuario } from '../types'

export async function getCurrentSession(): Promise<SessaoUsuario | null> {
  const supabase = await getSupabase()
  if (!supabase) return null

  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) return null

  const { data, error } = await supabase
    .from('users')
    .select('id,nome,email,role')
    .eq('auth_user_id', authData.user.id)
    .maybeSingle()

  if (error || !data) return null

  return {
    id: data.id,
    nome: data.nome,
    email: data.email,
    role: data.role,
    modo: 'supabase',
  }
}

export async function signInWithPassword(email: string, password: string): Promise<SessaoUsuario> {
  const supabase = await getSupabase()

  if (!supabase) {
    const user = mockUsuarios.find((usuario) => usuario.email === email) ?? mockUsuarios[0]
    return { ...user, modo: 'local' }
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error

  const session = await getCurrentSession()
  if (!session) throw new Error('Usuario autenticado sem perfil no app.')

  return session
}

export async function signOut(): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase) return

  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
