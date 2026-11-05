-- AURA STUDY — Phase 3E STAGING release-gate inventory
-- READ ONLY. No Auth, device, event or content modification.
-- Does not return PII, account IDs, tokens, event payloads or pairing codes.
-- Production deployment requires independent approvals; this report is NOT approval.
BEGIN READ ONLY;

-- R1: Scope and data provenance; STAGING-only test markers.
SELECT
 (SELECT count(*) FROM public.aura_households) AS household_count,
 (SELECT count(*) FROM public.aura_learners) AS learner_count,
 (SELECT count(*) FROM public.aura_student_devices WHERE revoked_at IS NULL) AS active_device_count,
 (SELECT count(*) FROM public.aura_student_devices WHERE revoked_at IS NOT NULL) AS revoked_device_count,
 (SELECT count(*) FROM auth.users WHERE is_anonymous) AS anonymous_auth_user_count,
 (SELECT count(*) FROM auth.users u WHERE u.is_anonymous AND NOT EXISTS
   (SELECT 1 FROM public.aura_student_devices d WHERE d.auth_uid=u.id AND d.revoked_at IS NULL))
  AS anonymous_auth_without_active_device_review_only,
 (SELECT count(*) FROM public.aura_content_items WHERE source_ref LIKE 'AURA_STAGING_PHASE3B:%')
  AS synthetic_content_items,
 (SELECT count(*) FROM public.aura_attempts) AS attempt_rows,
 (SELECT count(*) FROM public.aura_learning_events) AS event_rows,
 (SELECT count(*) FROM public.aura_learning_events e WHERE e.payload->>'test'='true') AS test_marked_events,
 (SELECT count(*) FROM public.aura_learning_events e
   WHERE e.payload->>'source' IN
   ('staging_phase2c','staging_phase3a','staging_phase3b','staging_phase3c','staging_phase3d')
   AND e.received_at < now()-interval '30 days') AS old_synthetic_events_for_review_only,
 (SELECT count(*) FROM public.aura_learning_events e WHERE e.payload->>'source'='staging_phase3e')
  AS phase3e_live_events_expected_zero;

-- R2: Verification that mock chaos tests did not write to remote database.
SELECT
  coalesce(e.payload->>'source','unmarked') AS event_marker,
  e.event_type,
  count(*) AS events,
  count(DISTINCT e.event_id) AS unique_event_ids,
  count(*) FILTER(WHERE e.payload->>'test'='true') AS test_flagged_events
FROM public.aura_learning_events e
GROUP BY event_marker,e.event_type
ORDER BY event_marker,e.event_type;

-- R3: Minimum database controls.
SELECT
  count(*) FILTER(WHERE c.relrowsecurity) AS public_business_tables_with_rls,
  count(*) FILTER(WHERE NOT c.relrowsecurity) AS public_business_tables_without_rls,
  count(*) FILTER(WHERE has_table_privilege('anon',c.oid,'SELECT')) AS anon_direct_select_grants,
  count(*) FILTER(WHERE has_table_privilege('authenticated',c.oid,'DELETE')) AS authenticated_delete_grants,
  count(*) FILTER(WHERE has_table_privilege('authenticated',c.oid,'UPDATE')) AS authenticated_update_grants
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE 'aura_%';

-- R4: Student cannot directly use the privileged pairing RPCs.
SELECT
 has_function_privilege('authenticated','public.aura_bootstrap_parent(uuid)','EXECUTE')
   AS student_can_bootstrap_parent_direct,
 has_function_privilege('authenticated','public.aura_redeem_device_pairing(text,uuid,text)','EXECUTE')
   AS student_can_redeem_pair_direct,
 has_table_privilege('authenticated','public.aura_attempts','INSERT')
   AS student_can_insert_grades,
 has_table_privilege('authenticated','public.aura_attempts','UPDATE')
   AS student_can_update_grades,
 has_table_privilege('authenticated','public.aura_attempts','DELETE')
   AS student_can_delete_grades,
 (SELECT count(*) FROM pg_trigger t
  WHERE t.tgrelid='public.aura_learning_events'::regclass
    AND t.tgname='aura_events_ingest_guard_v1' AND t.tgenabled='O')
   AS active_ingest_rate_guard;

-- R5: View safety and no unauthenticated reads.
SELECT c.relname AS view_name,
  (c.reloptions::text LIKE '%security_invoker=true%') AS security_invoker_true,
  has_table_privilege('anon',c.oid,'SELECT') AS anon_can_read,
  has_table_privilege('authenticated',c.oid,'SELECT') AS authenticated_role_can_read
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN
 ('aura_learning_progress_v1','aura_learning_daily_v1','aura_verified_outcomes_v1')
ORDER BY c.relname;

ROLLBACK;
-- This report inventories data for a human approval workflow.
-- Do not infer automatic cleanup rights from age, test marker or an orphan account count.
