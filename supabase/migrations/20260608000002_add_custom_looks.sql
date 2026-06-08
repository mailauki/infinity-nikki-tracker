-- Create custom_looks table
CREATE TABLE custom_looks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  eureka_variant_slugs text[] NOT NULL DEFAULT '{}',
  outfit_variant_slugs text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz
);

ALTER TABLE custom_looks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own looks"
  ON custom_looks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own looks"
  ON custom_looks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own looks"
  ON custom_looks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own looks"
  ON custom_looks FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX custom_looks_user_id_idx ON custom_looks (user_id);
