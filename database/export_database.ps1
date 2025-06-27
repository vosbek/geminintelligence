# AI Intelligence Platform - Database Export Script (PowerShell)
# 
# This script exports all database intelligence data for analysis and transfer.
# Run this after data collection to prepare data for investigation.

param(
    [string]$OutputDir = ".\exports",
    [string]$Format = "json"
)

Write-Host "🚀 AI Intelligence Platform - Database Export" -ForegroundColor Green
Write-Host "=" * 50

# Check if virtual environment is activated
if (-not $env:VIRTUAL_ENV) {
    Write-Host "⚠️  Virtual environment not detected. Activating..." -ForegroundColor Yellow
    if (Test-Path ".\venv\Scripts\Activate.ps1") {
        & ".\venv\Scripts\Activate.ps1"
        Write-Host "✅ Virtual environment activated" -ForegroundColor Green
    } else {
        Write-Host "❌ Virtual environment not found. Please create one first:" -ForegroundColor Red
        Write-Host "   python -m venv venv" -ForegroundColor Gray
        Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
        Write-Host "   pip install -r requirements.txt" -ForegroundColor Gray
        exit 1
    }
}

# Check if .env file exists
if (-not (Test-Path ".\.env")) {
    Write-Host "❌ .env file not found. Please configure database credentials first." -ForegroundColor Red
    exit 1
}

# Run the export script
Write-Host "📊 Starting database export..." -ForegroundColor Cyan
Write-Host ""

try {
    python database\export_data.py --output-dir $OutputDir --format $Format
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 Export completed successfully!" -ForegroundColor Green
        Write-Host "📁 Files exported to: $OutputDir" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📋 Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Copy the '$OutputDir' folder to your analysis machine" -ForegroundColor Gray
        Write-Host "  2. Review the IMPORT_INSTRUCTIONS.md file" -ForegroundColor Gray
        Write-Host "  3. Use intelligence_analysis.json for comprehensive data investigation" -ForegroundColor Gray
        Write-Host ""
        Write-Host "💡 Pro tip: The 'intelligence_analysis.json' file contains everything" -ForegroundColor Blue
        Write-Host "   formatted perfectly for data analysis and investigation!" -ForegroundColor Blue
    } else {
        Write-Host "❌ Export failed. Check the error messages above." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Export script failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✨ Ready for data investigation! ✨" -ForegroundColor Green