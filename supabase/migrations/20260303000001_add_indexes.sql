-- Index obtained_eureka.user_id: used on every authenticated page load
create index if not exists obtained_user_id_idx on obtained_eureka (user_id);

-- Unique composite index on obtained_eureka: covers the specific item lookup in handleObtained()
-- and enforces no duplicate collection entries
create unique index if not exists obtained_unique_item_idx
  on obtained_eureka (user_id, eureka_set, category, color);

-- Slug indexes: used for single-row lookups in detail + admin edit pages
create index if not exists eureka_sets_slug_idx on eureka_sets (slug);
create index if not exists eureka_variants_slug_idx on eureka_variants (slug);
create index if not exists trials_slug_idx on trials (slug);

-- FK join column: Postgres does not auto-index foreign keys
create index if not exists eureka_variants_eureka_set_idx on eureka_variants (eureka_set);
