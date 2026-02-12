param(
  [string]$BackupPath,
  [ValidateSet("auto", "host", "docker")]
  [string]$Mode = "auto",
  [string]$MySqlContainer = "",
  [string]$MongoContainer = "",
  [switch]$Force
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
    [string]$StdErrPath = $null,
    [string]$StdInPath = $null
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
  if ($StdInPath) { $params["RedirectStandardInput"] = $StdInPath }

  $proc = Start-Process @params
  return $proc.ExitCode
}

function Get-LatestBackupDir {
  param([string]$BackupsRoot)
  if (!(Test-Path $BackupsRoot)) { return $null }

  $dirs = Get-ChildItem -Path $BackupsRoot -Directory -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
  foreach ($dir in $dirs) {
    $mysqlFile = Join-Path $dir.FullName "mysql.sql"
    $mongoFile = Join-Path $dir.FullName "mongo.archive.gz"
    if ((Test-Path $mysqlFile) -and (Test-Path $mongoFile)) {
      return $dir.FullName
    }
  }
  return $null
}

function Resolve-BackupFiles {
  param(
    [string]$InputPath,
    [string]$BackupsRoot
  )

  $pickedPath = $InputPath
  if (-not $pickedPath) {
    $pickedPath = Get-LatestBackupDir -BackupsRoot $BackupsRoot
    if (-not $pickedPath) {
      throw "Backup tidak ditemukan. Jalankan backup-db.bat dulu atau kirim path folder backup."
    }
  }

  if (!(Test-Path $pickedPath)) {
    throw "Path backup tidak ditemukan: $pickedPath"
  }

  $fullPath = [System.IO.Path]::GetFullPath($pickedPath)
  $backupDir = $null
  $mysqlFile = $null
  $mongoFile = $null

  if (Test-Path $fullPath -PathType Container) {
    $backupDir = $fullPath
    $mysqlFile = Join-Path $backupDir "mysql.sql"
    $mongoFile = Join-Path $backupDir "mongo.archive.gz"
  } else {
    $parent = Split-Path -Parent $fullPath
    $fileName = [System.IO.Path]::GetFileName($fullPath).ToLowerInvariant()
    $backupDir = $parent

    if ($fileName -eq "mysql.sql") {
      $mysqlFile = $fullPath
      $mongoFile = Join-Path $parent "mongo.archive.gz"
    } elseif ($fileName -eq "mongo.archive.gz") {
      $mongoFile = $fullPath
      $mysqlFile = Join-Path $parent "mysql.sql"
    } elseif ($fileName -eq "backup-meta.json") {
      $mysqlFile = Join-Path $parent "mysql.sql"
      $mongoFile = Join-Path $parent "mongo.archive.gz"
    } else {
      throw "BackupPath harus folder backup, mysql.sql, mongo.archive.gz, atau backup-meta.json"
    }
  }

  if (!(Test-Path $mysqlFile)) { throw "File MySQL backup tidak ditemukan: $mysqlFile" }
  if (!(Test-Path $mongoFile)) { throw "File Mongo backup tidak ditemukan: $mongoFile" }

  $metaFile = Join-Path $backupDir "backup-meta.json"
  return [PSCustomObject]@{
    backupDir = $backupDir
    mysqlFile = $mysqlFile
    mongoFile = $mongoFile
    metaFile = $metaFile
  }
}

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
$backupInfo = Resolve-BackupFiles -InputPath $BackupPath -BackupsRoot $backupsRoot
$meta = $null
if (Test-Path $backupInfo.metaFile) {
  try {
    $meta = Get-Content -Path $backupInfo.metaFile -Raw | ConvertFrom-Json
  } catch {
    Write-Host "[WARN ] backup-meta.json ada tapi gagal dibaca. Lanjut tanpa metadata."
  }
}

$hostMySqlAvailable = Test-CommandAvailable "mysql"
$hostMongoAvailable = Test-CommandAvailable "mongorestore"
$dockerAvailable = Test-CommandAvailable "docker"

if (-not $MySqlContainer -and $meta -and $meta.mysql -and $meta.mysql.dockerContainer) {
  $MySqlContainer = [string]$meta.mysql.dockerContainer
}
if (-not $MongoContainer -and $meta -and $meta.mongo -and $meta.mongo.dockerContainer) {
  $MongoContainer = [string]$meta.mongo.dockerContainer
}

if (-not $MySqlContainer) {
  $MySqlContainer = Get-DockerContainerByImageHints -Hints @("mysql", "mariadb")
}
if (-not $MongoContainer) {
  $MongoContainer = Get-DockerContainerByImageHints -Hints @("mongo")
}

$mysqlMode = Resolve-EngineMode -GlobalMode $Mode -HostAvailable $hostMySqlAvailable -DockerAvailable $dockerAvailable -ContainerName $MySqlContainer -EngineName "MySQL"
$mongoMode = Resolve-EngineMode -GlobalMode $Mode -HostAvailable $hostMongoAvailable -DockerAvailable $dockerAvailable -ContainerName $MongoContainer -EngineName "MongoDB"

Write-Host ""
Write-Host "============================================"
Write-Host " RESTORE DB - Transport v1.04"
Write-Host "============================================"
Write-Host "Env File         : $envFile"
Write-Host "Backup Folder    : $($backupInfo.backupDir)"
Write-Host "MySQL File       : $($backupInfo.mysqlFile)"
Write-Host "Mongo File       : $($backupInfo.mongoFile)"
Write-Host "Mode             : $Mode"
Write-Host "Mode MySQL       : $mysqlMode"
Write-Host "Mode MongoDB     : $mongoMode"
Write-Host "MySQL Container  : $(if($MySqlContainer){$MySqlContainer}else{'(not-used)'})"
Write-Host "Mongo Container  : $(if($MongoContainer){$MongoContainer}else{'(not-used)'})"
Write-Host ""

if (-not $Force) {
  Write-Host "[WARN ] Restore akan overwrite data MySQL dan MongoDB."
  Write-Host "[WARN ] Untuk MongoDB, restore dijalankan dengan --drop."
  $confirm = Read-Host "Ketik YES untuk lanjut"
  if ($confirm -ne "YES") {
    Write-Host "[INFO ] Restore dibatalkan."
    exit 1
  }
}

$stderrTmp = Join-Path $env:TEMP "transport_restore_err.log"
Remove-Item $stderrTmp -ErrorAction SilentlyContinue

$createDbSql = "CREATE DATABASE IF NOT EXISTS ``$dbName`` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"

# MySQL restore
if ($mysqlMode -eq "host") {
  $mysqlBaseArgs = @("-h", $dbHost, "-P", "$dbPort", "-u", $dbUser)
  if ($dbPass) { $mysqlBaseArgs += "--password=$dbPass" }

  $exit = Invoke-Process -FilePath "mysql" -ArgumentList ($mysqlBaseArgs + @("-e", $createDbSql)) -StdErrPath $stderrTmp
  if ($exit -ne 0) {
    $err = if (Test-Path $stderrTmp) { Get-Content $stderrTmp -Raw } else { "" }
    throw "create database MySQL gagal (exit $exit). $err"
  }

  $exit = Invoke-Process -FilePath "mysql" -ArgumentList ($mysqlBaseArgs + @($dbName)) -StdInPath $backupInfo.mysqlFile -StdErrPath $stderrTmp
  if ($exit -ne 0) {
    $err = if (Test-Path $stderrTmp) { Get-Content $stderrTmp -Raw } else { "" }
    throw "restore MySQL gagal (exit $exit). $err"
  }
} else {
  $dockerCreateArgs = @("exec", $MySqlContainer, "mysql", "-u", $dbUser)
  if ($dbPass) { $dockerCreateArgs += "--password=$dbPass" }
  $dockerCreateArgs += @("-e", $createDbSql)

  $exit = Invoke-Process -FilePath "docker" -ArgumentList $dockerCreateArgs -StdErrPath $stderrTmp
  if ($exit -ne 0) {
    $err = if (Test-Path $stderrTmp) { Get-Content $stderrTmp -Raw } else { "" }
    throw "docker create database MySQL gagal (exit $exit). $err"
  }

  $dockerMysqlCmd = "docker exec -i `"$MySqlContainer`" mysql -u `"$dbUser`""
  if ($dbPass) {
    $dockerMysqlCmd += " --password=`"$dbPass`""
  }
  $dockerMysqlCmd += " `"$dbName`""
  $importCmd = "type `"$($backupInfo.mysqlFile)`" | $dockerMysqlCmd"

  $exit = Invoke-Process -FilePath "cmd.exe" -ArgumentList @("/c", $importCmd) -StdErrPath $stderrTmp
  if ($exit -ne 0) {
    $err = if (Test-Path $stderrTmp) { Get-Content $stderrTmp -Raw } else { "" }
    throw "docker restore MySQL gagal (exit $exit). $err"
  }
}

# Mongo restore
if ($mongoMode -eq "host") {
  $mongoArgs = @("--uri", $mongoUri, "--drop", "--archive=$($backupInfo.mongoFile)", "--gzip")
  $exit = Invoke-Process -FilePath "mongorestore" -ArgumentList $mongoArgs -StdErrPath $stderrTmp
  if ($exit -ne 0) {
    $err = if (Test-Path $stderrTmp) { Get-Content $stderrTmp -Raw } else { "" }
    throw "restore MongoDB gagal (exit $exit). $err"
  }
} else {
  $tmpMongoInContainer = "/tmp/transport_mongo_restore.gz"
  & docker cp $backupInfo.mongoFile "$MongoContainer`:$tmpMongoInContainer"
  if ($LASTEXITCODE -ne 0) {
    throw "docker cp file mongo restore gagal (exit $LASTEXITCODE)"
  }

  $escapedUri = $mongoUri.Replace("'", "''")
  & docker exec $MongoContainer sh -lc "mongorestore --uri '$escapedUri' --drop --archive=$tmpMongoInContainer --gzip"
  if ($LASTEXITCODE -ne 0) {
    throw "docker exec mongorestore gagal (exit $LASTEXITCODE)"
  }

  & docker exec $MongoContainer rm -f $tmpMongoInContainer | Out-Null
}

Write-Host ""
Write-Host "[OK   ] Restore MySQL  selesai dari: $($backupInfo.mysqlFile)"
Write-Host "[OK   ] Restore Mongo  selesai dari: $($backupInfo.mongoFile)"
Write-Host ""
exit 0
