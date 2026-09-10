param(
  [int]$IntervalSeconds = 60,
  [switch]$Once
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$aiDir = Join-Path $repoRoot 'services\ai'
if (-not (Test-Path $aiDir)) { throw "Missing services\ai at $aiDir" }

function Test-Ollama {
  try { Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 3 | Out-Null; return $true }
  catch { return $false }
}

Push-Location $aiDir
try {
  do {
    $ollama = Test-Ollama
    npx.cmd tsx runtime\offline-team\agent-campus-runner.ts
    $status = [ordered]@{
      timestamp = (Get-Date).ToUniversalTime().ToString('o')
      ollamaReachable = $ollama
      campusReceipt = (Join-Path $repoRoot '.xiv-runtime\agent-campus-status.json')
      productionMutationAllowed = $false
    }
    $status | ConvertTo-Json | Set-Content (Join-Path $repoRoot '.xiv-runtime\agent-campus-powershell.json') -Encoding UTF8
    if ($Once) { break }
    Start-Sleep -Seconds ([Math]::Max(15, $IntervalSeconds))
  } while ($true)
} finally { Pop-Location }
