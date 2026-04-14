import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { ObstetricRiskAlert } from "./ObstetricRiskAlert";
import * as useObstetricRiskModule from "../hooks/useObstetricRisk";

// Mock the hook
jest.mock("../hooks/useObstetricRisk");

describe("ObstetricRiskAlert", () => {
  let mockUseObstetricRisk: jest.MockedFunction<
    typeof useObstetricRiskModule.useObstetricRisk
  >;

  beforeEach(() => {
    mockUseObstetricRisk = useObstetricRiskModule.useObstetricRisk as jest.MockedFunction<
      typeof useObstetricRiskModule.useObstetricRisk
    >;
  });

  describe("Loading state", () => {
    it("should display loading spinner while calculating risk", () => {
      mockUseObstetricRisk.mockReturnValue({
        loading: true,
        error: null,
        riskScore: 0,
        riskLevel: "low",
        riskFactors: { maternal: [], fetal: [], obstetric: [], complications: [] },
      } as any);

      render(<ObstetricRiskAlert pregnancyId="preg-123" />);

      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });
  });

  describe("Low risk display", () => {
    it("should show green indicator for low risk", () => {
      mockUseObstetricRisk.mockReturnValue({
        loading: false,
        error: null,
        riskScore: 15,
        riskLevel: "low",
        riskFactors: {
          maternal: ["Age 28"],
          fetal: [],
          obstetric: [],
          complications: [],
        },
      } as any);

      render(<ObstetricRiskAlert pregnancyId="preg-123" />);

      expect(screen.getByText(/Bajo Riesgo/i)).toBeInTheDocument();
      expect(screen.getByTestId("risk-gauge")).toHaveClass("bg-green");
      expect(screen.getByText(/15%/i)).toBeInTheDocument();
    });

    it("should display routine control recommendations for low risk", () => {
      mockUseObstetricRisk.mockReturnValue({
        loading: false,
        error: null,
        riskScore: 12,
        riskLevel: "low",
        riskFactors: {
          maternal: [],
          fetal: [],
          obstetric: [],
          complications: [],
        },
      } as any);

      render(<ObstetricRiskAlert pregnancyId="preg-123" />);

      expect(screen.getByText(/Control APS cada 4 semanas/i)).toBeInTheDocument();
    });
  });

  describe("Moderate risk display", () => {
    it("should show yellow indicator for moderate risk", () => {
      mockUseObstetricRisk.mockReturnValue({
        loading: false,
        error: null,
        riskScore: 35,
        riskLevel: "moderate",
        riskFactors: {
          maternal: ["Age 38"],
          fetal: [],
          obstetric: ["Gestational age 28w"],
          complications: [],
        },
      } as any);

      render(<ObstetricRiskAlert pregnancyId="preg-123" />);

      expect(screen.getByText(/Riesgo Moderado/i)).toBeInTheDocument();
      expect(screen.getByTestId("risk-gauge")).toHaveClass("bg-yellow");
    });

    it("should display specialist control recommendations", () => {
      mockUseObstetricRisk.mockReturnValue({
        loading: false,
        error: null,
        riskScore: 40,
        riskLevel: "moderate",
        riskFactors: {
          maternal: [],
          fetal: [],
          obstetric: [],
          complications: [],
        },
      } as any);

      render(<ObstetricRiskAlert pregnancyId="preg-123" />);

      expect(
        screen.getByText(/Control mensual con especialista/i)
      ).toBeInTheDocument();
    });
  });

  describe("High risk display", () => {
    it("should show orange indicator for high risk", () => {
      mockUseObstetricRisk.mockReturnValue({
        loading: false,
        error: null,
        riskScore: 60,
        riskLevel: "high",
        riskFactors: {
          maternal: ["Age 40"],
          fetal: ["Fetal anomaly"],
          obstetric: ["Preterm labor"],
          complications: ["Preeclampsia"],
        },
      } as any);

      render(<ObstetricRiskAlert pregnancyId="preg-123" />);

      expect(screen.getByText(/Alto Riesgo/i)).toBeInTheDocument();
      expect(screen.getByTestId("risk-gauge")).toHaveClass("bg-orange");
    });

    it("should display frequent monitoring recommendations", () => {
      mockUseObstetricRisk.mockReturnValue({
        loading: false,
        error: null,
        riskScore: 65,
        riskLevel: "high",
        riskFactors: {
          maternal: [],
          fetal: [],
          obstetric: [],
          complications: [],
        },
      } as any);

      render(<ObstetricRiskAlert pregnancyId="preg-123" />);

      expect(
        screen.getByText(/Control quincenal/)
      ).toBeInTheDocument();
      expect(screen.getByText(/monitoreo fetal/i)).toBeInTheDocument();
    });
  });

  describe("Critical risk display", () => {
    it("should show red indicator for critical risk", () => {
      mockUseObstetricRisk.mockReturnValue({
        loading: false,
        error: null,
        riskScore: 85,
        riskLevel: "critical",
        riskFactors: {
          maternal: ["Age 42"],
          fetal: ["Fetal distress"],
          obstetric: ["Postterm pregnancy"],
          complications: ["Preeclampsia", "Placental abruption"],
        },
      } as any);

      render(<ObstetricRiskAlert pregnancyId="preg-123" />);

      expect(screen.getByText(/Riesgo Crítico/i)).toBeInTheDocument();
      expect(screen.getByTestId("risk-gauge")).toHaveClass("bg-red");
    });

    it("should display URGENT hospitalization recommendations", () => {
      mockUseObstetricRisk.mockReturnValue({
        loading: false,
        error: null,
        riskScore: 95,
        riskLevel: "critical",
        riskFactors: {
          maternal: [],
          fetal: [],
          obstetric: [],
          complications: [],
        },
      } as any);

      render(<ObstetricRiskAlert pregnancyId="preg-123" />);

      expect(screen.getByText(/URGENCIA/i)).toBeInTheDocument();
      expect(screen.getByText(/Hospitalización/i)).toBeInTheDocument();
    });
  });

  describe("Risk factors display", () => {
    it("should display all risk factor categories", () => {
      mockUseObstetricRisk.mockReturnValue({
        loading: false,
        error: null,
        riskScore: 60,
        riskLevel: "high",
        riskFactors: {
          maternal: ["Age 40", "Obesity"],
          fetal: ["Fetal anomaly"],
          obstetric: ["Twin pregnancy"],
          complications: ["Preeclampsia", "Bleeding"],
        },
      } as any);

      render(<ObstetricRiskAlert pregnancyId="preg-123" />);

      expect(screen.getByText(/Factores Maternales/i)).toBeInTheDocument();
      expect(screen.getByText(/Age 40/)).toBeInTheDocument();
      expect(screen.getByText(/Obesity/)).toBeInTheDocument();

      expect(screen.getByText(/Factores Fetales/i)).toBeInTheDocument();
      expect(screen.getByText(/Fetal anomaly/)).toBeInTheDocument();

      expect(screen.getByText(/Complicaciones/i)).toBeInTheDocument();
      expect(screen.getByText(/Preeclampsia/)).toBeInTheDocument();
    });
  });

  describe("Error handling", () => {
    it("should display error message when risk calculation fails", () => {
      mockUseObstetricRisk.mockReturnValue({
        loading: false,
        error: "Failed to calculate risk",
        riskScore: 0,
        riskLevel: "low",
        riskFactors: { maternal: [], fetal: [], obstetric: [], complications: [] },
      } as any);

      render(<ObstetricRiskAlert pregnancyId="preg-123" />);

      expect(screen.getByText(/Error al calcular/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Failed to calculate risk/i)
      ).toBeInTheDocument();
    });

    it("should show offline fallback when disconnected", () => {
      mockUseObstetricRisk.mockReturnValue({
        loading: false,
        error: "Connection failed",
        riskScore: 25,
        riskLevel: "moderate",
        riskFactors: { maternal: [], fetal: [], obstetric: [], complications: [] },
      } as any);

      render(<ObstetricRiskAlert pregnancyId="preg-123" />);

      expect(screen.getByText(/Cálculo sin conexión/i)).toBeInTheDocument();
    });
  });

  describe("Gauge visualization", () => {
    it("should display gauge value from 0 to 100", () => {
      const riskScores = [5, 25, 50, 75, 95];

      for (const score of riskScores) {
        mockUseObstetricRisk.mockReturnValue({
          loading: false,
          error: null,
          riskScore: score,
          riskLevel: score < 20 ? "low" : score < 50 ? "moderate" : "high",
          riskFactors: { maternal: [], fetal: [], obstetric: [], complications: [] },
        } as any);

        const { rerender } = render(
          <ObstetricRiskAlert pregnancyId={`preg-${score}`} />
        );

        expect(screen.getByText(`${score}%`)).toBeInTheDocument();

        rerender(<ObstetricRiskAlert pregnancyId={`preg-${score}`} />);
      }
    });
  });

  describe("Monitoring plan display", () => {
    it("should show appropriate monitoring plan based on risk level", async () => {
      mockUseObstetricRisk.mockReturnValue({
        loading: false,
        error: null,
        riskScore: 45,
        riskLevel: "moderate",
        riskFactors: { maternal: [], fetal: [], obstetric: [], complications: [] },
      } as any);

      render(<ObstetricRiskAlert pregnancyId="preg-123" />);

      await waitFor(() => {
        expect(screen.getByText(/Plan de Monitoreo/i)).toBeInTheDocument();
      });

      expect(
        screen.getByText(/(?:Clínica|Evaluación|Seguimiento).*/i)
      ).toBeInTheDocument();
    });
  });
});
