import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

let cachedClient: SupabaseClient | null = null

export async function getSupabase() {
  if (!isSupabaseConfigured) return null
  if (cachedClient) return cachedClient

  const { createClient } = await import('@supabase/supabase-js')
  cachedClient = createClient(supabaseUrl!, supabaseAnonKey!)
  return cachedClient
}
