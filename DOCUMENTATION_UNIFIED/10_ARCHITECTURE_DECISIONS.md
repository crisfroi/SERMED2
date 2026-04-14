# 🏛️ ARCHITECTURE DECISIONS & DESIGN PATTERNS

**Document Version**: 1.0  
**Created**: 2026-04-12 22:35:00 UTC  
**Updated**: 2026-04-12 22:35:00 UTC  
**Status**: Active Reference  

---

## 📋 TABLE OF CONTENTS

1. [Technology Stack](#technology-stack)
2. [Architecture Patterns](#architecture-patterns)
3. [Data Patterns](#data-patterns)
4. [Security Patterns](#security-patterns)
5. [Performance Optimization](#performance-optimization)
6. [Testing Patterns](#testing-patterns)
7. [Deployment Patterns](#deployment-patterns)

---

## 🛠️ TECHNOLOGY STACK

### Frontend Stack (Why?)

**React 18+**
- ✅ Component reusability across modules
- ✅ Virtual DOM optimization
- ✅ Large ecosystem & community support
- ✅ TypeScript support mature
- Impact: Faster development, better maintainability

**TypeScript**
- ✅ Type safety prevents runtime errors
- ✅ Better IDE support (autocomplete, refactoring)
- ✅ Self-documenting code
- ✅ Easier team collaboration
- Strict Mode: Always enabled for maximum safety
- Impact: Higher code quality, easier maintenance

**Shadcn/UI Components**
- ✅ Accessible by default (WCAG AA)
- ✅ Customizable via CSS variables
- ✅ Copy-paste component installation
- ✅ Based on Radix UI (production-grade)
- Impact: Consistent UI, faster development, accessibility compliance

**Recharts for Visualization**
- ✅ Composable chart components
- ✅ Responsive & mobile-friendly
- ✅ ARIA accessible
- ✅ Good performance with large datasets
- Impact: Professional data visualization, interactive charts

### Backend Stack (Why?)

**Supabase (PostgreSQL)**
- ✅ Real-time capabilities
- ✅ Built-in authentication
- ✅ Row-Level Security (RLS)
- ✅ Serverless Edge Functions
- ✅ Vector similarity search (future AI features)
- Impact: Reduced infrastructure complexity, faster API development

**PostgreSQL Features Used**:
- Extensibility: uuid-ossp, pg_trgm (full-text search)
- Constraints: Foreign keys, check constraints, unique
- Triggers: Audit logging, denormalization
- JSON operations: Flexible schema areas
- Arrays: For flexible lists (supplements, food groups, etc.)

**Edge Functions (Deno)**
- ✅ TypeScript native (no transpilation)
- ✅ Secure by default (sandboxed)
- ✅ Fast cold starts
- ✅ Can run database logic close to data
- Impact: Faster response times, simpler deployment

**RLS (Row-Level Security)**
- ✅ Patient data isolation at database level
- ✅ No application-layer security bypass possible
- ✅ Automatic in all queries
- Impact: HIPAA compliance, patient privacy guaranteed

### Testing Stack (Why?)

**Jest**
- ✅ Zero-config JavaScript testing framework
- ✅ Built-in coverage analysis
- ✅ Excellent React component testing
- ✅ Fast with parallel test execution
- Impact: Comprehensive test coverage, fast feedback loop

**React Testing Library**
- ✅ Tests components as users see them (not implementation)
- ✅ Encourages accessible components
- ✅ Simple, focused API
- Impact: Tests stay relevant even after refactoring

**Cypress**
- ✅ E2E tests in real browser
- ✅ Time-travel debugging
- ✅ Great documentation & plugins
- ✅ Reliable in pipeline
- Impact: Confidence in complete user workflows

### Hosting (Why?)

**Supabase Cloud**
- ✅ Fully managed PostgreSQL
- ✅ Automatic backups & disaster recovery
- ✅ 99.99% uptime SLA
- ✅ Pay-as-you-go pricing
- Impact: No infrastructure management, focus on code

**Vercel (planned)**
- ✅ React-optimized deployment
- ✅ Global CDN for static assets
- ✅ Automatic HTTPS, serverless functions
- ✅ Preview deployments
- Impact: Instant deployments, automatic scaling

---

## 🏗️ ARCHITECTURE PATTERNS

### 1. 5-Hito Module Pattern

**Definition**: Every ASIS module follows:
1. SQL (database layer)
2. Components (UI layer)
3. Hooks (state management layer)
4. Edge Functions (business logic layer)
5. Tests (quality assurance layer)

**Benefits**:
- Consistent structure across 15+ modules
- Clear separation of concerns
- Easy to parallelize work (teams per Hito)
- Proven pattern (works for all 3 weeks)
- Easy onboarding for new developers

**Example** (Medications module):
```
SQL Layer:     14 tables, 11 RLS policies
                ↓
Component Layer: 8 React components (3,150 lines)
                ↓
Hook Layer:     7 custom hooks (1,540 lines)
                ↓
Function Layer: 4 Edge Functions (1,315 lines)
                ↓
Test Layer:     110+ tests (950 lines)
```

### 2. Component Composition Pattern

**Pattern**: Composable, single-responsibility components

```typescript
// BAD: Monolithic component
<PatientDashboard patient={patient} />  // 2000 lines

// GOOD: Composed components
<PatientDashboard>
  <PatientInfo patient={patient} />
  <VitalsDisplay vitals={vitals} />
  <MedicationList medications={medications} />
  <LabResults results={results} />
</PatientDashboard>
```

**Benefits**:
- Easy to test individual components
- Reusability across modules
- Performance optimization (memo/lazy)
- Clear component contracts

### 3. Custom Hook Pattern

**Pattern**: All data fetching in hooks, components render only

```typescript
// Hook: Handles all business logic
const useMedicationOrder = () => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const selectMedications = useCallback(async (ids) => {
    try {
      setLoading(true);
      const data = await supabase...
      setMedications(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { medications, loading, error, selectMedications };
};

// Component: Only renders
const MedicationOrderForm = () => {
  const { medications, selectMedications } = useMedicationOrder();
  return (
    <form>
      {medications.map(med => <Checkbox key={med.id} />)}
      <button onClick={() => selectMedications(ids)}>Order</button>
    </form>
  );
};
```

**Benefits**:
- Decoupled UI from data
- Easy to unit test hooks
- Easy to reuse logic across components
- Easier to mock for component tests

### 4. Error Boundary Pattern

**Pattern**: Catch component errors, display gracefully

```typescript
<ErrorBoundary fallback={<ErrorPage />}>
  <MedicationOrderForm />
</ErrorBoundary>
```

**Benefits**:
- Prevents entire app crash
- User sees appropriate error message
- Error logged for debugging
- Continues to work for other components

### 5. State Management Hierarchy

**Level 1**: Component state (useState)
- Simple UI state (form input, toggle)
- Specific to one component

**Level 2**: Custom hooks (useContext + hooks)
- Shared across 2-3 components
- Business logic (validation, transformation)

**Level 3**: Context + Redux (future)
- Global state (currently plan for Week 10+)
- User preferences, auth state

**Decision**: Stick with Level 1-2 for now
- Simpler to understand
- Easier to test
- Supabase handles persistence

---

## 📊 DATA PATTERNS

### 1. Entity-Attribute Value (EAV) for Flexibility

**When to use**:
- Patient consent types (many-to-many)
- Medication allergies (different reaction types)
- Immunization contraindications (varies by vaccine)

**Pattern**:
```sql
-- Instead of:
TABLE patient_consents (id, consent_type_1, consent_type_2, ...)

-- Use:
TABLE patient_consents (
  patient_id, consent_type, date_given, valid_until
)
-- Allows unlimited consent types without schema migration
```

### 2. Range Queries Pattern

**When to use**:
- Normal ranges for lab values
- Safe dosage ranges
- Age-appropriate vaccine schedules

**Pattern**:
```sql
TABLE normal_ranges (
  test_id, age_min, age_max, sex, 
  value_min, value_max, unit
)
-- Allows multiple ranges based on age/sex
SELECT * FROM normal_ranges 
WHERE test_id = 'hemoglobin' 
AND age_min <= 25 AND age_max >= 25 
AND sex = 'M'
-- Returns appropriate range for 25-year-old male
```

### 3. Denormalization for Performance

**When to use**:
- Frequently calculated values
- Expensive joins
- Real-time dashboards

**Pattern**:
```sql
-- Store both normalized AND denormalized
TABLE prescriptions (
  id, patient_id, medication_id, 
  medication_name_denorm VARCHAR,  -- Denormalized
  medication_atc_denorm VARCHAR    -- Denormalized
)
-- Avoids join on every query
-- Updated via trigger when medication changes
```

### 4. Soft Deletes for Audit Trail

**Pattern**:
```sql
ALTER TABLE prescriptions ADD COLUMN deleted_at TIMESTAMP;
-- Don't delete, just mark as deleted
UPDATE prescriptions SET deleted_at = NOW() WHERE id = 123;
-- Queries automatically filter: WHERE deleted_at IS NULL
-- Audit trail preserved
```

### 5. Temporal Tables (Future)

**Pattern** (for Week 10+):
```sql
-- Enable temporal versioning
CREATE TABLE diagnoses (
  id UUID,
  patient_id UUID,
  icd_code VARCHAR,
  severity VARCHAR,
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_to TIMESTAMP
) WITH SYSTEM VERSIONING;
-- Automatically tracks: who changed what, when
```

---

## 🔐 SECURITY PATTERNS

### 1. RLS Policy Pattern

**Pattern**:
```sql
-- All tables have multiple policies

-- 1. For end-users (patient sees own data)
CREATE POLICY "patient_view_own_data" ON table_name
  FOR SELECT USING (patient_id = auth.uid());

-- 2. For clinicians (clinician sees their patients)
CREATE POLICY "clinician_view_patient_data" ON table_name
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM patient_clinician_relationship
    WHERE patient_id = table_name.patient_id
    AND clinician_id = auth.uid()
  ));

-- 3. For admins (can see all)
CREATE POLICY "admin_see_all" ON table_name
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

**Benefits**:
- Database-enforced security
- No bypass possible
- Clear audit trail
- HIPAA compliant

### 2. Input Validation Pattern

**Pattern** (Client + Server):
```typescript
// Component (Client validation - UX)
<input 
  type="number" 
  min={0} 
  max={1000}
  required
  value={dose}
  onChange={e => {
    if (e.target.value <= 1000) setDose(e.target.value);
  }}
  aria-invalid={error ? 'true' : 'false'}
/>

// Edge Function (Server validation - Security)
const { data, error } = await supabase.functions.invoke('validate_medication_order', {
  body: { patient_id, medications, dose, frequency }
});

if (!data?.valid) {
  // Reject with specific error
  return { error: data.errors[0] };
}
```

**Benefits**:
- Client: Fast feedback, better UX
- Server: Security, cannot be bypassed

### 3. Audit Logging Pattern

**Pattern**:
```sql
-- Trigger on INSERT/UPDATE/DELETE
CREATE TRIGGER audit_medication_orders
AFTER INSERT OR UPDATE OR DELETE ON medication_orders
FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Function logs to audit table
CREATE FUNCTION audit_trigger() RETURNS trigger AS $$
BEGIN
  INSERT INTO audit_log (
    table_name, operation, record_id, 
    old_data, new_data, user_id, timestamp
  ) VALUES (
    TG_TABLE_NAME, TG_OP, NEW.id,
    row_to_json(OLD), row_to_json(NEW),
    auth.uid(), NOW()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

**Benefits**:
- Complete audit trail
- Compliance (HIPAA, GDPR)
- Forensics capability
- No manual logging needed

### 4. JWT-Based Authentication Pattern

**Pattern**:
```typescript
// Supabase handles JWT automatically
const { data: { session }, error } = await supabase.auth.getSession();

// JWT included in all requests automatically
// Contains: user_id, roles, permissions

// In Edge Functions:
const authHeader = req.headers.get('Authorization');
const jwt = authHeader?.replace('Bearer ', '');
const decoded = decodeJwt(jwt);  // Validate & extract

if (!decoded || decoded.exp < Date.now() / 1000) {
  return new Response('Unauthorized', { status: 401 });
}
const userId = decoded.sub;
```

**Benefits**:
- Stateless authentication (scales)
- Can be verified at edge
- Expiration built-in
- Secure by default

---

## ⚡ PERFORMANCE OPTIMIZATION

### 1. Database Indexing Pattern

**Pattern**:
```sql
-- Index on frequently searched columns
CREATE INDEX idx_patient_id ON medication_orders(patient_id);
CREATE INDEX idx_medication_created ON medications(created_at DESC);
CREATE INDEX idx_diagnosis_patient_date ON diagnoses(patient_id, created_at DESC);

-- Full-text search index
CREATE INDEX idx_medication_description_fts ON medication_types 
USING GIN((description || ' ' || name) gin_trgm_ops);
```

**Benefits**:
- Query response <200ms
- Reduced database load
- Automatic query optimization

### 2. Component Memoization Pattern

**Pattern**:
```typescript
// Prevent unnecessary re-renders
const MedicationCard = React.memo(({ medication, onSelect }) => {
  return <div onClick={() => onSelect(medication.id)}>{medication.name}</div>;
}, (prevProps, nextProps) => {
  // Custom equality check
  return prevProps.medication.id === nextProps.medication.id;
});
```

**Benefits**:
- Only re-render when props actually change
- Especially important for lists
- ~20-40% performance improvement with 100+ items

### 3. Lazy Loading Pattern

**Pattern**:
```typescript
// Load components only when needed
const MedicationModule = React.lazy(() => import('./MedicationModule'));

<Suspense fallback={<Spinner />}>
  <MedicationModule />
</Suspense>
```

**Benefits**:
- Reduced initial bundle size
- Faster initial page load
- Progressive loading experience

### 4. Caching Pattern

**Pattern** (Component level):
```typescript
const [cache, setCache] = useState(new Map());

const fetchMedications = useCallback(async () => {
  if (cache.has('medications')) {
    return cache.get('medications');
  }
  
  const data = await supabase.from('medications').select();
  setCache(prev => new Map(prev).set('medications', data));
  return data;
}, [cache]);
```

**Benefits**:
- Avoid refetching same data
- Faster response
- Reduced API calls

### 5. Pagination Pattern

**Pattern**:
```typescript
const RECORDS_PER_PAGE = 50;

const [page, setPage] = useState(0);
const [data, setData] = useState([]);

const fetchPage = useCallback(async () => {
  const from = page * RECORDS_PER_PAGE;
  const to = from + RECORDS_PER_PAGE;
  
  const { data } = await supabase
    .from('medications')
    .select()
    .range(from, to - 1);
  
  setData(data);
}, [page]);
```

**Benefits**:
- Only load needed records
- Memory efficient
- Better UX (not loading 10K records)

---

## 🧪 TESTING PATTERNS

### 1. Given-When-Then Pattern

**Pattern**:
```typescript
describe('MedicationOrderForm', () => {
  it('should show error when dose exceeds safe range', () => {
    // GIVEN: A medication with max dose 500mg
    // WHEN: User enters 1000mg and submits
    // THEN: Error message appears
    
    render(<MedicationOrderForm />);
    const doseInput = screen.getByLabelText('Dose (mg)');
    const submitBtn = screen.getByRole('button', { name: /submit/i });
    
    fireEvent.change(doseInput, { target: { value: '1000' } });
    fireEvent.click(submitBtn);
    
    expect(screen.getByText(/exceeds safe range/i)).toBeInTheDocument();
  });
});
```

**Benefits**:
- Clear test intent
- Easy to understand failures
- Consistent test structure

### 2. Mock Pattern for Supabase

**Pattern**:
```typescript
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({
        data: [{ id: 1, name: 'Aspirin' }],
        error: null
      })
    }))
  }))
}));
```

**Benefits**:
- Tests don't need real database
- Faster tests
- Deterministic results
- Can simulate errors

### 3. E2E User Flow Pattern

**Pattern** (Cypress):
```typescript
describe('Complete Medication Order Workflow', () => {
  it('should create medication order and track adherence', () => {
    // 1. Login
    cy.visit('/login');
    cy.get('[data-testid="email"]').type('clinician@example.com');
    cy.get('[data-testid="password"]').type('password');
    cy.get('button[type="submit"]').click();
    
    // 2. Navigate to medication module
    cy.get('[data-testid="nav-medications"]').click();
    
    // 3. Create order
    cy.get('button').contains('New Medication Order').click();
    cy.get('input[name="medication"]').type('Aspirin');
    cy.get('button').contains('Select').click();
    /* ... more steps ... */
    
    // 4. Verify persisted
    cy.reload();
    cy.get('[data-testid="medication-order-1"]').should.exist();
  });
});
```

**Benefits**:
- Tests real user scenario
- Catches integration issues
- Confidence in full workflows

---

## 🚀 DEPLOYMENT PATTERNS

### 1. Blue-Green Deployment

**Pattern** (Future, planned for Week 11):
```
Blue (Current): Production running on build-12345
Green (New): Staging running on build-12346

1. Deploy to Green
2. Run smoke tests on Green
3. If OK: Switch traffic to Green
4. If problem: Rollback to Blue
```

**Benefits**:
- Zero downtime
- Instant rollback
- Can test in production load

### 2. Feature Flags Pattern

**Pattern** (Planned for Week 10):
```typescript
const isNutritionModuleEnabled = useFeatureFlag('nutrition-module');

return (
  <div>
    <MedicationModule />
    {isNutritionModuleEnabled && <NutritionModule />}
  </div>
);
```

**Benefits**:
- Deploy without releasing
- Gradual rollout
- Easy A/B testing

### 3. Rolling Updates Pattern

**Pattern** (Current):
- Deploy update to 1 server
- Monitor for 5 minutes
- If stable, deploy to next server
- If error, rollback

**Benefits**:
- Gradual rollout
- Quick error detection
- Minimal service disruption

---

## 📚 DOCUMENTATION PATTERNS

### 1. JSDoc Pattern

**Pattern**:
```typescript
/**
 * Calculates BMI from height and weight
 * @param {number} heightCm - Height in centimeters (must be > 0)
 * @param {number} weightKg - Weight in kilograms (must be > 0)
 * @returns {number} BMI value
 * @throws {Error} If inputs invalid
 * @example
 * const bmi = calculateBMI(170, 70); // Returns 24.2
 */
export const calculateBMI = (heightCm: number, weightKg: number): number => {
  if (heightCm <= 0 || weightKg <= 0) {
    throw new Error('Invalid measurements');
  }
  return weightKg / ((heightCm / 100) ** 2);
};
```

**Benefits**:
- IDE autocomplete
- Self-documenting
- Type information

### 2. README Pattern

**Per-module README**:
```markdown
# Medications Module

## Overview
Manages medication ordering, prescriptions, interactions, adherence.

## Components
- MedicationOrderForm: Create medication orders
- PrescriptionViewer: View prescriptions
- ...

## Hooks
- useMedicationOrder: Order management
- ...

## Usage
[Example code]

## Testing
npm test -- MedicationOrderForm.test.tsx

## Known Issues
- [...]

## Future Work
- [...] 
```

---

**Document**: Architecture Decisions & Design Patterns  
**Version**: 1.0  
**Created**: 2026-04-12 22:35:00 UTC  
**Status**: Active Reference  
**Review Cycle**: Quarterly  
**Archive**: DOCUMENTATION_UNIFIED/10_ARCHITECTURE_DECISIONS.md
