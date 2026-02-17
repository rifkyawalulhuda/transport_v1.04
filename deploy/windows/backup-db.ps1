param(
  [string]$OutputDir,
  [ValidateSet("auto", "host", "docker")]
  [string]$Mode = "auto",
  [string]$MySqlContainer = "",
  [string]$MongoContainer = ""
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

function Test-CommandAvailable {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-DockerContainerByImageHints {
  param([string[]]$Hints)
  if (-not (Test-CommandAvailable "docker")) { return $null }
  $rows = & docker ps --format "{{.Names}}|{{.Image}}" 2>$null
  if ($LASTEXITCODE -ne 0 -or -not $rows) { return $null }

  foreach ($row in $rows) {
    $parts = $row.Split("|", 2)
    if ($parts.Count -ne 2) { continue }
    $name = $parts[0]
    $image = $parts[1].ToLowerInvariant()
    foreach ($hint in $Hints) {
      if ($image.Contains($hint.ToLowerInvariant())) {
        return $name
      }
    }
  }
  return $null
}

function Invoke-Process {
  param(
    [string]$FilePath,
    [string[]]$ArgumentList,
    [string]$StdOutPath = $null,
    [string]$StdErrPath = $null
  )

  $params = @{
    FilePath = $FilePath
    ArgumentList = $ArgumentList
    Wait = $true
    PassThru = $true
    NoNewWindow = $true
  }
  if ($StdOutPath) { $params["RedirectStandardOutput"] = $StdOutPath }
  if ($StdErrPath) { $params["RedirectStandardError"] = $StdErrPath }

  $proc = Start-Process @params
  return $proc.ExitCode
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..")
$backendDir = Join-Path $repoRoot "node_backend"
$envFile = Join-Path $backendDir ".env"
$envMap = Read-EnvFile -Path $envFile

$dbHost = if ($envMap.ContainsKey("DB_HOST")) { $envMap["DB_HOST"] } else { "localhost" }
$dbPort = if ($envMap.ContainsKey("DB_PORT")) { $envMap["DB_PORT"] } else { "3306" }
$dbUser = $envMap["DB_USER"]
$dbPass = $envMap["DB_PASS"]
$dbName = if ($envMap.ContainsKey("DB_NAME")) { $envMap["DB_NAME"] } else { "trucking" }
$mongoUri = $envMap["MONGO_URI"]

if (-not $dbUser -or -not $dbName) {
  throw "DB_USER atau DB_NAME tidak ditemukan di $envFile"
}
if (-not $mongoUri) {
  throw "MONGO_URI tidak ditemukan di $envFile"
}

$backupsRoot = Join-Path $scriptDir "backups"
if (!(Test-Path $backupsRoot)) {
  New-Item -ItemType Directory -Path $backupsRoot | Out-Null
}

if (-not $OutputDir) {
  $stamp = Get-Date -Format "yyyyMMdd_HHmmss"
  $OutputDir = Join-Path $backupsRoot "backup_$stamp"
}
$OutputDir = [System.IO.Path]::GetFullPath($OutputDir)
if (!(Test-Path $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$mysqlOut = Join-Path $OutputDir "mysql.sql"
$mongoOut = Join-Path $OutputDir "mongo.archive.gz"
$stderrTmp = Join-Path $env:TEMP "transport_backup_err.log"
Remove-Item $stderrTmp -ErrorAction SilentlyContinue

$hostMySqlAvailable = Test-CommandAvailable "mysqldump"
$hostMongoAvailable = Test-CommandAvailable "mongodump"
$dockerAvailable = Test-CommandAvailable "docker"

if (-not $MySqlContainer) {
  $MySqlContainer = Get-DockerContainerByImageHints -Hints @("mysql", "mariadb")
}
if (-not $MongoContainer) {
  $MongoContainer = Get-DockerContainerByImageHints -Hints @("mongo")
}

Write-Host ""
Write-Host "============================================"
Write-Host " BACKUP DB - Transport v1.04"
Write-Host "============================================"
Write-Host "Env File         : $envFile"
Write-Host "Output Folder    : $OutputDir"
Write-Host "Mode             : $Mode"
Write-Host "MySQL Host       : ${dbHost}:$dbPort/$dbName"
Write-Host "Mongo URI        : $mongoUri"
Write-Host "MySQL Container  : $(if($MySqlContainer){$MySqlContainer}else{'(auto-not-found)'})"
Write-Host "Mongo Container  : $(if($MongoContainer){$MongoContainer}else{'(auto-not-found)'})"
Write-Host ""

function Resolve-EngineMode {
  param(
    [string]$GlobalMode,
    [bool]$HostAvailable,
    [bool]$DockerAvailable,
    [string]$ContainerName,
    [string]$EngineName
  )

  if ($GlobalMode -eq "host") {
    if (-not $HostAvailable) { throw "Mode host untuk $EngineName dipilih tapi command host tidak tersedia." }
    return "host"
  }
  if ($GlobalMode -eq "docker") {
    if (-not $DockerAvailable) { throw "Mode docker untuk $EngineName dipilih tapi docker tidak tersedia." }
    if (-not $ContainerName) { throw "Mode docker untuk $EngineName dipilih tapi container tidak ditemukan." }
    return "docker"
  }

  if ($HostAvailable) { return "host" }
  if ($DockerAvailable -and $ContainerName) { return "docker" }
  throw "Mode auto gagal untuk ${EngineName}: host command tidak ada, container docker tidak ditemukan."
}

$mysqlMode = Resolve-EngineMode -GlobalMode $Mode -HostAvailable $hostMySqlAvailable -DockerAvailable $dockerAvailable -ContainerName $MySqlContainer -EngineName "MySQL"
$mongoMode = Resolve-EngineMode -GlobalMode $Mode -HostAvailable $hostMongoAvailable -DockerAvailable $dockerAvailable -ContainerName $MongoContainer -EngineName "MongoDB"

Write-Host "[INFO ] Effective mode MySQL  : $mysqlMode"
Write-Host "[INFO ] Effective mode MongoDB: $mongoMode"

# MySQL backup
if ($mysqlMode -eq "host") {
  $mysqlArgs = @("-h", $dbHost, "-P", "$dbPort", "-u", $dbUser)
  if ($dbPass) { $mysqlArgs += "--password=$dbPass" }
  $mysqlArgs += @("--single-transaction", "--routines", "--triggers", $dbName)

  $exit = Invoke-Process -FilePath "mysqldump" -ArgumentList $mysqlArgs -StdOutPath $mysqlOut -StdErrPath $stderrTmp
  if ($exit -ne 0) {
    $err = if (Test-Path $stderrTmp) { Get-Content $stderrTmp -Raw } else { "" }
    throw "mysqldump gagal (exit $exit). $err"
  }
} else {
  $mysqlArgs = @("exec", $MySqlContainer, "mysqldump", "-h", "127.0.0.1", "-P", "3306", "-u", $dbUser)
  if ($dbPass) { $mysqlArgs += "--password=$dbPass" }
  $mysqlArgs += @("--single-transaction", "--routines", "--triggers", $dbName)

  $exit = Invoke-Process -FilePath "docker" -ArgumentList $mysqlArgs -StdOutPath $mysqlOut -StdErrPath $stderrTmp
  if ($exit -ne 0) {
    $err = if (Test-Path $stderrTmp) { Get-Content $stderrTmp -Raw } else { "" }
    throw "docker mysqldump gagal (exit $exit). $err"
  }
}

# Mongo backup
if ($mongoMode -eq "host") {
  $mongoArgs = @("--uri", $mongoUri, "--archive=$mongoOut", "--gzip")
  $exit = Invoke-Process -FilePath "mongodump" -ArgumentList $mongoArgs -StdErrPath $stderrTmp
  if ($exit -ne 0) {
    $err = if (Test-Path $stderrTmp) { Get-Content $stderrTmp -Raw } else { "" }
    throw "mongodump gagal (exit $exit). $err"
  }
} else {
  $tmpMongoInContainer = "/tmp/transport_mongo_backup.gz"
  $escapedUri = $mongoUri.Replace("'", "''")
  & docker exec $MongoContainer sh -lc "mongodump --uri '$escapedUri' --archive=$tmpMongoInContainer --gzip"
  if ($LASTEXITCODE -ne 0) {
    throw "docker exec mongodump gagal (exit $LASTEXITCODE)"
  }

  & docker cp "$MongoContainer`:$tmpMongoInContainer" $mongoOut
  if ($LASTEXITCODE -ne 0) {
    throw "docker cp mongo backup gagal (exit $LASTEXITCODE)"
  }
  & docker exec $MongoContainer rm -f $tmpMongoInContainer | Out-Null
}

$meta = [PSCustomObject]@{
  createdAt = (Get-Date).ToString("o")
  modeRequested = $Mode
  modeMySql = $mysqlMode
  modeMongo = $mongoMode
  mysql = [PSCustomObject]@{
    host = $dbHost
    port = $dbPort
    user = $dbUser
    database = $dbName
    backupFile = $mysqlOut
    dockerContainer = $MySqlContainer
  }
  mongo = [PSCustomObject]@{
    uri = $mongoUri
    backupFile = $mongoOut
    dockerContainer = $MongoContainer
  }
}
$metaPath = Join-Path $OutputDir "backup-meta.json"
$meta | ConvertTo-Json -Depth 10 | Out-File -FilePath $metaPath -Encoding utf8

Write-Host ""
Write-Host "[OK   ] Backup MySQL  : $mysqlOut"
Write-Host "[OK   ] Backup Mongo  : $mongoOut"
Write-Host "[OK   ] Metadata      : $metaPath"
Write-Host ""
exit 0
