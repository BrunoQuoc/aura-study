-- Atomic learner + verified password identity binding (rollback learner on credential error).
create or replace function public.aura_admin_create_student_password_v6(
 p_admin_uid uuid,p_name text,p_auth_uid uuid,p_username text
) returns jsonb language plpgsql security definer set search_path='' as $f$
declare created jsonb;bound jsonb;
begin
 created:=public.aura_admin_student_create_v1(p_admin_uid,p_name);
 bound:=public.aura_admin_bind_student_password_v6(
  p_admin_uid,(created->>'student_id')::uuid,p_auth_uid,p_username
 );
 return created||bound;
end $f$;
revoke all on function public.aura_admin_create_student_password_v6(uuid,text,uuid,text)
 from public,anon,authenticated;
grant execute on function public.aura_admin_create_student_password_v6(uuid,text,uuid,text)
 to service_role;