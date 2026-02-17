param(
  [string]$OutputRoot = "",
  [switch]$SkipMySql,
  [switch]$SkipMongo
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

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")
$envPath = Join-Path $repoRoot "node_backend\.env"
$mysqlScript = Join-Path $scriptDir "mysql-backup.ps1"
$mongoScript = Join-Path $scriptDir "mongo-backup.ps1"

Write-Host ""
Write-Host "============================================"
Write-Host " AUTO BACKUP - TRANSPORT V1.04"
Write-Host "============================================"
Write-Host "Repo  : $repoRoot"
Write-Host "Env   : $envPath"
Write-Host ""

if (!(Test-Path $envPath)) {
  throw "File env tidak ditemukan: $envPath"
}
if (!(Test-Path $mysqlScript)) {
  throw "Script MySQL backup tidak ditemukan: $mysqlScript"
}
if (!(Test-Path $mongoScript)) {
  throw "Script Mongo backup tidak ditemukan: $mongoScript"
}

$envMap = Read-EnvFile -Path $envPath

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
if (-not $OutputRoot) {
  $OutputRoot = Join-Path $scriptDir "backups\auto_$timestamp"
} else {
  $OutputRoot = [System.IO.Path]::GetFullPath($OutputRoot)
}

$mysqlOutput = Join-Path $OutputRoot "mysql"
$mongoOutput = Join-Path $OutputRoot "mongo"
New-Item -ItemType Directory -Path $mysqlOutput -Force | Out-Null
New-Item -ItemType Directory -Path $mongoOutput -Force | Out-Null

if ($SkipMySql -and $SkipMongo) {
  throw "Tidak ada database yang dipilih untuk dibackup. Lepas salah satu flag skip."
}

if (-not $SkipMySql) {
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

  Write-Host "[INFO ] Menjalankan backup MySQL..."
  & $mysqlScript `
    -Database $dbName `
    -DBHost $hostAndPort.Host `
    -Port $hostAndPort.Port `
    -Username $dbUser `
    -Password $dbPass `
    -OutputRoot $mysqlOutput

  if (-not $?) {
    throw "Backup MySQL gagal."
  }
}

if (-not $SkipMongo) {
  $mongoUri = $envMap["MONGO_URI"]
  if (-not $mongoUri) {
    throw "MONGO_URI tidak ditemukan di node_backend/.env"
  }

  Write-Host "[INFO ] Menjalankan backup MongoDB..."
  & $mongoScript `
    -MongoUri $mongoUri `
    -OutputRoot $mongoOutput

  if (-not $?) {
    throw "Backup MongoDB gagal."
  }
}

Write-Host ""
Write-Host "[OK   ] Auto backup selesai."
Write-Host "        Output: $OutputRoot"
Write-Host ""
exit 0
