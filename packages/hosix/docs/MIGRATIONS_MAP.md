# MIGRATIONS MAP

## Migraciones HOSIX por Módulo

### Ubicación

```
packages/hosix/src/migrations/hosix/
  ├── 001-auth/             # Module 00-core/auth
  ├── 002-patients/         # Module 00-core/patients
  ├── 003-ehr/              # Module 00-core/ehr
  ├── 010-obstetrics/       # Module 01-obstetrics
  ├── 020-pediatrics/       # Module 02-pediatrics
  ├── ... (futuro)
```

### Module 00-core Migrations

| # | Nombre | Descripción | Tablas | Status |
|---|--------|-------------|--------|--------|
| 001 | create_auth_tables | Perfil de usuario y permisos | user_profiles, user_permissions | ✅ Created |
| 002 | create_patient_tables | Pacientes y datos demográficos | patients, patient_demographics | ✅ Placeholder |
| 003 | create_ehr_tables | Registros de salud electrónicos | ehr_records, documents | ✅ Placeholder |

### Plantilla de Migración

```sql
-- Migration: NNN - Descripción
-- Date: YYYY-MM-DD
-- Module: NN-name
-- Dependencies: Module X, Module Y

CREATE TABLE IF NOT EXISTS table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- columns...
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "policy_name" ON table_name
  FOR SELECT USING (auth.uid() = user_id);
```

## Deployment

### Desde packages/hosix/src/migrations/

Código fuente para migraciones está aquí. Las migraciones están versionadas y pueden referenciarse.

### Verdaderas Migraciones en supabase/migrations/

Las migraciones se registran en:
```
supabase/migrations/
  ├── 001_init_auth.sql
  ├── 002_init_patients.sql
  ├── ... (75+ migraciones existentes)
```

## Status

- ✅ Estructura de carpetas creada
- ✅ Plantilla de auth migration lista
- ⏳ Pacientes y EHR a completar
- ⏳ Migraciones de módulos 01-11 a crear (futuro)

## Notas

- PostgreSQL con RLS habilitado
- Todas las tablas tienen `created_at` y `updated_at`
- Política de auditoría: changes tracked en audit table
- Foreign keys con CASCADE DELETE donde corresponda
- Índices en campos frecuentemente consultados
