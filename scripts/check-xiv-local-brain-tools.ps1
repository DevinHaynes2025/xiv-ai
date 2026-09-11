param([switch]$Once)

$root = Join-Path (Get-Location) '.xiv-runtime\receipts'
New-Item -ItemType Directory -Force -Path $root | Out-Null

$ollamaReachable = $false
try {
  $null = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2
  $ollamaReachable = $true
} catch {
  $ollamaReachable = $false
}

$receipt = [ordered]@{
  timestamp = (Get-Date).ToString('o')
  localhostOnly = $true
  productionMutationAllowed = $false
  topSecretExternalSync = $false
  ollamaReachable = $ollamaReachable
  toolRegistryStatus = 'UNVERIFIED_UNTIL_RUNTIME_CHECKS'
  partnerIntegrations = 'TARGET_OR_RESEARCH_UNLESS_RECEIPTS_EXIST'
  learningMode = 'RAG_MEMORY_EVALUATION_PROMPT_SPECIALIZATION'
  uncontrolledSelfRewrite = $false
}

$path = Join-Path $root 'local-brain-tools-health.json'
$receipt | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 $path
Write-Host "XIV local brain tools receipt written to $path"
if ($Once) { exit 0 }
