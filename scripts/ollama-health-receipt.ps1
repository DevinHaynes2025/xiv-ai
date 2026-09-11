$ErrorActionPreference = 'Stop'
$endpoint = 'http://127.0.0.1:11434'
$receiptDir = Join-Path $PSScriptRoot '..\.xiv-runtime\receipts'
$receiptPath = Join-Path $receiptDir 'ollama-health.json'
New-Item -ItemType Directory -Force -Path $receiptDir | Out-Null

$reachable = $false
$models = @()
$errorMessage = $null
try {
  $response = Invoke-RestMethod -Uri "$endpoint/api/tags" -Method Get -TimeoutSec 5
  $reachable = $true
  if ($null -ne $response.models) {
    $models = @($response.models | ForEach-Object { $_.name })
  }
} catch {
  $errorMessage = $_.Exception.Message
}

$preferred = $null
foreach ($candidate in @('qwen2.5-coder:7b','gpt-oss:20b')) {
  if ($models -contains $candidate) { $preferred = $candidate; break }
}
if (-not $preferred -and $models.Count -gt 0) { $preferred = $models[0] }

$receipt = [ordered]@{
  endpoint = $endpoint
  reachable = $reachable
  verifiedAt = (Get-Date).ToUniversalTime().ToString('o')
  modelNames = $models
  preferredModel = $preferred
  localOnly = $true
  productionAuthority = $false
  cloudExecutionVerified = $false
  error = $errorMessage
}
$receipt | ConvertTo-Json -Depth 5 | Set-Content -Path $receiptPath -Encoding UTF8
$receipt | ConvertTo-Json -Depth 5
Write-Host "Receipt written to $receiptPath"
if (-not $reachable) { exit 2 }
