$functions = @(
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

Write-Host "Copying 15 Tier-2 functions to supabase/functions/" -ForegroundColor Cyan
Write-Host ""

$copied = 0
$failed = 0

foreach ($func in $functions) {
  $src = "packages\hosix\src\functions hosix supabase\$func"
  $dst = "supabase\functions\$func"
  
  if (Test-Path $src) {
    Copy-Item -Path $src -Destination $dst -Recurse -Force -ErrorAction Stop
    Write-Host "✅ $func"
    $copied++
  } else {
    Write-Host "⚠️  $func - NOT FOUND" -ForegroundColor Yellow
    $failed++
  }
}

Write-Host ""
Write-Host "Result: $copied copied, $failed failed"
