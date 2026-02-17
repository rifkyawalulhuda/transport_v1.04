param(
  [Parameter(Mandatory = $true)]
  [string]$BackupPath,
  [string]$MongoUri = "mongodb://127.0.0.1:27017",
  [string]$Database = "",
  [switch]$Drop,
  [string]$Username = "",
  [string]$Password = "",
  [string]$AuthenticationDatabase = "admin"
)

$ErrorActionPreference = "Stop"

function Resolve-MongoRestore {
  $cmd = Get-Command mongorestore -ErrorAction SilentlyContinue
  if ($cmd) {
    return $cmd.Source
  }

  $candidatePaths = @(
    (Join-Path $env:ProgramFiles "MongoDB\Tools\100\bin\mongorestore.exe"),
    (Join-Path $env:ProgramFiles "MongoDB\Tools\bin\mongorestore.exe")
  )

  foreach ($path in $candidatePaths) {
    if (Test-Path $path) {
      return $path
    }
  }

  $fallback = Get-ChildItem (Join-Path $env:ProgramFiles "MongoDB") -Recurse -Filter "mongorestore.exe" -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty FullName
  if ($fallback) {
    return $fallback
  }

  throw "mongorestore not found. Install MongoDB Database Tools (`winget install MongoDB.DatabaseTools --accept-package-agreements --accept-source-agreements`) then reopen PowerShell."
}

try {
  if (-not (Test-Path -Path $BackupPath)) {
    throw "Backup path not found: $BackupPath"
  }

  $mongorestoreExe = Resolve-MongoRestore

  $args = @(
    "--uri=$MongoUri"
  )

  if ($Drop) {
    $args += "--drop"
  }

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

  $args += $BackupPath

  Write-Host "Running: mongorestore from $BackupPath"
  & $mongorestoreExe @args

  if ($LASTEXITCODE -ne 0) {
    throw "mongorestore failed with exit code $LASTEXITCODE"
  }

  Write-Host "Restore completed successfully."
}
catch {
  Write-Error $_.Exception.Message
  exit 1
}
