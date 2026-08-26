ALTER TABLE public.exhibitors ADD COLUMN show_name text NOT NULL DEFAULT '';
UPDATE public.exhibitors SET show_name = exhibitor_name, exhibitor_name = '';
ALTER TABLE public.exhibitors ALTER COLUMN exhibitor_name SET DEFAULT '';