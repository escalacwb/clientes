param(
  [string]$OutFile = (Join-Path $PSScriptRoot '..\secrets\sync-patio-crm.edge.env')
)

function Read-EnvFile {
  param([string]$Path)
  $values = @{}
  if (-not (Test-Path -LiteralPath $Path)) {
    return $values
  }

  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) {
      return
    }
    $separator = $line.IndexOf('=')
    if ($separator -lt 1) {
      return
    }
    $key = $line.Substring(0, $separator).Trim()
    $value = $line.Substring($separator + 1).Trim().Trim('"').Trim("'")
    $values[$key] = $value
  }
  return $values
}

function New-Secret {
  $bytes = New-Object byte[] 32
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $rng.GetBytes($bytes)
  } finally {
    $rng.Dispose()
  }
  return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

$appDir = Resolve-Path (Join-Path $PSScriptRoot '..')
$crmEnv = Read-EnvFile (Join-Path $appDir '.env.local')
$patioEnv = Read-EnvFile (Join-Path $appDir '..\..\controle-patio\.env')
if (-not $patioEnv.ContainsKey('DB_URL')) {
  $patioEnv = Read-EnvFile (Join-Path $appDir '..\..\controle-patio-backup-20260601-095959\.env')
}

$crmDbUrl = $crmEnv['SUPABASE_DB_URL']
if (-not $crmDbUrl) {
  $crmDbUrl = $crmEnv['SUPABASE_DB_DIRECT_URL']
}

$patioDbUrl = $patioEnv['DB_URL']
if (-not $patioDbUrl) {
  $patioDbUrl = $patioEnv['DATABASE_URL']
}

if (-not $crmDbUrl) {
  throw 'SUPABASE_DB_URL ou SUPABASE_DB_DIRECT_URL nao encontrado no app/.env.local.'
}
if (-not $patioDbUrl) {
  throw 'DB_URL ou DATABASE_URL nao encontrado no .env do Patio.'
}

$existing = Read-EnvFile $OutFile
$syncSecret = $existing['SYNC_PATIO_CRM_SECRET']
if (-not $syncSecret) {
  $syncSecret = New-Secret
}

$directory = Split-Path -Parent $OutFile
if (-not (Test-Path -LiteralPath $directory)) {
  New-Item -ItemType Directory -Path $directory | Out-Null
}

@(
  "CRM_DB_URL=$crmDbUrl"
  "PATIO_DB_URL=$patioDbUrl"
  "SYNC_PATIO_CRM_SECRET=$syncSecret"
  'PATIO_CRM_SYNC_MODE=incremental'
  'PATIO_CRM_SYNC_LOOKBACK_MS=600000'
) | Set-Content -LiteralPath $OutFile -Encoding UTF8

Write-Host "Edge sync env written to $OutFile"
