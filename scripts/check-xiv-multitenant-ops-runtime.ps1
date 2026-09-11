param(
  [string]$RuntimeRoot = ".xiv-runtime",
  [switch]$RunContract
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$runtimePath = Join-Path $repoRoot $RuntimeRoot
$dbPath = Join-Path $runtimePath "databases"
$receiptPath = Join-Path $runtimePath "xiv-multitenant-ops-health.json"

New-Item -ItemType Directory -Force -Path $runtimePath | Out-Null

$dbFiles = @()
if (Test-Path $dbPath) {
  $dbFiles = @(Get-ChildItem -Path $dbPath -Filter "*.xivdb" -File -ErrorAction SilentlyContinue)
}

$contract = [ordered]@{
  attempted = $false
  passed = $false
  exitCode = $null
  command = "npx.cmd --no-install tsx runtime\offline-team\multitenant-db-materialized-views-ops-meetings.test.ts"
}

if ($RunContract) {
  $contract.attempted = $true
  Push-Location (Join-Path $repoRoot "services\ai")
  try {
    & npx.cmd --no-install tsx "runtime\offline-team\multitenant-db-materialized-views-ops-meetings.test.ts"
    $contract.exitCode = $LASTEXITCODE
    $contract.passed = ($LASTEXITCODE -eq 0)
  } catch {
    $contract.exitCode = 1
    $contract.passed = $false
  } finally {
    Pop-Location
  }
}

$receipt = [ordered]@{
  story = "12D-66"
  measuredAt = (Get-Date).ToUniversalTime().ToString("o")
  localDatabase = [ordered]@{
    path = $dbPath
    exists = (Test-Path $dbPath)
    tenantFileCount = $dbFiles.Count
    bytesOnDisk = (($dbFiles | Measure-Object -Property Length -Sum).Sum -as [long])
  }
  contract = $contract
  claims = [ordered]@{
    databaseRuntimeVerified = ($dbFiles.Count -gt 0)
    contractVerified = $contract.passed
    ollamaVerified = $false
    gpuVerified = $false
    cloudReplicationVerified = $false
    vendorPartnershipVerified = $false
    universalDeviceSupportVerified = $false
  }
  notes = @(
    "A local file count proves only files observed at measurement time, not database correctness.",
    "Cloud replication remains disabled unless a provider adapter has evidence-backed VERIFIED_PARTNER status.",
    "No money movement, account opening, contract signing, vendor partnership, GPU, Ollama, or universal device support is inferred."
  )
}

$receipt | ConvertTo-Json -Depth 8 | Set-Content -Path $receiptPath -Encoding UTF8
Write-Output "Wrote $receiptPath"
if ($RunContract -and -not $contract.passed) { exit 1 }
