ALTER TABLE public.outfit_variants
  ADD COLUMN IF NOT EXISTS rarity integer,
  ADD COLUMN IF NOT EXISTS style text,
  ADD COLUMN IF NOT EXISTS label text,
  ADD COLUMN IF NOT EXISTS label_2 text;

DO $$ BEGIN
  ALTER TABLE public.outfit_variants
    ADD CONSTRAINT outfit_variants_style_fkey
    FOREIGN KEY (style) REFERENCES public.styles (slug) ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.outfit_variants
    ADD CONSTRAINT outfit_variants_label_fkey
    FOREIGN KEY (label) REFERENCES public.labels (slug) ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.outfit_variants
    ADD CONSTRAINT outfit_variants_label_2_fkey
    FOREIGN KEY (label_2) REFERENCES public.labels (slug) ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
