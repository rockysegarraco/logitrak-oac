UPDATE public.exhibitors e
SET show_name = d.name
FROM public.exhibitor_directory d
WHERE upper(e.show_name) <> upper(d.name)
  AND upper(d.name) LIKE upper(e.show_name) || '%'
  AND NOT EXISTS (
    SELECT 1 FROM public.exhibitor_directory d2 WHERE upper(d2.name) = upper(e.show_name)
  );