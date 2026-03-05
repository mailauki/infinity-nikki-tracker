DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'eureka_sets'::regclass
      AND contype = 'c'
      AND conname ILIKE '%rarity%'
  LOOP
    EXECUTE 'ALTER TABLE eureka_sets DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;
END;
$$;

ALTER TABLE eureka_sets
  ADD CONSTRAINT eureka_sets_rarity_check CHECK (rarity BETWEEN 2 AND 5);
