param([switch]$Once)
$ErrorActionPreference = 'SilentlyContinue'
$root = Resolve-Path "$PSScriptRoot\.."
$outDir = Join-Path $root '.xiv-runtime'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Signal($name, $state, $detail, $evidence) {
  [pscustomobject]@{ component=$name; state=$state; checkedAt=(Get-Date).ToString('o'); detail=$detail; evidenceRefs=@($evidence) }
}

$signals = @()
$ollamaOk = $false
try { $r = Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2; $ollamaOk = $null -ne $r }
catch { $ollamaOk = $false }
$signals += Signal 'OLLAMA' ($(if($ollamaOk){'HEALTHY'}else{'OFFLINE'})) ($(if($ollamaOk){'local endpoint reachable'}else{'local endpoint unreachable'})) ($(if($ollamaOk){'http://127.0.0.1:11434/api/tags'}else{$null}))

foreach($cmd in @('node','git')) {
  $found = Get-Command $cmd
  $signals += Signal ($(if($cmd -eq 'node'){'CPU'}else{'STORAGE'})) ($(if($found){'HEALTHY'}else{'UNVERIFIED'})) "$cmd command probe" ($(if($found){$found.Source}else{$null}))
}

$runtimeFiles = @('company-brain-status.json','tool-heartbeats.json')
foreach($f in $runtimeFiles) {
  $p = Join-Path $outDir $f
  if(Test-Path $p) { $signals += Signal 'COMPANY_BRAIN' 'HEALTHY' "$f present" $p }
}
if(-not ($signals.component -contains 'COMPANY_BRAIN')) { $signals += Signal 'COMPANY_BRAIN' 'UNVERIFIED' 'no fresh local receipt found' $null }

$receipt = [pscustomobject]@{
  receiptVersion='12D-56'; checkedAt=(Get-Date).ToString('o'); signals=$signals;
  productionMutationAllowed=$false; note='Detected is not verified; receipt reflects only local probes run now.'
}
$path = Join-Path $outDir 'xiv-brain-health.json'
$receipt | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $path
Write-Host "XIV brain health receipt: $path"
Get-Content $path
