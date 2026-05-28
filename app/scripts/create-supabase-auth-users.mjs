import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

loadEnvFile('.env')
loadEnvFile('.env.local')

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const defaultPassword = process.env.SUPABASE_DEFAULT_USER_PASSWORD || 'Capital@2026'

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
})

const { data: appUsers, error: usersError } = await supabase
  .from('users')
  .select('id,nome,email,auth_user_id,role')
  .eq('ativo', true)

if (usersError) throw usersError

const existingAuthUsers = await listAllAuthUsers()
const authByEmail = new Map(existingAuthUsers.map((user) => [user.email?.toLowerCase(), user]).filter(([email]) => email))

let created = 0
let linked = 0

for (const appUser of appUsers) {
  const email = appUser.email.toLowerCase()
  let authUser = authByEmail.get(email)

  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        nome: appUser.nome,
        role: appUser.role,
      },
    })
    if (error) throw error
    authUser = data.user
    created += 1
  }

  if (authUser && appUser.auth_user_id !== authUser.id) {
    const { error } = await supabase
      .from('users')
      .update({ auth_user_id: authUser.id })
      .eq('id', appUser.id)
    if (error) throw error
    linked += 1
  }
}

console.log(JSON.stringify({
  appUsers: appUsers.length,
  authUsersCreated: created,
  profilesLinked: linked,
  defaultPassword,
}, null, 2))

async function listAllAuthUsers() {
  const users = []
  let page = 1
  const perPage = 1000

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    users.push(...data.users)
    if (data.users.length < perPage) break
    page += 1
  }

  return users
}

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
