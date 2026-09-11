param(
  [switch]$RunContract,
  [string]$RuntimeRoot = ".xiv-runtime"
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$runtimePath = Join-Path $repoRoot $RuntimeRoot
New-Item -ItemType Directory -Force -Path $runtimePath | Out-Null

$modulePath = Join-Path $repoRoot "services\ai\runtime\offline-team\cpu-first-brain-retrieval-api-studio-revocation-watch.ts"
$testPath = Join-Path $repoRoot "services\ai\runtime\offline-team\cpu-first-brain-retrieval-api-studio-revocation-watch.test.ts"
$contract = [ordered]@{
  attempted = $false
  passed = $false
  exitCode = $null
  command = "npx.cmd --no-install tsx runtime\offline-team\cpu-first-brain-retrieval-api-studio-revocation-watch.test.ts"
}

if ($RunContract) {
  $contract.attempted = $true
  Push-Location (Join-Path $repoRoot "services\ai")
  try {
    & npx.cmd --no-install tsx "runtime\offline-team\cpu-first-brain-retrieval-api-studio-revocation-watch.test.ts"
    $contract.exitCode = $LASTEXITCODE
    $contract.passed = ($LASTEXITCODE -eq 0)
  } catch {
    $contract.exitCode = -1
    $contract.passed = $false
  } finally {
    Pop-Location
  }
}

function Get-ArtifactObservation([string]$PathValue) {
  if (-not (Test-Path $PathValue -PathType Leaf)) {
    return [ordered]@{ exists = $false; bytes = 0; sha256 = $null }
  }
  $item = Get-Item $PathValue
  $hash = Get-FileHash -Algorithm SHA256 -Path $PathValue
  return [ordered]@{ exists = $true; bytes = $item.Length; sha256 = $hash.Hash.ToLowerInvariant() }
}

$receipt = [ordered]@{
  story = "12D-74"
  title = "CPU-First Brain Retrieval Gateway + API Studio Governed Sessions + Revocation Watch"
  observedAt = (Get-Date).ToUniversalTime().ToString("o")
  governedSourceOfTruth = "GitHub"
  productionMutated = $false
  merged = $false
  deployed = $false
  published = $false
  artifacts = [ordered]@{
    module = Get-ArtifactObservation $modulePath
    contract = Get-ArtifactObservation $testPath
  }
  contract = $contract
  measuredOnly = [ordered]@{
    usageAnalyticsContentFree = $true
    viewCountsRequireRecordedEvents = $true
    uniqueUsersUsePseudonymousSubjects = $true
    featureUsageRequiresRecordedEvents = $true
    cpuRuntimeClaimRequiresReceipt = $true
    gpuAccelerationClaimRequiresHardwareRuntimeBenchmarkReceipts = $true
  }
  grounding = [ordered]@{
    topSecretOrdinaryEmbeddingsAllowed = $false
    topSecretExternalPluginsAllowed = $false
    topSecretPublicWebAllowed = $false
    topSecretClientRenderingAllowed = $false
    topSecretExternalRoutingAllowed = $false
    rawPrivateDataCentralizedByDefault = $false
    vendorPartnershipInferred = $false
    agentConsciousnessClaim = $false
    agentFreeWillClaim = $false
    autonomousCounterattackAllowed = $false
    autonomousMoneyMovementAllowed = $false
    accountOpeningAllowed = $false
    contractSigningAllowed = $false
  }
  unverifiedUnlessSeparateEvidenceReceiptExists = [ordered]@{
    xivBrainRuntimeRunning = $false
    ollamaRunning = $false
    cpuWorkerRunning = $false
    gpuAccelerationVerified = $false
    androidDeviceVerified = $false
    cloudIntegrationVerified = $false
    vendorPartnershipVerified = $false
    ordinaryEmbeddingsExecuted = $false
  }
}

$outPath = Join-Path $runtimePath "xiv-brain-retrieval-api-studio-health.json"
$receipt | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -Path $outPath
Write-Output $outPath
if ($RunContract -and -not $contract.passed) { exit 1 }
