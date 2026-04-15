# Integración FDW: RENAPROSA ↔ HOSIX

**Status**: ⏳ EN DISEÑO

## 🎯 Objetivo

Permitir que HOSIX lea datos de RENAPROSA (profesionales, centros, especialidades) sin duplicación.

## 📋 Tablas RENAPROSA a Mapear

- `profesionales_sanitarios` → Used by ADMIN_1, ASIS_modules
- `centros_salud` → Used by ADMIN_1, ASIS_modules
- `especialidades` → Used by ADMIN_1

## ⚙️ Fases

| Fase | Tarea | Responsable | ETA |
|------|-------|-------------|-----|
| 1 | Network & Credenciales | DevOps | Semana 1 |
| 2 | Crear FDW en HOSIX | DB Architect | Semana 1 |
| 3 | Crear Foreign Tables | DB Architect | Semana 2 |
| 4 | Crear SQL Views | Backend | Semana 2 |
| 5 | Actualizar React components | Frontend | Semana 3 |

## 🔒 Seguridad

- FDW usa Service Role token de RENAPROSA
- RLS policies en HOSIX heredan acceso
- Lectura-only (SELECT) desde HOSIX

## 📞 Referencias

- INTEGRACION_CROSS_PROJECT_SUPABASE_MASTERPLAN.md
