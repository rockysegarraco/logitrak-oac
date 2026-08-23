ALTER TABLE public.exhibitors
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';

ALTER TABLE public.exhibitors
  ADD CONSTRAINT exhibitors_status_check CHECK (status IN ('draft','submitted','approved'));

CREATE TABLE IF NOT EXISTS public.exhibitor_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibitor_id uuid,
  exhibitor_name text NOT NULL DEFAULT '',
  action text NOT NULL,
  actor_id uuid,
  actor_initials text NOT NULL DEFAULT '',
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.exhibitor_audit TO authenticated;
GRANT ALL ON public.exhibitor_audit TO service_role;

ALTER TABLE public.exhibitor_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
ON public.exhibitor_audit FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS exhibitor_audit_created_at_idx ON public.exhibitor_audit (created_at DESC);

CREATE OR REPLACE FUNCTION public.log_exhibitor_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_initials text;
  v_changes jsonb := '{}'::jsonb;
  v_key text;
  v_old jsonb;
  v_new jsonb;
BEGIN
  SELECT initials INTO v_initials FROM public.profiles WHERE id = auth.uid();

  IF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    FOR v_key IN SELECT jsonb_object_keys(v_new) LOOP
      IF v_key NOT IN ('updated_at','created_at') AND v_new -> v_key IS DISTINCT FROM v_old -> v_key THEN
        v_changes := v_changes || jsonb_build_object(v_key, jsonb_build_object('from', v_old -> v_key, 'to', v_new -> v_key));
      END IF;
    END LOOP;
    IF v_changes = '{}'::jsonb THEN
      RETURN NEW;
    END IF;
  END IF;

  INSERT INTO public.exhibitor_audit (exhibitor_id, exhibitor_name, action, actor_id, actor_initials, changes)
  VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.exhibitor_name, OLD.exhibitor_name, ''),
    lower(TG_OP),
    auth.uid(),
    COALESCE(v_initials, ''),
    v_changes
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.log_exhibitor_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS exhibitors_audit_ins ON public.exhibitors;
CREATE TRIGGER exhibitors_audit_ins
AFTER INSERT ON public.exhibitors
FOR EACH ROW EXECUTE FUNCTION public.log_exhibitor_change();

DROP TRIGGER IF EXISTS exhibitors_audit_upd ON public.exhibitors;
CREATE TRIGGER exhibitors_audit_upd
AFTER UPDATE ON public.exhibitors
FOR EACH ROW EXECUTE FUNCTION public.log_exhibitor_change();

DROP TRIGGER IF EXISTS exhibitors_audit_del ON public.exhibitors;
CREATE TRIGGER exhibitors_audit_del
AFTER DELETE ON public.exhibitors
FOR EACH ROW EXECUTE FUNCTION public.log_exhibitor_change();