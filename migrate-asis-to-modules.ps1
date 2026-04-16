#!/usr/bin/env pwsh
# Script para migrar ASIS_* components a modules
# Uso: .\migrate-asis-to-modules.ps1

$srcBase = 'c:\Users\HP\Desktop\Proyectos y Empresas\geprostec\RENAPROSA\Renaprosa2\SERMED2\packages\hosix\src'
$componentsPath = Join-Path $srcBase 'components'
$modulesPath = Join-Path $srcBase 'modules'

# Mapeo: ASIS_* -> (module_dir, keep_folder_name)
$mappings = @{
    'ASIS_04_Obstetricia'   = @('01-obstetrics', $true)
    'ASIS_05_CRED'          = @('05-immunization', $true)
    'ASIS_07_Nutricion'     = @('03-nutrition', $true)
    'ASIS_08_Inmunizacion'  = @('05-immunization', $true)
    'ASIS_08_Laboratorio'   = @('09-imaging', $true)
    'ASIS_09_Farmacia'      = @('06-medications', $true)
    'ASIS_10_Laboratorio'   = @('09-imaging', $true)
    'ASIS_10_Medicamentos'  = @('06-medications', $true)
    'ASIS_10_Regimenes'     = @('06-medications', $true)
    'ASIS_11_Referencia'    = @('00-core/shared', $true)
    'ASIS_12_Farmacoterapia'= @('06-medications', $true)
    'ASIS_13_EHR'           = @('07-clinical-docs', $true)
    'ASIS_14_Diagnostico'   = @('08-diagnoses', $true)
    'ASIS_15_Imagenes'      = @('09-imaging', $true)
    'ASIS_7_Cirugia'        = @('04-surgery', $true)
    'ASIS_8_Dietetica'      = @('03-nutrition', $true)
    'ASIS_9_Inmunizacion'   = @('05-immunization', $true)
    'ADMIN_1_HR'            = @('10-admin-hr', $true)
    'ADMIN_2_WAITING_ROOMS' = @('11-admin-operations', $true)
}

Write-Host "🚀 Iniciando migración ASIS_* a modules..." -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green

$totalMoved = 0
$failedMoves = @()

foreach ($asisFolder in $mappings.Keys) {
    $srcFolder = Join-Path $componentsPath $asisFolder
    $moduleDir, $keepFolderStructure = $mappings[$asisFolder]
    
    if (-not (Test-Path $srcFolder)) {
        Write-Host "⚠️  No encontrado: $asisFolder" -ForegroundColor Yellow
        continue
    }
    
    # Crear directorio destino
    $destDir = Join-Path $modulesPath $moduleDir 'components'
    if ($keepFolderStructure) {
        $destDir = Join-Path $destDir $asisFolder
    }
    
    try {
        # Crear carpeta destino si no existe
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            Write-Host "📁 Creado: $destDir" -ForegroundColor Cyan
        }
        
        # Contar archivos a mover
        $files = Get-ChildItem -Path $srcFolder -Filter '*.tsx' -File
        $fileCount = ($files | Measure-Object).Count
        
        # Copiar archivos
        Copy-Item -Path "$srcFolder\*" -Destination $destDir -Force -ErrorAction Stop
        Write-Host "✅ $asisFolder → $(Split-Path $destDir -Parent) ($fileCount archivos)" -ForegroundColor Green
        $totalMoved += $fileCount
    }
    catch {
        Write-Host "❌ Error en $asisFolder : $_" -ForegroundColor Red
        $failedMoves += $asisFolder
    }
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "📊 RESULTADO:" -ForegroundColor Green
Write-Host "   ✅ $totalMoved archivos migrados" -ForegroundColor Green
Write-Host "   📁 $($mappings.Count) folders procesados" -ForegroundColor Green

if ($failedMoves.Count -gt 0) {
    Write-Host "   ❌ $($failedMoves.Count) errores:" -ForegroundColor Red
    $failedMoves | ForEach-Object { Write-Host "      - $_" -ForegroundColor Red }
}

Write-Host "✨ Migración completada" -ForegroundColor Green
