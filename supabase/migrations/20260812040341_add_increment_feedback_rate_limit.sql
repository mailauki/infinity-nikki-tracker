-- Atomic per-IP, per-window increment. Returns the count AFTER incrementing.
-- A single statement so concurrent requests from one IP cannot both read a
-- stale count and each write the same value, which let callers exceed the cap.
create or replace function public.increment_feedback_rate_limit(
  p_ip_hash text,
  p_window_start timestamptz
)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.feedback_rate_limit (ip_hash, window_start, count)
  values (p_ip_hash, p_window_start, 1)
  on conflict (ip_hash, window_start)
  do update set count = public.feedback_rate_limit.count + 1
  returning count;
$$;

revoke all on function public.increment_feedback_rate_limit(text, timestamptz) from public, anon, authenticated;
