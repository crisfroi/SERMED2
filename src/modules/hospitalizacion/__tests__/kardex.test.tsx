// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import KardexDiario from "../components/KardexDiario";
import { useKardex, useCrearKardex } from "../hooks";

// Mock hooks
vi.mock("../hooks", () => ({
  useKardex: vi.fn(),
  useCrearKardex: vi.fn(),
}));

describe("KardexDiario Component", () => {
  const mockAdmisionId = "adm-123";
  const mockVitalesNormales = {
    fc: 75,
    ps: 120,
    pd: 80,
    fr: 16,
    temperatura: 37,
    sato2: 98,
    glasgow: 15,
    peso: 70,
    talla: 175,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // RENDER TESTS (4)
  describe("Render", () => {
    it("should render kardex component", () => {
      vi.mocked(useKardex).mockReturnValue({
        kardexes: [],
        isLoading: false,
      });

      render(
        <KardexDiario
          admision_id={mockAdmisionId}
          turno="MANANA"
        />
      );
      expect(screen.getByText(/Kardex Clínico/i)).toBeInTheDocument();
    });

    it("should render three turno tabs", () => {
      vi.mocked(useKardex).mockReturnValue({
        kardexes: [],
        isLoading: false,
      });

      render(
        <KardexDiario
          admision_id={mockAdmisionId}
          turno="MANANA"
        />
      );

      expect(screen.getByRole("tab", { name: /MAÑANA/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /TARDE/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /NOCHE/i })).toBeInTheDocument();
    });

    it("should render vital input fields", () => {
      vi.mocked(useKardex).mockReturnValue({
        kardexes: [],
        isLoading: false,
      });

      render(
        <KardexDiario
          admision_id={mockAdmisionId}
          turno="MANANA"
        />
      );

      expect(screen.getByLabelText(/Frecuencia Cardíaca/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Presión Sistólica/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Temperatura/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/SatO2/i)).toBeInTheDocument();
    });

    it("should render submit button", () => {
      vi.mocked(useKardex).mockReturnValue({
        kardexes: [],
        isLoading: false,
      });

      render(
        <KardexDiario
          admision_id={mockAdmisionId}
          turno="MANANA"
        />
      );

      expect(
        screen.getByRole("button", { name: /Guardar Kardex/i })
      ).toBeInTheDocument();
    });
  });

  // VITAL VALIDATION TESTS (5)
  describe("Vital Validation", () => {
    it("should accept normal vital values", async () => {
      const user = userEvent.setup();
      const mockCreateKardex = vi.fn();

      vi.mocked(useKardex).mockReturnValue({
        kardexes: [],
        isLoading: false,
      });
      vi.mocked(useCrearKardex).mockReturnValue({
        mutate: mockCreateKardex,
        isPending: false,
      });

      render(
        <KardexDiario
          admision_id={mockAdmisionId}
          turno="MANANA"
        />
      );

      const fcInput = screen.getByLabelText(/Frecuencia Cardíaca/i);
      await user.type(fcInput, "75");

      expect(fcInput).toHaveValue(75);
    });

    it("should show warning for high FC", async () => {
      const user = userEvent.setup();

      vi.mocked(useKardex).mockReturnValue({
        kardexes: [],
        isLoading: false,
      });

      render(
        <KardexDiario
          admision_id={mockAdmisionId}
          turno="MANANA"
        />
      );

      const fcInput = screen.getByLabelText(/Frecuencia Cardíaca/i);
      await user.type(fcInput, "140");

      expect(screen.getByText(/Frecuencia elevada/i)).toBeInTheDocument();
    });

    it("should show error for critical low temperature", async () => {
      const user = userEvent.setup();

      vi.mocked(useKardex).mockReturnValue({
        kardexes: [],
        isLoading: false,
      });

      render(
        <KardexDiario
          admision_id={mockAdmisionId}
          turno="MANANA"
        />
      );

      const tempInput = screen.getByLabelText(/Temperatura/i);
      await user.type(tempInput, "34");

      expect(screen.getByText(/Hipotermia crítica/i)).toBeInTheDocument();
    });

    it("should show alert for low SatO2", async () => {
      const user = userEvent.setup();

      vi.mocked(useKardex).mockReturnValue({
        kardexes: [],
        isLoading: false,
      });

      render(
        <KardexDiario
          admision_id={mockAdmisionId}
          turno="MANANA"
        />
      );

      const sato2Input = screen.getByLabelText(/SatO2/i);
      await user.type(sato2Input, "88");

      expect(screen.getByText(/Hipoxemia/i)).toBeInTheDocument();
    });

    it("should validate all required vitals before submit", async () => {
      const user = userEvent.setup();

      vi.mocked(useKardex).mockReturnValue({
        kardexes: [],
        isLoading: false,
      });

      render(
        <KardexDiario
          admision_id={mockAdmisionId}
          turno="MANANA"
        />
      );

      const submitBtn = screen.getByRole("button", { name: /Guardar Kardex/i });
      await user.click(submitBtn);

      expect(
        screen.getByText(/Todos los vitales son requeridos/i)
      ).toBeInTheDocument();
    });
  });

  // MEDICATIONS TAB TESTS (3)
  describe("Medications", () => {
    it("should add medication to list", async () => {
      const user = userEvent.setup();

      vi.mocked(useKardex).mockReturnValue({
        kardexes: [],
        isLoading: false,
      });

      render(
        <KardexDiario
          admision_id={mockAdmisionId}
          turno="MANANA"
        />
      );

      const addMedBtn = screen.getByRole("button", {
        name: /Agregar Medicamento/i,
      });
      await user.click(addMedBtn);

      const medNameInput = screen.getByPlaceholderText(/Nombre medicamento/i);
      await user.type(medNameInput, "Amoxicilina");

      expect(
        screen.getByDisplayValue(/Amoxicilina/i)
      ).toBeInTheDocument();
    });

    it("should remove medication from list", async () => {
      const user = userEvent.setup();

      vi.mocked(useKardex).mockReturnValue({
        kardexes: [],
        isLoading: false,
      });

      render(
        <KardexDiario
          admision_id={mockAdmisionId}
          turno="MANANA"
        />
      );

      const addMedBtn = screen.getByRole("button", {
        name: /Agregar Medicamento/i,
      });
      await user.click(addMedBtn);

      const removeMedBtn = screen.getByRole("button", { name: /Eliminar/i });
      await user.click(removeMedBtn);

      expect(
        screen.queryByPlaceholderText(/Nombre medicamento/i)
      ).not.toBeInTheDocument();
    });

    it("should validate medication required fields", async () => {
      const user = userEvent.setup();

      vi.mocked(useKardex).mockReturnValue({
        kardexes: [],
        isLoading: false,
      });

      render(
        <KardexDiario
          admision_id={mockAdmisionId}
          turno="MANANA"
        />
      );

      const addMedBtn = screen.getByRole("button", {
        name: /Agregar Medicamento/i,
      });
      await user.click(addMedBtn);

      const submitBtn = screen.getByRole("button", { name: /Guardar Kardex/i });
      await user.click(submitBtn);

      expect(
        screen.getByText(/Nombre del medicamento es requerido/i)
      ).toBeInTheDocument();
    });
  });

  // SUBMIT FLOW TESTS (4)
  describe("Submit Flow", () => {
    it("should successfully submit valid kardex", async () => {
      const user = userEvent.setup();
      const mockCreateKardex = vi.fn().mockResolvedValue({
        kardex_id: "kardex-123",
        exito: true,
      });

      vi.mocked(useKardex).mockReturnValue({
        kardexes: [],
        isLoading: false,
      });
      vi.mocked(useCrearKardex).mockReturnValue({
        mutate: mockCreateKardex,
        isPending: false,
      });

      render(
        <KardexDiario
          admision_id={mockAdmisionId}
          turno="MANANA"
        />
      );

      // Fill all vitals
      await user.type(screen.getByLabelText(/Frecuencia Cardíaca/i), "75");
      await user.type(screen.getByLabelText(/Presión Sistólica/i), "120");
      await user.type(screen.getByLabelText(/Presión Diastólica/i), "80");
      await user.type(screen.getByLabelText(/Frecuencia Respiratoria/i), "16");
      await user.type(screen.getByLabelText(/Temperatura/i), "37");
      await user.type(screen.getByLabelText(/SatO2/i), "98");

      await user.click(screen.getByRole("button", { name: /Guardar Kardex/i }));

      await waitFor(() => {
        expect(mockCreateKardex).toHaveBeenCalled();
      });
    });

    it("should show loading state during submit", async () => {
      const user = userEvent.setup();

      vi.mocked(useKardex).mockReturnValue({
        kardexes: [],
        isLoading: false,
      });
      vi.mocked(useCrearKardex).mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
      });

      render(
        <KardexDiario
          admision_id={mockAdmisionId}
          turno="MANANA"
        />
      );

      const submitBtn = screen.getByRole("button", {
        name: /Guardando/i,
      });
      expect(submitBtn).toBeDisabled();
    });

    it("should show confirmation modal before submit", async () => {
      const user = userEvent.setup();

      vi.mocked(useKardex).mockReturnValue({
        kardexes: [],
        isLoading: false,
      });

      render(
        <KardexDiario
          admision_id={mockAdmisionId}
          turno="MANANA"
        />
      );

      const submitBtn = screen.getByRole("button", { name: /Guardar Kardex/i });
      await user.click(submitBtn);

      expect(
        screen.getByText(/¿Confirmar datos del kardex/i)
      ).toBeInTheDocument();
    });

    it("should clear form after successful submit", async () => {
      const user = userEvent.setup();
      const mockCreateKardex = vi.fn().mockResolvedValue({
        kardex_id: "kardex-123",
        exito: true,
      });

      vi.mocked(useKardex).mockReturnValue({
        kardexes: [],
        isLoading: false,
      });
      vi.mocked(useCrearKardex).mockReturnValue({
        mutate: mockCreateKardex,
        isPending: false,
      });

      render(
        <KardexDiario
          admision_id={mockAdmisionId}
          turno="MANANA"
        />
      );

      // Fill and submit
      await user.type(screen.getByLabelText(/Frecuencia Cardíaca/i), "75");
      await user.click(screen.getByRole("button", { name: /Guardar Kardex/i }));
      await user.click(screen.getByRole("button", { name: /Confirmar/i }));

      await waitFor(() => {
        expect((screen.getByLabelText(/Frecuencia Cardíaca/i) as HTMLInputElement).value).toBe("");
      });
    });
  });

  // HISTORY DISPLAY TESTS (2)
  describe("History Display", () => {
    it("should display previous kardex records", () => {
      const mockKardexes = [
        {
          id: "kardex-1",
          turno: "MANANA",
          fecha_kardex: "2026-04-13",
          fc: 72,
        },
        {
          id: "kardex-2",
          turno: "TARDE",
          fecha_kardex: "2026-04-13",
          fc: 74,
        },
      ];

      vi.mocked(useKardex).mockReturnValue({
        kardexes: mockKardexes,
        isLoading: false,
      });

      render(
        <KardexDiario
          admision_id={mockAdmisionId}
          turno="MANANA"
        />
      );

      expect(screen.getByText(/Historial/i)).toBeInTheDocument();
      expect(screen.getByText(/72 bpm/i)).toBeInTheDocument();
    });

    it("should load history on tab change", async () => {
      const user = userEvent.setup();
      const mockKardexes = [
        { id: "k1", turno: "TARDE", fecha_kardex: "2026-04-13", fc: 74 },
      ];

      vi.mocked(useKardex).mockReturnValue({
        kardexes: mockKardexes,
        isLoading: false,
      });

      render(
        <KardexDiario
          admision_id={mockAdmisionId}
          turno="MANANA"
        />
      );

      const tardeTab = screen.getByRole("tab", { name: /TARDE/i });
      await user.click(tardeTab);

      expect(screen.getByText(/74 bpm/i)).toBeInTheDocument();
    });
  });
});
