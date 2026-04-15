# 🔧 MIGRACIONES SQL Y EXTENSIONES POSTGRESQL - HOSIX

**Documento Complementario**  
**Estado**: Análisis de Migraciones SQL Aplicadas  

---

## 📂 SECUENCIA DE MIGRACIONES APLICADAS

### 1. Base Schema (20250116_001)

**Archivo**: `20250116_001_hosix_base_schema.sql`

**Tablas Creadas**:
- `hosix_departamentos`
- `hosix_servicios`
- `hosix_perfiles`
- `hosix_usuarios`
- `hosix_permisos_modulos`
- `hosix_sesiones`
- `hosix_auditoria`

**Índices**: 10+  
**RLS**: Habilitado en auditoria  
**Datos Semilla**: Perfiles (admin, medico, enfermera, administrador_centro)

---

### 2. Pacientes e Historia Clínica (20250116_002)

**Archivo**: `20250116_002_hosix_pacientes_historia_clinica.sql`

**Tablas Creadas**:
- `hosix_pacientes` ⭐
- `hosix_historia_clinica`
- `hosix_pacientes_contactos`
- `hosix_pacientes_avisos`
- `hosix_pacientes_documentos`

**Cambios Claves**:
- RLS habilitado en todas (lectura general, escritura general)
- Índices: Búsqueda por PPI, documento, nombre
- `alergias`, `antecedentes_familiares`, `antecedentes_personales` como JSONB

**Datos Semilla**:
```sql
INSERT INTO hosix_pacientes (
  ppi, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
  fecha_nacimiento, sexo, tipo_documento, numero_documento,
  direccion, ciudad, provincia, email, grupo_sanguineo, activo
) VALUES
('PPI-0001', 'Juan', 'Carlos', 'Pérez', 'García', ...),
('PPI-0002', 'María', 'Elena', 'González', 'López', ...),
('PPI-0003', 'Fernando', 'José', 'Martínez', 'Rodríguez', ...)
```

---

### 3. Urgencias, Citas y Agendas (20250116_003)

**Archivo**: `20250116_003_hosix_urgencias_citas_agendas.sql`

**Tablas Creadas**:
- `hosix_urgencias_episodios` ⭐
- `hosix_urgencias_triage`
- `hosix_agendas`
- `hosix_agendas_horarios`
- `hosix_citas`

**Peculiaridades**:
- `nivel_triage` INT (número del 1-5 de Manchester)
- `signos_vitales` JSONB con estructura `{temperatura, presion_arterial, fc, fr, sat_o2}`
- `estado_cita` puede ser 'programada', 'confirmada', 'cancelada', 'atendida'
- `es_teleconsulta` BOOLEAN con `url_teleconsulta` VARCHAR

**Índices**: 10+ para búsquedas por estado, fecha, agenda

**RLS**: Generalmente permisivo (true)

**Datos Semilla**:
```sql
INSERT INTO hosix_departamentos (codigo, nombre) VALUES
('GRAL', 'Medicina General'),
('URG', 'Urgencias'),
('CIR', 'Cirugía');

INSERT INTO hosix_servicios (codigo, nombre, tipo_servicio) VALUES
('CONS', 'Consulta Externa', 'consulta'),
('URG_ATN', 'Atención Urgencias', 'urgencia'),
('INTER', 'Internamiento', 'hospitalizacion');

INSERT INTO hosix_agendas (codigo, nombre, tipo_agenda, duracion_default_minutos) VALUES
('AGENDA_001', 'Consulta Medicina General', 'consulta', 15);
```

---

### 4. Hospitalización, Quirófanos y Farmacia (20250116_004)

**Archivo**: `20250116_004_hosix_hospitalizacion_quirofanos_farmacia.sql`

**Tablas Creadas**:
- `hosix_camas` ⭐
- `hosix_hospitalizacion_episodios` ⭐
- `hosix_hospitalizacion_traslados`
- `hosix_quirofanos`
- `hosix_quirofanos_intervenciones`
- `hosix_medicamentos` ⭐
- `hosix_prescripciones` ⭐
- `hosix_dispensaciones`

**Campos Notables**:
- `hosix_prescripciones`: `estado` puede ser 'activa', 'completada', 'cancelada', 'suspendida'
- `hosix_medicamentos`: `requiere_receta` BOOLEAN, `controlado` BOOLEAN
- `hosix_quirofanos_intervenciones`:
  - `tipo_anestesia`: VARCHAR(50)
  - `complicaciones`: JSONB array
  - Equipo: cirujano_principal_id, anestesiologo_id, instrumentista_id, circulante_id

**RLS**: Mayormente permisivo

**Datos Semilla**:
```sql
INSERT INTO hosix_quirofanos (codigo, nombre) VALUES
('QF_001', 'Quirófano 1'),
('QF_002', 'Quirófano 2');

INSERT INTO hosix_medicamentos (codigo, nombre_comercial, principio_activo) VALUES
('MED_001', 'Amoxicilina', 'Amoxicilina'),
('MED_002', 'Paracetamol', 'Paracetamol'),
('MED_003', 'Ibuprofeno', 'Ibuprofeno');

INSERT INTO hosix_camas (codigo, nombre, tipo_cama) VALUES
('CAMA_001', 'Cama 1 - Medicina General', 'general'),
('CAMA_002', 'Cama 2 - Medicina General', 'general'),
('CAMA_003', 'Cama 3 - Cuidados Intensivos', 'uci');
```

---

### 5. Facturación y Reportes (20250116_005)

**Archivo**: `20250116_005_hosix_facturacion_reportes.sql`

**Tablas Creadas** (Financiero):
- `hosix_facturas` (no documentada en análisis anterior)
- `hosix_detalles_factura`
- `hosix_reportes_configuracion`

---

### 6. Almacenes (20250122_009)

**Archivo**: `20250122_009_hosix_almacenes.sql`

**Tablas Creadas**:
- `hosix_almacenes`
- `hosix_ubicaciones`
- `hosix_existencias`
- `hosix_movimientos_almacen`

**Relación con Farmacia**:
- Link a `hosix_medicamentos`
- Seguimiento de existencias, lotes, caducidad

---

### 7. Recobros (20250121_007)

**Archivo**: `20250121_007_hosix_recobros.sql`

**Tablas**:
- `hosix_recobros`
- `hosix_recobros_detalles`
- `hosix_recobros_pagos`

---

### 8. Suministros (20250121_008)

**Archivo**: `20250121_008_hosix_suministros.sql`

**Tablas**:
- `hosix_articulos`
- `hosix_familias_articulos`
- `hosix_grupos_articulos`
- `hosix_unidades_medida`
- `hosix_ubicaciones_almacen`

**Nota**: Suministros != Medicamentos (scope diferente)

---

### 9. CPOE - Prescripciones Electrónicas (20250122_011)

**Archivo**: `20250122_011_hosix_cpoe_prescripciones.sql`

**Tabla Creada**:
- `hosix_cpoe_prescripciones` ⭐

**Cambios**:
- **CDS Alertas Integradas**:
  - `tiene_alerta_interaccion` BOOLEAN
  - `tiene_alerta_alergia` BOOLEAN
  - `tiene_alerta_dosis` BOOLEAN
  - `alertas_ignoradas` JSONB (auditoría de alertas descartadas)

- **Firma Electrónica**:
  - `firmada` BOOLEAN
  - `fecha_firma` TIMESTAMPTZ
  - `hash_firma` VARCHAR(255)

- **Instrucciones**:
  - `instrucciones_paciente` TEXT (en lenguaje claro)
  - `observaciones_medicas` TEXT (para equipo médico)

**Índices**: Paciente, Médico, Estado, Fecha inicio, Medicamento

**RLS**: SELECT/INSERT/UPDATE permitidos (true)

---

### 10. Servicios - Tipos de Ingreso (20250122_012)

**Archivo**: `20250122_012_hosix_servicios_tipos_ingreso.sql`

**Cambios**:
```sql
ALTER TABLE hosix_servicios 
ADD COLUMN IF NOT EXISTS atiende_urgencias BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS atiende_externa BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS atiende_hospitalizacion BOOLEAN DEFAULT false;

-- Índice compuesto para filtros comunes
CREATE INDEX idx_hosix_servicios_tipos_ingreso 
ON hosix_servicios(atiende_urgencias, atiende_externa, atiende_hospitalizacion)
WHERE activo = true;
```

**Migración de Datos**:
```sql
UPDATE hosix_servicios 
SET 
  atiende_urgencias = CASE WHEN tipo_servicio = 'urgencia' THEN true ELSE false END,
  atiende_externa = CASE WHEN tipo_servicio IN ('consulta', 'externa') THEN true ELSE false END,
  atiende_hospitalizacion = CASE WHEN tipo_servicio IN ('hospitalizacion', 'internamiento') THEN true ELSE false END
WHERE atiende_urgencias = false AND atiende_externa = false AND atiende_hospitalizacion = false;
```

**Impacto**: AdmisionCentralForm.tsx usa estos flags para filtrar servicios según tipo_ingreso

---

### 11. Médicos - Modulo Clínico ASIS 1 (20250206_011)

**Archivo**: `20250206_011_hosix_medicos_asis_1.sql`

**Tablas Creadas**:
- `hosix_diagnosticos_catalogo` ⭐ (CIE-10/SNOMED CT)
- `hosix_ordenes_medicas` ⭐
- `hosix_diagnosticos_pacientes`
- `hosix_consultas_medicas`
- `hosix_diario_clinico_medico`

**Estructura `hosix_diagnosticos_catalogo`**:
```sql
codigo_cie10 VARCHAR(10) UNIQUE      -- Ej: "I10"
codigo_icd10 VARCHAR(10)             -- Equivalente ICD-10
codigo_snomed VARCHAR(20) UNIQUE     -- Ej: "59621000"
nombre_diagnostico VARCHAR(255)
descripcion TEXT
capitulo_cie10 VARCHAR(50)           -- Ej: "Enfermedades cardiovasculares"
categoria_snomed VARCHAR(100)
es_cronica BOOLEAN
requiere_seguimiento BOOLEAN
es_notificable BOOLEAN
```

**Índices en Diagnósticos**:
```sql
CREATE INDEX idx_diagnosticos_catalogo_cie10 ON ...
CREATE INDEX idx_diagnosticos_catalogo_snomed ON ...
CREATE INDEX idx_diagnosticos_catalogo_nombre ON ...
CREATE INDEX idx_diagnosticos_catalogo_activo ON ...
```

**RLS en `hosix_diagnosticos_catalogo`**:
```sql
-- Lectura pública
CREATE POLICY "Diagnósticos lectura pública"
  ON hosix_diagnosticos_catalogo
  FOR SELECT USING (true);

-- Solo admin escribe
CREATE POLICY "Diagnósticos solo admin puede escribir"
  ON hosix_diagnosticos_catalogo
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profesionales_sanitarios
      WHERE user_id = auth.uid() AND perfil = 'Administrador'
    )
  );
```

**RLS en `hosix_ordenes_medicas`**:
```sql
CREATE POLICY "Médicos ven sus órdenes"
  ON hosix_ordenes_medicas
  FOR SELECT USING (
    medico_asignado_id = (SELECT id FROM profesionales_sanitarios WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM profesionales_sanitarios
      WHERE user_id = auth.uid() AND perfil = 'Administrador'
    )
  );
```

---

### 12. Quirófanos - ASIS 3 (20250206_013)

**Archivo**: `20250206_013_hosix_quirofanos_asis_3.sql`

**Tablas Creadas**:
- `hosix_quirofanos_bloques`
- `hosix_quirofanos_salas`
- `hosix_quirofanos_equipos`
- `hosix_quirofanos_programaciones` ⭐
- `hosix_quirofanos_diario`
- `hosix_quirofanos_mantenimiento`
- `hosix_quirofanos_preferencias_cirujano`

**Estructura `hosix_quirofanos_programaciones`**:
```sql
id UUID PRIMARY KEY
sala_id UUID → hosix_quirofanos_salas(id)
paciente_id UUID → hosix_pacientes(id)
fecha_programada TIMESTAMPTZ
hora_inicio_estimada TIME
duracion_estimada_minutos INT
procedimiento_principal TEXT
procedimientos_secundarios JSONB
tipo_intervencion VARCHAR(50)
tipo_anestesia VARCHAR(50)
cirujano_principal_id UUID → profesionales_sanitarios(id)
anestesiologo_id UUID → profesionales_sanitarios(id)
instrumentista_id UUID → profesionales_sanitarios(id)
circulante_id UUID → profesionales_sanitarios(id)
equipo_medico JSONB
fecha_inicio_real TIMESTAMPTZ
fecha_fin_real TIMESTAMPTZ
estado VARCHAR(50)  -- programada|en_curso|completada|cancelada
motivo_cancelacion TEXT
complicaciones JSONB
observaciones TEXT
```

---

### 13. Interconsultas - ASIS 11 (20250206_014)

**Archivo**: `20250206_014_hosix_interconsultas_asis_11.sql`

**Tablas Creadas**:
- `hosix_interconsultas_solicitudes`
- `hosix_interconsultas_asignaciones`
- `hosix_interconsultas_evaluaciones`
- `hosix_interconsultas_internalizaciones`
- `hosix_interconsultas_derivaciones_externas`

---

### 14. Fármacos - Interacciones (20250205_012)

**Archivo**: `20250205_012_hosix_drug_interactions.sql`

**Tabla Creada**:
- `hosix_drug_interactions`

**Estructura**:
```sql
id UUID PRIMARY KEY
medicamento_a UUID → hosix_medicamentos(id)
medicamento_b UUID → hosix_medicamentos(id)
tipo_interaccion VARCHAR(50)     -- minor|moderate|major|severe
descripcion TEXT
recomendacion TEXT
severidad VARCHAR(20)
created_at TIMESTAMPTZ
```

**Uso**: Edge function `cds-engine` lo consulta para validar prescripciones

---

### 15. Enfermería (20250205_010)

**Archivo**: `20250205_010_hosix_enfermeria.sql`

**Tablas**:
- `hosix_enfermeria_signos_vitales`
- `hosix_enfermeria_constancia`
- `hosix_enfermeria_control_paciente`

---

### 16. Laboratorio - Canonical (20260412120000)

**Archivo**: `20260412120000_hosix_laboratorio_canonical.sql`

**Tablas Creadas**:
- `hosix_laboratorio_ordenes`
- `hosix_laboratorio_muestras`
- `hosix_laboratorio_resultados`
- `hosix_laboratorio_interpretaciones`

**Estructura**:
```sql
hosix_laboratorio_ordenes:
  id, paciente_id, medico_solicitante_id, fecha_orden, estado

hosix_laboratorio_muestras:
  id, orden_id, tipo_muestra, enfermero_toma_id, fecha_toma

hosix_laboratorio_resultados:
  id, muestra_id, prueba, valor, unidad, rango_normal, analista_id

hosix_laboratorio_interpretaciones:
  id, resultado_id, interpretacion, medico_interpreta_id, fecha_interpretacion
```

---

---

## 🔗 RELACIONES SQL - VISTA GENERAL

### Gráfico de Referencias

```sql
-- De RENAPROSA
profesionales_sanitarios ←─┐
                            │
                            ├─→ hosix_ordenes_medicas.medico_asignado_id
                            ├─→ hosix_diagnosticos_pacientes.medico_id
                            ├─→ hosix_consultas_medicas.medico_id
                            ├─→ hosix_diario_clinico_medico.medico_id
                            ├─→ hosix_urgencias_episodios.medico_responsable_id
                            ├─→ hosix_hospitalizacion_episodios.medico_responsable_id
                            ├─→ hosix_quirofanos_programaciones.{cirujano,anestesiologo,instrumentista,circulante}_id
                            ├─→ hosix_cpoe_prescripciones.medico_id
                            ├─→ hosix_laboratorio_ordenes.medico_solicitante_id
                            ├─→ hosix_laboratorio_muestras.enfermero_toma_id
                            ├─→ hosix_laboratorio_resultados.analista_id
                            ├─→ hosix_laboratorio_interpretaciones.medico_interpreta_id
                            └─→ hosix_historia_clinica.profesional_id

hosix_pacientes ←───────────┐
                             │
                             ├─→ hosix_urgencias_episodios.paciente_id
                             ├─→ hosix_hospitalizacion_episodios.paciente_id
                             ├─→ hosix_citas.paciente_id
                             ├─→ hosix_ordenes_medicas.paciente_id
                             ├─→ hosix_diagnosticos_pacientes.paciente_id
                             ├─→ hosix_consultas_medicas.paciente_id
                             ├─→ hosix_prescripciones.paciente_id
                             ├─→ hosix_cpoe_prescripciones.paciente_id
                             ├─→ hosix_quirofanos_programaciones.paciente_id
                             ├─→ hosix_laboratorio_ordenes.paciente_id
                             └─→ hosix_historia_clinica.paciente_id

hosix_servicios ←──────────┐
                            │
                            ├─→ hosix_hospitalizacion_episodios.servicio_id
                            ├─→ hosix_camas.servicio_id
                            ├─→ hosix_agendas.servicio_id
                            └─→ hosix_urgencias_episodios.servicio (VARCHAR)

hosix_diagnosticos_catalogo ←──┐
                                │
                                └─→ hosix_diagnosticos_pacientes.diagnostico_id
```

---

## 🚨 CONSIDERACIONES DE CONFLICTO REAL

### Problema Potencial: Admisión Central

**Ubicación**: `AdmisionCentralForm.tsx` línea ~254-280

```typescript
// PROBLEMA: ¿Qué tabla se usa para almacenar episodio?
const tabla: string
if (formData.tipoIngreso === 'urgencias') {
  tabla = 'hosix_urgencias_episodios'
  // ...
} else if (formData.tipoIngreso === 'hospitalizacion') {
  tabla = 'hosix_hospitalizacion_episodios'  // ⚠️ Aquí se crea episodio
  episodioData.cama_id = null
  episodioData.fecha_ingreso = new Date().toISOString()
} else {
  tabla = 'hosix_citas'  // Consulta externa
  episodioData.hora_cita = new Date().toISOString()
  episodioData.estado_cita = 'confirmada'
}
```

**Issue**: Si `hospita lizacion_episodios.cama_id` está NOT NULL (depende de schema), la inserción falla.

---

### Inconsistencia: Profesionales Sanitarios

**Problema**:
1. En Ad misión Central se busca médicos en `profesionales_sanitarios` tabla RENAPROSA
2. RLS policy de `hosix_ordenes_medicas` asume `profesionales_sanitarios` accessible

```typescript
// AdmisionCentralForm línea ~270
.from('profesionales_sanitarios')
.select('id, primer_nombre, primer_apellido')
.eq('servicio_id', formData.servicioId)

// BUT: profesionales_sanitarios es tabla de RENAPROSA
// ¿Tiene permisos RLS? ¿Tiene columna servicio_id?
```

---

## ✅ CHECKLIST DE APLICACIÓN CORRECTA

- [ ] Todas las 8 migraciones base aplicadas (001-005)
- [ ] Módulo Médicos ASIS 1 (011) aplicado
- [ ] Quirófanos ASIS 3 (013) aplicado
- [ ] Interconsultas ASIS 11 (014) aplicado
- [ ] Laboratorio Canonical (20260412) aplicado
- [ ] Tablas `hosix_medicamentos` pobladas
- [ ] `hosix_diagnosticos_catalogo` poblada con CIE-10/SNOMED
- [ ] Índices verificados en database
- [ ] RLS policies activas en tablas críticas
- [ ] `profesionales_sanitarios` accessible desde HOSIX
- [ ] Servicios tienen flags `atiende_urgencias`, etc.
- [ ] Edge functions desplegadas (cds-engine, fhir-api, etc.)

---

**Última Actualización**: 2026-04-15
