# Docker Setup Guide

This project uses Docker Compose to run PostgreSQL locally for development.

## Prerequisites

- [Docker](https://www.docker.com/get-started) installed and running
- [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)

## Quick Start

### 1. Start PostgreSQL Database

```bash
docker-compose up -d
```

This will:
- Pull the PostgreSQL image (if not already downloaded)
- Create a container named `portfolio-db`
- Start PostgreSQL on port `5432`
- Create a database named `portfolio`
- Set up persistent volume for data

### 2. Check Database Status

```bash
# Check if container is running
docker-compose ps

# View logs
docker-compose logs postgres

# Connect to database (optional)
docker exec -it portfolio-db psql -U postgres -d portfolio
```

### 3. Configure Environment Variables

Create `.env.local` file:

```bash
cp .env.development.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="postgresql://postgres:admin123@localhost:5432/portfolio"
ADMIN_PASSWORD="your-secure-password-here"
NODE_ENV="development"
```

### 4. Run Migrations

```bash
npm run db:migrate
npm run db:seed
```

### 5. Start Development Server

```bash
npm install
npm run dev
```

## Docker Compose Commands

### Start Database
```bash
docker-compose up -d
```

### Stop Database
```bash
docker-compose down
```

### Stop and Remove Volumes (⚠️ Deletes all data)
```bash
docker-compose down -v
```

### View Logs
```bash
docker-compose logs -f postgres
```

### Restart Database
```bash
docker-compose restart postgres
```

### Check Status
```bash
docker-compose ps
```

## Database Access

### Using psql (via Docker)
```bash
docker exec -it portfolio-db psql -U postgres -d portfolio
```

### Using psql (local client)
If you have PostgreSQL client installed locally:
```bash
psql -h localhost -p 5432 -U postgres -d portfolio
# Password: admin123
```

### Connection String Format
```
postgresql://postgres:admin123@localhost:5432/portfolio
```

## Configuration

The `docker-compose.yml` file configures:

- **Image**: `postgres:latest`
- **Container Name**: `portfolio-db`
- **Port**: `5432:5432` (host:container)
- **Database**: `portfolio` (auto-created)
- **User**: `postgres`
- **Password**: `admin123` (⚠️ Change this for production!)
- **Volume**: `postgres_data` (persistent storage)

## Changing Database Password

### Method 1: Using Script (Recommended - Preserves Data)

Use the provided PowerShell script:

```powershell
.\scripts\change-db-password.ps1 -NewPassword "your-new-secure-password"
```

This script will:
1. Change the password in PostgreSQL (preserves all data)
2. Update `docker-compose.yml`
3. Update `.env.local`
4. Restart the container

### Method 2: Manual Steps (Preserves Data)

1. **Connect to PostgreSQL:**
   ```bash
   docker exec -it portfolio-db psql -U postgres -d portfolio
   ```

2. **Change password in PostgreSQL:**
   ```sql
   ALTER USER postgres WITH PASSWORD 'your-new-password';
   \q
   ```

3. **Update `docker-compose.yml`:**
   ```yaml
   POSTGRES_PASSWORD: your-new-password
   ```

4. **Update `.env.local`:**
   ```env
   DATABASE_URL="postgresql://postgres:your-new-password@localhost:5432/portfolio"
   ```

5. **Restart container:**
   ```bash
   docker-compose restart postgres
   ```

### Method 3: Fresh Start (⚠️ Loses All Data)

If you want to start fresh:

1. **Stop and remove everything:**
   ```bash
   docker-compose down -v
   ```

2. **Update `docker-compose.yml` and `.env.local`** (same as Method 2)

3. **Start fresh:**
   ```bash
   docker-compose up -d
   npm run db:migrate
   npm run db:seed
   ```

## Troubleshooting

### Port Already in Use

If port `5432` is already in use:

1. **Find what's using it:**
   ```bash
   # Windows
   netstat -ano | findstr :5432
   
   # Mac/Linux
   lsof -i :5432
   ```

2. **Change port in `docker-compose.yml`:**
   ```yaml
   ports:
     - "5433:5432"  # Use 5433 instead
   ```

3. **Update `DATABASE_URL` in `.env.local`:**
   ```env
   DATABASE_URL="postgresql://postgres:admin123@localhost:5433/portfolio"
   ```

### Container Won't Start

```bash
# Check logs
docker-compose logs postgres

# Remove and recreate
docker-compose down -v
docker-compose up -d
```

### Database Connection Errors

1. **Verify container is running:**
   ```bash
   docker-compose ps
   ```

2. **Check health status:**
   ```bash
   docker-compose ps
   # Should show "healthy" status
   ```

3. **Verify connection string:**
   - Check `.env.local` has correct `DATABASE_URL`
   - Ensure password matches `docker-compose.yml`

### Reset Database

To completely reset the database:

```bash
# Stop and remove everything
docker-compose down -v

# Start fresh
docker-compose up -d

# Run migrations
npm run db:migrate
npm run db:seed
```

## Production Notes

⚠️ **Important:** The `docker-compose.yml` file is configured for **local development only**.

For production:
- Use managed database services (Vercel Postgres, Supabase, Neon, etc.)
- Never use Docker Compose in production
- Use strong, unique passwords
- Set `DATABASE_URL` in Vercel environment variables

## Data Persistence

Database data is stored in a Docker volume named `postgres_data`. This means:
- Data persists even if you stop the container
- Data is removed only if you run `docker-compose down -v`
- To backup: Export data using `pg_dump` or Prisma migrations

## Health Checks

The PostgreSQL container includes a health check that verifies the database is ready. You can see the status with:

```bash
docker-compose ps
```

The status will show as "healthy" when the database is ready to accept connections.
