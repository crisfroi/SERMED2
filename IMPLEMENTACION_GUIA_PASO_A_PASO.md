# 🚀 GUÍA DE IMPLEMENTACIÓN POST-ANÁLISIS

**Análisis Completado:** 15 Abril 2025  
**Archivos Generados:** 3  
**Estado:** Listo para ejecución

---

## 📁 ARCHIVOS GENERADOS

### 1. `ANALISIS_MIGRACIONES_EXHAUSTIVO.json` ✅
**Contenido:** JSON estructura completa con todos los detalles técnicos
- Todas las tablas identificadas con campos exactos
- Operaciones detectadas (SELECT, INSERT, UPDATE, DELETE, UPSERT)
- Fuentes de cada operación (archivo.tsx:línea)
- Estado de migraciones existentes
- Integraciones cross-project
- Recomendaciones priorizadas

**Uso:** 
```bash
# Revisar en editor JSON o abrir en navegador
cat ANALISIS_MIGRACIONES_EXHAUSTIVO.json | jq '.'
```

### 2. `RESUMEN_MIGRACIONES_EJECUTIVO.md` ✅
**Contenido:** Documento markdown legible con roadmap
- Resumen ejecutivo de riesgos
- Tabla comparativa de estado
- Diagrama de dependencias
- Plan de acción (FASES 1-4)
- Matriz de riesgos
- Timeline estimado

**Uso:**
```bash
# Abrir en VS Code Preview o GitHub
code RESUMEN_MIGRACIONES_EJECUTIVO.md
```

### 3. `MIGRACIONES_RECOMENDADAS.sql` ✅
**Contenido:** SQL listo para ejecutar en Supabase
- 4 migraciones priorizadas
- RLS Policies HIPAA-compliant
- Índices de performance
- Funciones de auditoría
- Triggers para timestamps
- Validaciones post-instalación

**Uso:** Copiar y ejecutar en Supabase SQL Editor

---

## ⏹️ PUNTO DE PARTIDA: Validación Inicial

Antes de ejecutar cualquier migración, ejecutar estas verificaciones:

```sql
-- Verificar tabla existing
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'centros_salud'
) AS centros_salud_exists;

-- Verificar profesionales_sanitarios tiene EnNo
SELECT COUNT(*) as total_professionals,
       COUNT(numero_enrolamiento_enno) as with_enno
FROM profesionales_sanitarios;

-- Verificar cuadrantes_biometricos existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'cuadrantes_biometricos'
) AS cuadrantes_exists;
```

---

## 🔄 FLUJO DE EJECUCIÓN (Paso a Paso)

### PASO 1: Pre-Ejecución (30 min)
```
[ ] Crear backup de BD actual
    $ pg_dump postgres://... > backup-2025-04-15.sql

[ ] Verificar disponibilidad tabla centros_salud
    SQL: SELECT COUNT(*) FROM centros_salud;

[ ] Verificar disponibilidad campo numero_enrolamiento_enno
    SQL: SELECT COUNT(numero_enrolamiento_enno) FROM profesionales_sanitarios;

[ ] Crear rama de test en staging
    $ git checkout -b feature/asis13-migrations
```

### PASO 2: Ejecutar Migración 1 (10 min)
**Tabla:** `cuadrantes_maestros`
```sql
-- Copiar desde MIGRACIONES_RECOMENDADAS.sql la sección [1/4]
-- Ejecutar en Supabase SQL Editor

-- Validación inmediata:
SELECT 
  tablename, 
  'CREADA' as status
FROM pg_tables 
WHERE tablename = 'cuadrantes_maestros';

-- Debe retornar: cuadrantes_maestros | CREADA
```

### PASO 3: Ejecutar Migración 2 (15 min)
**Tabla:** `electronic_health_record` ⚠️ **CRÍTICA**
```sql
-- Copiar desde MIGRACIONES_RECOMENDADAS.sql la sección [2/4]
-- Ejecutar en Supabase SQL Editor

-- Validación inmediata:
SELECT 
  tablename,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name='electronic_health_record')::text as column_count,
  'CREADA' as status
FROM pg_tables 
WHERE tablename = 'electronic_health_record';

-- Debe tener: ~15 columnas, status CREADA
```

### PASO 4: Ejecutar Migración 3 (10 min)
**Tabla:** `ehr_episode_links`
```sql
-- Copiar desde MIGRACIONES_RECOMENDADAS.sql la sección [3/4]

-- Validación inmediata:
SELECT COUNT(*) as foreign_keys
FROM information_schema.table_constraints 
WHERE table_name = 'ehr_episode_links'
AND constraint_type = 'FOREIGN KEY';

-- Debe tener: 1 FK (a electronic_health_record)
```

### PASO 5: Ejecutar Migración 4 (10 min)
**Tabla:** `ehr_document_storage`
```sql
-- Copiar desde MIGRACIONES_RECOMENDADAS.sql la sección [4/4]

-- Validación inmediata:
SELECT COUNT(*) as indices
FROM pg_indexes 
WHERE tablename = 'ehr_document_storage'
AND indexname LIKE 'idx_%';

-- Debe tener: 5 índices
```

### PASO 6: Verificación Post-Ejecución (30 min)
```sql
-- Contar todas las tablas creadas
SELECT COUNT(*) as tablas_creadas
FROM pg_tables
WHERE tablename IN (
  'cuadrantes_maestros',
  'electronic_health_record',
  'ehr_episode_links',
  'ehr_document_storage'
);

-- Debe retornar: 4

-- Verificar que no hay errores en logs
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%ERROR%'
LIMIT 5;

-- Debe retornar: (sin resultados) = OK
```

---

## ✅ CHECKLIST DE VALIDACIÓN

### Validación Técnica
- [ ] Todas 4 tablas creadas exitosamente
- [ ] Todos los índices creados
- [ ] RLS Policies habilitadas y funcionando
- [ ] Triggers y funciones compiladas sin errores
- [ ] No hay FK constraint violations

### Validación Funcional
- [ ] INSERT en `cuadrantes_maestros` funciona
- [ ] INSERT en `electronic_health_record` funciona
- [ ] INSERT en `ehr_episode_links` funciona (con FK a EHR)
- [ ] INSERT en `ehr_document_storage` funciona (con FK a EHR)
- [ ] UPSERT en `ehr_episode_links` funciona
- [ ] RLS policies permiten SELECT a usuarios autenticados
- [ ] RLS policies niegan acceso a usuarios no autenticados

### Validación de Performance
```sql
-- Ejecutar después de crear tablas
ANALYZE cuadrantes_maestros;
ANALYZE electronic_health_record;
ANALYZE ehr_episode_links;
ANALYZE ehr_document_storage;

SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE tablename IN (
  'cuadrantes_maestros',
  'electronic_health_record',
  'ehr_episode_links',
  'ehr_document_storage'
);
```

---

## 🔐 VALIDACIÓN HIPAA (para ASIS_13)

```sql
-- Verificar que audit table existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'electronic_health_record_audit'
) AS audit_table_exists;

-- Verificar que RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('electronic_health_record', 'ehr_document_storage')
AND rowsecurity = true;

-- Debe retornar: 2 filas con rowsecurity = true = OK

-- Simular acceso sin autenticación (debe fallar)
SELECT * FROM electronic_health_record
WHERE auth.uid() IS NULL;
-- Esperado: ERROR permission denied for schema public
```

---

## 📝 TESTING EN STAGING

### Test 1: CRUD Básico en Cuadrantes Maestros
```typescript
// src/tests/cuadrantes-maestros.test.ts
import { supabase } from '@/integrations/supabase/client';

describe('Cuadrantes Maestros', () => {
  it('should create cuadrante maestro', async () => {
    const { data, error } = await supabase
      .from('cuadrantes_maestros')
      .insert({
        nombre: 'Test Guardia A',
        centro_salud_id: 'test-centro-id',
        descripcion: 'Test description',
        activo: true
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.nombre).toBe('Test Guardia A');
  });

  it('should link cuadrante maestro to cuadrantes_biometricos', async () => {
    // TODO: Test upsert relationship
  });
});
```

### Test 2: EHR Main Table
```typescript
// src/tests/ehr.test.ts
describe('Electronic Health Record', () => {
  it('should create EHR for patient', async () => {
    const { data, error } = await supabase
      .from('electronic_health_record')
      .insert({
        patient_id: 'patient-123',
        hospital_id: 'hospital-456',
        summary_note: 'Test summary',
        active_problems: [
          { code: 'I10', description: 'Essential Hypertension' }
        ],
        medications_active: [
          { name: 'Lisinopril', dosage: '10mg', frequency: 'daily' }
        ],
        allergies: [
          { allergen: 'Penicillin', reaction: 'anaphylaxis' }
        ],
        created_by: 'user-123'
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.patient_id).toBe('patient-123');
  });

  it('should audit EHR access', async () => {
    // Test audit trail creation
  });
});
```

### Test 3: Episode Links
```typescript
// src/tests/ehr-episodes.test.ts
describe('EHR Episode Links', () => {
  it('should create consultation episode', async () => {
    const { data: ehr } = await supabase
      .from('electronic_health_record')
      .select('id')
      .limit(1)
      .single();

    const { data, error } = await supabase
      .from('ehr_episode_links')
      .insert({
        ehr_id: ehr.id,
        episode_type: 'consultation',
        episode_date: new Date().toISOString(),
        clinician_name: 'Dr. Sample',
        summary: 'Routine check-up',
        primary_diagnosis: 'Z00.00', // General examination
        status: 'completed'
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.episode_type).toBe('consultation');
  });
});
```

---

## 🔄 ACTUALIZACIÓN DE HOOKS

Una vez que las migraciones estén operativas, actualizar hooks:

### Actualizar `useElectronicHealthRecord.ts`
```typescript
export function useElectronicHealthRecord(patientId: string) {
  // Cambiar importación de supabase
  // import { supabase } from '@/integrations/supabase/client';  ✅ Correcto
  
  const ehrQuery = useQuery({
    queryKey: ['ehr', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('electronic_health_record')  // ✅ Tabla ya existe
        .select('*')
        .eq('patient_id', patientId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as ElectronicHealthRecord | null;
    },
  });
  
  // RestoCódigo...
}
```

### Actualizar `useCuadrantesBio.ts`
```typescript
export function useCuadrantesBio() {
  // Ahora el campo cuadrante_maestro_id ya existe en BD
  const list = async (
    centerId: string | null,
    from: string,
    to: string,
    selectedMaestroId: string | null = null  // ✅ Funciona correctamente
  ): Promise<CuadranteBio[]> => {
    let qb = supabase.from('cuadrantes_biometricos').select('*');
    
    if (selectedMaestroId && selectedMaestroId !== 'todos') {
      qb = qb.eq('cuadrante_maestro_id', selectedMaestroId);  // ✅ Campo existe
    }
    
    // Resto código...
  };
}
```

---

## 🚨 TROUBLESHOOTING

### Síntoma: FK constraint violation en cuadrantes_biometricos
```
Error: Key (cuadrante_maestro_id)=(...) is not present in table "cuadrantes_maestros"
```
**Solución:**
```sql
-- Verificar que ambas tablas existen
SELECT COUNT(*) FROM cuadrantes_maestros;
SELECT COUNT(*) FROM cuadrantes_biometricos;

-- Si electronic_health_record_audit falta, crearla:
-- (Copiar la sección de audit table desde MIGRACIONES_RECOMENDADAS.sql)
```

### Síntoma: RLS policy denying access
```
Error: new row violates row-level security policy for table "electronic_health_record"
```
**Solución:**
```sql
-- Verificar que el usuario está autenticado
SELECT auth.uid();  -- Debe retornar UUID, no NULL

-- Verificar que las policies están correctas
SELECT * FROM pg_policies 
WHERE tablename = 'electronic_health_record';
```

### Síntoma: JSONB validation error
```
Error: invalid input syntax for type jsonb
```
**Solución:**
```sql
-- Asegurar formato JSONB válido:
-- ✅ CORRECTO:
UPDATE electronic_health_record 
SET active_problems = '[{"code": "I10", "desc": "Hypertension"}]'::jsonb;

-- ❌ INCORRECTO:
UPDATE electronic_health_record 
SET active_problems = '[{code: "I10"}]';  -- Falta comillas en JSON
```

---

## 📊 MÉTRICAS DE ÉXITO

| Métrica | Baseline | Target | Status |
|---------|----------|--------|--------|
| Tablas creadas | 0 | 4 | ⏳ Pendiente |
| RLS policies activas | 0 | 12+ | ⏳ Pendiente |
| Audit triggers funcionales | 0 | 5+ | ⏳ Pendiente |
| Tests pasando | 0% | 100% | ⏳ Pendiente |
| Integración ASIS_13_EHR | ❌ | ✅ | ⏳ Pendiente |

---

## 🎯 PRÓXIMOS PASOS

### Inmediatamente post-migraciones (Día 1)
1. ✅ Ejecutar tests unitarios
2. ✅ Validar queries de lectura/escritura
3. ✅ Verificar performance con ANALYZE
4. ✅ Confirmar RLS policies funcionan

### Semana 1
1. ✅ Integración con componentes ASIS_13_EHR
2. ✅ Testing end-to-end
3. ✅ Validación HIPAA
4. ✅ Entrenamiento de team

### Semana 2
1. ✅ Deploy a producción (staging → production)
2. ✅ Monitoreo de performance (24-48 horas)
3. ✅ Rollback plan si es necesario
4. ✅ Documentación final

---

## 📞 SOPORTE

Si durante la ejecución encuentras:

**Error de Sintaxis SQL:**
- Copiar mensaje de error exacto
- Revisar en MIGRACIONES_RECOMENDADAS.sql la línea correspondiente
- Verificar que la tabla pre-requisito existe

**Constraint Violations:**
- Revisar que todas las tablas FK existan
- Ejecutar migraciones en orden: 1 → 2 → 3 → 4

**Performance Issues:**
- Ejecutar ANALYZE después de insertar datos
- Revisar índices creados correctamente

---

**Preparado por:** Análisis Automático Exhaustivo  
**Fecha:** 15 Abril 2025  
**Siguiente revisión:** Post-implementación en staging

