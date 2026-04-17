╔════════════════════════════════════════════════════════════════════════════════╗
║                    🚀 FASE H - DEPRECATION & CLEANUP ROADMAP                  ║
║                                                                                  ║
║  Plan to eliminate legacy src/components/ and complete final 39 components   ║
║                          (ESTIMATED: 2-3 HOURS)                               ║
╚════════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════════════════════════

PHASE H is divided into 3 sub-tasks:

   FASE H1: Clean ASIS_* lint errors (1-2 hours)
   ├─ npm run lint -- --fix (auto-fix 50%)
   ├─ Manual fix: PostpartumCareForm.tsx:248
   └─ Validate: npm run build passes

   FASE H2: Deprecate src/components/ folder (1 hour)
   ├─ Audit remaining 39 components
   ├─ Map each to proper module
   ├─ Batch migrate to modules/
   └─ Keep src/components/ as compatibility layer (import from modules)

   FASE H3: Final validation & consolidation (30 mins)
   ├─ Run full test suite
   ├─ Verify all imports globally
   └─ Prepare for FASE I (testing)

═══════════════════════════════════════════════════════════════════════════════════
HISTORICAL CONTEXT: WHY WE HAVE 39 REMAINING COMPONENTS
═══════════════════════════════════════════════════════════════════════════════════

HOSIX Project Structure Evolution:

PHASE 1 (Initial): 150+ components loose in packages/hosix/src/components/
   ├─ 20 P0 applications (production-critical)
   ├─ 16 sueltos (unassigned, utility components)
   ├─ 77 ASIS_* (legacy from earlier system)
   └─ 39 remaining (various sources)
       ├─ MIGRATION_IN_PROGRESS (planned before interruption)
       ├─ DEPRECATED (old implementations, should be removed)
       ├─ NOT_DOCUMENTED (unknown origin)
       └─ COMPATIBILITY_LAYER (intentionally kept for backwards compat)

PHASE 2 (Current): Reorganization into 12 modules
   ├─ ✓ 20 P0 → modules/ (LOTE 1)
   ├─ ✓ 16 sueltos → modules/ (LOTE 2)
   ├─ ✓ 77 ASIS_* → modules/ (LOTE 4)
   └─ ⏳ 39 remaining → modules/ (FASE H2)

═══════════════════════════════════════════════════════════════════════════════════
FASE H1: FIX ASIS_* LINT ERRORS (1-2 HOURS)
═══════════════════════════════════════════════════════════════════════════════════

STEP 1: AUTO-FIX ~50% OF ERRORS
────────────────────────────────────────────────────────────────────────────────

Command: npm run lint -- --fix

Expected Output:
  ✓ Fixed 10-12 "Unexpected any" errors automatically
  ✓ Fixed useEffect dependency warnings (~5)
  ✓ Total auto-fixes: ~15 issues

Time: 30 seconds
Impact: Reduces manual work by 75%

STEP 2: MANUAL FIX - PostpartumCareForm.tsx:248 (PARSING ERROR)
────────────────────────────────────────────────────────────────────────────────

File: packages/hosix/src/modules/01-obstetrics/components/ASIS_04_Obstetricia/PostpartumCareForm.tsx
Line: 248

Root Cause: JSX syntax error (probably unclosed tag or < not escaped)

Instructions:
1. Open file in VS Code
2. Go to line 248 (Ctrl+G → type 248 → Enter)
3. Look for:
   - Unclosed JSX tags: <Component> without </Component>
   - Unescaped: < or > in text (should be &lt; &gt; or HTML entity)
   - String interpolation issue: " inside string

4. Fix example scenarios:
   ❌ WRONG: <div>Value: 25 < 30</div>
   ✓ RIGHT: <div>Value: 25 &lt; 30</div>

   ❌ WRONG: <Component style="color: red; font-size: 14px/>
   ✓ RIGHT: <Component style="color: red; font-size: 14px"/>

5. After fix → Save (Ctrl+S)

Time: 5-10 minutes
Impact: Removes parsing blocker for build

STEP 3: VALIDATE REMAINING ERRORS
────────────────────────────────────────────────────────────────────────────────

Command: npm run lint 2>&1 | tail -50

Expected: Remaining errors << 5 (only edge cases)

If still > 5 errors:
  → Run: npm run lint -- --fix again
  → Check new errors with: npm run lint 2>&1 | grep "error"

Time: 1 minute

STEP 4: BUILD VALIDATION
────────────────────────────────────────────────────────────────────────────────

Command: npm run build

Expected Output:
  ✓ Build succeeds with exit code 0
  ✓ Output: "Built successfully"
  ✓ No TypeScript errors
  ✓ No ESLint errors

If build fails:
  → Run: npm run build 2>&1 | tail -100 (see exact error)
  → Check error file + line number
  → Repeat STEP 2 (manual fix)

Time: 2-3 minutes

TOTAL TIME FOR FASE H1: 1-2 hours
SUCCESS CRITERIA: ✓ npm run build passes without errors

═══════════════════════════════════════════════════════════════════════════════════
FASE H2: DEPRECATE src/components/ FOLDER (1 HOUR)
═══════════════════════════════════════════════════════════════════════════════════

OBJECTIVE: Move remaining 39 components to modules/, create compatibility layer

STEP 1: AUDIT REMAINING COMPONENTS
────────────────────────────────────────────────────────────────────────────────

Command (PowerShell):
```powershell
# Find all remaining .tsx files in src/components/
Get-ChildItem -Path "packages/hosix/src/components" -Recurse -Filter "*.tsx" |
  Where-Object { $_.Name -notmatch "__tests__|index" } |
  Select-Object @{Name="File"; Expression={$_.Name}}, `
                @{Name="Path"; Expression={$_.FullName -replace ".*src\\components", "components"}},
                @{Name="Size"; Expression={$_.Length}} |
  Format-Table -AutoSize

# Count total
(Get-ChildItem -Path "packages/hosix/src/components" -Recurse -Filter "*.tsx" |
  Where-Object { $_.Name -notmatch "__tests__|index" }).Count

# Expected: 39 files
```

Expected Output: 39 files

STEP 2: CATEGORIZE COMPONENTS
────────────────────────────────────────────────────────────────────────────────

For each of the 39 remaining components, determine:

Use this decision matrix:

Component Name           │ Domain              │ Target Module
─────────────────────────┼─────────────────────┼──────────────────────────────
*Auth* | *Login*         │ Authentication      │ 00-core/auth/components/
*Patient* | *Demographic*│ Patient Management  │ 00-core/patients/components/
*EHR*                    │ Clinical Records    │ 00-core/ehr/components/
*Shared* | *Audit*       │ Shared Utilities    │ 00-core/shared/components/
*Pregnancy* | *Delivery* │ Obstetrics          │ 01-obstetrics/components/
*Pediatric* | *Growth*   │ Pediatrics          │ 02-pediatrics/components/
*Nutrition* | *Meal*     │ Nutrition           │ 03-nutrition/components/
*Surgery*                │ Surgery             │ 04-surgery/components/
*Vaccine* | *Immunize*   │ Immunization        │ 05-immunization/components/
*Drug* | *Medication*    │ Medications         │ 06-medications/components/
*Visit* | *Clinical*     │ Clinical Docs       │ 07-clinical-docs/components/
*Diagnosis* | *ICD*      │ Diagnoses           │ 08-diagnoses/components/
*Lab* | *Imaging*        │ Imaging             │ 09-imaging/components/
*HR* | *Payroll*         │ HR Admin            │ 10-admin-hr/components/
*Waiting* | *Schedule*   │ Operations Admin    │ 11-admin-operations/components/

If component name ambiguous:
  → Search in file content: grep -r "export.*Component"
  → Check imports: grep -r "import.*ComponentName"
  → Look at tests: grep -r "render\|describe" *.test.tsx

STEP 3: BATCH MOVE 39 COMPONENTS
────────────────────────────────────────────────────────────────────────────────

Script Template (PowerShell):

```powershell
# Define the 39 component → module mappings
$mappings = @{
    'ComponentA.tsx'          = '00-core\auth'
    'ComponentB.tsx'          = '00-core\patients'
    # ... (37 more mappings)
}

$srcDir = "packages/hosix/src"

foreach ($component in $mappings.Keys) {
    $source = Join-Path $srcDir "components" $component
    $target = Join-Path $srcDir "modules" $mappings[$component] "components"
    
    # Create target if not exists
    if (-not (Test-Path $target)) {
        New-Item -ItemType Directory -Path $target | Out-Null
    }
    
    # Move file
    if (Test-Path $source) {
        Move-Item -Path $source -Destination $target -Force
        Write-Host "✓ Moved $component"
    } else {
        Write-Host "⚠️ Not found: $component" -ForegroundColor Yellow
    }
}

Write-Host "`nDone! Moved $($mappings.Count) components"
```

Time: 5-10 minutes
Expected: 39 files moved, 0 errors

STEP 4: CREATE COMPATIBILITY LAYER
────────────────────────────────────────────────────────────────────────────────

Purpose: Existing code importing from old paths still works

File: packages/hosix/src/components/index.ts

Action: Create re-exports from new module locations

Example:
```typescript
// COMPATIBILITY LAYER - Old imports still work
// This file will be deprecated in HOSIX v2.0

// Auth components (moved to 00-core/auth)
export { LoginForm } from '@/modules/00-core/auth/components'
export { MFASetup } from '@/modules/00-core/auth/components'

// Patient components (moved to 00-core/patients)
export { PatientProfile } from '@/modules/00-core/patients/components'

// ... (re-export all 39)

// DEPRECATION NOTICE:
// ⚠️ Importing from this path is deprecated
// Use: import from '@/modules/XX-domain/components' instead
```

Important: This allows gradual migration without breaking existing code

Time: 5-10 minutes
Impact: Zero breaking changes for consumers

TOTAL TIME FOR FASE H2: 1 hour
SUCCESS CRITERIA: 
✓ 39 components moved
✓ Compatibility layer created
✓ All re-exports accessible

═══════════════════════════════════════════════════════════════════════════════════
FASE H3: FINAL VALIDATION (30 MINUTES)
═══════════════════════════════════════════════════════════════════════════════════

STEP 1: VERIFY ALL COMPONENTS ACCESSIBLE
────────────────────────────────────────────────────────────────────────────────

Command (PowerShell):
```powershell
# Count components in new locations
$count = (Get-ChildItem -Path "packages/hosix/src/modules" -Recurse -Filter "*.tsx" |
  Where-Object { $_.FullName -match "\\components\\" -and $_.Name -notmatch "__tests__|index" }).Count

Write-Host "Total components in modules/: $count"
# Expected: 152 (113 + 39)
```

STEP 2: RUN FULL LINT SUITE
────────────────────────────────────────────────────────────────────────────────

Command: npm run lint 2>&1

Expected: 0 critical errors, warnings acceptable

STEP 3: RUN FULL TEST SUITE
────────────────────────────────────────────────────────────────────────────────

Command: npm test

Expected: 
  ✓ All tests pass or
  ✓ Tests skipped (if not configured)
  ✗ NO FAILURES

STEP 4: BUILD FINAL VALIDATION
────────────────────────────────────────────────────────────────────────────────

Command: npm run build

Expected Output:
  ✓ Build succeeds with exit code 0
  ✓ Output shows "✓ 400+ chunks written"
  ✓ No TypeScript errors
  ✓ File size < 5MB

If build > 5MB:
  → Analyze: npm run build -- --analyze
  → Remove unused dependencies

TOTAL TIME FOR FASE H3: 30 minutes
SUCCESS CRITERIA:
✓ All 152 components in modules/
✓ Lint passes
✓ Tests pass
✓ Build succeeds
✓ File size acceptable

═══════════════════════════════════════════════════════════════════════════════════
ROLLOUT CHECKLIST FOR FASE H
═══════════════════════════════════════════════════════════════════════════════════

Pre-Execution:
☐ Backup current state: git checkout -b fase-h-backup
☐ Review this roadmap with team
☐ Allocate 3-4 hours uninterrupted time

Execution:
☐ FASE H1: Fix lint errors
  ☐ npm run lint -- --fix
  ☐ Manual fix PostpartumCareForm.tsx:248
  ☐ npm run build validates
☐ FASE H2: Migrate 39 remaining components
  ☐ Audit & categorize 39 components
  ☐ Execute batch move script
  ☐ Create compatibility layer (index.ts re-exports)
☐ FASE H3: Final validation
  ☐ Verify component count (152 total)
  ☐ npm run lint passes
  ☐ npm test passes
  ☐ npm run build succeeds

Post-Execution:
☐ Run git status (should be clean or minor changes)
☐ Create git commit: "FASE H: Complete modular reorganization (152/152 components)"
☐ Create git tag: release/hosix-v1.0-modular
☐ Notify team: FASE H complete, ready for FASE I
☐ Schedule FASE I (testing) for next iteration

═══════════════════════════════════════════════════════════════════════════════════
DECISION TREE: WHAT IF SOMETHING GOES WRONG?
═══════════════════════════════════════════════════════════════════════════════════

PROBLEM: npm run build still fails after lint fixes
SOLUTION:
  1. Save error: npm run build 2>&1 > build-error.log
  2. Analyze top 10 lines of error
  3. If "Cannot find module @/modules/XX": Check path exists
  4. If "Unexpected token": Still JSX syntax error, find all via grep
  5. Rollback: git checkout src/modules/
  6. Start over with FASE H1, step 2 (manual fix)

PROBLEM: npm test fails after migration
SOLUTION:
  1. Check if tests are looking for old paths
  2. Update test imports: sed -i 's|../../../components|@/modules/XX/components|g' *.test.tsx
  3. Re-run: npm test
  4. If still failing: npm test -- --no-coverage --verbose

PROBLEM: Circular dependency detected
SOLUTION:
  1. Find which modules: npm run build 2>&1 | grep -i "circular"
  2. Move shared code to 00-core/shared/
  3. Verify: npm run build
  4. If persists, check for: Module A imports B, Module B imports A

PROBLEM: Component not found during import
SOLUTION:
  1. Verify file exists: ls modules/XX-name/components/ComponentName.tsx
  2. Verify file is exported in index.ts
  3. Check typo in import path (case-sensitive)
  4. Restart dev server: npm run dev (clears cache)
  5. VSCode: Command Palette → Developer: Reload Window

PROBLEM: Too many remaining components are unclear what module
SOLUTION:
  1. Create "TBD" folder in 00-core/shared/components/TBD/
  2. Move unclear components there temporarily
  3. Incremental migration: Move 5-10 at a time instead of all 39
  4. Team review: Ask domain experts where each belongs
  5. Continue FASE H2 with confirmed mappings

═══════════════════════════════════════════════════════════════════════════════════
SUCCESS METRICS (FASE H COMPLETE)
═══════════════════════════════════════════════════════════════════════════════════

Completion Criteria:

✓ All 152 components in modular structure (100%)
✓ Zero components in src/components/ legacy folder
✓ Lint errors: 0 (from ~20 down to 0)
✓ Build succeeds: ✓ (exit code 0)
✓ Tests pass: ✓ (all green or skipped)
✓ No circular dependencies: ✓ 
✓ Imports all resolvable: ✓
✓ Compatibility layer working: ✓

Quality Metrics:
✓ Code structure: Logical (domain-based grouping)
✓ Discoverability: High (clear module names)
✓ Maintainability: High (centralized by domain)
✓ Testability: High (module-level tests possible)
✓ Scalability: Production-ready (12-module architecture)

Key Achievements:
✓ 100% component migration (from 150 scattered → 152 organized)
✓ 0 breaking changes during migration
✓ Backwards compatibility maintained (old imports via re-export layer)
✓ Production-ready modular architecture
✓ Ready for FASE I (testing) and FASE J (production release)

═══════════════════════════════════════════════════════════════════════════════════
NEXT PHASE: FASE I & J (POST FASE H)
═══════════════════════════════════════════════════════════════════════════════════

After FASE H is complete, proceed with:

FASE I: COMPREHENSIVE TESTING (2-3 days)
├─ Unit tests per module (jest)
├─ E2E tests per workflow (cypress)
├─ Integration tests (TestContainers, Layer 2 smoke tests)
├─ Performance benchmarking
└─ UAT sign-off

FASE J: PRODUCTION RELEASE (1-2 days)
├─ Staging deployment (10% canary)
├─ Production deployment (progressive rollout)
├─ Monitoring & alerting
└─ Rollback plan ready

Timeline: 3-5 days estimated
Expected: HOSIX v1.0 with modular architecture in production

═══════════════════════════════════════════════════════════════════════════════════

Document: FASE H - Deprecation & Cleanup Roadmap
Created: 2026-04-16
Status: READY FOR EXECUTION
Estimated Duration: 3-4 hours
Success Rate: 95%+ (following this roadmap)

Questions? Refer to:
- FASE_G_HANDOFF_DOCUMENTATION.md (comprehensive guide)
- QUICK_REFERENCE_CARD.md (quick lookup)
- ARCHITECTURE_VISUAL_COMPLETE.md (structure reference)
- DEPLOYMENT_GUIDE.sh (automation scripts)
