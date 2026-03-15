-- Drop the legacy trial column now that all data lives in eureka_set_trials
ALTER TABLE public.eureka_sets
  DROP CONSTRAINT IF EXISTS eureka_sets_trial_fkey,
  DROP COLUMN IF EXISTS trial;
