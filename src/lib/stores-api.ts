import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PersistedStoreRecord } from "@/lib/dashboard-data";
import { listStoreRecords, listStoreSnapshots, saveStoreRecord } from "@/lib/stores.functions";

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
    queryFn: async (): Promise<PersistedStoreRecord[]> =>
      (await listStoreRecords()) as unknown as PersistedStoreRecord[],
  });
}

export function useStoreSnapshots() {
  return useQuery({
    queryKey: storeKeys.snapshots,
    queryFn: async (): Promise<StoreSnapshotRow[]> =>
      (await listStoreSnapshots()) as unknown as StoreSnapshotRow[],
  });
}

export function useSaveStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SaveStorePayload) => saveStoreRecord({ data: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.records });
      queryClient.invalidateQueries({ queryKey: storeKeys.snapshots });
    },
  });
}
