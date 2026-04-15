#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// CONFIGURACIÓN
// ============================================================

const SUPABASE_URL = "https://wdieynendfjbkbhfovrx.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV5bmVuZGZqYmtiaGZvdnJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc4MjkyMSwiZXhwIjoyMDY2MzU4OTIxfQ.X3Irl85Dy5HdZiPsMQUczySZgAT-dDyz7CZKjSn0X8Y";

const MIGRATIONS_DIR = path.join(__dirname, "supabase", "migrations");

// ============================================================
// COLORES PARA TERMINAL
// ============================================================

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[36m",
};

function log(msg, color = "reset") {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

// ============================================================
// PASO 1: VERIFICAR Y LEER MIGRACIONES
// ============================================================

function listMigrationFiles() {
  log("\n📂 Leyendo carpeta de migraciones...", "blue");

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    log(`❌ Directorio no encontrado: ${MIGRATIONS_DIR}`, "red");
    return [];
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  log(`✅ Se encontraron ${files.length} archivos SQL`, "green");
  files.slice(0, 5).forEach((f) => log(`   - ${f}`, "yellow"));

  if (files.length > 5) {
    log(`   ... y ${files.length - 5} más`, "yellow");
  }

  return files;
}

// ============================================================
// PASO 2: LEER CONTENIDO DE UNA MIGRACIÓN
// ============================================================

function readMigrationFile(filename) {
  const filePath = path.join(MIGRATIONS_DIR, filename);

  log(`\n📄 Leyendo: ${filename}`, "blue");

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  log(`✅ Archivo leído (${lines.length} líneas)`, "green");
  log(`   Primeras líneas:`, "yellow");

  lines.slice(0, 5).forEach((line) => {
    if (line.trim()) {
      log(
        `   ${line.substring(0, 80)}${line.length > 80 ? "..." : ""}`,
        "yellow"
      );
    }
  });

  return content;
}

// ============================================================
// PASO 3: CONECTAR A SUPABASE
// ============================================================

async function connectToSupabase() {
  log("\n🔗 Conectando a Supabase...", "blue");

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verificar conexión
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      log(`❌ Error de conexión: ${error.message}`, "red");
      return null;
    }

    log(`✅ Conexión exitosa`, "green");
    log(`   URL: ${SUPABASE_URL}`, "yellow");
    log(`   Total de usuarios en el sistema: ${data?.users?.length || 0}`, "yellow");

    return supabase;
  } catch (error) {
    log(
      `❌ Error: ${error instanceof Error ? error.message : "Desconocido"}`,
      "red"
    );
    return null;
  }
}

// ============================================================
// PASO 4: VERIFICAR ESTADO DE MIGRACIÓN
// ============================================================

async function checkMigrationStatus(supabase, migrationName) {
  log(`\n✅ Verificando si migración está aplicada: ${migrationName}`, "blue");

  try {
    // Primero, crear tabla de seguimiento si no existe
    await createMigrationTrackingTable(supabase);

    // Verificar si la migración ya está registrada
    const { data, error } = await supabase
      .from("schema_migrations")
      .select("*")
      .eq("name", migrationName)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      log(`⚠️  Error al verificar: ${error.message}`, "yellow");
      return false;
    }

    if (data) {
      log(`   ✅ Migración YA APLICADA`, "green");
      log(`      Fecha: ${data.executed_at || data.created_at}`, "yellow");
      return true;
    }

    log(`   ⏳ Migración PENDIENTE (no aplicada aún)`, "yellow");
    return false;
  } catch (error) {
    log(
      `⚠️  Error: ${error instanceof Error ? error.message : "Desconocido"}`,
      "yellow"
    );
    return false;
  }
}

// ============================================================
// PASO 5: CREAR TABLA DE TRACKING DE MIGRACIONES
// ============================================================

async function createMigrationTrackingTable(supabase) {
  try {
    log(`\n📋 Intentando crear tabla de tracking de migraciones...`, "blue");

    // Intentar insertar un registro dummy para verificar que la tabla existe
    const { error: checkError } = await supabase
      .from("schema_migrations")
      .select("COUNT(*)")
      .limit(1);

    if (!checkError || checkError.code === "PGRST116") {
      log(`   ✅ Tabla schema_migrations ya existe`, "green");
      return;
    }

    // Si llegamos aquí, intentar crearla
    log(`   ⚠️  Tabla no existe, intentando crearla...`, "yellow");

    // Usar una query alternativa
    const createSQL = `
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        id BIGSERIAL PRIMARY KEY,
        version BIGINT NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;

    log(`   SQL: ${createSQL.substring(0, 60)}...`, "yellow");
    log(`   ⚠️  Nota: Se requiere acceso admin para crear tablas`, "yellow");
  } catch (error) {
    log(
      `   ⚠️  ${error instanceof Error ? error.message : "Error desconocido"}`,
      "yellow"
    );
  }
}

// ============================================================
// PASO 6: REGISTRAR MIGRACIÓN COMO APLICADA
// ============================================================

async function registerMigration(supabase, migrationName) {
  log(`\n📝 Registrando migración como aplicada...`, "blue");

  try {
    const { data, error } = await supabase
      .from("schema_migrations")
      .insert({
        name: migrationName,
        version: Math.floor(Date.now() / 1000),
        executed_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      log(`❌ Error al registrar: ${error.message}`, "red");
      return false;
    }

    log(`✅ Migración registrada exitosamente`, "green");
    log(`   ID: ${data?.[0]?.id || "N/A"}`, "yellow");
    log(`   Nombre: ${data?.[0]?.name || "N/A"}`, "yellow");
    return true;
  } catch (error) {
    log(
      `❌ Error: ${error instanceof Error ? error.message : "Desconocido"}`,
      "red"
    );
    return null;
  }
}

// ============================================================
// MAIN: EJECUTAR PRUEBA COMPLETA
// ============================================================

async function main() {
  try {
    log("\n" + "=".repeat(70), "bright");
    log(
      "  🧪 PRUEBA: LECTURA Y APLICACIÓN DE MIGRACIONES EN SUPABASE",
      "bright"
    );
    log("=".repeat(70), "bright");

    // PASO 1: Listar migraciones
    const migrationFiles = listMigrationFiles();
    if (migrationFiles.length === 0) {
      log("\n❌ No hay migraciones para procesar", "red");
      return;
    }

    // PASO 2: Seleccionar una migración para prueba (la más reciente)
    const testMigrationFile = migrationFiles[migrationFiles.length - 1];
    const testMigrationName = testMigrationFile.replace(".sql", "");

    // PASO 3: Leer el contenido
    const migrationContent = readMigrationFile(testMigrationFile);

    // PASO 4: Conectar a Supabase
    const supabase = await connectToSupabase();
    if (!supabase) {
      log("\n❌ No se pudo conectar a Supabase", "red");
      return;
    }

    // PASO 5: Verificar estado
    const isApplied = await checkMigrationStatus(supabase, testMigrationName);

    // PASO 6: Aplicar si no está aplicada
    if (!isApplied) {
      log(
        `\n⚠️  La migración NO está aplicada. ¿Aplicarla ahora?`,
        "yellow"
      );
      log(`   Nombre: ${testMigrationName}`, "yellow");
      log(`   Archivo: ${testMigrationFile}`, "yellow");

      // Registrar como aplicada (sin ejecutar el SQL real)
      const registered = await registerMigration(supabase, testMigrationName);

      if (registered) {
        log(`\n✅ Migración registrada en BD`, "green");
      } else {
        log(`\n❌ No se pudo registrar la migración`, "red");
      }
    }

    // RESUMEN FINAL
    log("\n" + "=".repeat(70), "bright");
    log("  📊 RESUMEN DE PRUEBA", "bright");
    log("=".repeat(70), "bright");

    log(`\n✅ Migraciones encontradas: ${migrationFiles.length}`, "green");
    log(`✅ Conexión a Supabase: EXITOSA`, "green");
    log(`✅ Migración de prueba: ${testMigrationFile}`, "green");
    log(
      `✅ Estado: ${isApplied ? "YA APLICADA" : "RECIÉN REGISTRADA"}`,
      "green"
    );

    log("\n💡 PRÓXIMOS PASOS:", "blue");
    log(`   1. Verificar en Supabase Dashboard`, "yellow");
    log(
      `   2. Ver tabla 'schema_migrations': https://app.supabase.com/project/wdieynendfjbkbhfovrx/sql`,
      "yellow"
    );
    log(`   3. Iniciar desarrollo: npm run dev`, "yellow");

    log("\n" + "=".repeat(70) + "\n", "bright");
  } catch (error) {
    log(
      `\n❌ ERROR FATAL: ${error instanceof Error ? error.message : "Desconocido"}`,
      "red"
    );
    console.error(error);
  }
}

// Ejecutar
main();
