DROP POLICY IF EXISTS "Update own directory entries or admin" ON public.exhibitor_directory;
DROP POLICY IF EXISTS "Delete own directory entries or admin" ON public.exhibitor_directory;

CREATE POLICY "Authenticated can update directory entries"
  ON public.exhibitor_directory FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete directory entries"
  ON public.exhibitor_directory FOR DELETE TO authenticated
  USING (true);