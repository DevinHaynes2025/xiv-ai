param([switch]$RunContract)

$root = Join-Path (Get-Location) '.xiv-runtime\receipts'
New-Item -ItemType Directory -Force -Path $root | Out-Null

$timestamp = (Get-Date).ToString('o')
$node = Get-Command node -ErrorAction SilentlyContinue
$npx = Get-Command npx.cmd -ErrorAction SilentlyContinue
$nvidia = Get-Command nvidia-smi -ErrorAction SilentlyContinue
$rocm = Get-Command rocm-smi -ErrorAction SilentlyContinue

$cpuInfo = $null
try {
  $cpuInfo = Get-CimInstance Win32_Processor | Select-Object -First 1 Name, NumberOfCores, NumberOfLogicalProcessors
} catch {
  $cpuInfo = $null
}

$contractAttempted = $false
$contractPassed = $false
$contractExitCode = $null
if ($RunContract -and $npx) {
  $contractAttempted = $true
  Push-Location (Join-Path (Get-Location) 'services\ai')
  try {
    & npx.cmd --no-install tsx runtime\offline-team\sovereign-learning-api-studio-evidence-runtime.test.ts
    $contractExitCode = $LASTEXITCODE
    $contractPassed = ($contractExitCode -eq 0)
  } finally {
    Pop-Location
  }
}

$receipt = [ordered]@{
  story = '12D-84'
  timestamp = $timestamp
  productionMutationAllowed = $false
  deploymentPerformed = $false
  publishPerformed = $false
  cpu = [ordered]@{
    hostProcessorObserved = ($null -ne $cpuInfo)
    processor = $cpuInfo
    nodeCommandPresent = ($null -ne $node)
    xivBrainExecutionVerified = $false
  }
  gpu = [ordered]@{
    nvidiaSmiCommandPresent = ($null -ne $nvidia)
    rocmSmiCommandPresent = ($null -ne $rocm)
    hardwareVerified = $false
    runtimeVerified = $false
    benchmarkVerified = $false
    executionVerified = $false
    note = 'Command presence is discovery only; GPU use requires separate hardware/runtime/benchmark/execution receipts.'
  }
  apiStudio = [ordered]@{
    localhostOrPrivatePolicyAuthored = $true
    liveEndpointVerified = $false
    hybridVendorRouteVerified = $false
  }
  privacy = [ordered]@{
    topSecretExternalRoutingAllowed = $false
    topSecretOrdinaryEmbeddingAllowed = $false
    rawPrivateDataCentralizedByDefault = $false
    vaultPlaintextLoggingAllowed = $false
  }
  financialAuthority = [ordered]@{
    unrestrictedBankAccess = $false
    canMoveMoney = $false
    canOpenAccounts = $false
    canSignContracts = $false
  }
  contract = [ordered]@{
    attempted = $contractAttempted
    passed = $contractPassed
    exitCode = $contractExitCode
  }
  integrations = 'TARGET_RESEARCH_OR_API_READY_UNLESS_VERIFIED_PARTNER_RECEIPTS_EXIST'
  ollamaVerified = $false
  androidDeviceVerified = $false
  cloudIntegrationVerified = $false
}

$path = Join-Path $root 'sovereign-learning-api-studio-health.json'
$receipt | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $path
Write-Host "XIV 12D-84 receipt written to $path"
if ($contractAttempted -and -not $contractPassed) { exit 1 }
