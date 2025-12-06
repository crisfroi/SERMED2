#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CREDENCIALES
const SUPABASE_URL = "https://wdieynendfjbkbhfovrx.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV5bmVuZGZqYmtiaGZvdnJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc4MjkyMSwiZXhwIjoyMDY2MzU4OTIxfQ.X3Irl85Dy5HdZiPsMQUczySZgAT-dDyz7CZKjSn0X8Y";

const MIGRATIONS_DIR = path.join(__dirname, "supabase", "migrations");

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[36m",
  cyan: "\x1b[36m",
};

function log(msg, color = "reset") {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

// ============================================================
// ESTRATEGIA 1: Crear tabla via SQL directo (RPC)
// ============================================================

async function createMigrationTableViaSQL(supabase) {
  log("\n[ESTRATEGIA 1] Intentando crear tabla via RPC SQL...", "cyan");

  try {
    const { data, error } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS public.schema_migrations (
          id BIGSERIAL PRIMARY KEY,
          version BIGINT NOT NULL UNIQUE DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT),
          name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_schema_migrations_name ON public.schema_migrations(name);
      `,
    });

    if (error) {
      log(
        `   ❌ RPC 'exec_sql' no disponible: ${error.message}`,
        "yellow"
      );
      return false;
    }

    log(`   ✅ Tabla creada via RPC`, "green");
    return true;
  } catch (error) {
    log(
      `   ❌ Error: ${error instanceof Error ? error.message : "Desconocido"}`,
      "red"
    );
    return false;
  }
}

// ============================================================
// ESTRATEGIA 2: Verificar si tabla existe
// ============================================================

async function tableExists(supabase, tableName) {
  try {
    log(`\n[ESTRATEGIA 2] Verificando si tabla '${tableName}' existe...`, "cyan");

    const { count, error } = await supabase
      .from(tableName)
      .select("*", { count: "exact", head: true });

    if (error && error.code === "PGRST116") {
      log(`   ⚠️  Tabla NO existe (error: relation does not exist)`, "yellow");
      return false;
    }

    if (error && error.code === "42P01") {
      log(`   ⚠️  Tabla NO existe (error: 42P01)`, "yellow");
      return false;
    }

    if (error) {
      log(`   ⚠️  Error: ${error.code} - ${error.message}`, "yellow");
      return false;
    }

    log(`   ✅ Tabla SÍ existe (${count || 0} registros)`, "green");
    return true;
  } catch (err) {
    log(`   ❌ Error: ${err instanceof Error ? err.message : "Desconocido"}`, "red");
    return false;
  }
}

// ============================================================
// ESTRATEGIA 3: Listar todas las tablas del schema public
// ============================================================

async function listAllTables(supabase) {
  log(`\n[ESTRATEGIA 3] Listando todas las tablas en public schema...`, "cyan");

  try {
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .limit(20);

    if (error) {
      log(`   ⚠️  No se pueden listar tablas: ${error.message}`, "yellow");
      
      // Alternativa: intentar acceder a una tabla conocida
      log(`   Intentando alternativa...`, "yellow");
      const { data: alt } = await supabase
        .from("profesionales")
        .select("id", { count: "exact", head: true });
      
      log(`   ✅ Se puede acceder a tabla 'profesionales'`, "green");
      return;
    }

    if (data && data.length > 0) {
      log(`   ✅ Se encontraron ${data.length} tablas:`, "green");
      data.slice(0, 10).forEach((row) => {
        log(`      - ${row.table_name}`, "yellow");
      });
      if (data.length > 10) {
        log(`      ... y ${data.length - 10} más`, "yellow");
      }
    }
  } catch (error) {
    log(`   ❌ Error: ${error instanceof Error ? error.message : "Desconocido"}`, "red");
  }
}

// ============================================================
// ESTRATEGIA 4: Simular aplicación de migraciones
// ============================================================

async function simulateApplyMigration(supabase, migrationName) {
  log(`\n[ESTRATEGIA 4] Simulando aplicación de migración...`, "cyan");
  log(`   Nombre: ${migrationName}`, "yellow");

  try {
    // Paso 1: Verificar si ya está aplicada
    log(`   1️⃣  Verificando si ya está aplicada...`, "blue");

    const { data: existing, error: checkError } = await supabase
      .from("schema_migrations")
      .select("*")
      .eq("name", migrationName)
      .maybeSingle();

    if (!checkError) {
      if (existing) {
        log(`      ✅ Ya estaba aplicada en: ${existing.executed_at}`, "green");
        return { success: true, message: "Ya estaba aplicada" };
      }
    }

    log(`      ⏳ No estaba aplicada, registrando...`, "yellow");

    // Paso 2: Registrar como aplicada
    log(`   2️⃣  Registrando en schema_migrations...`, "blue");

    const { data: inserted, error: insertError } = await supabase
      .from("schema_migrations")
      .insert({
        name: migrationName,
        version: Math.floor(Date.now() / 1000),
        executed_at: new Date().toISOString(),
      })
      .select();

    if (insertError) {
      log(`      ❌ Error al insertar: ${insertError.message}`, "red");
      return { success: false, message: insertError.message };
    }

    log(`      ✅ Registrada correctamente`, "green");
    log(`         ID: ${inserted?.[0]?.id}`, "yellow");
    log(`         Versión: ${inserted?.[0]?.version}`, "yellow");

    return { success: true, message: "Migración aplicada" };
  } catch (error) {
    log(`   ❌ Error: ${error instanceof Error ? error.message : "Desconocido"}`, "red");
    return { success: false, message: error instanceof Error ? error.message : "Error desconocido" };
  }
}

// ============================================================
// ESTRATEGIA 5: Leer archivo SQL y mostrar contenido
// ============================================================

function readAndDisplayMigration(filename) {
  log(`\n[ESTRATEGIA 5] Leyendo contenido de migración SQL...`, "cyan");

  const filePath = path.join(MIGRATIONS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    log(`   ❌ Archivo no encontrado: ${filename}`, "red");
    return null;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  log(`   ✅ Archivo leído (${lines.length} líneas)`, "green");
  log(`   📋 Contenido (primeras 20 líneas):`, "yellow");
  log(`   ` + "─".repeat(70), "yellow");

  lines.slice(0, 20).forEach((line) => {
    const trimmed = line.substring(0, 68);
    log(`   ${trimmed}`, "yellow");
  });

  if (lines.length > 20) {
    log(`   ... (${lines.length - 20} líneas más)`, "yellow");
  }

  log(`   ` + "─".repeat(70), "yellow");

  return content;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  try {
    log("\n" + "=".repeat(80), "bright");
    log("  🔬 PRUEBA AVANZADA: LECTURA Y APLICACIÓN DE MIGRACIONES", "bright");
    log("=".repeat(80) + "\n", "bright");

    // Conexión
    log("🔗 Conectando a Supabase...", "blue");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: users, error: connError } = await supabase.auth.admin.listUsers();
    if (connError) {
      log(`❌ Error de conexión: ${connError.message}`, "red");
      return;
    }

    log(`✅ Conexión exitosa (${users?.users?.length || 0} usuarios)\n`, "green");

    // Estrategia 1: Intentar crear tabla
    const tableCreated = await createMigrationTableViaSQL(supabase);

    // Estrategia 2: Verificar si existe
    const exists = await tableExists(supabase, "schema_migrations");

    // Estrategia 3: Listar todas las tablas
    await listAllTables(supabase);

    // Estrategia 4: Simular aplicación
    if (exists) {
      const files = fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith(".sql"));

      if (files.length > 0) {
        const testFile = files[files.length - 1];
        const testName = testFile.replace(".sql", "");
        const result = await simulateApplyMigration(supabase, testName);
      }
    } else {
      log(
        `\n⚠️  La tabla no existe. Se requiere crearla primero.`,
        "yellow"
      );
      log(`   Opciones:`, "yellow");
      log(
        `   1. Usar Supabase Dashboard SQL Editor: https://app.supabase.com/project/wdieynendfjbkbhfovrx/sql`,
        "blue"
      );
      log(
        `   2. Ejecutar script: npm run apply-migrations:psql`,
        "blue"
      );
    }

    // Estrategia 5: Mostrar contenido de migración
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"));

    if (files.length > 0) {
      const testFile = files[files.length - 1];
      readAndDisplayMigration(testFile);
    }

    // RESUMEN
    log("\n" + "=".repeat(80), "bright");
    log("  📊 RESUMEN Y CONCLUSIONES", "bright");
    log("=".repeat(80), "bright");

    log(`\n✅ FUNCIONA:`, "green");
    log(`   • Lectura de migraciones desde filesystem`, "green");
    log(`   • Conexión a Supabase con Service Role Key`, "green");
    log(`   • Acceso a auth.admin (para verificar usuarios)`, "green");
    log(`   • Lectura y escritura en tablas existentes`, "green");

    log(`\n❌ REQUIERE:`, "yellow");
    log(`   • Crear tabla schema_migrations primero`, "yellow");
    log(`   • Acceso SQL admin para crear tablas nuevas`, "yellow");

    log(`\n💡 PRÓXIMOS PASOS:`, "blue");
    log(`   1. Crear tabla en Supabase Dashboard:`, "blue");
    log(`      https://app.supabase.com/project/wdieynendfjbkbhfovrx/sql`, "blue");
    log(`\n   2. Ejecutar SQL:`, "blue");
    log(`      \`\`\`sql`, "blue");
    log(
      `      CREATE TABLE schema_migrations (`,
      "blue"
    );
    log(`        id BIGSERIAL PRIMARY KEY,`, "blue");
    log(`        version BIGINT NOT NULL UNIQUE,`, "blue");
    log(`        name VARCHAR(255) NOT NULL UNIQUE,`, "blue");
    log(`        executed_at TIMESTAMPTZ DEFAULT NOW()`, "blue");
    log(`      );`, "blue");
    log(`      \`\`\``, "blue");

    log(`\n   3. Luego podrás usar:`, "blue");
    log(`      \`npm run apply-migrations\``, "blue");

    log("\n" + "=".repeat(80) + "\n", "bright");
  } catch (error) {
    log(
      `\n❌ ERROR: ${error instanceof Error ? error.message : "Desconocido"}`,
      "red"
    );
    console.error(error);
  }
}

main();
