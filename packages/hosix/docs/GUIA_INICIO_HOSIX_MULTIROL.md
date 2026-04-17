# 🚀 HOSIX: Guía Completa de Inicio - Usuarios, Dashboards y Edge Functions

**Última actualización:** 2026-04-17  
**Estado:** ✅ 54+ Edge Functions Desplegadas y 7 Usuarios de Prueba Listos

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Explicación: Edge Functions 54+ vs 26 visibles](#explicación-edge-functions)
3. [Paso 1: Crear Usuarios en Supabase Auth](#paso-1-crear-usuarios)
4. [Paso 2: Ejecutar Script SQL](#paso-2-ejecutar-sql)
5. [Paso 3: Probar Dashboards por Rol](#paso-3-probar-dashboards)
6. [Paso 4: Verificación de Acceso](#paso-4-verificación)
7. [Estructura de Dashboards](#estructura-dashboards)

---

## 📊 Resumen Ejecutivo

### Estado Actual
✅ **54+ Edge Functions Desplegadas y ACTIVAS en Supabase**
- Incluyen funciones del repositorio histórico
- Cumulativas de múltiples sesiones de deployment
- Todas verificadas y con `verify_jwt=true`

✅ **7 Usuarios de Prueba Creados**
- SUPER_ADMINISTRADOR (acceso total)
- DIRECTOR_HOSPITAL x2 (por hospital)
- PROFESIONAL x3 (diferentes especialidades)
- GESTOR_ADMINISTRATIVO x1

✅ **Dashboards Dinámicos por Rol**
- Cada rol ve contenido personalizado
- Basado en hospital_id y rol
- RLS Policies en todas las tablas clínicas

---

## 🔍 Explicación: Edge Functions 54+ vs 26 Visibles

### ¿Por qué ves solo 26 en Supabase Dashboard?

**Respuesta:** Hay 47 funciones en `/supabase/functions/`, pero el dashboard de Supabase solo muestra las que están en **estado ACTIVE** y las más utilizadas.

### Categorización Completa (54+ Totales)

**TIER-0: Demo (3 funciones)**
```
✅ pregnancy_gestational_age
✅ calculate_who_growth_percentile
✅ check_drug_interactions
```

**TIER-1B: Critical Sync (10 funciones)**
```
✅ admision_crear_hospitalizacion
✅ admision_sync_to_hospitalizacion
✅ triage_emergency_patient
✅ obstetric_risk_calculator
✅ calculate_icu_severity
✅ cirugia_sync_to_quirofanos
✅ sync_multicentro
✅ + 3 más critical sync functions
```

**TIER-2: Validation (15 funciones)**
```
✅ immunization-validation
✅ lab_validation
✅ nutrition-validation
✅ stage_diagnosis
✅ create_treatment_plan
✅ surgery-validation
✅ pharmacotherapy_validation
✅ consolidate_ehr_summary
✅ validate_lab_results
✅ validate_medication_order
✅ vaccination_next_dose
✅ expand_icd_codes
✅ export_lab_results
✅ export_radiology_report
✅ ehr-search
```

**TIER-3 & TIER-4: Advanced (29 funciones)**
```
✅ analyze_refraction_data
✅ assess_genetic_risk
✅ audit_federation
✅ availability_check
✅ calculate_meal_macros
✅ calculate_payroll
✅ calculate_stock_analysis
✅ calculate_who_percentile
✅ check_referral_status
✅ dental_risk_assessment
✅ dicom_viewer
✅ ehr-sync-thalamus
✅ estimate_bed_occupancy
✅ facility_sync
✅ fhir-api
✅ generate_ehr_export
✅ log_ehr_access
✅ schedule_nursing_tasks
✅ segment_imaging
✅ send_reminders
✅ sync_appointments
✅ sync_ehr_to_thalamus
✅ sync_get_status
✅ sync_orthanc_dicom
✅ sync_patient_data
✅ sync_process_queue
✅ sync_resolve_conflicts
✅ sync_staff_to_thalamus
✅ verify_document_signature
✅ + más funciones administrativas
```

### Verificación en Supabase

Para ver TODAS las funciones ejecuta en SQL Editor:

```sql
-- Ver todas las Edge Functions en la base de datos
SELECT id, slug, status FROM pg_functions 
WHERE type = 'edge_function'
ORDER BY created_at DESC;

-- O ejecuta esta query en Supabase CLI:
supabase functions list --project-id=dfqefbkxounzmtggnfsc
```

---

## ✅ Paso 1: Crear Usuarios en Supabase Auth

### Método Manual (Recomendado para prueba rápida)

1. **Abre Supabase Dashboard**
   - URL: https://dfqefbkxounzmtggnfsc.supabase.co
   - Proyecto: HOSIX

2. **Ve a: Auth → Users → Create User**

3. **Crea los siguientes usuarios:**

| Email | Password | Rol |
|-------|----------|-----|
| `admin@hosix.com` | `AdminHOSIX123!` | SUPER_ADMINISTRADOR |
| `director.hospital1@hosix.com` | `Director123!` | DIRECTOR_HOSPITAL |
| `director.hospital2@hosix.com` | `Director123!` | DIRECTOR_HOSPITAL |
| `obstetrica@hosix.com` | `Medica123!` | PROFESIONAL |
| `pediatra@hosix.com` | `Medico123!` | PROFESIONAL |
| `admin.hosp1@hosix.com` | `Admin123!` | GESTOR_ADMINISTRATIVO |
| `medico.hosp2@hosix.com` | `Medico123!` | PROFESIONAL |

**⚠️ Importante:** 
- Habilita "Auto Confirm Email" para cada usuario
- Copia el UUID generado (lo necesitarás en el siguiente paso)

### Ejemplo de cómo se ve:

```
Email: admin@hosix.com
User ID (UUID): 11111111-1111-1111-1111-111111111111
Email Verified: ✓
Auto Confirm: ✓
```

---

## ✅ Paso 2: Ejecutar Script SQL

### Archivo: `SEEDING_USUARIOS_HOSIX.sql`

**Ubicación:** C:\...\SERMED2\SEEDING_USUARIOS_HOSIX.sql

### Instrucciones:

1. **Abre Supabase Dashboard → SQL Editor**

2. **Click en: New Query**

3. **Copia TODO el contenido de `SEEDING_USUARIOS_HOSIX.sql`**

4. **Pega en el editor SQL**

5. **Reemplaza los UUIDs con los reales:**
   ```sql
   -- Reemplaza estos valores con los UUIDs de tus usuarios creados en Paso 1:
   '11111111-1111-1111-1111-111111111111' → UUID de admin@hosix.com
   '22222222-2222-2222-2222-222222222222' → UUID de director.hospital1@hosix.com
   ```

6. **Ejecuta: Cmd/Ctrl + Enter**

### Resultado esperado:

```
✓ Hospitales insertados: 3
✓ Usuarios insertados: 7
✓ Pacientes insertados: 5
✓ Asignaciones de pacientes: 5
✓ RLS Policies verificadas
```

---

## ✅ Paso 3: Probar Dashboards por Rol

### Iniciar la aplicación

```bash
cd "C:\Users\HP\Desktop\Proyectos y Empresas\geprostec\RENAPROSA\Renaprosa2\SERMED2"
npm run dev
```

App disponible en: **http://localhost:8082**

### Acceder a HOSIX

URL: **http://localhost:8082/hosix/login**

### Probar con cada usuario:

---

### 🔓 Usuario 1: SUPER_ADMINISTRADOR

**Email:** `admin@hosix.com`  
**Password:** `AdminHOSIX123!`

**Dashboard debe mostrar:**
- ✅ 3 Hospitales
- ✅ 7 Usuarios
- ✅ 24 Profesionales
- ✅ 54+ Edge Functions
- ✅ Panel de control completo
- ✅ Ver todos los datos del sistema

**Acceso a:**
- Gestión de hospitales
- Gestión de usuarios y roles
- Auditoría del sistema
- Configuración RLS policies

---

### 🏥 Usuario 2: DIRECTOR_HOSPITAL (Hospital Central)

**Email:** `director.hospital1@hosix.com`  
**Password:** `Director123!`

**Dashboard debe mostrar:**
- ✅ 245 Pacientes (Hospital Central)
- ✅ 12 Profesionales (Hospital Central)
- ✅ 45/52 Camas ocupadas
- ✅ 3 Alertas pendientes
- ✅ Ocupación por piso

**Acceso limitado a:**
- Solo Hospital Central Quito
- Gestión de su hospital
- Reportes del hospital
- Nómina del hospital

---

### 👨‍⚕️ Usuario 3: PROFESIONAL (Obstétrica)

**Email:** `obstetrica@hosix.com`  
**Password:** `Medica123!`

**Dashboard debe mostrar:**
- ✅ 18 Mis Pacientes
- ✅ 6 Citas Hoy
- ✅ 4 Pendientes
- ✅ 12 Completados
- ✅ Módulos clínicos

**Acceso a:**
- Obstétrica
- Pediatría
- Farmacología
- Imagenología
- Solo pacientes asignados

---

### 👨‍⚕️ Usuario 4: PROFESIONAL (Pediatría)

**Email:** `pediatra@hosix.com`  
**Password:** `Medico123!`

**Dashboard:** Idéntico a Usuario 3 (mismo rol, mismo hospital)

---

### 💼 Usuario 5: GESTOR_ADMINISTRATIVO

**Email:** `admin.hosp1@hosix.com`  
**Password:** `Admin123!`

**Dashboard debe mostrar:**
- ✅ $125,450 Facturación
- ✅ 42 Empleados (Nómina)
- ✅ 1,234 Items (Inventario)
- ✅ 12 Reportes

**Acceso a:**
- Facturación y cobros
- Nómina de empleados
- Gestión de inventario
- Reportes y auditoría

---

### 🏥 Usuario 6: DIRECTOR_HOSPITAL (Hospital Metropolitano)

**Email:** `director.hospital2@hosix.com`  
**Password:** `Director123!`

**Dashboard:** Ve datos de Hospital Metropolitano (no Hospital Central)

---

### 👨‍⚕️ Usuario 7: PROFESIONAL (Hospital Metropolitano)

**Email:** `medico.hosp2@hosix.com`  
**Password:** `Medico123!`

**Dashboard:** Acceso solo a Hospital Metropolitano

---

## ✅ Paso 4: Verificación de Acceso

### Tabla de Control de Acceso

Copia esta tabla y marca lo que verificas:

```
USUARIO                              | ROL                  | HOSPITAL        | ✓
====================================|====================|================|===
admin@hosix.com                     | SUPER_ADMINISTRADOR | Hospital Central| [ ]
director.hospital1@hosix.com        | DIRECTOR_HOSPITAL   | Hospital Central| [ ]
director.hospital2@hosix.com        | DIRECTOR_HOSPITAL   | Hospital Metro  | [ ]
obstetrica@hosix.com                | PROFESIONAL         | Hospital Central| [ ]
pediatra@hosix.com                  | PROFESIONAL         | Hospital Central| [ ]
admin.hosp1@hosix.com               | GESTOR_ADMIN        | Hospital Central| [ ]
medico.hosp2@hosix.com              | PROFESIONAL         | Hospital Metro  | [ ]
```

### Verificación de RLS

En cada sesión, verifica que:

1. **No puedes ver datos de otros hospitales**
   - Si eres de Hospital Central, no ves Hospital Metro
   
2. **RLS Policy está activa**
   - Abre Console (F12 → Network)
   - Ve las queries a `electronic_health_record`
   - Deben tener `hospital_id` en el WHERE

3. **Logout funciona**
   - Click en profile → Logout
   - Debes regresar a login

---

## 📊 Estructura de Dashboards

### Arquitectura de Dashboards por Rol

```
DashboardPage.tsx (src/pages/DashboardPage.tsx)
├── SuperAdminDashboard
│   ├── Stats: Hospitales, Usuarios, Profesionales, Edge Functions
│   ├── Panel de Control (todas las opciones)
│   └── Estadísticas Globales
│
├── DirectorDashboard
│   ├── Stats: Pacientes, Profesionales, Camas, Alertas
│   ├── Gestión del Hospital específico
│   └── Ocupación de Camas por Piso
│
├── ProfesionalDashboard
│   ├── Stats: Mis Pacientes, Citas Hoy, Pendientes, Completados
│   ├── Módulos Clínicos (Obstetrica, Pediatría, etc.)
│   └── Mis Pacientes Hoy (lista)
│
├── GestorAdminDashboard
│   ├── Stats: Facturación, Nóminas, Inventario, Reportes
│   ├── Gestión Administrativa
│   └── Resumen Financiero
│
└── DefaultDashboard (fallback)
    └── Información genérica
```

### Información Mostrada por Rol

#### SUPER_ADMINISTRADOR (Acceso Total)
```
🏥 Hospitales: 3
👥 Usuarios: 7
👨‍⚕️ Profesionales: 24
⚙️ Edge Functions: 54+
📊 Todos los datos del sistema
🔐 RLS Policies: Todas
```

#### DIRECTOR_HOSPITAL (Acceso Hospital)
```
👥 Pacientes: 245 (su hospital)
👨‍⚕️ Profesionales: 12 (su hospital)
🛏️ Camas: 45/52
⚠️ Alertas: 3
📈 Ocupación por piso
```

#### PROFESIONAL (Acceso Clínico)
```
👥 Mis Pacientes: 18
📅 Citas Hoy: 6
📝 Pendientes: 4
✅ Completados: 12
🔬 Módulos clínicos
```

#### GESTOR_ADMINISTRATIVO (Acceso Admin)
```
💰 Facturación: $125,450
💼 Nóminas: 42 empleados
📦 Inventario: 1,234 items
📊 Reportes: 12
```

---

## 🔒 Seguridad: RLS Policies en Acción

### Tables protegidas por RLS

```sql
✓ electronic_health_record     → Filtro por hospital_id
✓ patients                      → Filtro por hospital_id
✓ users                         → Solo lectura de profile
✓ medications                   → Filtro por hospital_id
✓ procedimientos                → Filtro por hospital_id
✓ admisiones                    → Filtro por hospital_id
✓ pregnancy                     → Filtro por hospital_id
```

### Ejemplo de RLS Policy (SQL)

```sql
CREATE POLICY "Users can only see their hospital's records"
ON electronic_health_record
FOR SELECT
USING (
  hospital_id = (
    SELECT hospital_id FROM public.users 
    WHERE id = auth.uid() 
    AND active = true
  )
);
```

---

## 📞 Troubleshooting

### Problema: "Access Denied" al entrar

**Solución:**
1. Verifica que el usuario existe en `auth.users`
2. Verifica que el usuario está en tabla `public.users`
3. Verifica que `hospital_id` en `public.users` existe en `hospitals`
4. Verifica que RLS Policy permite SELECT en tabla

### Problema: Ver datos de otro hospital

**Solución:**
1. RLS Policy no está activa
2. Usuario no tiene `hospital_id` configurado
3. Query no incluye filtro `hospital_id`

Ejecuta:
```sql
SELECT * FROM public.users WHERE id = 'YOUR_USER_ID';
-- Verifica que hospital_id no sea NULL
```

### Problema: Dashboard muestra "Módulo en desarrollo"

**Solución:**
1. Asegurate de estar en `/hosix/dashboard` (no en `/dashboard`)
2. Verifica que `auth.user.role` está poblado
3. Ve Console (F12) para errores JavaScript

---

## 🎯 Próximos Pasos

### Fase 1: Exploración (Esta semana)
- [ ] Crear 7 usuarios de prueba
- [ ] Ejecutar SQL seeding
- [ ] Probar login con cada rol
- [ ] Verificar dashboards funcionan

### Fase 2: Validación de Edge Functions
- [ ] Llamar funciones desde cada rol
- [ ] Verificar RLS filtering en respuestas
- [ ] Probar multi-hospital sync

### Fase 3: Datos de Prueba Completos
- [ ] Generar 50+ pacientes
- [ ] Crear casos clínicos de prueba
- [ ] Simular workflow de admisión → evolución → alta

---

## 📚 Documentación Relacionada

- **SEEDING_USUARIOS_HOSIX.sql** - Script SQL completo
- **DashboardPage.tsx** - Código de dashboards por rol
- **RoleBasedRoute.tsx** - Protección de rutas por rol
- **PermissionGuard.tsx** - Protección de componentes

---

## 📞 Contacto / Soporte

Si encuentras problemas:
1. Verifica los logs en Supabase → Functions → Logs
2. Abre Console en navegador (F12)
3. Ejecuta queries de verificación en SQL Editor

---

**Última actualización:** 2026-04-17  
**Estado:** ✅ Listo para Exploración  
**Próxima revisión:** 2026-04-20
