import type { Page } from "@playwright/test";
import { test, expect } from "@playwright/test";

// E2E Tests for HOSIX ASIS 4 (Obstetrics) and ASIS 5 (CRED) workflows
// Run with: npx playwright test

test.describe("ASIS 04 - Obstetrics Workflow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app and login
    await page.goto("http://localhost:5173");
    await page.fill('input[name="email"]', "medico@hosix.test");
    await page.fill('input[name="password"]', "password123");
    await page.click('button:has-text("Iniciar Sesión")');
    await page.waitForNavigation();
  });

  test("Create new pregnancy and calculate risk", async ({ page }) => {
    // Navigate to obstetrics section
    await page.click('nav >> text=Obstetricia');
    await page.click('button:has-text("Nuevo Embarazo")');

    // Fill patient identification
    await page.fill('input[label="Identifying Número"]', "9999888777");
    await page.click('button:has-text("Buscar Paciente")');
    await page.waitForLoadState("networkidle");

    expect(await page.textContent("text=María García López")).toBeTruthy();

    // Fill pregnancy details
    await page.fill('input[label="Fecha Última Menstruación"]', "2025-07-12");
    await page.fill('input[label="Edad Gestacional"]', "28");

    // Add comorbidities
    await page.click('label:has-text("Hipertensión")');
    await page.click('label:has-text("Diabetes")');

    // Submit form
    await page.click('button:has-text("Guardar Embarazo")');
    await page.waitForSelector('text=Embarazo guardado exitosamente');

    expect(await page.textContent(".risk-score")).toContain("45-50");
    expect(await page.textContent(".risk-level")).toContain("Moderado");
  });

  test("Display obstetric risk alert with high-risk factors", async ({
    page,
  }) => {
    // Navigate to existing high-risk pregnancy
    await page.click('nav >> text=Obstetricia');
    await page.click('text=Rosa Martínez Pérez'); // Pre-populated high-risk patient

    // Verify risk alert displays
    expect(await page.locator('text=Riesgo Crítico').isVisible()).toBeTruthy();
    expect(await page.locator(".risk-gauge.bg-red").isVisible()).toBeTruthy();

    // Verify risk factors are displayed
    expect(
      await page.textContent("text=Factores Maternales")
    ).toContain("Edad 42");
    expect(
      await page.textContent("text=Complicaciones")
    ).toContain("Preeclampsia");

    // Verify recommendations are shown
    expect(await page.textContent("text=Recomendaciones")).toContain("URGENCIA");
    expect(await page.textContent("text=Recomendaciones")).toContain(
      "Hospitalización"
    );
  });

  test("Record delivery event and postpartum evaluation", async ({ page }) => {
    // Navigate to obstetrics
    await page.click('nav >> text=Obstetricia');
    await page.click('text=Jennifer López Torres'); // Patient at term

    // Click delivery button
    await page.click('button:has-text("Registrar Parto")');

    // Fill delivery details
    await page.selectOption('select[label="Tipo de Parto"]', "vaginal");
    await page.fill('input[label="Hora del Parto"]', "14:30");
    await page.fill('input[label="Peso Recién Nacido (kg)"]', "3.4");
    await page.fill('input[label="Talla Recién Nacido (cm)"]', "50");

    // Fill Apgar scores
    await page.fill('input[label="Apgar 1 minuto"]', "8");
    await page.fill('input[label="Apgar 5 minutos"]', "9");
    await page.fill('input[label="Apgar 10 minutos"]', "10");

    // Submit delivery form
    await page.click('button:has-text("Guardar Parto")');
    await page.waitForSelector('text=Parto registrado exitosamente');

    // Verify newborn assessment is created
    expect(
      await page.textContent("text=Evaluación Recién Nacido")
    ).toBeTruthy();

    // Fill postpartum evaluation
    await page.click('text=Puerpuerio');
    await page.selectOption('select[label="Tipo de Puerperio"]', "fisiológico");
    await page.fill('input[label="Hemorragia Estimada (ml)"]', "250");

    // Check for postpartum danger signs
    await page.click('label:has-text("Check Fiebre")');

    await page.click('button:has-text("Guardar Evaluación Posparto")');
    await page.waitForSelector('text=Puerpuerio guardado exitosamente');
  });

  test("Monitor gestational age and term status", async ({ page }) => {
    // Navigate to obstetrics
    await page.click('nav >> text=Obstetricia');
    await page.click('text=Ana Rodríguez Silva'); // Patient at 36 weeks

    // Verify gestational age display
    expect(await page.textContent(".gestational-age")).toContain("36w");

    // Verify term status (should show "Próximo a término")
    expect(await page.textContent(".term-status")).toContain("Próximo a término");

    // Verify days until EDD
    expect(await page.textContent(".days-until-edd")).toContain("28 días");
  });
});

test.describe("ASIS 05 - CRED (Child Growth and Development) Workflow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app and login
    await page.goto("http://localhost:5173");
    await page.fill('input[name="email"]', "medico@hosix.test");
    await page.fill('input[name="password"]', "password123");
    await page.click('button:has-text("Iniciar Sesión")');
    await page.waitForNavigation();
  });

  test("Record child growth measurement and track percentiles", async ({
    page,
  }) => {
    // Navigate to CRED
    await page.click('nav >> text=CRED');
    await page.click('text=Juan Pérez Martínez'); // Child 18 months

    // Add new growth measurement
    await page.click('button:has-text("Nueva Medición")');

    await page.fill('input[label="Peso (kg)"]', "12.5");
    await page.fill('input[label="Talla (cm)"]', "85.0");
    await page.fill('input[label="Perímetro Cefálico"]', "48.5");
    await page.fill('input[label="Fecha"]', "2026-04-12");

    await page.click('button:has-text("Guardar Medición")');
    await page.waitForSelector('text=Medición guardada');

    // Verify WHO percentile calculation
    expect(await page.textContent(".percentile-weight")).toContain("%");
    expect(await page.textContent(".percentile-height")).toContain("%");

    // Verify growth status
    expect(await page.textContent(".growth-status")).toContain("Normal");

    // Verify chart displays
    expect(await page.locator("canvas").nth(0)).toBeVisible(); // Growth chart
  });

  test("Track developmental milestones", async ({ page }) => {
    // Navigate to CRED
    await page.click('nav >> text=CRED');
    await page.click('text=Sofia Gonzálaez López'); // Child 24 months

    // Click milestone tracking
    await page.click('button:has-text("Hitos del Desarrollo")');

    // Check achieved milestones
    const milestoneCheckboxes = await page.locator("input[type=checkbox]").all();
    expect(milestoneCheckboxes.length).toBeGreaterThan(10);

    // Check some expected milestones at 24 months
    await page.click('label:has-text("Camina sin apoyo")');
    await page.click('label:has-text("Dice palabras simples")');
    await page.click('label:has-text("Come con cuchara")');

    // Save milestones
    await page.click('button:has-text("Guardar Hitos")');
    await page.waitForSelector('text=Hitos guardados');

    // Verify milestone progress
    expect(await page.textContent(".milestone-progress")).toContain("15");
    expect(await page.textContent(".milestone-status")).toContain("%");
  });

  test("Manage vaccination schedule", async ({ page }) => {
    // Navigate to CRED
    await page.click('nav >> text=CRED');
    await page.click('text=Carlos Quispe Vilca'); // Child 12 months

    // Click vaccination section
    await page.click('button:has-text("Carné de Vacunación")');

    // Verify vaccination schedule displayed
    expect(await page.textContent("text=Esquema Ecuador")).toBeTruthy();

    // Record vaccine administration
    await page.click('button:has-text("Registrar Vacuna")');

    await page.selectOption('select[label="Vacuna"]', "MMR");
    await page.fill('input[label="Fecha Administración"]', "2026-04-12");
    await page.selectOption('select[label="Sitio"]', "MS");
    await page.fill('input[label="Lote"]', "LOT-2026-001");

    await page.click('button:has-text("Guardar Vacunación")');
    await page.waitForSelector('text=Vacunación registrada');

    // Verify next vaccine is suggested
    expect(await page.textContent(".next-vaccine")).toBeTruthy();
    expect(
      await page.textContent(".next-vaccine-date")
    ).not.toContain("undefined");
  });

  test("Perform developmental screening (DDST)", async ({ page }) => {
    // Navigate to CRED
    await page.click('nav >> text=CRED');
    await page.click('text=María Elena Ticona Aymara'); // Child 36 months

    // Click screening button
    await page.click('button:has-text("Cribado del Desarrollo")');

    // Answer DDST questions
    const questions = await page.locator(".ddst-question").all();
    expect(questions.length).toBeGreaterThan(10);

    // Answer yes to some questions
    for (let i = 0; i < 5; i++) {
      await page.click(`.ddst-question:nth-child(${i + 1}) >> text=Sí`);
    }

    // Submit screening
    await page.click('button:has-text("Evaluar Desarrollo")');
    await page.waitForSelector('text=Resultado del Cribado');

    // Verify screening result
    expect(await page.textContent(".screening-score")).toContain("/100");
    expect(await page.textContent(".screening-status")).toMatch(
      /(Normal|Riesgo|Retraso)/
    );
  });

  test("Detect and report developmental problems", async ({ page }) => {
    // Navigate to CRED
    await page.click('nav >> text=CRED');
    await page.click('text=Pedro Sánchez Flores'); // Child with issues

    // Click problem detection
    await page.click('button:has-text("Detección de Problemas")');

    // Select problem categories
    await page.click('label:has-text("Auditivo")');
    await page.click('label:has-text("Motor")');

    // Fill details
    await page.fill('textarea[label="Hallazgos"]', "No responde a sonidos fuertes");

    // Generate referral
    await page.click('button:has-text("Generar Referencia")');
    await page.waitForSelector('text=Referencia generada');

    // Verify referral details
    expect(await page.textContent(".referral-type")).toContain("Audiologo");
    expect(await page.textContent(".referral-priority")).toContain("Alta");
  });
});

test.describe("Integration - Complete Patient Journey", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app and login
    await page.goto("http://localhost:5173");
    await page.fill('input[name="email"]', "medico@hosix.test");
    await page.fill('input[name="password"]', "password123");
    await page.click('button:has-text("Iniciar Sesión")');
    await page.waitForNavigation();
  });

  test("Complete obstetric and postpartum to pediatric CRED pathway", async ({
    page,
  }) => {
    // Step 1: Patient registers pregnancy
    await page.click('nav >> text=Obstetricia');
    await page.click('button:has-text("Nuevo Embarazo")');

    const dniNumber = Math.random().toString().substring(2, 11);
    await page.fill('input[label="Cédula"]', dniNumber);
    await page.click('button:has-text("Crear Paciente")');

    // Fill pregnancy info
    await page.fill('input[label="Fecha Última Menstruación"]', "2025-10-12");
    await page.click('button:has-text("Guardar Embarazo")');
    await page.waitForSelector('text=Embarazo guardado');

    // Step 2: Patient delivers
    // (In production would wait for term, for E2E we simulate)
    await page.click('button:has-text("Registrar Parto")');
    await page.fill('input[label="Peso Recién Nacido"]', "3.2");
    await page.fill('input[label="Talla Recién Nacido"]', "49.5");
    await page.fill('input[label="Apgar 1 minuto"]', "9");
    await page.fill('input[label="Apgar 5 minutos"]', "9");
    await page.fill('input[label="Apgar 10 minutos"]', "10");
    await page.click('button:has-text("Guardar Parto")');
    await page.waitForSelector('text=Parto registrado');

    // Step 3: 6-month CRED check
    await page.click('nav >> text=CRED');
    // System should auto-detect newborn from delivery
    await page.fill('input[label="Edad Meses"]', "6");
    await page.fill('input[label="Peso"]', "7.0");
    await page.fill('input[label="Talla"]', "66.0");
    await page.click('button:has-text("Guardar Medición")');
    await page.waitForSelector('text=Medición guardada');

    // Verify percentiles calculated
    expect(await page.textContent(".growth-status")).toContain("Normal");

    // Step 4: Record vaccinations at 6 months
    await page.click('button:has-text("Carné de Vacunación")');
    await page.click('button:has-text("Registrar Vacuna")');
    await page.selectOption('select[label="Vacuna"]', "DPT-1");
    await page.click('button:has-text("Guardar Vacunación")');
    await page.waitForSelector('text=Vacunación registrada');

    // Step 5: Track developmental milestones
    await page.click('button:has-text("Hitos del Desarrollo")');
    await page.click('label:has-text("Sonríe socialmente")');
    await page.click('button:has-text("Guardar Hitos")');
    await page.waitForSelector('text=Hitos guardados');

    // Verify complete pathway
    expect(await page.textContent("h1")).toContain("CRED");
  });
});
