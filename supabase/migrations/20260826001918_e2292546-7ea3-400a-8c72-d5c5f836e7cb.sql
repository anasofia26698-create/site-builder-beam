CREATE TABLE public.store_records (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Ativa',
  "referenceMonth" text NOT NULL DEFAULT '',
  "grossSales" numeric NOT NULL DEFAULT 0,
  orders integer NOT NULL DEFAULT 0,
  "newCustomers" integer NOT NULL DEFAULT 0,
  "promoSales" numeric NOT NULL DEFAULT 0,
  "promoOrders" integer NOT NULL DEFAULT 0,
  "promoTicket" numeric NOT NULL DEFAULT 0,
  "promoNewCustomers" integer NOT NULL DEFAULT 0,
  "recoveredCustomers" integer NOT NULL DEFAULT 0,
  "storePromoInvestment" numeric NOT NULL DEFAULT 0,
  "ifoodPromoInvestment" numeric NOT NULL DEFAULT 0,
  "promoReturn" numeric NOT NULL DEFAULT 0,
  roas numeric NOT NULL DEFAULT 0,
  "adSales" numeric NOT NULL DEFAULT 0,
  "adTicket" numeric NOT NULL DEFAULT 0,
  "adOrders" integer NOT NULL DEFAULT 0,
  "adNewCustomers" integer NOT NULL DEFAULT 0,
  cac numeric NOT NULL DEFAULT 0,
  "adVisits" integer NOT NULL DEFAULT 0,
  conversion numeric NOT NULL DEFAULT 0,
  "adInvestment" numeric NOT NULL DEFAULT 0,
  "costPerOrder" numeric NOT NULL DEFAULT 0,
  cmv numeric NOT NULL DEFAULT 0,
  "productsJson" text NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.store_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "storeId" text NOT NULL,
  "referenceMonth" text NOT NULL,
  name text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Ativa',
  "grossSales" numeric NOT NULL DEFAULT 0,
  orders integer NOT NULL DEFAULT 0,
  "newCustomers" integer NOT NULL DEFAULT 0,
  "promoSales" numeric NOT NULL DEFAULT 0,
  "promoOrders" integer NOT NULL DEFAULT 0,
  "promoTicket" numeric NOT NULL DEFAULT 0,
  "promoNewCustomers" integer NOT NULL DEFAULT 0,
  "recoveredCustomers" integer NOT NULL DEFAULT 0,
  "storePromoInvestment" numeric NOT NULL DEFAULT 0,
  "ifoodPromoInvestment" numeric NOT NULL DEFAULT 0,
  "promoReturn" numeric NOT NULL DEFAULT 0,
  roas numeric NOT NULL DEFAULT 0,
  "adSales" numeric NOT NULL DEFAULT 0,
  "adTicket" numeric NOT NULL DEFAULT 0,
  "adOrders" integer NOT NULL DEFAULT 0,
  "adNewCustomers" integer NOT NULL DEFAULT 0,
  cac numeric NOT NULL DEFAULT 0,
  "adVisits" integer NOT NULL DEFAULT 0,
  conversion numeric NOT NULL DEFAULT 0,
  "adInvestment" numeric NOT NULL DEFAULT 0,
  "costPerOrder" numeric NOT NULL DEFAULT 0,
  cmv numeric NOT NULL DEFAULT 0,
  "productsJson" text NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("storeId", "referenceMonth")
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_records TO anon, authenticated;
GRANT ALL ON public.store_records TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_snapshots TO anon, authenticated;
GRANT ALL ON public.store_snapshots TO service_role;

ALTER TABLE public.store_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can manage store records" ON public.store_records FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public can manage store snapshots" ON public.store_snapshots FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_store_records_updated_at BEFORE UPDATE ON public.store_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_store_snapshots_updated_at BEFORE UPDATE ON public.store_snapshots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();