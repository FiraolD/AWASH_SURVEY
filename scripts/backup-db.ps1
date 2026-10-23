<#
.SYNOPSIS
  Backup the awash_survey PostgreSQL database.

.EXAMPLE
  .\scripts\backup-db.ps1
  .\scripts\backup-db.ps1 -Retention 30
  .\scripts\backup-db.ps1 -OutDir "D:\Backups\Awash"
#>
param(
  [string]$OutDir = ".\backups",
  [int]$Retention = 14,
  [string]$PgDump = "pg_dump"
)

$ErrorActionPreference = "Stop"

# --- Read DATABASE_URL from .env ---
$envPath = Join-Path $PSScriptRoot "..\.env"
if (-not (Test-Path $envPath)) {
  Write-Error "Cannot find $envPath. Run this from the project root."
  exit 1
}

$envLine = Get-Content $envPath | Where-Object { $_ -match "^DATABASE_URL=" } | Select-Object -First 1
if (-not $envLine) {
  Write-Error "DATABASE_URL not found in .env"
  exit 1
}

$dbUrl = ($envLine -replace "^DATABASE_URL=", "").Trim()
Write-Host "Backing up: $dbUrl" -ForegroundColor Cyan

# --- Prepare output directory ---
$stamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$abs = Resolve-Path -LiteralPath (New-Item -ItemType Directory -Force -Path $OutDir).FullName
$file = Join-Path $abs "awash_survey_$stamp.sql"

# --- Dump ---
# --no-owner / --no-acl make the dump portable between machines.
# --clean + --if-exists let the file be restored over an existing DB.
Write-Host "Running pg_dump → $file" -ForegroundColor Cyan
& $PgDump `
  --dbname $dbUrl `
  --format plain `
  --no-owner `
  --no-acl `
  --clean `
  --if-exists `
  --file $file

if ($LASTEXITCODE -ne 0) {
  Write-Error "pg_dump failed with exit code $LASTEXITCODE"
  exit $LASTEXITCODE
}

# --- Optional gzip ---
if (Get-Command gzip -ErrorAction SilentlyContinue) {
  Write-Host "Compressing…" -ForegroundColor Cyan
  & gzip -f $file
  $file = "$file.gz"
}

$size = (Get-Item $file).Length / 1MB
Write-Host ("Done. {0} ({1:N2} MB)" -f $file, $size) -ForegroundColor Green

# --- Retention ---
if ($Retention -gt 0) {
  $cutoff = (Get-Date).AddDays(-$Retention)
  Get-ChildItem -Path $abs -Filter "awash_survey_*.sql*" |
    Where-Object { $_.LastWriteTime -lt $cutoff } |
    ForEach-Object {
      Write-Host "Removing old backup: $($_.Name)" -ForegroundColor DarkGray
      Remove-Item $_.FullName -Force
    }
}