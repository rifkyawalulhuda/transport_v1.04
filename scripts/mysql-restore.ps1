param(
  [Parameter(Mandatory = $true)]
  [string]$BackupFile,
  [string]$Database = "",
  [string]$DBHost = "127.0.0.1",
  [int]$Port = 3306,
  [string]$Username = "root",
  [string]$Password = ""
)

$ErrorActionPreference = "Stop"

function Resolve-MySqlClient {
  $cmd = Get-Command mysql -ErrorAction SilentlyContinue
  if ($cmd) {
    return $cmd.Source
  }

  $candidatePaths = @(
    "C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe",
    "C:\xampp\mysql\bin\mysql.exe",
    (Join-Path $env:ProgramFiles "MySQL\MySQL Server 8.0\bin\mysql.exe")
  )

  foreach ($path in $candidatePaths) {
    if (Test-Path $path) {
      return $path
    }
  }

  throw "mysql client not found. Install MySQL client tools or XAMPP MySQL, then retry."
}

try {
  if (-not (Test-Path $BackupFile)) {
    throw "Backup file not found: $BackupFile"
  }

  $mysqlExe = Resolve-MySqlClient
  $tempDir = Join-Path $env:TEMP "mysql_restore_logs"
  New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
  $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
  $errorFile = Join-Path $tempDir "mysql_restore_$timestamp.error.log"

  $args = @(
    "--host=$DBHost",
    "--port=$Port",
    "--user=$Username",
    "--default-character-set=utf8mb4"
  )

  if ($Password) {
    $args += "--password=$Password"
  }

  if ($Database) {
    $args += $Database
  }

  Write-Host "Running mysql restore..."
  $process = Start-Process -FilePath $mysqlExe -ArgumentList $args -NoNewWindow -Wait -PassThru -RedirectStandardInput $BackupFile -RedirectStandardError $errorFile

  if ($process.ExitCode -ne 0) {
    $errText = if (Test-Path $errorFile) { Get-Content -Raw $errorFile } else { "" }
    throw "mysql restore failed with exit code $($process.ExitCode). $errText"
  }

  if ((Test-Path $errorFile) -and ((Get-Item $errorFile).Length -eq 0)) {
    Remove-Item $errorFile -Force
  }

  Write-Host "Restore completed successfully."
}
catch {
  Write-Error $_.Exception.Message
  exit 1
}
