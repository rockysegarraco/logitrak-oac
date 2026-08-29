DROP POLICY IF EXISTS "Update own or admin updates all" ON public.exhibitors;
DROP POLICY IF EXISTS "Delete own or admin deletes all" ON public.exhibitors;

CREATE POLICY "Authenticated can update exhibitors"
ON public.exhibitors FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete exhibitors"
ON public.exhibitors FOR DELETE TO authenticated
USING (true);