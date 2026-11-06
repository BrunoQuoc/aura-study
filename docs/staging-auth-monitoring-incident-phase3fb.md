# AURA STUDY — PHASE 3F-B
## Auth Abuse Monitoring & Incident Response Readiness

**Status (2026-11-06): B1 mock browser 4/4 PASS; B2 offline tabletop and sanitized GitHub issue intake implemented; monitoring owner and real alert delivery PENDING.**  
**Environment: STAGING ONLY.**  
**Production approval: NO-GO.**

### 1. Entry conditions and verified baseline

Phase 3F-A closed its STAGING evidence review with the following facts:

- Admin and anonymous Student valid Turnstile Auth requests and missing/invalid CAPTCHA negative tests PASS.
- Existing unpaired Student cannot read learner data; a rollback-only synthetic graded attempt and verified outcome are readable by the Admin (1/1) and not by unpaired anonymous Student (0/0).
- 6 Auth users, 5 anonymous, 1 actively paired Student, 13 Learning Events, 0 persisted Exam Attempts or Verified Outcomes.
- One tagged Phase3F-A anonymous account remains for 30-day manual review. It has **1 Auth session and 1 refresh token** but no pairing or learning events.
- Last observed 24-hour Auth log snapshot: **4 captcha_failed**, **0 observed 429**, **0 Auth 5xx**, with 2 HTTP 400 each on the tested OTP and signup paths.
- Current Supabase Free/plan screenshot and official docs indicate **log drains require Pro/Team/Enterprise**, so no paid drain is to be configured without a separate approval.

These facts are **baseline, not evidence of an automated monitoring service**.

### 2. Phase 3F-B scope and execution order

| Track | Next concrete action | Acceptance evidence | Current state |
|---|---|---|---|
| B1. Auth log dashboard | Run the aggregate-only existing ClickHouse query over a defined time window; save counts with timestamp | Repeatable snapshots including CAPTCHA, Auth 429/5xx and request endpoint error trends | READY FOR MANUAL RUN |
| B2. Test identity / pairing integrity | Run read-only lifecycle SQL: tagged user count, active pairings, event links, sessions and refresh tokens | Zero unauthorized links; separate issue for any unexpected delta | READY FOR MANUAL RUN |
| B3. Rate-limit client behavior | Offline/mocked HTTP 429 classification and backoff UI with no Auth request burst | Client does not retry blindly, never interprets 429 as CAPTCHA PASS | PENDING |
| B4. Incident handling | Record owner, independent reviewer, severity, recipient channel, response SLA and escalation | Signed owner/reviewer runbook plus one tabletop incident drill | PENDING |
| B5. Alert delivery | Decide paid log-drain/alerting upgrade or formally approve a time-bounded manual process | Actual alert received on a safe test; no raw PII in notification | PENDING |
| B6. Real 429 evidence | Dedicated account/window, scoped testing plan and approved rate limit with rollback | Bounded evidence of server 429 and recovery, no Student main disruption | NOT AUTHORIZED |

**Do not generate mass anonymous users to trigger 429.** A mock client 429 is sufficient to test UI behavior but NOT to prove Supabase server-side threshold enforcement.

### 3. Initial monitoring rules (proposals, NOT active alerts)

| Condition | Provisional severity | Response |
|---|---|---|
| An unpaired identity sees a learner/score/household row | P0 | Immediately halt STAGING testing, preserve minimal evidence, investigate RLS; no automatic data mutations |
| Tagged Phase3F-A test user gains pairing or learning events | P1 | Freeze test activity, inspect authorized change history, sessions and RLS |
| Unexpected increase in anonymous Auth accounts | P1 / P2 | Compare known testing window, consent and IP-scoped rate limit; do not bulk-delete |
| Sustained CAPTCHA rejects or HTTP 429 | P2 | Check baseline and rate limits, examine aggregated trends; avoid raw IPs/emails in exported incident reports |
| Auth 5xx or degraded login availability | P1 / P2 | Verify Supabase status, Auth logs and client impact; use an approved rollback path if a recent STAGING change broke login |
| Missed manual 30-day account review | P2 governance | Escalate owner/reviewer and document new review date; DO NOT auto-delete |

These are **draft classifications**. Severity, thresholds, ownership, schedule and notification destinations require project-owner sign-off.

### 4. Monitoring workflow for Free-plan STAGING

1. An authorized reviewer opens the Supabase Logs UI or executes the existing query: `supabase/audits/aura_phase3fa_auth_logs_monitor.sql` via Supabase unified Log Explorer (ClickHouse; **not** Postgres SQL Editor).
2. Record time range, total counts, error-status counts and changes vs preceding snapshot; avoid storing or printing emails, IP addresses, OTPs, UID, JWT or secret-key material.
3. Run `supabase/audits/aura_phase3fa_security_closure_readonly.sql` separately for account and learning-data integrity.
4. If material anomalies arise, open a private operator incident record, note timestamp/severity and authorized action. Do not silently change policies, CAPTCHA, rate limits or paired devices.
5. A daily manual cadence is a **proposal**, not an already-running schedule. It is only effective once an owner explicitly accepts the responsibility and a backup reviewer is named.

Continuous live alerting requires a supported log-export/alert architecture and appropriate subscription/permissions. In the current scope there is **no confirmed active automatic alert**.

### 5. 429-safe acceptance protocol

Test three distinct behaviors independently:

- **Client-side simulated 429:** mock Supabase Auth error with HTTP 429 / rate-limit code; verify informative feedback, no automatic sign-up retry, preserved logged-in Student context and no accidental account creation.
- **Real endpoint 429:** wait for an authorized isolated STAGING test plan with a named owner, bounded budget/attempt count, approved work window, no main Student disturbance and documented rollback. Not included in this phase starter.
- **Monitoring/alert receipt:** deliver one deliberately safe synthetic incident signal to the selected owner-controlled system; confirm receipt and escalation. Do not put real token, UID, email or IP into the message. Requires a connected service and separate approval.

No one test substitutes for the others.

### 6. 30-day test-account review dependency

The tagged Phase3F-A Auth identity is due for a **manual review on 2026-12-06 at 07:14 UTC (14:14 Vietnam time)**. Its current linked data are 0 devices/0 events, but 1 session and 1 refresh token remain. No cleanup, session revocation or Auth user deletion is approved.

Track via [GitHub Issue #11](https://github.com/BrunoQuoc/aura-study/issues/11). The issue alone is not an active reminder.

### 7. Exit criteria and next actions

Phase 3F-B is **not PASS** until:
- A responsible owner and backup reviewer are recorded.
- At least two timestamped, aggregate-only Auth monitoring snapshots are reviewed.
- An approved incident-response tabletop test is completed with a recorded decision.
- The application handles a simulated 429 without uncontrolled retries.
- Alert delivery is tested or a time-bounded manual-monitoring exception is formally accepted.
- The real 429/prod rate-limit gate remains OPEN unless independently verified under a controlled plan.
- Data privacy, test identity and existing paired Student remain intact.

**Release manifest:** `release/phase3f-production-gates.json`. It presently has 3 STAGING_PASS and 11 OPEN. Keep `production_release_approved=false`.

### References

- https://supabase.com/docs/guides/auth/rate-limits
- https://supabase.com/docs/guides/auth/debugging/error-codes
- https://supabase.com/docs/guides/observability/logs
- https://supabase.com/docs/guides/observability/log-drains
- https://supabase.com/docs/guides/auth/audit-logs


---

### Phase 3F-B1 implementation evidence — 2026-11-06

A reproducible **rolling-24h Auth log snapshot** was queried on Supabase STAGING: 349 available log rows, **4 captcha_failed**, **2 OTP HTTP 400**, **2 signup HTTP 400**, **0 Auth HTTP 429** and **0 Auth HTTP 5xx**. Snapshot anchoring query at **2026-11-06 07:52:51 UTC**; these are diagnostic counts, not automated notifications or attack-rate baselines. Post-query DB counts remain 6 Auth users / 5 anonymous, 1 active paired Student, 13 Learning Events, 0 attempts, and one tagged Phase3F-A test account.

**Offline HTTP 429 mock** now exists at `auth/phase3fb1-safe-429-simulation.html`, backed by `auth/phase3fb1-rate-limit-policy.js`, `tests/phase3fb1-auth-monitoring.test.mjs` and the manual-only workflow `.github/workflows/aura-phase3fb1-auth-monitoring.yml`. Source/parser/pure-function checks **16/16 PASS**. Three simulated flows (OTP, anonymous signup, refresh) receive a synthetic 429/Retry-After=60; no Supabase SDK, Auth API calls, retries, new users or session storage modifications occur. This **does not demonstrate that the real login UI handles 429**.

For a separate user browser acceptance test, open `https://brunoquoc.github.io/aura-study/auth/phase3fb1-safe-429-simulation.html` and run once; collect only a screenshot of the expected **4/4 PASS** result. Browser proof remains PENDING, as do later Auth log comparison, owner/cadence approval, real 429 enforcement and delivered alert evidence.

Full evidence: `docs/staging-auth-monitoring-baseline-phase3fb1.md`. Monitoring SQL: `supabase/audits/aura_phase3fb1_auth_monitor_24h.sql`. Phase3F-B issue #12 remains open; all production release controls remain unchanged and **NO-GO**.


---

### Phase 3F-B2 implementation checkpoint — 2026-11-06

**B1 browser evidence:** 4/4 offline 429 mock PASS, 0 real Auth API requests, 0 retries, 0 new users. The second B1 log snapshot ~10 minutes later was unchanged; no real 429 evidence.

**B2 implementation:** three draft tabletop cases (P0 unpaired learner exposure, P1 unexpected test-identity pairing, P1 Auth 5xx) have pure decision code, a STAGING-only browser harness and manual GitHub Actions contract tests. Development source/pure-function checks **19/19 PASS**, and the operator's browser screenshot now confirms **3/3 PASS**. All actions are simulated with 0 Auth API calls, 0 database writes and 0 automatic deletion.

**Incident inbox delivery verified:** synthetic, sanitized GitHub Issue [#13](https://github.com/BrunoQuoc/aura-study/issues/13) was created and found through the GitHub issue search. This proves that a ticket was persisted in GitHub; it does NOT prove delivery of a notification to a human, a live Supabase alert, or an automated on-call system. A sanitized issue form was added under `.github/ISSUE_TEMPLATE/aura-staging-incident.yml`.

**Ownership:** `release/phase3fb2-monitoring-ownership.json` has **primary owner UNASSIGNED**, **backup UNASSIGNED**, **no approved monitoring cadence**, and **live alerts OFF**. These must be explicitly accepted before operational readiness can be declared. Tracking and evidence: `docs/staging-auth-incident-readiness-phase3fb2.md`; GitHub Issue [#12](https://github.com/BrunoQuoc/aura-study/issues/12).

**Release:** Alerting and Incident Response, Anonymous Auth Abuse, and all other incomplete production gates remain OPEN; **PRODUCTION NO-GO**.


### Phase 3F-B2 operator tabletop acceptance — 2026-11-06

User-supplied GitHub Pages screenshot verifies **3/3 PASS** across P0 unpaired learner exposure, P1 unintended test-user pairing and P1 Auth 5xx; zero Auth API requests, zero database writes, zero auto deletion. This accepts only the *mock tabletop browser test*. The same screenshot explicitly labels actual alert delivery NOT VERIFIED and monitoring owner UNASSIGNED. Issue #13 is a sanitized ticket receipt only, not an email/push notification or human acknowledgement. Retain production alerting and incident-response gate OPEN and PRODUCTION NO-GO. Reference: `docs/staging-auth-incident-readiness-phase3fb2.md`.


### Phase 3F-B2 next gate — Ownership & Alert Receipt

The GitHub-connected login `BrunoQuoc` is **candidate only** for Primary; no official assignment or explicit acceptance exists. A distinct Backup is required. Human GitHub notification receipt must be verified through each recipient's own Issue #12 comments after a safe synthetic notification from Issue #13. Ticket persistence alone is insufficient. Full protocol: `docs/staging-auth-ownership-alert-receipt-phase3fb2.md`. Owner/Backup, delivery acknowledgement and live Supabase alert pipeline remain OPEN; PRODUCTION NO-GO.
