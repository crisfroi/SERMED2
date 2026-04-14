# HOSIX ↔ GNU Health (Tryton): estado global documentado

Este documento consolida **lo que ya existe en el repositorio** (no sustituye una auditoría contra la base Supabase en producción). Sirve como hoja de ruta y trazabilidad frente a **todos** los módulos Tryton bajo `tryton/health` y `tryton/health_*`.

**Norma de uso:** al cerrar cada bloque de trabajo (migración, función, pantalla, RLS), actualizar **§0.2** (en curso), la **matriz §4** si cambia el estado de un módulo, marcar **Hecho** en las tablas de la **§10** cuando corresponda, volcar resultados de auditoría Supabase en **§0.4**, y registrar la fecha + resumen en **§11** (changelog).

---

## 0. Estado actual del trabajo (vivo)

### 0.1 Completado hasta la fecha

- [x] Inventario de **53 paquetes** Tryton (`health` + 52 `health_*`) en `tryton/`.
- [x] Matriz de correspondencia **módulo Tryton → tablas `hosix_*` / UI / lógica** (§4).
- [x] Lista deduplicada de tablas `hosix_*` definidas en migraciones del repo (§5).
- [x] Referencia a Edge Functions, páginas Hosix en React, y riesgos de rutas duplicadas de migraciones (§1, §6–§8).
- [x] Análisis previo del dump `tryton/copia_total_salud.sql` frente al modelo HOSIX (informe de gaps; no sustituye DDL nuevo hasta ejecutar Fase 1).
- [x] Plan maestro por **fases 0–7** (§10): criterios **100%** (IMP / MET / EXC-GE / EXT), modo **solo ejecución**, índice de fases y micro-pasos sugeridos.
- [x] **§11** changelog del documento y **§0.4** reservado para diff Supabase cuando exista auditoría remota.
- [x] **ADR-001** (`docs/ADR-001-migraciones-supabase-canonicas.md`): decisión de que `supabase/migrations/` es la fuente canónica.
- [x] **Laboratorio en ruta canónica:** `supabase/migrations/20260412120000_hosix_laboratorio_canonical.sql` + tabla `hosix_laboratorio_criterios_referencia` (paridad `gnuhealth_lab_test_critearea`) + `docs/laboratorio-gnu-hosix.md`.

### 0.2 En curso (esta iteración)

- [x] **Aplicar delta laboratorio en Supabase remoto** vía MCP `user-supabase.apply_migration` (`hosix_laboratorio_criterios_referencia` + RLS). Ver §0.4.
- [ ] **Unificar fuente de migraciones (resto):** fusionar o archivar duplicados `hosix_interconsultas*` / `hosix_almacenes*` entre carpetas; retirar carpeta anidada `supabase/migrations/supabase/migrations/` cuando no aporte diferencias.
- [ ] **Auditoría remota Supabase:** exportar lista real de tablas/vistas/funciones y comparar con §5–§6 (cerrar brecha “repo vs producción”).
- [ ] **Priorizar vertical clínica** para la primera oleada de DDL + RLS (propuesta por defecto: paciente MPI → urgencias/agenda → hospitalización → farmacia/CPOE → lab → imagen → facturación).

### 0.3 Próximo paso inmediato (orden estricto)

1. Ejecutar checklist **Fase 0** (**§10**, tabla Fase 0) en **staging**: aplicar migraciones canónicas + `supabase db diff` contra ese proyecto.
2. Aprobar lista de **gaps de tablas** por dominio (derivada de `copia_total_salud.sql` + matriz §4 + resultado pegado en **§0.4**).
3. Abrir primera migración acotada (**Fase 1.2**, §10) solo para el vertical priorizado acordado en §0.2; en paralelo borrador de **RLS** por `centro_salud_id` / rol clínico.

### 0.4 Anexo vivo: diff Supabase remoto ↔ migraciones Git

| Fecha | Acción | Detalle |
|-------|--------|---------|
| 2026-04-12 | **MCP `apply_migration`** | Nombre remoto: `hosix_laboratorio_canonical_and_criterios` (versión registrada `20260412085258`). SQL ejecutado: secuencia `hosix_laboratorio_solicitud_seq` (IF NOT EXISTS), tabla **`hosix_laboratorio_criterios_referencia`**, índices, RLS y `COMMENT`. El resto del módulo lab ya existía en remoto por migración previa `20250206_015_hosix_laboratorio_asis_8` (`20251206102400`). |
| 2026-04-12 | **MCP `execute_sql` (verificación)** | `to_regclass('public.hosix_laboratorio_criterios_referencia')` → OK. |

**Pendiente:** export completo `pg_tables` / diff frente a §5 para cierre formal Fase 0.3.

```
(Pegar aquí diffs tabulares cuando se ejecute auditoría completa.)

```

---

## 1. Veracidad: ¿está “confirmado” Supabase?

| Fuente | Qué confirma |
|--------|----------------|
| **Migraciones en Git** (`supabase/migrations/`, `supabase/code/supabase/migrations/`) | Tablas, índices y funciones **definidas para** HOSIX si esas migraciones se aplican en orden en el proyecto Supabase. |
| **Proyecto Supabase remoto** | Solo se confirma conectando al proyecto y listando `information_schema.tables` / panel Supabase / `supabase db diff`. **No está garantizado** solo con el código del repo. |

**Conclusión:** aquí se documenta el **contrato versionado en Git**. Para afirmar que “todo está en Supabase” hay que ejecutar la comprobación en el entorno (staging/producción) que uses.

**Riesgo de despliegue:** existen rutas duplicadas (`supabase/migrations/supabase/migrations/`, y también `supabase/code/supabase/migrations/` con solapes de `hosix_almacenes`, `hosix_interconsultas`, etc.). Conviene unificar qué carpeta es la fuente de verdad del pipeline CI/CD.

---

## 2. Paquetes Tryton en el repo (53): ninguno omitido

Núcleo clínico Tryton/GNU Health y extensiones presentes en `tryton/`:

1. `health` — núcleo (paciente, institución, muchos modelos `gnuhealth_*` en el dump).
2. `health_archives`
3. `health_calendar`
4. `health_caldav`
5. `health_contact_tracing`
6. `health_crypto`
7. `health_crypto_lab`
8. `health_dentistry`
9. `health_disability`
10. `health_ems`
11. `health_federation`
12. `health_genetics`
13. `health_genetics_uniprot`
14. `health_gyneco`
15. `health_history`
16. `health_icd10`
17. `health_icd10pcs`
18. `health_icd11`
19. `health_icd9procs`
20. `health_icpm`
21. `health_icu`
22. `health_imaging`
23. `health_imaging_worklist`
24. `health_inpatient`
25. `health_inpatient_calendar`
26. `health_insurance`
27. `health_iss`
28. `health_lab`
29. `health_lifestyle`
30. `health_mdg6`
31. `health_ntd`
32. `health_ntd_chagas`
33. `health_ntd_dengue`
34. `health_nursing`
35. `health_ophthalmology`
36. `health_orthanc`
37. `health_pediatrics`
38. `health_pediatrics_growth_charts`
39. `health_pediatrics_growth_charts_who`
40. `health_qrcodes`
41. `health_reporting`
42. `health_services`
43. `health_services_imaging`
44. `health_services_lab`
45. `health_socioeconomics`
46. `health_stock`
47. `health_stock_inpatient`
48. `health_stock_nursing`
49. `health_stock_surgery`
50. `health_surgery`
51. `health_surgery_protocols`
52. `health_webdav3_server`
53. `health_who_essential_medicines`

*(Lista derivada de `tryton/health/__init__.py` y `tryton/health_*/__init__.py` en el workspace.)*

---

## 3. Leyenda de estado HOSIX (por módulo Tryton)

| Código | Significado |
|--------|-------------|
| **DB** | Hay tablas `hosix_*` o extensiones SQL claras en migraciones del repo. |
| **UI** | Existe página bajo `src/pages/Hosix/` y/o hook `useHosix*` relacionado. |
| **LOG** | Lógica de negocio Tryton **no** migrada de forma sistemática a Edge/RPC dedicada; solo infraestructura genérica (auth, permisos, CDS, FHIR, etc.). |
| **N/A** | Funcionalidad prevista vía otro canal (p. ej. JSONB en historia, formularios dinámicos, integración externa) o fuera de alcance hospitalario directo. |

**Importante:** “DB + UI” no implica **paridad funcional** con Tryton; indica que hay cimiento en el repo para seguir el espejo GNU.

---

## 4. Matriz módulo Tryton → HOSIX (repo actual)

| Módulo Tryton | Rol en GNU Health | Evidencia DB (repo) | Evidencia UI / hooks (repo) | Estado resumido |
|---------------|-------------------|---------------------|-----------------------------|-----------------|
| `health` | Paciente, institución, agenda clínica base, evaluaciones, etc. | `hosix_pacientes`, `hosix_historia_clinica`, contactos, documentos, urgencias, citas, hospitalización… | `Pacientes`, `Citas`, `Urgencias`, `Hospitalizacion`, hooks `useHosixPacientes`, etc. | **DB+UI**, **LOG** parcial (falta granularidad tipo `gnuhealth_patient_*` / party) |
| `health_archives` | Archivo papel / trazabilidad | `hosix_pacientes_documentos` | Parte de flujo paciente | **DB** parcial, **LOG** |
| `health_calendar` | Calendarios clínicos | `hosix_agendas`, `hosix_citas`, horarios | `Citas`, `useHosixCitas` | **DB+UI**, **LOG** |
| `health_caldav` | Sincronización CalDAV | — | — | **N/A** (sustituir por APIs/calendario HOSIX si aplica) |
| `health_contact_tracing` | Rastreo contactos | — | — | Pendiente |
| `health_crypto` | Firmas criptográficas | — | firmas en UI / políticas | Pendiente |
| `health_crypto_lab` | Cripto aplicada a resultados lab | — | — | Pendiente |
| `health_dentistry` | Odontología | `hosix_mapas_dentales` | `Medicos` / módulo médico | **DB** parcial, **LOG** |
| `health_disability` | Valoración discapacidad / ICF | — | — | Pendiente (o JSONB historia) |
| `health_ems` | Ambulancias / emergencias prehospitalarias | — | — | Pendiente |
| `health_federation` | Federación entre nodos GNU | — | — | Pendiente (arquitectura nacional) |
| `health_genetics` | Riesgo genético, variantes | — | — | Pendiente |
| `health_genetics_uniprot` | Enriquecimiento UniProt | — | — | Pendiente |
| `health_gyneco` | Ginecología | `hosix_obstetricia_*` (solapa parte) | `Obstetricia`, `useHosixObstetricia` | **DB+UI** parcial gineco-obstétrico |
| `health_history` | Historial / reportes históricos | `hosix_auditoria`, historia clínica | varios hooks | **DB+UI** parcial |
| `health_icd10` | CIE-10 | `hosix_diagnosticos_catalogo`, `hosix_diagnosticos*` | médicos / diagnósticos | **DB+UI** parcial (catálogo no equivale a import CIE completo) |
| `health_icd10pcs` | procedimientos ICD-10-PCS | — | — | Pendiente |
| `health_icd11` | CIE-11 | — | — | Pendiente |
| `health_icd9procs` | ICD-9 procedimientos | — | — | Pendiente |
| `health_icpm` | ICPM | — | — | Pendiente |
| `health_icu` | UCI (Apache, Glasgow, etc. en GH) | posible overlap con hospitalización | — | Pendiente / submódulo hospitalización |
| `health_imaging` | Imagen médica (modelo GH) | `hosix_imagenologia_*` | `Imagenologia`, `useHosixImagenologia` | **DB+UI**, **LOG** |
| `health_services_imaging` | Prestaciones imagen | mismas tablas facturación + imagenología | misma UI | **DB+UI**, **LOG** |
| `health_imaging_worklist` | Worklist DICOM | parcial en flujo solicitud/estudio | `Imagenologia` | **DB+UI** parcial, **LOG** |
| `health_orthanc` | Integración Orthanc / PACS | sin tablas tipo `gnuhealth_orthanc_*` en HOSIX | misma UI | Pendiente PACS nativo |
| `health_inpatient` | Hospitalización | `hosix_camas`, `hosix_hospitalizacion_*` | `Hospitalizacion`, `useHosixHospitalizacion` | **DB+UI**, **LOG** |
| `health_inpatient_calendar` | Calendario de camas / ingresos | overlap con `hosix_camas` / episodios | `Hospitalizacion` | **DB+UI** parcial, **LOG** |
| `health_insurance` | Seguros y planes | `hosix_aseguradoras`, `hosix_tarifas`, facturación | `Facturacion` | **DB+UI**, **LOG** |
| `health_services` | Catálogo prestaciones / venta servicio | facturación conceptos/cuentas | `Facturacion` | **DB+UI**, **LOG** |
| `health_socioeconomics` | Ocupación, etnia, nivel socioeconómico (GH) | parcial en `hosix_pacientes` / JSONB historia | formularios / paciente | **DB** parcial, **LOG** |
| `health_iss` | ISS / intervenciones salud | — | — | Pendiente |
| `health_lab` | Laboratorio clínico | `hosix_laboratorio_*` | `Laboratorio`, `useHosixLaboratorio` | **DB+UI**, **LOG** (criterios/rangos GH) |
| `health_services_lab` | Prestaciones laboratorio | mismas tablas + facturación | `Laboratorio`, `Facturacion` | **DB+UI**, **LOG** |
| `health_lifestyle` | Estilo de vida | — | — | Pendiente / historia JSONB |
| `health_mdg6` | Objetivos Desarrollo Milenio / indicadores | — | — | Zero footprint / indicadores nacionales |
| `health_ntd` | Enfermedades tropicales desatendidas (marco) | — | — | Zero footprint salvo política nacional |
| `health_ntd_chagas` | Vigilancia / du Chagas | — | — | Pendiente salvo programa explícito |
| `health_ntd_dengue` | Vigilancia dengue | — | — | Pendiente salvo programa explícito |
| `health_nursing` | Enfermería | `hosix_enfermeria_*` | `Enfermeria`, `useHosixEnfermeria` | **DB+UI**, **LOG** |
| `health_ophthalmology` | Oftalmología | — | — | Pendiente / formulario dinámico |
| `health_pediatrics` | Pediatría general | CRED + historia | `CRED`, consultas | **DB+UI** parcial |
| `health_pediatrics_growth_charts` | Curvas crecimiento | `hosix_cred_valoracion_desarrollo` | `CRED` | **DB** parcial, **LOG** |
| `health_pediatrics_growth_charts_who` | Curvas OMS | overlap CRED | `CRED` | **DB** parcial, **LOG** |
| `health_qrcodes` | QR identificación / reportes | — | — | Pendiente |
| `health_reporting` | Información sanitaria | `hosix_kpis_reportes` | `BI` | **DB+UI** parcial |
| `health_stock` | Farmacia / inventario general | `hosix_articulos*`, almacenes, stock, medicamentos | `Farmacia`, `Almacenes`, `Suministros` | **DB+UI**, **LOG** |
| `health_stock_inpatient` | Consumos hospitalización | stock + hospitalización | `Hospitalizacion`, `Farmacia` | **DB+UI**, **LOG** |
| `health_stock_nursing` | Consumos enfermería | stock + `hosix_enfermeria_*` | `Enfermeria` | **DB+UI**, **LOG** |
| `health_stock_surgery` | Consumos quirófanos | stock + `hosix_quirofanos*` | `Quirofanos` | **DB+UI**, **LOG** |
| `health_surgery` | Cirugía, acto operatorio | `hosix_quirofanos*`, `hosix_quirofanos_intervenciones` | `Quirofanos` | **DB+UI**, **LOG** |
| `health_surgery_protocols` | Protocolos quirúrgicos | — (no tabla dedicada GH en HOSIX) | `Quirofanos` | Pendiente / documentos |
| `health_webdav3_server` | WebDAV documentos | — | storage Supabase / otros | **N/A** / distinto stack |
| `health_who_essential_medicines` | Lista OMS medicamentos esenciales | `hosix_medicamentos`, `hosix_articulos` | farmacia | **DB** parcial, **LOG** |

---

## 5. Inventario de tablas `hosix_*` definidas en migraciones (repo)

Lista **deduplicada por nombre** (pueden existir definiciones solapadas entre archivos; revisar antes de aplicar todo en limpio):

- **Base / seguridad:** `hosix_departamentos`, `hosix_servicios`, `hosix_perfiles`, `hosix_usuarios`, `hosix_permisos_modulos`, `hosix_sesiones`, `hosix_auditoria`
- **Paciente / HCE:** `hosix_pacientes`, `hosix_historia_clinica`, `hosix_pacientes_contactos`, `hosix_pacientes_avisos`, `hosix_pacientes_documentos`
- **Urgencias / agenda:** `hosix_urgencias_episodios`, `hosix_urgencias_triage`, `hosix_agendas`, `hosix_agendas_horarios`, `hosix_citas`
- **Hospitalización / camas:** `hosix_camas`, `hosix_hospitalizacion_episodios`, `hosix_hospitalizacion_traslados`
- **Quirófanos (núcleo + ASIS):** `hosix_quirofanos`, `hosix_quirofanos_intervenciones`, `hosix_quirofanos_bloques`, `hosix_quirofanos_salas`, `hosix_quirofanos_equipos`, `hosix_quirofanos_programaciones`, `hosix_quirofanos_diario`, `hosix_quirofanos_mantenimiento`, `hosix_quirofanos_preferencias_cirujano`
- **Farmacia (núcleo + ASIS):** `hosix_medicamentos`, `hosix_prescripciones`, `hosix_dispensaciones`, `hosix_cpoe_prescripciones`, `hosix_farmacia_dispensario`, `hosix_farmacia_dispensaciones`, `hosix_farmacia_medicamentos_restringidos`, `hosix_farmacia_farmacovigilancia`, `hosix_farmacia_reacciones_adversas`, `hosix_farmacia_auditoria_dispensacion`, `hosix_drug_interactions`
- **Suministros / almacén:** `hosix_articulos_familias`, `hosix_articulos_grupos`, `hosix_articulos_unidades_dosis`, `hosix_articulos_ubicaciones`, `hosix_articulos_unidades_compra`, `hosix_articulos_unidades_dispensacion`, `hosix_articulos`, `hosix_articulos_tipos_envase`, `hosix_articulos_control_envase`, `hosix_almacenes`, `hosix_almacenes_depositos`, `hosix_stock`, `hosix_stock_lotes`, `hosix_stock_movimientos`, `hosix_ordenes_compra`, `hosix_ordenes_compra_lineas`, `hosix_inventarios`, `hosix_inventarios_lineas`, `hosix_centros_coste`, `hosix_proveedores`, `hosix_stock_medicamentos` (migración facturación; cuidar solape con stock general)
- **Facturación / caja / recobros:** `hosix_aseguradoras`, `hosix_tarifas`, `hosix_facturacion_cuentas`, `hosix_facturacion_conceptos`, `hosix_facturas`, `hosix_facturas_lineas`, `hosix_cajas_movimientos`, `hosix_kpis_reportes`, `hosix_cajas`, `hosix_cajas_turnos`, `hosix_cajas_formas_pago`, `hosix_cajas_cierres`, `hosix_cajas_arqueos`, `hosix_recobros`, `hosix_recobros_notas_cargo`, `hosix_recobros_notas_credito`, `hosix_recobros_solicitudes`, `hosix_recobros_morosidad`
- **Compras / licitaciones:** `hosix_presupuestos`, `hosix_licitaciones`, `hosix_licitaciones_partidas`, `hosix_licitaciones_ofertas`, `hosix_adjudicaciones`
- **Médicos / diagnósticos:** `hosix_medicos_worklist`, `hosix_diagnosticos`, `hosix_tratamientos`, `hosix_interconsultas`, `hosix_consultas_medicas`, `hosix_cuestionarios`, `hosix_mapas_dentales`, `hosix_diagnosticos_catalogo`, `hosix_ordenes_medicas`, `hosix_diagnosticos_pacientes`, `hosix_diario_clinico_medico`, variantes ASIS `hosix_interconsultas_especialidades`, `hosix_interconsultas_respuestas`, `hosix_interconsultas_seguimiento`, `hosix_interconsultas_referrals`, `hosix_interconsultas_comunicaciones`, y en `supabase/code/...`: `hosix_interconsultas_solicitudes`, `hosix_interconsultas_derivaciones` (posible duplicidad conceptual con migraciones `20250206_014`)
- **Enfermería:** `hosix_enfermeria_worklist`, `hosix_enfermeria_constantes`, `hosix_enfermeria_evaluaciones`, `hosix_enfermeria_planes`, `hosix_enfermeria_kardex`, `hosix_enfermeria_balance_hidrico`, `hosix_enfermeria_diario`
- **Laboratorio:** `hosix_laboratorio_pruebas_catalogo`, `hosix_laboratorio_solicitudes`, `hosix_laboratorio_solicitud_detalles`, `hosix_laboratorio_muestras`, `hosix_laboratorio_resultados`, `hosix_laboratorio_interpretacion`, `hosix_laboratorio_criterios_referencia` *(migración canónica `20260412120000_hosix_laboratorio_canonical.sql`; el SQL duplicado en `supabase/code/…` queda como referencia hasta limpieza)*
- **Imagenología:** `hosix_imagenologia_modalidades`, `hosix_imagenologia_protocolos`, `hosix_imagenologia_solicitudes`, `hosix_imagenologia_estudios`, `hosix_imagenologia_reportes`, `hosix_imagenologia_comparacion_estudios`
- **CRED / pediatría:** `hosix_cred_controles`, `hosix_cred_vacunas_catalogo`, `hosix_cred_vacunaciones`, `hosix_cred_esquema_vacunacion`, `hosix_cred_valoracion_desarrollo`
- **Obstetricia:** `hosix_obstetricia_tipos_parto`, `hosix_obstetricia_gestaciones`, `hosix_obstetricia_controles`, `hosix_obstetricia_partos`, `hosix_obstetricia_recien_nacidos`, `hosix_obstetricia_puerperio`

---

## 6. Otras tablas `public` relevantes (no `hosix_*`)

Incluidas en migraciones del mismo repo (RR.HH., disciplina, biometría, formularios, carnets, etc.): por ejemplo `dynamic_forms`, `form_submissions`, `dispositivos`, `attendance_logs`, `expedientes_disciplinarios`, tablas biométricas, `solicitudes_establecimientos`, `carnets_generados`, `areas_profesionales`, etc. Son parte del **ecosistema nacional** de HOSIX, no del espejo 1:1 Tryton.

---

## 7. Edge Functions Supabase presentes (`supabase/functions/`)

Incluyen piezas transversales: `hosix-auth-login`, `hosix-permisos-check`, `hosix-auditoria-eventos`, `fhir-api`, `cds-engine`, generación carnets/códigos, nóminas, biometría, expedientes, SMS, etc. **No** cubren aún la traducción exhaustiva módulo-a-módulo de los 53 paquetes `health*`.

---

## 8. Páginas React HOSIX (`src/pages/Hosix/`)

Rutas de producto ya acotadas: `HosixDashboard`, `Pacientes`, `AdmisionCentral`, `Citas`, `Urgencias`, `Hospitalizacion`, `Quirofanos`, `Farmacia`, `Prescripcion`, `Laboratorio`, `Imagenologia`, `Interconsultas`, `Medicos`, `Enfermeria`, `Obstetricia`, `CRED`, `Facturacion`, `Cajas`, `Recobros`, `Almacenes`, `Suministros`, `Compras`, `Configuracion`, `BI`, `HosixLogin`, etc. Cada una debe enlazarse en futuras iteraciones de este documento con **RPC/Edge** y **tablas** concretas por historia de usuario.

---

## 9. (Cerrado) Próximos pasos genéricos

Los ítems que antes vivían aquí están **desglosados por fase** en la **§10**. Mantener §9 como ancla histórica: cualquier referencia externa a “próximos pasos” debe apuntar a **§10**.

---

## 10. Plan por fases hasta el 100% y modo “solo ejecución”

### 10.0 Índice de fases (vista rápida)

| Fase | Nombre | Objetivo | Salida observable |
|------|--------|-----------|-------------------|
| **0** | Cimentación | Una sola fuente de migraciones; staging = Git; auditoría remota | §0.4 lleno; Fase 0 tabla con “sí” |
| **1** | Esquema / datos | Paridad de **datos** con GNU donde aplique; catálogos clínicos | Nuevas migraciones + RLS base |
| **2** | Lógica negocio | Reglas Tryton en RPC/Edge + hooks | Tests + `docs/[modulo].md` |
| **3** | UI/UX | Pantallas alineadas a contratos; tablet-first | Checklists por página Hosix |
| **4** | Documentación | Trazabilidad GNU para desarrolladores | Índice en `docs/` |
| **5** | Seguridad / performance / ops | RLS completa, consultas optimizadas, runbooks | Informes + políticas |
| **6** | Piloto clínico | Validación con usuarios reales | Actas + cierre de brechas |
| **7** | Cierre + solo ejecución | 53/53 estados finales; tag de versión | Tag Git + handover |

### 10.1 Definición de “100% completado” (criterio de cierre de proyecto alcance GNU→HOSIX)

Se considera el **100% del alcance acordado** cuando, para **cada uno de los 53 paquetes** listados en §2, exista **exactamente una** fila de decisión en la matriz ampliada (puede ser una copia operativa de §4 en hoja de cálculo enlazada) con uno de estos estados finales:

| Código final | Significado |
|----------------|-------------|
| **IMP** | Implementado: tablas Supabase (o vista/materializada) + **RLS** mínima + reglas críticas en RPC/Edge donde aplique + UI o flujo acordado + prueba de humo documentada. |
| **MET** | Metamodelo: no hay tablas GNU homónimas; la funcionalidad queda en **JSONB** / `dynamic_forms` / otro canal, con **especificación de campos** y validación en backend. |
| **EXC-GE** | **Zero footprint** para Guinea Ecuatorial: no se implementa el módulo GNU tal cual; existe **decisión firmada** (quién/cuándo) + **sustituto nacional** o “no aplica”. |
| **EXT** | Cubierto por **integración externa** (p. ej. PACS comercial, otro sistema MOH) con interfaz y responsable definidos. |

**100%** = los 53 paquetes tienen código final **IMP**, **MET**, **EXC-GE** o **EXT**, sin filas “Pendiente” sin decisión.

### 10.2 Definición de “solo ejecución”

Modo posterior al 100% de alcance: el backlog de **paridad GNU** está cerrado; el equipo solo atiende **incidentes**, **cambios normativos**, **optimización** y **nuevas necesidades nacionales** (cada una entra como nuevo ítem con su propio ciclo IMP/MET/EXC-GE/EXT y actualización de §0.2).

---

### Fase 0 — Cimentación (fuente única de verdad + auditoría remota)

| ID | Tarea | Entregable | Hecho (sí/no) |
|----|--------|------------|---------------|
| 0.1 | Designar **una** ruta canónica de migraciones aplicadas por CI/CD (`supabase/migrations` *o* fusión controlada con `supabase/code/…`). | `docs/ADR-001-migraciones-supabase-canonicas.md` | **sí** |
| 0.2 | Inventariar **conflictos** entre archivos (misma tabla `hosix_interconsultas*`, `hosix_almacenes*`, etc.); plan de merge o renombre. | Lista priorizada + PR(s) | no |
| 0.3 | **Auditoría Supabase remota:** `SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1;` + comparación con §5–§6. | Texto/tablas en **§0.4** | no |
| 0.4 | Alinear `supabase db diff` / migraciones pendientes en **staging** antes de producción. | Entorno staging sin drift | no |
| 0.5 | Definir **orden de despliegue** de migraciones legacy y congelar hashes conocidos. | Checklist despliegue | no |

**Micro-pasos sugeridos (Fase 0):** (a) clonar lista de archivos `.sql` en ambas carpetas y marcar duplicados; (b) probar `supabase db reset` en local solo con ruta canónica; (c) exportar `pg_dump --schema-only` desde staging post-merge y archivar en artefacto CI; (d) actualizar **§0.4** con el diff textual o enlace al ticket.

---

### Fase 1 — Esquema y datos (ETAPA 1: database first)

| ID | Tarea | Entregable | Hecho |
|----|--------|------------|-------|
| 1.1 | Matriz **tabla GNU (`gnuhealth_*` / Tryton) → tabla HOSIX** (crear / mapear / vista / no migrar) por dominios: paciente, hospitalización, quirófano, farmacia, laboratorio, imagen, seguros. | Hoja o `docs/mapa-tablas-gnu-hosix.md` | no |
| 1.2 | Scripts SQL incremental en repo (`supabase/migrations/`) para **gaps** aprobados; tipos PostgreSQL modernos (`uuid`, `timestamptz`, `jsonb` donde sustituya campos flex). | Migraciones versionadas | **parcial** — laboratorio canónico + criterios (`20260412120000_…`) |
| 1.3 | **Catálogos clínicos:** CIE-10/11, procedimientos (ICD-10-PCS / ICPM / ICD-9 si aplica), ISS — modelo de tablas + importación o API. | Migraciones + job carga | no |
| 1.4 | **Índices** por `paciente_id`, fechas, episodio; políticas **RLS** por centro/rol; vistas para listados pesados. | SQL + tests manuales RLS | no |
| 1.5 | (Opcional) Pipeline **ETL** desde `copia_total_salud.sql` solo donde haya datos históricos que migrar. | Script/documentación | no |

**Micro-pasos sugeridos (Fase 1), por vertical (repetir por cada uno: paciente → urgencias → …):** (a) extraer del dump solo `CREATE TABLE` / `ALTER` del subconjunto GNU; (b) proponer nombres `hosix_*` o `gh_*` y FKs con `ON DELETE` acorde a política clínica; (c) migración `up` + `down` o reversión documentada; (d) políticas RLS mínimas + rol de prueba; (e) semilla de datos catálogo en `supabase/seed.sql` si aplica; (f) actualizar matriz §4 columnas “Evidencia DB” para módulos tocados.

---

### Fase 2 — Lógica de negocio (ETAPA 2)

Para **cada** paquete `health*` con destino **IMP** o **MET**:

| ID | Tarea | Entregable |
|----|--------|------------|
| 2.1 | Leer `*.py` del módulo Tryton: validaciones, `states`, `depends`, cálculos, `defaults`. | Notas en `docs/[modulo].md` |
| 2.2 | Traducir a **PL/pgSQL** (funciones/triggers acotados) y/o **Edge Function** TypeScript; evitar duplicar lógica en React. | RPC + tests SQL o tests Edge |
| 2.3 | Exponer contrato estable (REST Edge o `supabase.rpc`); documentar errores de negocio. | OpenAPI breve o comentario en función |
| 2.4 | Hook React (`use…`) que **solo** llame al contrato; tipos TS alineados. | `src/hooks/…` |

**Orden sugerido de oleadas:** `health` (núcleo paciente/evaluación) → `health_lab` / `health_stock` / `health_inpatient` / `health_surgery` → `health_insurance` / `health_services` → resto según prioridad MOH.

**Micro-pasos sugeridos (Fase 2), por módulo oleada:** (a) inventariar clases Tryton y métodos `validate`, `on_change`, `get_rec_name` relevantes; (b) clasificar reglas en *DB constraint* vs *RPC transaccional* vs *Edge* (I/O externo); (c) implementar y versionar; (d) test automático mínimo (pgTAP / vitest Edge); (e) hook React de solo lectura/escritura acoplado al contrato; (f) entrada en `docs/[modulo].md` (herencia GNU, tablas, uso).

---

### Fase 3 — UI/UX (ETAPA 3)

| ID | Tarea | Entregable |
|----|--------|------------|
| 3.1 | Por pantalla en `src/pages/Hosix/`: checklist de campos frente a modelo Tryton equivalente. | Tabla en `docs/[pantalla].md` o en módulo |
| 3.2 | **Formularios por especialidad:** definición de esquema (JSON/schema o tablas metadatos) generada desde reglas Tryton relevantes. | Componente(s) dinámicos + fallback manual |
| 3.3 | Patrones **tablet**: tamaños táctil, menos pasos, estados offline-first donde ya exista infra (`useOffline*`). | UX review + issues cerrados |
| 3.4 | Accesibilidad y lectura en entorno hospitalario (contraste, jerarquía). | Criterios mínimos acordados |

**Micro-pasos sugeridos (Fase 3):** (a) wireframe por flujo (ingreso, prescripción, resultado lab); (b) mapa de estados de pantalla = estados Tryton equivalentes; (c) componentes compartidos (tabla densidad, formulario split); (d) prueba en viewport tablet 10–11"; (e) registrar capturas o enlace diseño en ticket + **§11**.

---

### Fase 4 — Documentación por pieza (ETAPA 4)

| ID | Tarea | Entregable |
|----|--------|------------|
| 4.1 | Por cada función RPC/Edge nueva: `docs/[nombre-modulo].md` con: lógica GNU heredada, tablas Supabase, uso para desarrolladores. | Archivo en `docs/` |
| 4.2 | Por cada **EXC-GE**: mismo formato explicando sustituto nacional o no aplicación. | Archivo en `docs/` |
| 4.3 | Índice maestro: tabla en este MD o `docs/README.md` con enlaces a todos los `docs/*.md` del proyecto HOSIX-GNU. | Índice actualizado |

**Micro-pasos sugeridos (Fase 4):** plantilla mínima en cada `docs/[modulo].md`: *Origen GNU (archivo Tryton)*, *Tablas Supabase*, *API expuesta*, *Errores de negocio*, *Ejemplo de llamada desde hook*.

---

### Fase 5 — Seguridad, rendimiento y operación (transversal)

| ID | Tarea | Entregable |
|----|--------|------------|
| 5.1 | Auditoría **RLS** en todas las tablas con datos de paciente; roles `hosix_usuarios` / JWT. | Lista + migraciones `policy` |
| 5.2 | **Performance:** paginación server-side, límites en joins, materialized views si aplica; monitoreo consultas lentas. | Informe + cambios |
| 5.3 | **Red variable:** colas offline, reintentos idempotentes en escrituras críticas. | Criterios + implementación donde falte |
| 5.4 | Copias de seguridad, restauración documentada, secretos fuera del repo. | Runbook corto |

**Micro-pasos sugeridos (Fase 5):** (a) matriz tabla → política RLS → rol afectado; (b) `EXPLAIN ANALYZE` en consultas críticas del vertical en staging; (c) lista de índices faltantes priorizada por impacto; (d) simulación offline (throttling red) en entorno de prueba.

---

### Fase 6 — Validación en piloto clínico

| ID | Tarea | Entregable |
|----|--------|------------|
| 6.1 | Casos de uso firmados con personal médico/enfermería por flujo (urgencias, ingreso, cirugía, alta, farmacia). | Acta o checklist firmado |
| 6.2 | Corregir brechas encontradas; actualizar §4 (matriz) y §0.2. | PRs + línea en **§11** |

**Micro-pasos sugeridos (Fase 6):** guión de prueba por actor (médico, enfermería, farmacia, admisión); registro de incidencias con severidad; criterio de “go/no-go” a producción.

---

### Fase 7 — Cierre de alcance GNU→HOSIX y entrada en “solo ejecución”

| ID | Tarea | Entregable |
|----|--------|------------|
| 7.1 | Verificar **53/53** filas con estado final IMP/MET/EXC-GE/EXT. | Captura o export de matriz |
| 7.2 | Congelar versión de producto “**HOSIX paridad GNU v1**”; tag Git. | Tag + notas de versión |
| 7.3 | Traspaso a operación: SLA, contactos, proceso de cambio. | Documento operaciones |

A partir de la Fase 7.3, las nuevas funcionalidades **no** forman parte del alcance “espejo GNU” salvo que se abra explícitamente un **HOSIX v2** con nueva entrada en **§11**.

---

## 11. Changelog del documento (plan maestro)

| Fecha | Autor / rol | Resumen |
|-------|-------------|---------|
| 2026-04-12 | Equipo | Creación documento: §0–§8 inventario y matriz §4; §9 ancla; §10 plan fases 0–7 y criterios IMP/MET/EXC-GE/EXT. |
| 2026-04-12 | Equipo | Añadidos §10.0 índice de fases, §0.4 anexo diff Supabase, corrección referencias §9.1→§10, §12→§11; norma de uso unificada. |
| 2026-04-12 | Equipo | Implementación: ADR-001; migración canónica laboratorio + `hosix_laboratorio_criterios_referencia`; `docs/laboratorio-gnu-hosix.md`; §5 y Fase 0.1 actualizados. |
| 2026-04-12 | Equipo | **MCP Supabase:** `apply_migration` `hosix_laboratorio_canonical_and_criterios` (v. `20260412085258`); verificación SQL en §0.4. |

---

*Documento maestro del repositorio SERMED2. Tras cada sprint: §0.2, §0.4 (si hay diff), marcar §10, y una línea en §11.*
