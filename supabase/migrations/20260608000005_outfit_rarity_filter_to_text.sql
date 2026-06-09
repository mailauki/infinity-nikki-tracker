ALTER TABLE user_preferences
  ALTER COLUMN outfit_rarity_filter TYPE text USING outfit_rarity_filter::text;
