param(
  [int]$BackendPort = 3000,
  [int]$FrontendPort = 5173
)

$ErrorActionPreference = "Stop"

function Stop-PortProcess {
  param(
    [int]$Port,
    [string]$ServiceName
  )

  $conn = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $conn) {
    Write-Host "[INFO ] $ServiceName tidak listen di port $Port."
    return
  }

  $targetPid = $conn.OwningProcess
  try {
    Stop-Process -Id $targetPid -Force -ErrorAction Stop
    Start-Sleep -Milliseconds 800

    $check = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($check) {
      Write-Host "[WARN ] $ServiceName masih listen di port $Port (PID $($check.OwningProcess))."
    } else {
      Write-Host "[OK   ] $ServiceName stopped (port $Port)."
    }
  } catch {
    Write-Host "[WARN ] Gagal menghentikan $ServiceName PID $targetPid. $($_.Exception.Message)"
  }
}

Write-Host ""
Write-Host "============================================"
Write-Host " STOP - Transport Local Server"
Write-Host "============================================"
Write-Host ""

Stop-PortProcess -Port $BackendPort -ServiceName "Backend"
Stop-PortProcess -Port $FrontendPort -ServiceName "Frontend"

Write-Host ""
Write-Host "[DONE ] Stop selesai."
Write-Host ""
exit 0
