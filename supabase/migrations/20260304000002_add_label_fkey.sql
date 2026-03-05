ALTER TABLE labels
  ADD CONSTRAINT labels_title_key UNIQUE (title);

ALTER TABLE eureka_sets
  ADD CONSTRAINT eureka_sets_label_fkey
  FOREIGN KEY (label)
  REFERENCES labels(title)
  ON UPDATE CASCADE;
