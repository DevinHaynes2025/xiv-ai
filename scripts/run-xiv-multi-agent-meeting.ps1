param(
  [string]$Objective = 'Review XIV offline architecture and propose the next bounded user story.'
)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$aiDir = Join-Path $repoRoot 'services\ai'
if (-not (Test-Path $aiDir)) { throw "Missing services\ai at $aiDir" }
try {
  Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -Method Get -TimeoutSec 3 | Out-Null
} catch {
  throw 'Ollama is not reachable at http://127.0.0.1:11434'
}
$env:XIV_MEETING_OBJECTIVE = $Objective
Push-Location $aiDir
try {
  npx.cmd tsx runtime\offline-team\ollama-meeting-runner.ts
} finally {
  Pop-Location
}
