# Deploy all 15 Tier-2 functions in batches

$ProjectRef = "ekuuyehcycachdpgbqvt"
$Results = @{}

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

Write-Host "DEPLOYING 15 TIER-2 EDGE FUNCTIONS TO SUPABASE" -ForegroundColor Cyan
Write-Host "Project: $ProjectRef" -ForegroundColor Cyan
Write-Host "Status: Starting at $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Cyan  
Write-Host ""

# Batch 1
Write-Host "Batch 1 (Functions 1-4)..." -ForegroundColor Yellow
foreach ($func in $Functions[0..3]) {
  Write-Host "  → $func" -NoNewline
  $output = npx supabase functions deploy $func --project-ref $ProjectRef 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-Host " ✅"
    $Results[$func] = "ACTIVE"
  } else {
    Write-Host " ❌"
    $Results[$func] = "ERROR: $output"
  }
}

# Batch 2
Write-Host "Batch 2 (Functions 5-8)..." -ForegroundColor Yellow
foreach ($func in $Functions[4..7]) {
  Write-Host "  → $func" -NoNewline
  $output = npx supabase functions deploy $func --project-ref $ProjectRef 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-Host " ✅"
    $Results[$func] = "ACTIVE"
  } else {
    Write-Host " ❌"
    $Results[$func] = "ERROR"
  }
}

# Batch 3
Write-Host "Batch 3 (Functions 9-12)..." -ForegroundColor Yellow
foreach ($func in $Functions[8..11]) {
  Write-Host "  → $func" -NoNewline
  $output = npx supabase functions deploy $func --project-ref $ProjectRef 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-Host " ✅"
    $Results[$func] = "ACTIVE"
  } else {
    Write-Host " ❌"
    $Results[$func] = "ERROR"
  }
}

# Batch 4
Write-Host "Batch 4 (Functions 13-15)..." -ForegroundColor Yellow
foreach ($func in $Functions[12..14]) {
  Write-Host "  → $func" -NoNewline
  $output = npx supabase functions deploy $func --project-ref $ProjectRef 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-Host " ✅"
    $Results[$func] = "ACTIVE"
  } else {
    Write-Host " ❌"
    $Results[$func] = "ERROR"
  }
}

Write-Host ""
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT SUMMARY" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""

$activeCount = ($Results.Values | Where-Object { $_ -eq "ACTIVE" }).Count
Write-Host "Total: $($Results.Count) | Active: $activeCount | Errors: $($Results.Count - $activeCount)" -ForegroundColor Cyan
Write-Host ""

Write-Host "| # | Function Name | Status |" -ForegroundColor Gray
Write-Host "|---|---|---|" -ForegroundColor Gray

$i = 1
foreach ($func in $Functions) {
  $status = $Results[$func]
  $icon = if ($status -eq "ACTIVE") { "✅" } else { "❌" }
  Write-Host "| $i | $func | $icon $status |"
  $i++
}

Write-Host ""
Write-Host "Completed: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green

# Save results to file
$Results | ConvertTo-Json | Out-File -FilePath "deployment_results.json" -Force
Write-Host "Results saved to deployment_results.json" -ForegroundColor Gray
