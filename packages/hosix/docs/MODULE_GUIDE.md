# Module Guide

## How to Add a New Module

### Step 1: Plan Your Module

1. Give it a number (0N) and descriptive name
2. List components needed
3. Identify dependencies on other modules
4. Plan database schema

### Step 2: Create Structure

```bash
mkdir -p packages/hosix/src/modules/NN-name/{components,hooks,types,services}
touch packages/hosix/src/modules/NN-name/{index.ts,README.md}
```

### Step 3: Create Base Files

**types/index.ts** - Define all types
**services/moduleName.ts** - Business logic
**hooks/useModuleName.ts** - Custom hooks
**components/Component.tsx** - React components
**index.ts** - Public exports
**README.md** - Documentation

### Step 4: Document

Update README.md with:
- Description
- Objectives (with checkboxes)
- Component list
- Dependencies
- GNU Health reference

### Step 5: Register

Update `modules/index.ts` to export your new module:

```typescript
export * from './NN-name'
```

### Step 6: Create Migrations

Create database migrations in `migrations/hosix/NN-name/`

### Step 7: Test

- `npm run build` - No errors
- `npm run lint` - No warnings
- TypeScript strict mode validation

## Examples

### Minimal Module (CLI Reference)

```
Module: 09-imaging
├── components/
│   ├── ImagingOrderForm.tsx
│   ├── DicomViewer.tsx
│   └── RadiologyReport.tsx
├── hooks/
│   └── useImaging.ts
├── types/
│   └── imaging.types.ts
├── services/
│   └── imagingService.ts
├── index.ts
└── README.md
```

### Complete Module Dependencies

```
Module: 06-medications
Depends on:
- 00-core/patients (patient lookup)
- 08-diagnoses (ICD codes)
```

## Quality Checklist

- [ ] Module folder created with correct naming
- [ ] All subdirectories present (components, hooks, types, services)
- [ ] index.ts exports components, hooks, types, services
- [ ] README.md completed with description, objectives, dependencies
- [ ] All components documented with JSDoc
- [ ] Types are properly exported
- [ ] Services have CRUD methods (if applicable)
- [ ] Hooks follow naming convention (useXXX.ts)
- [ ] No console.log without DEBUG flag
- [ ] Imports are clean and ordered
- [ ] No circular dependencies
- [ ] Module registered in modules/index.ts

## Best Practices

1. **Keep components < 300 lines** - Split into smaller components if needed
2. **One component per file** - Use index.ts if you need to export multiple
3. **DRY principles** - Move repeated logic to hooks or services
4. **Test naming** - Use .test.tsx or .spec.ts suffix
5. **Type safety** - Use strict TypeScript, no `any`
6. **Documentation** - Every function should have JSDoc comments

## Common Mistakes to Avoid

❌ Importing from another module's internals (use index.ts exports)
❌ Creating components outside modules (put them in a module)
❌ Forgetting to update index.ts exports
❌ Missing README.md or README not updated
❌ Circular dependencies between modules
❌ Components > 500 lines (refactor!)
❌ Using `any` type
❌ console.log in production code
