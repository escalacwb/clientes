import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

loadEnvFile('.env')
loadEnvFile('.env.local')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const email = process.argv[2] ?? 'admin@capitaltruck.local'
const password = process.argv[3] ?? process.env.SUPABASE_DEFAULT_USER_PASSWORD ?? 'Capital@2026'

if (!supabaseUrl || !anonKey) {
  console.error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, anonKey)

const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
if (authError) throw authError

const { data: profile, error: profileError } = await supabase
  .from('users')
  .select('id,nome,email,role')
  .eq('auth_user_id', authData.user.id)
  .single()
if (profileError) throw profileError

const { count, error: countError } = await supabase
  .from('clientes')
  .select('id', { count: 'exact', head: true })
  .is('excluido_em', null)
if (countError) throw countError

console.log(JSON.stringify({
  loggedInAs: profile,
  clientesVisibleis: count,
}, null, 2))

function loadEnvFile(fileName) {
  const filePath = path.resolve(fileName)
  if (!fs.existsSync(filePath)) return

  fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      const separator = trimmed.indexOf('=')
      if (separator === -1) return

      const key = trimmed.slice(0, separator).trim()
      const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')
      if (!process.env[key]) process.env[key] = value
    })
}
