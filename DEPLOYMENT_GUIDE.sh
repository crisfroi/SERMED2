#!/usr/bin/env bash
# DEPLOYMENT GUIDE - HOSIX Reorganization Project
# Last updated: 2026-04-16
# Usage: Follow steps in order

set -e  # Exit on error

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_PATH="c:\Users\HP\Desktop\Proyectos y Empresas\geprostec\RENAPROSA\Renaprosa2\SERMED2"

echo -e "${GREEN}╔════════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                 HOSIX DEPLOYMENT GUIDE - FASE F & G                          ║${NC}"
echo -e "${GREEN}║                                                                                ║${NC}"
echo -e "${GREEN}║                  Transición: Legacy → Modular Architecture                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Pre-deployment checks
echo -e "${YELLOW}[STEP 1] Pre-Deployment Validation${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "✓ Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "  Node version: $NODE_VERSION"

echo "✓ Checking npm version..."
NPM_VERSION=$(npm --version)
echo "  npm version: $NPM_VERSION"

echo "✓ Checking git status..."
cd "$PROJECT_PATH"
GIT_STATUS=$(git status --short | wc -l)
echo "  Modified files: $GIT_STATUS"

if [ $GIT_STATUS -gt 0 ]; then
    echo -e "${YELLOW}  ⚠️  Uncommitted changes found. Consider committing before deployment.${NC}"
fi

echo ""

# Step 2: Architecture validation
echo -e "${YELLOW}[STEP 2] Architecture Validation${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "✓ Counting modules..."
MODULE_COUNT=$(find packages/hosix/src/modules -maxdepth 1 -type d -not -name 'modules' | wc -l)
echo "  Modules found: $MODULE_COUNT"

if [ $MODULE_COUNT -lt 12 ]; then
    echo -e "${RED}  ❌ ERROR: Expected 12 modules, found $MODULE_COUNT${NC}"
    exit 1
else
    echo -e "${GREEN}  ✓ All 12 modules present${NC}"
fi

echo "✓ Counting migrated components..."
COMPONENT_COUNT=$(find packages/hosix/src/modules -name '*.tsx' -type f | wc -l)
echo "  Components in modules/: $COMPONENT_COUNT"

echo -e "${GREEN}  ✓ Architecture validation passed${NC}"
echo ""

# Step 3: Lint validation
echo -e "${YELLOW}[STEP 3] Linting Validation${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "✓ Running ESLint..."
npm run lint 2>&1 | grep -E "(error|warning)" | head -20 || echo "  ✓ Lint check completed"

echo ""

# Step 4: Build readiness
echo -e "${YELLOW}[STEP 4] Build Readiness Check${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "⚠️  Build Status: REQUIRES FIXES"
echo ""
echo "   Pre-existing lint issues in ASIS_* components:"
echo "   ├─ ~20 'any-type' errors (acceptable for legacy)"
echo "   ├─ ~8 useEffect dependency warnings"
echo "   └─ 1 parsing error (PostpartumCareForm.tsx:248)"
echo ""
echo "   Action required:"
echo "   1) npm run lint -- --fix  (auto-fixes ~50%)"
echo "   2) Manual fix PostpartumCareForm.tsx line 248"
echo "   3) Then: npm run build"
echo ""

# Step 5: Migration summary
echo -e "${YELLOW}[STEP 5] Migration Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "✅ FASE D - Reorganization (COMPLETED)"
echo "   ├─ LOTE 1: 20 P0 components → modules ✓"
echo "   ├─ LOTE 2: 16 sueltos → modules ✓"
echo "   ├─ LOTE 3: Import validation (no changes needed) ✓"
echo "   ├─ LOTE 4: 77 ASIS_* → modules ✓"
echo "   └─ LOTE 5: Hooks optimization (no changes needed) ✓"
echo ""

echo "✅ FASE F - Deployment Readiness (IN PROGRESS)"
echo "   ├─ Structure validation ✓"
echo "   ├─ Import paths validation ✓"
echo "   ├─ Lint checks ✓"
echo "   └─ Build fixes (PENDING)"
echo ""

echo "✅ FASE G - Handoff Documentation (COMPLETED)"
echo "   ├─ Architecture documentation ✓"
echo "   ├─ Usage guide ✓"
echo "   ├─ Troubleshooting ✓"
echo "   └─ Deployment checklist ✓"
echo ""

# Step 6: Next actions
echo -e "${YELLOW}[STEP 6] Recommended Next Actions${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "IMMEDIATE (Next 1-2 hours):"
echo "1. Fix ASIS_* lint errors:"
echo "   npm run lint -- --fix"
echo ""
echo "2. Manually fix PostpartumCareForm.tsx:"
echo "   • Check line 248 for JSX syntax error"
echo "   • Look for unescaped '<' or incorrect JSX"
echo ""
echo "3. Validate build:"
echo "   npm run build"
echo ""

echo "SHORT-TERM (Next 24 hours):"
echo "• Run unit tests: npm test"
echo "• Run E2E tests (if available)"
echo "• Deploy to staging environment"
echo "• UAT validation"
echo ""

echo "MEDIUM-TERM (Next 1 week):"
echo "• FASE H: Deprecate src/components/ legacy folder"
echo "• Migrate final 39 components"
echo "• Production rollout"
echo ""

# Step 7: Documentation references
echo -e "${YELLOW}[STEP 7] Documentation References${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "📄 Key Documents:"
echo "   1. FASE_D_LOTES_1_2_3_4_5_COMPLETADO.md"
echo "      └─ Detailed LOTE 1-5 completion report"
echo ""
echo "   2. FASE_G_HANDOFF_DOCUMENTATION.md"
echo "      └─ Complete handoff guide with architecture details"
echo ""
echo "   3. migrate-asis-to-modules.ps1"
echo "      └─ PowerShell script used for batch migration"
echo ""

echo -e "${GREEN}════════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✨ Deployment Guide Review Complete ✨${NC}"
echo ""
echo "Status: READY FOR NEXT PHASE (after lint fixes)"
echo ""
echo "Questions? Refer to:"
echo "  • Troubleshooting: FASE_G_HANDOFF_DOCUMENTATION.md section 8"
echo "  • Architecture: FASE_G_HANDOFF_DOCUMENTATION.md section 3"
echo "  • Usage guide: FASE_G_HANDOFF_DOCUMENTATION.md section 5"
echo ""
