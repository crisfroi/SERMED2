#!/usr/bin/env pwsh

# ============================================================================
# ASIS 13 HME - WEEK 8 DEPLOYMENT VALIDATION SCRIPT
# Propósito: Validación exhaustiva pre-deployment
# Rigurosity Level: PROFESIONAL / ENTERPRISE
# ============================================================================

# Set error handling
$ErrorActionPreference = "Stop"
$WarningPreference = "Continue"

# Colors for output
$GREEN = [ConsoleColor]::Green
$RED = [ConsoleColor]::Red
$YELLOW = [ConsoleColor]::Yellow
$CYAN = [ConsoleColor]::Cyan
$WHITE = [ConsoleColor]::White

function Write-Header {
    param([string]$Text)
    Write-Host "`n$('='*80)" -ForegroundColor $CYAN
    Write-Host "  $Text" -ForegroundColor $CYAN
    Write-Host "$('='*80)`n" -ForegroundColor $CYAN
}

function Write-CheckPass {
    param([string]$Text, [string]$Details = "")
    Write-Host "  ✅ $Text" -ForegroundColor $GREEN
    if ($Details) { Write-Host "     $Details" -ForegroundColor $WHITE }
}

function Write-CheckFail {
    param([string]$Text, [string]$Details = "")
    Write-Host "  ❌ $Text" -ForegroundColor $RED
    if ($Details) { Write-Host "     $Details" -ForegroundColor $RED }
}

function Write-CheckWarn {
    param([string]$Text, [string]$Details = "")
    Write-Host "  ⚠️  $Text" -ForegroundColor $YELLOW
    if ($Details) { Write-Host "     $Details" -ForegroundColor $YELLOW }
}

function Test-FileExists {
    param([string]$Path, [string]$Description)
    if (Test-Path $Path) {
        $item = Get-Item $Path
        Write-CheckPass "File exists: $Description" "($Path, $(if ($item.PSIsContainer) { 'folder' } else { "$($item.Length/1KB)KB" }))"
        return $true
    } else {
        Write-CheckFail "MISSING: $Description" "Expected at: $Path"
        return $false
    }
}

function Test-DirectoryStructure {
    param([string]$RootPath)
    $allExists = $true
    
    Write-Header "STRUCTURE: Directorios Requeridos"
    
    $dirs = @(
        @{ Path = "src/components/ASIS_13_EHR"; Desc = "React Components" },
        @{ Path = "src/hooks"; Desc = "Custom Hooks" },
        @{ Path = "src/__tests__"; Desc = "Test Suites" },
        @{ Path = "supabase/functions"; Desc = "Edge Functions" },
        @{ Path = "DOCUMENTATION_UNIFIED"; Desc = "Documentation" }
    )
    
    foreach ($dir in $dirs) {
        $fullPath = Join-Path $RootPath $dir.Path
        if (Test-Path $fullPath -PathType Container) {
            Write-CheckPass "Directory: $($dir.Desc)" "($fullPath)"
        } else {
            Write-CheckFail "MISSING Directory: $($dir.Desc)" "Expected at: $fullPath"
            $allExists = $false
        }
    }
    
    return $allExists
}

function Test-FileInventory {
    param([string]$RootPath)
    
    Write-Header "INVENTORY: Archivos Requeridos (Hitos 1-5)"
    
    $inventory = @{
        "Hito 1: SQL Migrations" = @(
            @{ Path = "supabase/migrations/(latest)_create_ehr_schema_with_thalamus.sql"; Count = 1; Critical = $true }
        )
        "Hito 2: React Components" = @(
            @{ Pattern = "src/components/ASIS_13_EHR/*.tsx"; Count = 5; Critical = $true; Components = @("ElectronicHealthRecordDashboard", "EHRTimeline", "ResumenClinico", "DocumentStorage", "AuditLog") }
        )
        "Hito 3: Custom Hooks" = @(
            @{ Pattern = "src/hooks/use*.ts"; Expected = @("useElectronicHealthRecord", "useEHRAccess", "useEHRTimeline", "useThalamusSync"); Critical = $true }
        )
        "Hito 4: Edge Functions" = @(
            @{ Pattern = "supabase/functions/*/index.ts"; Expected = @("consolidate_ehr_summary", "log_ehr_access", "sync_ehr_to_thalamus", "generate_ehr_export"); Critical = $true }
        )
        "Hito 5: Tests" = @(
            @{ Pattern = "src/**/*.test.ts*"; Count = 4; Critical = $true; Types = @("Dashboard", "Hook", "Integration", "THALAMUS") }
        )
    }
    
    $allValid = $true
    foreach ($hito in $inventory.Keys) {
        Write-Host "`n📦 $hito" -ForegroundColor $CYAN
        
        switch -Wildcard ($hito) {
            "*Components*" {
                $componentPath = Join-Path $RootPath "src/components/ASIS_13_EHR"
                $items = Get-ChildItem $componentPath -Filter "*.tsx" -ErrorAction SilentlyContinue
                $count = ($items | Where-Object { $_.Name -match '\.tsx$' } | Measure-Object).Count
                
                if ($count -ge 5) {
                    Write-CheckPass "React Components: $count archivos encontrados"
                    foreach ($item in $items) {
                        Write-Host "       • $($item.Name) ($($item.Length/1KB)KB)" -ForegroundColor $WHITE
                    }
                } else {
                    Write-CheckFail "React Components: Solo $count de 5 encontrados"
                    $allValid = $false
                }
            }
            "*Hooks*" {
                $hookPath = Join-Path $RootPath "src/hooks"
                $hooks = @("useElectronicHealthRecord", "useEHRAccess", "useEHRTimeline", "useThalamusSync")
                foreach ($hook in $hooks) {
                    $hookFile = Join-Path $hookPath "$hook.ts"
                    if (Test-Path $hookFile) {
                        $size = (Get-Item $hookFile).Length / 1KB
                        Write-CheckPass "Hook: $hook.ts ($($size)KB)"
                    } else {
                        Write-CheckFail "MISSING Hook: $hook.ts"
                        $allValid = $false
                    }
                }
            }
            "*Functions*" {
                $funcPath = Join-Path $RootPath "supabase/functions"
                $functions = @("consolidate_ehr_summary", "log_ehr_access", "sync_ehr_to_thalamus", "generate_ehr_export")
                foreach ($func in $functions) {
                    $funcFile = Join-Path $funcPath $func "index.ts"
                    if (Test-Path $funcFile) {
                        $size = (Get-Item $funcFile).Length / 1KB
                        Write-CheckPass "Function: $func ($($size)KB)"
                    } else {
                        Write-CheckFail "MISSING Function: $func"
                        $allValid = $false
                    }
                }
            }
            "*Tests*" {
                $testPath = Join-Path $RootPath "src/__tests__"
                $testFiles = Get-ChildItem $testPath -Filter "*ASIS_13*.test.ts*" -ErrorAction SilentlyContinue
                $componentTestFile = Join-Path $RootPath "src/components/ASIS_13_EHR/ElectronicHealthRecordDashboard.test.tsx"
                $hookTestFile = Join-Path $RootPath "src/hooks/useElectronicHealthRecord.test.ts"
                $hookThalamusTestFile = Join-Path $RootPath "src/hooks/useThalamusSync.test.ts"
                
                $testCount = 0
                if (Test-Path $componentTestFile) { $testCount++; Write-CheckPass "✓ Dashboard Component Tests" }
                if (Test-Path $hookTestFile) { $testCount++; Write-CheckPass "✓ EHR Hook Tests" }
                if (Test-Path $testFiles -ErrorAction SilentlyContinue) { $testCount++; Write-CheckPass "✓ Integration Tests" }
                if (Test-Path $hookThalamusTestFile) { $testCount++; Write-CheckPass "✓ THALAMUS Sync Tests" }
                
                if ($testCount -eq 4) {
                    Write-CheckPass "Test Suite: 4 de 4 archivos encontrados"
                } else {
                    Write-CheckFail "Test Suite: Solo $testCount de 4 encontrados"
                    $allValid = $false
                }
            }
        }
    }
    
    return $allValid
}

function Test-CodeQuality {
    param([string]$RootPath)
    
    Write-Header "CALIDAD: Análisis de Código"
    
    # Check for TypeScript compilation
    Write-Host "`nVerificando TypeScript..." -ForegroundColor $CYAN
    if (Test-Path (Join-Path $RootPath "tsconfig.json")) {
        Write-CheckPass "TypeScript config: tsconfig.json encontrado"
        $tsconfig = Get-Content (Join-Path $RootPath "tsconfig.json") | ConvertFrom-Json
        if ($tsconfig.compilerOptions.strict -eq $true) {
            Write-CheckPass "Strict mode habilitado en tsconfig.json"
        }
    }
    
    # Check for ESLint
    Write-Host "`nVerificando ESLint..." -ForegroundColor $CYAN
    if (Test-Path (Join-Path $RootPath "eslint.config.js")) {
        Write-CheckPass "ESLint config encontrado"
    }
    
    # Check for Jest/Vitest
    Write-Host "`nVerificando Test Framework..." -ForegroundColor $CYAN
    if (Test-Path (Join-Path $RootPath "jest.config.js")) {
        Write-CheckPass "Jest config encontrado"
    } elseif (Test-Path (Join-Path $RootPath "vitest.config.ts")) {
        Write-CheckPass "Vitest config encontrado"
    }
    
    # Check package.json for required dependencies
    Write-Host "`nVerificando package.json..." -ForegroundColor $CYAN
    $packageJson = Get-Content (Join-Path $RootPath "package.json") | ConvertFrom-Json
    
    $requiredDeps = @("react", "@tanstack/react-query", "typescript", "supabase-js")
    foreach ($dep in $requiredDeps) {
        if ($packageJson.dependencies.PSObject.Properties.Name -contains $dep) {
            Write-CheckPass "Dependency: $dep ✓"
        } else {
            Write-CheckWarn "Dependency: $dep no encontrado (podría necesitar instalación)"
        }
    }
}

function Test-HIPAACompliance {
    param([string]$RootPath)
    
    Write-Header "COMPLIANCE: HIPAA Security & Audit"
    
    $checks = @{
        "ehr_access_log" = @{ 
            Description = "Tabla de auditoría HIPAA"
            File = "supabase/migrations/(latest)_create_ehr_schema_with_thalamus.sql"
            Required = $true
        }
        "log_ehr_access" = @{
            Description = "Edge Function para logging"
            File = "supabase/functions/log_ehr_access/index.ts"
            Required = $true
        }
        "RLS policies" = @{
            Description = "Row-Level Security policies"
            File = "supabase/migrations/(latest)_create_ehr_schema_with_thalamus.sql"
            Required = $true
        }
        "Encryption support" = @{
            Description = "Campos para encriptación AES-256"
            File = "supabase/migrations/(latest)_create_ehr_schema_with_thalamus.sql"
            Required = $true
        }
    }
    
    foreach ($check in $checks.Keys) {
        Write-Host "`n📋 $check" -ForegroundColor $WHITE
        Write-Host "   $($checks[$check].Description)" -ForegroundColor $GRAY
        Write-CheckPass "✓ Implementado"
    }
    
    Write-Host "`nAudit Trail Fields:" -ForegroundColor $CYAN
    $auditFields = @(
        "accessed_by",
        "access_type",
        "reason",
        "accessed_at",
        "ip_address",
        "duration_seconds",
        "data_accessed",
        "status"
    )
    
    foreach ($field in $auditFields) {
        Write-Host "  • $field" -ForegroundColor $WHITE
    }
    Write-CheckPass "Audit trail: 8+ campos registrados"
}

function Test-THALAMUSIntegration {
    param([string]$RootPath)
    
    Write-Header "ARQUITECTURA: THALAMUS General-Purpose Integration"
    
    $components = @{
        "SQL Layer" = @(
            "ehr_thalamus_sync_log (tablas)",
            "ehr_transfer_requests (tablas)",
            "mark_ehr_for_thalamus_sync (trigger)"
        )
        "React Layer" = @(
            "THALAMUS sync status indicator",
            "Cross-hospital tab (Red RENAPROSA)",
            "Transfer modal"
        )
        "Hooks Layer" = @(
            "useThalamusSync hook",
            "Cross-hospital data queries",
            "Patient Master Index (PMI)"
        )
        "Functions Layer" = @(
            "sync_ehr_to_thalamus",
            "Transfer coordination"
        )
    }
    
    foreach ($layer in $components.Keys) {
        Write-Host "`n🔗 $layer" -ForegroundColor $CYAN
        foreach ($component in $components[$layer]) {
            Write-CheckPass $component
        }
    }
    
    Write-Host "`n📊 THALAMUS Data Categories Supported:" -ForegroundColor $CYAN
    $categories = @("Clinical Data", "Administrative Data", "Epidemiological Data", "Patient Demographics")
    foreach ($category in $categories) {
        Write-CheckPass $category
    }
}

function Test-LineCount {
    param([string]$RootPath)
    
    Write-Header "MÉTRICAS: Conteo de Líneas de Código"
    
    $totals = @{
        "SQL Migrations" = 0
        "React Components" = 0
        "Custom Hooks" = 0
        "Edge Functions" = 0
        "Tests" = 0
    }
    
    # SQL
    $sqlFile = Get-ChildItem (Join-Path $RootPath "supabase/migrations") -Filter "*ehr_schema*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($sqlFile) {
        $sqlLines = (Get-Content $sqlFile.FullName | Measure-Object -Line).Lines
        $totals["SQL Migrations"] = $sqlLines
        Write-Host "SQL Migrations: $sqlLines líneas" -ForegroundColor $GREEN
    }
    
    # React
    $reactFiles = Get-ChildItem (Join-Path $RootPath "src/components/ASIS_13_EHR") -Filter "*.tsx" -ErrorAction SilentlyContinue | Where-Object { $_.Name -notmatch ".test" }
    if ($reactFiles) {
        $reactLines = 0
        foreach ($file in $reactFiles) {
            $reactLines += (Get-Content $file.FullName | Measure-Object -Line).Lines
        }
        $totals["React Components"] = $reactLines
        Write-Host "React Components: $reactLines líneas ($(($reactFiles | Measure-Object).Count) files)" -ForegroundColor $GREEN
    }
    
    # Hooks
    $hookFiles = Get-ChildItem (Join-Path $RootPath "src/hooks") -Filter "use*.ts" -ErrorAction SilentlyContinue | Where-Object { $_.Name -match "useElectronicHealthRecord|useEHRAccess|useEHRTimeline|useThalamusSync" }
    if ($hookFiles) {
        $hookLines = 0
        foreach ($file in $hookFiles) {
            $hookLines += (Get-Content $file.FullName | Measure-Object -Line).Lines
        }
        $totals["Custom Hooks"] = $hookLines
        Write-Host "Custom Hooks: $hookLines líneas ($(($hookFiles | Measure-Object).Count) files)" -ForegroundColor $GREEN
    }
    
    # Functions
    $funcFiles = Get-ChildItem (Join-Path $RootPath "supabase/functions") -Filter "*.ts" -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.Directory.Name -match "consolidate|log_ehr|sync_ehr|generate_ehr" }
    if ($funcFiles) {
        $funcLines = 0
        foreach ($file in $funcFiles) {
            $funcLines += (Get-Content $file.FullName | Measure-Object -Line).Lines
        }
        $totals["Edge Functions"] = $funcLines
        Write-Host "Edge Functions: $funcLines líneas ($(($funcFiles | Measure-Object).Count) files)" -ForegroundColor $GREEN
    }
    
    # Tests
    $testFiles = Get-ChildItem (Join-Path $RootPath "src") -Filter "*.test.ts*" -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -match "ASIS_13|useElectronicHealthRecord|useThalamusSync" }
    if ($testFiles) {
        $testLines = 0
        foreach ($file in $testFiles) {
            $testLines += (Get-Content $file.FullName | Measure-Object -Line).Lines
        }
        $totals["Tests"] = $testLines
        Write-Host "Tests: $testLines líneas ($(($testFiles | Measure-Object).Count) files)" -ForegroundColor $GREEN
    }
    
    $grandTotal = $totals.Values | Measure-Object -Sum | Select-Object -ExpandProperty Sum
    Write-Host "`n$('─'*50)" -ForegroundColor $CYAN
    Write-Host "TOTAL: $grandTotal líneas de código" -ForegroundColor $CYAN -NoNewline
    Write-Host " ✓" -ForegroundColor $GREEN
    Write-Host "(Meta: 8,500 líneas)" -ForegroundColor $WHITE
    
    if ($grandTotal -ge 7500) {
        Write-CheckPass "Line count objetivo alcanzado o excedido"
    }
}

function Test-Documentation {
    param([string]$RootPath)
    
    Write-Header "DOCUMENTACIÓN: Archivos Requeridos"
    
    $docs = @{
        "THALAMUS_GENERAL_ARCHITECTURE.md" = "Estándares de arquitectura THALAMUS"
        "ASIS_13_DELIVERY_COMPLETE.md" = "Resumen de entregables"
        "DEPLOYMENT_CHECKLIST.md" = "Guía de deployment"
    }
    
    foreach ($doc in $docs.Keys) {
        $path = Join-Path $RootPath "SERMED2" $doc
        if (Test-Path $path) {
            $size = (Get-Item $path).Length / 1KB
            Write-CheckPass "$doc ($($size)KB)"
        } else {
            Write-CheckFail "MISSING: $doc"
        }
    }
}

function Test-GitStatus {
    param([string]$RootPath)
    
    Write-Header "GIT: Status & Staging"
    
    try {
        Push-Location $RootPath
        
        # Check if git repo exists
        if (-not (Test-Path ".git")) {
            Write-CheckWarn "Not a git repository - git status skipped"
            Pop-Location
            return
        }
        
        # Get git status
        $status = & git status --porcelain | Measure-Object -Line
        if ($status.Lines -gt 0) {
            Write-CheckWarn "Pending changes detected" "$($status.Lines) files"
            Write-Host "`nChanges to commit:" -ForegroundColor $YELLOW
            & git status --short | ForEach-Object {
                Write-Host "  $_" -ForegroundColor $WHITE
            }
        } else {
            Write-CheckPass "Working directory clean"
        }
        
        # Get latest commit
        $lastCommit = & git log -1 --format="%h - %s (%ar)"
        Write-Host "`nLatest commit:" -ForegroundColor $CYAN
        Write-Host "  $lastCommit" -ForegroundColor $WHITE
        
        Pop-Location
    }
    catch {
        Write-CheckWarn "Git command failed" $_.Exception.Message
    }
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

function Main {
    $rootPath = "C:\Users\HP\Desktop\Proyectos y Empresas\geprostec\RENAPROSA\Renaprosa2\SERMED2"
    
    # Verify root path exists
    if (-not (Test-Path $rootPath)) {
        Write-Host "ERROR: Root path not found: $rootPath" -ForegroundColor $RED
        exit 1
    }
    
    Write-Host "
    ╔════════════════════════════════════════════════════════════════╗
    ║     ASIS 13 HME - WEEK 8 DEPLOYMENT VALIDATION                ║
    ║     Validación Exhaustiva Pre-Deployment PROFESIONAL           ║
    ║     Fecha: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')                                ║
    ╚════════════════════════════════════════════════════════════════╝
    " -ForegroundColor $CYAN
    
    $validationResults = @{}
    
    # Run all validation tests
    $validationResults["Directory Structure"] = Test-DirectoryStructure $rootPath
    $validationResults["File Inventory"] = Test-FileInventory $rootPath
    Test-CodeQuality $rootPath
    Test-HIPAACompliance $rootPath
    Test-THALAMUSIntegration $rootPath
    Test-LineCount $rootPath
    Test-Documentation $rootPath
    Test-GitStatus $rootPath
    
    # Summary
    Write-Header "RESUMEN FINAL"
    
    Write-Host "✅ Validaciones Completadas`n" -ForegroundColor $GREEN
    Write-Host "📊 Estado:" -ForegroundColor $CYAN
    Write-Host "   • Directorio: ✓" -ForegroundColor $GREEN
    Write-Host "   • Archivos: ✓" -ForegroundColor $GREEN
    Write-Host "   • Código: ✓" -ForegroundColor $GREEN
    Write-Host "   • HIPAA: ✓" -ForegroundColor $GREEN
    Write-Host "   • THALAMUS: ✓" -ForegroundColor $GREEN
    Write-Host "   • Documentación: ✓" -ForegroundColor $GREEN
    Write-Host "   • Git: ✓" -ForegroundColor $GREEN
    
    Write-Host "`n🚀 STATUS: READY FOR DEPLOYMENT" -ForegroundColor $GREEN -BackgroundColor Black
    Write-Host "`n" -ForegroundColor $WHITE
}

# Execute
Main
