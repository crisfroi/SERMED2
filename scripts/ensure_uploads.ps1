#!/usr/bin/env pwsh
# Ensure uploads directory exists for FlaskProject
$uploadPath = Join-Path $PSScriptRoot 'FlaskProject\uploads'
if (-not (Test-Path $uploadPath)) {
    New-Item -ItemType Directory -Path $uploadPath -Force | Out-Null
    Write-Host "Created uploads directory: $uploadPath"
} else {
    Write-Host "Uploads directory already exists: $uploadPath"
}
