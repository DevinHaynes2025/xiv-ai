param([switch]$Once)
$ErrorActionPreference = 'Stop'
$root = Join-Path (Get-Location) '.xiv-runtime'
New-Item -ItemType Directory -Force -Path $root | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $root 'receipts') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $root 'journals') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $root 'checkpoints') | Out-Null

$ollamaReachable = $false
try {
  Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/version' -TimeoutSec 2 | Out-Null
  $ollamaReachable = $true
} catch { $ollamaReachable = $false }

$receipt = [ordered]@{
  generatedAt = (Get-Date).ToString('o')
  localhostOnly = $true
  runtimeWritable = (Test-Path $root)
  ollamaReachable = $ollamaReachable
  cpuDetected = $true
  gpuVerified = $false
  productionMutationAllowed = $false
  externalNetworkByDefault = $false
  status = if ($ollamaReachable) { 'DEGRADED' } else { 'UNVERIFIED' }
  note = 'HEALTHY requires fresh agent/checkpoint receipts; GPU remains unverified until measured.'
}
$receipt | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 (Join-Path $root 'receipts\bootstrap-health.json')
Write-Output ($receipt | ConvertTo-Json -Compress)
if (-not $Once) { Write-Output 'XIV runtime bootstrap complete; no background daemon was started by this script.' }
