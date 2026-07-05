param(
  [string]$OutFile = (Join-Path $PSScriptRoot '..\secrets\capital-supabase.dpapi.json')
)

$required = @(
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_PROJECT_REF',
  'SUPABASE_DB_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
)

$missing = $required | Where-Object { -not [Environment]::GetEnvironmentVariable($_, 'Process') }
if ($missing.Count -gt 0) {
  throw "Missing required environment variables: $($missing -join ', ')"
}

$payload = [ordered]@{
  VITE_SUPABASE_URL = $env:VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY = $env:VITE_SUPABASE_ANON_KEY
  EXPO_PUBLIC_SUPABASE_URL = $env:EXPO_PUBLIC_SUPABASE_URL
  EXPO_PUBLIC_SUPABASE_ANON_KEY = $env:EXPO_PUBLIC_SUPABASE_ANON_KEY
  NEXT_PUBLIC_SUPABASE_URL = $env:NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = $env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  SUPABASE_PROJECT_REF = $env:SUPABASE_PROJECT_REF
  SUPABASE_DB_URL = $env:SUPABASE_DB_URL
  SUPABASE_DB_DIRECT_URL = $env:SUPABASE_DB_DIRECT_URL
  SUPABASE_SERVICE_ROLE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY
  SUPABASE_ACCESS_TOKEN = $env:SUPABASE_ACCESS_TOKEN
  SUPABASE_DB_SHA256 = $env:SUPABASE_DB_SHA256
  DB_URL = $env:DB_URL
  PATIO_DB_URL = $env:PATIO_DB_URL
  PLACA_API_TOKEN = $env:PLACA_API_TOKEN
  TELEGRAM_TOKEN = $env:TELEGRAM_TOKEN
  TELEGRAM_CHAT_ID = $env:TELEGRAM_CHAT_ID
  TELEGRAM_FATURAMENTO_CHAT_ID = $env:TELEGRAM_FATURAMENTO_CHAT_ID
  OPENAI_API_KEY = $env:OPENAI_API_KEY
  OPENAI_MODEL = $env:OPENAI_MODEL
  OPENAI_VISION_MODEL = $env:OPENAI_VISION_MODEL
}

$json = $payload | ConvertTo-Json -Compress
$secure = ConvertTo-SecureString $json -AsPlainText -Force
$cipherText = ConvertFrom-SecureString $secure

$directory = Split-Path -Parent $OutFile
if (-not (Test-Path $directory)) {
  New-Item -ItemType Directory -Path $directory | Out-Null
}

[ordered]@{
  format = 'powershell-dpapi-env-v1'
  scope = 'CurrentUser'
  project = 'capital-truck-crm'
  projectRef = $env:SUPABASE_PROJECT_REF
  createdAt = (Get-Date).ToString('o')
  cipherText = $cipherText
} | ConvertTo-Json | Set-Content -LiteralPath $OutFile -Encoding UTF8

Write-Host "DPAPI env written to $OutFile"
