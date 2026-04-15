# 🏥 ANÁLISIS EXHAUSTIVO DE ARQUITECTURA HOSIX
## Mapeo Completo de Tablas, Dependencias y Llamadas a BD

**Fecha**: Abril 15, 2026  
**Estado**: ✅ Análisis Completado  
**Fuentes**: Lectura directa de código TypeScript, migraciones SQL y edge functions  

---

## 📋 TABLA DE CONTENIDOS

1. [Esquema de Tablas HOSIX](#esquema-de-tablas-hosix)
2. [Relaciones y Foreign Keys](#relaciones-y-foreign-keys)
3. [RLS Policies](#rls-policies)
4. [Edge Functions](#edge-functions)
5. [Hooks de React Query](#hooks-de-react-query)
6. [Integraciones RENAPROSA](#integraciones-renaprosa)
7. [Extensiones PostgreSQL Requeridas](#extensiones-postgresql-requeridas)

---

## 🗄️ ESQUEMA DE TABLAS HOSIX

### 1. TABLAS BASE Y CONFIGURACIÓN

#### `hosix_departamentos`
```sql
id                  UUID PRIMARY KEY
codigo              VARCHAR(20) UNIQUE
nombre              VARCHAR(255)
descripcion         TEXT
centro_salud_id     UUID
activo              BOOLEAN DEFAULT true
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```
**Índices**: Código, Activo  
**Uso**: Agrupación de servicios por departamento

---

#### `hosix_servicios`
```sql
id                  UUID PRIMARY KEY
codigo              VARCHAR(20) UNIQUE
nombre              VARCHAR(255)
descripcion         TEXT
departamento_id     UUID → REFERENCES hosix_departamentos(id)
tipo_servicio       VARCHAR(50)
atiende_urgencias   BOOLEAN DEFAULT false
atiende_externa     BOOLEAN DEFAULT false
atiende_hospitalizacion BOOLEAN DEFAULT false
activo              BOOLEAN DEFAULT true
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```
**Índices**: Código, Activo, Tipos de ingreso  
**Queries desde UI**: [AdmisionCentralForm.tsx](src/components/hosix/admision/AdmisionCentralForm.tsx) línea ~135
```typescript
.from('hosix_servicios')
.select('id, nombre, codigo')
.eq('activo', true)
.eq('atiende_urgencias', true)  // o atiende_hospitalizacion, atiende_externa
.order('nombre')
```

---

#### `hosix_perfiles`
```sql
id              UUID PRIMARY KEY
codigo          VARCHAR(50) UNIQUE
nombre          VARCHAR(255)
descripcion     TEXT
nivel_acceso    INT DEFAULT 1
activo          BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```
**Perfiles precargados**:
- `admin` (nivel 10)
- `medico` (nivel 5)
- `enfermera` (nivel 4)
- `administrador_centro` (nivel 7)

---

### 2. TABLAS DE PACIENTES

#### `hosix_pacientes` ⭐ CRÍTICA
```sql
id                      UUID PRIMARY KEY
ppi                     VARCHAR(20) UNIQUE
primer_nombre           VARCHAR(100)
segundo_nombre          VARCHAR(100)
primer_apellido         VARCHAR(100)
segundo_apellido        VARCHAR(100)
fecha_nacimiento        DATE
sexo                    VARCHAR(10)
tipo_documento          VARCHAR(50)
numero_documento        VARCHAR(50)
pais_documento          VARCHAR(100)
direccion               TEXT
ciudad                  VARCHAR(100)
provincia               VARCHAR(100)
codigo_postal           VARCHAR(20)
telefono_fijo           VARCHAR(20)
telefono_movil          VARCHAR(20)
email                   VARCHAR(255)
grupo_sanguineo         VARCHAR(5)
alergias                JSONB DEFAULT '[]'
antecedentes_familiares JSONB DEFAULT '[]'
antecedentes_personales JSONB DEFAULT '[]'
aseguradora_principal_id UUID
numero_poliza           VARCHAR(50)
activo                  BOOLEAN DEFAULT true
fallecido               BOOLEAN DEFAULT false
fecha_fallecimiento     DATE
centro_registro_id      UUID
created_at              TIMESTAMPTZ
updated_at              TIMESTAMPTZ
```

**Índices**: PPI, Documento, Nombre, Activo  
**RLS**: `pacientes_read_policy`, `pacientes_insert_policy`, `pacientes_update_policy`  

**Queries desde Hooks**:
```typescript
// useHosixPacientes.ts
// Búsqueda por PPI/nombre
.from('hosix_pacientes')
.select('*')
.or(`ppi.ilike.%${searchPaciente}%,primer_nombre.ilike.%${searchPaciente}%,...`)

// Generación secuencial de PPI
.from('hosix_pacientes')
.select('ppi')
.order('ppi', { ascending: false })
.limit(1)

// Búsqueda de duplicados
.from('hosix_pacientes')
.select('*')
.eq('numero_documento', numero_documento)
```

---

#### `hosix_pacientes_contactos`
```sql
id              UUID PRIMARY KEY
paciente_id     UUID → REFERENCES hosix_pacientes(id)
tipo_contacto   VARCHAR(50)
nombre          VARCHAR(255)
relacion        VARCHAR(100)
telefono        VARCHAR(20)
email           VARCHAR(255)
es_emergencia   BOOLEAN DEFAULT false
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

---

#### `hosix_pacientes_avisos`
```sql
id              UUID PRIMARY KEY
paciente_id     UUID → REFERENCES hosix_pacientes(id)
tipo_aviso      VARCHAR(100) NOT NULL
titulo          VARCHAR(255)
descripcion     TEXT
severidad       VARCHAR(20)
activo          BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

---

#### `hosix_pacientes_documentos`
```sql
id              UUID PRIMARY KEY
paciente_id     UUID → REFERENCES hosix_pacientes(id)
tipo_documento  VARCHAR(100)
nombre          VARCHAR(255)
url_documento   TEXT
fecha_documento DATE
descripcion     TEXT
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

---

### 3. HISTORIA CLÍNICA ELECTRÓNICA (HCE)

#### `hosix_historia_clinica`
```sql
id                 UUID PRIMARY KEY
paciente_id        UUID → REFERENCES hosix_pacientes(id)
tipo_entrada       VARCHAR(50)  -- 'triage', 'consulta', 'urgencia', 'hospitalización'
episodio_id        UUID         -- Relación con episodio actual
fecha_entrada      TIMESTAMPTZ
titulo             VARCHAR(255)
contenido          TEXT
datos_estructurados JSONB DEFAULT '{}'
profesional_id     UUID
servicio_id        UUID
adjuntos           JSONB DEFAULT '[]'
firmado            BOOLEAN DEFAULT false
fecha_firma        TIMESTAMPTZ
confidencial       BOOLEAN DEFAULT false
created_at         TIMESTAMPTZ
updated_at         TIMESTAMPTZ
```

**RLS**: Lectura sin restricciones (true)  
**Índices**: Paciente, Fecha, Tipo  

**Queries desde AdmisionCentralForm**:
```typescript
.from('hosix_hce_entradas')
.insert([{
  paciente_id: paciente.id,
  episodio_id: episodioId,
  tipo_entrada: 'triage|consulta',
  contenido: `Admisión ${formData.tipoIngreso}: ${formData.motivoConsulta}`,
  registrado_por: user?.id
}])
```

---

### 4. MÓDULO DE URGENCIAS

#### `hosix_urgencias_episodios` ⭐ CRÍTICA
```sql
id                      UUID PRIMARY KEY
paciente_id             UUID → REFERENCES hosix_pacientes(id)
fecha_entrada           TIMESTAMPTZ NOT NULL DEFAULT now()
lugar_entrada           VARCHAR(100)
procedencia             VARCHAR(100)
box_asignado            VARCHAR(50)
nivel_triage            INT
clasificacion_inicial   TEXT
observaciones_triage    TEXT
medico_responsable_id   UUID → REFERENCES profesionales_sanitarios(id)
diagnostico_inicial     TEXT
diagnostico_final       TEXT
fecha_salida            TIMESTAMPTZ
tipo_salida             VARCHAR(50)
destino_salida          VARCHAR(255)
estado                  VARCHAR(50) DEFAULT 'en_proceso'
created_at              TIMESTAMPTZ
updated_at              TIMESTAMPTZ
```

**Índices**: Paciente, Fecha entrada, Estado  
**RLS**: Lectura pública, INSERT/UPDATE permitidos

**Queries desde useHosixUrgencias.ts**:
```typescript
// Obtener episodios activos
.from('hosix_urgencias_episodios')
.select(`
  *,
  paciente:hosix_pacientes(id, ppi, primer_nombre, primer_apellido, fecha_nacimiento),
  medico:profesionales_sanitarios(id, nombre_completo)
`)
.eq('estado', 'en_proceso')
.order('fecha_entrada', { ascending: false })

// Registrar entrada
.insert([{
  paciente_id,
  fecha_entrada: new Date().toISOString(),
  lugar_entrada,
  procedencia,
  box_asignado,
  estado: 'en_proceso'
}])
```

---

#### `hosix_urgencias_triage`
```sql
id                  UUID PRIMARY KEY
episodio_id         UUID → REFERENCES hosix_urgencias_episodios(id)
fecha_evaluacion    TIMESTAMPTZ DEFAULT now()
evaluador_id        UUID
nivel_urgencia      INT NOT NULL
motivo_consulta     TEXT
signos_vitales      JSONB       -- {temperatura, presion_arterial, fc, fr, sat_o2}
sintomas            JSONB
observaciones       TEXT
created_at          TIMESTAMPTZ
```

**Índices**: Episodio  

**Queries desde useHosixUrgencias.ts**:
```typescript
.from('hosix_urgencias_triage')
.insert([{
  episodio_id,
  fecha_evaluacion: new Date().toISOString(),
  evaluador_id: userData?.user?.id,
  nivel_urgencia: triageData.nivel_urgencia,
  motivo_consulta: triageData.motivo_consulta,
  signos_vitales: triageData.signos_vitales || {},
  sintomas: triageData.sintomas || [],
  observaciones: triageData.observaciones
}])
```

---

### 5. MÓDULO DE CITAS Y AGENDAS

#### `hosix_agendas`
```sql
id                      UUID PRIMARY KEY
codigo                  VARCHAR(50) UNIQUE
nombre                  VARCHAR(255)
servicio_id             UUID → REFERENCES hosix_servicios(id)
profesional_id          UUID
sala                    VARCHAR(100)
tipo_agenda             VARCHAR(50)
duracion_default_minutos INT DEFAULT 15
capacidad_maxima_dia    INT
permite_teleconsulta    BOOLEAN DEFAULT false
activo                  BOOLEAN DEFAULT true
created_at              TIMESTAMPTZ
updated_at              TIMESTAMPTZ
```

**Índices**: Código, Activo  

---

#### `hosix_agendas_horarios`
```sql
id              UUID PRIMARY KEY
agenda_id       UUID → REFERENCES hosix_agendas(id)
dia_semana      INT NOT NULL       -- 0=Lunes, 6=Domingo
hora_inicio     TIME
hora_fin        TIME
activo          BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ
```

---

#### `hosix_citas`
```sql
id                  UUID PRIMARY KEY
agenda_id           UUID → REFERENCES hosix_agendas(id)
paciente_id         UUID → REFERENCES hosix_pacientes(id)
fecha_hora          TIMESTAMPTZ
duracion_minutos    INT
actividad_id        UUID
motivo              TEXT
estado              VARCHAR(50) DEFAULT 'programada'
motivo_cancelacion  TEXT
es_teleconsulta     BOOLEAN DEFAULT false
url_teleconsulta    TEXT
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

**Índices**: Agenda, Paciente, Fecha, Estado  

---

### 6. MÓDULO DE HOSPITALIZACION

#### `hosix_camas`
```sql
id              UUID PRIMARY KEY
codigo          VARCHAR(50) UNIQUE
nombre          VARCHAR(100)
servicio_id     UUID → REFERENCES hosix_servicios(id)
ubicacion       VARCHAR(255)
tipo_cama       VARCHAR(50)    -- 'general', 'uci', 'aislamiento'
estado          VARCHAR(50) DEFAULT 'disponible'
activo          BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

**Índices**: Código, Estado, Servicio  

---

#### `hosix_hospitalizacion_episodios` ⭐ CRÍTICA
```sql
id                      UUID PRIMARY KEY
paciente_id             UUID → REFERENCES hosix_pacientes(id)
fecha_ingreso           TIMESTAMPTZ DEFAULT now()
origen_ingreso          VARCHAR(100)
diagnostico_ingreso     TEXT
medico_responsable_id   UUID → REFERENCES profesionales_sanitarios(id)
servicio_id             UUID → REFERENCES hosix_servicios(id)
cama_id                 UUID → REFERENCES hosix_camas(id)
duracion_prevista_dias  INT
fecha_alta              TIMESTAMPTZ
tipo_alta               VARCHAR(50)
diagnostico_alta        TEXT
informe_alta            TEXT
estado                  VARCHAR(50) DEFAULT 'activo'
created_at              TIMESTAMPTZ
updated_at              TIMESTAMPTZ
```

**Índices**: Paciente, Fecha ingreso, Estado  
**RLS**: Lectura pública, INSERT/UPDATE permitidos

---

#### `hosix_hospitalizacion_traslados`
```sql
id                  UUID PRIMARY KEY
episodio_id         UUID → REFERENCES hosix_hospitalizacion_episodios(id)
fecha_traslado      TIMESTAMPTZ DEFAULT now()
cama_origen_id      UUID → REFERENCES hosix_camas(id)
cama_destino_id     UUID → REFERENCES hosix_camas(id)
servicio_origen_id  UUID
servicio_destino_id UUID
motivo_traslado     VARCHAR(255)
observaciones       TEXT
created_at          TIMESTAMPTZ
```

---

### 7. MÓDULO MÉDICO - ÓRDENES Y DIAGNÓSTICOS

#### `hosix_diagnosticos_catalogo` ⭐ CRÍTICA
```sql
id                      UUID PRIMARY KEY
codigo_cie10            VARCHAR(10) UNIQUE         -- Ej: "I10" (Hipertensión)
codigo_icd10            VARCHAR(10)
codigo_snomed           VARCHAR(20) UNIQUE         -- Ej: "59621000"
nombre_diagnostico      VARCHAR(255)
descripcion             TEXT
capitulo_cie10          VARCHAR(50)
categoria_snomed        VARCHAR(100)
es_cronica              BOOLEAN DEFAULT false
requiere_seguimiento    BOOLEAN DEFAULT true
es_notificable          BOOLEAN DEFAULT false
activo                  BOOLEAN DEFAULT true
notas_clinicas          TEXT
url_referencia_cie10    VARCHAR(255)
url_referencia_snomed   VARCHAR(255)
created_at              TIMESTAMPTZ
updated_at              TIMESTAMPTZ
```

**Índices**: CIE10, SNOMED, Nombre, Activo  
**RLS**: Lectura pública, solo admin escribe

**Queries desde useHosixMedicos.ts**:
```typescript
// Búsqueda de diagnósticos
.from('hosix_diagnosticos_catalogo')
.select('*')
.eq('activo', true)
.or(`codigo_cie10.ilike.%${busqueda}%,codigo_snomed.ilike.%${busqueda}%,...`)
.order('nombre_diagnostico')
```

---

#### `hosix_ordenes_medicas` ⭐ CRÍTICA
```sql
id                  UUID PRIMARY KEY
paciente_id         UUID → REFERENCES hosix_pacientes(id)
episodio_id         UUID
medico_asignado_id  UUID → REFERENCES profesionales_sanitarios(id)
tipo_orden          VARCHAR(50)     -- 'consulta', 'revisión', 'seguimiento', 'alta'
estado              VARCHAR(30)     -- 'pendiente', 'en_atención', 'completada', 'cancelada'
prioridad           VARCHAR(20)     -- 'baja', 'normal', 'alta', 'urgente'
motivo_consulta     TEXT
servicio            VARCHAR(100)
fecha_creacion      TIMESTAMPTZ
fecha_programada    TIMESTAMPTZ
fecha_inicio_atencion TIMESTAMPTZ
fecha_completacion  TIMESTAMPTZ
notas_previas       TEXT
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

**Índices**: Paciente, Médico, Estado, Prioridad, Fecha  
**RLS**: Médicos ven sus órdenes o admin

**Queries desde AdmisionCentralForm**:
```typescript
// Crear orden médica para médico asignado
.from('hosix_ordenes_medicas')
.insert([{
  paciente_id: paciente.id,
  medico_asignado_id: medico.id,
  tipo_orden: 'consulta',
  estado: 'pendiente',
  prioridad: 'normal',
  motivo_consulta: formData.motivoConsulta,
  fecha_creacion: new Date().toISOString()
}])
```

---

#### `hosix_diagnosticos_pacientes`
```sql
id                  UUID PRIMARY KEY
paciente_id         UUID → REFERENCES hosix_pacientes(id)
episodio_id         UUID → REFERENCES hosix_hospitalizacion_episodios(id)
medico_id           UUID → REFERENCES profesionales_sanitarios(id)
diagnostico_id      UUID → REFERENCES hosix_diagnosticos_catalogo(id)
tipo_diagnostico    VARCHAR(30)  -- 'principal', 'secundario', 'complicación', 'comorbilidad'
estado              VARCHAR(30)  -- 'activo', 'resuelto', 'sospechoso'
fecha_diagnostico   TIMESTAMPTZ DEFAULT now()
fecha_resolucion    TIMESTAMPTZ
observaciones       TEXT
severidad           VARCHAR(20)  -- 'leve', 'moderada', 'grave', 'crítica'
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

---

#### `hosix_consultas_medicas`
```sql
id                          UUID PRIMARY KEY
orden_medica_id             UUID → REFERENCES hosix_ordenes_medicas(id)
paciente_id                 UUID → REFERENCES hosix_pacientes(id)
medico_id                   UUID → REFERENCES profesionales_sanitarios(id)
episodio_id                 UUID
antecedentes_relevantes     TEXT
medicamentos_actuales       JSONB       -- Array de medicamentos activos
motivo_consulta             TEXT
historia_enfermedad_actual  TEXT
examen_fisico               TEXT
impresion_clinica           TEXT
diagnosticos_iniciales      TEXT
plan_manejo                 TEXT
diagnosticos_confirmados    JSONB       -- Array {diagnostico_id, tipo, severidad}
prescripciones_creadas      JSONB       -- Array de prescription IDs
requiere_hospitalizacion    BOOLEAN DEFAULT false
requiere_interconsulta      BOOLEAN DEFAULT false
especialidad_interconsulta  VARCHAR(100)
requiere_seguimiento        BOOLEAN DEFAULT false
dias_proximo_control        INT
observaciones_seguimiento   TEXT
fecha_inicio                TIMESTAMPTZ
fecha_fin                   TIMESTAMPTZ
duracion_minutos            INT
created_at                  TIMESTAMPTZ
updated_at                  TIMESTAMPTZ
```

**Índices**: Paciente, Médico, Orden, Fecha

**Queries desde useHosixMedicos.ts**:
```typescript
.from('hosix_consultas_medicas')
.select('*')
.eq('paciente_id', pacienteId)
.order('fecha_inicio', { ascending: false })

// Crear consulta
.insert([{
  ...consulta,
  fecha_inicio: new Date().toISOString()
}])
```

---

#### `hosix_diario_clinico_medico`
```sql
id                  UUID PRIMARY KEY
paciente_id         UUID → REFERENCES hosix_pacientes(id)
episodio_id         UUID
medico_id           UUID → REFERENCES profesionales_sanitarios(id)
consulta_medica_id  UUID → REFERENCES hosix_consultas_medicas(id)
tipo_entrada        VARCHAR(50)  -- 'evolución', 'nota_clínica', 'revisión', 'conclusión'
contenido           TEXT
signos_vitales      JSONB
firmada             BOOLEAN DEFAULT false
fecha_firma         TIMESTAMPTZ
hash_firma          VARCHAR(255)
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

**Índices**: Paciente, Médico, Fecha  

**Queries desde useHosixMedicos.ts**:
```typescript
.from('hosix_diario_clinico_medico')
.select('*')
.eq('paciente_id', pacienteId)
.order('created_at', { ascending: false })
```

---

### 8. MÓDULO DE QUIRÓFANOS

#### `hosix_quirofanos_bloques`
```sql
id              UUID PRIMARY KEY
codigo          VARCHAR(50) UNIQUE
nombre          VARCHAR(255)
ubicacion       VARCHAR(100)
activo          BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

---

#### `hosix_quirofanos_salas`
```sql
id              UUID PRIMARY KEY
codigo          VARCHAR(50) UNIQUE
nombre          VARCHAR(255)
bloque_id       UUID → REFERENCES hosix_quirofanos_bloques(id)
piso            INT
tipo_sala       VARCHAR(50)
especialidades  JSONB           -- Array de especialidades
activo          BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

---

#### `hosix_quirofanos_equipos`
```sql
id              UUID PRIMARY KEY
codigo          VARCHAR(50) UNIQUE
nombre          VARCHAR(255)
sala_id         UUID → REFERENCES hosix_quirofanos_salas(id)
tipo_equipo     VARCHAR(100)
estado          VARCHAR(50)     -- 'operativo', 'mantenimiento'
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

---

#### `hosix_quirofanos_programaciones` ⭐ CRÍTICA
```sql
id                      UUID PRIMARY KEY
sala_id                 UUID → REFERENCES hosix_quirofanos_salas(id)
paciente_id             UUID → REFERENCES hosix_pacientes(id)
fecha_programada        TIMESTAMPTZ NOT NULL
hora_inicio_estimada    TIME
duracion_estimada_minutos INT
procedimiento_principal TEXT
procedimientos_secundarios JSONB
tipo_intervencion       VARCHAR(50)
tipo_anestesia          VARCHAR(50)
cirujano_principal_id  UUID → REFERENCES profesionales_sanitarios(id)
anestesiologo_id       UUID → REFERENCES profesionales_sanitarios(id)
instrumentista_id      UUID → REFERENCES profesionales_sanitarios(id)
circulante_id          UUID → REFERENCES profesionales_sanitarios(id)
equipo_medico           JSONB       -- Array de profesionales
fecha_inicio_real       TIMESTAMPTZ
fecha_fin_real          TIMESTAMPTZ
estado                  VARCHAR(50) -- 'programada', 'en_curso', 'completada', 'cancelada'
motivo_cancelacion      TEXT
complicaciones          JSONB
observaciones           TEXT
created_at              TIMESTAMPTZ
updated_at              TIMESTAMPTZ
```

**Índices**: Paciente, Sala, Fecha, Estado  

---

### 9. MÓDULO DE FARMACIA Y PRESCRIPCIÓN

#### `hosix_medicamentos`
```sql
id                  UUID PRIMARY KEY
codigo              VARCHAR(50) UNIQUE
codigo_barras       VARCHAR(100)
nombre_comercial    VARCHAR(255)
principio_activo    VARCHAR(255)
presentacion        VARCHAR(255)
concentracion       VARCHAR(100)
forma_farmaceutica  VARCHAR(100)
via_administracion  VARCHAR(100)
familia             VARCHAR(100)
grupo               VARCHAR(100)
requiere_receta     BOOLEAN DEFAULT true
controlado          BOOLEAN DEFAULT false
activo              BOOLEAN DEFAULT true
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

**Índices**: Código, Activo  

---

#### `hosix_prescripciones`
```sql
id                  UUID PRIMARY KEY
paciente_id         UUID → REFERENCES hosix_pacientes(id)
episodio_id         UUID
medicamento_id      UUID → REFERENCES hosix_medicamentos(id)
medicamento_texto   VARCHAR(255)
dosis               VARCHAR(100)
frecuencia          VARCHAR(100)
via_administracion  VARCHAR(100)
duracion_dias       INT
instrucciones       TEXT
prescriptor_id      UUID
fecha_prescripcion  TIMESTAMPTZ DEFAULT now()
fecha_inicio        TIMESTAMPTZ
fecha_fin           TIMESTAMPTZ
estado              VARCHAR(50) DEFAULT 'activa'
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

**Índices**: Paciente, Estado  

---

#### `hosix_dispensaciones`
```sql
id                  UUID PRIMARY KEY
prescripcion_id     UUID → REFERENCES hosix_prescripciones(id)
cantidad_dispensada DECIMAL(10,2)
unidad              VARCHAR(50)
lote                VARCHAR(100)
fecha_caducidad     DATE
dispensador_id      UUID
fecha_dispensacion  TIMESTAMPTZ DEFAULT now()
confirmado_por      UUID
fecha_confirmacion  TIMESTAMPTZ
observaciones       TEXT
created_at          TIMESTAMPTZ
```

---

#### `hosix_cpoe_prescripciones` ⭐ CRÍTICA
```sql
id                      UUID PRIMARY KEY
paciente_id             UUID → REFERENCES hosix_pacientes(id)
episodio_id             UUID
medico_id               UUID → REFERENCES profesionales_sanitarios(id)
medicamento_id          UUID → REFERENCES hosix_articulos(id)
nombre_medicamento      VARCHAR(255)
principio_activo        VARCHAR(255)
dosis                   VARCHAR(100)
unidad_dosis            VARCHAR(50)
via_administracion      VARCHAR(50)
frecuencia              VARCHAR(100)
duracion_dias           INT
fecha_inicio            DATE
fecha_fin               DATE
tiene_alerta_interaccion BOOLEAN DEFAULT false
tiene_alerta_alergia    BOOLEAN DEFAULT false
tiene_alerta_dosis      BOOLEAN DEFAULT false
alertas_ignoradas       JSONB
estado                  VARCHAR(30) DEFAULT 'activa'
firmada                 BOOLEAN DEFAULT false
fecha_firma             TIMESTAMPTZ
hash_firma              VARCHAR(255)
instrucciones_paciente  TEXT
observaciones_medicas   TEXT
created_at              TIMESTAMPTZ
updated_at              TIMESTAMPTZ
```

**Índices**: Paciente, Médico, Estado, Fecha inicio, Medicamento  
**RLS**: Lectura pública, INSERT/UPDATE permitidos

---

---

## 🔗 RELACIONES Y FOREIGN KEYS

### Mapa de Dependencias

```
┌─────────────────────────────────────────────────────────────┐
│ RENAPROSA (Sistema Externo)                                 │
│ - profesionales_sanitarios                                  │
│ - centros_salud                                             │
└────────────┬────────────────────────────────────────────────┘
             │
             ├─→ hosix_ordenes_medicas.medico_asignado_id
             ├─→ hosix_diagnosticos_pacientes.medico_id
             ├─→ hosix_consultas_medicas.medico_id
             ├─→ hosix_diario_clinico_medico.medico_id
             ├─→ hosix_urgencias_episodios.medico_responsable_id
             ├─→ hosix_hospitalizacion_episodios.medico_responsable_id
             ├─→ hosix_quirofanos_programaciones.cirujano_principal_id
             ├─→ hosix_cpoe_prescripciones.medico_id
             └─→ Múltiples roles en quirófanos

┌─────────────────────────────────────────────────────────────┐
│ HOSIX - PACIENTES                                           │
├─────────────────────────────────────────────────────────────┤
│ hosix_pacientes (PPI, documento, datos demográficos)       │
└────────────┬────────────────────────────────────────────────┘
             │
             ├─→ hosix_pacientes_contactos (datos de contacto)
             ├─→ hosix_pacientes_avisos (alertas)
             ├─→ hosix_pacientes_documentos (adjuntos)
             ├─→ hosix_historia_clinica (todas las entradas clínicas)
             │
             ├─→ URGENCIAS:
             │   └─→ hosix_urgencias_episodios
             │       └─→ hosix_urgencias_triage
             │
             ├─→ HOSPITALIZACIÓN:
             │   └─→ hosix_hospitalizacion_episodios
             │       ├─→ hosix_camas
             │       └─→ hosix_hospitalizacion_traslados
             │
             ├─→ MÉDICOS:
             │   ├─→ hosix_ordenes_medicas
             │   │   └─→ hosix_consultas_medicas
             │   │       └─→ hosix_diario_clinico_medico
             │   ├─→ hosix_diagnosticos_pacientes
             │   │   └─→ hosix_diagnosticos_catalogo (CIE-10/SNOMED)
             │   └─→ hosix_cpoe_prescripciones
             │
             ├─→ PRESCRIPCIÓN:
             │   ├─→ hosix_prescripciones
             │   │   └─→ hosix_medicamentos
             │   │       └─→ hosix_dispensaciones
             │   └─→ hosix_cpoe_prescripciones
             │
             ├─→ QUIRÓFANOS:
             │   └─→ hosix_quirofanos_programaciones
             │       ├─→ hosix_quirofanos_salas
             │       │   └─→ hosix_quirofanos_bloques
             │       ├─→ hosix_quirofanos_equipos
             │       └─→ profesionales_sanitarios (múltiples)
             │
             └─→ CITAS:
                 ├─→ hosix_agendas
                 │   └─→ hosix_agendas_horarios
                 └─→ hosix_citas

┌─────────────────────────────────────────────────────────────┐
│ HOSIX - CONFIGURACIÓN                                       │
├─────────────────────────────────────────────────────────────┤
│ hosix_departamentos                                         │
│   └─→ hosix_servicios                                       │
│       ├─→ hosix_agendas                                     │
│       ├─→ hosix_camas                                       │
│       └─→ hosix_quirofanos_salas                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 RLS POLICIES

### Por Tabla

| Tabla | SELECT | INSERT | UPDATE | Condición |
|-------|--------|--------|--------|-----------|
| hosix_pacientes | true | true | true | Restricción general abierta |
| hosix_historia_clinica | true | true | - | Lectura abierta |
| hosix_urgencias_episodios | true | true | true | Acceso general |
| hosix_urgencias_triage | true | true | - | Acceso general |
| hosix_hospitalizacion_episodios | true | true | true | Acceso general |
| hosix_camas | true | true | - | Acceso general |
| hosix_ordenes_medicas | medico own + admin | - | - | Solo médico asignado o admin |
| hosix_consultas_medicas | medico own + admin | - | - | Solo médico propietario o admin |
| hosix_diario_clinico_medico | medico own + admin | - | - | Solo médico propietario o admin |
| hosix_diagnosticos_catalogo | true | admin only | - | Admin escribe, todos leen |
| hosix_medicamentos | true | - | - | Lectura pública |
| hosix_prescripciones | true | true | - | Acceso general |
| hosix_dispensaciones | true | true | - | Acceso general |
| hosix_cpoe_prescripciones | true | true | true | Acceso general |
| hosix_quirofanos* | true/activo | true | - | Variación según tabla |

**Patrón de RLS**:
- **Lectura**: `USING (true)` o `USING (auth.uid() = propietario_id)`
- **Escritura**: `WITH CHECK (true)` o `WITH CHECK (perfil = 'admin')`

---

## 🔧 EDGE FUNCTIONS

### Functions por Categoría

#### 1. **Clinical Decision Support (CDS)**

**Function**: `cds-engine`  
**Ruta**: `/supabase/functions/cds-engine/index.ts`  
**Entrada**:
```typescript
{
  prescription: {
    pacienteId: string
    medicamentoId: string
    nombreMedicamento: string
    dosis: number
    unidadDosis: string
    viasAdministracion: string
    frecuencia: string
    duracionDias?: number
    medicamentosActuales?: string[]
    edadPaciente?: number
    pesoPaciente?: number
    funcionRenal?: 'normal' | 'leve' | 'moderada' | 'grave'
  }
}
```

**Validaciones Realizadas**:
- ✅ Alergias del paciente vs medicamento
- ✅ Interacciones medicamentosas
- ✅ Dosis apropiada por edad/peso/función renal
- ✅ Duplicidad de medicamentos
- ✅ Contraindicaciones

**Salida**:
```typescript
{
  alertas: Alert[]
  alertasCriticas: number
  alertasAdvertencia: number
  alertasInfo: number
  permitePrescripcion: boolean
  motivo?: string
  timestamp: string
}
```

**Queries a BD**:
```typescript
// Alergias
.from('hosix_pacientes')
.select('alergias, fecha_nacimiento')
.eq('id', prescription.pacienteId)

// Medicamentos actuales
.from('hosix_cpoe_prescripciones')
.select('medicamento_id, nombre_medicamento')
.eq('paciente_id', prescription.pacienteId)
.eq('estado', 'activa')

// Interacciones
.from('hosix_drug_interactions')
.select('*')
.or(`medicamento_a.eq.${medId},medicamento_b.eq.${medId}`)
```

---

#### 2. **FHIR API (Healthcare Interoperability)**

**Function**: `fhir-api`  
**Ruta**: `/supabase/functions/fhir-api/index.ts`  
**Endpoints**:

- `GET /fhir/r4/Patient?identifier=ppi|2500123456`
  - Busca paciente por PPI
  - Query: `hosix_pacientes.select('*').eq('ppi', value)`

- `GET /fhir/r4/Patient?name=Juan`
  - Búsqueda por nombre
  - Query: `hosix_pacientes.select('*').or('primer_nombre.ilike...', 'primer_apellido.ilike...')`

- `GET /fhir/r4/Observation?patient=ppi`
  - Obtiene observaciones del paciente
  - Query: `hosix_historia_clinica.select('*').eq('paciente_id', ...)`

**Mapeo**: DB → FHIR R4 Standard

---

#### 3. **Auditoría y Sincronización**

**Function**: `hosix-auditoria-eventos`  
**Propósito**: Registrar acciones en tablas HOSIX

**Function**: `sync_multicentro`  
**Propósito**: Sincronizar datos entre múltiples centros

**Function**: `sync_ehr_to_thalamus`  
**Propósito**: Sincronizar HCE a sistema Thalamus (GNU Health)

---

#### 4. **Exportación de Datos**

**Function**: `export-payroll`  
**Ruta**: `/supabase/functions/export-payroll/index.ts`  
```typescript
interface ExportRequest {
  nomina_id?: string
  mes: number
  ano: number
  centro_id: string
  format: 'csv' | 'excel' | 'pdf'
  tipo_export: 'nomina' | 'pagos' | 'banco'
}
```

**Queries**:
```typescript
if (tipo_export === 'nomina') {
  // .from('nominas_lineas').select(...)
} else if (tipo_export === 'pagos') {
  // .from('pagos').select(...)
} else if (tipo_export === 'banco') {
  // Formato específico banco
}
```

---

#### 5. **Validación Clínica**

**Function**: `validate_lab_results`  
**Function**: `validate_medication_order`  
**Function**: `surgery-validation`  
**Function**: `pregnancy_gestational_age`  
**Function**: `immunization_validation`  

---

### Listado Completo de Edge Functions

```
Disponibles (96 functions):
├── admin-users/                      (Gestión de usuarios)
├── admision_crear_hospitalizacion/   (Crea episodio hospitalización)
├── admision_sync_to_hospitalizacion/ (Sincroniza admisión)
├── cds-engine/                       ⭐ (Clinical Decision Support)
├── cirugia_sync_to_quirofanos/       (Sincroniza cirugías)
├── create_treatment_plan/            (Crea plan de tratamiento)
├── fhir-api/                         ⭐ (FHIR R4 API)
├── hosix-auditoria-eventos/          (Auditoría)
├── hosix-auth-login/                 (Autenticación)
├── hosix-permisos-check/             (Verificación permisos)
├── hospitalizacion_evolucionar_paciente/
├── hospitalizacion_mover_paciente_cama/
├── hospitalizacion_solicitar_interconsulta/
├── immunization_validation/          (Validación inmunización)
├── lab_validation/                   (Validación laboratorio)
├── pharmacy_validation/              (Validación farmacia)
├── validate_lab_results/
├── validate_medication_order/
├── sync_ehr_to_thalamus/             ⭐ (GNU Health sync)
└── ... [más de 50 functions]
```

---

## 🪝 HOOKS DE REACT QUERY

### `useHosixMedicos`

**Archivo**: `src/hooks/useHosixMedicos.ts`

**Query Hooks**:
1. `useOrdenesMedicas(estado?: string)`
   - Query key: `['ordenes_medicas', estado]`
   - Tabla: `hosix_ordenes_medicas`
   - Filtro: Médico actual
   - RLS: Activa

2. `useDiagnosticosCatalogo(busqueda?: string)`
   - Query key: `['diagnosticos_catalogo', busqueda]`
   - Tabla: `hosix_diagnosticos_catalogo`
   - Búsqueda: CIE10, SNOMED, nombre

3. `useDiagnosticosPaciente(pacienteId: string)` (RPC)
   - Query key: `['diagnosticos_paciente', pacienteId]`
   - RPC: `obtener_diagnosticos_activos`

4. `useConsultasPaciente(pacienteId: string)`
   - Query key: `['consultas_medicas', pacienteId]`
   - Tabla: `hosix_consultas_medicas`

5. `useDiarioClinico(pacienteId: string)`
   - Query key: `['diario_clinico', pacienteId]`
   - Tabla: `hosix_diario_clinico_medico`

**Mutation Hooks**:
- `actualizarEstadoOrdenMutation`: UPDATE estado + timestamps
- `crearConsultaMedication`: INSERT con fecha_inicio
- `registrarDiagnosticoMutation`: RPC call
- `registrarDiarioMutation`: INSERT
- `actualizarConsultaMutation`: UPDATE

---

### `useHosixPacientes`

**Archivo**: `src/hooks/useHosixPacientes.ts`

**Operations**:
1. `generarPPI()`: Secuencial automática
   - Query: `hosix_pacientes.select('ppi').order('ppi', DESC).limit(1)`
   - Formato: `PPI-${numero.padStart(4, '0')}`

2. `buscarDuplicados(numero_documento)`
   - Query: `eq('numero_documento', ...)`

3. `pacientes` (Query)
   - Filters: busqueda, activo, centro_id
   - Búsqueda: nombre, apellido, documento, ppi (OR ilike)

4. `historiaClinica` (Query)
   - Tabla: `hosix_historia_clinica`
   - Order: fecha_entrada DESC

5. `obtenerPaciente(id)`: Obtiene detalle único

---

### `useHosixUrgencias`

**Archivo**: `src/hooks/useHosixUrgencias.ts`

**Query Hooks**:
1. `episodios`
   - Query key: `['urgencias-episodios']`
   - Join: paciente, medico
   - Filter: `estado = 'en_proceso'`
   - Selects: `*,paciente:hosix_pacientes(...),medico:profesionales_sanitarios(...)`

**Mutation Hooks**:
1. `registrarEntradaMutation`
   - Inserta en `hosix_urgencias_episodios`
   - Luego crea entrada en `hosix_historia_clinica`

2. `registrarTriageMutation`
   - Inserta en `hosix_urgencias_triage`
   - Actualiza episodio con clasificación

3. `registrarAtencionMutation`
   - UPDATE episodio con diagnósticos
   - INSERT en historia clínica

---

### Hooks Adicionales

- `useAdvancedRoleManagement`: Gestión de roles con `profesionales_sanitarios`
- `useAdvancedAnalytics`: Análisis con agregación de múltiples tablas
- `useCuadrantesBio`: Cuadrantes biométricos

---

## 🔌 INTEGRACIONES RENAPROSA

### Tabla: `profesionales_sanitarios` ⭐ EXTERNA

**Procedencia**: RENAPROSA (Sistema de Gestión de Recursos Humanos)  
**Ubicación**: Schema `public`  
**Relación**: Foreign Key desde todas las tablas médicas/clínicas

**Campos Utilizados en HOSIX**:
```sql
id                      UUID PRIMARY KEY
user_id                 UUID → auth.users(id)
nombre_completo         VARCHAR(255)
area_profesional        VARCHAR(255)
perfil                  VARCHAR(255)
activo                  BOOLEAN
esta_en_turno           BOOLEAN
servicio_id             UUID
```

**Queries desde AdmisionCentralForm**:
```typescript
// Obtener médicos en turno del servicio
.from('profesionales_sanitarios')
.select('id, primer_nombre, primer_apellido')
.eq('servicio_id', formData.servicioId)
.eq('activo', true)
.eq('esta_en_turno', true)
.limit(1)
```

**Queries desde useHosixMedicos**:
```typescript
// Obtener ID médico actual
.from('profesionales_sanitarios')
.select('id')
.eq('user_id', auth.uid())
.single()
```

---

### Sincronización: GNU Health (Thalamus)

**Edge Function**: `sync_ehr_to_thalamus`  
**Propósito**: Sincronizar HCE completa a Thalamus (GNU Health backend)

**Tablas Sincronizadas**:
- `hosix_pacientes` → Patient
- `hosix_historia_clinica` → Patient Events
- `hosix_diagnosticos_pacientes` → Diagnoses
- `hosix_consultas_medicas` → Clinical Encounters
- `hosix_cpoe_prescripciones` → Medications

**Caché/Queue**:
- `sync_process_queue`: Cola de sincronización
- `sync_get_status`: Estado de sincronización

---

### Integración de Cardinales Profesionales

**Edge Function**: `generar-carnet-profesional`  
**Propósito**: Generar carné profesional desde datos de RENAPROSA

**Fuente**: 
- `profesionales_sanitarios` (RENAPROSA)
- Credenciales profesionales
- Acreditaciones

---

---

## 📦 EXTENSIONES POSTGRESQL REQUERIDAS

### Extensiones Actualmente Usadas

```sql
-- Para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Para JSON Avanzado
CREATE EXTENSION IF NOT EXISTS "json";

-- Para búsqueda full-text (potencial)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Para análisis de datos (potencial)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Extensiones que DEBERÍA Tener HOSIX

```sql
-- Para funciones randomness
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Para arrays y búsqueda
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Para búsqueda full-text
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Para integridad referencial avanzada
-- (Ya con CASCADE DELETE)

-- Para auditoría completa (auditoría de cambios)
CREATE EXTENSION IF NOT EXISTS "audit_table";
```

---

## 📊 RESUMEN DE DEPENDENCIAS

### Tablas Críticas (Acceso Alta Frecuencia)

| Tabla | Acceso/Día | Prioridad | Índices |
|-------|-----------|-----------|---------|
| hosix_pacientes | Alto | 🔴 Crítica | PPI, Documento, Nombre, Activo |
| hosix_ordenes_medicas | Alto | 🔴 Crítica | Paciente, Médico, Estado, Fecha |
| hosix_urgencias_episodios | Medio-Alto | 🔴 Crítica | Paciente, Estado, Fecha |
| hosix_historia_clinica | Muy Alto | 🔴 Crítica | Paciente, Tipo, Fecha |
| hosix_diagnosticos_catalogo | Bajo | 🟠 Media | CIE10, SNOMED, Nombre |
| hosix_citas | Medio | 🟠 Media | Agenda, Paciente, Fecha, Estado |
| hosix_camas | Bajo | 🟢 Baja | Código, Estado |

---

## 🎯 RECOMENDACIONES DE OPTIMIZACIÓN

### 1. **Indices Propuestos**

```sql
-- Historia clínica por episodio (joins rápidos)
CREATE INDEX idx_hc_episodio ON hosix_historia_clinica(episodio_id);

-- Órdenes por estado + médico (queries comunes)
CREATE INDEX idx_ordenes_estado_medico ON hosix_ordenes_medicas(estado, medico_asignado_id);

-- Urgencias por fecha DESC (mostrar recientes)
CREATE INDEX idx_urgencias_fecha_desc ON hosix_urgencias_episodios(fecha_entrada DESC);

-- Citas próximas
CREATE INDEX idx_citas_proximas ON hosix_citas(fecha_hora) WHERE estado IN ('programada', 'confirmada');
```

---

### 2. **Particionamiento Sugerido**

```sql
-- Historia clínica por año (datos históricos)
CREATE TABLE hosix_historia_clinica_2025 PARTITION OF hosix_historia_clinica
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Órdenes médicas por mes (acceso vs histórico)
-- Considerado si > 1M registros
```

---

### 3. **Caché Recomendado**

- `diagnosticos_catalogo`: Redis cache (datos estáticos)
- `servicios`: Redis cache (cambios infrecuentes)
- `profesionales_sanitarios`: Caché local en Hook (sincroniza cada sesión)

---

## 🔍 AUDITORÍA Y COMPLIANCE

### Tabla de Auditoría

```sql
-- Ya existe en base schema
hosix_auditoria (
  id, usuario_id, accion, tabla_afectada, registro_id,
  datos_anteriores, datos_nuevos, ip_address, user_agent, created_at
)
```

### Campos de Auditoría en Tablas

Todas las tablas HOSIX incluyen:
- `created_at`: Timestamp creación
- `updated_at`: Timestamp última actualización

Tablas clínicas críticas incluyen:
- `firmada`: Boolean (Firma electrónica)
- `fecha_firma`: Timestamp
- `hash_firma`: Hash de integridad

---

## 📋 CHECKLIST DE VERIFICACIÓN

- ✅ Todas las tablas documentadas
- ✅ Foreign keys mapeados
- ✅ RLS Policies listadas
- ✅ Edge functions categorizadas  
- ✅ Hooks de React Query documentados
- ✅ Integraciones RENAPROSA identificadas
- ✅ Extensions PostgreSQL listadas
- ✅ Queries específicas del código incluidas
- ✅ Índices propuestos
- ✅ Relaciones paciente↔servicios↔médicos↔diagnósticos clarificadas

---

## 📞 REFERENCIAS RÁPIDAS

### Dónde Consultar Tabla X:

**hosix_pacientes**: 
- UI: AdmisionCentralForm → búsqueda
- Hook: useHosixPacientes → pacientes query
- Edge: fhir-api → Patient lookup

**hosix_ordenes_medicas**:
- UI: Worklist médicos
- Hook: useHosixMedicos → useOrdenesMedicas
- File: AdmisionCentralForm línea 275

**hosix_urgencias_episodios**:
- UI: UrgenciasWorklist
- Hook: useHosixUrgencias → episodios query
- Edge: cds-engine (validaciones)

**hosix_diagnosticos_catalogo**:
- Hook: useHosixMedicos → useDiagnosticosCatalogo
- UI: Selección de diagnósticos en consultas

**hosix_servicios**:
- UI: AdmisionCentralForm → selector de servicios línea 135
- Filters: atiende_urgencias, atiende_externa, atiende_hospitalizacion

---

**Autor**: Análisis Automatizado  
**Última Actualización**: 2026-04-15  
**Estado**: Listo para Desarrollo
