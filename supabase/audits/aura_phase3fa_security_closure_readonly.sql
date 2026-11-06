-- AURA STUDY / Phase 3F-A Security Closure
-- STAGING read-only, aggregate ONLY; does not expose identities, keys or tokens.
-- This is an inventory query, not permission to delete accounts.
--
-- Tag fields are supplied by the client as editable user_metadata.
-- Treat them as inventory hints, NOT authorization proof or the sole basis
-- for irreversible deletion.

WITH tagged AS (
 SELECT u.id,u.created_at
 FROM auth.users u
 WHERE u.is_anonymous
   AND u.raw_user_meta_data->>'aura_test_phase'='3fa_positive_unpaired'
   AND u.raw_user_meta_data->>'aura_test_scope'='STAGING_ONLY'
), deps AS (
 SELECT
 (SELECT count(*) FROM public.aura_student_devices d WHERE d.auth_uid IN (SELECT id FROM tagged)) AS tagged_device_records,
 (SELECT count(*) FROM public.aura_student_devices d WHERE d.auth_uid IN (SELECT id FROM tagged) AND d.revoked_at IS NULL) AS tagged_active_devices,
 (SELECT count(*) FROM public.aura_learning_events e WHERE e.actor_uid IN (SELECT id FROM tagged)) AS tagged_learning_events,
 (SELECT count(*) FROM auth.sessions s WHERE s.user_id IN (SELECT id FROM tagged)) AS tagged_sessions,
 (SELECT count(*) FROM auth.refresh_tokens r WHERE r.user_id IN (SELECT id::text FROM tagged)) AS tagged_refresh_tokens,
 (SELECT count(*) FROM auth.identities i WHERE i.user_id IN (SELECT id FROM tagged)) AS tagged_auth_identities,
 (SELECT count(*) FROM auth.mfa_factors f WHERE f.user_id IN (SELECT id FROM tagged)) AS tagged_mfa_factors
)
SELECT
 (SELECT count(*) FROM auth.users) AS total_auth_users,
 (SELECT count(*) FROM auth.users WHERE is_anonymous) AS total_anonymous_users,
 (SELECT count(*) FROM tagged) AS phase3fa_tagged_anonymous,
 (SELECT count(*) FROM tagged WHERE created_at >= now()-interval '24 hours') AS tagged_created_last_24h,
 (SELECT count(*) FROM tagged WHERE created_at+interval '30 days'<=now()) AS tagged_due_for_manual_review,
 (SELECT min(created_at+interval '30 days') FROM tagged) AS earliest_review_due_at_utc,
 (SELECT count(*) FROM public.aura_student_devices WHERE revoked_at IS NULL) AS active_paired_devices,
 (SELECT count(*) FROM public.aura_learning_events) AS learning_events,
 (SELECT count(*) FROM public.aura_attempts) AS graded_attempts,
 (SELECT count(*) FROM public.aura_verified_outcomes_v1) AS verified_outcomes,
 (SELECT count(*) FROM public.aura_households) AS households,
 (SELECT count(*) FROM public.aura_learners) AS learners,
 (SELECT count(*) FROM public.aura_content_items) AS content_items,
 (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid
  WHERE n.nspname='public' AND c.relname IN
  ('aura_learning_progress_v1','aura_learning_daily_v1','aura_verified_outcomes_v1')
  AND 'security_invoker=true'=ANY(c.reloptions)) AS secure_invoker_views,
 deps.*
FROM deps;
