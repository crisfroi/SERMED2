-- Architecture Documentation

# HOSIX Architecture

## Overview

HOSIX is a hospital management system (HMS) built on GNU Health principles. It's organized as a professional, modular monorepo with strict separation of concerns.

## Organization

### Modules (12 in Phase 1)

```
Core Infrastructure (Module 00)
├── auth - Authentication & RBAC
├── ehr - Electronic Health Records
├── patients - Patient management
└── shared - Transversal components

Clinical Modules (Modules 01-09)
├── 01-obstetrics
├── 02-pediatrics
├── 03-nutrition
├── 04-surgery
├── 05-immunization
├── 06-medications
├── 07-clinical-docs
├── 08-diagnoses
└── 09-imaging

Administration (Modules 10-11)
├── 10-admin-hr
└── 11-admin-operations
```

### Edge Functions (Deno)

```
Functions organized by domain:
├── hospitalization/ (6 functions)
├── referral/ (3 functions)
└── shared/ (2 functions)
```

### Database Migrations

```
Organized by module:
├── hosix/001-auth/
├── hosix/002-patients/
├── hosix/003-ehr/
└── ... (one per module)
```

## Key Principles

1. **Modularity** - Each module is independently deployable
2. **Type Safety** - TypeScript strict mode 100%
3. **Documentation** - Every module has README.md
4. **Testability** - Each module should have tests
5. **Scalability** - Easy to add new modules

## Module Structure

Each module follows this pattern:

```
modules/NN-name/
├── components/      # React components
├── hooks/           # Custom hooks
├── types/           # TypeScript types
├── services/        # Business logic
├── index.ts         # Public exports
└── README.md        # Module documentation
```

## Workflow

### Adding a New Component

1. Create in appropriate module's `components/` folder
2. Add types in module's `types/` folder
3. Add hooks in module's `hooks/` folder
4. Export from module's `index.ts`
5. Document in README.md

### Adding a New Module

1. Create folder structure: `modules/NN-name/`
2. Create subdirectories: `components/`, `hooks/`, `types/`, `services/`
3. Create `index.ts` and `README.md`
4. Create migrations in `migrations/hosix/NN-name/`
5. Register in `modules/index.ts`

## Deployment

- **Frontend** - React app in `packages/hosix/`
- **Backend** - Supabase Deno functions
- **Database** - PostgreSQL with RLS
- **Container** - Docker/Kubernetes ready

## References

- GNU Health: https://www.gnuhealth.io/
- Supabase: https://supabase.com/
- TypeScript: https://www.typescriptlang.org/
