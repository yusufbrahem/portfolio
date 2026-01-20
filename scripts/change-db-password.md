# How to Change Database Password

## Method 1: Change Password in PostgreSQL (Preserves Data) ✅ Recommended

### Step 1: Connect to PostgreSQL
```bash
docker exec -it portfolio-db psql -U postgres -d portfolio
```

### Step 2: Change the password in PostgreSQL
```sql
ALTER USER postgres WITH PASSWORD 'your-new-password-here';
\q
```

### Step 3: Update docker-compose.yml
Edit `docker-compose.yml` and change:
```yaml
POSTGRES_PASSWORD: your-new-password-here
```

### Step 4: Update .env.local
Edit `.env.local` and update the DATABASE_URL:
```env
DATABASE_URL="postgresql://postgres:your-new-password-here@localhost:5432/portfolio"
```

### Step 5: Restart the container
```bash
docker-compose restart postgres
```

---

## Method 2: Recreate Database (⚠️ Loses All Data)

### Step 1: Stop and remove the container and volume
```bash
docker-compose down -v
```

### Step 2: Update docker-compose.yml
Edit `docker-compose.yml` and change:
```yaml
POSTGRES_PASSWORD: your-new-password-here
```

### Step 3: Update .env.local
Edit `.env.local` and update the DATABASE_URL:
```env
DATABASE_URL="postgresql://postgres:your-new-password-here@localhost:5432/portfolio"
```

### Step 4: Start fresh database
```bash
docker-compose up -d
npm run db:migrate
npm run db:seed
```

---

## Quick Script (Method 1 - Preserves Data)

Save this as `change-password.ps1`:

```powershell
param(
    [Parameter(Mandatory=$true)]
    [string]$NewPassword
)

Write-Host "Changing PostgreSQL password..."

# Connect and change password
docker exec -i portfolio-db psql -U postgres -d postgres -c "ALTER USER postgres WITH PASSWORD '$NewPassword';"

# Update docker-compose.yml
$composeContent = Get-Content docker-compose.yml -Raw
$composeContent = $composeContent -replace 'POSTGRES_PASSWORD: admin123', "POSTGRES_PASSWORD: $NewPassword"
Set-Content docker-compose.yml -Value $composeContent

# Update .env.local if it exists
if (Test-Path .env.local) {
    $envContent = Get-Content .env.local -Raw
    $envContent = $envContent -replace 'postgres:admin123@', "postgres:$NewPassword@"
    Set-Content .env.local -Value $envContent
    Write-Host "Updated .env.local"
}

Write-Host "Password changed! Restarting container..."
docker-compose restart postgres

Write-Host "Done! New password: $NewPassword"
```

Usage:
```powershell
.\change-password.ps1 -NewPassword "my-secure-password-123"
```
