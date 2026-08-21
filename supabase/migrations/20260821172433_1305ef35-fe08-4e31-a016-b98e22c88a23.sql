CREATE TABLE public.exhibitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exhibitor_name TEXT NOT NULL,
  booth_number TEXT NOT NULL DEFAULT '',
  paf_in_files TEXT NOT NULL DEFAULT '',
  request_for_paf_sent TEXT NOT NULL DEFAULT '',
  on_time_quote_sent TEXT NOT NULL DEFAULT '',
  on_time_charges_processed TEXT NOT NULL DEFAULT '',
  late_fee_quote_sent TEXT NOT NULL DEFAULT '',
  receiver_numbers_on_time TEXT NOT NULL DEFAULT '',
  receiver_numbers_late TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exhibitors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exhibitors TO authenticated;
GRANT ALL ON public.exhibitors TO service_role;

ALTER TABLE public.exhibitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exhibitors" ON public.exhibitors FOR SELECT USING (true);
CREATE POLICY "Anyone can add exhibitors" ON public.exhibitors FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update exhibitors" ON public.exhibitors FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete exhibitors" ON public.exhibitors FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_exhibitors_updated_at
BEFORE UPDATE ON public.exhibitors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();