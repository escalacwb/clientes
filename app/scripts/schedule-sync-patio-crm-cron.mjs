import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import pg from 'pg'

loadEnvFile('.env')
loadEnvFile('.env.local')
loadEnvFile(path.resolve('secrets', 'sync-patio-crm.edge.env'))

const dbUrl = process.env.SUPABASE_DB_DIRECT_URL || process.env.SUPABASE_DB_URL
const projectUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const syncSecret = process.env.SYNC_PATIO_CRM_SECRET
const jobName = process.env.PATIO_CRM_SYNC_CRON_JOB || 'sync-patio-crm-every-5-min'
const schedule = process.env.PATIO_CRM_SYNC_CRON || '*/5 * * * *'
const functionUrl = `${projectUrl}/functions/v1/sync-patio-crm`

if (!dbUrl) fail('SUPABASE_DB_DIRECT_URL ou SUPABASE_DB_URL nao configurada.')
if (!projectUrl) fail('VITE_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_URL nao configurada.')
if (!syncSecret) fail('SYNC_PATIO_CRM_SECRET nao configurado em secrets/sync-patio-crm.edge.env.')

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  await client.query('create extension if not exists pg_net')
  await client.query('create extension if not exists pg_cron')
  await client.query('create schema if not exists vault')
  await client.query('create extension if not exists supabase_vault with schema vault')

  await replaceVaultSecret('sync_patio_crm_function_url', functionUrl, 'URL da Edge Function de sincronizacao Patio -> CRM')
  await replaceVaultSecret('sync_patio_crm_secret', syncSecret, 'Header secreto para chamar a Edge Function Patio -> CRM')

  await client.query('select cron.unschedule(jobname) from cron.job where jobname = $1', [jobName])
  await client.query(`
    select cron.schedule(
      $1,
      $2,
      $job$
        select net.http_post(
          url := (select decrypted_secret from vault.decrypted_secrets where name = 'sync_patio_crm_function_url'),
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-sync-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'sync_patio_crm_secret')
          ),
          body := '{"mode":"incremental","refreshOportunidades":true}'::jsonb
        ) as request_id;
      $job$
    )
  `, [jobName, schedule])

  console.log(JSON.stringify({
    ok: true,
    jobName,
    schedule,
    functionUrl,
  }, null, 2))
} finally {
  await client.end().catch(() => undefined)
}

async function replaceVaultSecret(name, value, description) {
  await client.query('delete from vault.secrets where name = $1', [name])
  await client.query('select vault.create_secret($1, $2, $3)', [value, name, description])
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

function fail(message) {
  console.error(message)
  process.exit(1)
}
