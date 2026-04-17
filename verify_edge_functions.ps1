# Script para verificar Edge Functions desplegadas en Supabase HOSIX

$SUPABASE_URL = "https://dfqefbkxounzmtggnfsc.supabase.co"
$ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmcWVmYmt4b3Vuem10Z2duZnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NTA0ODUsImV4cCI6MjA5MTQyNjQ4NX0.PKTGWpbxPlyWAWAeIAnBR705njRacRGYOBHScEF1cQo"

# Lista de funciones a verificar (de /supabase/functions/)
$FUNCTIONS = @(
    "admin-users",
    "ai-chat-master",
    "ai_assist_detection",
    "calculate-nomina",
    "calculate-nominas-from-guardias",
    "check-renewal-notifications",
    "consolidate_ehr_summary",
    "create_treatment_plan",
    "detect-guardia-conflicts",
    "ehr-search",
    "expand_icd_codes",
    "expediente-abrir",
    "expediente-actualizar-estado",
    "export-employees-to-device",
    "export-payroll",
    "export_lab_results",
    "export_radiology_report",
    "generar-carnet-profesional",
    "generar-codigo-barras",
    "generar-resolucion-expediente",
    "generar-url-carnet",
    "generate_payroll_report",
    "hospitalizacion_crear_kardex",
    "hospitalizacion_evolucionar_paciente",
    "hospitalizacion_mover_paciente_cama",
    "hospitalizacion_solicitar_cirugia",
    "hospitalizacion_solicitar_interconsulta",
    "iachat",
    "immunization-validation",
    "lab_validation",
    "nutrition-validation",
    "pharmacotherapy_validation",
    "procesar-cola-carnets",
    "process_payroll_approval",
    "process_staff_updates",
    "referral_validation",
    "send-sms-notification",
    "send-user-invitation",
    "stage_diagnosis",
    "surgery-validation",
    "sync-biometric-device",
    "test-invite",
    "update-accreditation-status",
    "upload-documentos-adicionales",
    "vaccination_next_dose",
    "validate_lab_results",
    "validate_medication_order"
)

Write-Host "🔍 Verificando Edge Functions en: $SUPABASE_URL`n" -ForegroundColor Cyan

$deployed = 0
$notDeployed = 0
$errors = 0

$results = @()

foreach ($func in $FUNCTIONS) {
    $url = "$SUPABASE_URL/functions/v1/$func"
    
    Write-Host "Testing: $func ... " -NoNewline
    
    try {
        $response = Invoke-WebRequest `
            -Uri $url `
            -Method POST `
            -Headers @{
                "Authorization" = "Bearer $ANON_KEY"
                "Content-Type" = "application/json"
            } `
            -Body '{}' `
            -TimeoutSec 5 `
            -ErrorAction Stop
        
        Write-Host "✅ DEPLOYED" -ForegroundColor Green
        $deployed++
        $results += @{
            Function = $func
            Status = "✅ DEPLOYED"
            StatusCode = $response.StatusCode
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode
        
        if ($statusCode -eq 404) {
            Write-Host "❌ NOT FOUND" -ForegroundColor Red
            $notDeployed++
            $results += @{
                Function = $func
                Status = "❌ NOT FOUND (404)"
                StatusCode = 404
            }
        }
        elseif ($statusCode -eq 401 -or $statusCode -eq 403) {
            Write-Host "⚠️  AUTH ERROR" -ForegroundColor Yellow
            $errors++
            $results += @{
                Function = $func
                Status = "⚠️  AUTH ERROR ($statusCode)"
                StatusCode = $statusCode
            }
        }
        else {
            Write-Host "❓ ERROR ($statusCode)" -ForegroundColor Yellow
            $errors++
            $results += @{
                Function = $func
                Status = "❓ ERROR ($statusCode)"
                StatusCode = $statusCode
            }
        }
    }
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 RESUMEN DE VERIFICACIÓN" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Desplegadas:    $deployed" -ForegroundColor Green
Write-Host "❌ No encontradas: $notDeployed" -ForegroundColor Red
Write-Host "⚠️  Errores:       $errors" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Mostrar detalles de funciones NO desplegadas
$notFoundFuncs = $results | Where-Object { $_.Status -like "*NOT FOUND*" }
if ($notFoundFuncs.Count -gt 0) {
    Write-Host "❌ FUNCIONES NO DESPLEGADAS ($($notFoundFuncs.Count)):" -ForegroundColor Red
    foreach ($func in $notFoundFuncs) {
        Write-Host "   - $($func.Function)"
    }
    Write-Host ""
}

# Mostrar detalles de errores de autenticación
$authErrors = $results | Where-Object { $_.Status -like "*AUTH*" }
if ($authErrors.Count -gt 0) {
    Write-Host "⚠️  ERRORES DE AUTENTICACIÓN ($($authErrors.Count)):" -ForegroundColor Yellow
    foreach ($err in $authErrors) {
        Write-Host "   - $($err.Function): $($err.Status)"
    }
    Write-Host ""
}

# Guardar reporte en archivo
$reportFile = "EDGE_FUNCTIONS_VERIFICATION_REPORT.json"
$results | ConvertTo-Json | Out-File -FilePath $reportFile -Encoding UTF8
Write-Host "📄 Reporte guardado en: $reportFile" -ForegroundColor Cyan
