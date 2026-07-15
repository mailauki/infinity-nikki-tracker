alter table public.user_preferences
  add column if not exists outfit_show_base boolean not null default true,
  add column if not exists outfit_show_evolutions boolean not null default true,
  add column if not exists outfit_show_glowups boolean not null default true;

alter table public.user_preferences
  drop column if exists outfit_hide_evolutions,
  drop column if exists outfit_hide_glowups;
