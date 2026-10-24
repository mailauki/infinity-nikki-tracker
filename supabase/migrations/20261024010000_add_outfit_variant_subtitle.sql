-- Short name of a standalone glow-up piece (e.g. "Light Pursuer"). The admin
-- manages it from the base piece's form; the glow-up piece's title is composed
-- as "{base piece title}: {subtitle}", the same way outfit_sets.subtitle names
-- an evolution. Null on every other piece.
alter table public.outfit_variants add column subtitle text;
