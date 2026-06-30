-- When outfit_set IS NULL (standalone variant pieces), the subquery returns NULL
-- and default would be set to NULL, violating NOT NULL. COALESCE defaults to false.
CREATE OR REPLACE FUNCTION public.enforce_base_variant_default()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."default" := COALESCE(
    (SELECT s."order" = 1 FROM public.outfit_sets s WHERE s.slug = NEW.outfit_set),
    false
  );
  RETURN NEW;
END;
$$;
