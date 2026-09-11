param(
  [string]$DataRoot = ".xiv-data",
  [string]$ReceiptPath = ".xiv-runtime/xiv-persistence-health.json"
)

$ErrorActionPreference = "Stop"
$checkedAt = (Get-Date).ToUniversalTime().ToString("o")
$root = [System.IO.Path]::GetFullPath($DataRoot)
$exists = Test-Path -LiteralPath $root -PathType Container
$eventFiles = @()
$totalBytes = 0

if ($exists) {
  $eventFiles = @(Get-ChildItem -LiteralPath $root -Recurse -File -Filter "*.jsonl" -ErrorAction SilentlyContinue)
  foreach ($file in $eventFiles) { $totalBytes += $file.Length }
}

$status = if (-not $exists) { "OFFLINE" } elseif ($eventFiles.Count -eq 0) { "DETECTED" } else { "VERIFIED" }
$receipt = [ordered]@{
  component = "xiv-local-persistence"
  status = $status
  checkedAt = $checkedAt
  dataRoot = $root
  rootExists = $exists
  eventFileCount = $eventFiles.Count
  persistedBytes = $totalBytes
  mutationPerformed = $false
  notes = @(
    "This probe does not decrypt event payloads.",
    "VERIFIED means encrypted JSONL persistence files were observed locally; it does not prove semantic correctness or cloud synchronization.",
    "No production data, accounts, payments, contracts, or external vendor systems are changed by this probe."
  )
}

$receiptDirectory = Split-Path -Parent $ReceiptPath
if ($receiptDirectory) { New-Item -ItemType Directory -Force -Path $receiptDirectory | Out-Null }
$receipt | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8
$receipt | ConvertTo-Json -Depth 5
