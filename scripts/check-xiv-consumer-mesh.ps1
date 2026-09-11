param([switch]$Once)
$ErrorActionPreference = 'SilentlyContinue'
$root = Join-Path (Get-Location) '.xiv-runtime\receipts'
New-Item -ItemType Directory -Force -Path $root | Out-Null
$ollamaReachable = $false
try {
  $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2
  $ollamaReachable = ($r.StatusCode -eq 200)
} catch {}
$receipt = [ordered]@{
  story = '12D-78'
  timestamp = (Get-Date).ToUniversalTime().ToString('o')
  ollamaReachable = $ollamaReachable
  mode = $(if ($ollamaReachable) { 'OFFLINE_LOCAL_AI' } else { 'OFFLINE_NO_VERIFIED_LLM' })
  rawPersonalDataSaleAllowed = $false
  rawLocationExportAllowed = $false
  emotionHighStakesUseAllowed = $false
  partnerClaimsRequireReceipt = $true
  smartTvViewingRequiresConsent = $true
  topSecretExternalSyncAllowed = $false
  productionMutationAllowed = $false
}
$path = Join-Path $root 'consumer-mesh-health.json'
$receipt | ConvertTo-Json -Depth 4 | Set-Content -Encoding UTF8 $path
Write-Host ("XIV consumer mesh receipt: {0}" -f $path)
$receipt | ConvertTo-Json -Depth 4
