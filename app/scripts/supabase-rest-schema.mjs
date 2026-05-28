import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

loadEnvFile('.env')
loadEnvFile('.env.local')

const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  console.error('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY ou VITE_SUPABASE_ANON_KEY.')
  process.exit(1)
}

const response = await fetch(`${url}/rest/v1/`, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
  },
})

if (!response.ok) {
  console.error(`Falha ao consultar schema REST: ${response.status} ${response.statusText}`)
  process.exit(1)
}

const spec = await response.json()
const definitions = spec.definitions ?? spec.components?.schemas ?? {}
const tables = Object.keys(definitions).sort()

console.log(JSON.stringify({ tables }, null, 2))

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
