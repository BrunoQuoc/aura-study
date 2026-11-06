# AURA STUDY — Phase 3F-B1
## Auth Monitoring Baseline & Safe HTTP 429 Simulation

**STAGING ONLY.** 2026-11-06. Source snapshot captured at **2026-11-06 07:52:51 UTC** (14:52:51 Vietnam time), using the connected Supabase STAGING read-only tools. Logs are a rolling 24-hour sample, not an alert service. **Production: NO-GO.**

### 1. Verified monitoring baseline

- Query: `supabase/audits/aura_phase3fb1_auth_monitor_24h.sql` (Supabase Logs Explorer / ClickHouse, NOT PostgreSQL).
- Query explicitly filters to `timestamp >= now() - INTERVAL 24 HOUR`.
- First / last timestamps in available sampled log stream: `2026-11-05T08:09:05.487000` and `2026-11-06T07:29:57.677000`; timestamps presented as returned by Logs Explorer.
- **349 log rows** in the rolling sample. This is the number of log records, **not HTTP 429 events**.

| Metric | Observed |
|---|---:|
| `captcha_failed` in Auth logs | 4 |
| HTTP 400 on Auth OTP endpoint | 2 |
| HTTP 400 on Auth signup endpoint | 2 |
| Auth-service HTTP 429 | 0 |
| Auth edge HTTP 429 | 0 |
| Auth edge 5xx | 0 |

The four `captcha_failed` entries are consistent with known controlled Admin and anonymous negative CAPTCHA tests, **not proof of absence of attacks**. Zero observed HTTP 429 neither confirms nor disproves actual server rate-limit enforcement; no threshold stress test has been performed.

Independent read-only database snapshot:
- Auth users: **6 total / 5 anonymous**.
- Active paired Student devices: **1**.
- Learning Events: **13**; Exam Attempts: **0**.
- Tagged Phase 3F-A positive anonymous test users: **1**.
No account, session, device, learner or Learning Event was changed to collect this baseline.

### 2. Pure offline HTTP 429 simulation

Files:
- `auth/phase3fb1-rate-limit-policy.js`: deterministic error classifier and synthetic Auth handler.
- `auth/phase3fb1-safe-429-simulation.html`: browser test on the official GitHub Pages STAGING path; imports only the local static policy module, **no Supabase client**.
- `tests/phase3fb1-auth-monitoring.test.mjs`: Node 20 offline contract checks.
- `.github/workflows/aura-phase3fb1-auth-monitoring.yml`: manual-only `workflow_dispatch`; no Auth credentials, traffic-generation scripts, background tasks or live API calls.

The test stubs exactly one HTTP 429 response (`over_request_rate_limit`, synthetic `Retry-After: 60`) per simulated flow:
1. Admin Magic Link / OTP.
2. Student anonymous signup.
3. Auth token refresh.

All three are expected to yield `RATE_LIMITED`, `automaticRetries=0`, `actualAuthRequests=0`, `newAuthUsers=0`, and a preserved paired-Student session sentinel. The classifier also distinguishes `captcha_failed` from 429 and rejects out-of-range retry-after values. The page is one-shot per load and runs **no real Supabase request**.

**Verification completed:** Independent static and pure-function checks in the development session **16/16 PASS**, including browser JavaScript parse and strict absence of Auth network calls/storage in the page. This is **not** a GitHub Actions CI run or live user browser result.

**What this does NOT prove:**
- Actual AURA STUDY login UI is already wired to this policy.
- Supabase server returns 429 at configured thresholds.
- Alerting, on-call escalation, notification delivery or capacity has been verified.
- Existing Student session is protected in all real application transitions.

Those are separate acceptance requirements, not covered by a standalone mock.

### 3. Operator browser acceptance

Visit:

https://brunoquoc.github.io/aura-study/auth/phase3fb1-safe-429-simulation.html

Click **Chạy mô phỏng 429 (không gọi mạng Auth)** once. Expected output:
- Admin OTP / Magic Link — PASS.
- Student anonymous signup — PASS.
- Auth token refresh — PASS.
- CAPTCHA classification distinct from rate limit — PASS.
- **KẾT LUẬN — 4/4 PASS**.

Send a screenshot of the result panel only. No email/JWT/OTP, Supabase API keys or pairing code is required. If the page is not yet published, wait for GitHub Pages to deploy and reload.

### 4. Remaining B1 exit gate

- [x] PII-free 24h Auth log baseline queried and committed as a reproducible aggregate query.
- [x] Read-only Auth + learner event inventory checked without mutation.
- [x] Safe 429 simulation and offline contract suite committed; 16/16 local checks PASS.
- [x] GitHub Pages browser evidence for `4/4 PASS` (operator screenshot).
- [ ] Integrate reviewed 429 handling into the real AURA STAGING Auth client (separate guarded change and regression test).
- [x] Second snapshot read approximately ten minutes later: 349 rows and identical Auth errors. A repeatability check, not operational monitoring.
- [ ] Named monitoring owner, independent backup and reporting cadence accepted.
- [ ] Delivered alert and/or approved interim manual-monitoring exception.
- [ ] Real Supabase 429 threshold test only with an independently approved bounded plan.

**Decision: B1 BASELINE ACCEPTED; 429 MOCK IMPLEMENTED / USER BROWSER PENDING; REAL 429, ALERTING and PRODUCTION OPEN.**

### 5. Governance and follow-ups

- [Phase 3F-B runbook](https://github.com/BrunoQuoc/aura-study/blob/main/docs/staging-auth-monitoring-incident-phase3fb.md).
- [Phase 3F-B issue #12](https://github.com/BrunoQuoc/aura-study/issues/12).
- [Phase 3F-A test-account review issue #11](https://github.com/BrunoQuoc/aura-study/issues/11) due **2026-12-06**, **not** an automatic cleanup.
- [Production gates](https://github.com/BrunoQuoc/aura-study/blob/main/release/phase3f-production-gates.json) remain **11 OPEN / 3 STAGING_PASS** with `production_release_approved=false`.

References:
- https://supabase.com/docs/guides/auth/rate-limits
- https://supabase.com/docs/guides/auth/debugging/error-codes
- https://supabase.com/docs/guides/observability/log-drains


### 6. B1 browser result accepted

Operator screenshot confirms **4/4 PASS** in mock-only STAGING browser: Admin OTP, anonymous signup, refresh token and CAPTCHA-vs-429 differentiation. Simulated flows report no Auth API calls, no automatic retries and no new accounts. This does not certify actual Supabase 429 or live login UI integration.

A second Auth snapshot at 2026-11-06 08:02:41 UTC had the same 349 rows as 07:52:51 UTC and no new underlying log timestamp. B2 ownership and notification receipt remain OPEN. Tracking: [Issue #12](https://github.com/BrunoQuoc/aura-study/issues/12). PRODUCTION NO-GO.
