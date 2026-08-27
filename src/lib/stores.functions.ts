import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const numberField = z.number().finite();

const storePayloadSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().min(1).max(160),
  city: z.string().max(120),
  status: z.enum(["Ativa", "Em revisão"]),
  referenceMonth: z.string().min(1).max(60),
  grossSales: numberField,
  orders: z.number().int(),
  newCustomers: z.number().int(),
  promoSales: numberField,
  promoOrders: z.number().int(),
  promoTicket: numberField,
  promoNewCustomers: z.number().int(),
  recoveredCustomers: z.number().int(),
  storePromoInvestment: numberField,
  ifoodPromoInvestment: numberField,
  promoReturn: numberField,
  roas: numberField,
  adSales: numberField,
  adTicket: numberField,
  adOrders: z.number().int(),
  adNewCustomers: z.number().int(),
  cac: numberField,
  adVisits: z.number().int(),
  conversion: numberField,
  adInvestment: numberField,
  costPerOrder: numberField,
  cmv: numberField,
  productsJson: z.string().max(200_000),
});

export type StorePayload = z.infer<typeof storePayloadSchema>;

export const listStoreRecords = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("store_records").select("*").order("id");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listStoreSnapshots = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("store_snapshots").select("*");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const saveStoreRecord = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => storePayloadSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;

    const { error: recordError } = await supabaseAdmin
      .from("store_records")
      .upsert({ id, ...rest }, { onConflict: "id" });
    if (recordError) throw new Error(recordError.message);

    const { error: snapshotError } = await supabaseAdmin
      .from("store_snapshots")
      .upsert({ storeId: id, ...rest }, { onConflict: "storeId,referenceMonth" });
    if (snapshotError) throw new Error(snapshotError.message);

    return { success: true } as const;
  });
