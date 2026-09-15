CREATE OR REPLACE FUNCTION public.is_app_member()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
$$;

REVOKE ALL ON FUNCTION public.is_app_member() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_app_member() TO authenticated, service_role;

DROP POLICY IF EXISTS "Authenticated can view exhibitors" ON public.exhibitors;
DROP POLICY IF EXISTS "Authenticated can update exhibitors" ON public.exhibitors;
DROP POLICY IF EXISTS "Authenticated can delete exhibitors" ON public.exhibitors;
DROP POLICY IF EXISTS "Authenticated can insert exhibitors" ON public.exhibitors;
DROP POLICY IF EXISTS "Users can insert own exhibitors" ON public.exhibitors;

CREATE POLICY "Members can view exhibitors" ON public.exhibitors
  FOR SELECT TO authenticated USING (public.is_app_member());
CREATE POLICY "Members can insert exhibitors" ON public.exhibitors
  FOR INSERT TO authenticated WITH CHECK (public.is_app_member() AND created_by = auth.uid());
CREATE POLICY "Members can update exhibitors" ON public.exhibitors
  FOR UPDATE TO authenticated USING (public.is_app_member()) WITH CHECK (public.is_app_member());
CREATE POLICY "Members can delete exhibitors" ON public.exhibitors
  FOR DELETE TO authenticated USING (public.is_app_member());