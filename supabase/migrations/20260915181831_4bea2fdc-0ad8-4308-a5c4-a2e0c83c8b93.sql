CREATE TABLE public.user_credentials (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_credentials TO authenticated;
GRANT ALL ON public.user_credentials TO service_role;

ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view credentials" ON public.user_credentials
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert credentials" ON public.user_credentials
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update credentials" ON public.user_credentials
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete credentials" ON public.user_credentials
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_user_credentials_updated_at
  BEFORE UPDATE ON public.user_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();