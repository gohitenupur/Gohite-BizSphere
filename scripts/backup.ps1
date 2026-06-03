# Full database backup — ALL tables (Windows)
$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$BackupDir = Join-Path $RootDir "backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$Output = Join-Path $BackupDir "gohite_$Timestamp.sql"

if (-not $env:DATABASE_URL) {
  $EnvFile = Join-Path $RootDir ".env"
  if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
      if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim().Trim('"'), 'Process')
      }
    }
  }
}

if (-not $env:DATABASE_URL) {
  Write-Error "DATABASE_URL is not set"
}

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
pg_dump $env:DATABASE_URL --no-owner --no-acl -f $Output
Write-Host "Backup written to $Output"
