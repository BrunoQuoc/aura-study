-- AURA STUDY — Phase 3F-B2 STAGING ONLY
-- Run in Supabase Logs Explorer (ClickHouse), NOT PostgreSQL SQL Editor.
-- READ-ONLY aggregate counts by log source for latest 24 hours; no user-identifying data.
SELECT
  source,
  count() AS rows_in_last_24h,
  min(timestamp) AS first_log_ts,
  max(timestamp) AS last_log_ts
FROM logs
WHERE timestamp >= now() - INTERVAL 24 HOUR
GROUP BY source
ORDER BY rows_in_last_24h DESC, source ASC;
-- Note: absence of auth_logs/edge_logs may indicate zero traffic, configuration,
-- retention or ingestion gaps. It is NOT evidence that Auth is healthy.
