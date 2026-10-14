CREATE TABLE public.shipment_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibitor_id uuid NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_by_initials text NOT NULL DEFAULT '',
  raw_text text NOT NULL,
  current_status text NOT NULL DEFAULT '',
  key_events jsonb NOT NULL DEFAULT '[]'::jsonb,
  follow_ups jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX shipment_updates_exhibitor_idx ON public.shipment_updates(exhibitor_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.shipment_updates TO authenticated;
GRANT ALL ON public.shipment_updates TO service_role;
ALTER TABLE public.shipment_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View updates for visible shipments" ON public.shipment_updates FOR SELECT TO authenticated
  USING (public.is_app_member() AND EXISTS (SELECT 1 FROM public.exhibitors e WHERE e.id = exhibitor_id));
CREATE POLICY "Add updates to visible shipments" ON public.shipment_updates FOR INSERT TO authenticated
  WITH CHECK (public.is_app_member() AND created_by = auth.uid() AND EXISTS (SELECT 1 FROM public.exhibitors e WHERE e.id = exhibitor_id));
CREATE POLICY "Owners or admins delete updates" ON public.shipment_updates FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));