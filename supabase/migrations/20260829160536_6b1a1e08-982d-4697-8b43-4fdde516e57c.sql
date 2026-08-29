DROP POLICY IF EXISTS "View own or admin views all" ON public.exhibitors;
CREATE POLICY "Authenticated can view all exhibitors"
  ON public.exhibitors FOR SELECT
  TO authenticated
  USING (true);