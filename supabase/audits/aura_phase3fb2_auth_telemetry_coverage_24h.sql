-- AURA STUDY Phase 3F-B2 — STAGING ONLY.
-- Supabase Logs Explorer (ClickHouse SQL); do NOT run in PostgreSQL SQL Editor.
-- Read-only aggregate. Does not return request URL query strings, payloads,
-- tokens, IP addresses, emails, user IDs or event messages.
SELECT
  countIf(source = 'auth_logs') AS auth_service_log_rows_24h,
  countIf(source = 'auth_audit_logs') AS auth_audit_log_rows_24h,
  countIf(source = 'edge_logs') AS gateway_log_rows_24h,
  countIf(source = 'edge_logs'
    AND startsWith(log_attributes['request.path'],'/auth/v1/')) AS gateway_auth_path_rows_24h,
  countIf(source = 'edge_logs'
    AND log_attributes['request.path']='/auth/v1/health') AS gateway_auth_health_rows_24h,
  countIf(source = 'edge_logs'
    AND log_attributes['request.path'] IN
    ('/auth/v1/otp','/auth/v1/signup','/auth/v1/token',
     '/auth/v1/verify','/auth/v1/user')) AS selected_auth_interaction_rows_24h,
  countIf(source = 'edge_logs'
    AND startsWith(log_attributes['request.path'],'/auth/v1/')
    AND log_attributes['response.status_code']='429') AS auth_edge_http429_rows_24h,
  countIf(source = 'edge_logs'
    AND startsWith(log_attributes['request.path'],'/auth/v1/')
    AND startsWith(log_attributes['response.status_code'],'5')) AS auth_edge_http5xx_rows_24h
FROM logs
WHERE source IN ('auth_logs','auth_audit_logs','edge_logs')
  AND timestamp >= now() - INTERVAL 24 HOUR;

-- A zero count does NOT prove the log integration is working or that Auth is healthy.
-- Auth interactions can occur at routes not in the fixed example set above;
-- counts are diagnostics only, not exhaustive endpoint coverage.
