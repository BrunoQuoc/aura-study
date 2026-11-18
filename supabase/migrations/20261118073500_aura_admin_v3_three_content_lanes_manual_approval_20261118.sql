-- AURA STUDY Admin V3: three content lanes and explicit human approval for external exam/sample files.
-- All source references are metadata-only; no textbook pages or protected exercise text copied.
create table if not exists aura_review.standard_learning_units_v3 (
 section_id text primary key references aura_review.sgk_primary_toc_items(section_id) on delete cascade,
 source_id text not null references aura_review.sgk_source_registry(source_id),
 unit_lane text not null check(unit_lane in ('SGK','PRACTICE')),
 title text not null,
 printed_page integer not null check(printed_page>0),
 section_type text not null,
 grade integer not null default 6,
 subject text not null,
 volume integer not null check(volume in(1,2)),
 chapter text,
 source_url text not null,
 evidence_level text not null default 'PUBLISHER_TOC_ONLY'
  check(evidence_level='PUBLISHER_TOC_ONLY'),
 content_status text not null default 'OUTLINE_ONLY'
  check(content_status='OUTLINE_ONLY'),
 requires_admin_approval boolean not null default false
  check(requires_admin_approval=false),
 normalized_at timestamptz not null default now()
);
alter table aura_review.standard_learning_units_v3 enable row level security;
revoke all on aura_review.standard_learning_units_v3 from public,anon,authenticated;

create or replace function aura_review.sync_standard_learning_unit_v3()
returns trigger language plpgsql security definer set search_path='' as $$
declare src record; st text; lane text;
begin
 if not new.toc_heading_verified then
   delete from aura_review.standard_learning_units_v3 where section_id=new.section_id;
   return new;
 end if;
 select sr.source_id,sr.subject,sr.grade,sr.volume,sr.publisher_primary_verified,
        ps.publisher_reader_url,ps.publisher_toc_directly_inspected,
        a.section_type,a.chapter
   into src
   from aura_review.sgk_source_registry sr
   join aura_review.sgk_primary_toc_sources ps on ps.source_id=sr.source_id
   left join aura_review.sgk_alignment_sections a on a.section_id=new.section_id
  where sr.source_id=new.source_id;
 if not found or not src.publisher_primary_verified or not src.publisher_toc_directly_inspected or
    src.publisher_reader_url not like 'https://taphuan.nxbgd.vn/%' then
   delete from aura_review.standard_learning_units_v3 where section_id=new.section_id;
   return new;
 end if;
 st:=coalesce(src.section_type,'LESSON');
 lane:=case when st in ('PRACTICE_COMMON','CHAPTER_REVIEW','YEAR_REVIEW')
   then 'PRACTICE' else 'SGK' end;
 insert into aura_review.standard_learning_units_v3
   (section_id,source_id,unit_lane,title,printed_page,section_type,grade,subject,volume,chapter,source_url)
 values (new.section_id,new.source_id,lane,new.official_heading,new.printed_start_page,st,
         src.grade,src.subject,src.volume,src.chapter,src.publisher_reader_url)
 on conflict(section_id) do update set
  source_id=excluded.source_id,unit_lane=excluded.unit_lane,title=excluded.title,
  printed_page=excluded.printed_page,section_type=excluded.section_type,
  grade=excluded.grade,subject=excluded.subject,volume=excluded.volume,
  chapter=excluded.chapter,source_url=excluded.source_url,
  normalized_at=case when
    aura_review.standard_learning_units_v3.title is distinct from excluded.title or
    aura_review.standard_learning_units_v3.printed_page is distinct from excluded.printed_page or
    aura_review.standard_learning_units_v3.source_url is distinct from excluded.source_url
    then now() else aura_review.standard_learning_units_v3.normalized_at end;
 return new;
end $$;
revoke all on function aura_review.sync_standard_learning_unit_v3() from public,anon,authenticated;
drop trigger if exists aura_content_sgk_normalize_v3 on aura_review.sgk_primary_toc_items;
create trigger aura_content_sgk_normalize_v3 after insert or update of official_heading,
 printed_start_page, source_id, toc_heading_verified on aura_review.sgk_primary_toc_items
 for each row execute function aura_review.sync_standard_learning_unit_v3();

-- One-time normalized outline backfill: never inserts contents, solutions or answers.
insert into aura_review.standard_learning_units_v3
 (section_id,source_id,unit_lane,title,printed_page,section_type,grade,subject,volume,chapter,source_url)
select i.section_id,i.source_id,
 case when a.section_type in('PRACTICE_COMMON','CHAPTER_REVIEW','YEAR_REVIEW') then 'PRACTICE' else 'SGK' end,
 i.official_heading,i.printed_start_page,coalesce(a.section_type,'LESSON'),sr.grade,sr.subject,sr.volume,
 a.chapter,p.publisher_reader_url
from aura_review.sgk_primary_toc_items i
join aura_review.sgk_primary_toc_sources p on p.source_id=i.source_id
join aura_review.sgk_source_registry sr on sr.source_id=i.source_id
left join aura_review.sgk_alignment_sections a on a.section_id=i.section_id
where i.toc_heading_verified=true and p.publisher_toc_directly_inspected=true
 and sr.publisher_primary_verified=true and p.publisher_reader_url like 'https://taphuan.nxbgd.vn/%'
on conflict(section_id) do update set title=excluded.title,printed_page=excluded.printed_page,
 unit_lane=excluded.unit_lane,source_url=excluded.source_url;

-- Admin-uploaded external exam/test sets and example papers require Admin review.
create table if not exists aura_review.manual_material_approvals_v3 (
 household_id uuid not null references public.aura_households(id),
 drive_file_id text not null check(drive_file_id ~ '^[A-Za-z0-9_-]{10,180}$'),
 title text not null,
 subject text not null,
 doc_type text not null,
 material_kind text not null check(material_kind in('EXAM','SAMPLE')),
 source_scope text not null default 'ADMIN_EXTERNAL_SUBMISSION'
  check(source_scope='ADMIN_EXTERNAL_SUBMISSION'),
 review_state text not null default 'APPROVED' check(review_state='APPROVED'),
 approved_by uuid not null,
 approved_at timestamptz not null default now(),
 primary key(household_id,drive_file_id)
);
alter table aura_review.manual_material_approvals_v3 enable row level security;
revoke all on aura_review.manual_material_approvals_v3 from public,anon,authenticated;

create or replace function public.aura_manual_material_approve_v3(
 p_admin_uid uuid,p_file_id text,p_title text,p_subject text,p_doc_type text,p_kind text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare hh uuid;
begin
 if not exists(select 1 from aura_review.portal_role_grants g where
  g.user_id=p_admin_uid and g.role='ADMIN' and g.active=true)
 then raise exception 'ADMIN_REQUIRED' using errcode='42501'; end if;
 select h.id into hh from public.aura_households h where h.admin_uid=p_admin_uid
 order by h.created_at,h.id limit 1;
 if hh is null then raise exception 'ADMIN_HOUSEHOLD_REQUIRED';end if;
 if p_file_id !~ '^[A-Za-z0-9_-]{10,180}$'
  or char_length(btrim(coalesce(p_title,''))) not between 2 and 180
  or p_subject not in('TOAN','NGUVAN','TIENGANH','KHTN','LSDL','GDCD','TINHOC','CONGNGHE','KHAC')
  or p_kind not in('EXAM','SAMPLE')
  or (p_kind='EXAM' and p_doc_type not in('exam','practice'))
  or (p_kind='SAMPLE' and p_doc_type not in('practice','lesson','reference'))
 then raise exception 'INVALID_MANUAL_APPROVAL';end if;
 insert into aura_review.manual_material_approvals_v3
 (household_id,drive_file_id,title,subject,doc_type,material_kind,approved_by)
 values(hh,p_file_id,btrim(p_title),p_subject,p_doc_type,p_kind,p_admin_uid)
 on conflict(household_id,drive_file_id) do update set
  title=excluded.title,subject=excluded.subject,doc_type=excluded.doc_type,
  material_kind=excluded.material_kind,approved_by=excluded.approved_by,
  approved_at=now();
 return jsonb_build_object('approved',true,'file_id',p_file_id,'kind',p_kind,'staging_only',true);
end $$;
revoke all on function public.aura_manual_material_approve_v3(uuid,text,text,text,text,text)
 from public,anon,authenticated;
grant execute on function public.aura_manual_material_approve_v3(uuid,text,text,text,text,text) to service_role;

-- Only material with recorded human Admin approval may be published by this RPC.
create or replace function public.aura_legacy_content_admin_publish_v1(
 p_admin_uid uuid, p_drive_file_id text, p_title text, p_subject text, p_doc_type text,
 p_period text default '')
returns jsonb language plpgsql security definer set search_path='' as $$
declare hh uuid; rid uuid; op text; material text;
begin
 if not exists(select 1 from aura_review.portal_role_grants g where
  g.user_id=p_admin_uid and g.role='ADMIN' and g.active=true)
 then raise exception 'ADMIN_REQUIRED' using errcode='42501';end if;
 select h.id into hh from public.aura_households h where h.admin_uid=p_admin_uid
 order by h.created_at,h.id limit 1;
 if hh is null then raise exception 'ADMIN_HOUSEHOLD_REQUIRED';end if;
 if p_drive_file_id !~ '^[A-Za-z0-9_-]{10,180}$'
  or char_length(btrim(coalesce(p_title,''))) not between 2 and 180
  or p_subject not in('TOAN','NGUVAN','TIENGANH','KHTN','LSDL','GDCD','TINHOC','CONGNGHE','KHAC')
  or p_doc_type not in('exam','practice','lesson','reference')
  or coalesce(p_period,'') not in('','GK1','CK1','GK2','CK2')
 then raise exception 'INVALID_RESOURCE_DATA';end if;
 select a.material_kind into material
 from aura_review.manual_material_approvals_v3 a
 where a.household_id=hh and a.drive_file_id=p_drive_file_id
   and a.review_state='APPROVED' and a.title=btrim(p_title)
   and a.subject=p_subject and a.doc_type=p_doc_type;
 if material is null then raise exception 'MANUAL_APPROVAL_REQUIRED' using errcode='42501';end if;
 select case when exists(
   select 1 from aura_review.legacy_student_shared_resources_v1 r
   where r.household_id=hh and r.drive_file_id=p_drive_file_id) then 'UPDATED' else 'PUBLISHED' end into op;
 insert into aura_review.legacy_student_shared_resources_v1
  (household_id,drive_file_id,title,subject,doc_type,period,published_by)
 values(hh,p_drive_file_id,btrim(p_title),p_subject,p_doc_type,coalesce(p_period,''),p_admin_uid)
 on conflict(household_id,drive_file_id) do update set
 title=excluded.title,subject=excluded.subject,doc_type=excluded.doc_type,
 period=excluded.period,visibility='PUBLISHED_STAGING',
 published_by=p_admin_uid,published_at=now(),updated_at=now(),
 content_version=aura_review.legacy_student_shared_resources_v1.content_version+1
 returning id into rid;
 insert into aura_review.legacy_student_shared_publish_events_v1(resource_id,actor_uid,operation)
 values(rid,p_admin_uid,op);
 return jsonb_build_object('id',rid,'drive_file_id',p_drive_file_id,
 'visibility','PUBLISHED_STAGING','material_kind',material,
 'manual_approved',true,'staging_only',true,'official_exam_enabled',false,
 'teacher_signed_off',false);
end $$;
revoke all on function public.aura_legacy_content_admin_publish_v1(uuid,text,text,text,text,text)
 from public,anon,authenticated;
grant execute on function public.aura_legacy_content_admin_publish_v1(uuid,text,text,text,text,text) to service_role;

-- Overview is authenticated ADMIN-only via authenticated edge + service role.
create or replace function public.aura_admin_content_overview_v3(p_admin_uid uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare payload jsonb;
begin
 if not exists(select 1 from aura_review.portal_role_grants g where
  g.user_id=p_admin_uid and g.role='ADMIN' and g.active=true)
 then raise exception 'ADMIN_REQUIRED' using errcode='42501';end if;
 select jsonb_build_object(
  'staging_only',true,'manual_review_rule','EXTERNAL_EXAM_AND_SAMPLE_ONLY',
  'auto_sgk',true,'auto_practice',true,'official_exam_enabled',false,
  'source_count',(select count(*) from aura_review.sgk_source_registry sr where sr.publisher_primary_verified),
  'sgk_units',(select count(*) from aura_review.standard_learning_units_v3 where unit_lane='SGK'),
  'practice_units',(select count(*) from aura_review.standard_learning_units_v3 where unit_lane='PRACTICE'),
  'guided_lesson_drafts',(select count(*) from aura_review.student_math6_guided_lessons),
  'practice_module_drafts',(select count(*) from aura_review.sgk_common_practice_modules),
  'verified_textbook_exercises',(select count(*) from aura_review.sgk_question_provenance where question_textbook_verified),
  'pending_manual_approvals',(select count(*) from aura_review.manual_material_approvals_v3
      where household_id in (select id from public.aura_households where admin_uid=p_admin_uid)),
  'sources',coalesce((select jsonb_agg(jsonb_build_object('id',sr.source_id,
   'title',sr.title,'subject',sr.subject,'grade',sr.grade,'volume',sr.volume,
   'url',ps.publisher_reader_url,
   'content_scope',ps.checked_scope,
   'verified_full_text',ps.full_textbook_exercises_verified,
   'toc_count',(select count(*) from aura_review.standard_learning_units_v3 u
     where u.source_id=sr.source_id)) order by sr.grade,sr.volume)
    from aura_review.sgk_source_registry sr
    join aura_review.sgk_primary_toc_sources ps on ps.source_id=sr.source_id
    where sr.publisher_primary_verified and ps.publisher_toc_directly_inspected),'[]'::jsonb)
 ) into payload;
 return payload;
end $$;
revoke all on function public.aura_admin_content_overview_v3(uuid) from public,anon,authenticated;
grant execute on function public.aura_admin_content_overview_v3(uuid) to service_role;