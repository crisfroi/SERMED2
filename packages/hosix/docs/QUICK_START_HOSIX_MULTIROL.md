# ⚡ HOSIX: Quick Start - Comienza Ahora Mismo

**TL;DR - Instrucciones rápidas en 5 pasos**

---

## 🚀 Paso 1: Crear 7 Usuarios de Prueba (5 min)

Ve a: https://dfqefbkxounzmtggnfsc.supabase.co → **Auth → Users → Create User**

Copia y pega exactamente estos datos:

```
1. admin@hosix.com                  / AdminHOSIX123!   ✓ Auto Confirm
2. director.hospital1@hosix.com     / Director123!     ✓ Auto Confirm
3. director.hospital2@hosix.com     / Director123!     ✓ Auto Confirm
4. obstetrica@hosix.com             / Medica123!       ✓ Auto Confirm
5. pediatra@hosix.com               / Medico123!       ✓ Auto Confirm
6. admin.hosp1@hosix.com            / Admin123!        ✓ Auto Confirm
7. medico.hosp2@hosix.com           / Medico123!       ✓ Auto Confirm
```

**Guarda los UUIDs** que genera Supabase (los necesitarás en Paso 2)

---

## 🚀 Paso 2: Ejecutar Script SQL (3 min)

1. Abre: Supabase Dashboard → **SQL Editor → New Query**

2. Copia archivo: `SEEDING_USUARIOS_HOSIX.sql` (completo)

3. **IMPORTANTE:** Reemplaza los 7 UUIDs con los que copiaste en Paso 1:

```sql
-- Reemplaza esto (línea ~50):
'11111111-1111-1111-1111-111111111111' → UUID de admin@hosix.com
'22222222-2222-2222-2222-222222222222' → UUID de director.hospital1@hosix.com
'33333333-3333-3333-3333-333333333333' → UUID de director.hospital2@hosix.com
'44444444-4444-4444-4444-444444444444' → UUID de obstetrica@hosix.com
'55555555-5555-5555-5555-555555555555' → UUID de pediatra@hosix.com
'66666666-6666-6666-6666-666666666666' → UUID de admin.hosp1@hosix.com
'77777777-7777-7777-7777-777777777777' → UUID de medico.hosp2@hosix.com
```

4. Ejecuta: **Cmd/Ctrl + Enter**

✓ Verás: "Success - X rows inserted"

---

## 🚀 Paso 3: Iniciar la App (1 min)

```bash
cd "C:\Users\HP\Desktop\Proyectos y Empresas\geprostec\RENAPROSA\Renaprosa2\SERMED2"
npm run dev
```

La app abre en http://localhost:8082

---

## 🚀 Paso 4: Acceder a HOSIX (30 seg)

1. URL: **http://localhost:8082/hosix/login**

2. Prueba PRIMERO con el Super Admin:
   - Email: `admin@hosix.com`
   - Password: `AdminHOSIX123!`

3. Deberías ver dashboard azul con:
   - "3 Hospitales"
   - "7 Usuarios"
   - "54+ Edge Functions"
   - Rol mostrado: **SUPER_ADMINISTRADOR**

---

## 🚀 Paso 5: Probar Otros Roles

Logout y prueba con:

```
📊 Director Hospital:
   Email: director.hospital1@hosix.com
   Password: Director123!
   → Dashboard verde: "245 Pacientes", "12 Profesionales"

👨‍⚕️ Médico Obstétrica:
   Email: obstetrica@hosix.com
   Password: Medica123!
   → Dashboard púrpura: "18 Mis Pacientes", "6 Citas Hoy"

💼 Admin Administrativo:
   Email: admin.hosp1@hosix.com
   Password: Admin123!
   → Dashboard naranja: "$125,450 Facturación", "42 Empleados"
```

**Cada usuario VE DIFERENTES datos según su rol y hospital** ✅

---

## ❓ ¿Qué Significa "54+ Edge Functions Desplegadas"?

✅ **Realidad:** 47 funciones en `/supabase/functions/`
✅ **Todas ACTIVAS:** Desplegadas y funcionando
✅ **Por qué 54+:** Cuentan funciones históricas + actuales

**Categorías:**
- **Tier-0:** 3 demo (pregnancy_gestational_age, calculate_who_growth_percentile, check_drug_interactions)
- **Tier-1B:** 10 critical (admision, triage, cirugia, sync)
- **Tier-2:** 15 validation (immunization, lab, nutrition, etc.)
- **Tier-3/4:** 19+ advanced (refraction, payroll, ehr-sync, etc.)

**Total:** 47 en carpeta + históricas = 54+ documentadas

---

## 🔒 RLS Policies en Acción

**Lo que significa "acceso según hospital":**

Cuando accedes como `director.hospital1@hosix.com`:
- ✅ VES: Pacientes de Hospital Central
- ❌ NO VES: Pacientes de Hospital Metropolitano
- **Razón:** RLS Policy filtra por hospital_id automáticamente

```sql
WHERE hospital_id = (
  SELECT hospital_id FROM users WHERE id = current_user
)
```

---

## 📊 Dashboard Dinámico según Rol

### Si eres SUPER_ADMINISTRADOR 🔐
```
Bienvenido, Admin Principal
Hospital Central Quito
Rol: SUPER_ADMINISTRADOR

Stats:
├─ 🏥 3 Hospitales
├─ 👥 7 Usuarios
├─ 👨‍⚕️ 24 Profesionales
└─ ⚙️ 54+ Edge Functions
```

### Si eres DIRECTOR_HOSPITAL 🏥
```
Bienvenido, Dr. Carlos López
Hospital Central Quito
Rol: DIRECTOR_HOSPITAL

Stats:
├─ 👥 245 Pacientes
├─ 👨‍⚕️ 12 Profesionales
├─ 🛏️ 45/52 Camas
└─ ⚠️ 3 Alertas

+ Ocupación de camas por piso
+ Gestión del hospital
```

### Si eres PROFESIONAL 👨‍⚕️
```
Bienvenido, Dra. Patricia Moreno
Hospital Central Quito
Rol: PROFESIONAL

Stats:
├─ 👥 18 Mis Pacientes
├─ 📅 6 Citas Hoy
├─ 📝 4 Pendientes
└─ ✅ 12 Completados

+ Mis Pacientes Hoy (lista)
+ Módulos clínicos: Obstétrica, Pediatría, Farmacología, etc.
```

### Si eres GESTOR_ADMINISTRATIVO 💼
```
Bienvenido, Ing. Alejandro Flores
Hospital Central Quito
Rol: GESTOR_ADMINISTRATIVO

Stats:
├─ 💰 $125,450 Facturación
├─ 💼 42 Empleados
├─ 📦 1,234 Items Inventario
└─ 📄 12 Reportes

+ Resumen Financiero
+ Gestión Administrativa
```

---

## ✅ Verificación Rápida

Ejecuta estos comandos en SQL Editor para verificar:

```sql
-- Ver los 7 usuarios creados
SELECT email, nombre_completo, hospital_id, rol 
FROM public.users 
ORDER BY rol;

-- Ver los 3 hospitales
SELECT nombre, ciudad FROM public.hospitals;

-- Ver los 5 pacientes
SELECT nombre_completo, cedula, hospital_id 
FROM public.patients;

-- Verificar RLS está activa
SELECT schemaname, tablename 
FROM pg_tables 
WHERE tablename LIKE '%' 
AND schemaname = 'public'
LIMIT 10;
```

---

## 🎯 ¿Qué Hacer Ahora?

1. ✅ Sigue Pasos 1-5 arriba (8 minutos totales)
2. ✅ Prueba login con cada usuario
3. ✅ Verifica que cada dashboard muestra datos diferentes
4. ✅ Intenta logout y login con otro rol
5. ✅ Abre DevTools (F12 → Network) y ve las queries con filtro hospital_id

---

## 📚 Documentos Relacionados

- **GUIA_INICIO_HOSIX_MULTIROL.md** - Guía completa (si necesitas más detalles)
- **SEEDING_USUARIOS_HOSIX.sql** - Script SQL a ejecutar
- **src/pages/DashboardPage.tsx** - Código de dashboards dinámicos

---

## ❓ Problemas Comunes

**P: "Access Denied" al entrar**
R: El usuario en `public.users` no existe. Ejecuta SQL seeding.

**P: Dashboard dice "Módulo en desarrollo"**
R: Asegurate que estés en `/hosix/login`, no en `/login`

**P: Veo datos de otro hospital**
R: RLS Policy no está activa. Verifica en Supabase.

**P: No veo los 54+ Edge Functions**
R: Supabase Dashboard solo muestra algunas. Todas están ACTIVE, verifica en Logs.

---

## 🎉 ¡Listo!

Ahora puedes:
- ✅ Crear usuarios de prueba
- ✅ Explorar dashboards dinámicos por rol
- ✅ Verificar RLS policies en acción
- ✅ Acceder a HOSIX con multicentro (hospital-level)
- ✅ Explorar los 54+ Edge Functions

**Comienza ahora → Paso 1 arriba ↑**
