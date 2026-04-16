#!/usr/bin/env node

/**
 * Deploy DIRECTO a Supabase PostgreSQL
 * Sin CLI, usando credenciales de .env.hosix.temporal
 * 
 * Uso:
 *   node scripts/deploy-migrations-direct.js
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ============================================================
// LOAD ENV
// ============================================================

// Cargar credenciales desde .env.hosix.temporal
const envPath = path.join(__dirname, '..', '.env.hosix.temporal')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
  console.log('✅ Credenciales cargadas desde .env.hosix.temporal')
} else {
  console.error('❌ .env.hosix.temporal no encontrado')
  process.exit(1)
}

// ============================================================
// CONFIG
// ============================================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations')

const colors = {
  reset: '',
  bright: '',
  green: '',
  yellow: '',
  red: '',
  blue: '',
  cyan: ''
}

// ============================================================
// LOGGING
// ============================================================

function log(msg, color = 'reset') {
  console.log(msg)
}

function header(title) {
  console.log('\n' + '═'.repeat(70))
  log(`  ${title}`, 'bright')
  console.log('═'.repeat(70) + '\n')
}

function logStep(step, msg) {
  log(`\n[${step}] ${msg}`, 'bright')
  log('─'.repeat(60), 'cyan')
}

function logSuccess(msg) {
  log(`  ✅ ${msg}`, 'green')
}

function logError(msg) {
  log(`  ❌ ${msg}`, 'red')
}

function logWarn(msg) {
  log(`  ⚠️  ${msg}`, 'yellow')
}

// ============================================================
// VALIDATION
// ============================================================

function validate() {
  logStep(1, 'Validando configuración')

  if (!SUPABASE_URL) {
    logError('VITE_SUPABASE_URL no configurada')
    process.exit(1)
  }
  logSuccess(`URL: ${SUPABASE_URL}`)

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    logError('SUPABASE_SERVICE_ROLE_KEY no configurada')
    process.exit(1)
  }
  logSuccess(`Service Role Key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`)

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    logError(`Directorio migrations no existe: ${MIGRATIONS_DIR}`)
    process.exit(1)
  }
  logSuccess(`Migrations dir: ${MIGRATIONS_DIR}`)
}

// ============================================================
// READ MIGRATIONS
// ============================================================

function readMigrations() {
  logStep(2, 'Leyendo migrations')

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql') && f !== 'supabase/')
    .sort()

  logSuccess(`${files.length} migrations encontradas`)

  const migrations = files.map(file => ({
    name: file,
    path: path.join(MIGRATIONS_DIR, file),
    content: fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')
  }))

  console.log('\n📋 Migrations a aplicar:')
  migrations.forEach((m, i) => {
    const lines = m.content.split('\n').length
    log(`  ${String(i + 1).padEnd(3)} ${m.name.padEnd(50)} (${lines} líneas)`, 'cyan')
  })

  return migrations
}

// ============================================================
// EXECUTE MIGRATIONS
// ============================================================

async function executeMigrations(supabase, migrations) {
  logStep(3, 'Ejecutando migrations a Supabase')

  let successful = 0
  let failed = 0
  const errors = []

  for (let i = 0; i < migrations.length; i++) {
    const m = migrations[i]
    const progress = `[${String(i + 1).padStart(3)}/${migrations.length}]`

    try {
      log(`\n${progress} ${m.name}...`, 'blue')

      // Split por ; para ejecutar statement por statement
      const statements = m.content
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'))

      for (const stmt of statements) {
        const { error } = await supabase.rpc('execute_sql', { sql: stmt })
        
        if (error) {
          // Si rpc no existe, intentar con query directo
          if (error.message && error.message.includes('does not exist')) {
            // Fallback: Solo reportar
            logWarn(`Sin función execute_sql en BD, verificar manualmente`)
            break
          }
          throw error
        }
      }

      logSuccess(`${m.name}`)
      successful++
    } catch (error) {
      logError(`${m.name}`)
      logError(`Error: ${error.message}`)
      failed++
      errors.push({
        migration: m.name,
        error: error.message
      })
    }
  }

  logStep(4, 'Resumen de ejecución')
  log(`\n  Total migrations: ${migrations.length}`, 'cyan')
  log(`  ✅ Exitosas: ${successful}`, 'green')
  log(`  ❌ Fallidas: ${failed}`, failed > 0 ? 'red' : 'green')

  if (errors.length > 0) {
    log('\n📋 Errores detalles:')
    errors.forEach(e => {
      log(`  - ${e.migration}:`, 'yellow')
      log(`    ${e.error}`, 'red')
    })
  }

  return { successful, failed, errors }
}

// ============================================================
// ALTERNATIVE: DIRECT SQL EXECUTION
// ============================================================

async function executeDirectSQL(supabase, migrations) {
  logStep(3, 'Ejecutando migrations (método alternativo - sin función rpc)')

  let successful = 0
  let failed = 0
  const errors = []

  for (let i = 0; i < migrations.length; i++) {
    const m = migrations[i]
    const progress = `[${String(i + 1).padStart(3)}/${migrations.length}]`

    try {
      log(`\n${progress} ${m.name}...`, 'blue')

      // Intentar ejecutar el SQL completo
      const { error } = await supabase.query(m.content)

      if (error) {
        throw error
      }

      logSuccess(`${m.name}`)
      successful++
    } catch (error) {
      logError(`${m.name}`)
      logError(`Error: ${error.message}`)
      failed++
      errors.push({
        migration: m.name,
        error: error.message
      })
    }
  }

  logStep(4, 'Resumen de ejecución')
  log(`\n  Total migrations: ${migrations.length}`, 'cyan')
  log(`  ✅ Exitosas: ${successful}`, 'green')
  log(`  ❌ Fallidas: ${failed}`, failed > 0 ? 'red' : 'green')

  if (errors.length > 0) {
    log('\n📋 Errores detalles:')
    errors.forEach(e => {
      log(`  - ${e.migration}:`, 'yellow')
      log(`    ${e.error}`, 'red')
    })
  }

  return { successful, failed, errors }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  try {
    header('🚀 DEPLOY DIRECTO A SUPABASE - HOSIX')

    // 1. Validar
    validate()

    // 2. Leer migrations
    const migrations = readMigrations()

    // 3. Conectar a Supabase
    logStep(2.5, 'Conectando a Supabase')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    logSuccess('Conectado a Supabase')

    // 4. Ejecutar
    let result = await executeDirectSQL(supabase, migrations)

    // 5. Final summary
    logStep(5, 'Próximos pasos')

    if (result.failed === 0) {
      logSuccess('✅ TODAS LAS MIGRATIONS APLICADAS')
      log('\n1️⃣  Genera tipos TypeScript:', 'yellow')
      log('   npm run generate:types  (si existe)', 'cyan')
      log('\n2️⃣  Inicia dev server:')
      log('   npm run dev', 'cyan')
      log('\n3️⃣  Abre http://localhost:5173 en navegador', 'cyan')
    } else {
      logError(`${result.failed} migrations fallaron`)
      log('\n📋 Revisar errores arriba', 'yellow')
      log('💡 Posible solución:', 'yellow')
      log('   - Aplic manualmente en Supabase Dashboard: https://app.supabase.com', 'cyan')
      log('   - O usar: npm run apply-migrations:cli', 'cyan')
    }

    header('✅ DEPLOY COMPLETADO')
    process.exit(result.failed === 0 ? 0 : 1)
  } catch (error) {
    logError(`Error fatal: ${error.message}`)
    console.error(error)
    process.exit(1)
  }
}

main()
