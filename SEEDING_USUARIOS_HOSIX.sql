-- ============================================================================
-- HOSIX: SQL Seeding Script - Usuarios de Prueba Multirol y Multicentro
-- ============================================================================
-- Fecha: 2026-04-17
-- Descripción: Script para crear usuarios de prueba para todos los niveles
--              de acceso y hospitales en HOSIX
-- 
-- INSTRUCCIONES:
-- 1. Copia este contenido
-- 2. Ve a Supabase Dashboard → SQL Editor → New Query
-- 3. Pega el código completo
-- 4. Ejecuta (Cmd/Ctrl + Enter)
-- ============================================================================

-- ============================================================================
-- PARTE 1: Crear Hospitales (Centros de Salud)
-- ============================================================================

INSERT INTO public.hospitals (id, nombre, ciudad, provincia, capacidad, telefono, active) 
VALUES 
  ('hospital-1-uuid', 'Hospital Central Quito', 'Quito', 'Pichincha', 200, '(02) 2234-5678', true),
  ('hospital-2-uuid', 'Hospital Metropolitano', 'Guayaquil', 'Guayas', 150, '(04) 2287-6543', true),
  ('hospital-3-uuid', 'Hospital San Francisco', 'Cuenca', 'Azuay', 100, '(07) 4108-0000', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PARTE 2: Crear Usuarios de Prueba en auth.users (Supabase Auth)
-- ============================================================================
-- NOTA: En producción, estos usuarios se crean vía Supabase Dashboard
-- Los UUIDs generados aquí son para referencia. Reemplaza con UUIDs reales.

-- Insertar usuarios en auth.users usando admin API (ejecutar en SQL Editor)
-- El sistema creará estos automáticamente si usas Supabase signup flow

-- ============================================================================
-- PARTE 3: Tabla de Usuarios HOSIX (public.users)
-- ============================================================================
-- Esta tabla mapea auth.users con hospital, rol y permisos

-- USUARIO 1: SUPER_ADMINISTRADOR (Acceso a todo)
INSERT INTO public.users (
  id, 
  email, 
  nombre_completo, 
  hospital_id, 
  rol, 
  active, 
  created_at
) VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  'admin@hosix.com',
  'Admin Principal',
  'hospital-1-uuid',
  'SUPER_ADMINISTRADOR',
  true,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  rol = 'SUPER_ADMINISTRADOR',
  active = true;

-- USUARIO 2: DIRECTOR_HOSPITAL (Acceso a hospital 1)
INSERT INTO public.users (
  id, 
  email, 
  nombre_completo, 
  hospital_id, 
  rol, 
  active, 
  created_at
) VALUES 
(
  '22222222-2222-2222-2222-222222222222',
  'director.hospital1@hosix.com',
  'Dr. Carlos López - Hospital Central',
  'hospital-1-uuid',
  'DIRECTOR_HOSPITAL',
  true,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  rol = 'DIRECTOR_HOSPITAL',
  active = true;

-- USUARIO 3: DIRECTOR_HOSPITAL (Acceso a hospital 2)
INSERT INTO public.users (
  id, 
  email, 
  nombre_completo, 
  hospital_id, 
  rol, 
  active, 
  created_at
) VALUES 
(
  '33333333-3333-3333-3333-333333333333',
  'director.hospital2@hosix.com',
  'Dra. María García - Hospital Metropolitano',
  'hospital-2-uuid',
  'DIRECTOR_HOSPITAL',
  true,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  rol = 'DIRECTOR_HOSPITAL',
  active = true;

-- USUARIO 4: PROFESIONAL (Obstétrica - Hospital 1)
INSERT INTO public.users (
  id, 
  email, 
  nombre_completo, 
  hospital_id, 
  rol, 
  active, 
  created_at
) VALUES 
(
  '44444444-4444-4444-4444-444444444444',
  'obstetrica@hosix.com',
  'Dra. Patricia Moreno - Obstétrica',
  'hospital-1-uuid',
  'PROFESIONAL',
  true,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  rol = 'PROFESIONAL',
  active = true;

-- USUARIO 5: PROFESIONAL (Pediatría - Hospital 1)
INSERT INTO public.users (
  id, 
  email, 
  nombre_completo, 
  hospital_id, 
  rol, 
  active, 
  created_at
) VALUES 
(
  '55555555-5555-5555-5555-555555555555',
  'pediatra@hosix.com',
  'Dr. Fernando Ruiz - Pediatría',
  'hospital-1-uuid',
  'PROFESIONAL',
  true,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  rol = 'PROFESIONAL',
  active = true;

-- USUARIO 6: GESTOR_ADMINISTRATIVO (Hospital 1)
INSERT INTO public.users (
  id, 
  email, 
  nombre_completo, 
  hospital_id, 
  rol, 
  active, 
  created_at
) VALUES 
(
  '66666666-6666-6666-6666-666666666666',
  'admin.hosp1@hosix.com',
  'Ing. Alejandro Flores - Administración',
  'hospital-1-uuid',
  'GESTOR_ADMINISTRATIVO',
  true,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  rol = 'GESTOR_ADMINISTRATIVO',
  active = true;

-- USUARIO 7: PROFESIONAL (Hospital 2)
INSERT INTO public.users (
  id, 
  email, 
  nombre_completo, 
  hospital_id, 
  rol, 
  active, 
  created_at
) VALUES 
(
  '77777777-7777-7777-7777-777777777777',
  'medico.hosp2@hosix.com',
  'Dr. Juan Andrade - Hospital Metropolitano',
  'hospital-2-uuid',
  'PROFESIONAL',
  true,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  rol = 'PROFESIONAL',
  active = true;

-- ============================================================================
-- PARTE 4: Crear Pacientes de Prueba
-- ============================================================================

-- Pacientes para Hospital Central Quito
INSERT INTO public.patients (
  id, 
  hospital_id, 
  nombre_completo, 
  cedula, 
  fecha_nacimiento, 
  genero, 
  telefono, 
  email, 
  created_at
) VALUES 
(
  'patient-001-uuid',
  'hospital-1-uuid',
  'Sofía Martínez García',
  '1234567890',
  '1985-05-15',
  'F',
  '0998765432',
  'sofia.martinez@example.com',
  now()
),
(
  'patient-002-uuid',
  'hospital-1-uuid',
  'Andrés Yánez López',
  '1234567891',
  '1990-08-20',
  'M',
  '0987654321',
  'andres.yanez@example.com',
  now()
),
(
  'patient-003-uuid',
  'hospital-1-uuid',
  'María Consuelo Rodríguez',
  '1234567892',
  '1992-03-10',
  'F',
  '0991111111',
  'maria.consuelo@example.com',
  now()
)
ON CONFLICT DO NOTHING;

-- Pacientes para Hospital Metropolitano Guayaquil
INSERT INTO public.patients (
  id, 
  hospital_id, 
  nombre_completo, 
  cedula, 
  fecha_nacimiento, 
  genero, 
  telefono, 
  email, 
  created_at
) VALUES 
(
  'patient-004-uuid',
  'hospital-2-uuid',
  'Roberto Castillo Vega',
  '1234567893',
  '1988-11-25',
  'M',
  '0992222222',
  'roberto.castillo@example.com',
  now()
),
(
  'patient-005-uuid',
  'hospital-2-uuid',
  'Laura Herrera Mendoza',
  '1234567894',
  '1995-07-30',
  'F',
  '0993333333',
  'laura.herrera@example.com',
  now()
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PARTE 5: Asignar Pacientes a Hospitales (patient_assignments)
-- ============================================================================

INSERT INTO public.patient_assignments (
  patient_id, 
  hospital_id, 
  assignment_type, 
  created_at
) VALUES 
('patient-001-uuid', 'hospital-1-uuid', 'admission', now()),
('patient-002-uuid', 'hospital-1-uuid', 'outpatient', now()),
('patient-003-uuid', 'hospital-1-uuid', 'emergency', now()),
('patient-004-uuid', 'hospital-2-uuid', 'admission', now()),
('patient-005-uuid', 'hospital-2-uuid', 'outpatient', now())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PARTE 6: Habilitar RLS Policies
-- ============================================================================

-- Estas policies ya deben existir en tu base de datos
-- Si no existen, descomenta las siguientes líneas:

/*
-- RLS Policy para electronic_health_record (filtro por hospital_id del usuario)
ALTER TABLE electronic_health_record ENABLE ROW LEVEL SECURITY;

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

-- RLS Policy para users (cada usuario solo puede ver su propia información)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own profile"
ON users
FOR SELECT
USING (id = auth.uid());

-- RLS Policy para patients (filtro por hospital_id del usuario)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see patients from their hospital"
ON patients
FOR SELECT
USING (
  hospital_id = (
    SELECT hospital_id FROM public.users 
    WHERE id = auth.uid() 
    AND active = true
  )
);
*/

-- ============================================================================
-- PARTE 7: Verificación - Ejecuta estas queries para validar
-- ============================================================================

-- Ver todos los hospitales creados
-- SELECT id, nombre, ciudad FROM public.hospitals;

-- Ver todos los usuarios de prueba
-- SELECT id, email, nombre_completo, hospital_id, rol, active FROM public.users ORDER BY rol;

-- Ver pacientes asignados
-- SELECT p.id, p.nombre_completo, p.cedula, h.nombre as hospital 
-- FROM public.patients p
-- JOIN public.hospitals h ON p.hospital_id = h.id;

-- ============================================================================
-- INSTRUCCIONES PARA ACCEDER CON CADA USUARIO
-- ============================================================================

/*
1. SUPER_ADMINISTRADOR (Admin Principal)
   Email: admin@hosix.com
   Hospital: Hospital Central Quito
   Acceso: Todas las funciones, todos los hospitales
   
2. DIRECTOR_HOSPITAL (Director Hospital Central)
   Email: director.hospital1@hosix.com
   Hospital: Hospital Central Quito
   Acceso: Administración del hospital, módulos clínicos
   
3. DIRECTOR_HOSPITAL (Director Hospital Metropolitano)
   Email: director.hospital2@hosix.com
   Hospital: Hospital Metropolitano
   Acceso: Administración del hospital, módulos clínicos
   
4. PROFESIONAL (Médico Obstétrica)
   Email: obstetrica@hosix.com
   Hospital: Hospital Central Quito
   Acceso: Módulos de Obstétrica, pacientes asignados
   
5. PROFESIONAL (Médico Pediatría)
   Email: pediatra@hosix.com
   Hospital: Hospital Central Quito
   Acceso: Módulos de Pediatría, pacientes asignados
   
6. GESTOR_ADMINISTRATIVO (Admin Hospital 1)
   Email: admin.hosp1@hosix.com
   Hospital: Hospital Central Quito
   Acceso: Gestión administrativa del hospital
   
7. PROFESIONAL (Médico Hospital Metropolitano)
   Email: medico.hosp2@hosix.com
   Hospital: Hospital Metropolitano
   Acceso: Módulos clínicos, pacientes de Hospital Metropolitano

PRÓXIMOS PASOS:
1. Crea estos usuarios en Supabase Auth (Dashboard → Auth → Users → Create User)
2. Ejecuta este script SQL (SQL Editor → New Query)
3. Realiza login en http://localhost:8082/hosix/login
4. Verifica que el dashboard muestra datos del hospital asignado
5. Intenta acceder a módulos según tu rol
*/

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
