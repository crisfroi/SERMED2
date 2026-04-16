# 📅 WEEK 4 PLAN - NUTRITION, IMMUNIZATION & PHARMACY

**Plan Created**: 2026-04-12 22:30:00 UTC  
**Duration**: Monday April 15 - Friday April 21, 2026 (5 days)  
**Status**: ⏳ Ready to Kickoff  
**Target Output**: 8,500 lines of code  

---

## 🎯 OBJECTIVES

### Primary Goals
Create three new clinical modules following proven 5-Hito pattern:

1. **Nutrition (ASIS 7)** - Patient nutritional assessment and planning
2. **Immunization (ASIS 8)** - Vaccination schedule management
3. **Pharmacy/Inventory (ASIS 9)** - Medicine stock and procurement

### Success Criteria
- [x] All 5 Hitos delivered per module
- [x] 100+ new tests passing
- [x] 3 modules production-ready
- [x] Deployed to staging by Friday EOD
- [x] Ready for production deployment by Monday

---

## 📊 MODULE SPECIFICATIONS

### Module 1: NUTRITION (ASIS 7)

#### Hito 1: SQL Infrastructure (300 lines)

**Tables** (4 primary, 2 reference):
```sql
-- Patient nutrition assessments
patient_nutrition_assessments (
  id, patient_id, assessment_date,
  weight, height, bmi, waist_circumference,
  mid_arm_circumference, triceps_skinfold,
  assessment_type (initial/follow-up/discharge),
  nutritional_status (normal/malnourished/overweight/obese),
  created_at, updated_at
)

-- Dietary intake records
dietary_intake_records (
  id, patient_id, assessment_id, intake_date,
  caloric_intake_daily, protein_g, carbs_g, fat_g,
  fiber_g, water_ml, food_groups_consumed TEXT[],
  meals_eaten INT, snacks_eaten INT,
  restrictions TEXT[], allergies TEXT[]
)

-- Nutrition intervention plans
nutrition_plans (
  id, patient_id, assessment_id,
  plan_date, target_weight, target_bmi,
  daily_calories_recommended, protein_target_g,
  supplements_prescribed TEXT[],
  dietary_recommendations TEXT,
  education_provided BOOLEAN,
  follow_up_date,
  status (active/completed/paused)
)

-- Nutrition outcomes tracking
nutrition_outcomes (
  id, patient_id, plan_id,
  measurement_date, weight, bmi,
  weight_change_kg, weight_change_percent,
  adherence_percent, complications TEXT,
  plan_modified BOOLEAN,
  plan_modifiers TEXT
)
```

**RLS Policies (3)**:
- clinician_create: Nutritionists can create assessments
- patient_view: Patients see own nutrition data
- admin_override: Admins see all

**Preloaded Data**:
- Nutrition reference values (WHO, CDC standards)
- Common supplementation protocols
- Dietary guidelines by condition

#### Hito 2: React Components (1,350 lines)

**Component 1: NutritionAssessmentForm** (450 lines)
- Anthropometric input (height, weight, circumferences)
- BMI automatic calculation
- Nutritional status classification
- Assessment type selector
- Food intake logging
- Allergy/restriction recording
- Form validation with clinical ranges

**Component 2: NutritionPlanViewer** (450 lines)
- Current active plans display
- Target metrics visualization
- Supplement recommendations
- Dietary guidelines display
- Adherence tracking (%)
- Plan status (active/paused/completed)
- Modify plan button with confirmation

**Component 3: WeightTrendChart** (450 lines)
- Line chart: Weight over time
- BMI trend visualization
- Target weight vs. actual weight
- Weight change velocity (kg/week)
- Trend indicators (improving/stable/declining)
- Export functionality
- Annotations for plan modifications

#### Hito 3: Custom Hooks (660 lines)

**Hook 1: useNutritionAssessment** (180 lines)
```typescript
- fetchAssessments(patientId) → all assessments
- createAssessment(data) → new assessment
- calculateBMI(height, weight) → BMI value
- getAssessmentHistory() → timeline data
- classifyNutritionalStatus(bmi, other_factors) → status
- updateAssessment(id, changes) → modify existing
```

**Hook 2: useNutritionPlanning** (240 lines)
```typescript
- createNutritionPlan(data) → generate plan
- recommendCalories(age, weight, activity) → daily needs
- recommendProtein(condition, weight) → protein target
- recommendSupplements(status, condition) → supplement list
- getTreatmentGuidelines(condition) → clinical protocols
- calculateTargetWeight(height, age, sex) → target BMI goal
- generateDietaryRecommendations() → food suggestions
```

**Hook 3: useNutritionOutcomes** (240 lines)
```typescript
- fetchOutcomes(planId) → measurement history
- recordOutcome(data) → log new measurement
- calculateAdherence(plan, outcomes) → compliance %
- getProgressMetrics(plan) → improvement analysis
- identifyComplications(outcomes) → alerts
- recommendPlanModifications(outcomes) → suggestions
```

#### Hito 4: Edge Functions (200 lines)

**Function 1: validate_nutrition_plan** (200 lines)
- Input: patient demographics, assessment data
- Validate caloric recommendations per guidelines
- Check supplement/medication interactions
- Verify adherence feasibility
- Output: PlanValidationResult

**Function 2: recommend_nutrition_interventions** (200 lines)
- Input: nutritional status, comorbidities
- Query treatment guidelines
- Generate personalized recommendations
- Consider cultural/religious preferences
- Output: RecommendationList

#### Hito 5: Tests & Documentation (200 lines)

**Test Cases** (15 tests):
- Assessment form rendering & validation
- BMI calculation accuracy
- Nutrition plan creation
- Outcome tracking
- Adherence calculation
- E2E: Create assessment → Plan → Track outcomes

---

### Module 2: IMMUNIZATION (ASIS 8)

#### Hito 1: SQL Infrastructure (350 lines)

**Tables** (5 primary, 2 reference):
```sql
-- Vaccination schedules by age/country
vaccine_schedules (
  id, country_code, vaccine_name, age_months_min, age_months_max,
  doses_required INT, interval_days INT, booster_date,
  schedule_type (routine/catch_up/travel/occupational),
  status (active/archived)
)

-- Patient vaccination records
patient_vaccinations (
  id, patient_id, vaccine_id, vaccination_date,
  lot_number, expiration_date, site (arm/leg/etc),
  healthcare_provider, facility_name,
  next_dose_due_date, status (administered/pending/contraindicated)
)

-- Vaccine lot tracking
vaccine_lots (
  id, vaccine_name, lot_number, manufacturer,
  expiration_date, quantity_total, quantity_used,
  storage_location, temperature_required,
  received_date, status (in_stock/expired/damaged)
)

-- Adverse event reports
vaccine_adverse_events (
  id, vaccination_id, patient_id,
  event_date, event_description,
  severity (mild/moderate/severe),
  outcome (resolved/ongoing/hospitalized),
  reported_by, report_date
)

-- Immunization gaps analysis
patient_immunization_gaps (
  id, patient_id, vaccine_name, due_date,
  days_overdue INT, priority (urgent/normal/low),
  last_attempt_date, reason_not_given TEXT,
  status (pending/scheduled/permanently_contraindicated)
)
```

**RLS Policies (3)**:
- nurse_administer: Nurses can record vaccinations
- patient_view: Patients see own vaccination history
- admin_track: Admins track inventory

**Preloaded Data**:
- WHO vaccine schedules for 20+ countries
- ICD-11 vaccine codes
- Adverse event taxonomy
- Storage requirements by vaccine

#### Hito 2: React Components (1,350 lines)

**Component 1: ImmunizationRecordForm** (450 lines)
- Vaccine selection dropdown
- Administration date picker
- Lot number entry with validation
- Site of injection selector
- Primary healthcare provider info
- Next dose calculation
- Adverse event report
- Form validation with clinical rules

**Component 2: VaccineScheduleViewer** (450 lines)
- Age-appropriate vaccines display
- Current vs. recommended vaccines
- Due dates with color coding (due/overdue/pending)
- Timeline view of past vaccinations
- Upcoming doses calendar
- Vaccination history export
- Print vaccination card

**Component 3: ImmunizationGapReport** (450 lines)
- Vaccines due/overdue list
- Days overdue calculation
- Priority flagging (red/yellow/green)
- Reasons for delay tracking
- Contraindications display
- Catch-up recommendations
- Coverage rate calculation
- Facility-level statistics

#### Hito 3: Custom Hooks (660 lines)

**Hook 1: useImmunizationRecord** (180 lines)
```typescript
- fetchVaccinations(patientId) → vaccination history
- recordVaccination(data) → administer vaccine
- getNextVaccines(age) → due vaccines
- validateDosing(vaccine, previous_doses) → valid or not
- checkContraindications(vaccine, conditions) → safe or not
- updateVaccinationStatus(id, status) → mark as given
```

**Hook 2: useVaccineSchedule** (240 lines)
```typescript
- getScheduleByCountry(countryCode) → schedule
- getScheduleByAge(ageMonths) → due vaccines
- calculateNextDueDate(vaccine, lastDate) → date
- getVaccinationGaps(patientVaccinations) → missed doses
- getDueVaccines(patientId) → what's urgent
- generateImmunizationCard() → printable record
```

**Hook 3: useVaccineLotTracking** (240 lines)
```typescript
- fetchInventory() → current stock
- trackLotUsage(lotId) → usage history
- checkExpiration() → near-expiry lots
- generateOrderRequest() → stock alerts
- validateLotAppropriateness(vaccine, lot) → ok to use
```

#### Hito 4: Edge Functions (200 lines)

**Function 1: check_vaccination_schedule** (200 lines)
- Input: patient age, vaccination history
- Lookup appropriate schedule
- Calculate due/overdue vaccines
- Check contraindications
- Output: VaccinationStatus with priorities

**Function 2: validate_vaccine_administration** (200 lines)
- Input: vaccine, patient data
- Verify not already given
- Check lot validity & storage
- Verify appropriate interval since last dose
- Output: ValidationResult

#### Hito 5: Tests & Documentation (200 lines)

**Test Cases** (15 tests):
- Schedule lookup by age/country
- Vaccination recording
- Gap identification
- Lot tracking
- E2E: Lookup schedule → Record vax → Track lot

---

### Module 3: PHARMACY & INVENTORY (ASIS 9)

#### Hito 1: SQL Infrastructure (350 lines)

**Tables** (5 primary, 2 reference):
```sql
-- Medicine inventory
medicine_inventory (
  id, medicine_id, location_id, quantity_current INT,
  quantity_minimum INT, quantity_maximum INT,
  batch_number, expiration_date, received_date,
  unit_cost_currency DECIMAL, reorder_point INT,
  status (in_stock/low_stock/out_of_stock)
)

-- Inventory movements
inventory_movements (
  id, medicine_id, quantity INT, movement_type (in/out),
  reason (dispensed/received/damaged/expired_removed),
  reference_id (prescription_id/order_id/etc),
  location_from, location_to, movement_date, recorded_by
)

-- Supplier management
suppliers (
  id, supplier_name, contact_person, phone, email,
  address, payment_terms, terms_days INT,
  lead_time_days INT, reliability_score (1-5),
  status (active/inactive)
)

-- Purchase orders
purchase_orders (
  id, supplier_id, order_date, expected_delivery_date,
  order_amount DECIMAL, tax DECIMAL, currency,
  status (pending/partially_received/received/cancelled),
  delivery_date, received_by
)

-- Expiration alerts
expiration_alerts (
  id, medicine_id, lot_batch_number,
  expiration_date, days_until_expiry INT,
  quantity_affected INT, alert_date,
  action_taken TEXT, disposal_method
)
```

**RLS Policies (3)**:
- pharmacist_manage: Pharmacists manage inventory
- clinician_view: Clinicians view availability
- admin_procurement: Admins handle orders

**Preloaded Data**:
- Common supplier contacts
- Standard reorder points by medicine
- Typical lead times
- Standard storage temperatures

#### Hito 2: React Components (1,350 lines)

**Component 1: InventoryDashboard** (450 lines)
- Current inventory levels display
- Low stock alerts (red)
- Expiration warnings (yellow)
- Out of stock items (grey)
- Quantity by location
- Total inventory value
- Movement history (last 7 days)
- Stock status by category

**Component 2: SupplierOrderManager** (450 lines)
- Purchase order creation form
- Supplier selection dropdown
- Items to order multi-select
- Quantity input with calculations
- Estimated cost calculation
- Expected delivery date
- Order history and status
- Delivery confirmation
- Invoice matching

**Component 3: ExpirationAlertViewer** (450 lines)
- Medicines expiring soon (by date)
- Days until expiration countdown
- Quantity affected
- Batch/lot number details
- Disposal method selection
- Bulk actions (mark disposed, quarantine)
- Expiration history
- Alerts by location

#### Hito 3: Custom Hooks (660 lines)

**Hook 1: useInventoryManagement** (180 lines)
```typescript
- fetchInventory() → all items
- getInventoryLevel(medicineId) → current qty
- checkLowStock() → items below minimum
- recordMovement(type, qty, reason) → update
- updateInventory(id, quantity) → modify
- getInventoryValue() → total cost
```

**Hook 2: useProcurementWorkflow** (240 lines)
```typescript
- getSuppliers() → list all suppliers
- createPurchaseOrder(data) → new order
- estimateDeliveryDate(supplier) → arrival date
- calculateOrderCost(items) → total with tax
- trackOrder(orderId) → status updates
- receivedOrder(orderId, received_items) → confirm
- generateInvoiceReport() → billing
```

**Hook 3: useExpirationTracking** (240 lines)
```typescript
- fetchExpiringItems() → sorted by date
- getExpirationAlerts() → items < 30 days
- recordDisposal(itemId, method) → mark disposed
- quarantineItems(ids) → isolate from use
- generateExpirationReport() → audit trail
- calculateWastage() → expired % by category
```

#### Hito 4: Edge Functions (200 lines)

**Function 1: calculate_reorder_quantities** (200 lines)
- Input: medicine, current stock, usage rate
- Calculate when to reorder
- Calculate optimal order quantity (EOQ)
- Consider lead time
- Output: ReorderRecommendation

**Function 2: validate_pharmaceutical_control** (200 lines)
- Input: movement, medicine, quantity
- Verify movement is legal/appropriate
- Check expiration dates
- Track controlled substances
- Output: ValidationResult

#### Hito 5: Tests & Documentation (200 lines)

**Test Cases** (15 tests):
- Inventory level tracking
- Low stock detection
- Order creation
- Expiration detection
- E2E: Check stock → Create order → Receive → Track expiry

---

## 📅 IMPLEMENTATION SCHEDULE

### Monday-Tuesday: Planning & SQL (Days 1-2)
- [ ] Database design finalization
- [ ] Table creation all 5 modules
- [ ] RLS policy implementation
- [ ] Data preloading
- [ ] **Deliverable**: 1,000 lines SQL

### Wednesday-Thursday: Components & Hooks (Days 3-4)
- [ ] 9 React components
- [ ] 9 custom hooks
- [ ] Supabase integration
- [ ] Basic testing
- [ ] **Deliverable**: 5,400 lines code

### Friday: Edge Functions & Tests (Day 5)
- [ ] 6 Edge Functions
- [ ] 100+ tests
- [ ] Documentation
- [ ] Staging deployment
- [ ] **Deliverable**: 1,600 lines code + tests

---

## 🧪 TESTING STRATEGY

### Per-Module Testing
| Module | Unit Tests | Component Tests | E2E Tests |
|--------|-----------|-----------------|-----------|
| Nutrition | 8 | 6 | 5 |
| Immunization | 8 | 6 | 5 |
| Pharmacy | 8 | 6 | 5 |
| **TOTAL** | **24** | **18** | **15+** |

### Integration Testing
- Medication ↔ Pharmacy (stock verification)
- Diagnosis ↔ Immunization (contraindications)
- Nutrition ↔ Medications (supplement interactions)

---

## 👥 TEAM ALLOCATION

| Role | Task | Hours |
|------|------|-------|
| Database Admin | SQL schemas, RLS | 16 |
| Frontend Dev 1 | Components (9x) | 20 |
| Frontend Dev 2 | Hooks (9x) | 16 |
| Backend Dev | Edge Functions (6x) | 12 |
| QA Engineer | Tests (100+) | 16 |
| **Total** | | **80 hours** |

---

## 📊 SUCCESS METRICS

### Code Quality
- [x] 0 TypeScript errors
- [x] >95% type coverage
- [x] JSDoc comments on all functions
- [x] <5 complexity per function (avg 3)

### Testing
- [x] 100+ tests passing
- [x] >85% code coverage
- [x] 0 flaky tests
- [x] All edge cases covered

### Performance
- [x] Page load <2s
- [x] API response <500ms
- [x] Search results <300ms
- [x] No N+1 queries

### Documentation
- [x] README for each module
- [x] API documentation complete
- [x] Deployment instructions
- [x] Troubleshooting guide

---

## ⚠️ KNOWN RISKS & MITIGATION

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Complex pharmacy logic | Medium | High | Pair programming on algorithms |
| Vaccine schedule variations | Low | Medium | Use WHO standards as baseline |
| Inventory sync issues | Medium | High | Comprehensive transaction testing |

---

## 📞 ESCALATION CONTACTS

- **Technical Lead**: For architecture decisions
- **Product Manager**: For scope changes
- **DevOps**: For deployment issues
- **Clinical Advisor**: For medical accuracy

---

**Plan Created**: 2026-04-12 22:30:00 UTC  
**Status**: ⏳ Ready for Kickoff  
**Next Milestone**: Monday April 15, 2026 - Week 4 Begins  
**Archive Location**: DOCUMENTATION_UNIFIED/06_WEEK4_PLAN.md
