param(
  [ValidateSet('Start','Run','Status','Pause','Resume','Stop','InstallStartup','RemoveStartup','Drafts')]
  [string]$Action = 'Status'
)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$aiDir = Join-Path $repoRoot 'services\ai'
$runtime = Join-Path $aiDir '.xiv-runtime\local-draft-worker'
$cli = Join-Path $aiDir 'runtime\offline-team\local-draft-worker.cli.ts'
$tsx = Join-Path $aiDir 'node_modules\tsx\dist\cli.mjs'
$node = (Get-Command node.exe -ErrorAction Stop).Source
$scriptPath = $MyInvocation.MyCommand.Path
$taskName = 'XVI Local Offline Draft Worker'
New-Item -ItemType Directory -Force -Path $runtime | Out-Null
foreach ($path in @((Join-Path $aiDir '.xiv-runtime'), $runtime)) {
  if ((Get-Item -LiteralPath $path).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Runtime links are not allowed.' }
}
if (-not (Test-Path -LiteralPath $tsx)) { throw 'Installed local tsx is required. No automatic downloads.' }
function Invoke-WorkerCommand([string]$Command) {
  & $node $tsx $cli $Command
  if ($LASTEXITCODE -ne 0) { throw 'Local worker command failed.' }
}

switch ($Action) {
  'Status' {
    Invoke-WorkerCommand 'status'
    $supervisorPath = Join-Path $runtime 'supervisor.json'
    if (Test-Path -LiteralPath $supervisorPath) { Get-Content -LiteralPath $supervisorPath }
    return
  }
  'Drafts' { Invoke-WorkerCommand 'drafts'; return }
  'Pause' { Invoke-WorkerCommand 'pause'; return }
  'Stop' { Invoke-WorkerCommand 'stop'; Write-Output 'Stop recorded. An in-flight local request may take up to 60 seconds to settle.'; return }
  'RemoveStartup' {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    return
  }
  'InstallStartup' {
    $identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    $taskAction = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`" -Action Run"
    $trigger = New-ScheduledTaskTrigger -AtLogOn -User $identity
    $principal = New-ScheduledTaskPrincipal -UserId $identity -LogonType Interactive -RunLevel Limited
    $settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 5) -ExecutionTimeLimit ([TimeSpan]::Zero)
    Register-ScheduledTask -TaskName $taskName -Action $taskAction -Trigger $trigger -Principal $principal -Settings $settings -Description 'Local-only XVI draft queue; no cloud models, downloads, source edits, or code execution.' -Force | Out-Null
    Write-Output 'Installed logon startup. Saved STOP remains in force until explicit Start/Resume.'
    return
  }
  { $_ -in @('Start','Resume') } {
    if ($Action -eq 'Start') { Invoke-WorkerCommand 'seed' }
    Invoke-WorkerCommand 'resume'
    $registered = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if ($registered) { Start-ScheduledTask -TaskName $taskName }
    else { Start-Process -FilePath 'powershell.exe' -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`" -Action Run" -WindowStyle Hidden | Out-Null }
    Write-Output 'Background start requested. Use -Action Status to verify.'
    return
  }
}

# Windows releases an abandoned mutex after crashes; never steal a live owner.
$hash = [BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($repoRoot.ToLowerInvariant()))).Replace('-','')
$mutex = New-Object Threading.Mutex($false, "Local\XVI-Offline-$hash")
$owned = $false
$server = $null
$worker = $null
try {
  try { $owned = $mutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $owned = $true }
  if (-not $owned) { Write-Output 'A local supervisor is already active.'; return }
  $state = & $node $tsx $cli status | ConvertFrom-Json
  if ($LASTEXITCODE -ne 0) { throw 'Could not inspect worker control state.' }
  if ($state.mode -eq 'STOPPED') { Write-Output 'Saved stop is active.'; return }
  $ollamaCommand = Get-Command ollama.exe -ErrorAction SilentlyContinue
  $ollamaPath = if ($ollamaCommand) { $ollamaCommand.Source } else { Join-Path $env:LOCALAPPDATA 'Programs\Ollama\ollama.exe' }
  if (-not (Test-Path -LiteralPath $ollamaPath)) { throw 'Installed Ollama executable not found.' }
  $tcp = New-Object Net.Sockets.TcpClient
  try {
    $connection = $tcp.ConnectAsync('127.0.0.1', 11435)
    try { $null = $connection.Wait(1000) } catch { }
    if ($tcp.Connected) { throw 'Dedicated port 11435 is occupied; refusing to adopt an unverified server.' }
  } finally { $tcp.Dispose() }
  # These settings apply to this child server, not the user-wide Ollama application.
  $env:OLLAMA_NO_CLOUD = '1'
  $env:OLLAMA_HOST = '127.0.0.1:11435'
  $env:OLLAMA_NUM_PARALLEL = '1'
  $env:OLLAMA_MAX_LOADED_MODELS = '1'
  $env:OLLAMA_CONTEXT_LENGTH = '2048'
  $server = Start-Process -FilePath $ollamaPath -ArgumentList 'serve' -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtime 'ollama.stdout.log') -RedirectStandardError (Join-Path $runtime 'ollama.stderr.log')
  $ready = $false
  for ($attempt = 0; $attempt -lt 20; $attempt++) {
    if ($server.HasExited) { throw 'Dedicated Ollama server exited.' }
    try {
      $response = Invoke-WebRequest -Uri 'http://127.0.0.1:11435/api/tags' -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 2
      $inventory = $response.Content | ConvertFrom-Json
      if (-not ($inventory.models | Where-Object name -EQ 'qwen2.5:3b')) { throw 'Required local model is absent.' }
      $ready = $true; break
    } catch { Start-Sleep -Seconds 1 }
  }
  if (-not $ready) { throw 'Dedicated local service did not become ready with qwen2.5:3b.' }
  $battery = Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue
  if ($battery | Where-Object { $_.BatteryStatus -eq 1 -and $_.EstimatedChargeRemaining -le 20 }) { Invoke-WorkerCommand 'pause-low-battery' }
  $worker = Start-Process -FilePath $node -ArgumentList "`"$tsx`" `"$cli`" run" -WorkingDirectory $aiDir -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtime 'worker.stdout.log') -RedirectStandardError (Join-Path $runtime 'worker.stderr.log')
  @{ supervisorPid=$PID; workerPid=$worker.Id; ollamaPid=$server.Id; state='RUNNING'; endpoint='127.0.0.1:11435'; cloudDisabledRequested=$true; startedAt=(Get-Date).ToUniversalTime().ToString('o') } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $runtime 'supervisor.json') -Encoding UTF8
  $lastBatteryCheck = Get-Date
  while (-not $worker.HasExited) {
    if ($server.HasExited) { throw 'Dedicated Ollama exited; stop this worker before supervised restart.' }
    if (((Get-Date) - $lastBatteryCheck).TotalSeconds -ge 60) {
      $battery = Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue
      if ($battery | Where-Object { $_.BatteryStatus -eq 1 -and $_.EstimatedChargeRemaining -le 20 }) { Invoke-WorkerCommand 'pause-low-battery' }
      $lastBatteryCheck = Get-Date
    }
    Start-Sleep -Seconds 2
  }
  $worker.WaitForExit()
  if ($worker.ExitCode -ne 0) { throw 'Local worker exited with failure.' }
} finally {
  # Kill only process trees created by this supervisor, including tsx/model children.
  if ($worker -and -not $worker.HasExited) {
    & "$env:SystemRoot\System32\taskkill.exe" /PID $worker.Id /T /F | Out-Null
    $worker.WaitForExit()
  }
  if ($server -and -not $server.HasExited) {
    & "$env:SystemRoot\System32\taskkill.exe" /PID $server.Id /T /F | Out-Null
    $server.WaitForExit()
  }
  if ($owned) {
    @{ state='STOPPED'; stoppedAt=(Get-Date).ToUniversalTime().ToString('o') } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $runtime 'supervisor.json') -Encoding UTF8
    $mutex.ReleaseMutex()
  }
  $mutex.Dispose()
}
