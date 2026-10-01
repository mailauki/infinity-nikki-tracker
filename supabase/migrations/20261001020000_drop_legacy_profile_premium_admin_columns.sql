-- Drop the profiles columns replaced by user_premium and admins.
--
-- Separate from the two migrations that created those tables so they could go
-- live before the code that reads them: the previously deployed code still
-- selected these columns. Apply only once that code is gone.

-- The old Stripe webhook wrote profiles.is_premium; catch any purchase made
-- between the first migration and this one.
insert into public.user_premium (user_id, purchased_at)
select id, coalesce(premium_purchased_at, now())
from public.profiles
where is_premium
on conflict (user_id) do nothing;

alter table public.profiles
  drop column is_premium,
  drop column premium_purchased_at,
  drop column role;
