# AURA STUDY — PHASE 3F
## Security Remediation & Release Governance

**As-of:** 2026-11-05 (Asia/Ho_Chi_Minh)  
**Scope:** Supabase `aura-study-staging`, GitHub `BrunoQuoc/aura-study`  
**Decision:** **PRODUCTION NO-GO**. No learner-production data, no Auth config changes, no data cleanup or deployment performed.

### 1. Verified STAGING inventory

- 5 Auth accounts: **1 email-provider account with a stored password hash**, **4 anonymous accounts**. No passwords or hashes were retrieved or displayed.
- 1 household, 1 learner, **1 active paired Student device** and 3 historically revoked test devices.
- 2 synthetic published Phase3B Knowledge Library items, 13 Learning Events, 0 exam attempts.
- 8/8 public AURA business tables have RLS. Three RLS invoker read-model views are deployed.
- 0 active unredeemed pairing codes.
- Supabase Edge Function `aura-identity-pair` is active with JWT verification enabled.
- 3 anonymous users have no currently active paired device. **All 4 anonymous users have historical pairing records**; 1 is linked to existing events. There are 0 accounts older than 30 days. Do not treat those 3 as automatically safe to delete.
- Performance Advisor: **7 informational findings for unindexed foreign keys**; require workload-informed review, not blind index creation.

### 2. Auth/RLS security findings — remediation decisions

| Finding | Observed fact | Required remediation / owner action | State |
|---|---|---|---|
| Anonymous sign-in access warnings (6 policies) | Anonymous users intentionally receive Postgres `authenticated` role. AURA's existing RLS checks pairing/learner ownership, not membership in the role alone. | Maintain pairing checks; add anti-bot challenge and review per-IP anonymous sign-in limits; negative-test cross-household and revoked JWT. Document warnings as reviewed exceptions if permitted. | **OPEN** |
| Password breach protection disabled | One Admin/email-provider Auth record has a password hash. Passwordless-only assumption is NOT established. | Verify whether password sign-in is enabled. Turn on leaked-password protection if available, or disable unused password sign-in and adopt an approved documented compensating control. Validate existing Admin Magic Link. | **OPEN** |
| RLS enabled/no policies (2 internal tables) | `aura_admin_email_allowlist` and `aura_pairing_requests` intentionally have no direct client RLS policies. Client GRANT and security regression must remain default-deny. | Record as intentional restricted backend tables, after independent review of Edge Function permissions; do NOT grant permissive policies merely to clear INFO warnings. | **REVIEW REQUIRED** |
| Offline metadata and shared devices | IndexedDB queues/context are not separately encrypted and can remain on a shared browser profile. | Design logout/clear-device contract, session revocation, device binding, and data-at-rest / kiosk policies; test multiple browser profiles. | **OPEN** |
| Login/OTP and abuse limits | No approved Auth rate-limit/CAPTCHA config evidence currently available. | Review Auth dashboard and configure safe limits/Turnstile or hCaptcha with UI support. Test 429/retry, Admin Magic Link and anonymous pairing. | **OPEN** |

Important: **do not enable server-side CAPTCHA by itself before the Student client sends a valid challenge token.** Otherwise `signInAnonymously()` may fail and the current STAGING onboarding flow can break. Roll out UI challenge + Auth setting together, using a test device. Do not publish CAPTCHA secret keys in GitHub; public site key is not a secret.

Supabase documentation:
- Anonymous sign-ins and pairing: https://supabase.com/docs/guides/auth/auth-anonymous
- CAPTCHA configuration and frontend integration: https://supabase.com/docs/guides/auth/auth-captcha
- Auth rate limits: https://supabase.com/docs/guides/auth/rate-limits
- Leaked password protection (plan-dependent): https://supabase.com/docs/guides/auth/password-security
- Production checklist: https://supabase.com/docs/guides/deployment/going-into-prod

**No management action for Auth/CAPTCHA was executed in Phase3F** because the currently connected tools do not expose the applicable project Auth configuration write/read operation and coordinated UI change was not ready. Treat these as blockers, not remediated controls.

### 3. Non-destructive STAGING test-data lifecycle

Read-only dependency report:
`supabase/audits/aura_phase3f_retention_candidates_dry_run.sql`.

Classification:

| Category | Suggested review trigger, not automatic deletion | Extra guard |
|---|---|---|
| Diagnostic events with `test:true` | 30 days after respective acceptance | Must verify event IDs and authored-user/device FKs |
| Linked Phase3B synthetic progress events | 30-day manual review | They intentionally count in STAGING progress; do not remove before tests/evidence retention |
| STAGING-only content | 30-day manual review | 2 items currently referenced by events; preserve dependencies |
| Revoked Student devices | 30-day manual review | Historical pairing/event dependencies and security audit |
| Anonymous accounts without active devices | 30-day ownership/session review | All 4 have pairing history; active refresh tokens and sessions must be checked |
| Offline local queue | 6-day eligibility; review after 8 failed retries | Do not silently discard unsent real events; specify an approved local-clear workflow |
| Logs, RLS test records | Defined in data governance policy | Redact tokens, raw learner data, pairing codes |

Required data cleanup approval sequence:
1. Confirm environment and category; identify an authorized data owner and independent reviewer.
2. Run read-only dependency inventory, verify exact candidate IDs/counts through secured operator workflow.
3. Preserve a backup/snapshot and audit evidence; define rollback and session-invalidation plan.
4. Confirm the cleanup does not target the active Student, learner or household.
5. Record explicit approval specifying retention/legal/privacy obligations and exact data subset.
6. Execute a separate approved change (never from this document), then perform post-change counts and RLS checks.
7. Update audit/sign-off evidence, without exposing PII/secrets in public files.

**No DELETE, UPDATE, TRUNCATE or Auth-user removal was executed here.** Do not copy synthetic STAGING data to PRODUCTION.

### 4. Release controls delivered

- `release/phase3f-production-gates.json` — versioned 14-gate evidence register. Current: 3 `STAGING_PASS`, 11 `OPEN`; target remains STAGING, production approval false.
- `scripts/phase3f-release-gate.mjs` — deterministic, fail-closed policy validator. A successful production decision requires **all 14 PROD_PASS**, independent Security/Product approval links, a pinned release commit SHA and explicit production approval.
- `tests/phase3f-release-gate.test.mjs` — negative unit tests for missing gates, duplicated gates, evidence and sign-offs.
- `.github/workflows/aura-phase3f-production-readiness.yml` — manual-only GitHub Actions checker with read-only repository permissions. It has **no deploy step**, production secrets or Supabase write access. The final step is expected to fail (NO-GO) while any gate is OPEN.
- `release/index.html` — read-only status dashboard, refuses to display GO when manifest is missing.
- `supabase/audits/aura_phase3f_retention_candidates_dry_run.sql` — no-PII, no-write inventory.

**These are governance guards, NOT a deployed production access control or proof that approvals are genuine.** The validator checks record structure, not existence/authenticity of linked evidence. Before production, make the deployment workflow depend on this required check; enable protected production environments/branch rules and require independent human review. Current GitHub repository has no workflow that actually deploys PRODUCTION, so no deployment control was altered.

### 5. Required production gates (G1–G14)

1. RLS & tenant isolation: STAGING tested; repeat production-config review.
2. Verified outcomes and grading: STAGING tested; server-authoritative workflow required.
3. Offline idempotency: STAGING tested; release-grade chaos incomplete.
4. Anonymous Auth abuse protection: **OPEN**.
5. Password breach protection or documented approved alternative: **OPEN**.
6. Shared-device session privacy: **OPEN**.
7. Actual expired JWT/revoked device/503/eviction failure injection: **OPEN**.
8. Retention and authorized cleanup: **OPEN**.
9. Performance and capacity: **OPEN**, 7 unindexed FK findings to assess.
10. Backup/restore drill and recovery objectives: **OPEN**.
11. Monitoring and incident response ownership: **OPEN**.
12. Dependency, API key and secrets audit: **OPEN**.
13. Independent Security sign-off: **OPEN**.
14. Product owner and release sign-off: **OPEN**.

### 6. Operations runbook (minimum)

**Auth abuse detected:** stop test account creation, review anonymized Auth rate-limit and HTTP 429 trends, preserve audit evidence, coordinate rate-limit/CAPTCHA changes and rollback. Never post OTP/JWT or full IP logs publicly.

**Offline queue blocked or review:** do not generate a new event ID to bypass server errors. Verify current JWT and device binding, inspect error class and timestamp window, reconcile against existing event_id. Preserve unsent events pending a documented retention decision.

**Access revoked with queued events:** server RLS is authoritative; local queued records must remain blocked or be cleared only under approved guardian/device policy, not synced through a different user identity.

**Missing/corrupt browser storage:** inform the operator that unsent offline telemetry may be unrecoverable; do not fabricate progress or scores. Rebuild only from trusted server events and verified outcomes.

**Database outage/restore:** assign incident commander, set change freeze, validate most recent backup availability, restore to isolated test project, verify RLS/policies/functions and event counts before considering production recovery. Backup existence or restore success is NOT yet evidenced.

**Release rollback:** freeze event schema and migrations, use a versioned and tested rollback/re-deploy plan, preserve event IDs, never copy synthetic STAGING data to production.

### 7. Current decision

**PHASE 3F — SECURITY AUDIT / RELEASE GOVERNANCE ARTIFACTS DELIVERED.**

**Security remediation not complete:** CAPTCHA, Auth rate settings, password protection and operational controls remain OPEN. **Production release: NO-GO.**

Only resume with a scope-approved security remediation and an independently reviewed release checklist; never interpret earlier STAGING acceptance as full production readiness.
