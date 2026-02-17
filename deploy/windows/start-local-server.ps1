param(
  [string]$NginxDir = "C:\Users\rifky\Documents\nginx-1.28.2"
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
$frontendDir = Join-Path $repoRoot "tailadmin-vuejs-1.0.0"
$frontendDistDir = Join-Path $frontendDir "dist"
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
Write-Host " START - Transport v1.04 Local Server"
Write-Host "============================================"
Write-Host "Repo      : $repoRoot"
Write-Host "Backend   : $backendDir"
Write-Host "Frontend  : $frontendDir"
Write-Host "Nginx     : $NginxDir"
Write-Host "API Port  : $backendPort"
Write-Host ""

if (!(Test-Path (Join-Path $backendDir "server.js"))) {
  throw "File backend server.js tidak ditemukan di: $backendDir"
}

if (!(Test-Path (Join-Path $NginxDir "nginx.exe"))) {
  throw "nginx.exe tidak ditemukan di: $NginxDir"
}

if (!(Test-Path (Join-Path $frontendDistDir "index.html"))) {
  Write-Host "[WARN ] Frontend dist belum ada: $frontendDistDir"
  Write-Host "       Jalankan: npm run build di $frontendDir"
  Write-Host ""
}

$backendConn = Get-NetTCPConnection -State Listen -LocalPort $backendPort -ErrorAction SilentlyContinue | Select-Object -First 1
if ($backendConn) {
  Write-Host "[INFO ] Backend sudah listen di port $backendPort (PID $($backendConn.OwningProcess))."
} else {
  Write-Host "[INFO ] Backend belum aktif, menjalankan backend..."
  Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $backendDir -WindowStyle Minimized | Out-Null
  Start-Sleep -Seconds 2

  $backendConn = Get-NetTCPConnection -State Listen -LocalPort $backendPort -ErrorAction SilentlyContinue | Select-Object -First 1
  if (!$backendConn) {
    throw "Backend gagal start di port $backendPort."
  }
  Write-Host "[OK   ] Backend started (PID $($backendConn.OwningProcess))."
}

$nginxExe = Join-Path $NginxDir "nginx.exe"
Push-Location $NginxDir
try {
  $nginxSyntax = cmd /c """$nginxExe"" -t 2>&1"
  if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Konfigurasi Nginx tidak valid."
    $nginxSyntax | ForEach-Object { Write-Host "        $_" }
    exit 1
  }

  $nginxRunning = Get-Process -Name "nginx" -ErrorAction SilentlyContinue
  if ($nginxRunning) {
    cmd /c """$nginxExe"" -s reload" | Out-Null
    if ($LASTEXITCODE -ne 0) {
      Write-Host "[WARN ] Nginx running tapi reload gagal."
    } else {
      Write-Host "[OK   ] Nginx reloaded."
    }
  } else {
    Start-Process -FilePath $nginxExe -WorkingDirectory $NginxDir -WindowStyle Hidden | Out-Null
    Start-Sleep -Milliseconds 800
    $nginxNowRunning = Get-Process -Name "nginx" -ErrorAction SilentlyContinue
    if (!$nginxNowRunning) {
      throw "Gagal start Nginx."
    }
    Write-Host "[OK   ] Nginx started."
  }
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "[OK   ] Semua service siap."
Write-Host "       Cek UI:  http://localhost/"
Write-Host "       Cek API: http://localhost:$backendPort/"
Write-Host ""
exit 0
