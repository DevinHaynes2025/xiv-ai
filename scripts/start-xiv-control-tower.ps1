param([switch]$Once)
$ErrorActionPreference = 'SilentlyContinue'
$root = Join-Path (Get-Location) '.xiv-runtime'
$receipts = Join-Path $root 'receipts'
New-Item -ItemType Directory -Force -Path $receipts | Out-Null
$ollamaReachable = $false
try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2; $ollamaReachable = ($r.StatusCode -eq 200) } catch {}
$receipt = [ordered]@{
  status = if ($ollamaReachable) { 'DEGRADED' } else { 'UNVERIFIED' }
  timestamp = (Get-Date).ToUniversalTime().ToString('o')
  localhostOnly = $true
  productionMutationAllowed = $false
  ollamaReachable = $ollamaReachable
  gpu = 'UNVERIFIED'
  note = 'ACTIVE process status requires separate PID and heartbeat receipts.'
}
$path = Join-Path $receipts 'control-tower-startup.json'
$receipt | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 $path
Write-Output $path
if (-not $Once) { Write-Output '12D-71 startup receipt written; long-running daemon start remains explicit.' }
