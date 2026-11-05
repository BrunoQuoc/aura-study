-- AURA STUDY STAGING hotfix: avoid PL/pgSQL RETURNS TABLE output name
-- household_id shadowing the INSERT ... ON CONFLICT column reference.
-- The approved admin allowlist, verified Auth checks, and private grants stay unchanged.
begin;
create or replace function public.aura_bootstrap_parent(p_admin_uid uuid)
returns table (household_id uuid, learner_id uuid)
language plpgsql security definer set search_path = ''
as $$
declare h uuid; l uuid;
begin
  if p_admin_uid is null or not exists (
    select 1 from auth.users u
    join public.aura_admin_email_allowlist a
      on a.email_sha256 = encode(sha256(convert_to(lower(btrim(u.email)), 'UTF8')), 'hex')
     and a.enabled
    where u.id = p_admin_uid
      and u.email_confirmed_at is not null
      and u.is_anonymous is false
  ) then
    raise exception 'Admin identity not verified or not allowed'
      using errcode = '42501';
  end if;

  insert into public.aura_households(admin_uid) values (p_admin_uid)
    on conflict (admin_uid) do update set admin_uid = excluded.admin_uid
    returning id into h;

  insert into public.aura_learners(household_id, display_name)
    values (h, 'Học sinh')
    on conflict on constraint aura_learners_household_id_key
      do update set household_id = excluded.household_id
    returning id into l;

  household_id := h; learner_id := l;
  return next;
end;
$$;

revoke all on function public.aura_bootstrap_parent(uuid) from public, anon, authenticated;
grant execute on function public.aura_bootstrap_parent(uuid) to service_role;
commit;
