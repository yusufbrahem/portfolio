# Backup PostgreSQL database (for portfolio project).
# Usage: .\scripts\backup-database.ps1
# Requires: pg_dump on PATH, OR Docker with portfolio-db container running for local DB.
# Backups are written to scripts/backups/ (created if missing).

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$backupDir = Join-Path $scriptDir "backups"

# Load DATABASE_URL from .env.local or .env
$envFile = Join-Path $projectRoot ".env.local"
if (-not (Test-Path $envFile)) { $envFile = Join-Path $projectRoot ".env" }
if (-not (Test-Path $envFile)) {
    Write-Host "No .env.local or .env found. Set DATABASE_URL and run pg_dump manually." -ForegroundColor Red
    exit 1
}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*DATABASE_URL\s*=\s*["]?(.+?)["]?\s*$') {
        $env:DATABASE_URL = $matches[1].Trim()
    }
}
if (-not $env:DATABASE_URL) {
    Write-Host "DATABASE_URL not set in .env.local or .env" -ForegroundColor Red
    exit 1
}

# Parse URL for Docker (host, user, db)
if ($env:DATABASE_URL -match 'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)') {
    $dbUser = $matches[1]
    $dbHost = $matches[3]
    $dbPort = $matches[4]
    $dbName = $matches[5]
} else {
    $dbUser = "postgres"
    $dbHost = "localhost"
    $dbPort = "5432"
    $dbName = "portfolio"
}

if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupFile = Join-Path $backupDir "portfolio-$timestamp.sql"

# Prefer Docker if localhost and container is running
$useDocker = ($dbHost -eq "localhost" -or $dbHost -eq "127.0.0.1")
if ($useDocker) {
    $containerRunning = docker ps --filter "name=portfolio-db" --format "{{.Names}}" 2>$null
    if ($containerRunning -eq "portfolio-db") {
        Write-Host "Backing up via Docker (portfolio-db)..." -ForegroundColor Cyan
        docker exec portfolio-db pg_dump -U $dbUser -d $dbName --no-owner --no-acl | Set-Content -Path $backupFile -Encoding UTF8
        if ($LASTEXITCODE -ne 0) { Write-Host "pg_dump failed" -ForegroundColor Red; exit 1 }
        Write-Host "Backup saved: $backupFile" -ForegroundColor Green
        exit 0
    }
}

# Fallback: pg_dump on PATH
Write-Host "Backing up via pg_dump..." -ForegroundColor Cyan
& pg_dump $env:DATABASE_URL --no-owner --no-acl -f $backupFile 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "pg_dump failed. Install PostgreSQL client tools or use Docker with portfolio-db." -ForegroundColor Red
    exit 1
}
Write-Host "Backup saved: $backupFile" -ForegroundColor Green
