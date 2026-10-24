-- A standalone 4★/5★ piece can have a glow-up of its own. Sets model glow-ups
-- as an order-0 outfit_sets row, but a standalone piece has no set to hang one
-- on, so the glow-up piece instead points at its base piece directly.
--
-- ON UPDATE CASCADE: a recategorize rewrites the base piece's slug, and the
-- link must follow it. ON DELETE SET NULL: deleting the base leaves the
-- glow-up as an ordinary piece rather than deleting it.

alter table public.outfit_variants
  add column glowup_of text
    references public.outfit_variants (slug) on update cascade on delete set null,
  add constraint outfit_variants_glowup_of_not_self check (glowup_of <> slug);

create index outfit_variants_glowup_of_idx on public.outfit_variants (glowup_of);
