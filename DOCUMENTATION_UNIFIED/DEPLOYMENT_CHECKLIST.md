# ASIS 13 HME - DEPLOYMENT CHECKLIST

## 🚀 PRE-DEPLOYMENT VALIDATION

### ✅ Code Quality Checks
- [ ] TypeScript compilation: `npm run build`
- [ ] All tests passing: `npm run test -- src/__tests__/ASIS_13*.test.ts`
- [ ] Linting clean: `npm run lint`
- [ ] No console errors in dev mode
- [ ] No TypeScript errors (strict mode)

### ✅ Database Migrations
- [ ] Migration file created: `20260417_001_create_ehr_schema_with_thalamus.sql`
- [ ] Test migration on staging: `supabase db push --dev`
- [ ] Verify all 7 tables created:
  - [ ] electronic_health_record
  - [ ] ehr_episode_links
  - [ ] ehr_document_storage
  - [ ] ehr_access_log
  - [ ] ehr_snapshot_history
  - [ ] ehr_thalamus_sync_log
  - [ ] ehr_transfer_requests
- [ ] Verify all triggers (6):
  - [ ] update_ehr_timestamp
  - [ ] update_ehr_on_episode_change
  - [ ] set_episode_sequence
  - [ ] mark_ehr_for_thalamus_sync
  - [ ] create_ehr_snapshot_before_update
  - [ ] [One more auto-generated]
- [ ] Verify all RLS policies (7) enabled
- [ ] Verify all indexes (18) created
- [ ] Test RLS with test users:
  - [ ] Patient can view own EHR
  - [ ] Physician can view assigned patients
  - [ ] Nurse can view vitals/meds
  - [ ] Admin audit access

### ✅ Edge Functions Deployment
- [ ] consolidate_ehr_summary: `supabase functions deploy consolidate_ehr_summary`
- [ ] log_ehr_access: `supabase functions deploy log_ehr_access`
- [ ] sync_ehr_to_thalamus: `supabase functions deploy sync_ehr_to_thalamus`
- [ ] generate_ehr_export: `supabase functions deploy generate_ehr_export`
- [ ] Test endpoint availability (POST to `/api/v1/...`)
- [ ] Verify JWT token generation
- [ ] Test error responses (400, 403, 500)

### ✅ Environment Configuration
- [ ] Set `VITE_THALAMUS_API_URL`: `https://thalamus.renaprosa.ec/api`
- [ ] Set `THALAMUS_API_KEY` in Supabase secrets
- [ ] Set `ENCRYPTION_KEY_ID` for end-to-end encryption
- [ ] Verify S3 bucket for document storage
- [ ] Verify email service for audit notifications
- [ ] Verify logging service (Sentry/LogRocket) configured

### ✅ THALAMUS Integration
- [ ] Verify THALAMUS API connectivity: `curl https://thalamus.renaprosa.ec/api/health`
- [ ] Test sync endpoint: `/ehr/sync-mirror`
- [ ] Test PMI endpoint: `/patients/master-index`
- [ ] Test transfer endpoint: `/transfers/initiate`
- [ ] Test cross-hospital query: `/data/cross-hospital-history`
- [ ] Verify encryption handshake (TLS 1.3+)
- [ ] Test retry logic on connection failure

### ✅ React Component Build
- [ ] All 5 components build without errors:
  - [ ] ElectronicHealthRecordDashboard.tsx (1,200 L)
  - [ ] EHRTimeline.tsx (600 L)
  - [ ] ResumenClinico.tsx (500 L)
  - [ ] DocumentStorage.tsx (400 L)
  - [ ] AuditLog.tsx (500 L)
- [ ] All 4 hooks export correctly:
  - [ ] useElectronicHealthRecord (600 L)
  - [ ] useEHRAccess (400 L)
  - [ ] useEHRTimeline (350 L)
  - [ ] useThalamusSync (450 L)
- [ ] No bundle size warnings
- [ ] Code splitting optimized

### ✅ HIPAA Compliance Verification
- [ ] Audit trail table has all 18 required fields
- [ ] Access logging triggers on every EHR view/edit/export
- [ ] Suspicious activity detection (3+ accesses in 5 min)
- [ ] Snapshots created before each update
- [ ] Encryption in transit (HTTPS/TLS)
- [ ] Encryption at rest configured (AES-256)
- [ ] Data retention policy implemented
- [ ] Anonymization for admin audit access

### ✅ Security Audit
- [ ] SQL injection prevention:
  - [ ] All queries use parametrized statements
  - [ ] No string concatenation in SQL
- [ ] XSS prevention:
  - [ ] All user inputs sanitized
  - [ ] React escaping enabled
  - [ ] Content-Security-Policy headers
- [ ] CSRF protection:
  - [ ] CSRF tokens validated
  - [ ] SameSite cookies configured
- [ ] Authentication:
  - [ ] JWT validation on all endpoints
  - [ ] Token expiration (15 min recommended)
  - [ ] Refresh token rotation
- [ ] Authorization:
  - [ ] RLS policies enforced
  - [ ] Role-based access control verified
  - [ ] Principle of least privilege

### ✅ Performance Testing
- [ ] Load test: 100 concurrent EHR queries
  - Expected response time: < 500ms
  - Expected failure rate: < 0.1%
- [ ] Sync performance: consolidate_ehr_summary with 100 episodes
  - Expected time: < 2 seconds
- [ ] Cross-hospital query: 1,000 hospitals
  - Expected time: < 5 seconds
- [ ] Export generation (PDF) with 50 episodes
  - Expected time: < 3 seconds

### ✅ User Acceptance Testing
- [ ] Test scenario 1: Create EHR → Add episode → Consolidate → Export
  - [ ] All steps succeed
  - [ ] Audit trail logged
  - [ ] THALAMUS sync triggered
- [ ] Test scenario 2: Transfer coordination
  - [ ] Select destination hospital
  - [ ] Request creates transfer_request record
  - [ ] Notification sent to destination hospital
- [ ] Test scenario 3: Cross-hospital history
  - [ ] View patient from Hospital A
  - [ ] See encounters from Hospital B
  - [ ] Patient Master Index prevents duplicates
- [ ] Test scenario 4: Audit trail export
  - [ ] CSV export includes all 18 fields
  - [ ] Filters working (date, access_type, reason)
  - [ ] Timestamps in ISO format

---

## 🔄 DEPLOYMENT STEPS

### Step 1: Database Migration
```bash
# Backup production database
supabase db backup

# Apply migration to staging first
supabase db push --db-url $STAGING_URI < 20260417_001_create_ehr_schema_with_thalamus.sql

# Wait 5 minutes, verify no errors
# Then apply to production
supabase db push --db-url $PRODUCTION_URI < 20260417_001_create_ehr_schema_with_thalamus.sql

# Verify tables created
supabase db query "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'"
```

### Step 2: Edge Functions Deployment
```bash
# Deploy functions (order matters due to dependencies)
supabase functions deploy log_ehr_access
supabase functions deploy consolidate_ehr_summary
supabase functions deploy sync_ehr_to_thalamus
supabase functions deploy generate_ehr_export

# Verify deployment
supabase functions list
supabase functions show consolidate_ehr_summary
```

### Step 3: Environment Variables
```bash
# Set in Supabase dashboard or via CLI
supabase secrets set VITE_THALAMUS_API_URL=https://thalamus.renaprosa.ec/api
supabase secrets set THALAMUS_API_KEY=your_api_key
supabase secrets set ENCRYPTION_KEY_ID=key_id

# For local dev
cp .env.example .env.local
# Edit with actual values
```

### Step 4: React Build & Deploy
```bash
# Build optimized production bundle
npm run build

# Deploy to Vercel/Netlify/Cloudflare
vercel deploy --prod
# OR
netlify deploy --prod
# OR
wrangler publish

# Verify deployment
curl https://your-app.vercel.app/health
```

### Step 5: THALAMUS Connection Verification
```bash
# Test connectivity
curl -X GET https://thalamus.renaprosa.ec/api/health \
  -H "Authorization: Bearer $THALAMUS_API_KEY"

# Should return:
# {"status":"healthy","version":"2.0.0"}

# Test sync endpoint
curl -X POST https://thalamus.renaprosa.ec/api/ehr/sync-mirror \
  -H "Authorization: Bearer $THALAMUS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### Step 6: Data Migration (If Upgrading)
```bash
# Migrate existing data to new schema
-- RUN THESE SQL COMMANDS CAREFULLY --
-- 1. Copy data from old tables (if any)
-- 2. Verify referential integrity
-- 3. Test RLS policies on migrated data
```

### Step 7: Smoke Tests on Production
```bash
# Run tests against production endpoints
npm run test:e2e -- --environment production

# Manual verification:
# 1. Create test patient EHR
# 2. Add episode
# 3. Verify consolidation
# 4. Export PDF
# 5. Check audit trail
# 6. Query THALAMUS (should show sync)
# 7. Initiate transfer request
# 8. View cross-hospital data
```

### Step 8: Gradual Rollout
```
Day 1: Deploy to 10% of hospitals (pilot group)
  - Monitor logs, errors, performance
  - Gather feedback
  
Day 2-3: Deploy to 50% of hospitals
  - Run additional load tests
  - Check database metrics (CPU, connections)
  
Day 4-5: Deploy to 100% of hospitals
  - Keep rollback plan ready
  - Monitor 24/7 for first 48 hours
```

---

## 🆘 ROLLBACK PLAN

### If Database Issues
```bash
# Restore from backup
supabase db restore --backup-id $BACKUP_ID

# Drop new tables (if needed)
DROP TABLE ehr_transfer_requests CASCADE;
DROP TABLE ehr_thalamus_sync_log CASCADE;
DROP TABLE ehr_snapshot_history CASCADE;
DROP TABLE ehr_access_log CASCADE;
DROP TABLE ehr_document_storage CASCADE;
DROP TABLE ehr_episode_links CASCADE;
DROP TABLE electronic_health_record CASCADE;
```

### If Functions Fail
```bash
# Disable problematic function
supabase functions delete sync_ehr_to_thalamus

# Revert to previous version
supabase functions deploy --source ./functions/backup/sync_ehr_to_thalamus
```

### If React Build Issues
```bash
# Rollback to previous version
vercel rollback
# OR
git revert <commit_hash>
npm run build && npm run deploy
```

---

## 📊 MONITORING POST-DEPLOYMENT

### Metrics to Watch (First 48 hours)
- [ ] API response time (p95 < 500ms)
- [ ] Error rate (< 0.1%)
- [ ] Database CPU usage (< 70%)
- [ ] Database connections (< 80 max)
- [ ] Sync success rate (> 99%)
- [ ] THALAMUS connectivity uptime (100%)
- [ ] Audit trail completeness (100% of access logged)

### Logging & Alerts
- [ ] Sentry alerts configured (errors, performance)
- [ ] Database slow query logs enabled
- [ ] Edge Function invocation logs checked
- [ ] Slack notifications set up for critical errors
- [ ] Daily summary email with key metrics

### Support Readiness
- [ ] Support team trained on ASIS 13 features
- [ ] FAQ document prepared
- [ ] Known issues list published
- [ ] Escalation procedures documented
- [ ] 24/7 on-call rotation scheduled

---

## ✅ DEPLOYMENT SIGN-OFF

**Deployer**: _________________  
**Date**: _________________  
**Environment**: Production / Staging  
**Version**: ASIS_13_v1.0  

**Sign-off Criteria - ALL MUST BE MET**:
- [ ] All code quality checks passed
- [ ] All database migrations verified
- [ ] All Edge Functions deployed successfully
- [ ] THALAMUS connectivity confirmed
- [ ] HIPAA compliance audit passed
- [ ] Security audit passed
- [ ] Performance testing met targets
- [ ] UAT scenarios passed
- [ ] Rollback plan ready
- [ ] Monitoring configured

**Status**: ☐ Ready for Production | ☐ Requires More Work

---

**Deployment Timeline**: 17-18 April 2026  
**Estimated Duration**: 4-6 hours  
**Downtime Expected**: 0 minutes (blue-green deployment)  
**Rollback Capability**: 24-48 hours
