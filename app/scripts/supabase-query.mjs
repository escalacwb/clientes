import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'

loadEnvFile('.env')
loadEnvFile('.env.local')

const args = process.argv.slice(2)
const outputIndex = args.findIndex((arg) => arg === '--json' || arg === '--csv' || arg === '--table')
const output = outputIndex >= 0 ? args.splice(outputIndex, 1)[0].replace('--', '') : 'table'
const dbUrl = process.env.SUPABASE_DB_DIRECT_URL || process.env.SUPABASE_DB_URL

if (!dbUrl) {
  console.error('SUPABASE_DB_URL nao configurada. Preencha .env.local antes de rodar SQL remoto.')
  process.exit(1)
}

if (args.length === 0) {
  console.error('Uso: npm run sb:sql -- "select now();" ou npm run sb:sql -- supabase/schema.sql')
  process.exit(1)
}

const maybeFile = path.resolve(args[0])
const cliArgs = ['supabase', 'db', 'query', '--db-url', dbUrl]

if (output !== 'table') {
  cliArgs.push('--output', output)
}

if (fs.existsSync(maybeFile)) {
  cliArgs.push('--file', maybeFile)
} else {
  cliArgs.push(args.join(' '))
}

const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', cliArgs, {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

if (result.error) {
  console.error(result.error.message)
}

process.exit(result.status ?? 1)

function loadEnvFile(fileName) {
  const filePath = path.resolve(fileName)
  if (!fs.existsSync(filePath)) return

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  lines.forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const separator = trimmed.indexOf('=')
    if (separator === -1) return

    const key = trimmed.slice(0, separator).trim()
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')
    if (!process.env[key]) process.env[key] = value
  })
}
