-- Applied to aura-study-staging, migration 20261118071050.
-- Official publisher SGK metadata is auto-visible to authenticated and paired Student.
-- Manual review continues exclusively for Admin-provided exams/test sets.
-- No reproduction of textbook pages, answer keys or licensed PDF content.
CREATE OR REPLACE FUNCTION public.aura_sgk_auto_catalog_v1(p_actor_uid uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare allowed boolean; catalog jsonb;
begin
 select (
   exists (select 1 from aura_review.portal_role_grants g where g.user_id=p_actor_uid and g.role='ADMIN' and g.active)
   or exists (
    select 1 from public.aura_student_devices d
    join public.aura_learners l on l.id=d.learner_id and l.household_id=d.household_id
    where d.auth_uid=p_actor_uid and d.revoked_at is null
   )
 ) into allowed;
 if not allowed then raise exception 'AURA_ROLE_OR_PAIRING_REQUIRED' using errcode='42501'; end if;
 select coalesce(jsonb_agg(jsonb_build_object(
  'source_id',src.source_id, 'title',src.title,
  'series',src.book_series,'subject',src.subject,'grade',src.grade,
  'volume',src.volume,'publisher',toc.source_publisher,
  'source_url',toc.publisher_reader_url,'toc_verified',true,
  'full_textbook_verified',false,'review_required',false,
  'source_checked_at',toc.checked_at,
  'sections',coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',item.section_id,'heading',item.official_heading,
      'start_page',item.printed_start_page
    ) order by item.printed_start_page,item.section_id)
    from aura_review.sgk_primary_toc_items item
    where item.source_id=src.source_id and item.toc_heading_verified=true
  ),'[]'::jsonb)
 ) order by src.subject,src.grade,src.volume),'[]'::jsonb)
 into catalog
 from aura_review.sgk_source_registry src
 join aura_review.sgk_primary_toc_sources toc on toc.source_id=src.source_id
 where src.publisher_primary_verified=true
   and toc.publisher_toc_directly_inspected=true
   and toc.publisher_reader_url like 'https://taphuan.nxbgd.vn/%'
   and src.toc_reference_url=toc.publisher_reader_url;
 return jsonb_build_object('sources',catalog,'review_required',false,
  'content_scope','OFFICIAL_PUBLISHER_LINK_AND_VERIFIED_TABLE_OF_CONTENTS',
  'full_textbook_verified',false,'official_exam_enabled',false,
  'staging_only',true);
end $function$
;

revoke all on function public.aura_sgk_auto_catalog_v1(uuid) from public,anon,authenticated;
grant execute on function public.aura_sgk_auto_catalog_v1(uuid) to service_role;
