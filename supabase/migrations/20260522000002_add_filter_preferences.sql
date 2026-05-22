ALTER TABLE user_preferences
  ADD COLUMN dashboard_tab text NOT NULL DEFAULT 'eureka-sets'
    CHECK (dashboard_tab IN ('eureka-sets', 'eureka-variants', 'trials')),
  ADD COLUMN eureka_set_filter text,
  ADD COLUMN eureka_category text,
  ADD COLUMN eureka_obtained_filter text
    CHECK (eureka_obtained_filter IN ('obtained', 'missing')),
  ADD COLUMN eureka_color text,
  ADD COLUMN eureka_rarity text;
