# Simple Server Startup Script for UDS
# This script starts the development server on port 3001

Write-Host "=== Starting UDS Development Server ===" -ForegroundColor Cyan
Write-Host ""

# Get the script directory and set it as working directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Working directory: $scriptPath" -ForegroundColor Gray
Write-Host "Server will start on http://localhost:3001" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Start the server
npm run dev

