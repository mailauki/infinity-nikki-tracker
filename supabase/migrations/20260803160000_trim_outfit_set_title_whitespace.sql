-- Trim stray leading/trailing whitespace from outfit_sets titles and subtitles.
--
-- `rippling_serenity-sunset` was authored with a trailing space in its subtitle
-- ("Sunset "), which the evolution-title composition then carried into `title`
-- ("Rippling Serenity: Sunset "). Slugs are generated with toSlug(), which maps
-- spaces to underscores, so the untrimmed value also made the row look like a
-- slug/title mismatch when it was really just whitespace.
--
-- One row is affected today; the update is written to cover any row so a repeat
-- is cleaned up too. The admin actions already .trim() these fields on write,
-- so this only backfills data authored before that.

update public.outfit_sets
set
  title = btrim(title),
  subtitle = btrim(subtitle)
where title is distinct from btrim(title)
   or subtitle is distinct from btrim(subtitle);

-- Titles and subtitles must not carry surrounding whitespace. A CHECK (rather
-- than a trigger) is enough here: nothing in the app writes these fields without
-- trimming, so this is a guard against hand-edited rows and bad imports.
alter table public.outfit_sets
  drop constraint if exists outfit_sets_title_trimmed;

alter table public.outfit_sets
  add constraint outfit_sets_title_trimmed
  check (
    title = btrim(title)
    and (subtitle is null or subtitle = btrim(subtitle))
  );
