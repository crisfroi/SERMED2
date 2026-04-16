# 📊 ANÁLISIS: MÓDULOS TRYTON (GNU Health 53) vs HOSIX (19)

**Fecha:** 15 Abril 2026  
**Estado:** ANÁLISIS COMPARATIVO COMPLETO  
**Objetivo:** Identificar módulos faltantes para arquitectura SaaS multicentro

---

## 🎯 RESUMEN EJECUTIVO

| Métrica | Cantidad | Status |
|---------|----------|--------|
| **Módulos TRYTON** | 53 | Base GNU Health 5.0.3 |
| **Módulos HOSIX Existentes** | 19 | Funcionando |
| **Cobertura %** | 36% | Parcial |
| **Módulos Totalmente Faltantes** | 34 | ❌ CRÍTICO |
| **Módulos Parciales** | 4-5 | ⚠️ Incompletos |

---

## ✅ MÓDULOS HOSIX ASIGNADOS A TRYTON

### Mapeo Directo (1:1)

| HOSIX Módulo | TRYTON Equivalente | Cobertura | Status |
|---------------|--------------------|-----------|--------|
| ASIS_04_Obstetricia | health_gyneco | 100% | ✅ |
| ASIS_08_Laboratorio | health_lab | 100% | ✅ |
| ASIS_15_Imagenes | health_imaging | 100% | ✅ |
| ASIS_7_Cirugia | health_surgery | 100% | ✅ |
| ASIS_14_Diagnostico | health_icd10 | 80% | ⚠️ Partial |

---

## ❌ MÓDULOS TRYTON COMPLETAMENTE FALTANTES (34)

### 🏥 CLÍNICOS CRÍTICOS (8)
- [ ] **health_inpatient** - Hospitalización
- [ ] **health_icu** - Cuidados críticos
- [ ] **health_nursing** - Enfermería ambulatoria
- [ ] **health_pediatrics** (BASE)
- [ ] **health_pediatrics_growth_charts**
- [ ] **health_pediatrics_growth_charts_who**
- [ ] **health_dentistry** - Odontología
- [ ] **health_ophthalmology** - Oftalmología

### 📦 STOCK Y SERVICIOS (8)
- [ ] **health_stock_inpatient**
- [ ] **health_stock_nursing**
- [ ] **health_stock_surgery**
- [ ] **health_services**
- [ ] **health_services_lab**
- [ ] **health_services_imaging**
- [ ] **health_insurance**
- [ ] **health_reporting**

### 👥 DEMOGRAFÍA (5)
- [ ] **health_socioeconomics**
- [ ] **health_disability**
- [ ] **health_contact_tracing**
- [ ] **health_history**
- [ ] health_lifestyle (expansión)

### 🧬 GENÉTICA (2)
- [ ] **health_genetics**
- [ ] **health_genetics_uniprot**

### 🔐 SEGURIDAD (7)
- [ ] **health_crypto** - CRÍTICO para multicentro
- [ ] **health_crypto_lab**
- [ ] **health_qrcodes**
- [ ] **health_archives** - CRÍTICO para auditoría
- [ ] **health_federation** - CRÍTICO para SaaS
- [ ] **health_calendar** / **health_caldav**
- [ ] **health_webdav3_server**

### 🏷️ CODIFICACIÓN (4)
- [ ] **health_icd11**, health_icd9procs, health_icd10pcs, health_icpm

### 🦟 ENFERMEDADES TROPICALES (3)
- [ ] health_ntd, health_ntd_dengue, health_ntd_chagas

### 📺 IMAGENOLOGÍA (2)
- [ ] health_imaging_worklist, health_orthanc

---

## 🏛️ ARQUITECTURA HOSIX SaaS RECOMENDADA

### PILLAR 1: Core Clinical
✅ health, health_lab, health_imaging, health_surgery, health_gyneco
⚠️ health_pediatrics (50%)

### PILLAR 2: Hospitalization (❌ MISSING)
❌ health_inpatient, health_icu, health_nursing (CRÍTICOS)

### PILLAR 3: Billing & Services (PARCIAL)
⚠️ health_services, health_insurance

### PILLAR 4: Security & Audit (❌ MISSING)
❌ health_crypto, health_archives, **health_federation** (CRÍTICO para sync multicentro)

---

## 🚀 PLAN RECOMENDADO

### FASE 1: CRÍTICOS INMEDIATOS (Semana 1-2)
1. **health_inpatient** - Hospitalización
2. **health_federation** - Sync multicentro
3. **health_crypto** - Seguridad
4. **health_archives** - Auditoría

### FASE 2: ADMINISTRATIVOS (Semana 3-4)
5. **health_services** - Facturación completa
6. **health_insurance** - Seguros
7. **health_stock** expansión (inpatient, nursing, surgery)

### FASE 3: COMPLEMENTARIOS (Semana 5+)
8. health_reporting, health_genetics, health_ntd, health_ems

---

## 📋 CHECKLIST: SaaS MULTICENTRO + MULTINIVEL + AUDITORÍA

### ✅ SaaS MULTICENTRO
- [x] hospital_id en todas tablas
- [x] useHospital hook
- [ ] health_federation (sync)
- [ ] RLS multicentro

### ✅ AUTORIZACIÓN MULTINIVEL
- [x] useAuth() + roles
- [ ] Administrador, Médico, Enfermera, Recepcionista, Farmacéutico, Auditor

### 📝 AUDITORÍA COMPLETA
- [x] audit_logs tabla
- [ ] **health_archives** (registro inmutable)
- [ ] Triggers de auditoría
- [ ] Exportable por período

---

## ⏸️ **TU DECISIÓN: ¿CÓMO PROCEDER?**

**A)** Implementar TODOS 34 módulos (6-9 meses)  
**B)** MVP CRÍTICOS SOLO - Fase 1 (2-3 semanas)  
**C)** HÍBRIDO - Core + Administrativo (4-5 semanas)  

**¿Cuál prefieres?**
