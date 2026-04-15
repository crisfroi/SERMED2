# 📋 PLAN MAESTRO: APLICAR TODAS LAS MIGRACIONES

**Status**: 🚨 CRÍTICO - Sin tablas básicas

**Tablas en Supabase HOSIX** (verificado):
- ✅ electronic_health_record (ASIS_13)
- ✅ ehr_episode_links (ASIS_13)
- ✅ ehr_document_storage (ASIS_13)

**Tablas FALTANTES** (URGENTE):
- ❌ staff_records (ADMIN_1)
- ❌ payroll_processing (ADMIN_1)
- ❌ staff_positions (ADMIN_1)
- ❌ staff_departments (ADMIN_1)
- ❌ waiting_rooms (ADMIN_2)
- ❌ waiting_queue (ADMIN_2)
- ❌ pregnancy (ASIS_04)
- ❌ delivery (ASIS_04)
- ❌ ... (TODAS las demás ASIS_05-15)

---

## 🔢 ORDEN DE APLICACIÓN (CRÍTICO)

### Fase 0: Base (Foundation)
```
1. migrations/002_admin_1_hr_schema.sql
   → staff_records
   → staff_positions
   → staff_departments
   → payroll_processing
   → (más...)
```

```
2. migrations/003_admin_2_waiting_rooms_schema.sql
   → waiting_rooms
   → waiting_queue
   → (más...)
```

### Fase 1: ASIS_04-15 (Clinical Modules)

```
3. supabase/migrations/20260412_001_create_obstetrics_tables.sql (ASIS_04)
```

```
4. supabase/migrations/20260412_002_create_cred_tables.sql (ASIS_05)
```

```
5. supabase/migrations/20260414_001_create_nutrition_tables.sql (ASIS_07)
```

```
6. supabase/migrations/20260414_002_create_immunization_tables.sql (ASIS_06)
```

```
7. supabase/migrations/20260414_003_create_pharmacy_tables.sql (ASIS_10)
```

```
8. supabase/migrations/20260414_004_create_laboratory_tables.sql (ASIS_08)
```

```
9. supabase/migrations/20260414_005_create_referral_tables.sql (ASIS_11)
```

```
10. supabase/migrations/20260415_007_create_surgery_tables.sql (ASIS_?)
```

```
11. supabase/migrations/20260416_001_create_laboratory_tables.sql (Duplicate? VERIFY)
```

```
12. supabase/migrations/20260416_002_create_imaging_tables.sql (ASIS_09)
```

---

## 📊 ESTADO

- **Total migraciones a aplicar**: ~12 archivos SQL principales
- **Migraciones aplicadas HOY**: 3 (ASIS_13 EHR)
- **Migraciones PENDIENTES**: 9
- **Tiempo estimado**: 15-30 minutos

---

## ⚠️ DEPENDENCIAS

Muchas tablas tienen FOREIGN KEYS a otras (ej: `hospitals`, `patients`, `users`).

**ESTAS TABLAS BASE DEBEN EXISTIR PRIMERO**:
- hospitals
- patients  
- users
- clinics
- physician
- staff (or similar)

**VERIFICAR**: ¿Existen estas tablas base en Supabase HOSIX?

---

## 🚀 PRÓXIMO PASO

1. Verificar si tablas base existen:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('hospitals', 'patients', 'users', 'clinics')
   ORDER BY table_name;
   ```

2. Si FALTAN tablas base → Crear primero (migrations/001_base_schema.sql)

3. Si EXISTEN → Aplicar todas las migraciones en orden

---

**User Decision**: ¿Ejecutamos verificación de tablas base ahora?
