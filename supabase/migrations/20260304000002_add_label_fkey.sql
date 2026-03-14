DO $$ BEGIN
  ALTER TABLE labels ADD CONSTRAINT labels_title_key UNIQUE (title);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE eureka_sets
    ADD CONSTRAINT eureka_sets_label_fkey
    FOREIGN KEY (label)
    REFERENCES labels(title)
    ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
