param(
  [string]$BackupRoot = "",
  [string]$MySqlBackupFile = "",
  [string]$MongoBackupPath = "",
  [switch]$SkipMySql,
  [switch]$SkipMongo,
  [switch]$DropMongo,
  [switch]$Force,
  [switch]$DryRun
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

function Parse-DbHostAndPort {
  param(
    [string]$RawHost,
    [int]$DefaultPort = 3306
  )

  if (-not $RawHost) {
    return [PSCustomObject]@{
      Host = "127.0.0.1"
      Port = $DefaultPort
    }
  }

  if ($RawHost -match "^\[(.+)\]:(\d+)$") {
    return [PSCustomObject]@{
      Host = $Matches[1]
      Port = [int]$Matches[2]
    }
  }

  if ($RawHost -match "^([^:]+):(\d+)$") {
    return [PSCustomObject]@{
      Host = $Matches[1]
      Port = [int]$Matches[2]
    }
  }

  return [PSCustomObject]@{
    Host = $RawHost
    Port = $DefaultPort
  }
}

function Resolve-LatestAutoBackupRoot {
  param([string]$BackupsBasePath)

  if (!(Test-Path $BackupsBasePath)) {
    throw "Folder backup tidak ditemukan: $BackupsBasePath"
  }

  $latest = Get-ChildItem -Path $BackupsBasePath -Directory -Filter "auto_*" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if (-not $latest) {
    throw "Folder auto backup tidak ditemukan di: $BackupsBasePath"
  }

  return $latest.FullName
}

function Resolve-LatestMySqlBackup {
  param([string]$Root)

  $mysqlDir = Join-Path $Root "mysql"
  $searchPath = if (Test-Path $mysqlDir) { $mysqlDir } else { $Root }

  $latest = Get-ChildItem -Path $searchPath -Recurse -File -Filter "*.sql" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if (-not $latest) {
    throw "File backup MySQL (*.sql) tidak ditemukan di: $searchPath"
  }

  return $latest.FullName
}

function Resolve-LatestMongoBackupPath {
  param(
    [string]$Root,
    [string]$DatabaseName = ""
  )

  $mongoDir = Join-Path $Root "mongo"
  $searchPath = if (Test-Path $mongoDir) { $mongoDir } else { $Root }

  $dumpRoots = Get-ChildItem -Path $searchPath -Directory -Filter "mongo_*" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending
  if ($dumpRoots) {
    $latestRoot = ($dumpRoots | Select-Object -First 1).FullName
    if ($DatabaseName) {
      $dbSubDir = Join-Path $latestRoot $DatabaseName
      if (Test-Path $dbSubDir) {
        return $dbSubDir
      }
    }
    return $latestRoot
  }

  $candidateDirs = Get-ChildItem -Path $searchPath -Directory -Recurse -ErrorAction SilentlyContinue |
    Where-Object {
      (Get-ChildItem -Path $_.FullName -File -Filter "*.bson" -ErrorAction SilentlyContinue | Select-Object -First 1)
    } |
    Sort-Object LastWriteTime -Descending

  $latest = $candidateDirs | Select-Object -First 1
  if (-not $latest) {
    throw "Folder backup MongoDB tidak ditemukan di: $searchPath"
  }

  $fallbackRoot = Split-Path -Parent $latest.FullName
  if ($DatabaseName) {
    $dbSubDir = Join-Path $fallbackRoot $DatabaseName
    if (Test-Path $dbSubDir) {
      return $dbSubDir
    }
  }

  return $fallbackRoot
}

function Parse-MongoDatabaseFromUri {
  param([string]$MongoUri)

  if (-not $MongoUri) {
    return $null
  }

  try {
    $uri = [Uri]$MongoUri
    $db = $uri.AbsolutePath.Trim("/")
    if ($db) {
      return [Uri]::UnescapeDataString($db)
    }
  } catch {
    return $null
  }

  return $null
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")
$envPath = Join-Path $repoRoot "node_backend\.env"
$backupsBase = Join-Path $scriptDir "backups"
$mysqlRestoreScript = Join-Path $scriptDir "mysql-restore.ps1"
$mongoRestoreScript = Join-Path $scriptDir "mongo-restore.ps1"

Write-Host ""
Write-Host "============================================"
Write-Host " AUTO RESTORE - TRANSPORT V1.04"
Write-Host "============================================"
Write-Host "Repo  : $repoRoot"
Write-Host "Env   : $envPath"
Write-Host ""

if ($SkipMySql -and $SkipMongo) {
  throw "Tidak ada database yang dipilih untuk di-restore. Lepas salah satu flag skip."
}
if (!(Test-Path $envPath)) {
  throw "File env tidak ditemukan: $envPath"
}
if (!(Test-Path $mysqlRestoreScript)) {
  throw "Script MySQL restore tidak ditemukan: $mysqlRestoreScript"
}
if (!(Test-Path $mongoRestoreScript)) {
  throw "Script Mongo restore tidak ditemukan: $mongoRestoreScript"
}

$envMap = Read-EnvFile -Path $envPath

if (-not $BackupRoot) {
  $BackupRoot = Resolve-LatestAutoBackupRoot -BackupsBasePath $backupsBase
} else {
  $BackupRoot = [System.IO.Path]::GetFullPath($BackupRoot)
}

if (!(Test-Path $BackupRoot)) {
  throw "Backup root tidak ditemukan: $BackupRoot"
}

$dbName = $envMap["DB_NAME"]
if (-not $dbName) {
  throw "DB_NAME tidak ditemukan di node_backend/.env"
}

$dbUser = $envMap["DB_USER"]
if (-not $dbUser) {
  $dbUser = "root"
}

$dbPass = $envMap["DB_PASS"]
$dbPort = 3306
if ($envMap.ContainsKey("DB_PORT") -and $envMap["DB_PORT"]) {
  $dbPort = [int]$envMap["DB_PORT"]
}
$hostAndPort = Parse-DbHostAndPort -RawHost $envMap["DB_HOST"] -DefaultPort $dbPort

$resolvedMySqlFile = $null
$resolvedMongoPath = $null
$mongoUri = $envMap["MONGO_URI"]
$mongoDbName = Parse-MongoDatabaseFromUri -MongoUri $mongoUri

if (-not $SkipMySql) {
  if ($MySqlBackupFile) {
    $resolvedMySqlFile = [System.IO.Path]::GetFullPath($MySqlBackupFile)
    if (!(Test-Path $resolvedMySqlFile)) {
      throw "File backup MySQL tidak ditemukan: $resolvedMySqlFile"
    }
  } else {
    $resolvedMySqlFile = Resolve-LatestMySqlBackup -Root $BackupRoot
  }
}

if (-not $SkipMongo) {
  if (-not $mongoUri) {
    throw "MONGO_URI tidak ditemukan di node_backend/.env"
  }

  if ($MongoBackupPath) {
    $resolvedMongoPath = [System.IO.Path]::GetFullPath($MongoBackupPath)
    if (!(Test-Path $resolvedMongoPath)) {
      throw "Path backup MongoDB tidak ditemukan: $resolvedMongoPath"
    }
  } else {
    $resolvedMongoPath = Resolve-LatestMongoBackupPath -Root $BackupRoot -DatabaseName $mongoDbName
  }
}

Write-Host "[INFO ] BackupRoot : $BackupRoot"
Write-Host "[INFO ] DryRun     : $DryRun"
Write-Host "[INFO ] MySQL      : $(-not $SkipMySql)"
if (-not $SkipMySql) {
  Write-Host "        DB Host   : $($hostAndPort.Host)"
  Write-Host "        DB Port   : $($hostAndPort.Port)"
  Write-Host "        DB Name   : $dbName"
  Write-Host "        DB User   : $dbUser"
  Write-Host "        SQL File  : $resolvedMySqlFile"
}
Write-Host "[INFO ] MongoDB    : $(-not $SkipMongo)"
if (-not $SkipMongo) {
  Write-Host "        URI       : $mongoUri"
  Write-Host "        DB Name   : $mongoDbName"
  Write-Host "        Path      : $resolvedMongoPath"
  Write-Host "        Drop      : $DropMongo"
}

if ($DryRun) {
  Write-Host ""
  Write-Host "[OK   ] Dry-run selesai. Tidak ada perubahan data."
  Write-Host ""
  exit 0
}

if (-not $Force) {
  Write-Host ""
  Write-Host "[WARN ] Restore akan menimpa data target."
  $confirm = Read-Host "Ketik YES untuk lanjut"
  if ($confirm -ne "YES") {
    Write-Host "[INFO ] Restore dibatalkan."
    exit 0
  }
}

if (-not $SkipMySql) {
  Write-Host "[INFO ] Menjalankan restore MySQL..."
  & $mysqlRestoreScript `
    -BackupFile $resolvedMySqlFile `
    -Database $dbName `
    -DBHost $hostAndPort.Host `
    -Port $hostAndPort.Port `
    -Username $dbUser `
    -Password $dbPass

  if (-not $?) {
    throw "Restore MySQL gagal."
  }
}

if (-not $SkipMongo) {
  Write-Host "[INFO ] Menjalankan restore MongoDB..."
  $mongoParams = @{
    BackupPath = $resolvedMongoPath
    MongoUri = $mongoUri
  }
  if ($mongoDbName) {
    $mongoParams["Database"] = $mongoDbName
  }
  if ($DropMongo) {
    $mongoParams["Drop"] = $true
  }

  & $mongoRestoreScript @mongoParams

  if (-not $?) {
    throw "Restore MongoDB gagal."
  }
}

Write-Host ""
Write-Host "[OK   ] Auto restore selesai."
Write-Host ""
exit 0
