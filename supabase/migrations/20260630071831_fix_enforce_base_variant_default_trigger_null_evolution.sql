CREATE OR REPLACE FUNCTION public.enforce_base_variant_default()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."default" := (NEW."evolution" IS NOT NULL AND NEW."evolution" LIKE '%-base');
  RETURN NEW;
END;
$$;
