param(
  [int]$FrontendPort = 5173,
  [int]$BackendPort = 0
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

function Wait-ForPort {
  param(
    [int]$Port,
    [int]$TimeoutSeconds = 20
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    $conn = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) { return $conn }
    Start-Sleep -Milliseconds 500
  } while ((Get-Date) -lt $deadline)

  return $null
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")
$backendDir = Join-Path $repoRoot "node_backend"
$frontendDir = Join-Path $repoRoot "tailadmin-vuejs-1.0.0"
$backendEnvPath = Join-Path $backendDir ".env"

Write-Host ""
Write-Host "============================================"
Write-Host " START - Transport Local Server"
Write-Host "============================================"
Write-Host "Repo     : $repoRoot"
Write-Host "Backend  : $backendDir"
Write-Host "Frontend : $frontendDir"
Write-Host ""

if (!(Test-Path (Join-Path $backendDir "package.json"))) {
  throw "package.json backend tidak ditemukan: $backendDir"
}
if (!(Test-Path (Join-Path $frontendDir "package.json"))) {
  throw "package.json frontend tidak ditemukan: $frontendDir"
}

$nodeCmd = Get-Command "node" -ErrorAction SilentlyContinue
$npmCmd = Get-Command "npm" -ErrorAction SilentlyContinue
$cmdExe = $env:ComSpec
if (-not $nodeCmd) {
  throw "Command node tidak ditemukan. Install Node.js terlebih dahulu."
}
if (-not $npmCmd) {
  throw "Command npm tidak ditemukan. Install Node.js terlebih dahulu."
}
if (-not $cmdExe -or -not (Test-Path $cmdExe)) {
  throw "cmd.exe tidak ditemukan."
}

if (!(Test-Path (Join-Path $backendDir "node_modules"))) {
  throw "Dependency backend belum terpasang. Jalankan npm install di $backendDir"
}
if (!(Test-Path (Join-Path $frontendDir "node_modules"))) {
  throw "Dependency frontend belum terpasang. Jalankan npm install di $frontendDir"
}

if ($BackendPort -le 0) {
  $envMap = Read-EnvFile -Path $backendEnvPath
  if ($envMap.ContainsKey("PORT") -and $envMap["PORT"]) {
    $BackendPort = [int]$envMap["PORT"]
  } else {
    $BackendPort = 3000
  }
}

Write-Host "[INFO ] Backend port  : $BackendPort"
Write-Host "[INFO ] Frontend port : $FrontendPort"

$backendConn = Get-NetTCPConnection -State Listen -LocalPort $BackendPort -ErrorAction SilentlyContinue | Select-Object -First 1
if ($backendConn) {
  Write-Host "[INFO ] Backend sudah listen di port $BackendPort (PID $($backendConn.OwningProcess))."
} else {
  Write-Host "[INFO ] Menjalankan backend..."
  Start-Process -FilePath $cmdExe -ArgumentList "/c", "npm start" -WorkingDirectory $backendDir -WindowStyle Minimized | Out-Null

  $backendConn = Wait-ForPort -Port $BackendPort -TimeoutSeconds 60
  if (-not $backendConn) {
    throw "Backend gagal listen di port $BackendPort. Cek terminal backend untuk detail error."
  }
  Write-Host "[OK   ] Backend started (PID $($backendConn.OwningProcess))."
}

$frontendConn = Get-NetTCPConnection -State Listen -LocalPort $FrontendPort -ErrorAction SilentlyContinue | Select-Object -First 1
if ($frontendConn) {
  Write-Host "[INFO ] Frontend sudah listen di port $FrontendPort (PID $($frontendConn.OwningProcess))."
} else {
  Write-Host "[INFO ] Menjalankan frontend..."
  Start-Process -FilePath $cmdExe -ArgumentList "/c", "npm run dev" -WorkingDirectory $frontendDir -WindowStyle Minimized | Out-Null

  $frontendConn = Wait-ForPort -Port $FrontendPort -TimeoutSeconds 90
  if (-not $frontendConn) {
    throw "Frontend gagal listen di port $FrontendPort. Cek terminal frontend untuk detail error."
  }
  Write-Host "[OK   ] Frontend started (PID $($frontendConn.OwningProcess))."
}

$lanIp = Get-NetIPAddress -AddressFamily IPv4 -PrefixOrigin Dhcp,Manual -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -ne "127.0.0.1" -and $_.IPAddress -notlike "169.254.*" } |
  Select-Object -First 1 -ExpandProperty IPAddress

Write-Host ""
Write-Host "[OK   ] Semua service siap."
Write-Host "       Akses lokal   : http://localhost:$FrontendPort/"
if ($lanIp) {
  Write-Host "       Akses jaringan: http://$lanIp`:$FrontendPort/"
}
Write-Host ""
exit 0
