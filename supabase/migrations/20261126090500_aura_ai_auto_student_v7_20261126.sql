-- AURA STUDY V7 — AURA AI lessons/practice auto-enter Student.
-- External exams and sample papers keep the separate Admin approval gate.
create or replace function public.aura_learning_pipeline_catalog_v4(p_actor_uid uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $fn$
declare can_admin boolean;can_student boolean; data jsonb; totals jsonb;
begin
 select exists(select 1 from aura_review.portal_role_grants g where g.user_id=p_actor_uid and g.role='ADMIN' and g.active) into can_admin;
 select exists(select 1 from public.aura_student_devices d join public.aura_learners l on l.id=d.learner_id and l.household_id=d.household_id where d.auth_uid=p_actor_uid and d.revoked_at is null)
   or exists(select 1 from aura_review.student_password_accounts_v6 p join public.aura_student_devices d on d.auth_uid=p.auth_uid and d.learner_id=p.learner_id and d.revoked_at is null where p.auth_uid=p_actor_uid)
 into can_student;
 if not (can_admin or can_student) then raise exception 'ACTIVE_ADMIN_OR_STUDENT_REQUIRED' using errcode='42501'; end if;
 select jsonb_build_object(
  'total',count(*),'sgk_outlines',count(*) filter(where unit_lane='SGK'),
  'practice_outlines',count(*) filter(where unit_lane='PRACTICE'),
  'student_auto_published',count(*) filter(where preview_ready),
  'draft_missing_or_incomplete',count(*) filter(where unit_lane='SGK' and not preview_ready),
  'locked_practice_modules',count(*) filter(where practice_qa_locked),
  'verified_publisher_bodies',count(*) filter(where publisher_body_verified),'official_exams',0
 ) into totals from aura_review.learning_pipeline_units_v4;
 select coalesce(jsonb_agg(jsonb_build_object(
  'id',x.section_id,'source_id',x.source_id,'lane',x.unit_lane,'title',x.title,'subject',x.subject,'grade',x.grade,
  'volume',x.volume,'chapter',x.chapter,'printed_page',x.printed_page,'source_url',x.source_url,
  'status',case when x.preview_ready then 'AI_AUTO_STUDENT' when x.practice_qa_locked then 'PRACTICE_QA_LOCKED' else 'OUTLINE_ONLY' end,
  'preview_ready',x.preview_ready,'student_auto_published',x.preview_ready,
  'content_origin',case when x.preview_ready then 'AURA_AI_AUTHORED_DRAFT' else 'VERIFIED_PUBLISHER_TOC_ONLY' end,
  'textbook_body_verified',x.publisher_body_verified,'official_exam_enabled',false
 ) order by x.volume,x.printed_page,x.section_id),'[]'::jsonb) into data from aura_review.learning_pipeline_units_v4 x;
 return jsonb_build_object(
  'staging_only',true,'preview_only',false,'student_auto_publish',true,
  'review_required_for_ai_content',false,'review_required_for_official_sgk',false,
  'student_paired',can_student,'admin_access',can_admin,'official_exam_enabled',false,'teacher_signed_off',false,
  'copyright_scope','PUBLISHER_TOC_AND_AI_AUTHORED_DRAFTS_ONLY','totals',totals,'items',data);
end $fn$;

create or replace function public.aura_learning_pipeline_lesson_v4(p_actor_uid uuid,p_section_id text)
returns jsonb language plpgsql stable security definer set search_path='' as $fn$
declare allowed boolean; result jsonb;
begin
 select exists(select 1 from aura_review.portal_role_grants g where g.user_id=p_actor_uid and g.role='ADMIN' and g.active)
  or exists(select 1 from public.aura_student_devices d join public.aura_learners learner on learner.id=d.learner_id and learner.household_id=d.household_id where d.auth_uid=p_actor_uid and d.revoked_at is null)
  or exists(select 1 from aura_review.student_password_accounts_v6 p join public.aura_student_devices d on d.auth_uid=p.auth_uid and d.learner_id=p.learner_id and d.revoked_at is null where p.auth_uid=p_actor_uid)
 into allowed;
 if not allowed then raise exception 'ACTIVE_ADMIN_OR_STUDENT_REQUIRED' using errcode='42501';end if;
 if coalesce(p_section_id,'') !~ '^SGK-M6-T[12]-[A-Z0-9-]{3,90}$' then raise exception 'INVALID_LESSON_REFERENCE' using errcode='22023'; end if;
 select jsonb_build_object(
  'id',u.section_id,'title',u.title,'subject',u.subject,'volume',u.volume,'printed_page',u.printed_page,'source_url',u.source_url,
  'opening',l.opening_prompt,'concept',l.concept_explanation,'worked_example',l.worked_example,
  'practice_prompt',l.guided_practice_prompt,'application_prompt',l.application_prompt,
  'content_origin','AURA_AI_AUTHORED_DRAFT','source_evidence','PUBLISHER_TOC_ONLY','technical_gate','STRUCTURE_PRESENT_ONLY',
  'pedagogical_certified',u.pedagogical_certified,'textbook_body_verified',false,'auto_grading_enabled',false,
  'staging_only',true,'preview_only',false,'student_auto_published',true,'official_exam_enabled',false
 ) into result
 from aura_review.learning_pipeline_units_v4 u
 join aura_review.student_math6_guided_lessons l on l.lesson_id=u.lesson_id
 where u.section_id=p_section_id and u.preview_ready=true and l.source_kind='AI_ORIGINAL_STAGING';
 if result is null then raise exception 'LESSON_NOT_READY_FOR_STUDENT' using errcode='42501';end if;
 return result;
end $fn$;
revoke all on function public.aura_learning_pipeline_catalog_v4(uuid) from public,anon,authenticated;
revoke all on function public.aura_learning_pipeline_lesson_v4(uuid,text) from public,anon,authenticated;
grant execute on function public.aura_learning_pipeline_catalog_v4(uuid) to service_role;
grant execute on function public.aura_learning_pipeline_lesson_v4(uuid,text) to service_role;