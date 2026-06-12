-- Create carousel images table for evolutions
CREATE TABLE public.evolution_carousel_images (
  id          bigserial    NOT NULL,
  evolution   text         NOT NULL,
  image_url   text         NOT NULL,
  sort_order  integer      NOT NULL DEFAULT 0,
  created_at  timestamptz  DEFAULT now(),
  CONSTRAINT evolution_carousel_images_pkey PRIMARY KEY (id),
  CONSTRAINT evolution_carousel_images_evolution_fkey
    FOREIGN KEY (evolution) REFERENCES public.evolutions(slug)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX evolution_carousel_images_evolution_idx
  ON public.evolution_carousel_images (evolution, sort_order);

ALTER TABLE public.evolution_carousel_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY evolution_carousel_images_read ON public.evolution_carousel_images
  FOR SELECT USING (true);

CREATE POLICY evolution_carousel_images_admin_write ON public.evolution_carousel_images
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));
