# AURA STUDY — PHASE 3E
## Operational Security, Test-data Lifecycle & Production Readiness Gates

**Date:** 2026-11-05  
**Environment:** Supabase `aura-study-staging` + GitHub `BrunoQuoc/aura-study`  
**Decision:** **STAGING SECURITY REGRESSION PASS; MOCK CHAOS SUITE PASS; PRODUCTION RELEASE BLOCKED.**  
No Auth config, RLS policy, data retention settings, production infrastructure, or existing learner records were changed in Phase 3E.

### 1. Existing state reviewed

Snapshot from STAGING:
- 8 public AURA business tables with RLS enabled.
- 5 Auth users, 4 anonymous users.
- 1 household, 1 learner, 1 active Student device, 3 previously revoked test devices.
- 2 published synthetic content items, 13 learning events, 11 events marked `payload.test=true`, 0 persisted exam attempts.
- 3 anonymous Auth users with no currently active paired device, to be reviewed **without automatic deletion**.
- 3 `security_invoker=true` projection views for learning progress, daily activity and verified outcomes, SELECT denied to unauthenticated `anon`.
- Direct client SELECT on internal allowlist and pairing request tables is denied.
- Public privileged Admin/pairing RPCs have EXECUTE revoked from `anon` and `authenticated`; Edge Function is the public control plane.
- Event ingest rate guard remains enabled (60/min/device; 1,000/24h/device); no user-visible production SLA is implied.

### 2. Security regression — PASS

Run as a SQL transaction with rollback. Test SQL versioned at:
`supabase/tests/aura_phase3e_security_regression.sql`.

Checks:
- DB constraint rejects releasing unverified `GRADED_FINAL` results.
- DB constraint rejects nonfinal `ADMIN_VERIFIED` result release.
- Student sees only verified AND released final attempt; unreleased and provisional attempts remain hidden.
- Parent can review its own three temporary attempt rows.
- Client authenticated role has no direct INSERT/UPDATE/DELETE on attempts.
- Unpaired account sees no attempt/outcome rows.
- Simulated revoked device sees no attempt/outcome rows.
- Direct privileged RPC calls unavailable to client roles.

No temporary attempts or revoked-device changes were committed.

### 3. Reliable Sync chaos suite — PASS in mocked environment

Browser test source: `phase3e/chaos-tests.js`; UI: `phase3e/index.html`.

The suite uses random mock-only UUIDs and a simulated Supabase client, never contacts the live endpoint:
1. **Server accepted event, response lost:** first request simulated as committed/timeout; retry gets duplicate key and exact-match read, returns `already_recorded`. Exactly one mock server record.
2. **Transient failures:** eight unsuccessful requests → review state; ninth flush does not re-transmit.
3. **Account switched:** queued events marked blocked; no server writes.
4. **Device revoked:** queued events marked blocked; no server writes.

The suite ran successfully in a V8 JavaScript harness with simulated IndexedDB transaction semantics: **4/4 PASS**, 0 remote Supabase writes, 0 mock queue rows left. Browser behavior has **not** yet been independently certified for these tests. Running the GitHub Pages UI is a separate E2E gate.

Important distinction: an event blocked/reviewed locally is not automatically deleted and must not be silently retried with a different Student identity. This is fail-closed behavior, but long-term operational management of such records still requires an approved policy.

### 4. Supabase Security Advisor — NOT CLEARED

| Finding | Current handling | Production decision |
|---|---|---|
| Anonymous sign-ins allowed | Intentional STAGING Student bootstrap; RLS checks paired device/learner authorization | **Open** — auth signup abuse controls, quota, detection, per-user/device threat model required |
| Leaked password protection disabled | Warning exists; exact Admin/password provider configuration must be verified before deciding impact | **Open** — enable or formally document a passwordless-only exception |
| RLS enabled with no direct policy on allowlist/pairing requests | Deliberate default-deny and backend-controlled flows; no direct client SELECT | Review & formally document, not a reason to grant broad policies |

These findings are not evidence of a proven data breach, but ignoring them would be unsuitable for production.

### 5. Test-data lifecycle proposal — NOT AUTHORIZED

| Category | Current situation | Proposed review trigger | Rules |
|---|---|---|---|
| Synthetic content (`AURA_STAGING_PHASE3B:*`) | 2 items | 30 days after phase sign-off | Preserve until all dependent test evidence/foreign keys inventoried |
| STAGING diagnostic events | 13 total events, includes 11 `test:true` | 30 days after sign-off | Only target exact source markers and verified IDs; preserve audit evidence separately |
| Revoked Student devices | 3 historical | 30-day review cycle | Keep FK/audit records until approved, do not touch active device |
| Orphan anonymous Auth accounts | 3 currently lacking active device | After ownership/session review | Require FK dependency map, session invalidation plan and explicit approval |
| Browser IndexedDB queues | owner+device scoped | 6-day send eligibility; 8 failed attempts → review | Never silently purge unsent real events; shared-device privacy requires policy |
| Logs and operational evidence | Supabase/GitHub | To be agreed | Redact tokens, pairing codes and PII; choose appropriate audit retention |

**Review age is not authorization to delete.** No DELETE, TRUNCATE, anonymous-user cleanup, device revocation or session invalidation has been executed for Phase 3E.

Cleanup change request must include: owner, exact environment, exact target IDs/counts (in a secure channel), DB/credential dependencies, rollback/backup plan, dry-run output, explicit approval, execution log, and post-cleanup verification. Do not place credentials or private identifiers in public GitHub issues.

Read-only inventory: `supabase/audits/aura_phase3e_release_readiness_dry_run.sql`.

### 6. Operational security and production readiness gates

| Gate | Acceptance evidence required | Status |
|---|---|---|
| G1 — Authorization & grading integrity | Role/RLS regression + actual E2E controls | **PASS for current STAGING tested scope** |
| G2 — Reliable queue logic | Mock chaos suite PASS | **PASS in mock only** |
| G3 — Real-network resilience | Client expiry, revoked JWT with queued events, 503/timeouts, mobile storage eviction, long offline periods | **OPEN** |
| G4 — Shared device/privacy threat model | Browser session isolation, cache metadata protection, logout/pairing lifecycle, XSS/dependency security | **OPEN** |
| G5 — Auth and abuse | Advisor triage, password leak warning disposition, anonymous signup protection, sign-in monitoring | **OPEN** |
| G6 — Data Governance | Retention policy, data-subject/guardian rights, approved cleanup/rollback procedure, log hygiene | **OPEN** |
| G7 — Operations & recovery | Backup/restore evidence, access logging/alerts, incident runbook, migration rollback, key separation | **OPEN** |
| G8 — Production approval | Independent security and product signoff after every gate, no STAGING data copied | **BLOCKED** |

A STAGING PASS is not automatically a PRODUCTION PASS. The existing `authenticated` Postgres role includes anonymous signed-in users; every exposed policy must authorize by paired owner/device, not role alone.

### 7. Immediate browser acceptance test

On the same GitHub Pages origin, open `phase3e/index.html` and click **Chạy bộ kiểm thử lỗi mạng giả lập**. Expect 4/4 PASS with no Supabase writes. If it fails, do not attempt production promotion. Send only redacted failure text/screenshot.

Remaining true-browser chaos scenarios need a controlled runbook; never revoke the original Student device without explicit agreement and a safe test fixture.

### 8. Final decision

**Phase 3E implementation for audit/readiness and mock chaos is delivered. The release review is NOT signed off; PRODUCTION stays BLOCKED.** No production switch is authorized by this document.
