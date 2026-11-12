# AURA STUDY — Phase 3F-B2: First manual monitoring snapshot

**STAGING ONLY / READ-ONLY / AD HOC**. Snapshot: **2026-11-12 03:58:37 UTC** (**10:58:37 Asia/Ho_Chi_Minh**). This is an assistant-assisted one-time check, **not** proof the Primary attended the 09:00 daily review.

## 1. Scope and authorization

- Queried Supabase STAGING project using read-only PostgreSQL SQL and read-only Supabase Logs Explorer aggregate SQL.
- No Auth calls, logins, new identities, database writes, user deletion, session revocation, device pairing, RLS changes, rate-limit stress, alert automation or paid Log Drain creation.
- Outputs below contain only aggregate counts and time anchors. No IPs, emails, UIDs, learner records, tokens or raw event/log payloads.
- The Primary `BrunoQuoc` and Backup `Sonic-2015` have accepted manual daily review terms at 09:00 Vietnam time; independent operational signoff, actual daily 09:00 coverage and handoff drill are **not** yet established.

## 2. Auth Logs Explorer — recent 24h

Source: [existing read-only 24h query](https://github.com/BrunoQuoc/aura-study/blob/main/supabase/audits/aura_phase3fb1_auth_monitor_24h.sql). Queried approximately **2026-11-12 03:57 UTC** for a rolling 24h window.

| Aggregate | Value |
|---|---:|
| Auth/edge matching log records | 0 |
| `captcha_failed` | 0 observed |
| Auth service 429 | 0 observed |
| Auth edge 429 | 0 observed |
| Auth edge 5xx | 0 observed |
| Auth OTP HTTP 400 | 0 observed |
| Auth signup HTTP 400 | 0 observed |

`min(timestamp)` / `max(timestamp)` returned a `1970-01-01` sentinel due to an empty result set; **this is not a real log timestamp**.

Independent **source-distribution** query in the same 24h window returned:

| Log source | Records |
|---|---:|
| `pgbouncer_logs` | 74 |
| `postgres_logs` | 10 |
| `auth_logs` | 0 observed |
| `edge_logs` | 0 observed |

**Interpretation:** Other sources have records, but there is no Auth/edge coverage in the sampled window. Zero observed Auth errors is **not** evidence of healthy Auth, successful rate limiting, or working real-time alerting. This is a visibility limitation / possible telemetry or traffic gap; investigate non-destructively before accepting Auth monitoring.

Historical comparison: the 2026-11-06 STAGING baseline had **349 available Auth/edge log records**, including 4 `captcha_failed` and no observed Auth 429/5xx. These samples are from different rolling windows, so a decrease in log records cannot by itself establish a system change or outage.

## 3. PostgreSQL STAGING read-only aggregate snapshot

Source: [repeatable aggregate inventory SQL](https://github.com/BrunoQuoc/aura-study/blob/main/supabase/audits/aura_phase3fb2_manual_aggregate_inventory.sql).

| Aggregate | 2026-11-12 value |
|---|---:|
| Auth users (all) | 6 |
| Auth anonymous users | 5 |
| Auth non-anonymous users | 1 |
| Auth session rows | 4 |
| Refresh token rows not marked revoked | 4 |
| Device rows (including revoked) | 4 |
| Devices with `paired_at` and not revoked | 1 |
| Learning Events | 13 |
| Attempts | 0 |
| Pairing requests total | 6 |
| Pending, unexpired and unrevoked pairing requests | 0 |

Compared with 2026-11-06 baseline: Auth user count (6), anonymous user count (5), active paired devices (1), Learning Events (13) and Attempts (0) are unchanged. Session/refresh-token totals were not fully comparable with prior **single test-identity** session counts; do not infer a change in that specific test identity from these totals.

These are row-count checks only, **not** a re-run of RLS or graded-outcome access tests.

## 4. Decision and remaining acceptance evidence

- **PASS:** a real one-time, aggregate-only STAGING database inventory query completed; read-only Auth log aggregation executed.
- **LIMITED / FOLLOW-UP REQUIRED:** Auth/edge log sample has 0 records despite other log sources being present; cannot mark Auth monitoring healthy or thresholds verified.
- **PENDING:** Primary posts independent acknowledgment/review of this evidence (the assistant-created issue comment is not a Primary's 09:00 manual check); Backup independently reviews or requests clarification.
- **PENDING:** a genuine scheduled **09:00 daily check** with a timestamp, optional attendance/handoff exercise, and formal independent incident policy signoff.
- **PENDING:** actual Supabase event-to-notification pipeline or a separately approved, expiring manual-monitoring exception.

Suggested action: verify STAGING Auth log source configuration/retention and whether any Auth activity is expected in the 24h period; do **not** create test accounts or perform login floods to generate logs. Only conduct a bounded Auth request if separately reviewed and authorized.

Review dependencies: [Issue #12](https://github.com/BrunoQuoc/aura-study/issues/12), [test identity review #11 (due 2026-12-06)](https://github.com/BrunoQuoc/aura-study/issues/11).

**STATUS: FIRST AD HOC READ-ONLY SNAPSHOT CAPTURED; OPERATOR REVIEW / 09:00 CADENCE / LIVE ALERT GATES OPEN; PRODUCTION NO-GO.**
