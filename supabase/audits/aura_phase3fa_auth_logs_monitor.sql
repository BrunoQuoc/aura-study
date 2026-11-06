-- AURA STUDY Phase 3F-A: Auth abuse monitoring SNAPSHOT
-- This is ClickHouse SQL for Supabase unified logs (query_logs / Logs Explorer).
-- It is NOT PostgreSQL SQL; do not execute using the SQL Editor.
-- Last 24 hours by default when run through Supabase query_logs.
-- Aggregated counts only, no IPs, emails, user IDs, access tokens or raw errors.
-- This is NOT an alerting rule and does NOT trigger 429 to stress-test Auth.

SELECT
 countIf(source='auth_logs' AND log_attributes['error_code']='captcha_failed')
   AS captcha_rejections,
 countIf(source='auth_logs' AND log_attributes['status']='429')
   AS auth_log_429,
 countIf(source='edge_logs'
   AND startsWith(log_attributes['request.path'],'/auth/v1/')
   AND log_attributes['response.status_code']='429')
   AS auth_edge_429,
 countIf(source='edge_logs'
   AND log_attributes['request.path']='/auth/v1/signup'
   AND log_attributes['response.status_code']='400')
   AS signup_http_400,
 countIf(source='edge_logs'
   AND log_attributes['request.path']='/auth/v1/otp'
   AND log_attributes['response.status_code']='400')
   AS otp_http_400,
 countIf(source='edge_logs'
   AND startsWith(log_attributes['request.path'],'/auth/v1/')
   AND startsWith(log_attributes['response.status_code'],'5'))
   AS auth_http_5xx
FROM logs
WHERE source IN ('auth_logs','edge_logs');

-- Interpret:
-- 4 known captcha_failed results in current STAGING test window reflect
-- two Admin OTP and two anonymous negative requests, not a real-world abuse
-- incidence rate. The HTTP 400 counts are aggregate and should not be used
-- to identify end users or prove a specific cause without appropriate audit.
-- A 429 count of zero proves only that no such response was seen in available
-- logs during the selected window. Threshold enforcement/alert delivery
-- are NOT tested. Preserve this distinction in release governance.
