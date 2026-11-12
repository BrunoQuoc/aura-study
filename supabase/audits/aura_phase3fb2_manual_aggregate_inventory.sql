-- AURA STUDY — Phase 3F-B2 STAGING, aggregate-only manual monitoring.
-- PostgreSQL SQL Editor (NOT the Supabase Logs Explorer).
-- READ-ONLY. Outputs counts and snapshot time only; no emails, IDs, tokens, IPs, or raw payloads.
-- Run only against Supabase STAGING with an authorized operator account.
SELECT
  to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') AS snapshot_at_utc,
  (SELECT COUNT(*) FROM auth.users) AS auth_users_total,
  (SELECT COUNT(*) FROM auth.users WHERE is_anonymous IS TRUE) AS auth_users_anonymous,
  (SELECT COUNT(*) FROM auth.users WHERE is_anonymous IS NOT TRUE) AS auth_users_nonanonymous,
  (SELECT COUNT(*) FROM auth.sessions) AS auth_sessions_total,
  (SELECT COUNT(*) FROM auth.refresh_tokens WHERE revoked IS NOT TRUE) AS refresh_tokens_not_revoked,
  (SELECT COUNT(*) FROM public.aura_student_devices) AS device_rows_total,
  (SELECT COUNT(*) FROM public.aura_student_devices WHERE paired_at IS NOT NULL AND revoked_at IS NULL) AS devices_actively_paired,
  (SELECT COUNT(*) FROM public.aura_learning_events) AS learning_events_total,
  (SELECT COUNT(*) FROM public.aura_attempts) AS attempts_total,
  (SELECT COUNT(*) FROM public.aura_pairing_requests) AS pairing_requests_total,
  (SELECT COUNT(*) FROM public.aura_pairing_requests
    WHERE redeemed_at IS NULL AND revoked_at IS NULL AND expires_at > now()) AS pairing_requests_pending_unexpired;
-- Refresh-token count is not proof of active client sessions; evaluate session lifecycle separately.
