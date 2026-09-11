param(
  [switch]$RunContract,
  [string]$HealthUrl = 'http://127.0.0.1:7412/health'
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$RuntimeDir = Join-Path $RepoRoot '.xiv-runtime'
New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null

$uri = [Uri]$HealthUrl
if (-not $uri.IsLoopback) {
  throw 'Executive Control health probe must target loopback only.'
}

$contract = [ordered]@{
  requested = [bool]$RunContract
  attempted = $false
  passed = $false
  exitCode = $null
  output = @()
}

if ($RunContract) {
  $contract.attempted = $true
  Push-Location (Join-Path $RepoRoot 'services\ai')
  try {
    $lines = @(& npx.cmd --no-install tsx 'runtime\offline-team\persistent-ops-executive-control-vendor-device.test.ts' 2>&1)
    $contract.exitCode = $LASTEXITCODE
    $contract.output = @($lines | ForEach-Object { "$_" })
    $contract.passed = ($LASTEXITCODE -eq 0)
  } catch {
    $contract.exitCode = -1
    $contract.output = @($_.Exception.Message)
  } finally {
    Pop-Location
  }
}

$health = [ordered]@{
  url = $HealthUrl
  attempted = $true
  reachable = $false
  statusCode = $null
  latencyMs = $null
  evidence = 'direct loopback HTTP probe'
}
$timer = [System.Diagnostics.Stopwatch]::StartNew()
try {
  $response = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 2 -Method Get
  $timer.Stop()
  $health.statusCode = [int]$response.StatusCode
  $health.latencyMs = [int]$timer.ElapsedMilliseconds
  $health.reachable = ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300)
} catch {
  $timer.Stop()
  $health.latencyMs = [int]$timer.ElapsedMilliseconds
  if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
    $health.statusCode = [int]$_.Exception.Response.StatusCode
  }
}

$viewFiles = @()
Get-ChildItem -Path $RuntimeDir -Filter '*.operations-view.json' -File -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
  $viewFiles += [ordered]@{
    path = $_.FullName.Substring($RepoRoot.Path.Length).TrimStart('\','/')
    bytes = [int64]$_.Length
    lastWriteUtc = $_.LastWriteTimeUtc.ToString('o')
  }
}

$vendorReceiptFiles = @(Get-ChildItem -Path $RuntimeDir -Filter '*vendor*receipt*.json' -File -Recurse -ErrorAction SilentlyContinue)
$deviceReceiptFiles = @(Get-ChildItem -Path $RuntimeDir -Filter '*device*receipt*.json' -File -Recurse -ErrorAction SilentlyContinue)

$receipt = [ordered]@{
  story = '12D-67'
  generatedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
  repoRoot = $RepoRoot.Path
  contract = $contract
  executiveControlHealth = $health
  persistentOperationsViews = [ordered]@{
    measuredFileCount = $viewFiles.Count
    measuredBytes = [int64](($viewFiles | Measure-Object -Property bytes -Sum).Sum)
    files = $viewFiles
  }
  verificationArtifacts = [ordered]@{
    vendorReceiptFileCount = $vendorReceiptFiles.Count
    deviceReceiptFileCount = $deviceReceiptFiles.Count
  }
  claims = [ordered]@{
    productionMutated = $false
    serviceHealthy = [bool]$health.reachable
    universalDeviceSupport = $false
    vendorPartnershipsInferred = $false
    ollamaAvailabilityInferred = $false
    gpuAvailabilityInferred = $false
    cloudConnectivityInferred = $false
  }
  notes = @(
    'Counts are based only on files present locally at probe time.',
    'A vendor/device target is not a verified partnership or verified device.',
    'TOP_SECRET content is not inspected by this receipt probe.',
    'The probe does not start services, deploy code, publish artifacts, or mutate production.'
  )
}

$receiptPath = Join-Path $RuntimeDir 'xiv-executive-control-health.json'
$receipt | ConvertTo-Json -Depth 12 | Set-Content -Path $receiptPath -Encoding UTF8
Write-Output $receiptPath
