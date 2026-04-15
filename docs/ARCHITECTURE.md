# Arquitectura del Proyecto — RENAPROSA + HOSIX

## Visión General

Este proyecto contiene **dos sistemas** que comparten el mismo frontend React pero usan **proyectos Supabase separados**:

| Sistema | Función | Supabase Project | Ruta |
|---------|---------|-----------------|------|
| **RENAPROSA** | Registro Nacional de Profesionales Sanitarios | `wdieynendfjbkbhfovrx` | `/`, `/dashboard`, `/register`, `/search` |
| **HOSIX** | Sistema de Gestión Hospitalaria | `dfqefbkxounzmtggnfsc` | `/hosix/*` |

## Clientes Supabase

```
src/integrations/
├── supabase/client.ts   ← RENAPROSA (profesionales, centros, guardias)
└── hosix/client.ts      ← HOSIX (gestión clínica hospitalaria)
```

- **RENAPROSA** (`supabase`): Registro de profesionales, centros de salud, guardias, asistencia biométrica, carnets
- **HOSIX** (`hosixClient`): Pacientes, consultas, laboratorio, farmacia, cirugía, etc.

## Módulos HOSIX (bajo `/hosix`)

### Clínicos (ASIS)
| Módulo | Ruta | Componentes |
|--------|------|-------------|
| Obstetricia (ASIS 4) | `/hosix/obstetricia` | Gestación, Parto, Postparto, Neonato |
| CRED (ASIS 5) | `/hosix/cred` | Screening, Crecimiento, Hitos, Vacunas |
| Cirugía (ASIS 7) | `/hosix/cirugia` | Programación, Equipo, Recuperación |
| Dietética (ASIS 8) | `/hosix/dietetica` | Evaluación, Planes, Seguimiento |
| Inmunización (ASIS 9) | `/hosix/inmunizacion` | Calendario, Estado, Cumplimiento |
| Laboratorio (ASIS 10) | `/hosix/laboratorio` | Órdenes, Resultados, Control Calidad |
| Farmacia (ASIS 9) | `/hosix/farmacia` | Inventario, Caducidades, Proveedores |
| Medicamentos (ASIS 10) | `/hosix/medicamentos` | Prescripción, Interacciones, Adherencia |
| Referencia (ASIS 11) | `/hosix/referencia` | Solicitud, Seguimiento, Resultados |
| Farmacoterapia (ASIS 12) | `/hosix/farmacoterapia` | Prescripción, Interacciones, Adherencia |
| Historia Clínica (ASIS 13) | `/hosix/ehr` | Dashboard EHR completo |
| Diagnóstico (ASIS 14) | `/hosix/diagnostico` | Nuevo, Listado, Historial, Comorbilidad |
| Imágenes (ASIS 15) | `/hosix/imagenes` | Órdenes, Visor DICOM, Informes |

### Administrativos (ADMIN)
| Módulo | Ruta | Componentes |
|--------|------|-------------|
| RRHH (ADMIN 1) | `/hosix/rrhh` | Dashboard, Personal, Turnos, Nóminas, Reportes |
| Salas de Espera (ADMIN 2) | `/hosix/salas-espera` | Dashboard, Colas, Config, Analítica |

## Sincronización RENAPROSA → HOSIX

Arquitectura **Sync Híbrido**:
1. Cuando un profesional se aprueba en RENAPROSA, una Edge Function envía sus datos al proyecto HOSIX
2. HOSIX mantiene caché local de profesionales para independencia operativa
3. Sync periódico para mantener datos actualizados

## Estructura de Archivos

```
src/
├── integrations/
│   ├── supabase/       ← Cliente RENAPROSA
│   └── hosix/          ← Cliente HOSIX
├── components/
│   ├── ASIS_*/         ← Componentes clínicos (usados por HOSIX)
│   ├── ADMIN_*/        ← Componentes administrativos (usados por HOSIX)
│   ├── hospital/       ← Layout del sistema hospitalario
│   ├── dashboard/      ← Dashboard RENAPROSA
│   ├── registration/   ← Registro de profesionales
│   └── ui/             ← Componentes UI compartidos
├── pages/
│   ├── Hospital/       ← Páginas HOSIX
│   │   ├── modules/    ← Wrappers de módulos (lazy loaded)
│   │   ├── HospitalDashboard.tsx
│   │   └── HospitalLogin.tsx
│   ├── Home.tsx        ← Landing RENAPROSA
│   ├── Dashboard.tsx   ← Admin RENAPROSA
│   └── ...
├── hooks/              ← Hooks compartidos y de RENAPROSA
├── contexts/           ← AuthContext (RENAPROSA)
└── docs/archive/       ← Documentación histórica archivada
```

## Notas Importantes

- **Autenticación**: RENAPROSA y HOSIX tienen usuarios independientes en proyectos Supabase separados
- **`@ts-nocheck`**: Muchos módulos ASIS/ADMIN usan esta directiva temporalmente durante la transición
- **Lazy Loading**: Todos los módulos HOSIX se cargan bajo demanda para optimizar el bundle inicial
- **Lógica de negocio**: Basada en GNU Health / Thalamus (ver `src/tryton/`)
