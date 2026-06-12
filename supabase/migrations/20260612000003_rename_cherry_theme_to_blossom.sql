-- Rename the 'cherry' color theme preset key to 'blossom'.
-- Existing users who selected the Cherry Blossom theme have 'cherry' stored;
-- migrate those rows so they keep their selection after the key rename.
UPDATE user_preferences
SET color_theme = 'blossom'
WHERE color_theme = 'cherry';
