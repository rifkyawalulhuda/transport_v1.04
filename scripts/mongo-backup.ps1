param(
  [string]$MongoUri = "mongodb://127.0.0.1:27017",
  [string]$OutputRoot = ".\backups",
  [string]$Database = "",
  [string]$Username = "",
  [string]$Password = "",
  [string]$AuthenticationDatabase = "admin"
)

$ErrorActionPreference = "Stop"

function Resolve-MongoDump {
  $cmd = Get-Command mongodump -ErrorAction SilentlyContinue
  if ($cmd) {
    return $cmd.Source
  }

  $candidatePaths = @(
    (Join-Path $env:ProgramFiles "MongoDB\Tools\100\bin\mongodump.exe"),
    (Join-Path $env:ProgramFiles "MongoDB\Tools\bin\mongodump.exe")
  )

  foreach ($path in $candidatePaths) {
    if (Test-Path $path) {
      return $path
    }
  }

  $fallback = Get-ChildItem (Join-Path $env:ProgramFiles "MongoDB") -Recurse -Filter "mongodump.exe" -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty FullName
  if ($fallback) {
    return $fallback
  }

  throw "mongodump not found. Install MongoDB Database Tools (`winget install MongoDB.DatabaseTools --accept-package-agreements --accept-source-agreements`) then reopen PowerShell."
}

try {
  $mongodumpExe = Resolve-MongoDump

  $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
  $backupDir = Join-Path $OutputRoot "mongo_$timestamp"
  New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

  $args = @(
    "--uri=$MongoUri",
    "--out=$backupDir"
  )

  if ($Database) {
    $args += "--db=$Database"
  }

  if ($Username) {
    if (-not $Password) {
      throw "Password is required when Username is provided."
    }
    $args += "--username=$Username"
    $args += "--password=$Password"
    $args += "--authenticationDatabase=$AuthenticationDatabase"
  }

  Write-Host "Running: mongodump to $backupDir"
  & $mongodumpExe @args

  if ($LASTEXITCODE -ne 0) {
    throw "mongodump failed with exit code $LASTEXITCODE"
  }

  Write-Host "Backup completed successfully."
  Write-Host "Backup path: $backupDir"
}
catch {
  Write-Error $_.Exception.Message
  exit 1
}
