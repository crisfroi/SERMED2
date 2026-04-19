# 🚀 PLAN DE ACCIÓN: MÓDULO 00-CORE EXPANSION

**Documento**: Guía de Implementación Semana 1-3   
**Fecha de Inicio**: Lunes 21 de Abril de 2026   
**Módulo**: 00-Core (Sistema de Autenticación, Pacientes y Hospitales)   
**Status**: 🟢 LISTO PARA INICIAR   

---

## 📋 OBJETIVO

Completar el módulo Core de 60% → 100%, estableciendo bases sólidas para todos los módulos posteriores.

**Entregables:**
1. ✅ Sistema de Autenticación Robusto + Seguridad
2. ✅ Gestión de Pacientes Completa (con PII encryption)
3. ✅ Gestión de Hospitales (multi-hospital)
4. ✅ Sistema de Permisos Granulares
5. ✅ Consentimientos y Auditoría
6. ✅ Documentación Completa

---

## 📊 TRABAJO PENDIENTE - DESGLOSE DETALLADO

### 1. SEGURIDAD & ENCRIPTACIÓN (5 días)

#### 1.1 PII Encryption (Personally Identifiable Information)
**Archivos Afectados:**
- `src/services/supabaseClient.ts` - Client setup
- `src/contexts/AuthContext.tsx` - Auth context
- New: `src/utils/encryption.ts` - Utility para encriptación

**Campos a Encriptar:**
```sql
Tabla: patients
- first_name
- last_name
- email
- phone
- date_of_birth
- identification_number (DNI/Pasaporte)
- address
```

**Implementación:**
```typescript
// src/utils/encryption.ts
import crypto from 'crypto';

interface EncryptionKey {
  publicKey: string;
  privateKey: string;
}

export const encryptPII = (data: string, key: EncryptionKey): string => {
  // Usar AES-256-GCM
  // Retornar: base64(iv + encryptedData + authTag)
};

export const decryptPII = (encrypted: string, key: EncryptionKey): string => {
  // Desencriptar con AES-256-GCM
};

// Key rotation strategy
export const rotateEncryptionKey = async () => {
  // Implementar rotación segura de claves
};
```

**Tareas:**
- [ ] Implementar función `encryptPII()`
- [ ] Implementar función `decryptPII()`
- [ ] Crear servicio de gestión de claves
- [ ] Implementar key rotation
- [ ] Tests de encriptación
- [ ] Performance testing (impacto en queries)

**Responsable**: Backend Lead  
**Estimación**: 2.5 días

#### 1.2 Authentication Hardening
**Mejorar:**
- [ ] Implementar 2FA (Two-Factor Authentication)
  - SMS o Authenticator app
  - Backup codes
  - Recovery email
  
- [ ] Password Policy
  - Complejidad mínima
  - Expiración (90 días)
  - Histórico de contraseñas
  - Prevención de reset fácil
  
- [ ] Session Management
  - Timeout de sesión
  - Device recognition
  - Logout remoto
  - Session revocation
  
- [ ] Monitoring
  - Failed login attempts
  - Unusual access patterns
  - Alerts de seguridad

**Tareas:**
- [ ] Integrar Supabase MFA
- [ ] Implementar password policy en BD
- [ ] Crear servicio de session management
- [ ] Setup de monitoring

**Responsable**: Backend Lead  
**Estimación**: 2.5 días

---

### 2. SISTEMA DE PERMISOS AVANZADOS (4 días)

#### 2.1 Roles Granulares
**Roles Definidos:**
```
SuperAdmin          → Acceso total al sistema
Hospital Director   → Gestor del hospital
Department Head     → Jefe de departamento
Physician/Doctor    → Médico
Nurse              → Enfermero
Receptionist       → Recepción
Pharmacist         → Farmacéutico
Lab Technician     → Técnico de lab
Radiologist        → Radiólogo
Administrator      → Admin general
```

**Tareas:**
- [ ] Crear tabla `roles` en Supabase
- [ ] Crear tabla `permissions` (CRUD por tabla)
- [ ] Crear tabla `role_permissions` (mapping)
- [ ] Crear tabla `user_roles` (asignación de roles)

#### 2.2 RLS Policies Completas

**Archivo**: New `supabase/policies/core-policies.sql`

```sql
-- Policy: Users can only see their own hospital data
CREATE POLICY "Users access own hospital data"
  ON patients
  USING (
    auth.uid() = user_id OR 
    hospital_id IN (
      SELECT hospital_id FROM healthcare_personnel 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Physicians can see patients of their departments
CREATE POLICY "Physicians see department patients"
  ON patients
  USING (
    department_id IN (
      SELECT department_id FROM healthcare_personnel 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Can only edit own records
CREATE POLICY "Only own record edit"
  ON patients
  WITH CHECK (
    auth.uid() = last_updated_by OR 
    is_admin() = true
  );
```

**Tareas:**
- [ ] Crear 20+ RLS policies (ver documento de policies)
- [ ] Verificar cobertura de tablas
- [ ] Tests de policies
- [ ] Performance testing

**Responsable**: Backend Lead + DBA  
**Estimación**: 3 días

---

### 3. GESTIÓN DE PACIENTES COMPLETA (5 días)

#### 3.1 Base de Datos Expandida
**Tabla: patients (expandida)**
```sql
-- Datos básicos (encrypted)
- id (UUID)
- first_name (encrypted)
- last_name (encrypted)
- email (encrypted)
- phone (encrypted)
- date_of_birth (encrypted)
- gender
- blood_type
- identification_number (encrypted)
- identification_type (DNI/Pasaporte/otro)

-- Ubicación
- address (encrypted)
- city
- province
- zip_code
- country

-- Datos médicos
- height_cm
- weight_kg
- bmi
- allergies (JSONB)
- chronic_conditions (JSONB)
- emergency_contacts (JSONB - encrypted)

-- Administrativo
- hospital_id (UUID)
- marital_status
- occupation
- insurance_provider
- insurance_number
- insurance_expiry

-- Control
- created_at
- updated_at
- created_by (user_id)
- updated_by (user_id)
- is_active (soft delete)
```

**Tabla NEW: patient_demographics**
```sql
- id (UUID)
- patient_id (FK)
- ethnicity
- religion
- education_level
- household_size
- socioeconomic_status
- created_at
```

**Tabla NEW: emergency_contacts**
```sql
- id (UUID)
- patient_id (FK)
- name (encrypted)
- relationship
- phone (encrypted)
- email (encrypted)
- address (encrypted)
- is_primary
```

**Tareas:**
- [ ] Crear migrations para nuevas tablas
- [ ] Crear índices (búsqueda por: identificación, email, teléfono)
- [ ] Implementar soft deletes (is_active)
- [ ] Crear triggers de auditoría

**Responsable**: DBA + Backend Lead  
**Estimación**: 2.5 días

#### 3.2 Búsqueda Avanzada de Pacientes
**Archivo**: New `src/hooks/useAdvancedPatientSearch.ts`

```typescript
// Búsqueda por:
- Identificación (DNI, Pasaporte)
- Nombre + Apellido
- Email
- Teléfono
- Fecha de Nacimiento
- Hospital
- Departamento

// Filtros:
- Estado (Activo/Inactivo)
- Rango de edad
- Tipo de sangre
- Alergias
- Condiciones crónicas

// Features:
- Full-text search en Supabase
- Fuzzy matching para nombres
- Búsqueda con typos tolerantes
- Resultados paginados
- Sort por relevancia
```

**Tareas:**
- [ ] Implementar `useAdvancedPatientSearch()` hook
- [ ] Crear función Supabase de búsqueda
- [ ] Implementar UI de búsqueda
- [ ] Tests de búsqueda

**Responsable**: Frontend + Backend  
**Estimación**: 2 días

#### 3.3 Perfil de Paciente Completo
**Componente**: Expandir `PatientProfileView.tsx`

**Secciones:**
1. **Datos Demográficos** (editable)
2. **Contactos de Emergencia** (CRUD)
3. **Alergias** (CRUD con severidad)
4. **Condiciones Crónicas** (CRUD)
5. **Medicamentos Actuales** (linked)
6. **Historias Clínicas** (lista de visitas)
7. **Documentos** (historias, firmas, consentimientos)
8. **Auditoría** (quién modificó qué y cuándo)

**Tareas:**
- [ ] Expandir componente PatientProfileView
- [ ] Crear subcomponentes para cada sección
- [ ] Implementar edición en línea
- [ ] Agregar confirmaciones
- [ ] Tests E2E

**Responsable**: Frontend Lead  
**Estimación**: 3 días

---

### 4. CONSENTIMIENTOS & PRIVACIDAD (3 días)

#### 4.1 Sistema de Consentimientos
**Tabla NEW: patient_consents**
```sql
- id (UUID)
- patient_id (FK)
- consent_type (tratamiento, privacidad, investigación, fotografía)
- description
- consent_date
- expiry_date
- signature_base64
- signed_by_user_id
- witnessed_by_user_id
- is_active
- created_at
```

**Tipos de Consentimiento:**
1. Consentimiento de Tratamiento
2. Consentimiento de Privacidad de Datos
3. Consentimiento de Participación en Investigación
4. Consentimiento para Fotografía/Video
5. Autorización para Contacto de Emergencia

**Tareas:**
- [ ] Crear tabla patient_consents
- [ ] Crear formularios de consentimiento
- [ ] Implementar captura de firma
- [ ] Crear UI de gestión
- [ ] Tests

**Responsable**: Backend + Frontend  
**Estimación**: 2 días

#### 4.2 Auditoría de Acceso a Datos
**Tabla NEW: audit_logs**
```sql
- id (UUID)
- user_id (FK)
- table_name
- record_id
- action (SELECT, INSERT, UPDATE, DELETE)
- old_values (JSONB, NULL para SELECT)
- new_values (JSONB, NULL para DELETE)
- accessed_at
- ip_address
- user_agent
```

**Tareas:**
- [ ] Crear tabla audit_logs
- [ ] Implementar triggers de auditoría
- [ ] Crear función de query a logs
- [ ] Dashboard de auditoría
- [ ] Alerts de acceso anormal

**Responsable**: Backend + DevOps  
**Estimación**: 1.5 días

---

### 5. GESTIÓN DE HOSPITALES (2 días)

#### 5.1 Expandir Hospital Management
**Tabla: hospitals (expandida)**
```sql
- id (UUID)
- name
- code (código único)
- address (encrypted)
- phone (encrypted)
- email (encrypted)
- director_user_id (FK)
- established_date
- bed_count
- department_count
- is_teaching_hospital
- coordinates (lat, lng)
- timezone
- website
- logo_url
- is_active
```

**Tabla NEW: hospital_departments**
```sql
- id (UUID)
- hospital_id (FK)
- name
- head_user_id (FK)
- phone
- budget
- bed_count
- is_active
```

**Tabla NEW: hospital_services**
```sql
- id (UUID)
- hospital_id (FK)
- name (Emergencia, Lab, DICOM, etc.)
- is_available
- available_hours_start
- available_hours_end
- contact_info
```

**Tareas:**
- [ ] Expandir tabla hospitals
- [ ] Crear tablas de departments y services
- [ ] Crear CRUD para administrador
- [ ] Tests

**Responsable**: Backend + DBA  
**Estimación**: 1.5 días

---

### 6. DOCUMENTACIÓN & SETUP (4 días)

#### 6.1 Documentación de Módulo
**Archivos a Crear:**
- `packages/hosix/docs/MODULO_00_CORE_COMPLETE.md`
  - Visión general
  - Tablas y esquema
  - Funciones edge críticas
  - RLS policies
  - Integración con otros módulos
  
- `packages/hosix/src/modules/00-core/README.md`
  - Arquitectura
  - Componentes principales
  - Hooks principales
  - Ejemplos de uso
  - Troubleshooting

**Tareas:**
- [ ] Crear MODULO_00_CORE_COMPLETE.md (documentación profunda)
- [ ] Crear README en módulo
- [ ] Documentar todas las funciones
- [ ] Crear diagrama de flujos
- [ ] Ejemplos de código

**Responsable**: Tech Lead + Developer  
**Estimación**: 2 días

#### 6.2 Setup de Testing
**Archivos:**
- `packages/hosix/src/modules/00-core/__tests__/`
  - authentication.test.ts
  - patient-management.test.ts
  - permissions.test.ts
  - encryption.test.ts

**Cobertura Esperada: >80%**

**Tareas:**
- [ ] Crear suite de tests unitarios
- [ ] Crear tests de integración
- [ ] Crear tests de seguridad (RLS)
- [ ] Setup de coverage reporting

**Responsable**: QA + Backend  
**Estimación**: 2 días

---

## ⏰ TIMELINE SEMANA A SEMANA

### SEMANA 1: Lunes 21 - Viernes 25 de Abril

```
LUN 21:  Kickoff + Análisis GNU Tryton + Setup inicial
         - Reunión de equipo
         - Revisión de architectura
         - Setup de environment
         
MAR 22:  Seguridad & Encriptación (Día 1)
WED 23:  Seguridad & Encriptación (Día 2)
         - PII encryption implementado
         - 2FA setup
         
JUE 24:  RLS Policies & Permisos (Día 1)
VIE 25:  RLS Policies & Permisos (Día 2)
         - 20+ policies completadas
         - Testing de policies
```

### SEMANA 2: Lunes 28 - Viernes 2 de Mayo

```
LUN 28:  Gestión de Pacientes (Día 1)
         - Schema de BD expandido
         - Migrations
         
MAR 29:  Gestión de Pacientes (Día 2)
         - Búsqueda avanzada
         
MIE 30:  Gestión de Pacientes (Día 3)
         - UI de perfil completo
         
JUE 01:  Consentimientos + Auditoría (Día 1)
VIE 02:  Consentimientos + Auditoría (Día 2)
```

### SEMANA 3: Lunes 5 - Viernes 9 de Mayo

```
LUN 05:  Hospitales + Setup de Testing
MAR 06:  Testing & Documentation
MIE 07:  Testing & Documentation (Día 2)
JUE 08:  QA & Bug fixes
VIE 09:  Final Review + Handoff
```

---

## 👥 EQUIPO REQUERIDO

### Tamaño del Equipo: 3-4 personas

**Backend Lead** (Full-time)
- PII encryption
- Supabase schema design
- RLS policies
- Edge functions
- Tests

**Frontend Lead** (Full-time)
- UI de gestión de pacientes
- Búsqueda avanzada
- Formularios
- Perfil de paciente
- Tests E2E

**QA Engineer** (0.5 FTE)
- Tests unitarios
- Tests de integración
- Security testing
- Performance testing

**DevOps / DBA** (0.5 FTE)
- Migrations
- Índices
- Monitoring
- Backup strategy

---

## 🎯 CRITERIOS DE ÉXITO

### Definición de "DONE"

- [ ] Todos los archivos compilados sin errores
- [ ] Tests: >80% code coverage
- [ ] RLS policies: 100% de tablas cubiertas
- [ ] Performance: Query <100ms (p95)
- [ ] Security: Pen test pasado (internamente)
- [ ] Documentación: Completa y actualizada
- [ ] Handoff: Team completamente onboarded

### Métrica de Calidad

```
✅ NO hacer: Copy-paste de código viejo
✅ SÍ hacer: Refactor limpio y robusto

✅ NO hacer: Documentación superficial
✅ SÍ hacer: Documentación exhaustiva con ejemplos

✅ NO hacer: Bugs encontrados en producción
✅ SÍ hacer: 95%+ bugs encontrados en testing
```

---

## 🚨 RIESGOS Y MITIGACIÓN

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|--------|-----------|
| Performance de búsqueda lenta | Media | Alto | Índices + Full-text search + Testing temprano |
| Problemas de PII encryption | Media | Crítico | Peer review + Encrypted tests + Crypto expert |
| RLS policies incompletas | Media | Crítico | Peer review + Automated tests |
| Key rotation failures | Baja | Alto | Rehearsal antes de prod |
| Team ramp-up lento | Media | Medio | Documentación buena + Pair programming |

---

## 📞 DECISIONES ESCALADAS

**Que necesita aprobación antes de continuar:**

1. [ ] ¿PII encryption con claves Supabase o externas?
2. [ ] ¿2FA obligatoria o optional?
3. [ ] ¿Session timeout: 1 hora o 4 horas?
4. [ ] ¿Consentimientos por paciente o por hospital?
5. [ ] ¿Histórico de auditoría: 1 año o 7 años?

---

## 📊 DEFINICIÓN DE LISTO PARA FASE 2

Para poder comenzar **Módulo 06 (Medications)**, CORE debe cumplir:

- ✅ Schema completo en Supabase
- ✅ RLS policies 100% cubiertas  
- ✅ Encriptación de PII en operación
- ✅ Búsqueda de pacientes funcionando
- ✅ Consentimientos implementados
- ✅ Tests >80% coverage
- ✅ Documentación completa

---

**Preparado por**: Arquitecto HOSIX   
**Aprobación**: Leadership (Pendiente)   
**Fecha de Inicio**: 21 de Abril de 2026   
**Duración Estimada**: 3 semanas

