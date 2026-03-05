-- Atomic toggle for obtained items: deletes if exists, inserts if not.
-- Using security definer so the function runs as owner and auth.uid() is
-- evaluated once, avoiding the per-row overhead of direct RLS checks.
create or replace function toggle_obtained(
  p_eureka_set text,
  p_category   text,
  p_color      text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.obtained
  where user_id    = (select auth.uid())
    and eureka_set = p_eureka_set
    and category   = p_category
    and color      = p_color;

  if not found then
    insert into public.obtained (user_id, eureka_set, category, color)
    values ((select auth.uid()), p_eureka_set, p_category, p_color);
  end if;
end;
$$;
