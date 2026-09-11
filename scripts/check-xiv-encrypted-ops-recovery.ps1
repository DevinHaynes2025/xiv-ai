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
  $pushed = $false
  try {
    Push-Location "services\ai"
    $pushed = $true
    $lines = & npx.cmd --no-install tsx "runtime\offline-team\encrypted-operations-journal-checkpoint-recovery.test.ts" 2>&1
    $contract.exitCode = $LASTEXITCODE
    $contract.output = @($lines | ForEach-Object { "$_" })
    $contract.status = if ($LASTEXITCODE -eq 0) { "PASSED" } else { "FAILED" }
  } catch {
    $contract.status = "UNVERIFIED"
    $contract.output = @($_.Exception.Message)
  } finally {
    if ($pushed) { Pop-Location }
  }
}

function Measure-Files([string]$Root, [string]$Pattern) {
  if (-not (Test-Path $Root)) {
    return [ordered]@{ files = 0; bytes = 0; paths = @(); sha256 = @() }
  }
  $items = @(Get-ChildItem -Path $Root -Recurse -File -Filter $Pattern -ErrorAction SilentlyContinue)
  return [ordered]@{
    files = $items.Count
    bytes = [long](($items | Measure-Object -Property Length -Sum).Sum)
    paths = @($items | ForEach-Object { $_.FullName })
    sha256 = @($items | ForEach-Object { (Get-FileHash -Path $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant() })
  }
}

$encryptedJournals = Measure-Files $DataRoot "*.xivenc.jsonl"
$checkpoints = Measure-Files $DataRoot "*.xivcheckpoint.json"
$quarantine = Measure-Files $DataRoot "*.tail.jsonl"
$recoveryReceipts = Measure-Files $RuntimeRoot "*recovery*.json"

$loopback = [ordered]@{
  url = $ExecutiveHealthUrl
  status = "UNVERIFIED"
  httpStatus = $null
  latencyMs = $null
  evidence = @()
}

try {
  $uri = [System.Uri]$ExecutiveHealthUrl
  if ($uri.Scheme -ne "http" -and $uri.Scheme -ne "https") { throw "Executive health probe requires HTTP(S)." }
  if ($uri.Host -notin @("127.0.0.1", "localhost", "::1")) { throw "Executive health probe must remain loopback-only." }
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
  story = "12D-69"
  generatedAt = $finishedAt.ToString("o")
  durationMs = [int](($finishedAt - $startedAt).TotalMilliseconds)
  contract = $contract
  encryptedPersistence = [ordered]@{
    journals = $encryptedJournals
    checkpoints = $checkpoints
    quarantinedTails = $quarantine
    recoveryReceipts = $recoveryReceipts
  }
  executiveControlLoopback = $loopback
  claims = [ordered]@{
    committedContractVerified = ($contract.status -eq "PASSED")
    localEncryptedJournalRuntimeVerified = ($contract.status -eq "PASSED" -and $encryptedJournals.files -gt 0)
    checkpointRuntimeVerified = ($checkpoints.files -gt 0)
    executiveApiVerified = ($loopback.status -eq "REACHABLE")
    cpuBrainRuntimeVerified = $false
    gpuAccelerationVerified = $false
    ollamaVerified = $false
    physicalDeviceVerified = $false
    cloudIntegrationVerified = $false
    vendorPartnershipVerified = $false
    universalDeviceSupportVerified = $false
  }
  safeguards = @(
    "This probe measures local artifacts and loopback health only; it does not decrypt journal payloads.",
    "AES-GCM journal/checkpoint code does not prove a local runtime is active until the contract and runtime receipts pass.",
    "Corrupted tails are quarantined as evidence and the original journal is not silently rewritten.",
    "Key-version metadata supports governed replay; key destruction is never automatic.",
    "TOP_SECRET is prohibited from ordinary operational journals, ordinary embeddings, external plugins, public web, and client rendering.",
    "Vendor/device support requires current evidence-backed verification receipts; targets are not partnerships.",
    "No production mutation, deployment, publishing, money movement, account opening, contract signing, or autonomous counterattack is performed."
  )
}

$outPath = Join-Path $RuntimeRoot "xiv-encrypted-ops-recovery-health.json"
$receipt | ConvertTo-Json -Depth 12 | Set-Content -Path $outPath -Encoding UTF8
Write-Output "12D-69 local receipt written: $outPath"
Write-Output ("contract={0}; encryptedJournals={1}; checkpoints={2}; quarantineFiles={3}; executiveApi={4}" -f $contract.status, $encryptedJournals.files, $checkpoints.files, $quarantine.files, $loopback.status)
