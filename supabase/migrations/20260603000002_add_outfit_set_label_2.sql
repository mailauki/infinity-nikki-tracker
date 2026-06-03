-- supabase/migrations/20260603000002_add_outfit_set_label_2.sql
-- Add a second optional label to outfit_sets (max 2 labels per set)

alter table public.outfit_sets
  add column label_2 text;

alter table public.outfit_sets
  add constraint outfit_sets_label_2_fkey
    foreign key (label_2)
    references public.labels (slug)
    on update cascade;

create index outfit_sets_label_2_idx on public.outfit_sets (label_2);
