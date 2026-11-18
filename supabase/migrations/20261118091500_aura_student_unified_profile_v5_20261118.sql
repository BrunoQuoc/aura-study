-- AURA STUDY V5: one Admin-created cloud Student identity, no separate browser PIN required.
-- Internal RPC; only invoked by authenticated Edge after getUser/JWT and role checks.
create or replace function public.aura_student_unified_profile_v5(p_student_uid uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare profile jsonb;
begin
 select jsonb_build_object(
  'learner_id',l.id,
  'name',l.display_name,
  'role','STUDENT',
  'paired',true,
  'staging_only',true,
  'official_exam_enabled',false
 ) into profile
 from public.aura_student_devices d
 join public.aura_learners l on l.id=d.learner_id
  and l.household_id=d.household_id
 join public.aura_households h on h.id=d.household_id
 where d.auth_uid=p_student_uid and d.revoked_at is null
 order by d.paired_at desc,d.id desc
 limit 1;
 if profile is null then
  raise exception 'ACTIVE_STUDENT_PAIRING_REQUIRED' using errcode='42501';
 end if;
 return profile;
end $$;
revoke all on function public.aura_student_unified_profile_v5(uuid) from public,anon,authenticated;
grant execute on function public.aura_student_unified_profile_v5(uuid) to service_role;