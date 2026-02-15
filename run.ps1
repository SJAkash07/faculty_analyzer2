# Run Publication Analyzer from workspace root.
# This script changes to the app folder so Python finds the 'backend' module.

$ErrorActionPreference = "Stop"

$AppDir = Join-Path $PSScriptRoot "Publication_Analyzer\Publication_Analyzer"

# Check if app directory exists
if (-not (Test-Path $AppDir)) {
    Write-Host "Error: App folder not found at $AppDir" -ForegroundColor Red
    Write-Host "Please ensure you're running this script from the workspace root." -ForegroundColor Yellow
    exit 1
}

# Check if main.py exists
if (-not (Test-Path (Join-Path $AppDir "backend\main.py"))) {
    Write-Host "Error: backend\main.py not found" -ForegroundColor Red
    exit 1
}

# Change to app directory
Set-Location $AppDir
Write-Host "Starting server from: $AppDir" -ForegroundColor Cyan

# Check if virtual environment exists
$VenvPath = Join-Path $AppDir "venv\Scripts\Activate.ps1"
if (Test-Path $VenvPath) {
    Write-Host "Activating virtual environment..." -ForegroundColor Green
    & $VenvPath
} else {
    Write-Host "Warning: Virtual environment not found at $VenvPath" -ForegroundColor Yellow
    Write-Host "Consider creating one with: python -m venv venv" -ForegroundColor Yellow
}

# Check if uvicorn is installed
try {
    $null = Get-Command uvicorn -ErrorAction Stop
} catch {
    Write-Host "Error: uvicorn not found. Please install dependencies:" -ForegroundColor Red
    Write-Host "  pip install -r requirements.txt" -ForegroundColor Yellow
    exit 1
}

# Display startup information
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Publication Analyzer" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server will start at: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "API docs available at: http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
try {
    uvicorn backend.main:app --reload --app-dir .
} catch {
    Write-Host ""
    Write-Host "Error starting server: $_" -ForegroundColor Red
    exit 1
}
