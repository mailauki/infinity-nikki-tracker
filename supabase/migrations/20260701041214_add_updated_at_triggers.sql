-- Maintain updated_at on every UPDATE, regardless of which code path writes the
-- row (set form, variant form, image upload, direct SQL). No table had a default
-- or trigger, so updated_at was always null.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'outfit_sets','outfit_variants','eureka_sets','eureka_variants','trials','custom_looks'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t
    );
  END LOOP;
END;
$$;
