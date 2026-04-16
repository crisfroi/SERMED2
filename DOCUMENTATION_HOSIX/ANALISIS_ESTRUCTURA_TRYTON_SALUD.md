# Análisis Completo: Estructura de Módulos GNU Health Tryton

**Fecha de Análisis:** 12 de Abril, 2026  
**Ruta:** `/SERMED2/tryton/`  
**Versión GNU Health:** 5.0.3  
**Framework:** Tryton ERP 7.0.x  

---

## 📋 Contenido

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Tabla de Módulos](#tabla-de-módulos)
3. [Categorización por Tipo](#categorización-por-tipo)
4. [Descripción Detallada de Módulos](#descripción-detallada-de-módulos)
5. [Diagrama de Dependencias](#diagrama-de-dependencias)
6. [Análisis de Dependencias Funcionales](#análisis-de-dependencias-funcionales)
7. [Entidades y Tablas Principales](#entidades-y-tablas-principales)

---

## Resumen Ejecutivo

GNU Health es un **Sistema de Información Hospitalaria (HIS)** libre y modular basado en Tryton. El sistema ofrece más de **53 módulos especializados** organizados en categorías funcionales:

- **Módulos Clínicos:** Laboratorio, Imagenología, Cirugía, Enfermería, UCI, etc.
- **Módulos Administrativos:** Gestión de stock, seguros, servicios y facturación
- **Módulos de Demografía:** Información socioeconómica, discapacidad, antecedentes
- **Módulos de Especialidades:** Pediatría, Ginecología, Oftalmología, Odontología, etc.
- **Módulos de Enfermedades:** Enfermedades Tropicales Desatendidas (NTD)
- **Módulos de Integración:** Federación, PACS/Orthanc, CalDAV
- **Módulos de Seguridad:** Criptografía, códigos QR, autenticación
- **Módulos de Codificación:** ICD-10, ICD-11, ICD-9, ICPM

---

## Tabla de Módulos

| # | Módulo | Carpeta | Versión | Tipo | Dependencia Principal | Estado |
|----|--------|---------|---------|------|----------------------|--------|
| 1 | **Health (Core)** | `health/` | 5.0.3 | Clínico/Base | Party, Company, Currency, Product | ✅ Base |
| 2 | **Health Lab** | `health_lab/` | 5.0.1 | Laboratorio | health | ✅ |
| 3 | **Health Imaging** | `health_imaging/` | 5.0.1 | Imagenología | health | ✅ |
| 4 | **Health Surgery** | `health_surgery/` | 5.0.1 | Quirúrgico | health, health_lab, health_imaging | ✅ |
| 5 | **Health Inpatient** | `health_inpatient/` | 5.0.1 | Hospitalización | health, health_lifestyle | ✅ |
| 6 | **Health ICU** | `health_icu/` | 5.0.1 | Cuidado Crítico | health, health_inpatient | ✅ |
| 7 | **Health Nursing** | `health_nursing/` | 5.0.1 | Enfermería/Ambulatorio | health | ✅ |
| 8 | **Health Stock** | `health_stock/` | 5.0.1 | Gestión de Stock | health, stock_lot | ✅ |
| 9 | **Health Genetics** | `health_genetics/` | 5.0.1 | Bioinformática | health | ✅ |
| 10 | **Health Pediatrics** | `health_pediatrics/` | 5.0.1 | Pediatría | health | ✅ |
| 11 | **Health Gyneco** | `health_gyneco/` | 5.0.1 | Ginecología/Obstetricia | health | ✅ |
| 12 | **Health Dentistry** | `health_dentistry/` | 5.0.1 | Odontología | health | ✅ |
| 13 | **Health Ophthalmology** | `health_ophthalmology/` | 5.0.1 | Oftalmología | health | ✅ |
| 14 | **Health Insurance** | `health_insurance/` | 5.0.1 | Seguros/Facturación | health | ✅ |
| 15 | **Health Services** | `health_services/` | 5.0.1 | Servicios/Facturación | health | ✅ |
| 16 | **Health Socioeconomics** | `health_socioeconomics/` | 5.0.1 | Demografía | health | ✅ |
| 17 | **Health Lifestyle** | `health_lifestyle/` | 5.0.1 | Estilos de Vida | health | ✅ |
| 18 | **Health Disability** | `health_disability/` | 5.0.1 | Discapacidad/ICF | health | ✅ |
| 19 | **Health ICD-10** | `health_icd10/` | 5.0.1 | Codificación | health | ✅ |
| 20 | **Health ICD-11** | `health_icd11/` | 5.0.1 | Codificación | health | ✅ |
| 21 | **Health ICD-9 Procedures** | `health_icd9procs/` | 5.0.1 | Codificación | health | ✅ |
| 22 | **Health ICD-10 PCS** | `health_icd10pcs/` | 5.0.1 | Codificación | health | ✅ |
| 23 | **Health ICPM** | `health_icpm/` | 5.0.1 | Codificación | health | ✅ |
| 24 | **Health Reporting** | `health_reporting/` | 5.0.1 | Analítica | health | ✅ |
| 25 | **Health History** | `health_history/` | 5.0.1 | Reportes/Antecedentes | health, otros | ✅ |
| 26 | **Health Contact Tracing** | `health_contact_tracing/` | 5.0.1 | Epidemiología | health | ✅ |
| 27 | **Health NTD** | `health_ntd/` | 5.0.1 | Base NTD | health | ✅ |
| 28 | **Health NTD Dengue** | `health_ntd_dengue/` | 5.0.1 | Enfermedades Tropicales | health_ntd | ✅ |
| 29 | **Health NTD Chagas** | `health_ntd_chagas/` | 5.0.1 | Enfermedades Tropicales | health_ntd | ✅ |
| 30 | **Health EMS** | `health_ems/` | 5.0.1 | Emergencias | health | ✅ |
| 31 | **Health Pediatric Growth Charts** | `health_pediatrics_growth_charts/` | 5.0.1 | Pediatría | health_pediatrics | ✅ |
| 32 | **Health Pediatric Growth Charts WHO** | `health_pediatrics_growth_charts_who/` | 5.0.1 | Pediatría | health_pediatrics_growth_charts | ✅ |
| 33 | **Health Imaging Worklist** | `health_imaging_worklist/` | 5.0.1 | Imagenología DICOM | health_imaging | ✅ |
| 34 | **Health Orthanc** | `health_orthanc/` | 5.0.1 | PACS/DICOM | health_imaging | ✅ |
| 35 | **Health Genetics UniProt** | `health_genetics_uniprot/` | 5.0.1 | Bioinformática | health_genetics | ✅ |
| 36 | **Health Crypto** | `health_crypto/` | 5.0.1 | Seguridad | health | ✅ |
| 37 | **Health Crypto Lab** | `health_crypto_lab/` | 5.0.1 | Seguridad | health_crypto, health_lab | ✅ |
| 38 | **Health QR Codes** | `health_qrcodes/` | 5.0.1 | Utilidad | health | ✅ |
| 39 | **Health Archives** | `health_archives/` | 5.0.1 | Archivos | health | ✅ |
| 40 | **Health CalDAV** | `health_caldav/` | 5.0.1 | Calendario | health | ✅ |
| 41 | **Health Calendar** | `health_calendar/` | 5.0.1 | Calendario | health | ✅ |
| 42 | **Health Inpatient Calendar** | `health_inpatient_calendar/` | 5.0.1 | Calendario | health_inpatient | ✅ |
| 43 | **Health WebDAV3 Server** | `health_webdav3_server/` | 5.0.1 | Servidor WebDAV | health | ✅ |
| 44 | **Health Federation** | `health_federation/` | 5.0.1 | Integración | health | ✅ |
| 45 | **Health WHO Essential Medicines** | `health_who_essential_medicines/` | 5.0.1 | Referencia | health | ✅ |
| 46 | **Health Services Lab** | `health_services_lab/` | 5.0.1 | Servicios | health_services, health_lab | ✅ |
| 47 | **Health Services Imaging** | `health_services_imaging/` | 5.0.1 | Servicios | health_services, health_imaging | ✅ |
| 48 | **Health Stock Inpatient** | `health_stock_inpatient/` | 5.0.1 | Stock | health_stock, health_inpatient | ✅ |
| 49 | **Health Stock Nursing** | `health_stock_nursing/` | 5.0.1 | Stock | health_stock, health_nursing | ✅ |
| 50 | **Health Stock Surgery** | `health_stock_surgery/` | 5.0.1 | Stock | health_stock, health_surgery | ✅ |
| 51 | **Health Surgery Protocols** | `health_surgery_protocols/` | 5.0.1 | Quirúrgico | health_surgery | ✅ |
| 52 | **Health MDG6** | `health_mdg6/` | 5.0.1 | Objetivos Desarrollo | health | ✅ |
| 53 | **Health ISS** | `health_iss/` | 5.0.1 | Sistema Salud | health | ✅ |

---

## Categorización por Tipo

### 🏥 **MÓDULOS CLÍNICOS PRINCIPALES** (12)

| Módulo | Descripción Funcional | Tablas Principales |
|--------|----------------------|-------------------|
| **health** | Core del sistema. Pacientes, encuentros, evaluaciones, medicación | Party, Patient, Evaluation, Medicament, PatientMedication |
| **health_lab** | Sistema de Información Laboratorial (LIMS). Órdenes, tipos de pruebas, reportes | TestType, PatientLabTest, LabTestCriteria |
| **health_imaging** | Imagenología médica. DICOM, órdenes de estudios, resultados | ImagingTest, PatientImageRequest, ImagingResult |
| **health_surgery** | Gestión quirúrgica. Pre/post operatorio, evaluaciones RCRI, protocolo quirúrgico | Surgery, SurgeryTeam, SurgicalProcedure, SurgeryComplications |
| **health_inpatient** | Hospitalización. Camas, internación, redondas, planes de alta | Hospitalization, HospitalBed, PatientRounding, DischargedPlan |
| **health_icu** | Cuidados críticos. Escalas: Glasgow Coma, APACHE II | PatientICUInfo, ICURounding, ICUAssessment |
| **health_nursing** | Enfermería ambulatoria. Encuentros, intervenciones, procedimientos | NursingEncounter, NursingIntervention, NursingProcedure |
| **health_pediatrics** | Atención pediátrica. Newborn, infancia, adolescencia, PSC | PediatricInfo, NeonatalData, PediatricSymptomChecklist |
| **health_gyneco** | Obstetricia/Ginecología. Historia ginecológica, obstétrica, perinatal | GynecologicalHistory, ObstetricHistory, PrenatalMonitoring |
| **health_dentistry** | Odontología. Procedimientos dentales, odontogramas | DentalProcedure, Odontogram, DentalHistory |
| **health_ophthalmology** | Oftalmología. Optometría, refracción, enfermedades oculares | OphthalmologyExam, VisionCorrection, EyeDisease |
| **health_ems** | Emergencias/Ambulancias. Gestión de ambulancias y respuesta | Ambulance, EmergencyCall, EMSResponse |

---

### 📊 **MÓDULOS ADMINISTRATIVOS Y SERVICIOS** (9)

| Módulo | Descripción Funcional | Tablas Principales |
|--------|----------------------|-------------------|
| **health_stock** | Gestión de stock farmacéutico y suministros médicos | Stock, StockMove, Medicament |
| **health_stock_inpatient** | Stock para pacientes hospitalizados | InpatientStockRequest |
| **health_stock_nursing** | Stock para servicios de enfermería | NursingStockRequest |
| **health_stock_surgery** | Stock para quirófano | SurgeryStockRequest |
| **health_insurance** | Pólizas de seguros, listas de precios por servicio | InsurancePlan, Insurance, PriceList |
| **health_services** | Servicios y facturación. Agrupamiento de órdenes | HealthService, ServiceLine, HealthInvoice |
| **health_services_lab** | Servicios y facturación para laboratorio | LabService |
| **health_services_imaging** | Servicios y facturación para imagenología | ImagingService |
| **health_reporting** | Analítica y reportes. Epidemiología, demografía | PatientDemographicsReport, EpidemiologyReport |

---

### 👤 **MÓDULOS DE DEMOGRAFÍA Y CONTEXTO SOCIAL** (5)

| Módulo | Descripción Funcional | Tablas Principales |
|--------|----------------------|-------------------|
| **health_socioeconomics** | Determinantes socioeconómicos de salud | SocioeconomicData, FamilyFunctionality, EnvironmentalExposure |
| **health_lifestyle** | Estilos de vida, hábitos alimentarios, drogas recreativas | LifestyleData, DietaryHabits, PhysicalActivity |
| **health_disability** | Discapacidad e integración social. Clasificación CIF | DisabilityAssessment, FunctionalLimitation |
| **health_contact_tracing** | Rastreo de contactos para epidemias | ContactTrace, ExposureHistory |
| **health_history** | Reportes de historia del paciente/antecedentes | PatientHistoryReport |

---

### 🔬 **MÓDULOS DE GENÉTICA Y BIOINFORMÁTICA** (3)

| Módulo | Descripción Funcional | Tablas Principales |
|--------|----------------------|-------------------|
| **health_genetics** | Información genética del paciente, genes HUGO | GeneticData, HumanGene, GeneticAlternate |
| **health_genetics_uniprot** | Integración con base de datos UniProt | UniProtReference |
| **health_crypto_lab** | Criptografía aplicada a datos de laboratorio | EncryptedLabTest |

---

### 🏷️ **MÓDULOS DE CODIFICACIÓN MÉDICA** (5)

| Módulo | Descripción Funcional | Tablas Principales |
|--------|----------------------|-------------------|
| **health_icd10** | Clasificación Internacional de Enfermedades Rev. 10 | ICD10Code, DiagnosisReference |
| **health_icd11** | Clasificación Internacional de Enfermedades Rev. 11 | ICD11Code |
| **health_icd9procs** | Procedimientos ICD-9 | ICD9ProcCode |
| **health_icd10pcs** | Códigos de procedimientos ICD-10-PCS | ICD10PCSCode |
| **health_icpm** | Clasificación Internacional de Prácticas Médicas | ICPMCode |

---

### 🦟 **MÓDULOS DE ENFERMEDADES TROPICALES DESATENDIDAS (NTD)** (3)

| Módulo | Descripción Funcional | Tablas Principales |
|--------|----------------------|-------------------|
| **health_ntd** | Base para enfermedades tropicales desatendidas | NTDCase |
| **health_ntd_dengue** | Dengue: detección, laboratorio, vigilancia | DengueCase, DengueTest |
| **health_ntd_chagas** | Chagas: detección en fases, evaluación clínica | ChagasCase, ChagasTest, ChagasEvaluation |

---

### 🔐 **MÓDULOS DE SEGURIDAD E INTEGRACIÓN** (7)

| Módulo | Descripción Funcional | Tablas Principales |
|--------|----------------------|-------------------|
| **health_crypto** | Criptografía, firma digital, no-repudio | DocumentSignature, EncryptionKey |
| **health_qrcodes** | Generación de códigos QR y códigos de barras | QRCodeData, BarcodeData |
| **health_archives** | Archivamiento y almacenamiento de registros | PatientArchive |
| **health_caldav** | Calendario CalDAV/WebDAV | CalendarEvent |
| **health_calendar** | Gestión de calendario | HealthCalendarEvent |
| **health_webdav3_server** | Servidor WebDAV3 para sincronización | WebDAVResource |
| **health_federation** | Integración con GNU Health Federation | FederationNode, SyncMessage |

---

### 📺 **MÓDULOS DE IMAGENOLOGÍA AVANZADA** (2)

| Módulo | Descripción Funcional | Tablas Principales |
|--------|----------------------|-------------------|
| **health_imaging_worklist** | Lista de trabajo DICOM (worklist) | DICOMWorklist |
| **health_orthanc** | Integración servidor PACS Orthanc | OrthancConnection, OrthancStudy |

---

### 👶 **MÓDULOS PEDIÁTRICOS** (2)

| Módulo | Descripción Funcional | Tablas Principales |
|--------|----------------------|-------------------|
| **health_pediatrics_growth_charts** | Gráficos de crecimiento pediátrico | GrowthChart |
| **health_pediatrics_growth_charts_who** | Gráficos de crecimiento WHO | WHOGrowthChart |

---

### 🌍 **MÓDULOS DE REFERENCIA GLOBAL** (2)

| Módulo | Descripción Funcional | Tablas Principales |
|--------|----------------------|-------------------|
| **health_who_essential_medicines** | Lista de medicamentos esenciales OMS | WHOMedicine |
| **health_mdg6** | Objetivos de Desarrollo del Milenio - Salud Materna | MDG6Indicator |

---

### 🏛️ **MÓDULOS DE SALUD PÚBLICA** (1)

| Módulo | Descripción Funcional | Tablas Principales |
|--------|----------------------|-------------------|
| **health_iss** | Sistema de Información de Salud/Vigilancia | PublicHealthMetric |

---

### 📅 **MÓDULOS DE CALENDARIO** (2)

| Módulo | Descripción Funcional | Tablas Principales |
|--------|----------------------|-------------------|
| **health_inpatient_calendar** | Calendario para inpatientes | InpatientCalendarEvent |
| (health_calendar y health_caldav anteriormente mencionados) | | |

---

## Descripción Detallada de Módulos

### 1. **health** (Health Core Package)
**Categoría:** Base/Core  
**Versión:** 5.0.3  
**Ubicación:** `health/`

**Descripción:**
El módulo core proporciona la estructura fundamental del Sistema de Información Hospitalaria GNU Health. Implementa:

- **Demografía:** Individuos, unidades domiciliarias, familias
- **Gestión de Pacientes:** Historiales electrónicos de pacientes (EMR), encuentros
- **Centro de Salud:** Personal, especializaciones, estructura organizativa
- **Infraestructura:** Camas de hospital, quirófanos, unidades
- **Medicamentos:** Medicamentos, formas farmacéuticas, dosis, rutas
- **Procedimientos:** Códigos de procedimientos médicos
- **Vacunación:** Esquemas de inmunización
- **Evaluaciones:** Evaluaciones de pacientes, síntomas, signos

**Archivos Clave:**
- `health.py` - Modelos principales (Patient, Appointment, Evaluation)
- `core.py` - Funciones centrales
- `health_view.xml` - Vistas de usuario
- `security/` - Políticas de seguridad y acceso RLS

**Dependencias Externas:**
- `party` (Gestión de terceros)
- `company` (Empresas/Instituciones)
- `currency` (Monedas)
- `product` (Productos/Servicios)

**Conceptos Clave:**
- Patient Data: Almacena información demográfica de pacientes
- Evaluation: Encuentros clínicos y evaluaciones
- Appointment: Citas médicas
- Medicament: Catálogo de medicamentos

---

### 2. **health_lab** (Laboratory Information System)
**Categoría:** Laboratorio  
**Versión:** 5.0.1  
**Ubicación:** `health_lab/`  
**Alias:** Occhiolino LIMS

**Descripción:**
Sistema completo de Información Laboratorial (LIMS) con:

- **Órdenes de Pruebas:** Solicitudes de pruebas de laboratorio
- **Tipos de Pruebas:** Catálogo configurable (hemograma, cultivo, etc.)
- **Criterios de Prueba:** Rangos normales por edad y género
- **Resultados:** Almacenamiento y reporte de resultados
- **Especímenes:** Gestión de tipos de muestra
- **Intervalos Normales:** Rango de valores segunsegún demografía

**Archivos Clave:**
- `health_lab.py` - Modelos (TestType, PatientLabTest, GnuHealthTestCriteria)
- `test_type` - Tipos de pruebas disponibles
- `patient.lab.test` - Órdenes de pruebas

**Dependencias:**
- `health` (base)

**Entidades Principales:**
- `gnuhealth.lab.test_type` - Tipos de prueba
- `gnuhealth.patient.lab.test` - Órdenes de laboratorio
- `gnuhealth.lab.test.critearea` - Criterios de normalidad

---

### 3. **health_imaging** (Medical Imaging Core)
**Categoría:** Imagenología  
**Versión:** 5.0.1  
**Ubicación:** `health_imaging/`

**Descripción:**
Gestión de estudios de imagenología médica:

- **Solicitudes de Imagen:** DICOM orders
- **Tipos de Estudios:** CT, MRI, X-Ray, Ultrasound, etc.
- **Resultados:** Almacenamiento de imágenes y reportes
- **Interfaces DICOM:** Integración con PACS

**Archivos Clave:**
- `health_imaging.py` - Modelos principales
- `imaging_data.xml` - Tipos de estudios predefinidos

**Dependencias:**
- `health`

**Entidades Principales:**
- `gnuhealth.imaging.test` - Tipos de estudios
- `gnuhealth.patient.imaging.test` - Órdenes de imagenología

---

### 4. **health_surgery** (Surgery Package)
**Categoría:** Quirúrgico  
**Versión:** 5.0.1  
**Ubicación:** `health_surgery/`

**Descripción:**
Gestión completa del proceso quirúrgico:

- **Pre-operatorio:** Evaluación RCRI, riesgos
- **Equipo Quirúrgico:** Cirujanos, anestesiólogos, enfermeras
- **Procedimientos:** Registro de intervenciones
- **Complicaciones:** Eventos postoperatorios
- **Protocolo:** Protocolo quirúrgico estándar
- **Programación:** Calendario de quirófano

**Archivos Clave:**
- `health_surgery.py` - Modelos
- `surgery.py` - Procesos quirúrgicos

**Dependencias:**
- `health`
- `health_lab` (para pruebas pre-op)
- `health_imaging` (para estudios pre-op)

**Entidades Principales:**
- `gnuhealth.surgery` - Intervención quirúrgica
- `gnuhealth.surgery.professional` - Equipo quirúrgico

---

### 5. **health_inpatient** (Hospitalization Management)
**Categoría:** Hospitalización  
**Versión:** 5.0.1  
**Ubicación:** `health_inpatient/`

**Descripción:**
Gestión integral de pacientes hospitalizados:

- **Registro de Internación:** Admisión, traslados
- **Gestión de Camas:** Asignación, disponibilidad
- **Redondas Clínicas:** Evaluaciones diarias
- **Medicación:** Órdenes y administración de medicamentos
- **Plan de Alta:** Instrucciones postbaja
- **Nutrición:** Planes nutricionales

**Archivos Clave:**
- `health_inpatient.py` - Modelos
- `hospitalization.py` - Proceso de internación

**Dependencias:**
- `health`
- `health_lifestyle`

**Entidades Principales:**
- `gnuhealth.hospitalization` - Registro de internación
- `gnuhealth.patient.rounding` - Ronda clínica

---

### 6. **health_icu** (Intensive Care Unit)
**Categoría:** Cuidado Crítico  
**Versión:** 5.0.1  
**Ubicación:** `health_icu/`

**Descripción:**
Especialización para Unidades de Cuidados Intensivos:

- **Escalas de Severidad:** Glasgow Coma Scale, APACHE II
- **Información de ICU:** Días en UCI, ventilación mecánica
- **Redondas de ICU:** Evaluación neurológica, respiratoria, cardiovascular
- **Monitoreo:** Electrocardiogramas, datos vitales

**Archivos Clave:**
- `health_icu.py` - Modelos específicos de ICU

**Dependencias:**
- `health`
- `health_inpatient`

**Entidades Principales:**
- `gnuhealth.patient.icu` - Información de paciente en ICU
- `gnuhealth.icu.assessment` - Evaluación de ICU

---

### 7. **health_nursing** (Nursing and Ambulatory Care)
**Categoría:** Enfermería/Atención Ambulatoria  
**Versión:** 5.0.1  
**Ubicación:** `health_nursing/`

**Descripción:**
Encuentros de enfermería en settings ambulatorios:

- **Citas de Enfermería:** Gestión de encuentros
- **Intervenciones:** Procedimientos de enfermería
- **Evaluaciones:** Signos vitales, estado del paciente
- **Reportes:** Generación de reportes clínicos

**Archivos Clave:**
- `health_nursing.py` - Modelos
- `nursing_encounter.py` - Encuentro de enfermería

**Dependencias:**
- `health`

**Entidades Principales:**
- `gnuhealth.patient.encounter` - Encuentro ambulatorio

---

### 8. **health_genetics** (Medical Genetics)
**Categoría:** Bioinformática  
**Versión:** 5.0.1  
**Ubicación:** `health_genetics/`

**Descripción:**
Integración de información genética:

- **Información Genética:** Historia familiar, variantes
- **Base de Datos HUGO:** Human Genome Organization reference
- **Referencias Genómicas:** Ensembl, NCBI Entrez, RefSeq, OMIM
- **Análisis de Variantes:** Interpretación clínica

**Archivos Clave:**
- `health_genetics.py` - Modelos de genética
- `human_genes_grch38.xml` - Referencia de genes humanos

**Dependencias:**
- `health`

**Entidades Principales:**
- `gnuhealth.patient.genetic` - Información genética del paciente
- `gnuhealth.human.gene` - Genes (referencia)

---

### 9. **health_pediatrics** (Pediatrics Package)
**Categoría:** Pediatría  
**Versión:** 5.0.1  
**Ubicación:** `health_pediatrics/`

**Descripción:**
Atención especializada de pacientes pediátricos:

- **Información Neonatal:** Datos del recién nacido
- **Períodos de Desarrollo:** Infancia, toddler, niñez, adolescencia
- **Síntomatología Pediátrica:** Checklist de síntomas pediátricos (PSC)
- **Esquemas de Vacunación:** Estado vacunal, seguimiento
- **Crecimiento y Desarrollo:** Monitoreo

**Archivos Clave:**
- `health_pediatrics.py` - Modelos pediátricos
- `pediatric_info.py` - Información pediátrica

**Dependencias:**
- `health`

**Entidades Principales:**
- `gnuhealth.patient.pediatric_info` - Información pediátrica
- `gnuhealth.newborn.info` - Datos neonatales

---

### 10. **health_gyneco** (Obstetrics & Gynecology)
**Categoría:** Ginecología/Obstetricia  
**Versión:** 5.0.1  
**Ubicación:** `health_gyneco/`

**Descripción:**
Salud reproductiva y gestión del embarazo:

- **Historia Ginecológica:** Pruebas de cribado, ciclos menstruales
- **Historia Obstétrica:** GPA (Gestosidad, Paridad, Abortos)
- **Monitoreo Perinatal:** Controles, pruebas prenatales
- **Puerperio:** Período postparto

**Archivos Clave:**
- `health_gyneco.py` - Modelos de ginecología

**Dependencias:**
- `health`

**Entidades Principales:**
- `gnuhealth.patient.gynecological` - Historia ginecológica
- `gnuhealth.patient.obstetric` - Historia obstétrica

---

### 11. **health_dentistry** (Dentistry)
**Categoría:** Odontología  
**Versión:** 5.0.1  
**Ubicación:** `health_dentistry/`

**Descripción:**
Gestión de salud bucodental:

- **Odontograma:** Representación gráfica del estado dental
- **Procedimientos Dentales:** Tratamientos, extracciones
- **Historia Dental:** Antecedentes bucodentales
- **Reportes:** Generación de odontogramas

**Archivos Clave:**
- `health_dentistry.py` - Modelos odontológicos

**Dependencias:**
- `health`

**Entidades Principales:**
- `gnuhealth.patient.dental_procedure` - Procedimiento dental
- `gnuhealth.odontogram` - Odontograma visual

---

### 12. **health_ophthalmology** (Ophthalmology)
**Categoría:** Oftalmología  
**Versión:** 5.0.1  
**Ubicación:** `health_ophthalmology/`

**Descripción:**
Atención oftalmológica y optometría:

- **Refracción:** Corrección óptica
- **Patología Ocular:** Condiciones oculares
- **Examen Visual:** Agudeza visual
- **Evaluación de Optometría:** Prescripción de lentes

**Archivos Clave:**
- `health_ophthalmology.py` - Modelos oftalmológicos

**Dependencias:**
- `health`

**Entidades Principales:**
- `gnuhealth.patient.ophthalmology` - Evaluación oftalmológica

---

### 13. **health_stock** (Stock Management)
**Categoría:** Administración  
**Versión:** 5.0.1  
**Ubicación:** `health_stock/`

**Descripción:**
Integración de gestión de stock farmacéutico:

- **Stock de Medicamentos:** Inventario de farmacia
- **Stock de Suministros:** Materiales médicos
- **Movimientos:** Entrada/salida de stock
- **Desde Prescripciones:** Crear movimientos del stock basado en prescripciones
- **Desde Vacunación:** Actualizar stock al vacunar

**Archivos Clave:**
- `health_stock.py` - Vínculo health-stock
- `create_prescription_stock_move.py` - Asistente

**Dependencias:**
- `health`
- `stock_lot`

**Entidades Principales:**
- Vinculación entre `gnuhealth.medicament` y módulo `stock`

---

### 14. **health_insurance** (Insurance Policies)
**Categoría:** Administración/Seguros  
**Versión:** 5.0.1  
**Ubicación:** `health_insurance/`

**Descripción:**
Gestión de pólizas de seguros y tarificación:

- **Pólizas de Seguros:** Modalidad de cobertura
- **Listas de Precios:** Por productos, servicios, procedimientos
- **Porcentajes/Montos:** Descuentos o coberturas
- **Facturación:** Aplicación de tarifas por asegurador

**Archivos Clave:**
- `health_insurance.py` - Modelos de seguros

**Dependencias:**
- `health`

**Entidades Principales:**
- `gnuhealth.insurance.plan` - Póliza de seguro
- `gnuhealth.insurance` - Asegurador del paciente

---

### 15. **health_services** (Health Services & Billing)
**Categoría:** Administración/Servicios  
**Versión:** 5.0.1  
**Ubicación:** `health_services/`

**Descripción:**
Agrupación de servicios y facturación:

- **Servicios:** Agrupamiento de órdenes (lab, imaging, procedimientos)
- **Líneas de Servicio:** Items facturables
- **Invoicing:** Generación de facturas

**Archivos Clave:**
- `health_services.py` - Modelos de servicios

**Dependencias:**
- `health`

**Entidades Principales:**
- `gnuhealth.patient.service` - Servicio de salud
- `gnuhealth.patient.service.line` - Línea de servicio

---

### 16. **health_socioeconomics** (Socioeconomic Assessment)
**Categoría:** Demografía  
**Versión:** 5.0.1  
**Ubicación:** `health_socioeconomics/`

**Descripción:**
Determinantes socioeconómicos de la salud:

- **Condiciones de Vida:** Vivienda, saneamiento
- **Educación:** Nivel académico
- **Ocupación:** Profesión, empleo
- **Infraestructura:** Electricidad, alcantarillado
- **Funcionalidad Familiar:** Relaciones familiares
- **Factores de Riesgo:** Ambientes hostiles, explotación

**Archivos Clave:**
- `health_socioeconomics.py` - Modelos socioeconómicos

**Dependencias:**
- `health`

**Entidades Principales:**
- `gnuhealth.patient.socioeconomic` - Datos socioeconómicos

---

### 17. **health_lifestyle** (Lifestyle Assessment)
**Categoría:** Demografía  
**Versión:** 5.0.1  
**Ubicación:** `health_lifestyle/`

**Descripción:**
Factores de estilo de vida del paciente:

- **Hábitos Alimentarios:** Dietas, preferencias nutricionales
- **Patrón de Sueño:** Calidad del descanso
- **Drogas Recreativas:** Base de datos NIDA, ratings Henningfield
- **Adicciones:** Alcohol, tabaco, sustancias
- **Actividad Física:** Ejercicio regular
- **Sexualidad:** Comportamiento sexual
- **Seguridad:** Conducción, hogar, menores

**Archivos Clave:**
- `health_lifestyle.py` - Modelos de estilo de vida

**Dependencias:**
- `health`

**Entidades Principales:**
- `gnuhealth.patient.lifestyle` - Información de estilo de vida

---

### 18. **health_disability** (Disability & ICF)
**Categoría:** Demografía  
**Versión:** 5.0.1  
**Ubicación:** `health_disability/`

**Descripción:**
Funcionalidad, discapacidad e integración social:

- **Clasificación CIF:** ICF de la OMS
- **Limitaciones Funcionales:** Restricciones de actividad
- **Barreras Ambientales:** Factores que limitan participación
- **Integración Social:** Grado de inclusión

**Archivos Clave:**
- `health_disability.py` - Modelos de discapacidad

**Dependencias:**
- `health`

**Entidades Principales:**
- `gnuhealth.patient.disability` - Evaluación de discapacidad

---

### 19-23. **Módulos de Codificación** (ICD-10, ICD-11, ICD-9, ICD-10-PCS, ICPM)
**Categoría:** Referencia Médica  
**Versión:** 5.0.1  

**Descripción General:**
Clasificaciones de diagnósticos y procedimientos:

- **ICD-10:** Diagnósticos CIE-10 (OMS)
- **ICD-11:** Próxima generación de CIE
- **ICD-9 Procedures:** Procedimientos CIE-9
- **ICD-10-PCS:** Procedimientos procedimiento americano
- **ICPM:** Clasificación Internacional de Prácticas Médicas (USOPM)

**Dependencias:**
- `health`

**Propósito:**
Búsqueda rápida de códigos clínicos estándar para documentación

---

### 24. **health_reporting** (Analytics & Reporting)
**Categoría:** Análisis  
**Versión:** 5.0.1  
**Ubicación:** `health_reporting/`

**Descripción:**
Analítica de datos de salud:

- **Reportes Demográficos:** Distribución poblacional
- **Epidemiología:** Incidencia, prevalencia
- **Evaluaciones de Paciente:** Estadísticas clínicas
- **Análisis Institucional:** Capacidad, utilización

**Archivos Clave:**
- `health_reporting.py` - Modelos de reporting

**Dependencias:**
- `health`

**Entidades Principales:**
- Reportes personalizados

---

### 25. **health_ntd** (Neglected Tropical Diseases)
**Categoría:** Enfermedades Especiales  
**Versión:** 5.0.1  
**Ubicación:** `health_ntd/`

**Descripción:**
Framework para 17 Enfermedades Tropicales Desatendidas (OMS):

- Chagas
- Dengue
- Leishmaniasis
- Lepra
- Y otras 13 enfermedades

**Dependencias:**
- `health`

**Estructura:**
Base para módulos específicos como `health_ntd_chagas` y `health_ntd_dengue`

---

### 26-27. **health_ntd_dengue & health_ntd_chagas**
**Categoría:** Enfermedades Tropicales  
**Versión:** 5.0.1

**Dengue - Descripción:**
- Detección de enfermedad en fase aguda
- Pruebas de laboratorio específicas
- Vigilancia de unidades domiciliarias
- Reportes epidemiológicos

**Chagas - Descripción:**
- Detección en fases aguda, indeterminada, crónica
- Transmisión congénita
- Evaluación clínica
- Vigilancia entomológica en viviendas
- Reportes epidemiológicos

**Dependencias:**
- `health_ntd`

---

### 28. **health_contact_tracing** (Epidemics Contact Tracing)
**Categoría:** Epidemiología  
**Versión:** 5.0.1  
**Ubicación:** `health_contact_tracing/`

**Descripción:**
Rastreo de contactos para enfermedades infecciosas:

- **Historia de Exposición:** Contactos, lugares
- **Seguimiento de Contactos:** Monitoreo diario
- **Cuarentena:** Períodos de aislamiento
- **Notificación:** Alertas automáticas

**Dependencias:**
- `health`

---

### 29. **health_ems** (Emergency Medical Services)
**Categoría:** Emergencias  
**Versión:** 5.0.1  
**Ubicación:** `health_ems/`

**Descripción:**
Gestión de servicios de emergencia:

- **Ambulancias:** Inventario y disponibilidad
- **Llamadas de Emergencia:** Registro de incidentes
- **Respuesta EMS:** Asignación y seguimiento
- **Triaje:** Clasificación de urgencia

**Dependencias:**
- `health`

---

### 30-31. **health_imaging_worklist & health_orthanc**
**Categoría:** Imagenología Avanzada  
**Versión:** 5.0.1

**Imaging Worklist - Descripción:**
- Lista de trabajo DICOM
- Interfaz con equipos DICOM
- Feed automático de órdenes

**Orthanc - Descripción:**
- Integración con servidor PACS Orthanc
- Navegación de estudios DICOM
- Visualización de imágenes
- Plugins: OHIF Viewer, WSI

**Dependencias:**
- `health_imaging` (y `health_imaging_worklist` para Orthanc)

---

### 32-33. **health_pediatrics_growth_charts & growth_charts_who**
**Categoría:** Pediatría  
**Versión:** 5.0.1

**Descripción:**
Gráficos de crecimiento pediátrico:

- **Percentiles:** P3, P10, P25, P50, P75, P90, P97
- **Curvas de Crecimiento:** Peso, talla, IMC
- **Referencia OMS:** Estándares de crecimiento de la OMS
- **Evaluación:** Detección de retraso o sobrepeso

**Dependencias:**
- `health_pediatrics`
- `growth_charts_who` requiere `growth_charts`

---

### 34-35. **health_crypto & health_crypto_lab**
**Categoría:** Seguridad  
**Versión:** 5.0.1

**Crypto - Descripción:**
- Serialización de documentos (JSON)
- Hash de documentos (MD5, SHA)
- Firma digital (asimétrica)
- Encriptación (pública/privada)
- No-repudio de documentos

**Crypto Lab - Descripción:**
- Aplicación de criptografía a resultados de laboratorio
- Protección de pruebas sensibles

**Dependencias:**
- `health`
- `health_crypto_lab` requiere `health_crypto` y `health_lab`

---

### 36. **health_qrcodes** (QR & Barcode Generation)
**Categoría:** Utilidad  
**Versión:** 5.0.1  
**Ubicación:** `health_qrcodes/`

**Descripción:**
Generación de códigos QR y de barras:

- **Códigos QR:** Para pacientes, órdenes
- **Códigos de Barras:** Etiquetado de muestras
- **Aplicación:** Laboratorio, imaging, farmacia

**Dependencias:**
- `health`

---

### 37. **health_archives** (Patient Records Archiving)
**Categoría:** Administración  
**Versión:** 5.0.1  
**Ubicación:** `health_archives/`

**Descripción:**
Archivamiento y almacenamiento:

- **Historial de Paciente:** Acceso a registros históricos
- **Retención:** Políticas de conservación
- **Acceso:** Control de acceso a archivos
- **Cumplimiento:** Normativas de privacidad

**Dependencias:**
- `health`

---

### 38-41. **Módulos de Calendario**
**Categoría:** Calendario  
**Versión:** 5.0.1

**health_caldav:**
- Calendario CalDAV/WebDAV
- Sincronización con clientes estándar
- Integración de eventos

**health_calendar:**
- Gestión de calendario interno
- Eventos sanitarios

**health_inpatient_calendar:**
- Calendario específico para inpatientes
- Eventos de hospitalización

**health_webdav3_server:**
- Servidor WebDAV3
- Acceso remoto a recursos

**Dependencias:**
- `health` (excepto `health_inpatient_calendar` que depende de `health_inpatient`)

---

### 42-43. **health_services_lab & health_services_imaging**
**Categoría:** Administración  
**Versión:** 5.0.1

**Descripción:**
Servicios específicos y facturación:

**Lab Services:**
- Facturación de pruebas de laboratorio
- Integración con `health_services`

**Imaging Services:**
- Facturación de estudios de imagenología
- Integración con `health_services`

**Dependencias:**
- `health_services`
- `health_lab` (lab) / `health_imaging` (imaging)

---

### 44-46. **health_stock_inpatient, nursing & surgery**
**Categoría:** Stock Especializado  
**Versión:** 5.0.1

**Descripción:**
Stock para contextos específicos:

- **Inpatient:** Medicamentos para pacientes hospitalizados
- **Nursing:** Suministros para nursing
- **Surgery:** Instrumental quirúrgico

**Dependencias:**
- `health_stock`
- Contexto específico (`health_inpatient`, `health_nursing`, `health_surgery`)

---

### 47. **health_surgery_protocols** (Surgery Protocols)
**Categoría:** Quirúrgico  
**Versión:** 5.0.1  
**Ubicación:** `health_surgery_protocols/`

**Descripción:**
Protocolos estandarizados quirúrgicos:

- **Procedimientos Estándar:** Pre/post operatorio
- **Checklist:** Verificación de seguridad
- **Complicaciones:** Gestión de eventos adversos

**Dependencias:**
- `health_surgery`

---

### 48. **health_federation** (Federation Integration)
**Categoría:** Integración  
**Versión:** 5.0.1  
**Ubicación:** `health_federation/`

**Descripción:**
Integración en GNU Health Federation:

- **Nodos Distribuidos:** Conexión de múltiples instituciones
- **Sincronización:** Replicación de datos entre nodos
- **Federated Health Networks:** Redes descentralizadas regionales

**Dependencias:**
- `health`

---

### 49-50. **health_genetics_uniprot & health_who_essential_medicines**
**Categoría:** Referencia Global  
**Versión:** 5.0.1

**UniProt:**
- Integración con base de datos de proteínas
- Análisis de variantes genéticas

**WHO Medicines:**
- Lista de medicamentos esenciales OMS
- Referencia global de medicamentos

**Dependencias:**
- `health_genetics` (UniProt)
- `health` (WHO Medicines)

---

### 51.  **health_mdg6** (Millennium Development Goals - Maternal Health)
**Categoría:** Salud Pública  
**Versión:** 5.0.1  
**Ubicación:** `health_mdg6/`

**Descripción:**
Indicadores de salud materna (ONU):

- **Mortalidad Materna:** Seguimiento MMR
- **Salud Infantil:** Indicadores de supervivencia
- **Indicadores:** Métricas de desarrollo

**Dependencias:**
- `health`

---

### 52. **health_iss** (Health Information System/Surveillance)
**Categoría:** Salud Pública  
**Versión:** 5.0.1  
**Ubicación:** `health_iss/`

**Descripción:**
Sistema Nacional de Vigilancia/HIS:

- **Vigilancia Epidemiológica:** Seguimiento de enfermedades
- **Indicadores Públicos:** Métricas nacionales
- **Reporting:** Generación de reportes

**Dependencias:**
- `health`

---

## Diagrama de Dependencias

```
                         MÓDULO CORE
                              │
                          health
              ┌─────────────────┬─────────────────┬──────────────┐
              │                 │                 │              │
         health_lab        health_imaging    health_nursing  health_genetics
              │                 │                 │              │
              ├─────────────────┴─────────────────┤              └──► health_genetics
              │                                   │                   _uniprot
          health_surgery                  (health_lifecycle)
              │                                   │
              ├──────────────────────────────────┘
              │
         health_inpatient
              │
         health_icu
              │
              └─► health_inpatient_calendar

health (core)
   ├─► health_lab
   │   └─► health_surgery
   │       ├─► health_imaging
   │       ├─► health_lab
   │       └─► health_surgery_protocols
   │
   ├─► health_imaging
   │   ├─► health_imaging_worklist
   │   └─► health_orthanc
   │
   ├─► health_inpatient
   │   ├─► health_lifestyle
   │   ├─► health_icu
   │   ├─► health_inpatient_calendar
   │   ├─► health_stock_inpatient
   │   
   ├─► health_nursing
   │   └─► health_stock_nursing
   │
   ├─► health_genetics
   │   └─► health_genetics_uniprot
   │
   ├─► health_pediatrics
   │   ├─► health_pediatrics_growth_charts
   │   │   └─► health_pediatrics_growth_charts_who
   │
   ├─► health_stock
   │   ├─► health_stock_inpatient
   │   ├─► health_stock_nursing
   │   └─► health_stock_surgery
   │
   ├─► health_services
   │   ├─► health_services_lab
   │   └─► health_services_imaging
   │
   ├─► health_crypto
   │   └─► health_crypto_lab
   │
   ├─► health_ntd
   │   ├─► health_ntd_chagas
   │   └─► health_ntd_dengue
   │
   ├─► [ICD codifications]
   │   ├─► health_icd10
   │   ├─► health_icd11
   │   ├─► health_icd9procs
   │   ├─► health_icd10pcs
   │   └─► health_icpm
   │
   ├─► [Demographic/Social]
   │   ├─► health_socioeconomics
   │   ├─► health_lifestyle
   │   ├─► health_disability
   │   └─► health_history
   │
   ├─► [Specialty]
   │   ├─► health_gyneco
   │   ├─► health_dentistry
   │   ├─► health_ophthalmology
   │   ├─► health_ems
   │   └─► health_pediatrics
   │
   ├─► [Utilities]
   │   ├─► health_reporting
   │   ├─► health_qrcodes
   │   ├─► health_archives
   │   ├─► health_caldav
   │   ├─► health_calendar
   │   ├─► health_webdav3_server
   │   ├─► health_contact_tracing
   │   ├─► health_federation
   │   ├─► health_who_essential_medicines
   │   ├─► health_mdg6
   │   └─► health_iss
   │
   └─► [Admin/Billing]
       ├─► health_insurance
       └─► health_services
```

---

## Análisis de Dependencias Funcionales

### Cadena de Dependencias Críticas

**Nivel 0 - Core (Independiente):**
```
health (base)
```

**Nivel 1 - Módulos Directos de Health:**
```
health_lab, health_imaging, health_nursing, 
health_genetics, health_pediatrics, health_gyneco, 
health_dentistry, health_ophthalmology, health_ems,
health_stock, health_services, health_lifestyle
```

**Nivel 2 - Módulos que dependen de Nivel 1:**
```
health_surgery (depende de: health, health_lab, health_imaging)
health_inpatient (depende de: health, health_lifestyle)
health_icu (depende de: health, health_inpatient)
health_crypto_lab (depende de: health_crypto, health_lab)
```

**Nivel 3 - Especializaciones:**
```
health_surgery_protocols → health_surgery
health_stock_inpatient → health_stock + health_inpatient
health_stock_nursing → health_stock + health_nursing
health_stock_surgery → health_stock + health_surgery
health_inpatient_calendar →health_inpatient
health_pediatrics_growth_charts → health_pediatrics
health_pediatrics_growth_charts_who → health_pediatrics_growth_charts
health_ntd_chagas → health_ntd
health_ntd_dengue → health_ntd
health_imaging_worklist → health_imaging
health_orthanc → health_imaging
health_services_lab → health_services + health_lab
health_services_imaging → health_services + health_imaging
health_genetics_uniprot → health_genetics
```

### Módulos con Dependencias Externas (Tryton)

```
health:              party, company, currency, product
health_stock:        stock_lot
health_services:     account, sale, invoice
health_reporting:    reporting (Tryton BI)
```

---

## Entidades y Tablas Principales

### HEALTH (Core)

| Entidad | Tabla SQL | Descripción | Vista |
|---------|-----------|-------------|-------|
| Party | party.party | Terceros (Personas/Empresas) | Base Tryton |
| Patient | gnuhealth.patient | Información demográfica del paciente | Ficha |
| Evaluation | gnuhealth.patient.evaluation | Encuentro/evaluación clínica | Evolución |
| Appointment | gnuhealth.appointment | Cita médica programada | Agenda |
| PatientMedication | gnuhealth.patient.medication | Medicamentos prescritos | Medicación |
| HealthInstitution | gnuhealth.institution | Centro de salud | Setup |
| HealthProfessional | gnuhealth.health_professional | Personal médico | Recursos |
| HospitalBed | gnuhealth.hospital.bed | Camas disponibles | Camas |
| Medicament | gnuhealth.medicament | Catálogo de fármacos | Medicamentos |
| Pathology | gnuhealth.pathology | Diagnósticos/Enfermedades | Diagnósticos |

### HEALTH_LAB

| Entidad | Tabla SQL | Descripción | Vista |
|---------|-----------|-------------|-------|
| TestType | gnuhealth.lab.test_type | Tipo de prueba | Catálogo |
| PatientLabTest | gnuhealth.patient.lab.test | Orden de laboratorio | Órdenes |
| LabTestCriteria | gnuhealth.lab.test.critearea | Criterios normalidad | Estándares |
| LabResult | gnuhealth.lab.result | Resultado de prueba | Resultados |

### HEALTH_IMAGING

| Entidad | Tabla SQL | Descripción | Vista |
|---------|-----------|-------------|-------|
| ImagingTest | gnuhealth.imaging.test | Tipo de estudio | Catálogo |
| PatientImageRequest | gnuhealth.patient.imaging.test | Orden de imagen | Órdenes |
| ImagingResult | gnuhealth.imaging.result | Resultado imagen | Resultados |

### HEALTH_SURGERY

| Entidad | Tabla SQL | Descripción | Vista |
|---------|-----------|-------------|-------|
| Surgery | gnuhealth.surgery | Intervención quirúrgica | Cirugías |
| SurgeryProfessional | gnuhealth.surgery.professional | Equipo quirúrgico | Equipo |
| SurgicalProcedure | gnuhealth.surgical.procedure | Procedimiento realizado | Procedimientos |
| Complication | gnuhealth.surgery.complication | Complicación postop | Complicaciones |

### HEALTH_INPATIENT

| Entidad | Tabla SQL | Descripción | Vista |
|---------|-----------|-------------|-------|
| Hospitalization | gnuhealth.hospitalization | Registro de internación | Internación |
| PatientRounding | gnuhealth.patient.rounding | Ronda clínica diaria | Redondas |
| DischargedPlan | gnuhealth.patient.discharge.plan | Plan de alta | Alta |

### HEALTH_ICU

| Entidad | Tabla SQL | Descripción | Vista |
|---------|-----------|-------------|-------|
| PatientICU | gnuhealth.patient.icu | Registro en UCI | UCI Info |
| ICUAssessment | gnuhealth.icu.assessment | Evaluación de sistemas | Evaluación |
| GlasgowScale | gnuhealth.glasgow.coma.scale | Escala Glasgow Coma | Glasgow |
| APACHE2 | gnuhealth.apache2_score | Puntuación APACHE II | APACHE |

### HEALTH_GENETICS

| Entidad | Tabla SQL | Descripción | Vista |
|---------|-----------|-------------|-------|
| PatientGenetic | gnuhealth.patient.genetic.info | Historia genética | Genética |
| HumanGene | gnuhealth.human.gene | Gen humano referencia | Genes |

### HEALTH_PEDIATRICS

| Entidad | Tabla SQL | Descripción | Vista |
|---------|-----------|-------------|-------|
| PediatricInfo | gnuhealth.patient.pediatric_info | Información pediátrica | Pediátrico |
| NeonatalData | gnuhealth.newborn.data | Datos del RN | Neonatal |
| GrowthChart | gnuhealth.patient.growth_chart | Gráfico de crecimiento | Crecimiento |

### HEALTH_STOCK

| Entidad | Tabla SQL | Descripción | Vista |
|---------|-----------|-------------|-------|
| StockMove | stock.move | Movimiento de stock | Stock |
| StockLot | stock.lot | Lote de producto | Lotes |
| Medicament.stock_quantity | gnuhealth.medicament | Cantidad en stock | Stock Farmacia |

### HEALTH_INSURANCE

| Entidad | Tabla SQL | Descripción | Vista |
|---------|-----------|-------------|-------|
| InsurancePlan | gnuhealth.insurance.plan | Póliza de seguro | Seguros |
| Insurance | gnuhealth.insurance | Aseguradora del paciente | Cobertura |
| PriceList | sale.price_list | Tarifa por aseguradora | Tarificación |

### HEALTH_SOCIOECONOMICS

| Entidad | Tabla SQL | Descripción | Vista |
|---------|-----------|-------------|-------|
| SocioeconomicData | gnuhealth.patient.socioeconomic | Datos socioeconómicos | Social |
| FamilyFunctionality | gnuhealth.family.functionality | Funcionalidad familiar | Familia |

### HEALTH_LIFESTYLE

| Entidad | Tabla SQL | Descripción | Vista |
|---------|-----------|-------------|-------|
| LifestyleData | gnuhealth.patient.lifestyle | Información de estilo de vida | Lifestyle |
| DietaryHabits | gnuhealth.dietary.habits | Hábitos alimentarios | Dieta |
| PhysicalActivity | gnuhealth.physical.activity | Actividad física | Actividad |

---

## Estadísticas y Resumen

| Métrica | Cantidad |
|---------|----------|
| **Módulos Totales** | 53 |
| **Módulos Clínicos** | 12 |
| **Módulos Administrativos** | 9 |
| **Módulos de Demografía** | 5 |
| **Módulos de Bioinformática** | 3 |
| **Módulos de Codificación** | 5 |
| **Módulos de Enfermedades Especiales** | 3 |
| **Módulos de Seguridad** | 7 |
| **Módulos Pediátricos** | 2 |
| **Módulos de Imagenología Avanzada** | 2 |
| **Módulos de Referencia Global** | 2 |
| **Módulos de Salud Pública** | 1 |
| **Módulos de Calendario** | 2 |
| **Versión GNU Health** | 5.0.3 |
| **Versión Tryton** | 7.0.x |
| **Python Mínimo** | 3.10 |
| **Python Máximo** | <3.14 |

---

## Recomendaciones para Implementación

### Orden de Instalación Recomendado

1. **Fase 1 - Core Obligatorio:**
   - `health` (base)

2. **Fase 2 - Funcionalidad Clínica Básica:**
   - `health_nursing` (atención ambulatoria)
   - `health_lab` (laboratorio)
   - `health_imaging` (imagenología)

3. **Fase 3 - Especialidades:**
   - `health_inpatient` (hospitalización)
   - `health_surgery` (cirugía)
   - `health_genetics` (genética)
   - `health_pediatrics` (pediatría)

4. **Fase 4 - Soporte Integral:**
   - `health_icu` (cuidados críticos)
   - `health_stock` (gestión de medicamentos)
   - `health_services` (facturación)
   - `health_insurance` (seguros)

5. **Fase 5 - Contexto Social:**
   - `health_socioeconomics`
   - `health_lifestyle`
   - `health_disability`

6. **Fase 6 - Avanzado/Opcional:**
   - Módulos de codificación (ICD, ICPM)
   - Módulos de enfermedades especiales (NTD)
   - Módulos de integración (PACS/Orthanc)
   - Módulos de seguridad (Crypto)

### Consideraciones Técnicas

- **Rendimiento:** Los módulos de Laboratorio e Imagenología requieren bases de datos optimizadas
- **Integración DICOM:** health_orthanc requiere servidor Orthanc externo
- **Federación:** health_federation requiere configuración de red avanzada
- **Seguridad:** health_crypto añade overhead de procesamiento
- **Stock:** health_stock requiere módulo stock_lot de Tryton

---

## Documentación de Referencia

- **Homepage:** https://www.gnuhealth.org
- **Documentación:** https://docs.gnuhealth.org
- **Repositorio:** https://codeberg.org/gnuhealth/his
- **Contacto:** info@gnuhealth.org

---

**Fin del Análisis**  
Generado: 12 de Abril, 2026
