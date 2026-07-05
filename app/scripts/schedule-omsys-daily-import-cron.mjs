import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import pg from 'pg'

loadEnvFile('.env')
loadEnvFile('.env.local')
loadEnvFile(path.resolve('secrets', 'omsys-daily-import.edge.env'))

const dbUrl = process.env.SUPABASE_DB_DIRECT_URL || process.env.SUPABASE_DB_URL
const projectUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const importSecret = process.env.OMSYS_DAILY_IMPORT_SECRET
const jobName = process.env.OMSYS_DAILY_IMPORT_CRON_JOB || 'omsys-daily-import-1900'
const schedule = process.env.OMSYS_DAILY_IMPORT_CRON || '0 23 * * *'
const techniciansJobName = process.env.OMSYS_TECHNICIANS_CRON_JOB || 'omsys-tecnicos-sync-hourly'
const techniciansSchedule = process.env.OMSYS_TECHNICIANS_CRON || '15 * * * *'
const functionUrl = `${projectUrl}/functions/v1/omsys-daily-import`

if (!dbUrl) fail('SUPABASE_DB_DIRECT_URL ou SUPABASE_DB_URL nao configurada.')
if (!projectUrl) fail('VITE_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_URL nao configurada.')
if (!importSecret) fail('OMSYS_DAILY_IMPORT_SECRET nao configurado em secrets/omsys-daily-import.edge.env.')

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

  await replaceVaultSecret('omsys_daily_import_function_url', functionUrl, 'URL da Edge Function de importacao diaria OMSYS')
  await replaceVaultSecret('omsys_daily_import_secret', importSecret, 'Header secreto para chamar a Edge Function OMSYS')

  await client.query('select cron.unschedule(jobname) from cron.job where jobname = $1', [jobName])
  await scheduleEdgeFunction({
    jobName,
    schedule,
    body: { includeCatalogos: true },
  })

  await client.query('select cron.unschedule(jobname) from cron.job where jobname = $1', [techniciansJobName])
  await scheduleEdgeFunction({
    jobName: techniciansJobName,
    schedule: techniciansSchedule,
    body: { onlyTecnicos: true },
  })

  console.log(JSON.stringify({
    ok: true,
    jobs: [
      {
        jobName,
        schedule,
        localTimeReference: schedule === '0 23 * * *' ? '19:00 America/Cuiaba' : null,
      },
      {
        jobName: techniciansJobName,
        schedule: techniciansSchedule,
        localTimeReference: techniciansSchedule === '15 * * * *' ? '15 minutos de cada hora' : null,
      },
    ],
    functionUrl,
  }, null, 2))
} finally {
  await client.end().catch(() => undefined)
}

async function scheduleEdgeFunction({ jobName, schedule, body }) {
  const command = `
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'omsys_daily_import_function_url'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-omsys-import-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'omsys_daily_import_secret')
      ),
      body := '${JSON.stringify(body).replace(/'/g, "''")}'::jsonb
    ) as request_id;
  `

  await client.query(`
    select cron.schedule(
      $1,
      $2,
      $3
    )
  `, [jobName, schedule, command])
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
