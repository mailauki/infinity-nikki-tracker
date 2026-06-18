-- Base variants (those whose evolution is a set's "-base" evolution) must have
-- default = true; all other variants default = false. App code already derives
-- this on create/edit, but data had drifted (e.g. froggy_fashion-base rows were
-- false). This migration corrects existing rows and adds a trigger so the rule
-- holds for every future write regardless of source (app, manual SQL, imports).
--
-- Invariant verified at write time: base evolution <=> slug ends in '-base'
-- (held across all 266 base evolutions with zero exceptions).

-- 1. Correct existing rows.
update public.outfit_variants
set    "default" = ("evolution" like '%-base')
where  "default" is distinct from ("evolution" like '%-base');

-- 2. Enforce the rule on every insert/update. We normalize (force the correct
--    value) rather than reject, so callers never have to compute it themselves.
create or replace function public.enforce_base_variant_default()
returns trigger
language plpgsql
as $$
begin
  new."default" := (new."evolution" like '%-base');
  return new;
end;
$$;

drop trigger if exists trg_enforce_base_variant_default on public.outfit_variants;

create trigger trg_enforce_base_variant_default
  before insert or update of "evolution", "default"
  on public.outfit_variants
  for each row
  execute function public.enforce_base_variant_default();
