import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

let cachedClient: SupabaseClient | null = null
let cachedClientPromise: Promise<SupabaseClient> | null = null

export async function getSupabase() {
  if (!isSupabaseConfigured) return null
  if (cachedClient) return cachedClient
  if (cachedClientPromise) return cachedClientPromise

  cachedClientPromise = import('@supabase/supabase-js').then(({ createClient }) => {
    cachedClient = createClient(supabaseUrl!, supabaseAnonKey!)
    return cachedClient
  })

  return cachedClientPromise
}
