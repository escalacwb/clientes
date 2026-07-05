param(
  [string]$OutFile = (Join-Path $PSScriptRoot '..\secrets\omsys-daily-import.edge.env')
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

function Resolve-Value {
  param(
    [hashtable]$Existing,
    [string]$Name,
    [string]$Default = '',
    [switch]$GenerateSecret
  )

  $envValue = [Environment]::GetEnvironmentVariable($Name, 'Process')
  if ($envValue) {
    return $envValue
  }
  if ($Existing.ContainsKey($Name) -and $Existing[$Name]) {
    return $Existing[$Name]
  }
  if ($GenerateSecret) {
    return New-Secret
  }
  return $Default
}

$existing = Read-EnvFile $OutFile

$values = [ordered]@{
  OMSYS_BASE_URL = Resolve-Value $existing 'OMSYS_BASE_URL' 'http://capitalpneus.omsys.info:8081/omsys'
  OMSYS_CNPJ = Resolve-Value $existing 'OMSYS_CNPJ'
  OMSYS_CNPJ_PASSWORD = Resolve-Value $existing 'OMSYS_CNPJ_PASSWORD'
  OMSYS_LOGIN = Resolve-Value $existing 'OMSYS_LOGIN'
  OMSYS_PASSWORD = Resolve-Value $existing 'OMSYS_PASSWORD'
  OMSYS_SERVICE_COMPANY_ID = Resolve-Value $existing 'OMSYS_SERVICE_COMPANY_ID' '2'
  OMSYS_TRUCK_COMPANY_ID = Resolve-Value $existing 'OMSYS_TRUCK_COMPANY_ID' '11'
  OMSYS_TIME_ZONE = Resolve-Value $existing 'OMSYS_TIME_ZONE' 'America/Cuiaba'
  OMSYS_IMPORT_OVERLAP_DAYS = Resolve-Value $existing 'OMSYS_IMPORT_OVERLAP_DAYS' '1'
  OMSYS_INITIAL_LOOKBACK_DAYS = Resolve-Value $existing 'OMSYS_INITIAL_LOOKBACK_DAYS' '3'
  OMSYS_IMPORT_INCLUDE_CATALOGS = Resolve-Value $existing 'OMSYS_IMPORT_INCLUDE_CATALOGS' 'true'
  OMSYS_IMPORT_INCLUDE_TECHNICIANS = Resolve-Value $existing 'OMSYS_IMPORT_INCLUDE_TECHNICIANS' 'true'
  OMSYS_TECHNICIANS_FUNCTION_ALLOWLIST = Resolve-Value $existing 'OMSYS_TECHNICIANS_FUNCTION_ALLOWLIST' 'ALINHADOR,BORRACHEIRO,MONTADOR,MECANICO,MECANICA,ELETRICISTA,SUSPENSAO'
  OMSYS_DAILY_IMPORT_SECRET = Resolve-Value $existing 'OMSYS_DAILY_IMPORT_SECRET' -GenerateSecret
  IMPORT_REFERENCE_FILES_SECRET = Resolve-Value $existing 'IMPORT_REFERENCE_FILES_SECRET' -GenerateSecret
  OMSYS_DAILY_IMPORT_CRON_JOB = Resolve-Value $existing 'OMSYS_DAILY_IMPORT_CRON_JOB' 'omsys-daily-import-1900'
  OMSYS_DAILY_IMPORT_CRON = Resolve-Value $existing 'OMSYS_DAILY_IMPORT_CRON' '0 23 * * *'
}

$missing = @('OMSYS_CNPJ', 'OMSYS_CNPJ_PASSWORD', 'OMSYS_LOGIN', 'OMSYS_PASSWORD') |
  Where-Object { -not $values[$_] }

if ($missing.Count -gt 0) {
  throw "Variaveis OMSYS ausentes no ambiente ou no arquivo existente: $($missing -join ', ')"
}

$directory = Split-Path -Parent $OutFile
if (-not (Test-Path -LiteralPath $directory)) {
  New-Item -ItemType Directory -Path $directory | Out-Null
}

$lines = $values.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }
$lines | Set-Content -LiteralPath $OutFile -Encoding UTF8

Write-Host "OMSYS daily import env written to $OutFile"
