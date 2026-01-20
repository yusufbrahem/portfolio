# PowerShell script to change PostgreSQL database password
# Usage: .\scripts\change-db-password.ps1 -NewPassword "your-new-password"

param(
    [Parameter(Mandatory=$true)]
    [string]$NewPassword
)

Write-Host "🔐 Changing PostgreSQL password..." -ForegroundColor Cyan

# Check if container is running
$containerRunning = docker ps --filter "name=portfolio-db" --format "{{.Names}}"
if (-not $containerRunning) {
    Write-Host "❌ Error: portfolio-db container is not running!" -ForegroundColor Red
    Write-Host "   Start it first with: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

# Step 1: Change password in PostgreSQL
Write-Host "Step 1: Changing password in PostgreSQL..." -ForegroundColor Yellow
docker exec -i portfolio-db psql -U postgres -d postgres -c "ALTER USER postgres WITH PASSWORD '$NewPassword';"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to change password in PostgreSQL" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Password changed in PostgreSQL" -ForegroundColor Green

# Step 2: Update docker-compose.yml
Write-Host "Step 2: Updating docker-compose.yml..." -ForegroundColor Yellow
$composeFile = "docker-compose.yml"
if (Test-Path $composeFile) {
    $content = Get-Content $composeFile -Raw
    $content = $content -replace 'POSTGRES_PASSWORD: admin123', "POSTGRES_PASSWORD: $NewPassword"
    Set-Content $composeFile -Value $content -NoNewline
    Write-Host "✅ Updated docker-compose.yml" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: docker-compose.yml not found" -ForegroundColor Yellow
}

# Step 3: Update .env.local
Write-Host "Step 3: Updating .env.local..." -ForegroundColor Yellow
$envFile = ".env.local"
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    # Match any password pattern in DATABASE_URL
    $content = $content -replace '(DATABASE_URL="postgresql://postgres:)[^@]+(@)', "`$1$NewPassword`$2"
    Set-Content $envFile -Value $content -NoNewline
    Write-Host "✅ Updated .env.local" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: .env.local not found. You'll need to update it manually." -ForegroundColor Yellow
    Write-Host "   Set: DATABASE_URL=`"postgresql://postgres:$NewPassword@localhost:5432/portfolio`"" -ForegroundColor Yellow
}

# Step 4: Restart container
Write-Host "Step 4: Restarting container..." -ForegroundColor Yellow
docker-compose restart postgres
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Container restarted" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: Container restart may have failed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Password change complete!" -ForegroundColor Green
Write-Host "   New password: $NewPassword" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Verify connection: docker exec -it portfolio-db psql -U postgres -d portfolio" -ForegroundColor White
Write-Host "   2. Restart your Next.js dev server if it's running" -ForegroundColor White
