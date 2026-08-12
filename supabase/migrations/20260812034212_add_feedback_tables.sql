-- Feedback submissions: feature requests and issue reports.
-- All writes go through the API route with the service-role key; no client
-- role gets INSERT, which keeps validation and rate limiting on one path.
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('feature', 'issue')),
  category text not null,
  title text not null check (char_length(title) between 1 and 200),
  description text not null check (char_length(description) between 1 and 5000),
  email text,
  -- SET NULL, not CASCADE: a bug report stays useful after the reporter
  -- deletes their account.
  user_id uuid references auth.users (id) on delete set null,
  page_path text,
  entity_type text,
  entity_slug text,
  entity_title text,
  user_agent text,
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'resolved', 'declined')),
  admin_notes text,
  -- Reserved for the deferred email receipt; nothing writes it yet.
  receipt_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index feedback_status_created_idx on public.feedback (status, created_at desc);
create index feedback_type_idx on public.feedback (type);

create table public.feedback_images (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback (id) on delete cascade,
  path text not null,
  created_at timestamptz not null default now()
);

create index feedback_images_feedback_id_idx on public.feedback_images (feedback_id);

-- Windowed per-IP counter. A DB table rather than an in-memory map because
-- Fluid Compute reuses instances unpredictably, so an in-memory counter
-- under-counts whenever a request lands on a fresh instance.
-- ip_hash is a salted digest, never a raw address.
create table public.feedback_rate_limit (
  ip_hash text not null,
  window_start timestamptz not null,
  count integer not null default 1,
  primary key (ip_hash, window_start)
);

create index feedback_rate_limit_window_idx on public.feedback_rate_limit (window_start);

alter table public.feedback enable row level security;
alter table public.feedback_images enable row level security;
alter table public.feedback_rate_limit enable row level security;

-- Admin-only read/update. No INSERT policy for any client role: the service
-- role bypasses RLS and is the only writer.
create policy "Admins can read feedback"
  on public.feedback for select
  using ((select public.is_admin()));

create policy "Admins can update feedback"
  on public.feedback for update
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can delete feedback"
  on public.feedback for delete
  using ((select public.is_admin()));

create policy "Admins can read feedback images"
  on public.feedback_images for select
  using ((select public.is_admin()));

-- feedback_rate_limit intentionally has RLS enabled and NO policies:
-- only the service role touches it.

-- Private bucket: screenshots can show a user's account, collection, or email.
insert into storage.buckets (id, name, public)
values ('feedback', 'feedback', false)
on conflict (id) do nothing;

create policy "Admins can read feedback screenshots"
  on storage.objects for select
  using (bucket_id = 'feedback' and (select public.is_admin()));

-- public.set_updated_at() already exists (see
-- 20260701041214_add_updated_at_triggers.sql); reuse it rather than
-- redefining it here.
create trigger trg_feedback_updated_at
  before update on public.feedback
  for each row execute function public.set_updated_at();
