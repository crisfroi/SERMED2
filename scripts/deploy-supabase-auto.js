#!/usr/bin/env node

/**
 * Deploy a Supabase de forma AUTOMÁTICA (sin interacción)
 * Usa Supabase CLI de forma programática
 * 
 * Uso: node scripts/deploy-supabase-auto.js
 */

import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envPath = path.join(__dirname, '..', '.env.hosix.temporal')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
  console.log('✅ Credenciales cargadas desde .env.hosix.temporal\n')
}

const migrations = fs.readdirSync(path.join(__dirname, '..', 'supabase', 'migrations'))
  .filter(f => f.endsWith('.sql') && f !== 'supabase/')
  .sort()

console.log(`════════════════════════════════════════════════════════`)
console.log(`🚀 DEPLOY AUTOMÁTICO A SUPABASE - HOSIX`)
console.log(`════════════════════════════════════════════════════════\n`)

console.log(`✅ ${migrations.length} migrations encontradas`)
console.log(`📍 Usando: supabase db push\n`)

// Ejecutar supabase db push
const child = spawn('supabase', ['db', 'push'], {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '..')
})

child.on('close', (code) => {
  console.log(`\n════════════════════════════════════════════════════════`)
  if (code === 0) {
    console.log(`✅ DEPLOY COMPLETADO - Status: EXITOSO`)
    console.log(`\n🎯 Próximos pasos:`)
    console.log(`   1. Inicia dev: npm run dev`)
    console.log(`   2. Abre: http://localhost:5173`)
    console.log(`   3. Verifica migraciones en Supabase Dashboard\n`)
  } else {
    console.log(`❌ DEPLOY FALLÓ - Exit code: ${code}`)
    console.log(`\n💡 Soluciones:`)
    console.log(`   - Verifica credenciales Supabase`)
    console.log(`   - Ejecuta: supabase projects list`)
    console.log(`   - O: supabase link --project-ref <project-id>\n`)
  }
  console.log(`════════════════════════════════════════════════════════\n`)
  process.exit(code)
})

child.on('error', (error) => {
  console.error(`\n❌ ERROR: ${error.message}`)
  console.error(`\n💡 Supabase CLI no encontrado`)
  console.error(`   Instala con: npm install -g supabase\n`)
  process.exit(1)
})
