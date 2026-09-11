param(
  [string]$OutputPath = ".xiv-runtime/xiv-data-plane-health.json",
  [string]$ApiHost = "127.0.0.1",
  [int]$ApiPort = 8787,
  [string]$DatabaseHost = "127.0.0.1",
  [int]$DatabasePort = 5432
)

$ErrorActionPreference = "Stop"

function Test-XivTcpService {
  param([string]$Name, [string]$HostName, [int]$Port)
  $started = Get-Date
  $result = Test-NetConnection -ComputerName $HostName -Port $Port -WarningAction SilentlyContinue
  $elapsed = [Math]::Round(((Get-Date) - $started).TotalMilliseconds)
  [pscustomobject]@{
    serviceId = $Name
    host = $HostName
    port = $Port
    status = $(if ($result.TcpTestSucceeded) { "VERIFIED" } else { "OFFLINE" })
    checkedAt = (Get-Date).ToUniversalTime().ToString("o")
    latencyMs = $elapsed
    evidenceRef = $(if ($result.TcpTestSucceeded) { "local-tcp:$HostName`:$Port" } else { $null })
  }
}

$receipt = [pscustomobject]@{
  schema = "xiv.data-plane-health.v1"
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  machine = $env:COMPUTERNAME
  productionMutationPerformed = $false
  services = @(
    (Test-XivTcpService -Name "xiv-local-api" -HostName $ApiHost -Port $ApiPort),
    (Test-XivTcpService -Name "xiv-local-database" -HostName $DatabaseHost -Port $DatabasePort)
  )
}

$directory = Split-Path -Parent $OutputPath
if ($directory -and -not (Test-Path $directory)) { New-Item -ItemType Directory -Path $directory -Force | Out-Null }
$receipt | ConvertTo-Json -Depth 8 | Set-Content -Path $OutputPath -Encoding UTF8
Write-Host "XIV local data runtime receipt written to $OutputPath"
