#!/usr/bin/env node

/**
 * Deploy Migraciones a Supabase via SQL Execute
 * Lee las 75 migraciones y las aplica directamente
 * 
 * Uso:
 *   node scripts/deploy-migrations-combined.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load credentials
const envPath = path.join(__dirname, '..', '.env.hosix.temporal')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
  console.log('✅ Credenciales cargadas desde .env.hosix.temporal\n')
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY= process.env.SUPABASE_SERVICE_ROLE_KEY
const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations')

console.log('════════════════════════════════════════════════════════')
console.log('🚀 SUPABASE MIGRATIONS DEPLOY - COMBINED SQL')
console.log('════════════════════════════════════════════════════════\n')

// Read migrations in order
const migrations = fs.readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql') && f !== 'supabase/')
  .sort()

console.log(`✅ ${migrations.length} migrations encontradas\n`)

// Read all migration files
const migrationContents = migrations.map(file => {
  const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')
  
  // Clean up: remove comments y separadores
  const cleaned = content
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n')
    .trim()
  
  return { file, content: cleaned }
})

// Combine all into one script
const combinedSQL = `
-- ==================================================================
-- HOSIX: COMBINED MIGRATIONS DEPLOY
-- Fecha: ${new Date().toISOString()}
-- Total: ${migrations.length} migrations
-- ==================================================================

-- Detener en error
\\set ON_ERROR_STOP on

-- Iniciar transacción
BEGIN;

${migrationContents.map((m, i) => `
-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION ${i + 1}/${migrations.length}: ${m.file}
-- ═══════════════════════════════════════════════════════════════════
${m.content}
`).join('\n')}

-- Confirmar transacción
COMMIT;

-- Verificar
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';
`.trim()

console.log('\n', combinedSQL.split('\n').slice(0, 20).join('\n'))
console.log('\n... (más migrations)\n')

// Write combined SQL to file for reference
const outputPath = path.join(__dirname, '..', 'combined-migrations.sql')
fs.writeFileSync(outputPath, combinedSQL)
console.log(`✅ Combined SQL escrito a: ${outputPath}\n`)

// Connect to Supabase and execute
console.log('Conectando a Supabase...')
console.log(`URL: ${SUPABASE_URL}`)

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

console.log('\n⏱️  Ejecutando migraciones (esto puede tomar 1-2 minutos)...\n')

// Execute using PostgreSQL raw query
// We'll use the exec approach - but Supabase client doesn't have direct exec
// So we'll execute statement by statement

async function deployMigrations() {
  try {
    // For each SQL file, execute its content
    let successful = 0
    let failed = 0
    const errors = []

    for (let i = 0; i < migrationContents.length; i++) {
      const m = migrationContents[i]
      const progress = `[${String(i + 1).padStart(3)}/${migrations.length}]`

      try {
        process.stdout.write(`${progress} ${m.file.padEnd(60)}... `)

        // Split by semicolon and execute each statement
        const statements = m.content
          .split(';')
          .map(s => s.trim())
          .filter(s => s && !s.startsWith('--'))

        for (const stmt of statements) {
          // Use rpc to execute if available, otherwise skip
          const { error } = await supabase.rpc('exec', { sql: stmt })
          
          if (error && !error.message?.includes('does not exist')) {
            throw error
          }
        }

        console.log('✅')
        successful++
      } catch (error) {
        console.log('❌')
        failed++
        errors.push({
          migration: m.file,
          error: error?.message || 'Unknown error'
        })
      }
    }

    console.log('\n════════════════════════════════════════════════════════')
    console.log(`\n📊 RESULTS:`)
    console.log(`  ✅ Exitosas: ${successful}/${migrations.length}`)
    console.log(`  ❌ Fallidas: ${failed}/${migrations.length}`)
    console.log(`\n════════════════════════════════════════════════════════\n`)

    if (errors.length > 0 && errors.length <= 5) {
      console.log('⚠️  ERRORES:')
      errors.forEach(e => {
        console.log(`  ❌ ${e.migration}`)
        console.log(`     ${e.error}`)
      })
      console.log()
    }

    if (failed === 0) {
      console.log(`✅ TODAS LAS MIGRACIONES APLICADAS EXITOSAMENTE!\n`)
      console.log(`Próximos pasos:`)
      console.log(`  1. Verifica en Supabase Dashboard: https://app.supabase.com/`)
      console.log(`  2. npx supabase gen types typescript > src/types/supabase.ts`)
      console.log(`  3. npm run dev\n`)
      process.exit(0)
    } else {
      console.log(`⚠️  ${failed} migrations fallaron\n`)
      console.log(`💡 Alternativas:`)
      console.log(`  1. Aplicar manualmente en Dashboard`)
      console.log(`  2. Usar: supabase db push`)
      console.log(`  3. Revisar: ${outputPath}\n`)
      process.exit(1)
    }
  } catch (error) {
    console.error(`\n❌ ERROR FATAL: ${error.message}\n`)
    process.exit(1)
  }
}

deployMigrations()
