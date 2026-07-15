alter table public.user_preferences
  add column if not exists eureka_style text,
  add column if not exists eureka_label text,
  add column if not exists outfit_style_filter text,
  add column if not exists outfit_label_filter text;
