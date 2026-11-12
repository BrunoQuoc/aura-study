-- AURA STUDY Phase 3F-B2 — STAGING ONLY.
-- PostgreSQL SQL Editor (Database source), NOT Logs Explorer.
-- Count-only SELECT; do not read auth.audit_log_entries.payload or ip_address.
SELECT
  to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS snapshot_utc,
  (SELECT count(*) FROM auth.users) AS auth_users_total,
  (SELECT count(*) FROM auth.users
     WHERE created_at >= now() - interval '24 hours') AS users_created_24h,
  (SELECT count(*) FROM auth.sessions) AS session_rows_total,
  (SELECT count(*) FROM auth.sessions
     WHERE created_at >= now() - interval '24 hours') AS sessions_created_24h,
  (SELECT count(*) FROM auth.sessions
     WHERE updated_at >= now() - interval '24 hours') AS sessions_updated_24h,
  (SELECT count(*) FROM auth.refresh_tokens
     WHERE created_at >= now() - interval '24 hours') AS refresh_tokens_created_24h,
  (SELECT count(*) FROM auth.audit_log_entries) AS audit_entries_all_time,
  (SELECT count(*) FROM auth.audit_log_entries
     WHERE created_at >= now() - interval '24 hours') AS audit_entries_last_24h;

-- Auth audit logs in PostgreSQL are an optional Supabase storage choice.
-- No session activity cannot rule out failed login attempts.
-- Do not toggle Auth audit-log storage or issue live Auth requests without review.
