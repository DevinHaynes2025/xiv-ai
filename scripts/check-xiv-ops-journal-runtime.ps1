param(
  [string]$RuntimeRoot = ".xiv-runtime",
  [string]$DataRoot = ".xiv-runtime\operations",
  [string]$ExecutiveHealthUrl = "http://127.0.0.1:4318/health",
  [switch]$RunContract
)

$ErrorActionPreference = "Stop"
$startedAt = (Get-Date).ToUniversalTime()
New-Item -ItemType Directory -Force -Path $RuntimeRoot | Out-Null

$contract = [ordered]@{
  requested = [bool]$RunContract
  status = "NOT_RUN"
  exitCode = $null
  output = @()
}

if ($RunContract) {
  try {
    Push-Location "services\ai"
    $lines = & npx.cmd --no-install tsx "runtime\offline-team\operations-event-journal-view-rebuilder-receipts.test.ts" 2>&1
    $exitCode = $LASTEXITCODE
    $contract.exitCode = $exitCode
    $contract.output = @($lines | ForEach-Object { "$_" })
    $contract.status = if ($exitCode -eq 0) { "PASSED" } else { "FAILED" }
  } catch {
    $contract.status = "UNVERIFIED"
    $contract.output = @($_.Exception.Message)
  } finally {
    Pop-Location
  }
}

function Measure-JsonlFiles([string]$Root, [string]$Pattern) {
  if (-not (Test-Path $Root)) {
    return [ordered]@{ files = 0; bytes = 0; paths = @() }
  }
  $items = @(Get-ChildItem -Path $Root -Recurse -File -Filter $Pattern -ErrorAction SilentlyContinue)
  return [ordered]@{
    files = $items.Count
    bytes = [long](($items | Measure-Object -Property Length -Sum).Sum)
    paths = @($items | ForEach-Object { $_.FullName })
  }
}

$eventFiles = Measure-JsonlFiles $DataRoot "operations-events.jsonl"
$receiptFiles = Measure-JsonlFiles $DataRoot "verification-receipts.jsonl"
$viewFiles = if (Test-Path $DataRoot) { @(Get-ChildItem -Path $DataRoot -Recurse -File -Filter "*operations-view*.json" -ErrorAction SilentlyContinue) } else { @() }

$loopback = [ordered]@{
  url = $ExecutiveHealthUrl
  status = "UNVERIFIED"
  httpStatus = $null
  latencyMs = $null
  evidence = @()
}

try {
  $uri = [System.Uri]$ExecutiveHealthUrl
  if ($uri.Host -notin @("127.0.0.1", "localhost", "::1")) {
    throw "Executive health probe must remain loopback-only."
  }
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $response = Invoke-WebRequest -Uri $ExecutiveHealthUrl -Method Get -UseBasicParsing -TimeoutSec 3
  $sw.Stop()
  $loopback.httpStatus = [int]$response.StatusCode
  $loopback.latencyMs = [int]$sw.ElapsedMilliseconds
  $loopback.status = if ([int]$response.StatusCode -ge 200 -and [int]$response.StatusCode -lt 300) { "REACHABLE" } else { "UNHEALTHY" }
  $loopback.evidence = @("measured-http-response")
} catch {
  $loopback.status = "UNVERIFIED"
  $loopback.evidence = @($_.Exception.Message)
}

$finishedAt = (Get-Date).ToUniversalTime()
$receipt = [ordered]@{
  story = "12D-68"
  generatedAt = $finishedAt.ToString("o")
  durationMs = [int](($finishedAt - $startedAt).TotalMilliseconds)
  contract = $contract
  localPersistence = [ordered]@{
    operationsEventJournals = $eventFiles
    verificationReceiptJournals = $receiptFiles
    materializedViewFiles = [ordered]@{
      files = $viewFiles.Count
      bytes = [long](($viewFiles | Measure-Object -Property Length -Sum).Sum)
      paths = @($viewFiles | ForEach-Object { $_.FullName })
    }
  }
  executiveControlLoopback = $loopback
  claims = [ordered]@{
    localRuntimeVerified = ($contract.status -eq "PASSED")
    executiveApiVerified = ($loopback.status -eq "REACHABLE")
    ollamaVerified = $false
    gpuVerified = $false
    cloudIntegrationVerified = $false
    vendorPartnershipVerified = $false
    universalDeviceSupportVerified = $false
  }
  safeguards = @(
    "This probe reads local file metadata only and does not decrypt operational payloads.",
    "A configured endpoint is not treated as healthy without an actual loopback response.",
    "Vendor/device claims require their own current evidence-backed verification receipts.",
    "TOP_SECRET is not authorized for ordinary operational journals, external plugins, public web, or client rendering.",
    "No production mutation, deployment, money movement, account opening, or contract signing is performed."
  )
}

$outPath = Join-Path $RuntimeRoot "xiv-ops-journal-health.json"
$receipt | ConvertTo-Json -Depth 12 | Set-Content -Path $outPath -Encoding UTF8
Write-Output "12D-68 local receipt written: $outPath"
Write-Output ("contract={0}; eventJournals={1}; verificationJournals={2}; executiveApi={3}" -f $contract.status, $eventFiles.files, $receiptFiles.files, $loopback.status)
