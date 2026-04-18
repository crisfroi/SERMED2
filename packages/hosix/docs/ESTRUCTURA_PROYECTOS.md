# Estructura de Proyectos: Renaprosa vs HOSIX

## ⚠️ IMPORTANTE: Dos Proyectos Independientes

Este es un **monorepo** que contiene DOS proyectos completamente separados:

### 1. **RENAPROSA** (Proyecto Principal - Raíz)
- **Ubicación**: Raíz del repositorio (`/src`)
- **Credenciales**: En `.env` (variable: `VITE_SUPABASE_*`)
- **Cliente Supabase**: `src/integrations/supabase/client.ts`
- **URL Supabase**: https://wdieynendfjbkbhfovrx.supabase.co
- **Propósito**: Sistema de Gestión de Salud - Renaprosa

### 2. **HOSIX** (Proyecto Nuevo - Carpeta Separada)
- **Ubicación**: `packages/hosix/src`
- **Credenciales**: En `.env.hosix` (variables: `VITE_HOSIX_SUPABASE_*`)
- **Cliente Supabase**: `packages/hosix/src/integrations/supabase/client.ts`
- **URL Supabase**: https://dfqefbkxounzmtggnfsc.supabase.co
- **Propósito**: Sistema de Gestión de Profesionales Sanitarios - HOSIX

## 📁 Estructura de Carpetas

```
SERMED2/
├── .env                              ← RENAPROSA credentials
├── .env.hosix                        ← HOSIX credentials (separado)
├── src/                              ← RENAPROSA code
│   ├── integrations/
│   │   └── supabase/
│   │       └── client.ts             ← RENAPROSA Supabase client
│   ├── pages/
│   ├── components/
│   └── ...
├── packages/
│   ├── hosix/
│   │   ├── package.json
│   │   └── src/
│   │       ├── integrations/
│   │       │   └── supabase/
│   │       │       ├── client.ts     ← HOSIX Supabase client
│   │       │       ├── types.ts
│   │       │       └── types/
│   │       ├── pages/
│   │       ├── components/
│   │       └── ...
│   ├── renaprosa/
│   │   └── package.json              ← Workspace reference
│   └── shared/
│       └── ...
└── ...
```

## 🔑 Variables de Entorno - NUNCA Mezclar

### Para RENAPROSA (en `.env`):
```env
VITE_SUPABASE_URL=https://wdieynendfjbkbhfovrx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### Para HOSIX (en `.env.hosix`):
```env
VITE_HOSIX_SUPABASE_URL=https://dfqefbkxounzmtggnfsc.supabase.co
VITE_HOSIX_SUPABASE_ANON_KEY=eyJhbGc...
```

## ✅ Reglas de Oro

1. **NUNCA** modificar `.env` para HOSIX
2. **NUNCA** usar `src/integrations/supabase/client.ts` en HOSIX
3. **SIEMPRE** usar `packages/hosix/src/integrations/supabase/client.ts` para HOSIX
4. **SIEMPRE** mantener credenciales separadas (`.env` vs `.env.hosix`)
5. Si necesitas actualizar HOSIX, edita **SOLO** en `packages/hosix/`

## 🚀 Scripts de Desarrollo (Por Definir)

Para mantener separado:
```bash
# RENAPROSA (actual)
npm run dev                   # Usa .env (RENAPROSA)

# HOSIX (futuro)
npm run dev:hosix           # Usa .env.hosix (HOSIX)
```

## 🔍 Cómo Verificar Que Todo Está Correcto

### Renaprosa debe usar:
- ✅ `.env` con URL: `https://wdieynendfjbkbhfovrx.supabase.co`
- ✅ `src/integrations/supabase/client.ts` (raíz)

### HOSIX debe usar:
- ✅ `.env.hosix` con URL: `https://dfqefbkxounzmtggnfsc.supabase.co`
- ✅ `packages/hosix/src/integrations/supabase/client.ts`

---
**Última actualización**: 2026-04-18
**Restaurado por**: GitHub Copilot
**Razón**: Separar Renaprosa y HOSIX en estructura de monorepo independiente
