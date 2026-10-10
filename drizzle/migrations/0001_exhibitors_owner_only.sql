DROP POLICY IF EXISTS "Authenticated can view all exhibitors" ON public.exhibitors;
DROP POLICY IF EXISTS "Members can view exhibitors" ON public.exhibitors;
DROP POLICY IF EXISTS "Members can update exhibitors" ON public.exhibitors;
DROP POLICY IF EXISTS "Members can delete exhibitors" ON public.exhibitors;
CREATE POLICY "Owners or admins can view exhibitors" ON public.exhibitors FOR SELECT TO authenticated
  USING (is_app_member() AND (created_by = auth.uid() OR has_role(auth.uid(), 'admin')));
CREATE POLICY "Owners or admins can update exhibitors" ON public.exhibitors FOR UPDATE TO authenticated
  USING (is_app_member() AND (created_by = auth.uid() OR has_role(auth.uid(), 'admin')))
  WITH CHECK (is_app_member() AND (created_by = auth.uid() OR has_role(auth.uid(), 'admin')));
CREATE POLICY "Owners or admins can delete exhibitors" ON public.exhibitors FOR DELETE TO authenticated
  USING (is_app_member() AND (created_by = auth.uid() OR has_role(auth.uid(), 'admin')));