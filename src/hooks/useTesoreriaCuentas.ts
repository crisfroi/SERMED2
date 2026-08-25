// @ts-nocheck
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CuentaBancaria {
  id: string;
  banco: string;
  titular: string;
  numero_cuenta: string;
  iban?: string | null;
  swift?: string | null;
  moneda: string;
  activo: boolean;
  predeterminada: boolean;
  observaciones?: string | null;
}

const table = () => (supabase as any).from("tesoreria_cuentas_bancarias");

export const useCuentasBancarias = (soloActivas = false) =>
  useQuery({
    queryKey: ["tesoreria-cuentas", soloActivas],
    queryFn: async () => {
      let q = table().select("*").order("banco");
      if (soloActivas) q = q.eq("activo", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as CuentaBancaria[];
    },
    staleTime: 60 * 1000,
  });

export const useUpsertCuentaBancaria = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<CuentaBancaria>) => {
      const { id, ...rest } = row as any;
      const query = id ? table().update(rest).eq("id", id) : table().insert(rest);
      const { data, error } = await query.select().single();
      if (error) throw error;
      return data as CuentaBancaria;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tesoreria-cuentas"] }),
  });
};

export const useDeleteCuentaBancaria = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await table().delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tesoreria-cuentas"] }),
  });
};
