-- AURA STUDY Phase 3D — read-only STAGING operational/retention report
-- NEVER include actual JWTs, auth IDs, emails, pairing codes or other secrets.
-- DO NOT run writes/DELETE/TRUNCATE, and DO NOT apply this file to production.
BEGIN READ ONLY;

SELECT
 (SELECT count(*) FROM public.aura_households) AS households,
 (SELECT count(*) FROM public.aura_learners) AS learners,
 (SELECT count(*) FROM public.aura_student_devices WHERE revoked_at IS NULL) AS active_devices,
 (SELECT count(*) FROM public.aura_student_devices WHERE revoked_at IS NOT NULL) AS revoked_devices,
 (SELECT count(*) FROM auth.users WHERE is_anonymous) AS anonymous_auth_accounts,
 (SELECT count(*) FROM public.aura_content_items WHERE source_ref LIKE 'AURA_STAGING_PHASE3B:%') AS phase3b_test_content,
 (SELECT count(*) FROM public.aura_attempts) AS total_attempts,
 (SELECT count(*) FROM public.aura_learning_events) AS total_events,
 (SELECT count(*) FROM public.aura_learning_events WHERE payload->>'source'='staging_phase3d') AS phase3d_test_events,
 (SELECT count(*) FROM public.aura_learning_events WHERE received_at < now()-interval '30 days' AND
    payload->>'source' IN ('staging_phase2c','staging_phase3a','staging_phase3b','staging_phase3c','staging_phase3d'))
   AS synthetic_events_older_than_30d_for_review;

SELECT
  coalesce(payload->>'source','unmarked') AS source_marker,
  event_type,
  count(*) AS events,
  count(DISTINCT event_id) AS distinct_event_ids,
  count(*) FILTER (WHERE payload->>'test'='true') AS test_marked,
  min(received_at)::date AS earliest_utc_day,
  max(received_at)::date AS latest_utc_day
FROM public.aura_learning_events
GROUP BY source_marker,event_type
ORDER BY source_marker,event_type;

WITH minute_buckets AS (
 SELECT device_id,date_trunc('minute',received_at) AS minute_bucket,count(*) AS n
 FROM public.aura_learning_events
 WHERE received_at>=now()-interval '24 hours'
 GROUP BY device_id,date_trunc('minute',received_at)
), daily_counts AS (
 SELECT device_id,count(*) AS n
 FROM public.aura_learning_events
 WHERE received_at>=now()-interval '24 hours'
 GROUP BY device_id
)
SELECT
 (SELECT coalesce(max(n),0) FROM minute_buckets) AS peak_fixed_minute_event_count,
 (SELECT count(*) FROM minute_buckets WHERE n>60) AS fixed_minute_buckets_above_60,
 (SELECT coalesce(max(n),0) FROM daily_counts) AS peak_rolling_day_per_device,
 (SELECT count(*) FROM daily_counts WHERE n>1000) AS devices_above_day_quota;

SELECT
  (SELECT count(*) FROM public.aura_student_devices
   WHERE revoked_at IS NOT NULL AND revoked_at<now()-interval '30 days')
      AS revoked_devices_older_than_30d_for_review,
  (SELECT count(*) FROM auth.users u
   WHERE u.is_anonymous
     AND NOT EXISTS (SELECT 1 FROM public.aura_student_devices d
                     WHERE d.auth_uid=u.id AND d.revoked_at IS NULL))
      AS anonymous_auth_users_without_active_device_for_review;

SELECT
 (SELECT relrowsecurity FROM pg_class WHERE oid='public.aura_learning_events'::regclass)
    AS event_table_rls_enabled,
 (SELECT count(*) FROM pg_trigger
   WHERE tgrelid='public.aura_learning_events'::regclass
     AND tgname='aura_events_ingest_guard_v1' AND tgenabled='O')
    AS quota_guard_active,
 has_table_privilege('authenticated','public.aura_learning_events','UPDATE')
    AS student_can_update_events,
 has_table_privilege('authenticated','public.aura_learning_events','DELETE')
    AS student_can_delete_events;

ROLLBACK;
-- These counts are review indicators, NOT deletion authorization.
