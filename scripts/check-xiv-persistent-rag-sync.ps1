param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'
$runtimeRoot = Join-Path $RepoRoot '.xiv-runtime'
$receiptPath = Join-Path $runtimeRoot 'xiv-persistent-rag-sync-health.json'
$knowledgeRoot = Join-Path $runtimeRoot 'knowledge-index'
$embeddingReceiptRoot = Join-Path $runtimeRoot 'embedding-adapters'
$syncJournalRoot = Join-Path $runtimeRoot 'device-sync-journal'
New-Item -ItemType Directory -Force -Path $runtimeRoot | Out-Null

function Measure-Directory([string]$Path) {
  if (-not (Test-Path $Path)) { return @{ exists = $false; files = 0; bytes = 0 } }
  $files = @(Get-ChildItem -Path $Path -File -Recurse -ErrorAction SilentlyContinue)
  $bytes = ($files | Measure-Object -Property Length -Sum).Sum
  if ($null -eq $bytes) { $bytes = 0 }
  return @{ exists = $true; files = $files.Count; bytes = [int64]$bytes }
}

$contract = @{ ran = $false; passed = $false; exitCode = $null; output = @() }
$testPath = Join-Path $RepoRoot 'services\ai\runtime\offline-team\persistent-rag-embedding-sync-conflict.test.ts'
$tsx = Get-Command npx.cmd -ErrorAction SilentlyContinue
if ($tsx -and (Test-Path $testPath)) {
  $contract.ran = $true
  Push-Location (Join-Path $RepoRoot 'services\ai')
  try {
    $output = @(& npx.cmd --no-install tsx 'runtime\offline-team\persistent-rag-embedding-sync-conflict.test.ts' 2>&1)
    $contract.exitCode = $LASTEXITCODE
    $contract.output = @($output | ForEach-Object { "$_" } | Select-Object -Last 20)
    $contract.passed = ($LASTEXITCODE -eq 0 -and ($contract.output -join "`n") -match '12D-63 persistent RAG/embedding/sync conflict contracts: OK')
  } finally { Pop-Location }
}

$knowledge = Measure-Directory $knowledgeRoot
$embedding = Measure-Directory $embeddingReceiptRoot
$syncJournal = Measure-Directory $syncJournalRoot
$status = if ($contract.passed) { 'HEALTHY_CONTRACT' } elseif ($contract.ran) { 'DEGRADED_CONTRACT' } else { 'UNVERIFIED' }

$receipt = [ordered]@{
  schemaVersion = '12D-63.1'
  measuredAt = (Get-Date).ToUniversalTime().ToString('o')
  status = $status
  contract = $contract
  measuredLocalArtifacts = [ordered]@{
    knowledgeIndex = $knowledge
    embeddingAdapterReceipts = $embedding
    deviceSyncJournal = $syncJournal
  }
  claims = [ordered]@{
    runtimeAvailabilityInferred = $false
    universalDeviceSupportClaimed = $false
    cloudPartnerStatusInferred = $false
    topSecretOrdinaryEmbeddingOrSyncAllowed = $false
  }
}
$receipt | ConvertTo-Json -Depth 8 | Set-Content -Path $receiptPath -Encoding UTF8
Write-Host "XIV 12D-63 receipt: $receiptPath"
Write-Host "Status: $status"
