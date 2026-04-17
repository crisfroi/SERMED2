#!/usr/bin/env pwsh
# Deploy Tier-2 Edge Functions to Supabase

$ProjectRef = "ekuuyehcycachdpgbqvt"
$Results = @()

$Functions = @(
    'immunization-validation',
    'lab_validation',
    'nutrition-validation',
    'stage_diagnosis',
    'create_treatment_plan',
    'surgery-validation',
    'pharmacotherapy_validation',
    'consolidate_ehr_summary',
    'validate_lab_results',
    'validate_medication_order',
    'vaccination_next_dose',
    'expand_icd_codes',
    'export_lab_results',
    'export_radiology_report',
    'ehr-search'
)

Write-Host "Deploying 15 Tier-2 Edge Functions to Supabase (ekuuyehcycachdpgbqvt)" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

foreach ($func in $Functions) {
    try {
        Write-Host "Deploying: $func" -ForegroundColor Yellow
        $output = npm run supabase -- functions deploy $func --project-ref $ProjectRef 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ SUCCESS" -ForegroundColor Green
            $status = "ACTIVE"
            $error_msg = ""
        } else {
            Write-Host "  ❌ FAILED" -ForegroundColor Red
            $status = "ERROR"
            $error_msg = $output | Out-String
        }
        
        $Results += @{
            Name = $func
            Status = $status
            Error = $error_msg
            Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        }
    }
    catch {
        Write-Host "  ⚠️  EXCEPTION: $_" -ForegroundColor Red
        $Results += @{
            Name = $func
            Status = "ERROR"
            Error = $_.Exception.Message
            Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        }
    }
}

# Output Summary
Write-Host ""
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT SUMMARY" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""

$activeCount = ($Results | Where-Object { $_.Status -eq "ACTIVE" }).Count
$errorCount = ($Results | Where-Object { $_.Status -eq "ERROR" }).Count

Write-Host "Total Functions: $($Results.Count)" -ForegroundColor Gray
Write-Host "Active: $activeCount" -ForegroundColor Green
Write-Host "Errors: $errorCount" -ForegroundColor Red
Write-Host ""
Write-Host "Details:" -ForegroundColor Yellow
Write-Host ""

foreach ($result in $Results) {
    $statusIcon = if ($result.Status -eq "ACTIVE") { "✅" } else { "❌" }
    Write-Host "$statusIcon | $($result.Name) | $($result.Status)"
    if ($result.Error) {
        Write-Host "   Error: $($result.Error)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Completed: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
