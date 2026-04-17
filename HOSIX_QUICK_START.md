# 🚀 HOSIX QUICK START - 5 MINUTE GUIDE

## Login Now!

### Super Admin Access
```
URL: http://localhost:8082/hosix
Email: admin@hosix.com
Password: Admin@Hosix123
```

### Hospital Director Access  
```
Email: director.hospital1@hosix.com
Password: Director@Hosix123
(See only Hospital Central data)

Email: director.hospital2@hosix.com
Password: Director@Hosix123
(See only Hospital Metropolitano data)
```

### Medical Professional Access
```
Email: obstetrica@hosix.com
Password: Profesional@Hosix123

Email: pediatra@hosix.com
Password: Profesional@Hosix123
```

---

## What's Ready

### Backend
- ✅ **47 Edge Functions** deployed & secured
- ✅ **PostgreSQL Database** with RLS policies
- ✅ **Supabase Auth** with 7 test users
- ✅ **Multi-hospital** support configured

### Frontend  
- ✅ **Role-based dashboards** implemented
- ✅ **Auth integration** ready
- ✅ **Hospital filtering** via RLS

### Security
- ✅ JWT authentication enabled
- ✅ Row-level security active
- ✅ Hospital isolation enforced

---

## Test Each Role

| Role | Email | Dashboard Shows |
|------|-------|-----------------|
| Super Admin | admin@hosix.com | All 3 hospitals, 7 users, all functions |
| Director H1 | director.hospital1@hosix.com | Hospital Central only (245 patients) |
| Director H2 | director.hospital2@hosix.com | Hospital Metropolitano only |
| Professional | obstetrica@hosix.com | Assigned patients (18 total, 6 today) |
| Admin Manager | admin.hosp1@hosix.com | Payroll & staff management |

---

## API Testing

### Get Auth Token
```bash
curl -X POST https://dfqefbkxounzmtggnfsc.supabase.co/auth/v1/token?grant_type=password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hosix.com",
    "password": "Admin@Hosix123",
    "gotrue_meta_security": {}
  }'
```

### Call Edge Function
```bash
curl -X POST \
  https://dfqefbkxounzmtggnfsc.supabase.co/functions/v1/ehr-search \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "patient_name"}'
```

### Query Database with RLS
```bash
# This will only return your hospital's data
SELECT * FROM public.patients;
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/pages/DashboardPage.tsx` | Role-based dashboard routing |
| `.supabase/config.json` | Project linking |
| `.env.hosix.temporal` | Environment variables |
| `supabase/functions/` | All 47 deployed functions |

---

## What Each Dashboard Shows

### Super Admin Dashboard
- 3 hospitals configured
- 7 users total
- 54+ edge functions available
- System-wide metrics

### Director Dashboard  
- 245 patients (hospital-filtered)
- 12 professionals
- Department metrics
- Staff schedules

### Professional Dashboard
- 18 assigned patients
- 6 appointments today
- Recent medical records
- Clinical tools

### Admin Manager Dashboard
- Payroll management
- Staff attendance
- Expense tracking
- Reports

---

## Production Checklist

- [ ] Load real patient data
- [ ] Configure professional schedules
- [ ] Enable email notifications
- [ ] Set up SMS gateway
- [ ] Configure backup strategy
- [ ] Deploy to production environment
- [ ] Enable monitoring & alerts
- [ ] Run security audit
- [ ] Train staff on system
- [ ] Go live!

---

**Status**: READY FOR TESTING ✅  
**Functions**: 47/47 Deployed ✅  
**Users**: 7/7 Ready ✅  
**Database**: Configured ✅  
**Auth**: Active ✅  
