param(
  [string]$TaskName = 'CapitalTruck-PatioCrmSync',
  [int]$IntervalMinutes = 5
)

if ($IntervalMinutes -lt 1) {
  throw 'IntervalMinutes must be at least 1.'
}

$appDir = Resolve-Path (Join-Path $PSScriptRoot '..')
$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
$argument = "/c cd /d `"$appDir`" && `"$npm`" run sync:patio:crm:incremental"

$action = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument $argument -WorkingDirectory $appDir
$trigger = New-ScheduledTaskTrigger `
  -Once `
  -At (Get-Date).AddMinutes(1) `
  -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) `
  -RepetitionDuration (New-TimeSpan -Days 3650)
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -MultipleInstances IgnoreNew `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 30)

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description 'Sincroniza periodicamente dados do Supabase Patio para o Supabase CRM.' `
  -Force | Out-Null

Write-Host "Scheduled task registered: $TaskName every $IntervalMinutes minute(s)."
