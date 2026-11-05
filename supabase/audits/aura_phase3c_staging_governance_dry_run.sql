-- AURA STUDY — PHASE 3C, STAGING ONLY, READ-ONLY GOVERNANCE REPORT
-- Intentionally displays COUNTS, never JWTs, pairing codes, emails or learner IDs.
-- Do not append DELETE/TRUNCATE to this audit. Cleanup requires separate approval.

BEGIN READ ONLY;

SELECT
  (SELECT count(*) FROM public.aura_households) AS households,
  (SELECT count(*) FROM public.aura_learners) AS learners,
  (SELECT count(*) FROM public.aura_student_devices WHERE revoked_at IS NULL) AS active_devices,
  (SELECT count(*) FROM public.aura_student_devices WHERE revoked_at IS NOT NULL) AS revoked_devices,
  (SELECT count(*) FROM auth.users WHERE is_anonymous) AS anonymous_auth_users,
  (SELECT count(*) FROM public.aura_content_items WHERE source_ref LIKE 'AURA_STAGING_PHASE3B:%') AS phase3b_content,
  (SELECT count(*) FROM public.aura_learning_events WHERE payload->>'source'='staging_phase3b') AS phase3b_events,
  (SELECT count(*) FROM public.aura_learning_events WHERE payload->>'source'='staging_phase3c') AS phase3c_events,
  (SELECT count(*) FROM public.aura_learning_events WHERE payload->>'test'='true') AS marked_test_events,
  (SELECT count(*) FROM public.aura_attempts) AS attempts;

SELECT
  payload->>'source' AS marker,
  event_type,
  count(*) AS events,
  date_trunc('day',min(received_at))::date AS first_utc_day,
  date_trunc('day',max(received_at))::date AS last_utc_day
FROM public.aura_learning_events
WHERE payload->>'source' IN ('staging_phase2c','staging_phase3a','staging_phase3b','staging_phase3c')
GROUP BY payload->>'source',event_type
ORDER BY marker,event_type;

SELECT
  tgname AS trigger_name,
  tgenabled AS enabled
FROM pg_trigger
WHERE tgrelid='public.aura_learning_events'::regclass AND NOT tgisinternal
ORDER BY tgname;

SELECT
  has_function_privilege('authenticated',
    'public.aura_guard_learning_event_ingest_v1()','EXECUTE') AS student_can_call_guard_directly,
  has_table_privilege('authenticated','public.aura_learning_events','UPDATE') AS student_can_update_events,
  has_table_privilege('authenticated','public.aura_learning_events','DELETE') AS student_can_delete_events;

ROLLBACK;
