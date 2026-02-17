param(
  [string]$Database = "",
  [switch]$AllDatabases,
  [string]$DBHost = "127.0.0.1",
  [int]$Port = 3306,
  [string]$Username = "root",
  [string]$Password = "",
  [string]$OutputRoot = ".\backups_mysql",
  [switch]$NoData
)

$ErrorActionPreference = "Stop"

function Resolve-MySqlDump {
  $cmd = Get-Command mysqldump -ErrorAction SilentlyContinue
  if ($cmd) {
    return $cmd.Source
  }

  $candidatePaths = @(
    "C:\xampp\mysql\bin\mysqldump.exe",
    (Join-Path $env:ProgramFiles "MySQL\MySQL Server 8.0\bin\mysqldump.exe")
  )

  foreach ($path in $candidatePaths) {
    if (Test-Path $path) {
      return $path
    }
  }

  throw "mysqldump not found. Install MySQL client tools or XAMPP MySQL, then retry."
}

try {
  if (-not $AllDatabases -and -not $Database) {
    throw "Set -Database <name> or use -AllDatabases."
  }

  $mysqldumpExe = Resolve-MySqlDump

  $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
  New-Item -ItemType Directory -Path $OutputRoot -Force | Out-Null

  $targetName = if ($AllDatabases) { "all_databases" } else { $Database }
  $outputFile = Join-Path $OutputRoot "$targetName`_$timestamp.sql"
  $errorFile = Join-Path $OutputRoot "$targetName`_$timestamp.error.log"

  $args = @(
    "--host=$DBHost",
    "--port=$Port",
    "--user=$Username",
    "--default-character-set=utf8mb4",
    "--single-transaction",
    "--quick"
  )

  if ($Password) {
    $args += "--password=$Password"
  }

  if ($NoData) {
    $args += "--no-data"
  }

  if ($AllDatabases) {
    $args += "--all-databases"
  }
  else {
    $args += $Database
  }

  Write-Host "Running mysqldump..."
  $process = Start-Process -FilePath $mysqldumpExe -ArgumentList $args -NoNewWindow -Wait -PassThru -RedirectStandardOutput $outputFile -RedirectStandardError $errorFile

  if ($process.ExitCode -ne 0) {
    $errText = if (Test-Path $errorFile) { Get-Content -Raw $errorFile } else { "" }
    throw "mysqldump failed with exit code $($process.ExitCode). $errText"
  }

  if ((Test-Path $errorFile) -and ((Get-Item $errorFile).Length -eq 0)) {
    Remove-Item $errorFile -Force
  }

  Write-Host "Backup completed successfully."
  Write-Host "Backup file: $outputFile"
}
catch {
  Write-Error $_.Exception.Message
  exit 1
}
