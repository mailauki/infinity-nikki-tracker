-- Add premium fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_purchased_at timestamptz;

-- Add color_theme to user_preferences
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS color_theme text NOT NULL DEFAULT 'default';
