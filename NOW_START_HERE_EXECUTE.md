╔════════════════════════════════════════════════════════════════════════════════╗
║                                                                                  ║
║                      ⚡ QUICK START - EXECUTE NOW                              ║
║                                                                                  ║
║                  PHASE H Step-by-Step (Copy & Paste Commands)                  ║
║                                                                                  ║
╚════════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════════
✅ WHAT WAS ALREADY DONE
═══════════════════════════════════════════════════════════════════════════════════

1. ✓ main.tsx fixed → Now uses App.tsx (RENAPROSA home default)
2. ✓ App.tsx verified → Hospital button to "/hosix/*" working
3. ✓ Supabase verified → 26 migrations active ✓
4. ✓ PHASE H-I plan created (see FASE_H_I_INTEGRATED_PLAN.md)

═══════════════════════════════════════════════════════════════════════════════════
🎯 STEP 0: VERIFY CURRENT STATE (2 minutes)
═══════════════════════════════════════════════════════════════════════════════════

COPY & PASTE THIS:

```powershell
# Terminal 1: Start development server
npm run dev

# Expected output:
#   ✓ Local:    http://localhost:5173/
#   ✓ Press q to quit
```

Then in browser:
  ✓ Go to http://localhost:5173/
  ✓ You should see: RENAPROSA Home (green header)
  ✓ Look for: GREEN BUTTON labeled "Hospital" in top right
  ✓ Click it → Should go to HOSIX login page

If you see HOSIX by default → Something is wrong, contact me.
If you see RENAPROSA home → PERFECT! Continue below.

═══════════════════════════════════════════════════════════════════════════════════
🔧 PHASE H - STEP 1: AUTO FIX LINT ERRORS (30 seconds)
═══════════════════════════════════════════════════════════════════════════════════

COPY & PASTE THIS (in new PowerShell terminal, keep dev server running):

```powershell
cd "C:\Users\HP\Desktop\Proyectos y Empresas\geprostec\RENAPROSA\Renaprosa2\SERMED2"

npm run lint -- --fix

# Expected output:
#   ✓ Fixed XX files
#   ✓ Warnings may remain
```

What this does:
  - Auto-fixes ~15 "Unexpected any" type violations
  - Auto-fixes ~5 useEffect dependency warnings
  - Total: ~20 automatic fixes!

═══════════════════════════════════════════════════════════════════════════════════
🔍 PHASE H - STEP 2: MANUAL FIX (PostpartumCareForm.tsx) (5-10 minutes)
═══════════════════════════════════════════════════════════════════════════════════

COPY & PASTE THIS:

```powershell
# Find the file with syntax error
code "packages/hosix/src/modules/01-obstetrics/components/ASIS_04_Obstetricia/PostpartumCareForm.tsx"
```

IN VS CODE:
1. Press Ctrl+G (Go to line)
2. Type: 248
3. Look at line 248 area for:
   ❌ Unclosed tag: <Component> ... no closing </Component>
   ❌ Unescaped < or >: Text with math like "25 < 30"
   ❌ String formatting issue

4. Fix examples:
   ❌ WRONG: <div>Value: 25 < 30</div>
   ✓ RIGHT: <div>Value: 25 &lt; 30</div>

   ❌ WRONG: <div>Hello {name</div>
   ✓ RIGHT: <div>Hello {name}</div>

5. Save file (Ctrl+S)

═══════════════════════════════════════════════════════════════════════════════════
✔️ PHASE H - STEP 3: VERIFY FIXES (1-2 minutes)
═══════════════════════════════════════════════════════════════════════════════════

COPY & PASTE THIS (in Terminal):

```powershell
npm run lint 2>&1 | tail -50

# Expected:
#   ✓ Much fewer errors than before
#   ✓ Should show < 5 critical errors
```

═══════════════════════════════════════════════════════════════════════════════════
🏗️ PHASE H - STEP 4: BUILD VALIDATION (2-3 minutes)
═══════════════════════════════════════════════════════════════════════════════════

COPY & PASTE THIS:

```powershell
npm run build

# Expected output:
#   ✓ Exit code 0 (success!)
#   ✓ "✓ 400+ chunks written" or similar
#   ✓ NO TypeScript errors
```

If this FAILS:
  → See: FASE_H_I_INTEGRATED_PLAN.md (TROUBLESHOOTING MATRIX)
  → Most likely: Still have JSX issues, go back to STEP 2

═══════════════════════════════════════════════════════════════════════════════════
🎉 PHASE H COMPLETE!
═══════════════════════════════════════════════════════════════════════════════════

If you got here successfully:
  ✓ npm run build passes ✓
  ✓ Lint errors fixed ✓
  ✓ RENAPROSA home loads ✓
  ✓ Hospital button works ✓

NEXT: See PHASE H - STEP 5 below (component migration - 1 hour)

═══════════════════════════════════════════════════════════════════════════════════
📦 PHASE H - STEP 5: MIGRATE 39 REMAINING COMPONENTS (1 hour)
═══════════════════════════════════════════════════════════════════════════════════

COPY & PASTE THIS (List components to migrate):

```powershell
# List all remaining components
Get-ChildItem -Path "packages/hosix/src/components" -Recurse -Filter "*.tsx" |
  Where-Object { $_.Name -notmatch "__tests__|index" } |
  Select-Object Name |
  Format-Table -AutoSize

# Expected: ~39 files
# Save these names
```

Now, for EACH component, copy to appropriate module:

Examples:
```powershell
# Auth components
Move-Item -Path "packages/hosix/src/components/LoginComponent.tsx" `
          -Destination "packages/hosix/src/modules/00-core/auth/components/" -Force

# Patient components
Move-Item -Path "packages/hosix/src/components/PatientComponent.tsx" `
          -Destination "packages/hosix/src/modules/00-core/patients/components/" -Force

# ... repeat for all 39
```

Alternative: Use the mapping from FASE_H_DEPRECATED_CLEANUP_ROADMAP.md

═══════════════════════════════════════════════════════════════════════════════════
✅ PHASE H - STEP 6: CREATE COMPATIBILITY LAYER (5 minutes)
═══════════════════════════════════════════════════════════════════════════════════

COPY & PASTE THIS:

```powershell
# Create/edit the compatibility layer file
code "packages/hosix/src/components/index.ts"
```

PASTE THIS CONTENT:

```typescript
// COMPATIBILITY LAYER - Deprecated imports
// ⚠️ Use @/modules/XX-domain/components instead

// Re-export all components from new module locations
// This allows old imports to still work (backwards compatible)

// Auth components
export { LoginForm } from '@/modules/00-core/auth/components'
export { MFASetup } from '@/modules/00-core/auth/components'

// Patient components  
export { PatientProfile } from '@/modules/00-core/patients/components'

// ... add re-exports for all migrated components

// DEPRECATION NOTICE:
// This file will be removed in HOSIX v2.0
// New code should use: import { X } from '@/modules/XX/components'
```

═══════════════════════════════════════════════════════════════════════════════════
🧪 PHASE H - FINAL VALIDATION (5 minutes)
═══════════════════════════════════════════════════════════════════════════════════

COPY & PASTE THIS:

```powershell
# Verify all components moved
$count = (Get-ChildItem -Path "packages/hosix/src/modules" -Recurse -Filter "*.tsx" |
  Where-Object { $_.FullName -match "\\components\\" -and $_.Name -notmatch "__tests__|index" }).Count
Write-Host "Total components in modules/: $count (should be ~152)"

# Full lint check
npm run lint
# Expected: 0 critical errors

# Full test
npm test
# Expected: All pass (or skipped)

# Full build
npm run build
# Expected: Exit code 0
```

═══════════════════════════════════════════════════════════════════════════════════
🎊 PHASE H DONE!
═══════════════════════════════════════════════════════════════════════════════════

SUCCESS CHECKLIST:
  ☑ Lint fixed (npm run lint passes)
  ☑ Build succeeds (npm run build → exit 0)
  ☑ 152 components in modules/
  ☑ RENAPROSA home loads
  ☑ Hospital button visible & functional
  ☑ Can access HOSIX

NEXT PHASE: PHASE I (Testing - 2-3 days)
See: FASE_H_I_INTEGRATED_PLAN.md (PHASE I section)

═══════════════════════════════════════════════════════════════════════════════════
📊 ESTIMATED TIMING
═══════════════════════════════════════════════════════════════════════════════════

Timeline:
  STEP 1 (lint auto-fix):        30 seconds ⚡
  STEP 2 (manual JSX fix):        5-10 minutes
  STEP 3 (verify fixes):          1-2 minutes  
  STEP 4 (build validation):      2-3 minutes
  STEP 5 (component migration):   1 hour
  STEP 6 (compatibility layer):   5 minutes
  STEP 7 (final validation):      5 minutes
  ──────────────────────────────────────────
  TOTAL PHASE H:                  ~1.5 hours

Ready to start? Begin with: npm run dev

═══════════════════════════════════════════════════════════════════════════════════

Document: Quick Start - Executable Phase H
Status: READY TO EXECUTE
Last Updated: 2026-04-16
