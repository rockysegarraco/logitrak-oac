ALTER TABLE public.exhibitors ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;
CREATE POLICY "Members read attachments" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'exhibitor-attachments' AND public.is_app_member());
CREATE POLICY "Members upload attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'exhibitor-attachments' AND public.is_app_member());
CREATE POLICY "Members delete attachments" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'exhibitor-attachments' AND public.is_app_member());