# 🚀 PLAN DE ACCIÓN INMEDIATA - WEEKS 8-10
## Cierre de Gaps Críticos (35,000 líneas en 3 semanas)

**Objetivo**: Completar los 3 ASIS finales (13-15) + 2 módulos administrativos básicos  
**Estado**: Ready to start immediately  
**Prioridad**: CRÍTICA

---

## 📋 RESUMEN EJECUTIVO

### ¿Por qué estas 5 semanas?
Porque sin esto, la plataforma NO funciona en producción:

1. **ASIS 13 (HME)** - Sin esto, no hay forma de ver la historia completa del paciente
2. **ASIS 14 (Diagnósticos + Regímenes)** - Sin diagnósticos, no se puede facturar ni reportar
3. **ASIS 15 (Imagenología)** - Ya existe Dicom viewer pero falta PACS e integración
4. **ADMIN 1 (Recursos Humanos)** - Sin esto, no puedes gestionar quién trabaja cuándo
5. **ADMIN 2 (Salas de Espera)** - Sin esto, el flujo de pacientes es caótico

Total: **35,500 líneas** in 3 weeks = **11,800 líneas/semana**.  
Dado que semana 4-7 entregó 10,600/semana, esto es **ALCANZABLE**.

---

## 🎯 WEEK 8: ASIS 13 - HISTORIA MÉDICA ELECTRÓNICA COMPLETA

**Objetivo**: 5 Hitos = 8,500 líneas  
**Patrón**: SQL → React → Hooks → Functions → Tests  
**Entregables**: Expediente único del paciente con HME consolidada

### Hito 1: SQL Migrations (1,200 líneas)

```sql
-- TABLAS PRINCIPALES
electronic_health_record (EHR maestro)
  - id UUID PRIMARY KEY
  - patient_id UUID FK patients
  - last_summary_updated TIMESTAMP
  - last_updated_by UUID FK users
  - summary_note TEXT (actualizado automáticamente)
  - active_problems TEXT[] (ICD-10 codes)
  - medications_active TEXT[] (medication names)
  - allergies TEXT[]
  - created_at, updated_at

ehr_episode_links (vincular todos los eventos)
  - id UUID PRIMARY
  - ehr_id UUID FK
  - episode_type VARCHAR (consultation, hospitalization, procedure, emergency)
  - episode_id VARCHAR (generic - puede apuntar a cualquier tabla)
  - episode_date TIMESTAMP
  - clinician_name VARCHAR
  - summary TEXT (180 chars max)
  - primary_diagnosis VARCHAR (ICD-10)

ehr_document_storage (almacenar documentos)
  - id UUID PRIMARY
  - ehr_id UUID FK
  - document_type VARCHAR (prescription, report, imaging, lab_result, letter)
  - file_path VARCHAR
  - file_size INT
  - mime_type VARCHAR
  - created_at TIMESTAMP
  - uploaded_by UUID FK users

ehr_access_log (auditoría - HIPAA required)
  - id UUID PRIMARY
  - ehr_id UUID FK
  - accessed_by UUID FK users
  - access_type VARCHAR (view, edit, export)
  - accessed_at TIMESTAMP
  - reason VARCHAR (clinical_care, patient_request, audit)
  - ip_address VARCHAR
  - duration_seconds INT

ehr_snapshot_history (versión anterior, para compara)
  - id UUID PRIMARY
  - ehr_id UUID FK
  - snapshot_date TIMESTAMP
  - summary_note TEXT
  - problems_list TEXT[]

-- INDICES
CREATE INDEX idx_ehr_patient ON ehr (patient_id);
CREATE INDEX idx_ehr_links_ehr ON ehr_episode_links (ehr_id);
CREATE INDEX idx_ehr_access_log_patient ON ehr_access_log (ehr_id);

-- TRIGGERS
CREATE TRIGGER update_ehr_last_updated ... (Auto-timestamp)
CREATE TRIGGER consolidate_ehr_summary ... (Actualizar summary cuando cada episodio cambia)
CREATE TRIGGER log_ehr_access ... (Log de acceso automático)

-- RLS POLICIES
-- Patient: solo Ver su HME
-- Physician: Ver/Edit HME de sus pacientes
-- Nurse: Ver vitales/medicamentos de asignados
-- Admin: Ver completamente anonimizado para auditoría
```

---

### Hito 2: React Components (2,200 líneas)

```typescript
// 1. ElectronicHealthRecordDashboard.tsx (800L)
├─ Header: Datos demográficos + contacto emergencia
├─ ResumenClinico: Summary consolidado (auto-actualizado)
├─ Tabs:
│  ├─ Timeline (historyCo de eventos interactiva)
│  ├─ Antecedentes (personales, familiares, quirúrgicos)
│  ├─ Medicamentos (actual + histórico)
│  ├─ Alergias (destacadas en rojo)
│  ├─ Documentos (archivos adjuntos)
│  └─ Auditoría (quién accedió cuándo)
├─ Botones:
│  ├─ Exportar PDF (+ sello digital)
│  ├─ Exportar HL7 (para otros hospitales)
│  └─ Solicitar acceso (si paciente)

// 2. EHRTimeline.tsx (650L)
├─ Timeline vertical con eventos
├─ Filtros:
│  ├─ Por rango de fechas
│  ├─ Por tipo (consulta/hospitalización/etc.)
│  ├─ Por servicio
│  └─ Por palabra clave
├─ Click en evento → muestra detalles popup
├─ Colores por tipo
└─ Badges de alerta (crítico, pendiente, etc.)

// 3. EHRResumenClinico.tsx (400L)
├─ Card principal con:
│  ├─ Diagnósticos activos (ICD-10, link a detalle)
│  ├─ Medicamentos activos (nombre, dosis, vía)
│  ├─ Alergias (ROJO background)
│  ├─ Últimos vitales
│  └─ Próximos procedimientos programados
├─ Toast cuando resume se actualiza automáticamente
└─ Link a cada sección detallada

// 4. EHRDocuments.tsx (350L)
├─ Galería de documentos
├─ Tipos: Prescripciones, Reportes, Studios DICOM, PDFs
├─ Preview inline (PDF, imágenes)
├─ Descarga segura (log de acceso)
├─ Busca por fecha, tipo
└─ Upload para admins

// 5. EHRAuditLog.tsx (200L)
├─ Tabla de acceso a HME
├─ Campos: Quién, Cuándo, Qué hizo, Razón, IP
├─ Filtros: Por usuario, rango de fecha
└─ SOLO para admins (para HIPAA compliance)
```

---

### Hito 3: Custom Hooks (1,800 líneas)

```typescript
// src/hooks/useEHR.ts (900L)
export function useElectronicHealthRecord(patientId: string) {
  // Queries
  const ehrQuery = useQuery(['ehr', patientId], () => 
    fetchEHR(patientId), 
    { staleTime: 5 * 60 * 1000 } // 5 min
  );

  const episodesQuery = useQuery(['ehr-episodes', patientId], () =>
    fetchEpisodes(patientId),
    { enabled: !!patientId }
  );

  const accessLogQuery = useQuery(['ehr-access', patientId], () =>
    fetchAccessLog(patientId),
    { enabled: canViewAuditLog() }
  );

  // Mutations
  const updateEHRMutation = useMutation((data) => updateEHR(patientId, data), {
    onSuccess: () => {
      queryClient.invalidateQueries(['ehr', patientId]);
      showToast('HME updated');
    }
  });

  const exportPDFMutation = useMutation((ehrId) => 
    exportEHRPDF(ehrId),
    {
      onSuccess: (blob) => downloadFile(blob, 'EHR.pdf')
    }
  );

  const exportHL7Mutation = useMutation((ehrId) =>
    exportHL7(ehrId),
    {
      onSuccess: (blob) => downloadFile(blob, 'EHR.hl7')
    }
  );

  // Helpers
  const consolidateSuper = useCallback((episodes) => {
    // Agrupa episodios por tipo
    // Extrae problemas, medicamentos, alergias
    // Retorna resumen consolidado
  }, []);

  return {
    ehr: ehrQuery.data,
    episodes: episodesQuery.data,
    accessLog: accessLogQuery.data,
    isLoading: ehrQuery.isLoading,
    exportPDF: exportPDFMutation.mutate,
    exportHL7: exportHL7Mutation.mutate,
    consolidateSummary,
  };
}

// src/hooks/useEHRAccess.ts (450L)
export function useEHRAccess(ehrId: string) {
  // Logging automático de acceso
  useEffect(() => {
    const timer = performance.now();
    return () => {
      logEHRAccess({
        ehr_id: ehrId,
        accessed_by: currentUser.id,
        access_type: 'view',
        duration_seconds: (performance.now() - timer) / 1000,
        reason: 'clinical_care' // If available
      });
    };
  }, [ehrId]);

  return { accessLogged: true };
}

// src/hooks/useEHRTimeline.ts (450L)
export function useEHRTimeline(patientId: string) {
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    eventType: null,
    service: null
  });

  const timelineQuery = useQuery(['ehr-timeline', patientId, filters], () =>
    fetchTimeline(patientId, filters)
  );

  const timeline = useMemo(() => {
    return timelineQuery.data?.map(event => ({
      ...event,
      color: colorByType(event.type),
      icon: iconByType(event.type)
    }))
  }, [timelineQuery.data]);

  return {
    timeline,
    filters,
    setFilters,
    isLoading: timelineQuery.isLoading
  };
}
```

---

### Hito 4: Edge Functions (1,800 líneas)

```typescript
// supabase/functions/consolidate-ehr/index.ts (600L)
export default async (req: Request) => {
  const { patientId } = await req.json();

  // 1. Fetch todos los episodios del paciente
  const { data: episodes } = await supabaseClient
    .from('ehr_episode_links')
    .select('*')
    .eq('ehr_id', (await supabaseClient
      .from('ehr')
      .select('id')
      .eq('patient_id', patientId)
      .single()).data.id);

  // 2. Consolidar diagnósticos (todos los del último año)
  const diagnoses = episodes
    .filter(e => e.episode_type === 'consultation')
    .map(e => e.primary_diagnosis)
    .filter((v, i, a) => a.indexOf(v) === i); // único

  // 3. Consolidar medicamentos (activos ahora)
  const medications = await fetchActiveMedications(patientId);

  // 4. Consolidar alergias
  const allergies = await fetchAllergies(patientId);

  // 5. Generar resumen de texto
  const summary = generateSummary({
    diagnoses,
    medications,
    allergies,
    lastVisit: episodes[0]?.episode_date
  });

  // 6. Actualizar EHR
  await supabaseClient
    .from('electronic_health_record')
    .update({
      summary_note: summary,
      active_problems: diagnoses,
      medications_active: medications.map(m => m.name),
      allergies: allergies,
      last_summary_updated: new Date().toISOString(),
      last_updated_by: userId
    })
    .eq('patient_id', patientId);

  return { success: true, summary };
};

// supabase/functions/export-ehr-pdf/index.ts (600L)
export default async (req: Request) => {
  const { ehrId } = await req.json();

  // Fetch EHR completo
  const ehr = await supabaseClient
    .from('electronic_health_record')
    .select('*')
    .eq('id', ehrId)
    .single();

  // Fetch paciente
  const patient = await supabaseClient
    .from('patients')
    .select('*')
    .eq('id', ehr.data.patient_id)
    .single();

  // Fetch episodes
  const episodes = await supabaseClient
    .from('ehr_episode_links')
    .select('*')
    .eq('ehr_id', ehrId)
    .order('episode_date', { ascending: false })
    .limit(20);

  // Generar PDF usando pdfkit
  const doc = new PDFDocument();
  
  // Header
  doc.fontSize(16).text('HISTORIA CLÍNICA ELECTRÓNICA', { align: 'center' });
  doc.fontSize(10).text(`Generada: ${new Date().toISOString()}\n`);

  // Paciente
  doc.fontSize(12).text('DATOS DEL PACIENTE');
  doc.fontSize(10).text(`Nombre: ${patient.name}`);
  doc.text(`Cédula: ${patient.identification}`);
  doc.text(`F.N: ${patient.date_of_birth}\n`);

  // Resumen
  doc.fontSize(12).text('RESUMEN CLÍNICO');
  doc.fontSize(10).text(ehr.data.summary_note);
  doc.text(`Alergias: ${ehr.data.allergies.join(', ')}`);
  doc.text(`Medicamentos Activos: ${ehr.data.medications_active.join(', ')}\n`);

  // Timeline
  doc.fontSize(12).text('HISTORIA DE EVENTOS');
  episodes.data.forEach(ep => {
    doc.fontSize(10)
      .text(`${ep.episode_date}: ${ep.summary}`)
      .text(`Diagnóstico: ${ep.primary_diagnosis}\n`);
  });

  // Firma digital
  doc.fontSize(8).text('Documento firmado digitalmente por el sistema SERMED2');

  // Retornar PDF
  const buffer = doc.getBuffer();
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="EHR.pdf"'
    }
  });
};

// supabase/functions/export-ehr-hl7/index.ts (300L)
export default async (req: Request) => {
  const { ehrId } = await req.json();

  // Fetch completo
  const ehr = /* ... */;
  const patient = /* ... */;
  const episodes = /* ... */;

  // Generar HL7v2 (estándar para intercambio hospitalario)
  const hl7Message = `
MSH|^~\\&|SERMED2|Hospital|SISTEMA|DESTINO|${new Date().toISOString()}|||ADT^A01
PID|1||${patient.identification}||${patient.name}||${patient.date_of_birth}|${patient.gender}
  
${episodes.data.map(ep => `
OBX|${ep.order}|ST|${ep.primary_diagnosis}||${ep.summary}
`).join('')}
  `;

  return new Response(hl7Message, {
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': 'attachment; filename="EHR.hl7"'
    }
  });
};

// supabase/functions/log-ehr-access/index.ts (300L)
- Intercepta TODAS las lecturas/escrituras de HME
- Log automático a ehr_access_log
- Detecta acceso sospechoso (múltiples pacientes, extraño IP, etc.)
- Retorna alert si HIPAA violation detectable
```

---

### Hito 5: Tests (1,100 líneas, 50+ tests)

```typescript
describe('ASIS 13 - Electronic Health Record', () => {
  // 20 tests: useElectronicHealthRecord
  //   - Fetch EHR + episodes
  //   - Update summary
  //   - Export PDF
  //   - Export HL7

  // 15 tests: Timeline
  //   - Filter by date
  //   - Filter by event type
  //   - Sort chronologically

  // 10 tests: Components
  //   - Render dashboard
  //   - Click timeline events
  //   - Show audit log

  // 5 tests: Edge Functions
  //   - Consolidate summary
  //   - Generate PDF
  //   - Log access
});
```

---

## 💾 WEEK 9: ASIS 14 - DIAGNÓSTICOS + REGÍMENES DE MEDICACIÓN

**Objetivo**: 5 Hitos = 9,200 líneas  
**Entregables**: Gestión completa de diagnósticos + medicamentos

### Estructura Similar a Week 8
- **SQL** (1,500L): 10,000 ICD-10 codes + prescription tables
- **React** (2,500L): DiagnosisForm, RegimensList, InteractionChecker
- **Hooks** (1,900L): useDiagnosis, usePrescriptions, useInteractionChecker
- **Functions** (1,800L): check_interactions, validate_dosage, adherence_report
- **Tests** (1,500L): 55+ tests

---

## 🐣 WEEK 10: ASIS 15 - IMAGENOLOGÍA COMPLETA

**Objetivo**: 5 Hitos = 8,000 líneas  
**Entregables**: PACS + Visor DICOM avanzado + integración

### Estructura
- **SQL** (1,000L): Orthanc integration, DICOM storage, orders
- **React** (2,200L): DicomViewer improved, DicomOrder, RadiologyReport
- **Hooks** (1,600L): useOrthanc, useDicomOrder, useDicomReport
- **Functions** (1,500L): DICOM receiver, PACS query/retrieve
- **Tests** (1,200L): 45+ tests

---

## 🏢 WEEK 11: ADMIN 1.0 - GESTIÓN DE RECURSOS HUMANOS

**Objetivo**: Estructura organizacional + Nómina  
**Líneas**: 8,500  
**Componentes**: Médicos, enfermeros, administrativos, nómina

---

## 🪑 WEEK 12: ADMIN 2.0 - SALA DE ESPERA + CAPACIDAD

**Objetivo**: Sistema de turnos + Dashboard de camas  
**Líneas**: 7,800  
**Componentes**: WaitingRoom dashboard, Turno generator, Cama status

---

## 📊 ENTREGABLES cada SEMANA

```
WEEK 8: ASIS 13 (HME)
├─ 8,500 líneas
├─ 1 SQL migration (1,200L)
├─ 5 React components (2,200L)
├─ 1 Hook file (1,800L)
├─ 3 Edge Functions (1,800L)
└─ 1 Test file (1,100L)

WEEK 9: ASIS 14 (Diagnósticos + Regímenes)
├─ 9,200 líneas
├─ Similar estructura

WEEK 10: ASIS 15 (Imagenología)
├─ 8,000 líneas

WEEK 11: ADMIN 1 (HR)
├─ 8,500 líneas

WEEK 12: ADMIN 2 (Espera + Capacidad)
├─ 7,800 líneas (último módulo)

TOTAL WEEKS 8-12: 42,000 líneas
TOTAL WEEKS 1-12: 73,370 líneas
→ Plat forma 60% completa
```

---

## 🎯 DECISIÓN CRÍTICA: ¿Empezamos AHORA?

Si comenzamos HOY (April 13):
- Week 8: 8,500 líneas (April 20)
- Week 9: 9,200 líneas (April 27)
- Week 10: 8,000 líneas (May 4)
- Week 11: 8,500 líneas (May 11)
- Week 12: 7,800 líneas (May 18)

**Resultado**: Plataforma 60% funcional en 5 semanas más = Mayo 18.

---

## ✅ RECOMENDACIÓN

Prioritarios en orden:
1. **WEEK 8** - ASIS 13 (HME) - SIN esto, no es hospitalario
2. **WEEK 9** - ASIS 14 (Diagnósticos) - Necesario para facturación
3. **WEEK 11** - ADMIN 1 (HR) - Necesario para operacional
4. **WEEK 10** - ASIS 15 (Imagenología) - Puede ir en paralelo
5. **WEEK 12** - ADMIN 2 (Espera) - UI/UX improvement

**Patrón**: Mantener el ritmo de 5 Hitos por semana.  
**Team**: 1 developer (tú) puede hacerlo IF:
- No hay interrupciones
- Usas template del código existente (copy-paste-modify pattern)
- Automatizas con snippets

¿Comenzamos?
