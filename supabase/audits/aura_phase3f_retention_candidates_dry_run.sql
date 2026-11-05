-- AURA STUDY PHASE 3F: non-destructive STAGING retention/dependency inventory.
-- This file is ALWAYS READ ONLY. No IDs, PII, OTP, JWT, pairing codes or raw payload.
-- Candidate counts are for manual review, NOT deletion instructions.
BEGIN READ ONLY;

-- Current STAGING safety baseline. This report does not assess actual backup readiness.
SELECT
 (SELECT count(*) FROM public.aura_households) AS households,
 (SELECT count(*) FROM public.aura_learners) AS learners,
 (SELECT count(*) FROM public.aura_student_devices WHERE revoked_at IS NULL) AS active_students,
 (SELECT count(*) FROM public.aura_student_devices WHERE revoked_at IS NOT NULL) AS revoked_test_devices,
 (SELECT count(*) FROM auth.users WHERE is_anonymous) AS anonymous_auth_users,
 (SELECT count(*) FROM public.aura_content_items WHERE source_ref LIKE 'AURA_STAGING_PHASE3B:%') AS phase3b_synthetic_content,
 (SELECT count(*) FROM public.aura_learning_events) AS total_events,
 (SELECT count(*) FROM public.aura_attempts) AS attempts;

-- "Orphan anonymous user" must not be treated as automatically safe to delete:
-- actor FK and event/device records, pairing history, sessions and refresh tokens
-- can still depend on that identity. Count dependencies without exposing identities.
WITH user_dependencies AS (
 SELECT u.id,u.created_at,
  EXISTS(SELECT 1 FROM public.aura_student_devices d
    WHERE d.auth_uid=u.id AND d.revoked_at IS NULL) AS active_device,
  EXISTS(SELECT 1 FROM public.aura_student_devices d
    WHERE d.auth_uid=u.id) AS any_device,
  EXISTS(SELECT 1 FROM public.aura_learning_events e
    WHERE e.actor_uid=u.id) AS authored_events,
  EXISTS(SELECT 1 FROM public.aura_pairing_requests p
    WHERE p.issued_by=u.id OR p.redeemed_by=u.id) AS pairing_history,
  EXISTS(SELECT 1 FROM public.aura_households h
    WHERE h.admin_uid=u.id) AS admin_link,
  EXISTS(SELECT 1 FROM auth.sessions s WHERE s.user_id=u.id) AS auth_session,
  EXISTS(SELECT 1 FROM auth.refresh_tokens r
    WHERE r.user_id=u.id::text AND coalesce(r.revoked,false)=false) AS active_refresh_token,
  EXISTS(SELECT 1 FROM auth.identities i WHERE i.user_id=u.id) AS auth_identity
 FROM auth.users u WHERE u.is_anonymous
)
SELECT
 count(*) AS anonymous_accounts,
 count(*) FILTER(WHERE active_device) AS active_device_link,
 count(*) FILTER(WHERE NOT active_device) AS without_active_device_for_review,
 count(*) FILTER(WHERE any_device) AS historical_device_link,
 count(*) FILTER(WHERE authored_events) AS historical_event_actor_link,
 count(*) FILTER(WHERE pairing_history) AS pairing_history_link,
 count(*) FILTER(WHERE auth_session) AS auth_sessions_exist,
 count(*) FILTER(WHERE active_refresh_token) AS active_refresh_tokens_exist,
 count(*) FILTER(WHERE auth_identity) AS identity_records_exist,
 count(*) FILTER(WHERE created_at < now()-interval '30 days') AS older_than_30d,
 count(*) FILTER(
  WHERE created_at < now()-interval '30 days'
    AND NOT active_device AND NOT any_device AND NOT authored_events
    AND NOT pairing_history AND NOT admin_link
    AND NOT auth_session AND NOT active_refresh_token AND NOT auth_identity
 ) AS dependency_free_old_accounts_for_manual_review
FROM user_dependencies;

-- Source markers are not enough to authorize removal; note that Phase3B
-- learning events deliberately count into STAGING progress despite synthetic=true.
SELECT
 coalesce(e.payload->>'source','unmarked') AS event_source,
 count(*) AS rows,
 count(*) FILTER(WHERE e.payload->>'test'='true') AS test_flagged_rows,
 count(*) FILTER(WHERE e.received_at < now()-interval '30 days') AS over30d_for_review,
 count(*) FILTER(WHERE e.content_item_id IS NOT NULL) AS linked_content_rows
FROM public.aura_learning_events e
GROUP BY coalesce(e.payload->>'source','unmarked')
ORDER BY event_source;

-- Test-specific content/revocation inventory, again no actual IDs.
SELECT
 (SELECT count(*) FROM public.aura_content_items c
   WHERE c.source_ref LIKE 'AURA_STAGING_PHASE3B:%' AND
   EXISTS(SELECT 1 FROM public.aura_learning_events e WHERE e.content_item_id=c.id))
     AS synthetic_content_with_event_dependencies,
 (SELECT count(*) FROM public.aura_student_devices d
   WHERE d.revoked_at IS NOT NULL AND d.revoked_at<now()-interval '30 days')
     AS revoked_devices_over30d_for_review,
 (SELECT count(*) FROM public.aura_pairing_requests p
   WHERE p.redeemed_at IS NULL AND p.revoked_at IS NULL AND p.expires_at>now())
     AS currently_usable_pairing_requests;

ROLLBACK;
-- NO DELETE, UPDATE, TRUNCATE, DROP, auth.admin.deleteUser, or automatic cleanup.
