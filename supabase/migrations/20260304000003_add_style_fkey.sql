ALTER TABLE styles
  ADD CONSTRAINT styles_title_key UNIQUE (title);

ALTER TABLE eureka_sets
  ADD CONSTRAINT eureka_sets_style_fkey
  FOREIGN KEY (style)
  REFERENCES styles(title)
  ON UPDATE CASCADE;
