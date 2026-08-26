import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PersistedStoreRecord } from "@/lib/dashboard-data";

export type StoreSnapshotRow = PersistedStoreRecord & {
  storeId: string;
  referenceMonth: string;
};

export type SaveStorePayload = {
  id: string;
  name: string;
  city: string;
  status: "Ativa" | "Em revisão";
  referenceMonth: string;
  grossSales: number;
  orders: number;
  newCustomers: number;
  promoSales: number;
  promoOrders: number;
  promoTicket: number;
  promoNewCustomers: number;
  recoveredCustomers: number;
  storePromoInvestment: number;
  ifoodPromoInvestment: number;
  promoReturn: number;
  roas: number;
  adSales: number;
  adTicket: number;
  adOrders: number;
  adNewCustomers: number;
  cac: number;
  adVisits: number;
  conversion: number;
  adInvestment: number;
  costPerOrder: number;
  cmv: number;
  productsJson: string;
};

export const storeKeys = {
  records: ["store_records"] as const,
  snapshots: ["store_snapshots"] as const,
};

export function useStoreRecords() {
  return useQuery({
    queryKey: storeKeys.records,
    queryFn: async (): Promise<PersistedStoreRecord[]> => {
      const { data, error } = await supabase.from("store_records").select("*").order("id");
      if (error) throw error;
      return (data ?? []) as unknown as PersistedStoreRecord[];
    },
  });
}

export function useStoreSnapshots() {
  return useQuery({
    queryKey: storeKeys.snapshots,
    queryFn: async (): Promise<StoreSnapshotRow[]> => {
      const { data, error } = await supabase.from("store_snapshots").select("*");
      if (error) throw error;
      return (data ?? []) as unknown as StoreSnapshotRow[];
    },
  });
}

export function useSaveStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SaveStorePayload) => {
      const { id, ...rest } = payload;
      const { error: recordError } = await supabase
        .from("store_records")
        .upsert({ id, ...rest }, { onConflict: "id" });
      if (recordError) throw recordError;

      const { error: snapshotError } = await supabase
        .from("store_snapshots")
        .upsert({ storeId: id, ...rest }, { onConflict: "storeId,referenceMonth" });
      if (snapshotError) throw snapshotError;

      return { success: true } as const;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.records });
      queryClient.invalidateQueries({ queryKey: storeKeys.snapshots });
    },
  });
}
