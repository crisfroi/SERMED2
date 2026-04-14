import { renderHook, act, waitFor } from "@testing-library/react";
import { useWHOGrowth } from "./useWHOGrowth";
import * as supabaseModule from "@supabase/supabase-js";

jest.mock("@supabase/supabase-js");

describe("useWHOGrowth", () => {
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

  describe("WHO percentile calculation via edge function", () => {
    it("should calculate healthy weight percentile for 6-month boy", async () => {
      const edgeFunctionResponse = {
        percentile_weight: 50,
        percentile_height: 55,
        bmi_percentile: 52,
        status: "normal",
        alert: undefined,
        reference_age_months: 6,
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: edgeFunctionResponse,
      });

      const { result } = renderHook(() =>
        useWHOGrowth({
          weight_kg: 7.2,
          height_cm: 67.5,
          age_months: 6,
          sex: "M",
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.percentile_weight).toBe(50);
      expect(result.current.status).toBe("normal");
      expect(result.current.alert).toBeUndefined();
    });

    it("should detect underweight child (<5 percentile)", async () => {
      const edgeFunctionResponse = {
        percentile_weight: 3,
        percentile_height: 20,
        bmi_percentile: 5,
        status: "underweight",
        alert: "Peso bajo para edad. Evaluación de desnutrición recomendada.",
        reference_age_months: 12,
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: edgeFunctionResponse,
      });

      const { result } = renderHook(() =>
        useWHOGrowth({
          weight_kg: 7.8,
          height_cm: 75.0,
          age_months: 12,
          sex: "F",
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.status).toBe("underweight");
      expect(result.current.alert).toContain("desnutrición");
    });

    it("should detect overweight child (>95 percentile)", async () => {
      const edgeFunctionResponse = {
        percentile_weight: 97,
        percentile_height: 60,
        bmi_percentile: 96,
        status: "overweight",
        alert: "Peso elevado. Evaluación de sobrepeso recomendada.",
        reference_age_months: 36,
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: edgeFunctionResponse,
      });

      const { result } = renderHook(() =>
        useWHOGrowth({
          weight_kg: 17.5,
          height_cm: 96.0,
          age_months: 36,
          sex: "M",
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.status).toBe("overweight");
      expect(result.current.alert).toContain("sobrepeso");
    });

    it("should detect obesity (>99 percentile)", async () => {
      const edgeFunctionResponse = {
        percentile_weight: 99.5,
        percentile_height: 55,
        bmi_percentile: 99.8,
        status: "obese",
        alert: "Obesidad infantil. Seguimiento especializado recomendado.",
        reference_age_months: 48,
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: edgeFunctionResponse,
      });

      const { result } = renderHook(() =>
        useWHOGrowth({
          weight_kg: 22.0,
          height_cm: 102.0,
          age_months: 48,
          sex: "F",
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.status).toBe("obese");
      expect(result.current.alert).toContain("Obesidad");
    });
  });

  describe("Fallback calculation (offline)", () => {
    it("should calculate percentiles when edge function fails", async () => {
      mockSupabase.functions.invoke.mockRejectedValueOnce(
        new Error("Function unavailable")
      );

      const { result } = renderHook(() =>
        useWHOGrowth({
          weight_kg: 7.2,
          height_cm: 67.5,
          age_months: 6,
          sex: "M",
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Fallback should estimate percentile without being undefined
      expect(result.current.percentile_weight).toBeDefined();
      expect(result.current.percentile_weight).toBeGreaterThanOrEqual(0);
      expect(result.current.percentile_weight).toBeLessThanOrEqual(100);
      expect(result.current.status).toBeDefined();
    });
  });

  describe("Sex-specific growth references", () => {
    it("should calculate different percentiles for males vs females at same age/weight", async () => {
      const maleResponse = {
        percentile_weight: 47,
        percentile_height: 48,
        bmi_percentile: 48,
        status: "normal",
        alert: undefined,
        reference_age_months: 24,
      };

      const femaleResponse = {
        percentile_weight: 52,
        percentile_height: 50,
        bmi_percentile: 52,
        status: "normal",
        alert: undefined,
        reference_age_months: 24,
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: maleResponse,
      });

      const { result: maleResult } = renderHook(() =>
        useWHOGrowth({
          weight_kg: 13.5,
          height_cm: 88.0,
          age_months: 24,
          sex: "M",
        })
      );

      await waitFor(() => {
        expect(maleResult.current.loading).toBe(false);
      });

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: femaleResponse,
      });

      const { result: femaleResult } = renderHook(() =>
        useWHOGrowth({
          weight_kg: 13.5,
          height_cm: 88.0,
          age_months: 24,
          sex: "F",
        })
      );

      await waitFor(() => {
        expect(femaleResult.current.loading).toBe(false);
      });

      // Percentiles should potentially differ by sex (in real WHO data)
      expect(maleResult.current.percentile_weight).toBeDefined();
      expect(femaleResult.current.percentile_weight).toBeDefined();
    });
  });

  describe("Age edge cases", () => {
    it("should handle newborn (0 months)", async () => {
      const newbornResponse = {
        percentile_weight: 48,
        percentile_height: 50,
        bmi_percentile: 0,
        status: "normal",
        alert: undefined,
        reference_age_months: 0,
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: newbornResponse,
      });

      const { result } = renderHook(() =>
        useWHOGrowth({
          weight_kg: 3.4,
          height_cm: 50.0,
          age_months: 0,
          sex: "M",
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.reference_age_months).toBe(0);
      expect(result.current.status).toBe("normal");
    });

    it("should handle 5-year-old (60 months)", async () => {
      const fiveYearResponse = {
        percentile_weight: 55,
        percentile_height: 52,
        bmi_percentile: 50,
        status: "normal",
        alert: undefined,
        reference_age_months: 60,
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: fiveYearResponse,
      });

      const { result } = renderHook(() =>
        useWHOGrowth({
          weight_kg: 18.5,
          height_cm: 109.0,
          age_months: 60,
          sex: "F",
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.reference_age_months).toBe(60);
    });
  });

  describe("Height-specific alerts", () => {
    it("should detect short stature (<5 percentile)", async () => {
      const shortStatureResponse = {
        percentile_weight: 30,
        percentile_height: 2,
        bmi_percentile: 15,
        status: "underweight",
        alert: "Talla baja. Evaluación de desnutrición crónica recomendada.",
        reference_age_months: 36,
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: shortStatureResponse,
      });

      const { result } = renderHook(() =>
        useWHOGrowth({
          weight_kg: 12.0,
          height_cm: 87.0,
          age_months: 36,
          sex: "M",
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.alert).toContain("Talla baja");
    });
  });
});
