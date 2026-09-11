param(
  [string]$RuntimeRoot = ".xiv-runtime",
  [string]$VaultRoot = ".xiv-runtime\vaults",
  [string]$BrainHealthUrl = "http://127.0.0.1:4320/health",
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
    $lines = & npx.cmd --no-install tsx "runtime\offline-team\sovereign-brain-api-studio-vault.test.ts" 2>&1
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

$secretEnvelopes = Measure-Files $VaultRoot "*.xivsecret.json"
$vaultAudit = Measure-Files $VaultRoot "vault-audit.xivjsonl"
$computeReceipts = Measure-Files $RuntimeRoot "*compute*receipt*.json"
$partnerReceipts = Measure-Files $RuntimeRoot "*partner*receipt*.json"
$consentReceipts = Measure-Files $RuntimeRoot "*consent*receipt*.json"
$policyReceipts = Measure-Files $RuntimeRoot "*policy*receipt*.json"

$cpu = [ordered]@{
  status = "UNVERIFIED"
  logicalProcessors = $null
  evidence = @()
}
try {
  $cpu.logicalProcessors = [Environment]::ProcessorCount
  if ($cpu.logicalProcessors -gt 0) {
    $cpu.status = "OBSERVED"
    $cpu.evidence = @("measured-process-environment")
  }
} catch {
  $cpu.evidence = @($_.Exception.Message)
}

$brain = [ordered]@{
  url = $BrainHealthUrl
  status = "UNVERIFIED"
  httpStatus = $null
  latencyMs = $null
  evidence = @()
}
try {
  $uri = [System.Uri]$BrainHealthUrl
  if ($uri.Scheme -ne "http" -and $uri.Scheme -ne "https") { throw "Brain health probe requires HTTP(S)." }
  if ($uri.Host -notin @("127.0.0.1", "localhost", "::1")) { throw "Brain health probe must remain loopback-only." }
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $response = Invoke-WebRequest -Uri $BrainHealthUrl -Method Get -UseBasicParsing -TimeoutSec 3
  $sw.Stop()
  $brain.httpStatus = [int]$response.StatusCode
  $brain.latencyMs = [int]$sw.ElapsedMilliseconds
  $brain.status = if ([int]$response.StatusCode -ge 200 -and [int]$response.StatusCode -lt 300) { "REACHABLE" } else { "UNHEALTHY" }
  $brain.evidence = @("measured-http-response")
} catch {
  $brain.status = "UNVERIFIED"
  $brain.evidence = @($_.Exception.Message)
}

$finishedAt = (Get-Date).ToUniversalTime()
$receipt = [ordered]@{
  story = "12D-70"
  generatedAt = $finishedAt.ToString("o")
  durationMs = [int](($finishedAt - $startedAt).TotalMilliseconds)
  contract = $contract
  cpuObservation = $cpu
  brainLoopback = $brain
  tenantVault = [ordered]@{
    encryptedSecretEnvelopes = $secretEnvelopes
    auditJournals = $vaultAudit
  }
  governanceReceipts = [ordered]@{
    compute = $computeReceipts
    partner = $partnerReceipts
    consent = $consentReceipts
    legalPolicy = $policyReceipts
  }
  claims = [ordered]@{
    committedContractVerified = ($contract.status -eq "PASSED")
    cpuObserved = ($cpu.status -eq "OBSERVED")
    cpuBrainRuntimeVerified = ($brain.status -eq "REACHABLE" -and $computeReceipts.files -gt 0)
    gpuAccelerationVerified = $false
    ollamaVerified = $false
    tenantVaultPersistenceObserved = ($secretEnvelopes.files -gt 0 -and $vaultAudit.files -gt 0)
    externalPartnerVerified = ($partnerReceipts.files -gt 0)
    physicalDeviceVerified = $false
    cloudIntegrationVerified = $false
  }
  safeguards = @(
    "CPU availability observation does not prove the XIV brain worker is running; loopback health plus compute receipts are required.",
    "GPU acceleration is not marked verified by this generic probe; a tenant-scoped hardware/runtime/benchmark receipt is required.",
    "XIV API Studio keeps TOP_SECRET out of hybrid outbound routing, ordinary embeddings, public web, external plugins, and client rendering.",
    "Health, financial, genetic, communications, and social-account connectors require explicit user authorization, minimum scopes, and jurisdiction/legal-policy receipts.",
    "Named companies and services remain TARGET, RESEARCH, or API_READY until current VERIFIED_PARTNER evidence exists.",
    "Tenant vault files are encrypted envelopes; metadata/audit receipts must never contain plaintext secret values.",
    "Offline operation does not imply authorization and no production mutation, deployment, publishing, money movement, account opening, contract signing, or autonomous counterattack is performed."
  )
}

$outPath = Join-Path $RuntimeRoot "xiv-sovereign-brain-api-vault-health.json"
$receipt | ConvertTo-Json -Depth 12 | Set-Content -Path $outPath -Encoding UTF8
Write-Output "12D-70 local receipt written: $outPath"
Write-Output ("contract={0}; cpu={1}; brain={2}; vaultSecrets={3}; vaultAudits={4}" -f $contract.status, $cpu.status, $brain.status, $secretEnvelopes.files, $vaultAudit.files)
