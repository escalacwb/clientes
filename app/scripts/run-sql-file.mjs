import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import pg from 'pg'

loadEnvFile('.env')
loadEnvFile('.env.local')

const filePath = process.argv[2]
const dbUrl = process.env.SUPABASE_DB_DIRECT_URL || process.env.SUPABASE_DB_URL

if (!filePath) {
  console.error('Uso: node scripts/run-sql-file.mjs supabase/schema.sql')
  process.exit(1)
}

if (!dbUrl) {
  console.error('SUPABASE_DB_DIRECT_URL ou SUPABASE_DB_URL nao configurada.')
  process.exit(1)
}

const absolutePath = path.resolve(filePath)
if (!fs.existsSync(absolutePath)) {
  console.error(`Arquivo SQL nao encontrado: ${absolutePath}`)
  process.exit(1)
}

const sql = fs.readFileSync(absolutePath, 'utf8')
const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  await client.query(sql)
  console.log(`SQL aplicado com sucesso: ${path.relative(process.cwd(), absolutePath)}`)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await client.end()
}

function loadEnvFile(fileName) {
  const envPath = path.resolve(fileName)
  if (!fs.existsSync(envPath)) return

  fs.readFileSync(envPath, 'utf8')
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
