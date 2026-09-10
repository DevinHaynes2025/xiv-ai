param(
  [switch]$Once,
  [int]$IntervalSeconds = 60
)

$ErrorActionPreference = 'SilentlyContinue'
$runtime = Join-Path $PSScriptRoot '..\.xiv-runtime'
New-Item -ItemType Directory -Force -Path $runtime | Out-Null
$out = Join-Path $runtime 'tool-heartbeats.json'

function Test-Cmd($name) {
  $cmd = Get-Command $name -ErrorAction SilentlyContinue
  return [bool]$cmd
}

function Get-HeartbeatSnapshot {
  $ollamaReachable = $false
  try {
    $null = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2
    $ollamaReachable = $true
  } catch {}

  $adb = Test-Cmd 'adb'
  $git = Test-Cmd 'git'
  $node = Test-Cmd 'node'
  $java = Test-Cmd 'java'

  [ordered]@{
    checkedAt = (Get-Date).ToString('o')
    ollama = @{ health = $(if ($ollamaReachable) {'ACTIVE'} else {'OFFLINE'}); evidence = @($(if ($ollamaReachable) {'http://127.0.0.1:11434/api/tags'})) }
    adb = @{ health = $(if ($adb) {'AVAILABLE'} else {'UNVERIFIED'}); evidence = @($(if ($adb) {'Get-Command adb'})) }
    git = @{ health = $(if ($git) {'AVAILABLE'} else {'UNVERIFIED'}); evidence = @($(if ($git) {'Get-Command git'})) }
    node = @{ health = $(if ($node) {'AVAILABLE'} else {'UNVERIFIED'}); evidence = @($(if ($node) {'Get-Command node'})) }
    java = @{ health = $(if ($java) {'AVAILABLE'} else {'UNVERIFIED'}); evidence = @($(if ($java) {'Get-Command java'})) }
    productionMutationAllowed = $false
  }
}

do {
  Get-HeartbeatSnapshot | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 $out
  Write-Host "XIV tool heartbeat receipt: $out"
  if ($Once) { break }
  Start-Sleep -Seconds ([Math]::Max(10, $IntervalSeconds))
} while ($true)
