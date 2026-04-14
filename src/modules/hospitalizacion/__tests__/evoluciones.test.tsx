// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EvolucionClinica from "../components/EvolucionClinica";
import { useEvolucionesClinicas } from "../hooks";

vi.mock("../hooks", () => ({
  useEvolucionesClinicas: vi.fn(),
  useCrearEvolucion: vi.fn(),
}));

describe("EvolucionClinica Component", () => {
  const mockAdmisionId = "adm-123";
  const mockPacienteId = "pac-456";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // RICH TEXT EDITOR TESTS (4)
  describe("Rich Text Editor", () => {
    it("should render rich text editor", () => {
      vi.mocked(useEvolucionesClinicas).mockReturnValue({
        evolutions: [],
        isLoading: false,
      });

      render(
        <EvolucionClinica
          admision_id={mockAdmisionId}
          paciente_id={mockPacienteId}
        />
      );

      expect(
        screen.getByPlaceholderText(/Escriba la evolución clínica/i)
      ).toBeInTheDocument();
    });

    it("should handle text input", async () => {
      const user = userEvent.setup();

      vi.mocked(useEvolucionesClinicas).mockReturnValue({
        evolutions: [],
        isLoading: false,
      });

      render(
        <EvolucionClinica
          admision_id={mockAdmisionId}
          paciente_id={mockPacienteId}
        />
      );

      const editor = screen.getByPlaceholderText(
        /Escriba la evolución clínica/i
      );
      await user.type(editor, "Paciente estable, FC 78, PS 120");

      expect(editor).toHaveValue("Paciente estable, FC 78, PS 120");
    });

    it("should support text formatting", async () => {
      const user = userEvent.setup();

      vi.mocked(useEvolucionesClinicas).mockReturnValue({
        evolutions: [],
        isLoading: false,
      });

      render(
        <EvolucionClinica
          admision_id={mockAdmisionId}
          paciente_id={mockPacienteId}
        />
      );

      const boldBtn = screen.getByRole("button", { name: /Bold|Negrita/i });
      await user.click(boldBtn);

      expect(boldBtn).toHaveClass("active-toolbar-btn");
    });

    it("should validate minimum length", async () => {
      const user = userEvent.setup();

      vi.mocked(useEvolucionesClinicas).mockReturnValue({
        evolutions: [],
        isLoading: false,
      });

      render(
        <EvolucionClinica
          admision_id={mockAdmisionId}
          paciente_id={mockPacienteId}
        />
      );

      const editor = screen.getByPlaceholderText(
        /Escriba la evolución clínica/i
      );
      await user.type(editor, "Ok");

      const submitBtn = screen.getByRole("button", { name: /Guardar/i });
      await user.click(submitBtn);

      expect(
        screen.getByText(/Mínimo 10 caracteres/i)
      ).toBeInTheDocument();
    });
  });

  // SIGN/SUBMIT TESTS (4)
  describe("Sign and Submit", () => {
    it("should show save as draft button", () => {
      vi.mocked(useEvolucionesClinicas).mockReturnValue({
        evolutions: [],
        isLoading: false,
      });

      render(
        <EvolucionClinica
          admision_id={mockAdmisionId}
          paciente_id={mockPacienteId}
        />
      );

      expect(
        screen.getByRole("button", { name: /Guardar como Borrador/i })
      ).toBeInTheDocument();
    });

    it("should show sign & submit button", () => {
      vi.mocked(useEvolucionesClinicas).mockReturnValue({
        evolutions: [],
        isLoading: false,
      });

      render(
        <EvolucionClinica
          admision_id={mockAdmisionId}
          paciente_id={mockPacienteId}
        />
      );

      expect(
        screen.getByRole("button", { name: /Firmar y Enviar/i })
      ).toBeInTheDocument();
    });

    it("should save as draft without signature", async () => {
      const user = userEvent.setup();
      const mockSaveDraft = vi.fn();

      vi.mocked(useEvolucionesClinicas).mockReturnValue({
        evolutions: [],
        isLoading: false,
      });

      render(
        <EvolucionClinica
          admision_id={mockAdmisionId}
          paciente_id={mockPacienteId}
        />
      );

      const editor = screen.getByPlaceholderText(
        /Escriba la evolución clínica/i
      );
      await user.type(
        editor,
        "Paciente con evolución favorable, continuar manejo actual"
      );

      const draftBtn = screen.getByRole("button", {
        name: /Guardar como Borrador/i,
      });
      await user.click(draftBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/Guardado como borrador/i)
        ).toBeInTheDocument();
      });
    });

    it("should require signature before final submit", async () => {
      const user = userEvent.setup();

      vi.mocked(useEvolucionesClinicas).mockReturnValue({
        evolutions: [],
        isLoading: false,
      });

      render(
        <EvolucionClinica
          admision_id={mockAdmisionId}
          paciente_id={mockPacienteId}
        />
      );

      const editor = screen.getByPlaceholderText(
        /Escriba la evolución clínica/i
      );
      await user.type(
        editor,
        "Paciente con evolución favorable, continuar manejo actual"
      );

      const signBtn = screen.getByRole("button", {
        name: /Firmar y Enviar/i,
      });
      await user.click(signBtn);

      expect(
        screen.getByText(/Por favor, ingrese su firma digital/i)
      ).toBeInTheDocument();
    });
  });

  // HISTORY TESTS (3)
  describe("History", () => {
    it("should display timeline of previous evolutions", () => {
      const mockEvolutions = [
        {
          id: "evo-1",
          tipo: "MEDICA",
          texto_evolucion: "Paciente estable",
          estado: "FIRMADO",
          fecha_evolucion: "2026-04-13T09:00:00",
        },
        {
          id: "evo-2",
          tipo: "ENFERMERIA",
          texto_evolucion: "Signos vitales normales",
          estado: "FIRMADO",
          fecha_evolucion: "2026-04-13T14:00:00",
        },
      ];

      vi.mocked(useEvolucionesClinicas).mockReturnValue({
        evolutions: mockEvolutions,
        isLoading: false,
      });

      render(
        <EvolucionClinica
          admision_id={mockAdmisionId}
          paciente_id={mockPacienteId}
        />
      );

      expect(screen.getByText(/Paciente estable/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Signos vitales normales/i)
      ).toBeInTheDocument();
    });

    it("should sort history by most recent first", () => {
      const mockEvolutions = [
        {
          id: "evo-1",
          tipo: "MEDICA",
          fecha_evolucion: "2026-04-13T09:00:00",
          estado: "FIRMADO",
          texto_evolucion: "Primera evolución",
        },
        {
          id: "evo-2",
          tipo: "MEDICA",
          fecha_evolucion: "2026-04-13T14:00:00",
          estado: "FIRMADO",
          texto_evolucion: "Segunda evolución",
        },
      ];

      vi.mocked(useEvolucionesClinicas).mockReturnValue({
        evolutions: mockEvolutions,
        isLoading: false,
      });

      render(
        <EvolucionClinica
          admision_id={mockAdmisionId}
          paciente_id={mockPacienteId}
        />
      );

      const timeline = screen.getByRole("region", { name: /Historial/i });
      const items = within(timeline).getAllByRole("article");

      expect(items[0]).toHaveTextContent(/Segunda evolución/i);
      expect(items[1]).toHaveTextContent(/Primera evolución/i);
    });

    it("should show type badges for each evolution", () => {
      const mockEvolutions = [
        {
          id: "evo-1",
          tipo: "MEDICA",
          estado: "FIRMADO",
          fecha_evolucion: "2026-04-13T09:00:00",
          texto_evolucion: "Médica",
        },
        {
          id: "evo-2",
          tipo: "PSICOLOGIA",
          estado: "FIRMADO",
          fecha_evolucion: "2026-04-13T10:00:00",
          texto_evolucion: "Psico",
        },
      ];

      vi.mocked(useEvolucionesClinicas).mockReturnValue({
        evolutions: mockEvolutions,
        isLoading: false,
      });

      render(
        <EvolucionClinica
          admision_id={mockAdmisionId}
          paciente_id={mockPacienteId}
        />
      );

      expect(screen.getByText(/MÉDICA/i)).toBeInTheDocument();
      expect(screen.getByText(/PSICOLOGÍA/i)).toBeInTheDocument();
    });
  });

  // STATE MANAGEMENT TESTS (4)
  describe("State Management", () => {
    it("should track estado as BORRADOR when unsaved", () => {
      vi.mocked(useEvolucionesClinicas).mockReturnValue({
        evolutions: [],
        isLoading: false,
      });

      render(
        <EvolucionClinica
          admision_id={mockAdmisionId}
          paciente_id={mockPacienteId}
        />
      );

      expect(screen.getByText(/BORRADOR/i)).toBeInTheDocument();
    });

    it("should change estado to FIRMADO after signing", async () => {
      const user = userEvent.setup();

      vi.mocked(useEvolucionesClinicas).mockReturnValue({
        evolutions: [],
        isLoading: false,
      });

      render(
        <EvolucionClinica
          admision_id={mockAdmisionId}
          paciente_id={mockPacienteId}
        />
      );

      const editor = screen.getByPlaceholderText(
        /Escriba la evolución clínica/i
      );
      await user.type(
        editor,
        "Evolución positiva del paciente, continuar manejo"
      );

      const signBtn = screen.getByRole("button", {
        name: /Firmar y Enviar/i,
      });
      await user.click(signBtn);

      // Complete signature
      const signatureCanvas = screen.getByTestId("signature-canvas");
      fireEvent.mouseDown(signatureCanvas, { clientX: 10, clientY: 10 });
      fireEvent.mouseMove(signatureCanvas, { clientX: 20, clientY: 20 });
      fireEvent.mouseUp(signatureCanvas);

      const confirmBtn = screen.getByRole("button", { name: /Confirmar Firma/i });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/FIRMADO/i)).toBeInTheDocument();
      });
    });

    it("should lock editor after signing", async () => {
      const user = userEvent.setup();

      vi.mocked(useEvolucionesClinicas).mockReturnValue({
        evolutions: [
          {
            id: "evo-1",
            tipo: "MEDICA",
            estado: "FIRMADO",
            fecha_evolucion: "2026-04-13T09:00:00",
            texto_evolucion: "Evolución ya firmada",
          },
        ],
        isLoading: false,
      });

      render(
        <EvolucionClinica
          admision_id={mockAdmisionId}
          paciente_id={mockPacienteId}
        />
      );

      const editor = screen.getByPlaceholderText(
        /Escriba la evolución clínica/i
      );
      expect(editor).toBeDisabled();
    });

    it("should allow edit when viewing as draft", async () => {
      const user = userEvent.setup();

      vi.mocked(useEvolucionesClinicas).mockReturnValue({
        evolutions: [
          {
            id: "evo-1",
            tipo: "MEDICA",
            estado: "BORRADOR",
            fecha_evolucion: "2026-04-13T09:00:00",
            texto_evolucion: "Borrador editables",
          },
        ],
        isLoading: false,
      });

      render(
        <EvolucionClinica
          admision_id={mockAdmisionId}
          paciente_id={mockPacienteId}
        />
      );

      const editor = screen.getByPlaceholderText(
        /Escriba la evolución clínica/i
      );
      expect(editor).not.toBeDisabled();
    });
  });
});
