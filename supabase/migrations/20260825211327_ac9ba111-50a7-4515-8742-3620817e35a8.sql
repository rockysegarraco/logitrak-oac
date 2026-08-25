CREATE TABLE public.exhibitor_directory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_by uuid DEFAULT auth.uid(),
  created_by_initials text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX exhibitor_directory_name_key ON public.exhibitor_directory (upper(name));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exhibitor_directory TO authenticated;
GRANT ALL ON public.exhibitor_directory TO service_role;

ALTER TABLE public.exhibitor_directory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view directory"
  ON public.exhibitor_directory FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can add directory entries"
  ON public.exhibitor_directory FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Update own directory entries or admin"
  ON public.exhibitor_directory FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Delete own directory entries or admin"
  ON public.exhibitor_directory FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_exhibitor_directory_updated_at
  BEFORE UPDATE ON public.exhibitor_directory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
