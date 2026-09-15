CREATE POLICY "Admins can add profiles"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can add roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT INSERT ON public.profiles TO authenticated;
GRANT INSERT ON public.user_roles TO authenticated;