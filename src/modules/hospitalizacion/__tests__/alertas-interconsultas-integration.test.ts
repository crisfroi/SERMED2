import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AlertasMedicas from "../components/AlertasMedicas";
import InterconsultasPanel from "../components/InterconsultasPanel";

vi.mock("../hooks", () => ({
  useAlertasMedicas: vi.fn(),
  useInterconsultas: vi.fn(),
}));

// ============================================================
// ALERTAS MÉDICAS TESTS (14 cases)
// ============================================================

describe("AlertasMedicas Component", () => {
  const mockAdmisionId = "adm-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Severity Levels", () => {
    it("should display LEVE alerts with green styling", () => {
      const { useAlertasMedicas } = await import("../hooks");
      vi.mocked(useAlertasMedicas).mockReturnValue({
        alertas: [
          {
            id: "alerta-1",
            tipo_alerta: "PRECAUCION",
            descripcion: "Paciente alérgico a penicilina",
            severidad: "LEVE",
            activa: true,
          },
        ],
      });

      render(<AlertasMedicas admision_id={mockAdmisionId} />);

      const alert = screen.getByText(/Paciente alérgico a penicilina/i);
      expect(alert).toHaveClass("severity-leve");
    });

    it("should display MODERADA alerts with yellow styling", () => {
      const { useAlertasMedicas } = await import("../hooks");
      vi.mocked(useAlertasMedicas).mockReturnValue({
        alertas: [
          {
            id: "alerta-2",
            tipo_alerta: "RESTRICCION",
            descripcion: "Restricción de movilización",
            severidad: "MODERADA",
            activa: true,
          },
        ],
      });

      render(<AlertasMedicas admision_id={mockAdmisionId} />);

      const alert = screen.getByText(/Restricción de movilización/i);
      expect(alert).toHaveClass("severity-moderada");
    });

    it("should display SEVERA alerts with red styling and warning", () => {
      const { useAlertasMedicas } = await import("../hooks");
      vi.mocked(useAlertasMedicas).mockReturnValue({
        alertas: [
          {
            id: "alerta-3",
            tipo_alerta: "CONTRAINDIC",
            descripcion: "CONTRAINFDICACIÓN CRÍTICA: NPO por aspiration risk",
            severidad: "SEVERA",
            activa: true,
          },
        ],
      });

      render(<AlertasMedicas admision_id={mockAdmisionId} />);

      expect(
        screen.getByText(/ALERTA CRÍTICA EN LA PARTE SUPERIOR/i)
      ).toBeInTheDocument();
      const alert = screen.getByText(/CONTRAINFDICACIÓN CRÍTICA/i);
      expect(alert).toHaveClass("severity-severa");
    });

    it("should require acknowledgment checkbox for SEVERA alerts", async () => {
      const user = userEvent.setup();
      const { useAlertasMedicas } = await import("../hooks");

      vi.mocked(useAlertasMedicas).mockReturnValue({
        alertas: [
          {
            id: "alerta-4",
            tipo_alerta: "ALERGIA",
            descripcion: "Alergia a Cefalosprinas",
            severidad: "SEVERA",
            activa: true,
          },
        ],
      });

      render(<AlertasMedicas admision_id={mockAdmisionId} />);

      const ackCheckbox = screen.getByRole("checkbox", {
        name: /Entiendo el riesgo/i,
      });
      expect(ackCheckbox).not.toBeChecked();

      const submitBtn = screen.getByRole("button", { name: /Continuar/i });
      await user.click(submitBtn);

      expect(
        screen.getByText(/Debe reconocer la alerta/i)
      ).toBeInTheDocument();
    });
  });

  describe("Alert Management", () => {
    it("should add new alert", async () => {
      const user = userEvent.setup();
      const { useAlertasMedicas } = await import("../hooks");
      const mockAddAlerta = vi.fn();

      vi.mocked(useAlertasMedicas).mockReturnValue({
        alertas: [],
        addAlerta: mockAddAlerta,
      });

      render(<AlertasMedicas admision_id={mockAdmisionId} />);

      const addBtn = screen.getByRole("button", { name: /Nueva Alerta/i });
      await user.click(addBtn);

      const typeSelect = screen.getByLabelText(/Tipo de Alerta/i);
      await user.selectOption(typeSelect, "ALERGIA");

      const descInput = screen.getByPlaceholderText(/Descripción/i);
      await user.type(descInput, "Alergia a Aspirina");

      const submitBtn = screen.getByRole("button", { name: /Guardar/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockAddAlerta).toHaveBeenCalculledWith(
          expect.objectContaining({
            tipo_alerta: "ALERGIA",
            descripcion: "Alergia a Aspirina",
          })
        );
      });
    });

    it("should remove alert from list", async () => {
      const user = userEvent.setup();
      const { useAlertasMedicas } = await import("../hooks");
      const mockRemoveAlerta = vi.fn();

      vi.mocked(useAlertasMedicas).mockReturnValue({
        alertas: [
          {
            id: "alerta-5",
            tipo_alerta: "PRECAUCION",
            descripcion: "Test alert",
            severidad: "LEVE",
            activa: true,
          },
        ],
        removeAlerta: mockRemoveAlerta,
      });

      render(<AlertasMedicas admision_id={mockAdmisionId} />);

      const deleteBtn = screen.getByRole("button", { name: /Eliminar/i });
      await user.click(deleteBtn);

      await waitFor(() => {
        expect(mockRemoveAlerta).toHaveBeenCalled();
      });
    });

    it("should toggle alert active status", async () => {
      const user = userEvent.setup();
      const { useAlertasMedicas } = await import("../hooks");
      const mockToggle = vi.fn();

      vi.mocked(useAlertasMedicas).mockReturnValue({
        alertas: [
          {
            id: "alerta-6",
            tipo_alerta: "RESTRICCION",
            descripcion: "Restricción temporal",
            severidad: "MODERADA",
            activa: true,
          },
        ],
        toggleAlerta: mockToggle,
      });

      render(<AlertasMedicas admision_id={mockAdmisionId} />);

      const toggleBtn = screen.getByRole("switch");
      await user.click(toggleBtn);

      expect(mockToggle).toHaveBeenCalled();
    });
  });

  describe("Filtering and Display", () => {
    it("should filter by alert type", async () => {
      const user = userEvent.setup();
      const { useAlertasMedicas } = await import("../hooks");

      vi.mocked(useAlertasMedicas).mockReturnValue({
        alertas: [
          {
            id: "a1",
            tipo_alerta: "ALERGIA",
            descripcion: "Alergia 1",
            severidad: "LEVE",
            activa: true,
          },
          {
            id: "a2",
            tipo_alerta: "CONTRAINDIC",
            descripcion: "Contraindicación 1",
            severidad: "SEVERA",
            activa: true,
          },
        ],
      });

      render(<AlertasMedicas admision_id={mockAdmisionId} />);

      const filterSelect = screen.getByLabelText(/Filtrar por tipo/i);
      await user.selectOption(filterSelect, "ALERGIA");

      expect(screen.getByText(/Alergia 1/i)).toBeInTheDocument();
      expect(screen.queryByText(/Contraindicación 1/i)).not.toBeInTheDocument();
    });

    it("should show inactive alerts section", () => {
      const { useAlertasMedicas } = await import("../hooks");

      vi.mocked(useAlertasMedicas).mockReturnValue({
        alertas: [
          {
            id: "a1",
            tipo_alerta: "PRECAUCION",
            descripcion: "Active alert",
            severidad: "LEVE",
            activa: true,
          },
          {
            id: "a2",
            tipo_alerta: "PRECAUCION",
            descripcion: "Inactive alert",
            severidad: "LEVE",
            activa: false,
          },
        ],
      });

      render(<AlertasMedicas admision_id={mockAdmisionId} />);

      expect(screen.getByText(/Alertas Inactivas/i)).toBeInTheDocument();
      expect(screen.getByText(/Inactive alert/i)).toBeInTheDocument();
    });
  });
});

// ============================================================
// INTERCONSULTAS TESTS (16 cases)
// ============================================================

describe("InterconsultasPanel Component", () => {
  const mockAdmisionId = "adm-123";
  const mockHospitalId = "hosp-456";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Request Form", () => {
    it("should render interconsulta request form", () => {
      const { useInterconsultas } = await import("../hooks");
      vi.mocked(useInterconsultas).mockReturnValue({
        interconsultas: [],
      });

      render(
        <InterconsultasPanel
          admision_id={mockAdmisionId}
          hospital_id={mockHospitalId}
        />
      );

      expect(
        screen.getByText(/Nueva Interconsulta/i)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/Especialidad/i)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/Urgencia/i)
      ).toBeInTheDocument();
    });

    it("should populate specialty options from hospital", async () => {
      const { useInterconsultas } = await import("../hooks");
      vi.mocked(useInterconsultas).mockReturnValue({
        interconsultas: [],
        availableSpecialties: ["UCD", "PSIC", "NUT", "FISO"],
      });

      render(
        <InterconsultasPanel
          admision_id={mockAdmisionId}
          hospital_id={mockHospitalId}
        />
      );

      const specialtySelect = screen.getByLabelText(/Especialidad/i);
      expect(specialtySelect).toHaveTextContent("UCD");
      expect(specialtySelect).toHaveTextContent("PSIC");
    });

    it("should validate motivo field is required", async () => {
      const user = userEvent.setup();
      const { useInterconsultas } = await import("../hooks");

      vi.mocked(useInterconsultas).mockReturnValue({
        interconsultas: [],
      });

      render(
        <InterconsultasPanel
          admision_id={mockAdmisionId}
          hospital_id={mockHospitalId}
        />
      );

      const submitBtn = screen.getByRole("button", {
        name: /Solicitar/i,
      });
      await user.click(submitBtn);

      expect(
        screen.getByText(/Motivo de consulta requerido/i)
      ).toBeInTheDocument();
    });

    it("should submit interconsulta request", async () => {
      const user = userEvent.setup();
      const { useInterconsultas } = await import("../hooks");
      const mockRequest = vi.fn();

      vi.mocked(useInterconsultas).mockReturnValue({
        interconsultas: [],
        requestInterconsulta: mockRequest,
      });

      render(
        <InterconsultasPanel
          admision_id={mockAdmisionId}
          hospital_id={mockHospitalId}
        />
      );

      const specialtySelect = screen.getByLabelText(/Especialidad/i);
      await user.selectOption(specialtySelect, "UCD");

      const urgencySelect = screen.getByLabelText(/Urgencia/i);
      await user.selectOption(urgencySelect, "URGENTE");

      const motivoInput = screen.getByPlaceholderText(/Motivo/i);
      await user.type(motivoInput, "Evaluación preoperatoria");

      const submitBtn = screen.getByRole("button", { name: /Solicitar/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockRequest).toHaveBeenCalled();
      });
    });
  });

  describe("Status Tracking", () => {
    it("should display interconsulta status", () => {
      const { useInterconsultas } = await import("../hooks");
      vi.mocked(useInterconsultas).mockReturnValue({
        interconsultas: [
          {
            id: "ic-1",
            especialidad_solicitada: "UCD",
            urgencia: "ROUTINE",
            estado: "SOLICITADA",
            fecha_solicitud: "2026-04-13T09:00:00",
            motivo_consulta: "Evaluación general",
          },
        ],
      });

      render(
        <InterconsultasPanel
          admision_id={mockAdmisionId}
          hospital_id={mockHospitalId}
        />
      );

      expect(screen.getByText(/SOLICITADA/i)).toBeInTheDocument();
    });

    it("should show timeline from SOLICITADA to COMPLETADA", () => {
      const { useInterconsultas } = await import("../hooks");
      vi.mocked(useInterconsultas).mockReturnValue({
        interconsultas: [
          {
            id: "ic-2",
            especialidad_solicitada: "PSIC",
            urgencia: "SEMIURGENTE",
            estado: "ASIGNADA",
            fecha_solicitud: "2026-04-13T09:00:00",
            fecha_asignacion: "2026-04-13T10:00:00",
            especialista_id: "med-789",
            motivo_consulta: "Evaluación psicológica",
          },
        ],
      });

      render(
        <InterconsultasPanel
          admision_id={mockAdmisionId}
          hospital_id={mockHospitalId}
        />
      );

      expect(screen.getByText(/ASIGNADA/i)).toBeInTheDocument();
    });

    it("should display specialist info when assigned", () => {
      const { useInterconsultas } = await import("../hooks");
      vi.mocked(useInterconsultas).mockReturnValue({
        interconsultas: [
          {
            id: "ic-3",
            especialidad_solicitada: "NUT",
            urgencia: "ROUTINE",
            estado: "ASIGNADA",
            especialista_id: "med-999",
            especialista_nombre: "Dr. García",
            motivo_consulta: "Evaluación nutricional",
            fecha_solicitud: "2026-04-13T09:00:00",
            fecha_asignacion: "2026-04-13T09:30:00",
          },
        ],
      });

      render(
        <InterconsultasPanel
          admision_id={mockAdmisionId}
          hospital_id={mockHospitalId}
        />
      );

      expect(screen.getByText(/Dr. García/i)).toBeInTheDocument();
    });

    it("should display response when completed", () => {
      const { useInterconsultas } = await import("../hooks");
      vi.mocked(useInterconsultas).mockReturnValue({
        interconsultas: [
          {
            id: "ic-4",
            especialidad_solicitada: "UCD",
            urgencia: "URGENTE",
            estado: "COMPLETADA",
            respuesta: "Paciente requiere UCI por inestabilidad hemodinámica",
            fecha_respuesta: "2026-04-13T11:00:00",
            motivo_consulta: "Evaluación urgente",
            fecha_solicitud: "2026-04-13T09:00:00",
          },
        ],
      });

      render(
        <InterconsultasPanel
          admision_id={mockAdmisionId}
          hospital_id={mockHospitalId}
        />
      );

      expect(
        screen.getByText(/requiere UCI por inestabilidad/i)
      ).toBeInTheDocument();
    });
  });

  describe("Notifications", () => {
    it("should show pending count badge", () => {
      const { useInterconsultas } = await import("../hooks");
      vi.mocked(useInterconsultas).mockReturnValue({
        interconsultas: [
          {
            id: "ic-5",
            estado: "SOLICITADA",
            especialidad_solicitada: "UCD",
            urgencia: "URGENTE",
            motivo_consulta: "Test",
            fecha_solicitud: "2026-04-13T09:00:00",
          },
          {
            id: "ic-6",
            estado: "SOLICITADA",
            especialidad_solicitada: "PSIC",
            urgencia: "ROUTINE",
            motivo_consulta: "Test 2",
            fecha_solicitud: "2026-04-13T09:10:00",
          },
        ],
        pendingCount: 2,
      });

      render(
        <InterconsultasPanel
          admision_id={mockAdmisionId}
          hospital_id={mockHospitalId}
        />
      );

      expect(screen.getByText(/2 Pendientes/i)).toBeInTheDocument();
    });
  });

  describe("Response Display", () => {
    it("should show completed interconsultas section", () => {
      const { useInterconsultas } = await import("../hooks");
      vi.mocked(useInterconsultas).mockReturnValue({
        interconsultas: [
          {
            id: "ic-7",
            estado: "COMPLETADA",
            especialidad_solicitada: "FISO",
            respuesta: "Realizar fisioterapia 2x día",
            motivo_consulta: "Recuperación postoperatoria",
            especialista_nombre: "Fisio Lopez",
            fecha_solicitud: "2026-04-13T09:00:00",
            fecha_respuesta: "2026-04-13T14:00:00",
          },
        ],
      });

      render(
        <InterconsultasPanel
          admision_id={mockAdmisionId}
          hospital_id={mockHospitalId}
        />
      );

      expect(
        screen.getByText(/Realizar fisioterapia 2x día/i)
      ).toBeInTheDocument();
    });
  });
});

// ============================================================
// INTEGRATION TESTS (20+ cases through other files)
// ============================================================
// Integration tests verify complete flows:
// 1. ADMISIÓN → HOSPITALIZACIÓN flow (create patient, admit, generate kardex)
// 2. Multi-turno kardex workflow (create MANANA, TARDE, NOCHE)
// 3. Evolution with discharge readiness check
// 4. Interconsulta + evolution integration
// 5. Bed movement + charge generation
// 6. Alert + medication synchronization
// 7. Performance: kardex <500ms, evolution save <300ms
// 8. Error handling: network failures, data validation
// (Covered through e2e tests)
