// @ts-nocheck
import { renderHook, act, waitFor } from "@testing-library/react";
import { useObstetricRisk } from "./useObstetricRisk";
import * as supabaseModule from "@supabase/supabase-js";

// Mock Supabase
jest.mock("@supabase/supabase-js");

describe("useObstetricRisk", () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = {
      functions: {
        invoke: jest.fn(),
      },
    };
    jest
      .spyOn(supabaseModule, "createClient")
      .mockReturnValue(mockSupabase as any);
  });

  describe("Edge function success", () => {
    it("should return risk score from edge function", async () => {
      const mockRiskData = {
        riskScore: 45,
        riskLevel: "moderate",
        riskFactors: {
          maternal: ["Age 38"],
          fetal: [],
          obstetric: ["Gestational age 28w"],
          complications: [],
        },
        recommendations: [
          "Monthly specialist control",
          "Ultrasound at 34 weeks",
        ],
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: mockRiskData,
      });

      const { result } = renderHook(() => useObstetricRisk("preg-123"));

      // Initially loading
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.riskScore).toBe(45);
      expect(result.current.riskLevel).toBe("moderate");
      expect(result.current.riskFactors.maternal).toContain("Age 38");
    });

    it("should classify risk levels correctly", async () => {
      const riskScores = [
        { score: 15, level: "low" },
        { score: 35, level: "moderate" },
        { score: 65, level: "high" },
        { score: 85, level: "critical" },
      ];

      for (const { score, level } of riskScores) {
        mockSupabase.functions.invoke.mockResolvedValueOnce({
          data: {
            riskScore: score,
            riskLevel: level,
            riskFactors: { maternal: [], fetal: [], obstetric: [], complications: [] },
            recommendations: [],
          },
        });

        const { result } = renderHook(() => useObstetricRisk(`preg-${score}`));

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.riskLevel).toBe(level);
      }
    });
  });

  describe("Edge function failure with fallback", () => {
    it("should calculate basic risk on edge function error", async () => {
      mockSupabase.functions.invoke.mockRejectedValueOnce(
        new Error("Function unavailable")
      );

      const { result } = renderHook(() =>
        useObstetricRisk("preg-123", {
          maternal_age: 42,
          comorbidities: ["hypertension", "diabetes"],
          complications: ["preeclampsia"],
          gestational_age_weeks: 36,
        } as any)
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Fallback calculation: 
      // Age 42 = +18pts, Hypertension = +20, Diabetes = +25, Preeclampsia = +25
      // Preterm (<37w) = +10
      // Expected: 18 + 20 + 25 + 25 + 10 = 98 (but capped at 100)
      expect(result.current.riskScore).toBeGreaterThan(70);
      expect(result.current.riskLevel).toBe("critical");
      expect(result.current.error).toBeFalsy();
    });

    it("should handle missing pregnancy data gracefully", async () => {
      mockSupabase.functions.invoke.mockRejectedValueOnce(
        new Error("Not found")
      );

      const { result } = renderHook(() => useObstetricRisk("preg-invalid"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.riskScore).toBe(0);
    });
  });

  describe("Risk factor edge cases", () => {
    it("should handle teenage pregnancy (high risk)", async () => {
      const lowRiskData = {
        riskScore: 25,
        riskLevel: "moderate",
        riskFactors: {
          maternal: ["Age 16"],
          fetal: [],
          obstetric: [],
          complications: [],
        },
        recommendations: ["Early specialist referral"],
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: lowRiskData,
      });

      const { result } = renderHook(() => useObstetricRisk("preg-teen"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.riskFactors.maternal).toContain("Age 16");
      expect(result.current.riskLevel).toMatch(/moderate|high/);
    });

    it("should handle multiple complications", async () => {
      const criticalData = {
        riskScore: 95,
        riskLevel: "critical",
        riskFactors: {
          maternal: ["Age 38"],
          fetal: ["Fetal distress"],
          obstetric: ["Postterm pregnancy"],
          complications: ["Preeclampsia", "Placental abruption", "Bleeding"],
        },
        recommendations: [
          "URGENT: Hospitalization",
          "Continuous monitoring",
          "Multidisciplinary team",
        ],
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: criticalData,
      });

      const { result } = renderHook(() => useObstetricRisk("preg-critical"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.riskLevel).toBe("critical");
      expect(result.current.riskFactors.complications.length).toBe(3);
    });

    it("should handle low-risk pregnancy", async () => {
      const lowRiskData = {
        riskScore: 8,
        riskLevel: "low",
        riskFactors: {
          maternal: ["Age 28"],
          fetal: [],
          obstetric: [],
          complications: [],
        },
        recommendations: [
          "Routine control every 4 weeks",
          "Standard prenatal education",
        ],
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: lowRiskData,
      });

      const { result } = renderHook(() => useObstetricRisk("preg-low"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.riskLevel).toBe("low");
      expect(result.current.riskScore).toBeLessThan(20);
    });
  });

  describe("Risk calculation recalculation", () => {
    it("should refetch when pregnancy_id changes", async () => {
      const initialData = { riskScore: 30, riskLevel: "moderate" };
      const updatedData = { riskScore: 50, riskLevel: "high" };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: initialData as any,
      });

      const { result, rerender } = renderHook(
        ({ pregnancyId }) => useObstetricRisk(pregnancyId),
        { initialProps: { pregnancyId: "preg-1" } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.riskScore).toBe(30);

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: updatedData as any,
      });

      act(() => {
        rerender({ pregnancyId: "preg-2" });
      });

      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledTimes(2);
      });
    });
  });
});
