param([switch]$Once,[int]$IntervalSeconds=30)
$ErrorActionPreference='Stop'
$repoRoot=Split-Path -Parent $PSScriptRoot
$statusDir=Join-Path $repoRoot '.xiv-runtime'
New-Item -ItemType Directory -Force -Path $statusDir | Out-Null
$statusPath=Join-Path $statusDir 'team-operations-status.json'
function Get-ProcEvidence($name){
  $p=Get-Process -Name $name -ErrorAction SilentlyContinue
  if($p){ return @($p | ForEach-Object { "PROCESS:$($_.ProcessName):PID=$($_.Id)" }) }
  return @()
}
function Snapshot {
  $ollama=@(); try { $tags=Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 3; $ollama=@($tags.models | ForEach-Object { "OLLAMA_MODEL:$($_.name)" }) } catch {}
  $gitBranch=(git -C $repoRoot branch --show-current 2>$null)
  $gitHead=(git -C $repoRoot rev-parse HEAD 2>$null)
  $status=[ordered]@{
    timestamp=(Get-Date).ToUniversalTime().ToString('o')
    repo=$repoRoot
    gitBranch=$gitBranch
    gitHead=$gitHead
    ollamaEvidence=$ollama
    cursorEvidence=(Get-ProcEvidence 'Cursor')
    nodeEvidence=(Get-ProcEvidence 'node')
    powershellEvidence=(Get-ProcEvidence 'powershell')
    grokEvidence=@()
    note='Process presence is runtime evidence only; it does not prove agent identity, authorship, or successful work.'
    productionMutationAllowed=$false
  }
  $status | ConvertTo-Json -Depth 6 | Set-Content $statusPath -Encoding UTF8
  $status | ConvertTo-Json -Depth 6
}
do { Snapshot; if($Once){break}; Start-Sleep -Seconds ([Math]::Max(10,$IntervalSeconds)) } while($true)
