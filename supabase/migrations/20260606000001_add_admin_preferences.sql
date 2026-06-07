-- Create admin_preferences table for admin-only UI state
CREATE TABLE admin_preferences (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  admin_view text NOT NULL DEFAULT 'list'
);

ALTER TABLE admin_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own admin preferences"
  ON admin_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own admin preferences"
  ON admin_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own admin preferences"
  ON admin_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Migrate existing data from user_preferences
INSERT INTO admin_preferences (user_id, admin_view)
SELECT user_id, dashboard_view
FROM user_preferences
ON CONFLICT DO NOTHING;

-- Drop admin columns from user_preferences
ALTER TABLE user_preferences
  DROP COLUMN dashboard_view,
  DROP COLUMN dashboard_tab;
