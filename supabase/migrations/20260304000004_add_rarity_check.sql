DO $$ BEGIN
  ALTER TABLE eureka_sets
    ADD CONSTRAINT eureka_sets_rarity_check CHECK (rarity BETWEEN 2 AND 5);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
