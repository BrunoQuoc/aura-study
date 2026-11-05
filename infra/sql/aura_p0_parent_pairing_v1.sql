-- AURA STUDY / STAGING ONLY: trusted Admin email bootstrap + device pairing.
-- No parent email or bearer token is hardcoded in this public migration.
-- Apply only after migration aura_p0_core_single_learner_v1.
begin;

create table public.aura_admin_email_allowlist (
  email_sha256 text primary key check (email_sha256 ~ '^[0-9a-f]{64}$'),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.aura_admin_email_allowlist enable row level security;
revoke all on public.aura_admin_email_allowlist from public, anon, authenticated;
grant select, insert, update, delete on public.aura_admin_email_allowlist to service_role;

create table public.aura_pairing_requests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.aura_households(id) on delete cascade,
  learner_id uuid not null references public.aura_learners(id) on delete cascade,
  token_sha256 text not null unique check (token_sha256 ~ '^[0-9a-f]{64}$'),
  issued_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  redeemed_by uuid references auth.users(id),
  revoked_at timestamptz,
  check (expires_at > created_at),
  check ((redeemed_at is null) = (redeemed_by is null))
);
create index aura_pairing_household_active_idx
  on public.aura_pairing_requests(household_id, expires_at)
  where redeemed_at is null and revoked_at is null;
alter table public.aura_pairing_requests enable row level security;
revoke all on public.aura_pairing_requests from public, anon, authenticated;
grant select, insert, update, delete on public.aura_pairing_requests to service_role;

-- Only the backend/service_role may invoke this function. It checks the
-- verified Auth identity against a pre-provisioned hash, server side.
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
    on conflict (household_id) do update set household_id = excluded.household_id
    returning id into l;

  household_id := h; learner_id := l;
  return next;
end;
$$;
revoke all on function public.aura_bootstrap_parent(uuid) from public, anon, authenticated;
grant execute on function public.aura_bootstrap_parent(uuid) to service_role;

-- Atomic single-use redeem: lock token, verify anonymous Auth identity,
-- link to the existing ONE learner, and mark token used in one transaction.
create or replace function public.aura_redeem_device_pairing(
  p_token_sha256 text,
  p_auth_uid uuid,
  p_device_label text default 'Thiết bị học'
)
returns table (device_id uuid, learner_id uuid)
language plpgsql security definer set search_path = ''
as $$
declare p record; d uuid;
begin
  if p_token_sha256 is null or p_token_sha256 !~ '^[0-9a-f]{64}$' or
     p_auth_uid is null or not exists (
       select 1 from auth.users u
       where u.id = p_auth_uid and u.is_anonymous is true
     ) then
    raise exception 'Invalid pairing request' using errcode = '42501';
  end if;

  select r.id, r.household_id, r.learner_id into p
    from public.aura_pairing_requests r
   where r.token_sha256 = p_token_sha256
     and r.expires_at > now()
     and r.redeemed_at is null
     and r.revoked_at is null
   for update;
  if not found then
    raise exception 'Invalid or expired pairing code' using errcode = '42501';
  end if;

  if exists (select 1 from public.aura_student_devices
             where auth_uid = p_auth_uid) then
    raise exception 'Device already paired' using errcode = '23505';
  end if;

  if not exists (
    select 1 from public.aura_learners l
     where l.id = p.learner_id and l.household_id = p.household_id
  ) then
    raise exception 'Learner mismatch' using errcode = '42501';
  end if;

  insert into public.aura_student_devices
    (household_id, learner_id, auth_uid, device_label)
    values (p.household_id, p.learner_id, p_auth_uid,
            left(coalesce(nullif(btrim(p_device_label),''),'Thiết bị học'),80))
    returning id into d;

  update public.aura_pairing_requests r set
    redeemed_at = now(), redeemed_by = p_auth_uid
   where r.id = p.id;

  device_id := d; learner_id := p.learner_id;
  return next;
end;
$$;
revoke all on function public.aura_redeem_device_pairing(text,uuid,text)
  from public, anon, authenticated;
grant execute on function public.aura_redeem_device_pairing(text,uuid,text)
  to service_role;

-- A revoked student must not even see their old membership row.
drop policy if exists "aura_authorized_device_read"
  on public.aura_student_devices;
create policy "aura_authorized_device_read"
  on public.aura_student_devices for select to authenticated
  using (
    (auth_uid = (select auth.uid()) and revoked_at is null)
    or exists (
      select 1 from public.aura_households h
      where h.id = household_id and h.admin_uid = (select auth.uid())
    )
  );
commit;
