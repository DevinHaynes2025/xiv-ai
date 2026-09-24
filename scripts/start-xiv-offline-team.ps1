param(
  [switch]$InstallStartupTask
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$statusDir = Join-Path $repoRoot '.xiv-runtime'
$statusPath = Join-Path $statusDir 'offline-team-status.json'
New-Item -ItemType Directory -Force -Path $statusDir | Out-Null

function Test-Ollama {
  try {
    Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -Method Get -TimeoutSec 3 | Out-Null
    return $true
  } catch { return $false }
}

$ollamaReachable = Test-Ollama
if (-not $ollamaReachable) {
  $ollama = Get-Command ollama -ErrorAction SilentlyContinue
  if ($ollama) {
    Start-Process -FilePath $ollama.Source -ArgumentList 'serve' -WindowStyle Hidden
    Start-Sleep -Seconds 2
    $ollamaReachable = Test-Ollama
  }
}

$grokConfigured = $false
$grokReachable = $false
# Offline startup never inspects cloud credentials or probes a remote provider.

$status = [ordered]@{
  timestamp = (Get-Date).ToUniversalTime().ToString('o')
  ollamaReachable = $ollamaReachable
  grokConfigured = $grokConfigured
  grokReachable = $grokReachable
  offlineTeamMode = if ($ollamaReachable) { 'OLLAMA_PLUS_LOCAL' } else { 'LOCAL_RULES_FALLBACK' }
  productionMutationAllowed = $false
  note = 'Processes do not run while the host is powered off; resume from checkpoints after wake/restart.'
}
$status | ConvertTo-Json | Set-Content -Path $statusPath -Encoding UTF8
$status | ConvertTo-Json

if ($InstallStartupTask) {
  $taskName = 'XIV Offline Team Resume'
  $scriptPath = $MyInvocation.MyCommand.Path
  $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""
  $trigger = New-ScheduledTaskTrigger -AtLogOn
  Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Description 'Resume XIV local Ollama/offline team after user logon.' -Force | Out-Null
  Write-Host "Installed scheduled task: $taskName"
}
