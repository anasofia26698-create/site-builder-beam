DROP POLICY IF EXISTS "Public can manage store records" ON public.store_records;
DROP POLICY IF EXISTS "Public can manage store snapshots" ON public.store_snapshots;

REVOKE ALL ON public.store_records FROM anon, authenticated;
REVOKE ALL ON public.store_snapshots FROM anon, authenticated;

GRANT ALL ON public.store_records TO service_role;
GRANT ALL ON public.store_snapshots TO service_role;

ALTER TABLE public.store_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_snapshots ENABLE ROW LEVEL SECURITY;