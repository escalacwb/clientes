import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'

loadEnvFile('.env')
loadEnvFile('.env.local')

const args = process.argv.slice(2)

if (args.length === 0) {
  console.error('Uso: npm run sb -- <comando supabase>. Ex.: npm run sb -- functions list --project-ref rdaahndxfmaxkfnyrhlc')
  process.exit(1)
}

const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['supabase', ...args], {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

process.exit(result.status ?? 1)

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
