param(
  [string]$NginxDir = "C:\Users\rifky\Downloads\nginx-1.28.2"
)

$ErrorActionPreference = "Stop"

function Read-EnvFile {
  param([string]$Path)
  $map = @{}
  if (!(Test-Path $Path)) { return $map }
  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }
    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { return }
    $key = $line.Substring(0, $idx).Trim()
    $val = $line.Substring($idx + 1).Trim()
    if (($val.StartsWith('"') -and $val.EndsWith('"')) -or ($val.StartsWith("'") -and $val.EndsWith("'"))) {
      $val = $val.Substring(1, $val.Length - 2)
    }
    $map[$key] = $val
  }
  return $map
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..")
$backendDir = Join-Path $repoRoot "node_backend"
$envFile = Join-Path $backendDir ".env"
$envMap = Read-EnvFile -Path $envFile

$backendPort = 3000
if ($envMap.ContainsKey("PORT")) {
  $parsedPort = 0
  if ([int]::TryParse($envMap["PORT"], [ref]$parsedPort)) {
    $backendPort = $parsedPort
  }
}

Write-Host ""
Write-Host "============================================"
Write-Host " STOP - Transport v1.04 Local Server"
Write-Host "============================================"
Write-Host ""

$backendConn = Get-NetTCPConnection -State Listen -LocalPort $backendPort -ErrorAction SilentlyContinue | Select-Object -First 1
if ($backendConn) {
  Stop-Process -Id $backendConn.OwningProcess -Force -ErrorAction SilentlyContinue
  Start-Sleep -Milliseconds 800
  $checkConn = Get-NetTCPConnection -State Listen -LocalPort $backendPort -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($checkConn) {
    Write-Host "[WARN ] Backend masih listen di port $backendPort (PID $($checkConn.OwningProcess))."
  } else {
    Write-Host "[OK   ] Backend stopped."
  }
} else {
  Write-Host "[INFO ] Backend tidak sedang listen di port $backendPort."
}

$nginxExe = Join-Path $NginxDir "nginx.exe"
if (!(Test-Path $nginxExe)) {
  Write-Host "[WARN ] nginx.exe tidak ditemukan di: $NginxDir"
  Write-Host "       Lewati stop Nginx."
  exit 0
}

$nginxProcesses = Get-Process -Name "nginx" -ErrorAction SilentlyContinue
if ($nginxProcesses) {
  $nginxProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
  Write-Host "[OK   ] Nginx stopped."
} else {
  Write-Host "[INFO ] Nginx tidak sedang berjalan."
}

Write-Host ""
Write-Host "[DONE ] Stop selesai."
Write-Host ""
exit 0
