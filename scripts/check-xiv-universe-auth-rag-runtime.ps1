param(
  [switch]$RunContract,
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'
$runtimeRoot = Join-Path $RepoRoot '.xiv-runtime'
New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null

$observedAt = (Get-Date).ToUniversalTime().ToString('o')
$authorizationLedgers = @()
$consentPolicyFiles = @()
$ragMemoryFiles = @()

$searchRoots = @(
  (Join-Path $RepoRoot '.xiv-runtime'),
  (Join-Path $RepoRoot 'data'),
  (Join-Path $RepoRoot 'runtime-data')
) | Where-Object { Test-Path $_ }

foreach ($root in $searchRoots) {
  $authorizationLedgers += @(Get-ChildItem -Path $root -Recurse -File -Filter 'universe-authorization.xivjsonl' -ErrorAction SilentlyContinue)
  $consentPolicyFiles += @(Get-ChildItem -Path $root -Recurse -File -Filter '*.xivpolicy.json' -ErrorAction SilentlyContinue)
  $ragMemoryFiles += @(Get-ChildItem -Path $root -Recurse -File -Filter '*.xivrag.json' -ErrorAction SilentlyContinue)
}

$contract = [ordered]@{
  attempted = $false
  passed = $false
  exitCode = $null
  command = 'npx.cmd --no-install tsx runtime/offline-team/universe-authorization-consent-private-rag.test.ts'
}

if ($RunContract) {
  $contract.attempted = $true
  Push-Location (Join-Path $RepoRoot 'services/ai')
  try {
    & npx.cmd --no-install tsx runtime/offline-team/universe-authorization-consent-private-rag.test.ts
    $contract.exitCode = $LASTEXITCODE
    $contract.passed = ($LASTEXITCODE -eq 0)
  } catch {
    $contract.exitCode = -1
    $contract.error = $_.Exception.Message
  } finally {
    Pop-Location
  }
}

$receipt = [ordered]@{
  story = '12D-72'
  observedAt = $observedAt
  repoRoot = $RepoRoot
  localArtifacts = [ordered]@{
    authorizationLedgerCount = @($authorizationLedgers).Count
    authorizationLedgerBytes = (@($authorizationLedgers) | Measure-Object -Property Length -Sum).Sum
    encryptedConsentPolicyCount = @($consentPolicyFiles).Count
    encryptedConsentPolicyBytes = (@($consentPolicyFiles) | Measure-Object -Property Length -Sum).Sum
    encryptedRagMemoryCount = @($ragMemoryFiles).Count
    encryptedRagMemoryBytes = (@($ragMemoryFiles) | Measure-Object -Property Length -Sum).Sum
  }
  contract = $contract
  claims = [ordered]@{
    localBrainRuntimeRunning = $false
    ollamaRunning = $false
    gpuVerified = $false
    androidDeviceVerified = $false
    cloudIntegrationVerified = $false
    vendorPartnershipsInferred = $false
    ordinaryEmbeddingsExecuted = $false
    topSecretExternallyRouted = $false
    rawPrivateDataCentralizedByDefault = $false
    agentsConscious = $false
    agentsHaveFreeWill = $false
  }
  notes = @(
    'Artifact counts prove only that matching files exist under searched local paths; they do not prove a service, model, GPU, device, or integration is running.',
    'TOP_SECRET remains local and outside ordinary embeddings, external plugins, public web, client rendering, and external/device synchronization.',
    'External companies remain TARGET, RESEARCH, or API_READY until evidence-backed VERIFIED_PARTNER receipts exist.',
    'Shared learning is limited to approved minimized/anonymized/aggregated signals and cannot contain raw private records or direct identifiers.',
    'Financial connectors remain user-authorized supported API integrations only and cannot move money, open accounts, or sign contracts.'
  )
}

if ($null -eq $receipt.localArtifacts.authorizationLedgerBytes) { $receipt.localArtifacts.authorizationLedgerBytes = 0 }
if ($null -eq $receipt.localArtifacts.encryptedConsentPolicyBytes) { $receipt.localArtifacts.encryptedConsentPolicyBytes = 0 }
if ($null -eq $receipt.localArtifacts.encryptedRagMemoryBytes) { $receipt.localArtifacts.encryptedRagMemoryBytes = 0 }

$outPath = Join-Path $runtimeRoot 'xiv-universe-auth-rag-health.json'
$receipt | ConvertTo-Json -Depth 8 | Set-Content -Path $outPath -Encoding UTF8
Write-Output $outPath
