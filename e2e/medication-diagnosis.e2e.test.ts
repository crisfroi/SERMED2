// ============================================================================
// medication-integration.e2e.test.ts - End-to-End Tests
// ASIS 10.0 - Regímenes de Medicación - Integration Tests
// ============================================================================

describe('Medication Management E2E', () => {
  beforeEach(() => {
    cy.login('testuser@example.com', 'password');
    cy.visit('/patient/123/medications');
  });

  describe('Medication Order Creation Flow', () => {
    it('should create medication order with multiple medications', () => {
      // Navigate to form
      cy.contains('Nueva Orden').click();

      // Select medications
      cy.get('input[type="checkbox"]').eq(0).check(); // Amoxicillin
      cy.get('input[type="checkbox"]').eq(1).check(); // Ibuprofen

      // Enter dose
      cy.get('input[placeholder*="Dosis"]').type('500');

      // Select frequency
      cy.get('select[name="frequency"]').select('twice daily');

      // Enter indication
      cy.get('textarea[name="indication"]').type('Bacterial infection');

      // Verify interactions check
      cy.contains('Verificar Interacciones').click();
      cy.contains('Interacción Moderada').should('be.visible');

      // Submit
      cy.contains('Enviar').click();

      // Verify success
      cy.contains('Orden creada exitosamente').should('be.visible');
    });

    it('should prevent order with critical interactions', () => {
      cy.contains('Nueva Orden').click();

      // Select problematic medications
      cy.get('input[type="checkbox"]').eq(2).check(); // Drug A
      cy.get('input[type="checkbox"]').eq(3).check(); // Drug B (critical interaction)

      cy.contains('Verificar Interacciones').click();
      cy.contains('Interacción Crítica').should('be.visible');

      // Submit should be disabled or show warning
      cy.contains('Enviar').should('be.disabled');
    });

    it('should validate dose ranges', () => {
      cy.contains('Nueva Orden').click();
      cy.get('input[type="checkbox"]').eq(0).check();

      // Enter dose too high
      cy.get('input[placeholder*="Dosis"]').type('10000');
      cy.contains('Enviar').click();

      cy.contains('Dosis supera el máximo permitido').should('be.visible');
    });
  });

  describe('Prescription Management', () => {
    it('should view active prescriptions', () => {
      cy.contains('Prescripciones Activas').should('be.visible');
      cy.get('[data-testid="prescription-card"]').should('have.length.greaterThan', 0);
    });

    it('should request medication refill', () => {
      cy.get('[data-testid="prescription-card"]').first().within(() => {
        cy.contains('Solicitar Recarga').click();
      });

      cy.contains('Solicitud de recarga enviada').should('be.visible');
    });

    it('should print prescription', () => {
      cy.get('[data-testid="prescription-card"]').first().within(() => {
        cy.contains('Imprimir').click();
      });

      cy.window().then((win) => {
        cy.spy(win, 'print');
      });
    });
  });

  describe('Interaction Checking', () => {
    it('should check selected medications for interactions', () => {
      cy.contains('Verificador de Interacciones').click();

      cy.get('input[type="checkbox"]').eq(0).check();
      cy.get('input[type="checkbox"]').eq(1).check();

      cy.contains('Analizar').click();

      cy.contains('Resultados de Interacciones').should('be.visible');
      cy.get('[data-testid="interaction-item"]').should('have.length.greaterThan', 0);
    });

    it('should display alternatives for problematic interactions', () => {
      cy.contains('Verificador de Interacciones').click();

      cy.get('input[type="checkbox"]').eq(0).check();
      cy.get('input[type="checkbox"]').eq(1).check();

      cy.contains('Analizar').click();

      cy.get('[data-testid="interaction-item"]').first().within(() => {
        cy.contains('ALTERNATIVAS:').should('be.visible');
      });
    });
  });

  describe('Adherence Tracking', () => {
    it('should display adherence metrics', () => {
      cy.contains('Seguimiento de Adherencia').click();

      cy.contains('Adherencia').should('be.visible');
      cy.contains(/\d+%/).should('exist'); // Percentage
      cy.contains('Dosis Tomadas').should('be.visible');
    });

    it('should record dose taken', () => {
      cy.contains('Seguimiento de Adherencia').click();

      cy.get('[data-testid="dose-calendar"] button').first().click();
      cy.contains('Registrarcomo tomada').click();

      cy.contains('Dosis registrada').should('be.visible');
    });

    it('should export adherence data', () => {
      cy.contains('Seguimiento de Adherencia').click();
      cy.contains('Exportar').click();

      cy.readFile('cypress/downloads/adherence-*.json')
        .should('exist')
        .then((content) => {
          expect(JSON.parse(content)).to.have.property('metrics');
        });
    });
  });

  describe('Regime Management', () => {
    it('should display active medication regimes', () => {
      cy.contains('Gestor de Regímenes').click();

      cy.get('[data-testid="regime-card"]').should('have.length.greaterThan', 0);
    });

    it('should pause medication regime', () => {
      cy.contains('Gestor de Regímenes').click();

      cy.get('[data-testid="regime-card"]').first().click();
      cy.contains('Pausar').click();

      cy.contains('Régimen pausado').should('be.visible');
    });

    it('should resume paused regime', () => {
      cy.contains('Gestor de Regímenes').click();

      cy.get('select[name="status"]').select('paused');

      cy.get('[data-testid="regime-card"]').first().click();
      cy.contains('Activar').click();

      cy.contains('Régimen reactivado').should('be.visible');
    });
  });
});

describe('Diagnosis Management E2E', () => {
  beforeEach(() => {
    cy.login('testuser@example.com', 'password');
    cy.visit('/patient/123/diagnoses');
  });

  describe('Diagnosis Creation', () => {
    it('should create new diagnosis', () => {
      cy.contains('Nuevo Diagnóstico').click();

      // Search ICD-10 code
      cy.get('input[placeholder*="Ej: diabetes"]').type('E11');
      cy.contains('Type 2 diabetes mellitus').click();

      // Set onset date
      cy.get('input[type="date"]').first().type('2024-01-15');

      // Select severity
      cy.get('select[name="severity"]').select('moderate');

      // Enter clinical context
      cy.get('textarea[name="clinical_context"]').type(
        'Patient presents with elevated HbA1c and classic symptoms'
      );

      // Submit
      cy.contains('Guardar Diagnóstico').click();

      cy.contains('Diagnóstico guardado').should('be.visible');
    });

    it('should validate ICD-10 code', () => {
      cy.contains('Nuevo Diagnóstico').click();

      cy.get('input[placeholder*="Ej: diabetes"]').type('INVALID123');
      cy.contains('Enviar').click();

      cy.contains('Código ICD-10 inválido').should('be.visible');
    });

    it('should warn about duplicate diagnoses', () => {
      cy.contains('Nuevo Diagnóstico').click();

      cy.get('input[placeholder*="Ej: diabetes"]').type('I10');
      cy.contains('Essential hypertension').click();

      // Set future date
      cy.get('input[type="date"]').first().clear().type('2024-01-15');
      cy.get('textarea[name="clinical_context"]').type('Test context');
      cy.contains('Guardar Diagnóstico').click();

      cy.contains('diagnóstico similar ya activo').should('be.visible');
    });
  });

  describe('Diagnosis History', () => {
    it('should display diagnosis timeline', () => {
      cy.contains('Historial de Diagnósticos').click();

      cy.contains('Cronología').should('be.visible');
      cy.get('[data-testid="diagnosis-timeline"]').should('exist');
    });

    it('should filter diagnoses by status', () => {
      cy.contains('Activos').click();
      cy.get('[data-testid="diagnosis-card"]').each(($card) => {
        cy.wrap($card).contains('Activo').should('be.visible');
      });

      cy.contains('Resueltos').click();
      cy.get('[data-testid="diagnosis-card"]').each(($card) => {
        cy.wrap($card).contains('Resuelto').should('be.visible');
      });
    });

    it('should mark diagnosis as resolved', () => {
      cy.contains('Historial de Diagnósticos').click();

      cy.get('[data-testid="diagnosis-card"]').first().click();
      cy.contains('Marcar como Resuelto').click();

      cy.get('input[type="date"]').type('2024-06-01');
      cy.contains('Confirmar').click();

      cy.contains('Diagnóstico marcado como resuelto').should('be.visible');
    });
  });

  describe('Comorbidity Assessment', () => {
    it('should display detected comorbidities', () => {
      cy.contains('Evaluación de Comorbilidades').click();

      cy.contains('Comorbilidades Detectadas').should('be.visible');
      cy.get('[data-testid="comorbidity-card"]').should('have.length.greaterThan', 0);
    });

    it('should show risk scores', () => {
      cy.contains('Evaluación de Comorbilidades').click();

      cy.contains('Índice Charlson').should('be.visible');
      cy.contains(/\d+/).should('exist');

      cy.contains('Riesgo de Reingreso').should('be.visible');
    });

    it('should provide treatment recommendations', () => {
      cy.contains('Evaluación de Comorbilidades').click();

      cy.contains('Recomendaciones de Tratamiento').should('be.visible');
      cy.get('[data-testid="recommendation"]').should('have.length.greaterThan', 0);
    });
  });
});
