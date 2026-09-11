param(
  [string]$RuntimeRoot = ".xiv-runtime",
  [string]$RagHealthUrl = "http://127.0.0.1:43165/health",
  [int]$TimeoutSeconds = 2
)

$ErrorActionPreference = "Stop"

$uri = [Uri]$RagHealthUrl
if ($uri.Host -notin @("127.0.0.1", "localhost", "::1")) {
  throw "RAG health probe must use loopback only."
}

$runtimePath = Join-Path (Get-Location) $RuntimeRoot
New-Item -ItemType Directory -Force -Path $runtimePath | Out-Null

$keyRoot = Join-Path $runtimePath "tenant-key-rotation"
$reviewRoot = Join-Path $runtimePath "device-sync-review"
$keyFiles = @()
$reviewFiles = @()
if (Test-Path $keyRoot) { $keyFiles = @(Get-ChildItem -Path $keyRoot -File -Recurse -ErrorAction SilentlyContinue) }
if (Test-Path $reviewRoot) { $reviewFiles = @(Get-ChildItem -Path $reviewRoot -File -Recurse -ErrorAction SilentlyContinue) }

$probe = [ordered]@{
  attempted = $true
  endpoint = $RagHealthUrl
  reachable = $false
  statusCode = $null
  latencyMs = $null
  evidence = @()
}

$sw = [System.Diagnostics.Stopwatch]::StartNew()
try {
  $response = Invoke-WebRequest -Uri $RagHealthUrl -Method Get -TimeoutSec $TimeoutSeconds -UseBasicParsing
  $sw.Stop()
  $probe.reachable = $true
  $probe.statusCode = [int]$response.StatusCode
  $probe.latencyMs = [int][Math]::Round($sw.Elapsed.TotalMilliseconds)
  $probe.evidence = @("loopback-http-response")
} catch {
  $sw.Stop()
  $probe.latencyMs = [int][Math]::Round($sw.Elapsed.TotalMilliseconds)
  $probe.evidence = @("loopback-http-probe-failed")
}

$receipt = [ordered]@{
  story = "12D-65"
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  measured = [ordered]@{
    tenantKeyRotationReceiptFiles = $keyFiles.Count
    tenantKeyRotationReceiptBytes = [long](($keyFiles | Measure-Object -Property Length -Sum).Sum)
    deviceSyncReviewFiles = $reviewFiles.Count
    deviceSyncReviewBytes = [long](($reviewFiles | Measure-Object -Property Length -Sum).Sum)
    ragProbe = $probe
  }
  unverified = @(
    "Ollama availability",
    "GPU/NPU availability",
    "cloud connectivity",
    "vendor partnership",
    "universal device support"
  )
  notes = @(
    "This receipt measures local artifacts and a loopback health endpoint only.",
    "No key is retired or destroyed by this script.",
    "No conflict is resolved by this script.",
    "No external endpoint is contacted."
  )
}

$outPath = Join-Path $runtimePath "xiv-key-rag-sync-review-health.json"
$receipt | ConvertTo-Json -Depth 8 | Set-Content -Path $outPath -Encoding UTF8
Write-Output $outPath
