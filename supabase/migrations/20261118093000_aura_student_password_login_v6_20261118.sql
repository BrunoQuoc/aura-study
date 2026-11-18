-- AURA STUDY V6 — Admin creates username/password; Student logs in directly.
-- No activation links, browser PINs or client-service keys.
-- Passwords live ONLY in Supabase Auth (GoTrue), never in this table.

create table if not exists aura_review.student_password_accounts_v6 (
 learner_id uuid primary key references public.aura_learners(id) on delete cascade,
 auth_uid uuid not null unique references auth.users(id) on delete cascade,
 username text collate "C" not null unique,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint student_password_username_format_v6 check(username ~ '^[a-z][a-z0-9._-]{2,29}$')
);
alter table aura_review.student_password_accounts_v6 enable row level security;
revoke all on aura_review.student_password_accounts_v6 from public,anon,authenticated;
grant select,insert,update on aura_review.student_password_accounts_v6 to service_role;

create or replace function public.aura_admin_password_students_v6(p_admin_uid uuid)
returns jsonb language sql stable security definer set search_path='' as $f$
select jsonb_build_object(
 'learners',coalesce(jsonb_agg(jsonb_build_object(
   'id',l.id,'name',l.display_name,'created_at',l.created_at,
   'username',coalesce(p.username,''),
   'login_ready',(p.auth_uid is not null and exists(
      select 1 from public.aura_student_devices d
      where d.auth_uid=p.auth_uid and d.learner_id=l.id and d.revoked_at is null
   ))
 ) order by l.created_at,l.id),'[]'::jsonb),
 'staging_only',true,'mode','PASSWORD_LOGIN')
from public.aura_learners l
join public.aura_households h on h.id=l.household_id
left join aura_review.student_password_accounts_v6 p on p.learner_id=l.id
where h.admin_uid=p_admin_uid
 and exists(select 1 from aura_review.portal_role_grants r
  where r.user_id=p_admin_uid and r.role='ADMIN' and r.active)
$f$;

create or replace function public.aura_admin_bind_student_password_v6(
 p_admin_uid uuid,p_student_id uuid,p_auth_uid uuid,p_username text
) returns jsonb language plpgsql security definer set search_path='' as $f$
declare house uuid; mail text; normalized text;
begin
 if not exists(select 1 from aura_review.portal_role_grants r
  where r.user_id=p_admin_uid and r.role='ADMIN' and r.active)
 then raise exception 'ADMIN_REQUIRED' using errcode='42501';end if;
 select l.household_id into house
 from public.aura_learners l join public.aura_households h on h.id=l.household_id
 where l.id=p_student_id and h.admin_uid=p_admin_uid for update of l;
 if house is null then raise exception 'STUDENT_NOT_OWNED' using errcode='42501';end if;
 normalized:=lower(btrim(coalesce(p_username,'')));
 if normalized !~ '^[a-z][a-z0-9._-]{2,29}$' then
  raise exception 'INVALID_USERNAME' using errcode='22023';
 end if;
 if exists(select 1 from aura_review.student_password_accounts_v6
  where learner_id=p_student_id or auth_uid=p_auth_uid or username=normalized)
 then raise exception 'STUDENT_LOGIN_ALREADY_EXISTS' using errcode='23505';end if;
 select u.email into mail from auth.users u where u.id=p_auth_uid and u.email_confirmed_at is not null;
 if mail is null or lower(mail)<>(normalized||'@students.aura-study.invalid') then
  raise exception 'AUTH_USER_NOT_CONFIRMED_OR_MISMATCHED' using errcode='42501';
 end if;
 if exists(select 1 from aura_review.portal_role_grants g
  where g.user_id=p_auth_uid and g.role='ADMIN' and g.active)
 then raise exception 'CANNOT_ATTACH_ADMIN' using errcode='42501';end if;
 if exists(select 1 from public.aura_student_devices d where d.auth_uid=p_auth_uid)
 then raise exception 'AUTH_USER_ALREADY_PAIRED' using errcode='23505';end if;

 insert into aura_review.student_password_accounts_v6
 (learner_id,auth_uid,username,created_by)
 values(p_student_id,p_auth_uid,normalized,p_admin_uid);

 -- Legacy anonymous pairing is superseded when Admin sets a password login;
 -- one authenticated user now works across multiple devices.
 update public.aura_student_devices set revoked_at=now()
 where learner_id=p_student_id and revoked_at is null;
 update public.aura_pairing_requests set revoked_at=now()
 where learner_id=p_student_id and revoked_at is null and redeemed_at is null;
 insert into public.aura_student_devices(household_id,learner_id,auth_uid,device_label)
 values(house,p_student_id,p_auth_uid,'AURA_STUDENT_PASSWORD_V6');

 return jsonb_build_object('learner_id',p_student_id,'username',normalized,
 'login_ready',true,'staging_only',true);
end $f$;

create or replace function public.aura_admin_password_account_v6(
 p_admin_uid uuid,p_student_id uuid
) returns jsonb language plpgsql stable security definer set search_path='' as $f$
declare result jsonb;
begin
 if not exists(select 1 from aura_review.portal_role_grants r
  where r.user_id=p_admin_uid and r.role='ADMIN' and r.active)
 then raise exception 'ADMIN_REQUIRED' using errcode='42501';end if;
 select jsonb_build_object('auth_uid',p.auth_uid,'username',p.username,
  'learner_id',p.learner_id) into result
 from aura_review.student_password_accounts_v6 p
 join public.aura_learners l on l.id=p.learner_id
 join public.aura_households h on h.id=l.household_id
 where p.learner_id=p_student_id and h.admin_uid=p_admin_uid;
 if result is null then raise exception 'STUDENT_LOGIN_NOT_CONFIGURED' using errcode='42501';end if;
 return result;
end $f$;

create or replace function public.aura_student_password_bound_v6(p_auth_uid uuid)
returns boolean language sql stable security definer set search_path='' as $f$
select exists(
 select 1 from aura_review.student_password_accounts_v6 p
 join public.aura_student_devices d on d.auth_uid=p.auth_uid
  and d.learner_id=p.learner_id and d.revoked_at is null
 where p.auth_uid=p_auth_uid
);
$f$;

revoke all on function public.aura_admin_password_students_v6(uuid) from public,anon,authenticated;
revoke all on function public.aura_admin_bind_student_password_v6(uuid,uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.aura_admin_password_account_v6(uuid,uuid) from public,anon,authenticated;
revoke all on function public.aura_student_password_bound_v6(uuid) from public,anon,authenticated;
grant execute on function public.aura_admin_password_students_v6(uuid) to service_role;
grant execute on function public.aura_admin_bind_student_password_v6(uuid,uuid,uuid,text) to service_role;
grant execute on function public.aura_admin_password_account_v6(uuid,uuid) to service_role;
grant execute on function public.aura_student_password_bound_v6(uuid) to service_role;
