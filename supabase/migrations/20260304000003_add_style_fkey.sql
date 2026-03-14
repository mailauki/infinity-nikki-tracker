DO $$ BEGIN
  ALTER TABLE styles ADD CONSTRAINT styles_title_key UNIQUE (title);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE eureka_sets
    ADD CONSTRAINT eureka_sets_style_fkey
    FOREIGN KEY (style)
    REFERENCES styles(title)
    ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
