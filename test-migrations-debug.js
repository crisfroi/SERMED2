#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wdieynendfjbkbhfovrx.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV5bmVuZGZqYmtiaGZvdnJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc4MjkyMSwiZXhwIjoyMDY2MzU4OTIxfQ.X3Irl85Dy5HdZiPsMQUczySZgAT-dDyz7CZKjSn0X8Y";

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

async function main() {
  try {
    log("\n" + "=".repeat(80), "bright");
    log("  🔍 DEBUG: INTENTAR INSERTAR EN SCHEMA_MIGRATIONS", "bright");
    log("=".repeat(80) + "\n", "bright");

    // Conectar
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    log("✅ Conectado a Supabase\n", "green");

    // PRUEBA 1: Verificar que la tabla existe
    log("1️⃣  VERIFICAR TABLA", "blue");
    const { count, error: countError } = await supabase
      .from("schema_migrations")
      .select("*", { count: "exact" });

    if (countError) {
      log(`   ❌ Error: ${JSON.stringify(countError)}`, "red");
    } else {
      log(`   ✅ Tabla existe con ${count} registros`, "green");
    }

    // PRUEBA 2: Intentar SELECT
    log("\n2️⃣  INTENTAR SELECT", "blue");
    const { data: selectData, error: selectError } = await supabase
      .from("schema_migrations")
      .select("*")
      .limit(5);

    if (selectError) {
      log(`   ❌ Error SELECT: ${JSON.stringify(selectError, null, 2)}`, "red");
    } else {
      log(`   ✅ SELECT funcionó`, "green");
      log(`   Registros encontrados: ${selectData?.length || 0}`, "yellow");
      if (selectData && selectData.length > 0) {
        log(`   Primer registro:`, "yellow");
        log(`      ${JSON.stringify(selectData[0], null, 2)}`, "yellow");
      }
    }

    // PRUEBA 3: Intentar INSERT simple
    log("\n3️⃣  INTENTAR INSERT", "blue");

    const testData = {
      name: "test_migration_" + Date.now(),
      version: Math.floor(Date.now() / 1000),
      executed_at: new Date().toISOString(),
    };

    log(`   Datos a insertar:`, "yellow");
    log(`      ${JSON.stringify(testData, null, 2)}`, "yellow");

    const { data: insertData, error: insertError } = await supabase
      .from("schema_migrations")
      .insert([testData])
      .select();

    if (insertError) {
      log(`\n   ❌ ERROR AL INSERTAR:`, "red");
      log(`      Code: ${insertError.code}`, "red");
      log(`      Message: ${insertError.message}`, "red");
      log(`      Details: ${insertError.details}`, "red");
      log(`      Hint: ${insertError.hint}`, "red");
      log(`\n   Objeto error completo:`, "red");
      log(`      ${JSON.stringify(insertError, null, 2)}`, "red");
    } else {
      log(`\n   ✅ INSERT FUNCIONÓ`, "green");
      log(`   Registro insertado:`, "yellow");
      log(`      ${JSON.stringify(insertData, null, 2)}`, "yellow");
    }

    // PRUEBA 4: Verificar políticas RLS
    log("\n4️⃣  VERIFICAR RLS", "blue");
    log(`   (Las políticas de RLS pueden estar bloqueando)`, "yellow");

    // PRUEBA 5: Intentar con anon key
    log("\n5️⃣  INTENTAR CON ANON KEY", "blue");

    const anonKey =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV5bmVuZGZqYmtiaGZvdnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODI5MjEsImV4cCI6MjA2NjM1ODkyMX0.yFnLHavy8wzVjlg3sAI2mEG-XGDCV5FSr7OQsMefxL8";

    const supabaseAnon = createClient(SUPABASE_URL, anonKey);

    const testData2 = {
      name: "test_migration_anon_" + Date.now(),
      version: Math.floor(Date.now() / 1000) + 1,
      executed_at: new Date().toISOString(),
    };

    const { data: anonInsertData, error: anonInsertError } = await supabaseAnon
      .from("schema_migrations")
      .insert([testData2])
      .select();

    if (anonInsertError) {
      log(`   ❌ Error con anon key: ${anonInsertError.message}`, "red");
    } else {
      log(`   ✅ Insert funcionó con anon key`, "green");
      log(`      ${JSON.stringify(anonInsertData, null, 2)}`, "yellow");
    }

    // RESUMEN
    log("\n" + "=".repeat(80), "bright");
    log("  📋 DIAGNÓSTICO", "bright");
    log("=".repeat(80), "bright");

    log(`\n✅ QUÉ FUNCIONA:`, "green");
    log(`   • Conexión a Supabase`, "green");
    log(`   • Tabla schema_migrations existe`, "green");
    log(`   • SELECT desde la tabla funciona`, "green");

    if (!insertError) {
      log(`   • INSERT en la tabla FUNCIONA ✅`, "green");
    } else {
      log(`   ✅ SELECT funciona pero INSERT falla`, "yellow");

      if (insertError.code === "PGRST001") {
        log(`\n❌ PROBLEMA: Políticas RLS están bloqueando`, "red");
        log(`   Solución: Verificar RLS en Supabase Dashboard`, "yellow");
      } else if (insertError.code === "42501") {
        log(`\n❌ PROBLEMA: Permisos insuficientes`, "red");
        log(`   Solución: Verificar permisos en la BD`, "yellow");
      }
    }

    log(`\n💡 RECOMENDACIÓN:`, "blue");
    log(`   Usa este comando para aplicar migraciones:`, "blue");
    log(`   npm run apply-migrations`, "blue");

  } catch (error) {
    log(`\n❌ ERROR: ${error instanceof Error ? error.message : "Desconocido"}`, "red");
    console.error(error);
  }
}

main();
