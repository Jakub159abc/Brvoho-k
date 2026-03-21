# PowerShell script to run the calendar generator
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$env:PYTHONIOENCODING = "utf-8"
python generate_calendar.py
if ($LASTEXITCODE -eq 0) {
    Write-Host "Calendar generated successfully!"
} else {
    Write-Host "Error generating calendar. Exit code: $LASTEXITCODE"
}
