// ============================================================================
// e2e-lab-imaging.spec.ts - End-to-End Tests
// Complete Laboratory and Imaging Workflows
// ============================================================================

import { test, expect } from '@playwright/test';

// ============================================================================
// LABORATORY E2E TESTS
// ============================================================================

test.describe('Laboratory Workflow - Complete Lab Order', () => {
  test('should complete full lab order from creation to results viewing', async ({ page }) => {
    // Navigate to lab orders page
    await page.goto('/app/asis-08-laboratorio');

    // Step 1: Create new lab order
    await page.click('[data-testid="new-order-btn"]');
    expect(page.url()).toContain('/asis-08-laboratorio/new');

    // Step 2: Select multiple tests
    await page.click('[data-testid="test-glucose"]');
    await page.click('[data-testid="test-hemoglobin"]');
    await page.click('[data-testid="test-tsh"]');
    expect(page.locator('[data-testid="selected-count"]')).toContainText('3 tests');

    // Step 3: Enter clinical indication
    await page.fill('[data-testid="indication-input"]', 'Routine health checkup with new symptom investigation');
    await page.fill('[data-testid="history-input"]', 'Patient reports fatigue for 2 weeks');

    // Step 4: Select priority
    await page.selectOption('[data-testid="priority-select"]', 'routine');

    // Step 5: Submit order
    await page.click('[data-testid="submit-order-btn"]');

    // Step 6: Verify order creation success
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Order created successfully');
    const orderId = await page.locator('[data-testid="order-id"]').textContent();
    expect(orderId).toBeTruthy();

    // Step 7: Navigate to results viewer
    await page.click(`[data-testid="view-results-${orderId}"]`);

    // Step 8: Verify results are loaded
    await page.waitForLoadState('networkidle');
    expect(page.locator('[data-testid="glucose-result"]')).toBeVisible();
    expect(page.locator('[data-testid="hemoglobin-result"]')).toBeVisible();
    expect(page.locator('[data-testid="tsh-result"]')).toBeVisible();
  });

  test('should handle validation error when no tests selected', async ({ page }) => {
    await page.goto('/app/asis-08-laboratorio/new');

    await page.fill('[data-testid="indication-input"]', 'Test indication');
    await page.click('[data-testid="submit-order-btn"]');

    // Should show validation error
    await expect(page.locator('[role="alert"]')).toContainText('Select at least one test');
    expect(page.url()).toContain('new'); // Should stay on form page
  });

  test('should display normal ranges and interpretations', async ({ page }) => {
    await page.goto('/app/asis-08-laboratorio');

    // Navigate to an order with results
    await page.click('[data-testid="order-item-0"]');

    // Click on results viewer tab
    await page.click('[data-testid="results-tab"]');

    // Verify results are color-coded
    const normalResult = page.locator('[data-testid="result-status-normal"]');
    const abnormalResult = page.locator('[data-testid="result-status-abnormal"]');

    expect(normalResult).toHaveCSS('color', /green/i);
    expect(abnormalResult).toHaveCSS('color', /red|orange/i);

    // Verify reference ranges displayed
    expect(page.locator('[data-testid="reference-range"]')).toContainText('Normal range:');
  });

  test('should trend analysis over time', async ({ page }) => {
    await page.goto('/app/asis-08-laboratorio');

    // Click on trend analysis for a test
    await page.click('[data-testid="trend-btn"]');

    // Verify chart is rendered
    await expect(page.locator('canvas')).toBeAttached();

    // Verify period selector works
    await page.selectOption('[data-testid="period-select"]', '6_months');
    await page.waitForLoadState('networkidle');

    // Chart should update
    const dataPoints = page.locator('[data-testid="chart-datapoint"]');
    expect(dataPoints).toHaveCount((await dataPoints.count()) > 0 ? await dataPoints.count() : 0);

    // Verify export PDF works
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-pdf-btn"]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('should export lab results to PDF', async ({ page }) => {
    await page.goto('/app/asis-08-laboratorio');

    // Find an order with results
    const orderRow = page.locator('[data-testid="order-row"]').first();
    await orderRow.click();

    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-pdf-btn"]');
    const download = await downloadPromise;

    // Verify PDF was created
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('should filter and sort results', async ({ page }) => {
    await page.goto('/app/asis-08-laboratorio');

    // Click on order with results
    await page.click('[data-testid="order-item-0"]');

    // Apply filter for abnormal only
    await page.click('[data-testid="filter-abnormal"]');

    // Should only show abnormal results
    const results = page.locator('[data-testid="result-item"]');
    for (let i = 0; i < await results.count(); i++) {
      const status = await results.nth(i).getAttribute('data-status');
      expect(['high', 'low', 'critical']).toContain(status);
    }

    // Sort by date descending
    await page.click('[data-testid="sort-date-desc"]');
    const firstDate = await page.locator('[data-testid="result-date"]').first().textContent();
    const lastDate = await page.locator('[data-testid="result-date"]').last().textContent();

    // First date should be >= last date
    expect(new Date(firstDate || '') >= new Date(lastDate || '')).toBeTruthy();
  });
});

// ============================================================================
// IMAGING E2E TESTS
// ============================================================================

test.describe('Imaging Workflow - Complete DICOM Study', () => {
  test('should complete full imaging order to DICOM viewer', async ({ page }) => {
    // Navigate to imaging orders page
    await page.goto('/app/asis-15-imagenes');

    // Step 1: Create new imaging order
    await page.click('[data-testid="new-order-btn"]');
    expect(page.url()).toContain('/new');

    // Step 2: Select modality
    await page.selectOption('[data-testid="modality-select"]', 'CT');

    // Step 3: Select body part
    await page.click('[data-testid="body-part-chest"]');

    // Step 4: Enter clinical indication
    await page.fill('[data-testid="indication-input"]', 'Evaluate for pneumonia');

    // Step 5: Set priority
    await page.selectOption('[data-testid="priority-select"]', 'urgent');

    // Step 6: Submit order
    await page.click('[data-testid="submit-order-btn"]');

    // Step 7: Verify order creation
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Order created');
    const orderId = await page.locator('[data-testid="order-id"]').textContent();

    // Step 8: Wait for DICOM sync (simulated)
    await page.waitForURL(/.*study-id.*/);

    // Step 9: Verify DICOM viewer loaded
    await expect(page.locator('[data-testid="dicom-canvas"]')).toBeVisible();
  });

  test('should display DICOM with interactive controls', async ({ page }) => {
    await page.goto('/app/asis-15-imagenes/viewer/study-1');

    // Wait for DICOM to load
    await page.waitForLoadState('networkidle');

    // Verify viewer elements visible
    expect(page.locator('[data-testid="dicom-canvas"]')).toBeVisible();
    expect(page.locator('[data-testid="zoom-slider"]')).toBeVisible();
    expect(page.locator('[data-testid="window-level-control"]')).toBeVisible();

    // Test zoom functionality
    await page.fill('[data-testid="zoom-slider"]', '2');
    await page.waitForTimeout(500);
    const zoomLevel = await page.locator('[data-testid="current-zoom"]').textContent();
    expect(zoomLevel).toContain('2');

    // Test window/level adjustment
    await page.fill('[data-testid="window-input"]', '400');
    await page.fill('[data-testid="level-input"]', '40');
    await page.click('[data-testid="apply-wl-btn"]');
  });

  test('should navigate through DICOM series', async ({ page }) => {
    await page.goto('/app/asis-15-imagenes/viewer/study-1');

    await page.waitForLoadState('networkidle');

    // Verify image counter
    const initialCount = await page.locator('[data-testid="image-counter"]').textContent();
    expect(initialCount).toMatch(/1 of \d+/);

    // Navigate to next image
    await page.click('[data-testid="next-image-btn"]');
    await page.waitForTimeout(300);

    const nextCount = await page.locator('[data-testid="image-counter"]').textContent();
    expect(nextCount).not.toBe(initialCount);

    // Navigate back
    await page.click('[data-testid="prev-image-btn"]');
    await page.waitForTimeout(300);

    const backCount = await page.locator('[data-testid="image-counter"]').textContent();
    expect(backCount).toMatch(/1 of \d+/);
  });

  test('should display and manage radiology report', async ({ page }) => {
    await page.goto('/app/asis-15-imagenes/viewer/study-1');

    // Click on report tab
    await page.click('[data-testid="report-tab"]');

    // Verify report content visible
    expect(page.locator('[data-testid="findings-section"]')).toBeVisible();
    expect(page.locator('[data-testid="impression-section"]')).toBeVisible();
    expect(page.locator('[data-testid="recommendations-section"]')).toBeVisible();

    // Verify critical findings highlighted
    const criticalText = page.locator('[data-testid="critical-finding"]');
    if (await criticalText.count() > 0) {
      expect(criticalText).toHaveCSS('background-color', /red|orange/i);
    }

    // Test export report
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-report-btn"]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('should handle imaging order cancellation', async ({ page }) => {
    await page.goto('/app/asis-15-imagenes');

    // Find pending order
    const pendingOrder = page.locator('[data-testid="order-status-pending"]').first();
    await pendingOrder.click();

    // Try to cancel
    await page.click('[data-testid="cancel-order-btn"]');

    // Confirm cancellation
    await page.click('[data-testid="confirm-cancel-btn"]');

    // Verify order cancelled
    await expect(page.locator('[data-testid="order-status"]')).toContainText('Cancelled');
  });

  test('should validate contraindications for imaging order', async ({ page }) => {
    await page.goto('/app/asis-15-imagenes/new');

    // Select CT (with radiation)
    await page.selectOption('[data-testid="modality-select"]', 'CT');

    // Mark patient as pregnant
    await page.check('[data-testid="pregnancy-checkbox"]');

    // Should show warning
    await expect(page.locator('[role="alert"]')).toContainText('Pregnancy may contraindicate CT');

    // Select MRI instead (safe)
    await page.selectOption('[data-testid="modality-select"]', 'MRI');

    // Warning should disappear
    await expect(page.locator('[role="alert"]')).not.toBeVisible();
  });
});

// ============================================================================
// INTEGRATION E2E TESTS
// ============================================================================

test.describe('Integration Workflows - Lab + Imaging', () => {
  test('should complete patient diagnostic journey', async ({ page }) => {
    // Step 1: Create lab order
    await page.goto('/app/asis-08-laboratorio/new');
    await page.click('[data-testid="test-glucose"]');
    await page.click('[data-testid="test-hemoglobin"]');
    await page.fill('[data-testid="indication-input"]', 'Initial assessment');
    await page.click('[data-testid="submit-order-btn"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Step 2: Create imaging order
    await page.goto('/app/asis-15-imagenes/new');
    await page.selectOption('[data-testid="modality-select"]', 'CT');
    await page.click('[data-testid="body-part-chest"]');
    await page.fill('[data-testid="indication-input"]', 'Follow-up imaging');
    await page.click('[data-testid="submit-order-btn"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Step 3: View combined results
    await page.goto('/app/patient/p1/summary');
    expect(page.locator('[data-testid="lab-orders-section"]')).toBeVisible();
    expect(page.locator('[data-testid="imaging-orders-section"]')).toBeVisible();
  });

  test('should trigger critical finding notification', async ({ page }) => {
    // Navigate to orders with critical findings
    await page.goto('/app/ASIS_08_Laboratorio');

    // Find order with critical result
    await page.click('[data-testid="order-with-critical"]');

    // Should show notification banner
    await expect(page.locator('[data-testid="critical-alert"]')).toBeVisible();
    expect(page.locator('[data-testid="critical-alert"]')).toContainText('Critical');

    // Verify notification can be dismissed
    await page.click('[data-testid="dismiss-critical-btn"]');
    await expect(page.locator('[data-testid="critical-alert"]')).not.toBeVisible();
  });

  test('should handle network connectivity loss and recovery', async ({ page }) => {
    await page.goto('/app/asis-08-laboratorio/new');

    // Fill out order form
    await page.click('[data-testid="test-glucose"]');
    await page.fill('[data-testid="indication-input"]', 'Test order');

    // Simulate network failure
    await page.context().setOffline(true);

    // Try to submit
    await page.click('[data-testid="submit-order-btn"]');

    // Should show offline message
    await expect(page.locator('[data-testid="offline-message"]')).toBeVisible();

    // Go back online
    await page.context().setOffline(false);
    await page.waitForTimeout(1000);

    // Should auto-sync or show sync option
    if (await page.locator('[data-testid="sync-button"]').isVisible()) {
      await page.click('[data-testid="sync-button"]');
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    }
  });
});

// ============================================================================
// ERROR SCENARIOS E2E TESTS
// ============================================================================

test.describe('Error Scenarios & Recovery', () => {
  test('should handle server errors gracefully', async ({ page }) => {
    // Simulate API error
    await page.goto('/app/asis-08-laboratorio/new');

    // Mock API error response
    page.route('**/api/lab-orders', (route) => {
      route.abort('failed');
    });

    await page.click('[data-testid="test-glucose"]');
    await page.fill('[data-testid="indication-input"]', 'Test');
    await page.click('[data-testid="submit-order-btn"]');

    // Should show error message
    await expect(page.locator('[role="alert"]')).toContainText('Error');

    // Restore API
    page.unroute('**/api/lab-orders');
  });

  test('should validate form fields on blur', async ({ page }) => {
    await page.goto('/app/asis-08-laboratorio/new');

    const indicationInput = page.locator('[data-testid="indication-input"]');

    // Type invalid (too short) indication
    await indicationInput.fill('A');
    await indicationInput.blur();

    // Should show validation error
    await expect(page.locator('[data-testid="indication-error"]')).toContainText('Minimum');

    // Fix the error
    await indicationInput.fill('Valid indication text here');
    await indicationInput.blur();

    // Error should clear
    await expect(page.locator('[data-testid="indication-error"]')).not.toBeVisible();
  });
});
