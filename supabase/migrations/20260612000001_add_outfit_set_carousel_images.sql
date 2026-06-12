-- Create carousel images table for outfit sets
CREATE TABLE public.outfit_set_carousel_images (
  id          bigserial    NOT NULL,
  outfit_set  text         NOT NULL,
  image_url   text         NOT NULL,
  sort_order  integer      NOT NULL DEFAULT 0,
  created_at  timestamptz  DEFAULT now(),
  CONSTRAINT outfit_set_carousel_images_pkey PRIMARY KEY (id),
  CONSTRAINT outfit_set_carousel_images_outfit_set_fkey
    FOREIGN KEY (outfit_set) REFERENCES public.outfit_sets(slug)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX outfit_set_carousel_images_outfit_set_idx
  ON public.outfit_set_carousel_images (outfit_set, sort_order);

-- Migrate existing poster images into the carousel table as sort_order = 0
INSERT INTO public.outfit_set_carousel_images (outfit_set, image_url, sort_order)
SELECT slug, poster_image_url, 0
FROM public.outfit_sets
WHERE poster_image_url IS NOT NULL;

-- RLS: public read, admin write
ALTER TABLE public.outfit_set_carousel_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY outfit_set_carousel_images_read ON public.outfit_set_carousel_images
  FOR SELECT USING (true);

CREATE POLICY outfit_set_carousel_images_admin_write ON public.outfit_set_carousel_images
  FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- Drop the now-superseded column
ALTER TABLE public.outfit_sets DROP COLUMN poster_image_url;
