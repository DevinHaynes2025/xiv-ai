param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'
$runtimeDir = Join-Path $RepoRoot '.xiv-runtime'
New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
$receiptPath = Join-Path $runtimeDir 'xiv-learning-device-sync-health.json'
$testPath = Join-Path $RepoRoot 'services\ai\runtime\offline-team\offline-rag-learning-device-sync.test.ts'
$requiredFiles = @(
  'services\ai\runtime\offline-team\offline-rag-retrieval-index.ts',
  'services\ai\runtime\offline-team\learning-promotion-ledger.ts',
  'services\ai\runtime\offline-team\device-sync-gateway.ts',
  'services\ai\runtime\offline-team\offline-learning-device-sync-receipt.ts',
  'services\ai\runtime\offline-team\offline-rag-learning-device-sync.test.ts'
)

$missing = @()
foreach ($relative in $requiredFiles) {
  if (-not (Test-Path (Join-Path $RepoRoot $relative))) { $missing += $relative }
}

$contractStatus = 'UNVERIFIED'
$contractExitCode = $null
$contractOutput = @()
$npx = Get-Command 'npx.cmd' -ErrorAction SilentlyContinue
if ($missing.Count -eq 0 -and $npx) {
  Push-Location (Join-Path $RepoRoot 'services\ai')
  try {
    $raw = & $npx.Source --no-install tsx 'runtime\offline-team\offline-rag-learning-device-sync.test.ts' 2>&1
    $contractExitCode = $LASTEXITCODE
    $contractOutput = @($raw | ForEach-Object { "$_" })
    if ($contractExitCode -eq 0 -and ($contractOutput -join "`n") -match '12D-62 offline RAG/learning evaluation/device sync contracts: OK') {
      $contractStatus = 'VERIFIED'
    } else {
      $contractStatus = 'FAILED'
    }
  } catch {
    $contractStatus = 'FAILED'
    $contractOutput = @($_.Exception.Message)
  } finally {
    Pop-Location
  }
}

$deviceReceiptDir = Join-Path $runtimeDir 'device-receipts'
$verifiedDeviceReceipts = 0
if (Test-Path $deviceReceiptDir) {
  Get-ChildItem -Path $deviceReceiptDir -Filter '*.json' -File -ErrorAction SilentlyContinue | ForEach-Object {
    try {
      $receipt = Get-Content $_.FullName -Raw | ConvertFrom-Json
      if ($receipt.state -eq 'VERIFIED' -and $receipt.receiptId -and $receipt.evidenceRefs.Count -gt 0) {
        $verifiedDeviceReceipts += 1
      }
    } catch { }
  }
}

$status = if ($missing.Count -gt 0 -or $contractStatus -eq 'FAILED') { 'DEGRADED' } elseif ($contractStatus -eq 'VERIFIED') { 'HEALTHY' } else { 'UNVERIFIED' }
$receipt = [ordered]@{
  story = '12D-62'
  checkedAt = (Get-Date).ToUniversalTime().ToString('o')
  status = $status
  contractStatus = $contractStatus
  contractExitCode = $contractExitCode
  missingFiles = $missing
  verifiedDeviceReceiptsMeasured = $verifiedDeviceReceipts
  universalDeviceSupportVerified = $false
  modelWeightsMutationVerified = $false
  notes = @(
    'TOP_SECRET remains excluded from ordinary RAG and client sync by contract.',
    'A device count is measured only from local .xiv-runtime/device-receipts JSON receipts.',
    'This receipt does not imply cloud integrations, vendor partnerships, or universal device support.'
  )
  contractOutput = $contractOutput
}

$receipt | ConvertTo-Json -Depth 8 | Set-Content -Path $receiptPath -Encoding UTF8
Write-Output "XIV 12D-62 receipt: $receiptPath"
Write-Output ($receipt | ConvertTo-Json -Depth 8)
