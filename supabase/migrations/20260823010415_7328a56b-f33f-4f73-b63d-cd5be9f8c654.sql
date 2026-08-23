ALTER TABLE public.exhibitors ADD COLUMN IF NOT EXISTS created_by uuid;

UPDATE public.exhibitors e
SET created_by = p.id
FROM public.profiles p
WHERE e.created_by IS NULL AND upper(p.initials) = upper(e.created_by_initials);

ALTER TABLE public.exhibitors ALTER COLUMN created_by SET DEFAULT auth.uid();

DROP POLICY IF EXISTS "Authenticated can view exhibitors" ON public.exhibitors;
DROP POLICY IF EXISTS "Authenticated can update exhibitors" ON public.exhibitors;
DROP POLICY IF EXISTS "Authenticated can delete exhibitors" ON public.exhibitors;
DROP POLICY IF EXISTS "Authenticated can add exhibitors" ON public.exhibitors;

CREATE POLICY "View own or admin views all"
ON public.exhibitors FOR SELECT TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Insert own rows"
ON public.exhibitors FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Update own or admin updates all"
ON public.exhibitors FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Delete own or admin deletes all"
ON public.exhibitors FOR DELETE TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));