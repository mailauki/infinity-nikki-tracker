-- Index FK columns on eureka_sets that lack indexes.
-- Postgres does not auto-index foreign keys; these are needed for
-- efficient ON UPDATE CASCADE when labels/styles/trials titles are renamed.
create index if not exists eureka_sets_label_idx on eureka_sets (label);
create index if not exists eureka_sets_style_idx on eureka_sets (style);
create index if not exists eureka_sets_trial_idx on eureka_sets (trial);
