param(
  [string]$InFile = (Join-Path $PSScriptRoot '..\secrets\capital-supabase.dpapi.json'),
  [switch]$Print
)

if (-not (Test-Path $InFile)) {
  throw "DPAPI env file not found: $InFile"
}

$vault = Get-Content -Raw -LiteralPath $InFile | ConvertFrom-Json
if ($vault.format -ne 'powershell-dpapi-env-v1') {
  throw "Unsupported DPAPI env format: $($vault.format)"
}

$secure = ConvertTo-SecureString $vault.cipherText
$plainText = [Runtime.InteropServices.Marshal]::PtrToStringUni(
  [Runtime.InteropServices.Marshal]::SecureStringToGlobalAllocUnicode($secure)
)

try {
  $payload = $plainText | ConvertFrom-Json
  foreach ($property in $payload.PSObject.Properties) {
    if ($null -ne $property.Value -and "$($property.Value)" -ne '') {
      [Environment]::SetEnvironmentVariable($property.Name, "$($property.Value)", 'Process')
      if ($Print) {
        Write-Host "$($property.Name)=<loaded>"
      }
    }
  }
} finally {
  if ($plainText) {
    $plainText = $null
  }
}
