param(
  [string]$Objective = "Review XIV AI priorities and recommend the next bounded user story.",
  [string]$Model = "qwen2.5-coder:7b"
)
$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$runtime = Join-Path $repo ".xiv-runtime\executive-cabinet"
New-Item -ItemType Directory -Force -Path $runtime | Out-Null
$timestamp = (Get-Date).ToUniversalTime().ToString("o")
$ollama = $false
try { Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 3 | Out-Null; $ollama = $true } catch {}
$receipt = [ordered]@{
  timestamp = $timestamp
  objective = $Objective
  model = $Model
  ollamaReachable = $ollama
  productionMutationAllowed = $false
  moneyMovementAllowed = $false
  note = "Use services/ai runtime executive cabinet runner for local Qwen role execution; this wrapper records host readiness only."
}
$out = Join-Path $runtime ((Get-Date -Format "yyyyMMdd-HHmmss") + "-powershell.json")
$receipt | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 $out
$receipt | ConvertTo-Json -Depth 5
