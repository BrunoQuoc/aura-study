-- AURA STUDY V4: dynamic, source-traceable learning ingestion -> draft -> paired Student preview.
-- Important: publisher Table of Contents only. No textbook pages/exercises copied.
-- Existing AI-authored lesson drafts are PREVIEWS ONLY, not certified SGK or graded exams.
create or replace view aura_review.learning_pipeline_units_v4
with (security_invoker=true) as
select
 u.section_id, u.source_id, u.unit_lane, u.section_type, u.title,
 u.grade, u.subject, u.volume, u.chapter, u.printed_page, u.source_url,
 a.lesson_id,
 l.lesson_number,
 (l.lesson_id is not null and l.source_kind='AI_ORIGINAL_STAGING') as ai_draft_exists,
 coalesce(l.pedagogical_certified,false) as pedagogical_certified,
 (u.unit_lane='SGK' and u.section_type='LESSON'
  and l.lesson_id is not null and l.source_kind='AI_ORIGINAL_STAGING'
  and length(btrim(coalesce(l.opening_prompt,'')))>=10
  and length(btrim(coalesce(l.concept_explanation,'')))>=20
  and length(btrim(coalesce(l.worked_example,'')))>=15
  and length(btrim(coalesce(l.guided_practice_prompt,'')))>=15
  and length(btrim(coalesce(l.application_prompt,'')))>=15
  and length(coalesce(l.opening_prompt,''))<=5000
  and length(coalesce(l.concept_explanation,''))<=10000
  and length(coalesce(l.worked_example,''))<=5000
  and length(coalesce(l.guided_practice_prompt,''))<=5000
  and length(coalesce(l.application_prompt,''))<=5000) as preview_ready,
 (p.section_id is not null) as practice_module_exists,
 coalesce(p.status='STAGING_QA_LOCKED',false) as practice_qa_locked,
 (i.body_and_exercise_verified=true and
  coalesce(a.direct_textbook_content_verified,false)) as publisher_body_verified
from aura_review.standard_learning_units_v3 u
join aura_review.sgk_source_registry sr on sr.source_id=u.source_id and sr.publisher_primary_verified=true
join aura_review.sgk_primary_toc_sources src on src.source_id=u.source_id
 and src.publisher_toc_directly_inspected=true
 and src.publisher_reader_url=u.source_url
 and src.publisher_reader_url like 'https://taphuan.nxbgd.vn/%'
join aura_review.sgk_primary_toc_items i on i.section_id=u.section_id
 and i.source_id=u.source_id and i.toc_heading_verified=true
left join aura_review.sgk_alignment_sections a on a.section_id=u.section_id
left join aura_review.student_math6_guided_lessons l on l.lesson_id=a.lesson_id
left join aura_review.sgk_common_practice_modules p on p.section_id=u.section_id
where u.content_status='OUTLINE_ONLY' and u.evidence_level='PUBLISHER_TOC_ONLY';

revoke all on aura_review.learning_pipeline_units_v4 from public,anon,authenticated;

-- Zero privileged RPCs are publicly callable; Edge authenticates JWT and calls as service_role.
create or replace function public.aura_learning_pipeline_catalog_v4(p_actor_uid uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $fn$
declare can_admin boolean;can_student boolean; data jsonb; totals jsonb;
begin
 select exists(select 1 from aura_review.portal_role_grants g
  where g.user_id=p_actor_uid and g.role='ADMIN' and g.active)
 into can_admin;
 select exists(select 1 from public.aura_student_devices d
  join public.aura_learners l on l.id=d.learner_id and l.household_id=d.household_id
  where d.auth_uid=p_actor_uid and d.revoked_at is null)
 into can_student;
 if not (can_admin or can_student) then
  raise exception 'ACTIVE_ADMIN_OR_PAIRED_STUDENT_REQUIRED' using errcode='42501';
 end if;
 select jsonb_build_object(
  'total',count(*),
  'sgk_outlines',count(*) filter(where unit_lane='SGK'),
  'practice_outlines',count(*) filter(where unit_lane='PRACTICE'),
  'student_preview_drafts',count(*) filter(where preview_ready),
  'draft_missing_or_incomplete',count(*) filter(where unit_lane='SGK' and not preview_ready),
  'locked_practice_modules',count(*) filter(where practice_qa_locked),
  'verified_publisher_bodies',count(*) filter(where publisher_body_verified),
  'official_exams',0
 ) into totals from aura_review.learning_pipeline_units_v4;
 select coalesce(jsonb_agg(jsonb_build_object(
  'id',x.section_id,'source_id',x.source_id,
  'lane',x.unit_lane,'title',x.title,'subject',x.subject,'grade',x.grade,
  'volume',x.volume,'chapter',x.chapter,'printed_page',x.printed_page,
  'source_url',x.source_url,
  'status',case
    when x.preview_ready then 'AI_DRAFT_PREVIEW'
    when x.practice_qa_locked then 'PRACTICE_QA_LOCKED'
    else 'OUTLINE_ONLY' end,
  'preview_ready',x.preview_ready,
  'content_origin',case when x.preview_ready then 'AURA_AI_AUTHORED_DRAFT'
    else 'VERIFIED_PUBLISHER_TOC_ONLY' end,
  'textbook_body_verified',x.publisher_body_verified,
  'official_exam_enabled',false
 ) order by x.volume,x.printed_page,x.section_id),'[]'::jsonb)
 into data from aura_review.learning_pipeline_units_v4 x;
 return jsonb_build_object(
  'staging_only',true,'preview_only',true,'review_required_for_official_sgk',false,
  'student_paired',can_student,'admin_access',can_admin,
  'official_exam_enabled',false,'teacher_signed_off',false,
  'copyright_scope','PUBLISHER_TOC_AND_AI_AUTHORED_DRAFTS_ONLY',
  'totals',totals,'items',data
 );
end $fn$;

create or replace function public.aura_learning_pipeline_lesson_v4(
 p_actor_uid uuid,p_section_id text)
returns jsonb language plpgsql stable security definer set search_path='' as $fn$
declare allowed boolean; result jsonb;
begin
 select
  exists(select 1 from aura_review.portal_role_grants g
    where g.user_id=p_actor_uid and g.role='ADMIN' and g.active)
  or exists(select 1 from public.aura_student_devices d
    join public.aura_learners learner on learner.id=d.learner_id
      and learner.household_id=d.household_id
    where d.auth_uid=p_actor_uid and d.revoked_at is null)
 into allowed;
 if not allowed then raise exception 'ACTIVE_ADMIN_OR_PAIRED_STUDENT_REQUIRED' using errcode='42501';end if;
 if coalesce(p_section_id,'') !~ '^SGK-M6-T[12]-[A-Z0-9-]{3,90}$' then
   raise exception 'INVALID_LESSON_REFERENCE' using errcode='22023';
 end if;
 select jsonb_build_object(
  'id',u.section_id,'title',u.title,'subject',u.subject,
  'volume',u.volume,'printed_page',u.printed_page,
  'source_url',u.source_url,
  'opening',l.opening_prompt,'concept',l.concept_explanation,
  'worked_example',l.worked_example,
  'practice_prompt',l.guided_practice_prompt,
  'application_prompt',l.application_prompt,
  'content_origin','AURA_AI_AUTHORED_DRAFT','source_evidence','PUBLISHER_TOC_ONLY',
  'technical_gate','STRUCTURE_PRESENT_ONLY',
  'pedagogical_certified',u.pedagogical_certified,
  'textbook_body_verified',false,'auto_grading_enabled',false,
  'staging_only',true,'preview_only',true,'official_exam_enabled',false
 ) into result
 from aura_review.learning_pipeline_units_v4 u
 join aura_review.student_math6_guided_lessons l on l.lesson_id=u.lesson_id
 where u.section_id=p_section_id and u.preview_ready=true
   and l.source_kind='AI_ORIGINAL_STAGING';
 if result is null then raise exception 'LESSON_NOT_READY_FOR_PREVIEW' using errcode='42501';end if;
 return result;
end $fn$;

revoke all on function public.aura_learning_pipeline_catalog_v4(uuid) from public,anon,authenticated;
revoke all on function public.aura_learning_pipeline_lesson_v4(uuid,text) from public,anon,authenticated;
grant execute on function public.aura_learning_pipeline_catalog_v4(uuid) to service_role;
grant execute on function public.aura_learning_pipeline_lesson_v4(uuid,text) to service_role;

comment on view aura_review.learning_pipeline_units_v4 is
 'Dynamic source-to-Student pipeline: verified publisher TOC plus AURA-generated drafts. Preview is not pedagogical signoff.';
