# 🚀 GUÍA DE IMPLEMENTACIÓN RÁPIDA - SEMANA 1 (CORE)

**Fecha**: 19 de Abril de 2026   
**Status**: ✅ CÓDIGO LISTO PARA APLICAR   
**Próximo Paso**: Ejecutar en Supabase   

---

## 📋 ARCHIVOS CREADOS (SEMANA 1)

### 1. **Encriptación PII** ✅
```
src/utils/encryption.ts (500+ líneas)
├─ encryptPII() - Encriptar datos sensibles
├─ decryptPII() - Desencriptar datos
├─ generateEncryptionKey() - Generar clave aleatoria
├─ generateKeyFromPassword() - Derivar clave de contraseña
├─ rotateEncryptionKey() - Rotación de claves
├─ hashPII() - Hash para búsqueda sin desencriptar
└─ maskSensitiveData() - Enmascarar datos para logs
```

### 2. **RLS Policies (20+ políticas)** ✅
```
supabase/policies/core_rls_policies.sql (400+ líneas)
├─ Patients: 5 políticas (SELECT, INSERT, UPDATE, DELETE)
├─ Healthcare Personnel: 3 políticas
├─ Hospitals: 2 políticas
├─ Audit Logs: 3 políticas
├─ Support tables: 6+ políticas
├─ Helper functions para roles
└─ Audit trigger para historial
```

### 3. **Migraciones de BD** ✅
```
supabase/migrations/001_core_expansion.sql (400+ líneas)
├─ Tabla: hospitals (expandida)
├─ Tabla: healthcare_personnel (nueva)
├─ Tabla: patients (expandida con 15+ campos)
├─ Tabla: patient_demographics (nueva)
├─ Tabla: emergency_contacts (nueva)
├─ Tabla: patient_consents (nueva)
├─ Tabla: audit_logs (nueva)
├─ Tabla: hospital_departments (nueva)
├─ Tabla: hospital_services (nueva)
├─ Tabla: user_roles (nueva)
├─ Tabla: permissions (nueva)
├─ 20+ índices para performance
└─ 2 vistas para queries comunes
```

### 4. **Supabase Client Mejorado** ✅
```
src/services/supabaseClientEnhanced.ts (400+ líneas)
├─ Cliente Supabase configurado
├─ getPatients() - Con desencriptación automática
├─ getPatientById() - Con desencriptación automática
├─ searchPatientByIdentification() - Búsqueda segura
├─ createPatient() - Con encriptación automática
├─ updatePatient() - Con encriptación automática
├─ getAppointments()
├─ logAuditEvent() - Auditoría completa
├─ getHospitals()
├─ getHealthcarePersonnel()
└─ subscribeToPatients() - Real-time updates
```

### 5. **Hook de Autenticación con 2FA** ✅
```
src/hooks/useAuth2FA.ts (500+ líneas)
├─ login() - Email/Password
├─ verifyTwoFACode() - Verificar 2FA
├─ logout() - Logout con cleanup
├─ hasPermission() - Check de permisos
├─ updatePassword() - Cambiar contraseña
├─ requestPasswordReset() - Reset de contraseña
├─ Session management con timeout (4 horas)
├─ Inactivity timer (30 minutos)
├─ Role-based access control (RBAC)
├─ Automatic encryption key generation
└─ Real-time permission loading
```

---

## 🔧 PASOS DE IMPLEMENTACIÓN

### PASO 1: APLICAR MIGRACIONES EN SUPABASE (10 minutos)

1. **Abrir Supabase Dashboard**:
   - URL: https://app.supabase.com/projects
   - Seleccionar proyecto: HOSIX

2. **Navegar a SQL Editor**:
   - Click en "SQL Editor"
   - Click en "+ New Query"

3. **Copiar y ejecutar migraciones**:
   - Contenido: `supabase/migrations/001_core_expansion.sql`
   - Click "RUN" (parte por parte si es necesario)
   - Esperar a que todas las tablas se creen exitosamente

4. **Verificar tablas creadas**:
   - Ir a "Table Editor"
   - Confirmar que existen: patients, hospitals, healthcare_personnel, audit_logs, etc.

### PASO 2: APLICAR RLS POLICIES (10 minutos)

1. **En SQL Editor, crear nueva query**:
   - Click "+ New Query"

2. **Copiar y ejecutar RLS policies**:
   - Contenido: `supabase/policies/core_rls_policies.sql`
   - Click "RUN"

3. **Verificar políticas creadas**:
   - Ir a "Authentication" → "Policies"
   - Confirmar que existen 20+ policies

4. **Habilitar RLS en tablas**:
   - Ir a "Table Editor"
   - Para cada tabla principal: Click ⚙️ → "Enable RLS"

### PASO 3: CREAR ENCRYPTION KEY (5 minutos)

1. **Generar clave de encriptación**:
   ```bash
   node -e "
   const crypto = require('crypto');
   const key = crypto.randomBytes(32).toString('hex');
   console.log('Encryption Key:', key);
   "
   ```

2. **Guardar la clave de forma segura**:
   - NO en `.env` o archivos públicos
   - Usar: Azure Key Vault, AWS Secrets Manager, o similar
   - Por ahora (dev): Guardar en localStorage después de login

### PASO 4: VERIFICAR CONEXIÓN EN REACT (5 minutos)

1. **Abrir terminal**:
   ```bash
   cd /path/to/SERMED2
   npm run dev
   ```

2. **Verificar que no haya errores de importación**:
   - Los archivos nuevos deben compilar sin errores
   - Si hay errores, verificar rutas de importación

3. **Prueba rápida en consola del navegador**:
   ```javascript
   // Verificar que Supabase está disponible
   import { supabase } from '@/services/supabaseClient'
   supabase.auth.getSession().then(console.log)
   ```

---

## ✅ CHECKLIST - FIN DE SEMANA 1

```
MIGRACIONES BD
  [ ] Todas las tablas creadas
  [ ] Índices creados (20+)
  [ ] Vistas creadas (2)
  
RLS POLICIES
  [ ] Policies habilitadas en todas las tablas
  [ ] Helper functions creadas (is_super_admin, etc.)
  [ ] Audit trigger funcionando
  
ENCRIPTACIÓN
  [ ] Archivo encryption.ts sin errores
  [ ] Funciones encriptación/desencriptación testeadas
  [ ] Clave de encriptación generada y almacenada
  
SUPABASE CLIENT
  [ ] supabaseClientEnhanced.ts sin errores
  [ ] Queries de pacientes funcionan
  [ ] Desencriptación automática funciona
  
AUTENTICACIÓN
  [ ] useAuth2FA.ts sin errores
  [ ] Login funciona
  [ ] Session management funciona
  [ ] Inactivity timeout funciona
  
CÓDIGO COMPILA
  [ ] npm run dev sin errores
  [ ] Ninguna alerta de tipos (TS)
  [ ] Imports resueltos correctamente
```

---

## 🚨 POSIBLES ERRORES Y SOLUCIONES

### Error: "Table already exists"
**Solución**: 
- Usar `IF NOT EXISTS` en SQL (ya está en migraciones)
- O borrar tabla existente primero y recrear

### Error: "RLS policy creation failed"
**Solución**:
- Verificar que la tabla existe antes de crear política
- Usar nombres de políticas únicos
- Verificar sintaxis SQL (typos, comillas, etc.)

### Error: "Permission denied" en queries
**Solución**:
- Verificar RLS policies están habilitadas
- Verificar que el usuario tiene rol en healthcare_personnel
- Verificar que hospital_id coincide

### Error: "Encryption key not found"
**Solución**:
- Generar y guardar clave de encriptación después de login
- Almacenar en localStorage durante sesión
- Limpiar al logout

### Error de TypeScript en imports
**Solución**:
- Verificar rutas: `@/` = `src/`, `@hosix/` = `packages/hosix/src/`
- Confirmar que archivos .ts no tienen .ts en import
- Ejecutar `npm run dev` para que Vite reconstruya

---

## 📊 ESTADO DESPUÉS DE SEMANA 1

```
ANTES:
├─ Core: 60% completo
├─ BD: Tablas básicas existentes
├─ Seguridad: Mínima
├─ RLS: Parcial
└─ Auditoría: No existe

DESPUÉS (Esperado):
├─ Core: 70-75% completo ✅
├─ BD: Tablas expandidas + nuevas ✅
├─ Seguridad: Encriptación PII implementada ✅
├─ RLS: 20+ policies completas ✅
├─ Auditoría: Full audit trail ✅
├─ 2FA: Framework listo ✅
├─ Session: Management completo ✅
└─ Código: Compilando sin errores ✅
```

---

## 📈 PRÓXIMAS TAREAS (SEMANA 2)

### Gestión de Pacientes (Completitud)
1. [ ] Componente de búsqueda avanzada
2. [ ] Perfil de paciente expandido
3. [ ] CRUD completo con validaciones
4. [ ] Forms con validación

### Testing & QA
1. [ ] Tests unitarios de encriptación (>80% coverage)
2. [ ] Tests de RLS policies
3. [ ] Tests de seguridad
4. [ ] Tests E2E de login

### Documentación
1. [ ] API Documentation
2. [ ] Security Guidelines
3. [ ] Encryption Best Practices
4. [ ] Troubleshooting Guide

---

## 🎯 MÉTRICAS DE ÉXITO (FIN SEMANA 1)

```
MÉTRICA                         EXPECTED    ACTUAL
─────────────────────────────────────────────────
Tablas creadas                  11/11       ___
Índices creados                 20+         ___
RLS Policies                    20+         ___
Archivos TS sin errores         5/5         ___
npm run dev                     ✅ pass     ___
Encriptación testeada           ✅          ___
RLS testeada                    ✅          ___
Documentación completada        100%        ___
```

---

## 🔐 SEGURIDAD - CHECKLIST

Después de aplicar todas las migraciones y policies:

- [ ] RLS habilitado en todas las tablas críticas
- [ ] Encryption key generada y segura
- [ ] Audit logging funcionando
- [ ] Session timeout configurado
- [ ] Inactivity timer funcionando
- [ ] Password policy en place
- [ ] 2FA framework listo

---

## 📞 SOPORTE

Si encuentras problemas:

1. **Error en SQL**: Revisar sintaxis, probar línea por línea
2. **Error de RLS**: Verificar que tabla existe, que usuario tiene rol
3. **Error de compilación**: Verificar imports, rutas, sintaxis TS
4. **Problema de encriptación**: Verificar que clave está en localStorage

Documentación útil:
- Supabase Docs: https://supabase.com/docs
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- PostgreSQL: https://www.postgresql.org/docs/

---

**Estado**: ✅ LISTO PARA IMPLEMENTACIÓN   
**Tiempo Estimado**: 30-45 minutos para aplicar todo   
**Siguiente Review**: Viernes 25 Abril (Fin de Semana 1)

