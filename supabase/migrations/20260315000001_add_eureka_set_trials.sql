-- Junction table: eureka_sets ↔ trials (many-to-many)
CREATE TABLE IF NOT EXISTS public.eureka_set_trials (
  eureka_set text NOT NULL REFERENCES public.eureka_sets(slug) ON UPDATE CASCADE ON DELETE CASCADE,
  trial      text NOT NULL REFERENCES public.trials(slug)      ON UPDATE CASCADE ON DELETE CASCADE,
  PRIMARY KEY (eureka_set, trial)
);

-- Backfill from the existing single-trial column
INSERT INTO public.eureka_set_trials (eureka_set, trial)
SELECT slug, trial
FROM public.eureka_sets
WHERE trial IS NOT NULL
ON CONFLICT DO NOTHING;

-- RLS: same pattern as eureka_sets (public read, admin write)
ALTER TABLE public.eureka_set_trials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eureka_set_trials_read"
  ON public.eureka_set_trials FOR SELECT USING (true);

CREATE POLICY "eureka_set_trials_admin_write"
  ON public.eureka_set_trials TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- Index for reverse lookup (trial → sets)
CREATE INDEX IF NOT EXISTS eureka_set_trials_trial_idx
  ON public.eureka_set_trials (trial);
