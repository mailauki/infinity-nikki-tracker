-- When evolution IS NULL (standalone variant pieces with no outfit set),
-- NULL LIKE '%-base' evaluates to NULL, which violated the NOT NULL constraint.
-- Fix: treat NULL evolution as non-base (default = false).
CREATE OR REPLACE FUNCTION public.enforce_base_variant_default()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."default" := (NEW."evolution" IS NOT NULL AND NEW."evolution" LIKE '%-base');
  RETURN NEW;
END;
$$;
