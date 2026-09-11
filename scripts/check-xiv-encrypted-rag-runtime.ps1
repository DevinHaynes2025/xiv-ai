param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")),
  [string]$RagHealthUrl = "http://127.0.0.1:17764/health",
  [switch]$RunContract
)

$ErrorActionPreference = "Stop"
$runtimeDir = Join-Path $RepoRoot ".xiv-runtime"
New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
$outFile = Join-Path $runtimeDir "xiv-encrypted-rag-health.json"

function Get-FileStats([string]$Path) {
  if (-not (Test-Path $Path)) { return @{ exists = $false; files = 0; bytes = 0 } }
  $files = @(Get-ChildItem -Path $Path -File -Recurse -ErrorAction SilentlyContinue)
  $bytes = ($files | Measure-Object -Property Length -Sum).Sum
  if ($null -eq $bytes) { $bytes = 0 }
  return @{ exists = $true; files = $files.Count; bytes = [int64]$bytes }
}

function Test-LoopbackUrl([string]$Url) {
  try {
    $uri = [System.Uri]$Url
    return @("127.0.0.1", "localhost", "::1") -contains $uri.Host
  } catch { return $false }
}

$ordinaryVault = Get-FileStats (Join-Path $runtimeDir "knowledge-vault\ordinary")
$restrictedVault = Get-FileStats (Join-Path $runtimeDir "knowledge-vault\top-secret")
$embeddingReceipts = Get-FileStats (Join-Path $runtimeDir "embedding-receipts")
$conflictReview = Get-FileStats (Join-Path $runtimeDir "sync-conflict-review")

$ragProbe = @{ configuredUrl = $RagHealthUrl; loopbackOnly = $false; status = "UNVERIFIED"; detail = "No local probe attempted" }
if (Test-LoopbackUrl $RagHealthUrl) {
  $ragProbe.loopbackOnly = $true
  try {
    $response = Invoke-RestMethod -Uri $RagHealthUrl -Method Get -TimeoutSec 2
    $ragProbe.status = "HEALTHY"
    $ragProbe.detail = "Loopback /health responded"
  } catch {
    $ragProbe.status = "UNVERIFIED"
    $ragProbe.detail = "Loopback service did not provide a health receipt"
  }
} else {
  $ragProbe.status = "DEGRADED"
  $ragProbe.detail = "Configured RAG URL is not loopback; probe refused"
}

$contract = @{ requested = [bool]$RunContract; status = "NOT_RUN"; exitCode = $null }
if ($RunContract) {
  $serviceDir = Join-Path $RepoRoot "services\ai"
  Push-Location $serviceDir
  try {
    & npx.cmd --no-install tsx "runtime\offline-team\encrypted-knowledge-vault-local-rag-telemetry.test.ts"
    $contract.exitCode = $LASTEXITCODE
    $contract.status = if ($LASTEXITCODE -eq 0) { "PASSED" } else { "FAILED" }
  } catch {
    $contract.status = "UNVERIFIED"
    $contract.exitCode = $null
  } finally {
    Pop-Location
  }
}

$receipt = [ordered]@{
  story = "12D-64"
  measuredAt = (Get-Date).ToUniversalTime().ToString("o")
  ordinaryEncryptedVault = $ordinaryVault
  restrictedTopSecretVault = $restrictedVault
  embeddingVerificationReceipts = $embeddingReceipts
  conflictReviewFiles = $conflictReview
  localRagService = $ragProbe
  contract = $contract
  claims = [ordered]@{
    vendorPartnershipVerified = $false
    universalDeviceSupportVerified = $false
    ollamaRuntimeVerifiedByThisReceipt = $false
    gpuRuntimeVerifiedByThisReceipt = $false
    note = "File counts and loopback responses are measured only; configuration is not proof of runtime, partnership, or device support."
  }
}

$receipt | ConvertTo-Json -Depth 8 | Set-Content -Path $outFile -Encoding UTF8
Write-Output $outFile
