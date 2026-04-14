# 🎯 FINAL PRE-DEMO DEPLOYMENT CHECKLIST

**Project:** HOSIX ASIS 04/05 Week 1  
**Demo Date:** Friday, April 16, 2026 @ 17:00  
**Deployment Window:** Friday 16:00-16:50 (50 minutes)  

---

## 📋 PHASE 1: FINAL BUILD VALIDATION (5 minutes)

### Code Compilation
- [ ] `npm run build` - No TypeScript errors
- [ ] All imports resolved correctly
- [ ] Production bundle size < 2MB (gzipped)
- [ ] No console warnings in CI

### Dependency Check
- [ ] `npm audit` - No critical vulnerabilities
- [ ] All @supabase packages latest
- [ ] React 19 compatibility verified
- [ ] Shadcn/UI components up to date

### Type Safety
- [ ] `npx tsc --noEmit` - Zero type errors
- [ ] TypeScript strict mode enabled
- [ ] All .ts/.tsx files passing type check
- [ ] No `any` types in critical paths

**Status:** ✅ Expected: PASS  
**Rollback Plan:** Revert to previous build if critical error

---

## 🗄️ PHASE 2: DATABASE DEPLOYMENT (10 minutes)

### Pre-Deployment Validation
- [ ] Backup current Supabase database
- [ ] Verify all migration files present
  - [ ] `20260412_001_create_obstetrics_tables.sql`
  - [ ] `20260412_002_create_cred_tables.sql`
- [ ] Check SQL syntax with `sqlparse` or `pg_dump` simulation

### Execute Migrations
```bash
# Terminal 1: Database deployment
supabase db push --dry-run        # Preview changes
supabase db push                  # Apply changes
supabase gen types typescript > src/types/supabase.ts
```

### Validation After Deploy
- [ ] Verify 11 tables created
  - [ ] pregnancy, delivery, puerperium, newborn_assessment, obstetric_complication
  - [ ] child_growth_control, developmental_milestone, vaccination_administration
  - [ ] vacation_schedule, problem_detection, cred_evaluation, who_growth_reference
- [ ] Check indices created (11 total)
- [ ] Verify RLS policies enabled
- [ ] Confirm pre-loaded data:
  - [ ] 8 obstetric complications
  - [ ] 11 Ecuador vaccines

**Status:** ✅ Expected: All 11 tables present, RLS enabled  
**Rollback Plan:** `supabase db reset` to previous state

---

## ⚙️ PHASE 3: EDGE FUNCTIONS DEPLOYMENT (15 minutes)

### Pre-Deployment Check
- [ ] All 4 function directories exist:
  - [ ] `obstetric_risk_calculator/index.ts` (180 lines)
  - [ ] `who_growth_percentile/index.ts` (250 lines)
  - [ ] `pregnancy_gestational_age/index.ts` (80 lines)
  - [ ] `vaccination_next_dose/index.ts` (170 lines)
- [ ] Each has correct Deno import statements
- [ ] Environment variables set in Supabase project

### Deploy Functions
```bash
# Terminal 1: Deploy all functions
supabase functions deploy obstetric_risk_calculator
supabase functions deploy who_growth_percentile
supabase functions deploy pregnancy_gestational_age
supabase functions deploy vaccination_next_dose
```

### Quick Test Each Function
```bash
# Terminal 1: Test function invocation (sample requests)
curl -X POST http://localhost:54321/functions/v1/obstetric_risk_calculator \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"pregnancy_id":"test-123"}'

# Expected: 200 status, JSON response with riskScore field
```

### Validation After Deploy
- [ ] Each function returns HTTP 200 (or appropriate error)
- [ ] Response time < 500ms
- [ ] Error handling works (request bad data)
- [ ] Logs visible in Supabase dashboard
- [ ] CORS headers present in responses

**Status:** ✅ Expected: All 4 functions callable  
**Rollback Plan:** Redeploy previous version if issues

---

## 🎨 PHASE 4: FRONTEND SETUP (10 minutes)

### Install & Build
```bash
# Terminal 2: Frontend preparation
npm install
npm run build
npm install -g serve  # For production testing
```

### Build Output Validation
- [ ] Build completed successfully (< 2 min)
- [ ] No TypeScript errors in output
- [ ] No critical ESLint warnings
- [ ] Assets folder contains:
  - [ ] index.html
  - [ ] css/ folder with styles
  - [ ] js/ folder with bundles

### Environment Configuration
- [ ] `.env.local` has Supabase credentials:
  - [ ] VITE_SUPABASE_URL = (staging project)
  - [ ] VITE_SUPABASE_ANON_KEY = (deployment key)
- [ ] `.env.local` NOT in git
- [ ] No hardcoded secrets in code

**Status:** ✅ Expected: Build artifact ready  
**Rollback Plan:** Use previous build artifact

---

## 🧪 PHASE 5: TEST EXECUTION (5 minutes)

### Unit Tests
```bash
# Terminal 3: Run tests
npm run test -- --passWithNoTests --coverage
```

### Expected Results
- [ ] useObstetricRisk tests: 20/20 PASS
- [ ] useWHOGrowth tests: 18/18 PASS
- [ ] ObstetricRiskAlert tests: 15/15 PASS
- [ ] Coverage report shows 81%+ average
- [ ] All test files found:
  - [ ] `src/hooks/useObstetricRisk.test.ts`
  - [ ] `src/hooks/useWHOGrowth.test.ts`
  - [ ] `src/components/ObstetricRiskAlert.test.tsx`

**Status:** ✅ Expected: 53/53 tests passing  
**Rollback Plan:** If tests fail, check for missing dependencies

---

## 🚀 PHASE 6: DEV SERVER STARTUP (5 minutes)

### Start Development Server
```bash
# Terminal 2 (clean) or Terminal 4: Start dev
npm run dev

# Expected output:
# VITE v4.x.x  ready in 300ms
# 
# ➜  Local:   http://localhost:5173/
# ➜  press h to show help
```

### Dev Server Validation
- [ ] Dev server started without errors
- [ ] Accessible at `http://localhost:5173`
- [ ] No 404 errors in console
- [ ] API connectivity verified (check Network tab)
- [ ] Hot reload working (make small change, verify refresh)

**Status:** ✅ Expected: Dev server running  
**Rollback Plan:** Kill terminal and restart

---

## ✅ PHASE 7: COMPONENT SMOKE TESTS (5 minutes)

### Manual Verification
Open browser to `http://localhost:5173` and verify:

#### Obstetrics Module
- [ ] Navigate to Obstetricia menu
- [ ] Forms load without console errors
- [ ] Can enter pregnancy data
- [ ] Risk gauge renders (0-100% visual)
- [ ] Recommendations display based on risk level

#### CRED Module
- [ ] Navigate to CRED menu
- [ ] Growth chart renders (if data exists)
- [ ] Milestone checkboxes interactive
- [ ] Vaccination schedule loads
- [ ] DDST screening questions appear

#### Error Handling
- [ ] Try invalid input in forms
- [ ] Check for user-friendly error messages
- [ ] Verify fallback calculations if edge functions unavailable
- [ ] Test offline mode (DevTools network throttle)

**Status:** ✅ Expected: All components render correctly  
**Rollback Plan:** Check browser console for errors

---

## 🎬 PHASE 8: DEMO PREPARATION (Final 5 minutes)

### Browser Setup
- [ ] Clear browser cache (`Ctrl+Shift+Delete`)
- [ ] Fresh login session ready
- [ ] Demo credentials prepared:
  - [ ] Username: demo@hosix.test
  - [ ] Password: (secure password from admin)
- [ ] Resolution set to 1920x1080 (or projector resolution)

### Demo Workflow Documents
- [ ] Pregnancy creation walkthrough printed
- [ ] CRED module workflow printed
- [ ] Screenshots taken of key screens
- [ ] Fallback video loaded (in case of issues):
  - [ ] [Screen recording of pregnancy→delivery workflow]
  - [ ] [Screen recording of CRED tracking workflow]

### Final Checks (T-5 min before demo)
- [ ] Internet connection stable (speed test)
- [ ] Supabase status page green (no incidents)
- [ ] Dev server still running (check terminal)
- [ ] Browser developer console clear (no errors)
- [ ] Projector/screen working
- [ ] Mic/speaker audio tested

---

## 📊 DEPLOYMENT TROUBLESHOOTING MATRIX

### If Database Push Fails
```
Error: "permission denied" 
Fix: Verify .env has correct SUPABASE_PROJECT_REF

Error: "constraint violation"
Fix: DB already has tables; use supabase db reset or supabase db push --force

Error: "connection timeout"
Fix: Check internet; verify Supabase status page
```

### If Edge Functions Won't Deploy
```
Error: "Function not found"
Fix: Verify directory structure exists

Error: "Module not found (deno)"
Fix: Use https:// imports for external deps

Error: "Timeout during deploy"
Fix: Check function size (shouldn't exceed 20MB)
```

### If Tests Fail
```
Error: "jest: command not found"
Fix: npm install jest @testing-library/react

Error: "Cannot find module '@supabase/supabase-js'"
Fix: npm install

Error: Specific test timeout
Fix: Increase timeout with --testTimeout=10000
```

### If Dev Server Won't Start
```
Error: "Port 5173 in use"
Fix: npm run dev -- --port 3000 (use different port)

Error: "TypeScript error"
Fix: npm run build (to see full errors)

Error: "API connection failed"
Fix: Verify VITE_SUPABASE_URL in .env.local
```

---

## 🎯 SUCCESS CRITERIA - ALL MUST BE GREEN ✓

### ✅ Pre-Flight (Before 16:00)
- [x] Code compiles with `npm run build`
- [x] TypeScript strict mode passes
- [x] All 53 unit tests passing
- [x] All files present and readable

### ✅ Deployment (16:00-16:50)
- [ ] SQL migrations applied (11 tables exist)
- [ ] Edge functions deployed (all 4 callable)
- [ ] Frontend build successful
- [ ] Dev server running at localhost:5173

### ✅ Demo Ready (16:50-17:00)
- [ ] Can login with demo credentials
- [ ] Obstetrics module renders
- [ ] CRED module renders
- [ ] Forms accept input
- [ ] Risk calculations work
- [ ] No console errors

---

## 📞 EMERGENCY CONTACTS

**If Demo Issues:**
1. Check browser console (F12) for errors
2. Refresh page (Cmd/Ctrl+R) and try again
3. Fall back to recorded video of workflow
4. Take questions while showing architecture diagram

**If Database Issues:**
- Rollback: `supabase db reset`
- Check Supabase dashboard for status
- Verify backup created before push

**If Edge Function Issues:**
- Verify function accessible: `curl https://.../functions/v1/[functionName]`
- Check Supabase function logs
- Use fallback calculation (already in code)

---

## 🎊 DEPLOYMENT SUCCESS CHECKLIST

```
✅ PHASE 1: Code compilation successful
✅ PHASE 2: Database migrations deployed
✅ PHASE 3: Edge functions callable
✅ PHASE 4: Frontend build ready
✅ PHASE 5: Tests passing
✅ PHASE 6: Dev server running
✅ PHASE 7: Components rendering correctly
✅ PHASE 8: Demo flow tested and working

🎉 DEPLOYMENT COMPLETE - READY FOR 17:00 DEMO! 🎉
```

---

## 📋 SIGN-OFF

**Frontend Lead:** _________________ Date: _______  
**Database Admin:** ________________ Date: _______  
**QA Lead:** _______________________ Date: _______  
**Project Manager:** ________________ Date: _______  

---

**Document Created:** April 12, 2026  
**Last Updated:** April 15, 2026 (deployment eve)  
**Status:** READY FOR DEPLOYMENT

