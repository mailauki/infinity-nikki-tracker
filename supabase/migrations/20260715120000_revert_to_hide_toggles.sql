-- Revert evolution show-toggles back to hide-toggles. Base is not persisted (no
-- base toggle); it is always shown. Defaults false = nothing hidden = same
-- visible default as the all-true show columns being dropped.
alter table public.user_preferences
  add column if not exists outfit_hide_evolutions boolean not null default false,
  add column if not exists outfit_hide_glowups boolean not null default false;

alter table public.user_preferences
  drop column if exists outfit_show_base,
  drop column if exists outfit_show_evolutions,
  drop column if exists outfit_show_glowups;
