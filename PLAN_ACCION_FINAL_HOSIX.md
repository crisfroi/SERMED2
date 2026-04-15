# ✅ PLAN DE ACCIÓN FINAL - HOSIX (SIN CUADRANTES BIOMÉTRICOS)

**Fecha:** 15 de Abril, 2026  
**Status:** LISTO PARA IMPLEMENTACIÓN  
**Scope:** HOSIX Pure (cuadrantes = RENAPROSA)  

---

## 🎯 OBJETIVO FINAL

Implementar **ASIS_13 Electronic Health Record** funcionalmente en HOSIX con:
- ✅ 3 tablas SQL ASIS_13
- ✅ Componentes React (ya existen)
- ✅ Migraciones Supabase
- ✅ FDW para datos maestros desde RENAPROSA

**Timeline:** 3 semanas  
**Esfuerzo:** 46-68 horas-persona

---

## 📋 DETALLES DE TRABAJO

### SEMANA 1: MIGRACIONES + FIX BUILD

#### HOY - PASO 1: Resolver Build Error
```bash
npm ci --legacy-peer-deps
npm run build  # Debe compilar sin errores
```

**Status:** En progreso (npm ci ejecutándose)

---

#### ESTA SEMANA - PASO 2: Aplicar Migraciones SQL

**Archivo:** `MIGRACIONES_ASIS13_LISTAS.sql`

Tablas a crear en Supabase:
1. **electronic_health_record** - ✅ Historia médica paciente
2. **ehr_episode_links** - ✅ Episodios clínicos
3. **ehr_document_storage** - ✅ Documentos médicos

**Cómo hacer:**
```
1. Copiar SQL de MIGRACIONES_ASIS13_LISTAS.sql
2. Ir a Supabase UI → SQL Editor
3. Pegar TABLE 1 → Ejecutar
4. Pegar TABLE 2 → Ejecutar
5. Pegar TABLE 3 → Ejecutar
6. Pegar HELPER FUNCTIONS → Ejecutar
7. Validar: SELECT COUNT(*) FROM electronic_health_record;
```

**Responsable:** Database Admin / DevOps  
**Duración:** 1-2 horas  
**Bloqueador:** Ninguno

---

#### ESTA SEMANA - PASO 3: Coordinar FDW con DevOps

**Qué necesita DevOps hacer:**
```
[ ] Permitir acceso entre RDS:
    - RENAPROSA RDS → HOSIX RDS
    - IP allowlist configurado
    - VPC/subnets validadas

[ ] Proporcionar credenciales:
    - RENAPROSA connection string
    - Usuario con permisos READ-ONLY
    - Puerto 5432 accesible
```

**Ver:** `INTEGRACION_CROSS_PROJECT_SUPABASE_MASTERPLAN.md` (FASE 1)

**Responsable:** DevOps Lead  
**Duración:** 1-2 días

---

### SEMANA 2-3: FDW + COMPONENT WIRING

#### PASO 4: Configurar Foreign Data Wrapper en HOSIX

**Archivo de referencia:** `INTEGRACION_CROSS_PROJECT_SUPABASE_MASTERPLAN.md` (FASE 2)

**SQL a ejecutar:**
```sql
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

CREATE SERVER renaprosa_server
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (
    host '${RENAPROSA_HOST}',
    port '5432',
    dbname '${RENAPROSA_DB}'
  );

-- Luego crear vistas que usen FDW...
```

**Responsable:** Database Architect  
**Duración:** 1-2 días

---

#### PASO 5: Actualizar React Hooks para Usar FDW

**Archivos a actualizar:**
- `src/components/ASIS_13_EHR/ElectronicHealthRecordDashboard.tsx`
- `src/components/ASIS_13_EHR/EHRTimeline.tsx`
- Hooks en `src/hooks/useEHR.ts` (crear si no existe)

**Cambios:**
```typescript
// ANTES: Leer de profesionales_sanitarios local
// DESPUÉS: Leer de profesionales_sync (FDW view)

const { data: professionals } = useQuery({
  queryKey: ['professionals'],
  queryFn: async () => {
    const { data } = await supabase
      .from('v_professionals_view')  // View que usa FDW
      .select('*');
    return data;
  }
});
```

**Responsable:** React Developer  
**Duración:** 2-3 días

---

#### PASO 6: Testing Exhaustivo en Staging

**Checklist:**
- [ ] ASIS_13 carga sin errores
- [ ] Pacientes muestran data real
- [ ] Episodios clínicos visible
- [ ] Documentos almacenan/descargan
- [ ] RLS funciona (usuarios ven solo su hospital)
- [ ] Performance < 200ms por query

**Responsable:** QA Team  
**Duración:** 1-2 días

---

#### PASO 7: Deploy a Producción

**Pre-deployment:**
- [ ] Backup Supabase completo
- [ ] Equipo alerta 24/7
- [ ] Rollback plan listo

**Deployment:**
1. Deploy migraciones SQL a prod
2. Deploy FDW views a prod
3. Deploy React changes a prod
4. Validar 30 minutos
5. Notificar usuarios

**Responsable:** DevOps  
**Duración:** 4-6 horas

---

## 📊 ESTADO ACTUAL vs FUTURO

### ANTES
```
❌ ASIS_13 no funciona (tablas faltantes)
❌ Datos pacientes no persistentes
❌ Sin sincronización RENAPROSA
❌ Duplicación de datos maestros
```

### DESPUÉS (PLAN)
```
✅ ASIS_13 completamente funcional
✅ Histórico médico persistente
✅ Datos maestros frescos de RENAPROSA (FDW)
✅ Single source of truth
✅ HIPAA-compliant
```

---

## 🎯 KPIs DE ÉXITO

```
✅ npm run build = 0 errors
✅ ASIS_13 dashboard muestra datos reales (10+ patient records)
✅ Episodios clínicos visibles en timeline
✅ Documentos almacenan/descargan correctamente
✅ RLS funciona (usuarios ven solo su hospital)
✅ Query performance < 200ms
✅ Zero data duplication between RENAPROSA ↔ HOSIX
✅ Monitoreo 24/7 post-deploy sin issues
```

---

## 📁 DOCUMENTOS DE REFERENCIA

**Para cada paso:**
1. Build → Terminal output
2. Migraciones → `MIGRACIONES_ASIS13_LISTAS.sql`
3. FDW → `INTEGRACION_CROSS_PROJECT_SUPABASE_MASTERPLAN.md`
4. React Wiring → `REFERENCIA_RAPIDA_ESTRUCTURA_HOSIX.md`
5. Testing → `REFERENCIA_RAPIDA_ESTRUCTURA_HOSIX.md`

---

## 👥 EQUIPO REQUERIDO

| Rol | Horas | Tareas |
|-----|-------|--------|
| DevOps | 10-16 | Migraciones, FDW, networking |
| DB Architect | 16-20 | FDW design, SQL optimization |
| React Dev | 8-12 | Component wiring, hooks |
| QA | 8-12 | Testing, validation |
| Project Mgr | 4-6 | Coordination, status tracking |
| **TOTAL** | **46-68** | **Complete ASIS_13 implementation** |

---

## 🚀 PRÓXIMOS 7 DÍAS

```
TODAY (15 Abril):
  [ ] Terminar npm ci
  [ ] Confirm build compila sin errores
  [ ] Share plan con team

DAY 2-3:
  [ ] Copiar-pegar migraciones SQL
  [ ] Validar tablas creadas en Supabase staging
  [ ] DevOps: Inicia analysis acceso cross-project

DAY 4-5:
  [ ] DevOps: Permitir acceso RDS entre proyectos
  [ ] DB Architect: Configurar FDW en HOSIX
  [ ] React Dev: Inicia wiring componentes

DAY 6-7:
  [ ] Testing en staging
  [ ] Validar performance FDW
  [ ] Preparar deployment a producción
```

---

## ⚠️ RIESGOS MITIGADOS

| Riesgo | Mitigación |
|--------|-----------|
| FDW latencia | Índices + caché optional |
| Firewall bloquea | Pre-validate network |
| RLS falla | Test staging antes prod |
| Data inconsistencia | Validation queries |
| Build sigue errando | npm ci--legacy-peer-deps |

---

## ✅ CONFIRMACIONES

```
[ ] Entendido: cuadrantes_maestros NO incluido (RENAPROSA own)
[ ] Entendido: Solo 3 tablas SQL para ASIS_13
[ ] Entendido: FDW para datos maestros desde RENAPROSA
[ ] Leído: MIGRACIONES_ASIS13_LISTAS.sql
[ ] Leído: INTEGRACION_CROSS_PROJECT_SUPABASE_MASTERPLAN.md
[ ] Equipo asignado: DevOps, DB Architect, React Dev, QA
[ ] Timeline confirmado: 3 semanas
[ ] Backup strategy: ✅
[ ] Rollback plan: ✅
```

---

**Status:** ✅ LISTO PARA COMENZAR  
**Gernerado:** 15 Abril 2026  
**Requiere Approval:** CTO + DevOps Lead
