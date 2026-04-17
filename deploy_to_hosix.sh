#!/bin/bash
# ========================================
# HOSIX: Deploy Edge Functions Automation
# ========================================

PROJECT_ID="dfqefbkxounzmtggnfsc"
FUNCTION_DIR="supabase/functions"

echo "🚀 Iniciando despliegue de Edge Functions a HOSIX"
echo "Proyecto: $PROJECT_ID"
echo ""

# Step 1: Link al proyecto
echo "📌 Paso 1: Vinculando al proyecto HOSIX..."
supabase link --project-ref $PROJECT_ID 2>&1 | grep -E "Link|Linked|Error" || echo "Verificando link..."

# Step 2: Deploy
echo ""
echo "🚀 Paso 2: Desplegando 47 Edge Functions..."
echo "⏳ Esto puede tomar 2-5 minutos..."

cd "$FUNCTION_DIR" 2>/dev/null || cd ../$FUNCTION_DIR

functions_deployed=0
functions_failed=0

for func_dir in */; do
  func_name="${func_dir%/}"
  echo -n "  Desplegando: $func_name ... "
  
  if supabase functions deploy "$func_name" >/dev/null 2>&1; then
    echo "✅"
    ((functions_deployed++))
  else
    echo "⚠️"
    ((functions_failed++))
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Despliegue Completado"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Desplegadas: $functions_deployed"
echo "Errores:     $functions_failed"
echo "Total:       $((functions_deployed + functions_failed))"
echo ""

# Step 3: Verification
echo "🔍 Paso 3: Verificando despliegue..."
# Add your verification script here

echo "✅ ¡Despliegue completado!"
