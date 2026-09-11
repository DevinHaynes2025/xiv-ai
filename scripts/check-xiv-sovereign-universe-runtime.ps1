param(
  [switch]$RunContract,
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'
$runtimeRoot = Join-Path $RepoRoot '.xiv-runtime'
New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null

$observedAt = (Get-Date).ToUniversalTime().ToString('o')
$universeFiles = @()
$dataRoomFiles = @()
$auditFiles = @()

$searchRoots = @(
  (Join-Path $RepoRoot '.xiv-runtime'),
  (Join-Path $RepoRoot 'data'),
  (Join-Path $RepoRoot 'runtime-data')
) | Where-Object { Test-Path $_ }

foreach ($root in $searchRoots) {
  $universeFiles += @(Get-ChildItem -Path $root -Recurse -File -Filter '*.xivuniverse.json' -ErrorAction SilentlyContinue)
  $dataRoomFiles += @(Get-ChildItem -Path $root -Recurse -File -Filter '*.xivroomasset.json' -ErrorAction SilentlyContinue)
  $auditFiles += @(Get-ChildItem -Path $root -Recurse -File -Filter 'access-audit.xivjsonl' -ErrorAction SilentlyContinue)
}

$contract = [ordered]@{
  attempted = $false
  passed = $false
  exitCode = $null
  command = 'npx.cmd --no-install tsx runtime/offline-team/sovereign-universe-data-room-agent-twins.test.ts'
}

if ($RunContract) {
  $contract.attempted = $true
  Push-Location (Join-Path $RepoRoot 'services/ai')
  try {
    & npx.cmd --no-install tsx runtime/offline-team/sovereign-universe-data-room-agent-twins.test.ts
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
  story = '12D-71'
  observedAt = $observedAt
  repoRoot = $RepoRoot
  localArtifacts = [ordered]@{
    encryptedUniverseFileCount = @($universeFiles).Count
    encryptedUniverseBytes = (@($universeFiles) | Measure-Object -Property Length -Sum).Sum
    encryptedDataRoomAssetCount = @($dataRoomFiles).Count
    encryptedDataRoomAssetBytes = (@($dataRoomFiles) | Measure-Object -Property Length -Sum).Sum
    dataRoomAuditFileCount = @($auditFiles).Count
    dataRoomAuditBytes = (@($auditFiles) | Measure-Object -Property Length -Sum).Sum
  }
  contract = $contract
  claims = [ordered]@{
    localRuntimeRunning = $false
    ollamaRunning = $false
    gpuVerified = $false
    androidDeviceVerified = $false
    cloudIntegrationVerified = $false
    vendorPartnershipsInferred = $false
    rawPrivateDataCentralizedByDefault = $false
    agentsConscious = $false
    agentsHaveFreeWill = $false
  }
  notes = @(
    'File counts prove only that matching local artifacts exist under searched paths; they do not prove a service is running.',
    'TOP_SECRET material must remain outside ordinary embeddings, external plugins, public web, and client rendering.',
    'External companies remain integration targets until evidence-backed VERIFIED_PARTNER receipts exist.',
    'Financial connectors remain read/analytics scoped only and cannot move money, open accounts, or sign contracts.'
  )
}

if ($null -eq $receipt.localArtifacts.encryptedUniverseBytes) { $receipt.localArtifacts.encryptedUniverseBytes = 0 }
if ($null -eq $receipt.localArtifacts.encryptedDataRoomAssetBytes) { $receipt.localArtifacts.encryptedDataRoomAssetBytes = 0 }
if ($null -eq $receipt.localArtifacts.dataRoomAuditBytes) { $receipt.localArtifacts.dataRoomAuditBytes = 0 }

$outPath = Join-Path $runtimeRoot 'xiv-sovereign-universe-health.json'
$receipt | ConvertTo-Json -Depth 8 | Set-Content -Path $outPath -Encoding UTF8
Write-Output $outPath
