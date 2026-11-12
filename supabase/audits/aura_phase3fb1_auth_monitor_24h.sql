-- AURA STUDY Phase 3F-B1 — STAGING only
-- Supabase Logs Explorer / ClickHouse SQL; NOT PostgreSQL SQL Editor.
-- Read-only rolling 24-hour aggregate. No email, UID, IP, JWT or raw payload.
-- Outputs a snapshot for manual comparison; this is NOT an alert rule.
SELECT
  min(timestamp) AS first_log_ts,
  max(timestamp) AS last_log_ts,
  count() AS log_rows,
  countIf(source='auth_logs'
    AND log_attributes['error_code']='captcha_failed')
    AS captcha_failed,
  countIf(source='auth_logs'
    AND log_attributes['status']='429')
    AS auth_service_429,
  countIf(source='edge_logs'
    AND startsWith(log_attributes['request.path'],'/auth/v1/')
    AND log_attributes['response.status_code']='429')
    AS auth_edge_429,
  countIf(source='edge_logs'
    AND startsWith(log_attributes['request.path'],'/auth/v1/')
    AND startsWith(log_attributes['response.status_code'],'5'))
    AS auth_edge_5xx,
  countIf(source='edge_logs'
    AND log_attributes['request.path']='/auth/v1/otp'
    AND log_attributes['response.status_code']='400')
    AS otp_http_400,
  countIf(source='edge_logs'
    AND log_attributes['request.path']='/auth/v1/signup'
    AND log_attributes['response.status_code']='400')
    AS signup_http_400
FROM logs
WHERE source IN ('auth_logs','edge_logs')
  AND timestamp >= now() - INTERVAL 24 HOUR;

-- Cautions:
-- 0 observed 429 does not establish that limits work (or fail).
-- 4 captcha_failed can reflect intentional controlled negative tests.
-- Run at separate review times; two immediate runs do not demonstrate
-- monitoring cadence or actual alert delivery.
