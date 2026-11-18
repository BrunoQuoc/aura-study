-- AURA STUDY -- applied to Supabase staging at migration version 20261118041949.
-- Private file copies for already-published legacy Admin documents.
-- Staging only: does not enable official exams, auto grading, or teacher sign-off.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('aura-legacy-approved-v2','aura-legacy-approved-v2',false,6291456,
array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
'application/msword','image/jpeg','image/png','text/plain']::text[])
on conflict (id) do nothing;

alter table aura_review.legacy_student_shared_resources_v1
 add column if not exists asset_path text,
 add column if not exists asset_mime text,
 add column if not exists asset_bytes bigint,
 add column if not exists asset_uploaded_at timestamptz;

alter table aura_review.legacy_student_shared_resources_v1
 add constraint aura_legacy_asset_v2_complete_ck check (
 (asset_path is null and asset_mime is null and asset_bytes is null and asset_uploaded_at is null)
 or (asset_path is not null and asset_mime is not null and asset_bytes between 1 and 6291456 and asset_uploaded_at is not null)
 );

CREATE OR REPLACE FUNCTION aura_review.aura_legacy_reset_asset_v2()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if new.content_version is distinct from old.content_version then
    new.asset_path:=null; new.asset_mime:=null; new.asset_bytes:=null; new.asset_uploaded_at:=null;
  end if;
  return new;
end $function$;


create trigger aura_legacy_reset_asset_v2 before update
on aura_review.legacy_student_shared_resources_v1
for each row execute function aura_review.aura_legacy_reset_asset_v2();


CREATE OR REPLACE FUNCTION public.aura_legacy_content_admin_list_v1(p_admin_uid uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
select case
 when not exists(select 1 from aura_review.portal_role_grants g
 where g.user_id=p_admin_uid and g.role='ADMIN' and g.active) then
 jsonb_build_object('error','ADMIN_REQUIRED','items','[]'::jsonb)
 else jsonb_build_object(
 'items',coalesce((select jsonb_agg(to_jsonb(t) order by t.updated_at desc)
 from (
 select r.id,r.drive_file_id,r.title,r.subject,r.doc_type,r.period,
 r.visibility,r.updated_at,r.content_version,
 (r.asset_path is not null) as asset_ready,r.asset_mime
 from aura_review.legacy_student_shared_resources_v1 r
 join public.aura_households h on h.id=r.household_id
 where h.admin_uid=p_admin_uid order by r.updated_at desc limit 300
 ) t),'[]'::jsonb),
 'staging_only',true,'official_exam_enabled',false)
 end $function$;


CREATE OR REPLACE FUNCTION public.aura_legacy_content_attach_asset_v2(p_admin_uid uuid, p_drive_file_id text, p_asset_path text, p_mime text, p_bytes bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r record; actual_size bigint; actual_mime text;
begin
 if not exists(select 1 from aura_review.portal_role_grants g
 where g.user_id=p_admin_uid and g.role='ADMIN' and g.active)
 then raise exception 'ADMIN_REQUIRED' using errcode='42501'; end if;
 select z.id,z.visibility,z.asset_path into r
 from aura_review.legacy_student_shared_resources_v1 z
 join public.aura_households h on h.id=z.household_id
 where h.admin_uid=p_admin_uid and z.drive_file_id=p_drive_file_id
 for update of z;
 if r.id is null or r.visibility<>'PUBLISHED_STAGING'
 then raise exception 'PUBLISHED_RESOURCE_REQUIRED' using errcode='42501'; end if;
 if p_asset_path !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|docx|doc|png|jpg|txt)$'
 or split_part(p_asset_path,'/',1)<>r.id::text or p_bytes not between 1 and 6291456
 or p_mime not in ('application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword','image/jpeg','image/png','text/plain')
 then raise exception 'INVALID_ASSET_DATA'; end if;
 select nullif(o.metadata->>'size','')::bigint,coalesce(o.metadata->>'mimetype','')
 into actual_size,actual_mime
 from storage.objects o where o.bucket_id='aura-legacy-approved-v2' and o.name=p_asset_path;
 if actual_size is distinct from p_bytes or actual_mime is distinct from p_mime
 then raise exception 'ASSET_UPLOAD_NOT_VERIFIED'; end if;
 update aura_review.legacy_student_shared_resources_v1 z
 set asset_path=p_asset_path,asset_mime=p_mime,asset_bytes=p_bytes,
 asset_uploaded_at=now(),updated_at=now()
 where z.id=r.id;
 return jsonb_build_object('id',r.id,'asset_ready',true,'staging_only',true);
end $function$;


CREATE OR REPLACE FUNCTION public.aura_legacy_content_student_asset_v2(p_student_uid uuid, p_resource_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare result jsonb;
begin
 select jsonb_build_object('path',r.asset_path,'mime',r.asset_mime,'title',r.title)
 into result
 from aura_review.legacy_student_shared_resources_v1 r
 where r.id=p_resource_id and r.visibility='PUBLISHED_STAGING' and r.asset_path is not null
 and exists(select 1 from public.aura_student_devices d
  join public.aura_learners l on l.id=d.learner_id and l.household_id=d.household_id
  where d.auth_uid=p_student_uid and d.revoked_at is null and d.household_id=r.household_id);
 if result is null then raise exception 'RESOURCE_NOT_AVAILABLE' using errcode='42501'; end if;
 return result;
end $function$;


CREATE OR REPLACE FUNCTION public.aura_legacy_content_student_list_v1(p_student_uid uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare valid_device boolean; entries jsonb;
begin
 select exists(select 1 from public.aura_student_devices d
 join public.aura_learners l on l.id=d.learner_id and l.household_id=d.household_id
 where d.auth_uid=p_student_uid and d.revoked_at is null) into valid_device;
 if not valid_device then raise exception 'STUDENT_PAIRING_REQUIRED' using errcode='42501'; end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.updated_at desc),'[]'::jsonb)
 into entries from (
  select distinct on(r.household_id,r.drive_file_id)
    r.id,r.drive_file_id,r.title,r.subject,r.doc_type,r.period,r.content_version,r.updated_at,
    (r.asset_path is not null) as asset_ready
  from aura_review.legacy_student_shared_resources_v1 r
  where r.visibility='PUBLISHED_STAGING'
  and exists(select 1 from public.aura_student_devices d
   where d.auth_uid=p_student_uid and d.household_id=r.household_id and d.revoked_at is null
   and exists(select 1 from public.aura_learners l where l.id=d.learner_id and l.household_id=d.household_id))
  order by r.household_id,r.drive_file_id
 ) x;
 return jsonb_build_object('items',entries,'staging_only',true,
 'teacher_signed_off',false,'official_exam_enabled',false,
 'drive_permissions_required',false);
end $function$;


revoke all on function public.aura_legacy_content_attach_asset_v2(uuid,text,text,text,bigint) from public,anon,authenticated;
revoke all on function public.aura_legacy_content_student_asset_v2(uuid,uuid) from public,anon,authenticated;
grant execute on function public.aura_legacy_content_attach_asset_v2(uuid,text,text,text,bigint) to service_role;
grant execute on function public.aura_legacy_content_student_asset_v2(uuid,uuid) to service_role;
