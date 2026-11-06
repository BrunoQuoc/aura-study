# AURA STUDY — PHASE 3F-A
## Security Closure & Test-data Lifecycle Review

**Date:** 2026-11-06 (Asia/Ho_Chi_Minh)  
**Environment:** `aura-study-staging`, GitHub Pages `BrunoQuoc/aura-study`  
**Scope decision:** **STAGING TECHNICAL SECURITY EVIDENCE ACCEPTED; LIFECYCLE INVENTORY REVIEW COMPLETE; RELEASE-GATE EXCEPTIONS REMAIN OPEN.**  
**PRODUCTION:** **NO-GO**.

### 1. Confirmed results

| Gate | Evidence | State |
|---|---|---|
| Admin Turnstile positive → Magic Link → PKCE → Admin API | Browser E2E | PASS |
| Admin OTP negative CAPTCHA invalid/missing | Auth server returns `captcha_failed` twice | PASS 2/2 |
| Anonymous Student negative CAPTCHA invalid/missing | Auth server returns `captcha_failed` twice | PASS 2/2 |
| Anonymous Student positive CAPTCHA | Exactly one new Auth anonymous user; server `is_anonymous=true` | PASS |
| Unpaired Student RLS | 9/9 browser count-only queries return zero; seven seeded sources | PASS, with two empty-source limits |
| Graded Attempt and Verified Outcome with populated synthetic data | Transient PostgreSQL subtransaction, 1 synthetic final result | **PASS; rolled back** |
| Auth audit log visibility | 24-hour aggregated Auth and edge logs are queryable | VERIFIED |
| Auth 429 limit enforcement and alert notification | No 429 recorded; no controlled threshold test or alert delivery | OPEN |
| Leaked-password protection | Supabase Pro-plan gating; disabled | OPEN |
| Managed test identity inventory and dependencies | SQL read-only post-test audit | REVIEW COMPLETE; retention follow-up due |

### 2. Scored outcomes isolation — no persisted grades

A controlled STAGING SQL test inserted exactly one **synthetic** `GRADED_FINAL` record only within a PostgreSQL exception subtransaction, then forced the subtransaction to roll back.

| RLS actor | Synthetic Exam Attempt visible | Synthetic Verified Outcome visible |
|---|---:|---:|
| Authorized Admin (`authenticated` + own UID) | **1** | **1** |
| Existing tagged anonymous UID without a Student pairing | **0** | **0** |

The same unpaired user saw **0 Learner records**. After rollback, the independent lifecycle audit confirmed **0 persisted Attempts and 0 Verified Outcomes**. This closes the previous gap where both scored-data sources were empty during the 9/9 browser test, **for the database-role simulation exercised here**. An additional production-grade end-to-end test with JWTs and graded fixtures may still be part of independent pre-release evaluation.

Reusable, controlled script: `supabase/audits/aura_phase3fa_graded_isolation_rollback.sql`. Run only on STAGING, never remove the forced rollback.

### 3. Test-data lifecycle — account review, no deletion

One approved positive anonymous account was created on **2026-11-06 07:14 UTC**. The page included two explicit operator consents and uses test metadata only as an **inventory hint**, not an authorization claim. Editable `user_metadata` is not trustworthy for access control or as a sole deletion criterion.

**Independent read-only inventory:**

| Measure | Observed |
|---|---:|
| Total Auth users | 6 |
| Anonymous Auth users | 5 |
| Tagged Phase3F-A positive test identities | **1** |
| Active paired Student devices (overall) | **1**, unchanged |
| Tagged account: total Student device links | **0** |
| Tagged account: Learning Events | **0** |
| Tagged account: Auth sessions | **1** |
| Tagged account: refresh token records | **1** |
| Tagged account: identities / MFA factors | **0 / 0** |
| Learning Events (overall) | **13** |
| Attempts / Verified Outcomes persisted | **0 / 0** |
| Summary views configured `security_invoker=true` | **3 / 3** |

**30-day review date:** **2026-12-06 07:14 UTC (14:14 Vietnam time)**. This is a **manual review milestone, not an automatic deletion instruction or pre-approval for deletion**.

At review, an authorized operator must privately resolve the exact Auth identity, verify the user is still unpaired and contains no linked learner/device/event, inspect sessions/refresh tokens and other dependencies, and check audit/backup/retention requirements. Require recorded owner and independent reviewer approval before any retention or cleanup decision. Never delete by using only a user-editable metadata marker. Deleting an Auth user alone does not instantly invalidate every already-issued JWT; revoke sessions and assess expiry as part of a separately approved procedure.

**No account, session, refresh token, pairing or Learning Event was deleted/revoked during this phase.**

Reusable inventory: `supabase/audits/aura_phase3fa_security_closure_readonly.sql`. The earlier lifecycle dry-run remains available as well.

### 4. Auth observability baseline (latest available 24-hour log window)

Aggregated `auth_logs` and `edge_logs` show:

- **4** occurrences of `captcha_failed` (matching the controlled 2 Admin + 2 anonymous negative test cases).
- `/auth/v1/otp` HTTP 400: **2**; `/auth/v1/signup` HTTP 400: **2**.
- Observed HTTP **429: 0** in the queried Auth logs/edge logs.
- Observed Auth HTTP **5xx: 0** in the queried window.

This supports **log visibility**, not verification that the rate-limit threshold was reached, or that an automated alert exists. The source window is limited to logs available through the project connector and the last 24 hours by default.

Reproducible ClickHouse (NOT PostgreSQL) query:
`supabase/audits/aura_phase3fa_auth_logs_monitor.sql`.

**Operational monitoring proposal — unapproved until an owner configures it:**

| Event / condition | Suggested response |
|---|---|
| Auth 5xx in STAGING | Check impact, logs, provider health and Auth error-rate trend |
| Sustained `captcha_failed` or repeated 429 | Investigate without exposing IP, email, JWT, tokens or raw request payload in reports |
| More than one newly tagged Phase3F-A positive identity | Investigate unauthorized retest or accidental re-creation |
| Test identity gains pairing, learner links or Learning Events | Freeze additional testing, inspect RLS and incident scope |
| Active paired Student count changes unexpectedly | Compare against authorized device lifecycle actions |

Choose alert thresholds, recipients, retention duration and ownership before configuring real notifications. Do **not** stress the Auth endpoints simply to force 429; run controlled dedicated load tests only with an approved window and test identities. The rate-limit settings observed on the Dashboard were 30 anonymous sign-ins/hour/IP; 30 verifications/5 minutes/IP; 150 refreshes/5 minutes/IP; 2 built-in emails/hour, plus other limits recorded in the Phase3F-A rate-limits report.

### 5. Supabase security advisory disposition

At review, Supabase Security Advisor continued to show:
- **6 WARN findings** `auth_allow_anonymous_sign_ins`: intentionally enabled for Student device enrollment, but requires continuous CAPTCHA, rate limits, RLS, monitoring and abuse policy.
- **1 WARN** `auth_leaked_password_protection`: unavailable under the current plan; formally record plan upgrade or owner/security-approved compensating controls. Do not misrepresent CAPTCHA as a replacement for breached-password screening.
- **2 INFO** `rls_enabled_no_policy`: require explicit sign-off that deny-by-default is intended.

None of these advisor results was silently waived. No Auth protection setting, RLS policy or GitHub Pages login flow was changed during this closure audit.

### 6. Closure decision and next actions

**Accepted on STAGING:** CAPTCHA positive/negative behavior; Admin and Student unpaired authorization; populated synthetic scored outcome isolation with rollback; test-account inventory and dependency report; log visibility.

**Still not accepted:** actual 429 enforcement/alert delivery and monitored owner; plan-gated breached-password protection or formally approved disposition; production environment policy parity/security review; test-user lifecycle decision at the future 30-day review.

The GitHub Release Manifest's overall `ANONYMOUS_AUTH_ABUSE` and `PASSWORD_BREACH_PROTECTION` gates remain **OPEN**; `production_release_approved=false`.

Do not start Phase 3F production release from this report. Treat this Phase3F-A audit as **completed with documented exceptions**, not as a PRODUCTION security clearance.

### Sources

- [Supabase Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Supabase Rate Limits](https://supabase.com/docs/guides/auth/rate-limits)
- [Supabase Auth Security](https://supabase.com/docs/guides/auth/auth-captcha)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)

### 7. Tracked review

**GitHub Issue #11** tracks the STAGING anonymous test-account 30-day review due 2026-12-06: https://github.com/BrunoQuoc/aura-study/issues/11. This ticket is for operator tracking only: it does not schedule a reminder, trigger a cleanup job, or pre-authorize a delete.
