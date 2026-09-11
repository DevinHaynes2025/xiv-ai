param(
  [switch]$RunContract,
  [string]$OutputPath = ".xiv-runtime\xiv-persistent-api-runtime-supervisor-health.json"
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$modulePath = Join-Path $repoRoot "services\ai\runtime\offline-team\persistent-governed-api-vault-runtime-supervisor.ts"
$testPath = Join-Path $repoRoot "services\ai\runtime\offline-team\persistent-governed-api-vault-runtime-supervisor.test.ts"
$outputFullPath = Join-Path $repoRoot $OutputPath

function Get-ArtifactReceipt([string]$Path) {
  if (-not (Test-Path $Path)) {
    return [ordered]@{ path = $Path; exists = $false; sha256 = $null; bytes = 0 }
  }
  $item = Get-Item $Path
  $hash = Get-FileHash -Algorithm SHA256 -Path $Path
  return [ordered]@{ path = $Path; exists = $true; sha256 = $hash.Hash.ToLowerInvariant(); bytes = $item.Length }
}

$contract = [ordered]@{
  attempted = $false
  passed = $false
  exitCode = $null
  command = $null
  stdout = @()
}

if ($RunContract) {
  $contract.attempted = $true
  $contract.command = "npx.cmd --no-install tsx services/ai/runtime/offline-team/persistent-governed-api-vault-runtime-supervisor.test.ts"
  Push-Location $repoRoot
  try {
    $output = & npx.cmd --no-install tsx "services/ai/runtime/offline-team/persistent-governed-api-vault-runtime-supervisor.test.ts" 2>&1
    $contract.exitCode = $LASTEXITCODE
    $contract.stdout = @($output | ForEach-Object { $_.ToString() })
    $contract.passed = ($LASTEXITCODE -eq 0) -and (($contract.stdout -join "`n") -match "12D-75 persistent API/vault/runtime supervisor contracts: OK")
  }
  catch {
    $contract.exitCode = -1
    $contract.stdout = @($_.Exception.Message)
    $contract.passed = $false
  }
  finally {
    Pop-Location
  }
}

$receipt = [ordered]@{
  storyId = "12D-75"
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  purpose = "Local evidence receipt for persistent governed API sessions, metadata-only vault credential brokering, CPU/RAG/API Studio supervision, content-free analytics checkpoints, and evidence-preserving work council persistence."
  artifacts = @(
    Get-ArtifactReceipt $modulePath
    Get-ArtifactReceipt $testPath
  )
  contract = $contract
  runtimeObservation = [ordered]@{
    probeSamples = @()
    cpuBrain = "UNVERIFIED"
    rag = "UNVERIFIED"
    apiStudio = "UNVERIFIED"
    note = "This verifier does not infer a running service from configuration or source files. Runtime health requires separate evidence-backed loopback/private probes."
  }
  claims = [ordered]@{
    cpuBrainRunning = $false
    ragRuntimeRunning = $false
    apiStudioRunning = $false
    ollamaRunning = $false
    gpuAccelerationVerified = $false
    gpuExecutionObserved = $false
    androidDeviceVerified = $false
    cloudIntegrationVerified = $false
    vendorPartnershipInferred = $false
    embeddingExecutionVerified = $false
    universalDeviceSupportClaim = $false
    autonomousMoneyMovementAllowed = $false
    accountOpeningAllowed = $false
    contractSigningAllowed = $false
  }
  grounding = [ordered]@{
    topSecretExternalRoutingAllowed = $false
    topSecretOrdinaryEmbeddingAllowed = $false
    rawPrivateDataCentralizedByDefault = $false
    offlineImpliesAuthorization = $false
    graphEdgesAreFacts = $false
    correlationIsCausation = $false
    autonomousCounterattackAllowed = $false
  }
}

$outputDir = Split-Path -Parent $outputFullPath
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
$tempPath = "$outputFullPath.tmp"
$receipt | ConvertTo-Json -Depth 10 | Set-Content -Path $tempPath -Encoding UTF8
Move-Item -Force -Path $tempPath -Destination $outputFullPath
Write-Output "12D-75 receipt written: $outputFullPath"
if ($RunContract -and -not $contract.passed) { exit 1 }
