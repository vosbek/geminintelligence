# This script resets the ai_database to its original state.
# It drops all tables, recreates the schema, and reseeds the initial data.
# To run it, open PowerShell, navigate to the 'database' directory, and execute: .\reset_database.ps1

# --- Configuration ---
$PsqlPath = "C:\Program Files\PostgreSQL\11\bin\psql.exe"
$DbHost = "localhost"
$DbPort = "5432"
$DbUser = "postgres"
$DbName = "ai_database"
$SchemaFile = ".\schema.sql"
$SeedFile = ".\seed.sql"

# --- Set Password ---
# Make sure your PostgreSQL password is set correctly below.
$env:PGPASSWORD = "postgres"

# --- Main Execution ---
Write-Host "--- Database Reset Script ---"

# Check if psql.exe exists
if (-not (Test-Path $PsqlPath)) {
    Write-Error "Error: psql.exe not found at '$PsqlPath'. Please update the path in this script."
    exit 1
}

# 1. Apply Schema (Drop and Recreate Tables)
Write-Host "Step 1: Applying schema from '$SchemaFile' to database '$DbName'..."
& $PsqlPath -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $SchemaFile
if ($LASTEXITCODE -ne 0) {
    Write-Error "Error: Failed to apply schema. Please check the psql output above. Aborting."
    exit 1
}
Write-Host "Success: Schema applied."
Write-Host ""


# 2. Seed Data
Write-Host "Step 2: Seeding data from '$SeedFile'..."
& $PsqlPath -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $SeedFile
if ($LASTEXITCODE -ne 0) {
    Write-Error "Error: Failed to seed data. Please check the psql output and the seed file."
    exit 1
}
Write-Host "Success: Data seeded."
Write-Host ""

Write-Host "--- Database reset complete. ---" 