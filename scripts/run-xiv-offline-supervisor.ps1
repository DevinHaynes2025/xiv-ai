param(
  [int]$IntervalSeconds = 30,
  [switch]$Once
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$aiDir = Join-Path $repoRoot 'services\ai'

if (-not (Test-Path $aiDir)) { throw "Missing services\ai at $aiDir" }

function Test-Ollama {
  try {
    Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -Method Get -TimeoutSec 3 | Out-Null
    return $true
  } catch { return $false }
}

if (-not (Test-Ollama)) {
  $ollama = Get-Command ollama -ErrorAction SilentlyContinue
  if (-not $ollama) { throw 'Ollama command not found' }
  Start-Process -FilePath $ollama.Source -ArgumentList 'serve' -WindowStyle Hidden
  Start-Sleep -Seconds 2
}

Push-Location $aiDir
try {
  do {
    npx.cmd tsx runtime\offline-team\supervisor-cli.ts
    if ($Once) { break }
    Start-Sleep -Seconds ([Math]::Max(10, $IntervalSeconds))
  } while ($true)
} finally {
  Pop-Location
}
