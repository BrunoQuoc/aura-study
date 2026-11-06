-- AURA STUDY / PHASE 3F-A / STAGING ONLY
-- Read-only inspection of intentional, unpaired positive anonymous signup.
-- Run only as an authorized Supabase STAGING operator.
--
-- STRICT: No UPDATE, DELETE, TRUNCATE, Auth session revocation or cleanup.
-- No user IDs, JWTs, emails or other identifiers in output.
-- Test metadata is editable by users and MUST NOT be trusted for authorization.
-- It is only an operator inventory hint; review links and audit history before
-- approving any future retention/cleanup change.

WITH marked AS (
  SELECT u.id,u.created_at
  FROM auth.users u
  WHERE u.is_anonymous IS TRUE
    AND u.raw_user_meta_data ->> 'aura_test_phase' = '3fa_positive_unpaired'
    AND u.raw_user_meta_data ->> 'aura_test_scope' = 'STAGING_ONLY'
)
SELECT
  (SELECT count(*) FROM auth.users) AS total_auth_users,
  (SELECT count(*) FROM auth.users WHERE is_anonymous) AS total_anonymous_auth_users,
  (SELECT count(*) FROM public.aura_student_devices
   WHERE revoked_at IS NULL) AS total_active_paired_devices,
  (SELECT count(*) FROM public.aura_learning_events) AS total_learning_events,
  (SELECT count(*) FROM public.aura_attempts) AS total_attempts,
  count(*) AS tagged_phase3fa_positive_users,
  count(*) FILTER (WHERE marked.created_at >= now() - interval '1 day')
    AS tagged_created_last_24h,
  count(*) FILTER (WHERE marked.created_at <= now() - interval '30 days')
    AS tagged_older_than_30d_for_manual_review,
  count(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM public.aura_student_devices d WHERE d.auth_uid=marked.id
    AND d.revoked_at IS NULL
  )) AS tagged_with_active_pairing,
  count(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM public.aura_learning_events e WHERE e.actor_uid=marked.id
  )) AS tagged_with_learning_events,
  min(marked.created_at) AS oldest_tagged_created_at,
  max(marked.created_at) AS newest_tagged_created_at
FROM marked;

-- Interpretation:
-- In an isolated run, success normally increases total_auth_users and
-- total_anonymous_auth_users by exactly one. The new user remains unpaired.
-- If anything else increases, stop and investigate the change window.
--
-- Even after 30 days, NO automatic cleanup is authorized:
-- approve an exact account, check linked records, active sessions, backups,
-- security/audit requirements and retention policy with two-person review.
