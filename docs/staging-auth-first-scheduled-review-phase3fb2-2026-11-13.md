# AURA STUDY — Phase 3F-B2: First Scheduled 09:00 Monitoring Review

**Environment:** STAGING ONLY. **Scheduled trial:** Friday **2026-11-13**, at **09:00 Asia/Ho_Chi_Minh** (02:00 UTC). **State:** PREPARED, NOT EXECUTED. **PRODUCTION NO-GO.**

## 1. Eligibility and scope

- Primary: `BrunoQuoc`; Backup: `Sonic-2015`. Both have acknowledged the daily 09:00 manual schedule including weekends and P0/P1/P2 response targets.
- GitHub Issue #12 contains the accepted terms, synthetic GitHub Inbox receipt 2/2, a 2026-11-12 ad hoc read-only snapshot and the simulated Backup handoff 3/3.
- **This run requires a real check performed at the scheduled time by the human Primary (or actual Backup coverage), not a simulated timestamp or previously captured numbers.**
- No GitHub Action schedule, reminder, automation, Auth event generator, test user creation, paid Log Drains, production changes or database writes.
- Backup repository-read access does **not** imply direct permission to query Supabase.

## 2. At 09:00 Vietnam time, Primary executes

1. Sign into **Supabase STAGING** and open Logs Explorer. Execute the committed [rolling-24h aggregate Auth query](https://github.com/BrunoQuoc/aura-study/blob/main/supabase/audits/aura_phase3fb1_auth_monitor_24h.sql) in Logs Explorer (ClickHouse).
2. Execute the [24h log-source-coverage query](https://github.com/BrunoQuoc/aura-study/blob/main/supabase/audits/aura_phase3fb2_log_source_coverage_24h.sql) in Logs Explorer. This is required after the 2026-11-12 result had 0 auth/edge rows despite other log sources.
3. Open **PostgreSQL SQL Editor** for the same STAGING project; run the [aggregate-only inventory SQL](https://github.com/BrunoQuoc/aura-study/blob/main/supabase/audits/aura_phase3fb2_manual_aggregate_inventory.sql).
4. Copy **only counts**, sample window, UTC snapshot time and interpretation into the sanitized Issue #12 template below; include the actual time of review in Vietnam and avoid sensitive user data.
5. Compare with **2026-11-12 STAGING ad hoc baseline**: 6 Auth users, 5 anonymous, 1 active paired Student device, 13 Learning Events, 0 Attempts. Historical counts are for comparison **only**, not today's measurements.
6. If a credible P0/P1 anomaly is detected, stop risky STAGING tests and follow the incident playbook. No automatic cleanup, session revocation, Auth load test or account changes.

## 3. When Primary misses 09:00

- At **09:15**, Backup performs the approved follow-up or independently completes the check **only if it has authorized STAGING access**; otherwise records the coverage gap and escalates to Primary. Never imply Backup has read/write access to Supabase merely because it can read GitHub.
- At **09:30**, if no actual authorized check exists, record `MISSED REVIEW` with real timestamp and reason; pause high-risk STAGING tests until the responsible people approve resumption.
- Unlike the previous DRILL ONLY comments, an actual missed review must be documented **as an actual miss**, never as a simulated event.

## 4. Primary self-authored evidence comment (Issue #12)

Replace all bracketed fields with values **actually observed in the new 09:00 check**. Do **not** post this template before performing the check.

```text
STAGING DAILY MONITOR — FIRST SCHEDULED 09:00 REVIEW — 2026-11-13
Actor: BrunoQuoc (or explicitly named authorized Backup)
Actually started at: 2026-11-13 HH:MM Asia/Ho_Chi_Minh
PostgreSQL snapshot UTC: 2026-11-13THH:MM:SSZ
Logs window: rolling 24h ending 2026-11-13THH:MMZ
Auth/edge source rows: [number; or 0 OBSERVED]
Log source coverage: auth_logs=[number/NOT PRESENT]; edge_logs=[number/NOT PRESENT]; postgres_logs=[number/NOT PRESENT]; pgbouncer_logs=[number/NOT PRESENT]
Auth errors: captcha_failed=[number]; auth 429=[number]; auth 5xx=[number]; OTP HTTP400=[number]; signup HTTP400=[number]
Aggregate inventory: auth_users=[number]; anonymous_users=[number]; active_paired_devices=[number]; learning_events=[number]; attempts=[number]
Comparison against 2026-11-12: [same/change + counts only]
Auth telemetry visibility assessment: [OBSERVED / NOT OBSERVED; investigate if missing]
Any incident ticket: [sanitized Issue URL or NONE]
Action/decision: [brief factual statement; cannot assert healthy Auth from 0 Auth log rows]
No learner records, UIDs, IP addresses, emails, secrets or raw Auth payloads.
```

## 5. Backup's independent review

Using **its own GitHub account**, `Sonic-2015` reviews the Primary's timestamped Issue #12 comment and checks aggregated counts and limitations. Suggested structure (edit for truthful findings):

```text
ACK FIRST SCHEDULED REVIEW BACKUP — 2026-11-13; reviewed Primary Issue #12 evidence [comment URL]; aggregate findings: [agree/disagree with specifics]; Auth log coverage: [observed/missing]; no claim of 24/7 coverage, automated Supabase alerts or production approval.
```

A separate authorized independent reviewer checks that the correct accounts posted the comments and examines the actual log visibility limitation. A GitHub comment by the assistant or a raw keyword-only ACK does not prove the 09:00 check was performed. Connector-normalized issue-comment objects may lack usable timestamps; preserve query UTC time and operator-observed local time. Do not invent timestamps or mark schedule compliance without corroboration.

## 6. Acceptance rule

`first_real_manual_check_completed` may be set true **only after** an actual STAGING check at the scheduled time, an independently verifiable new UTC query timestamp, complete aggregate-only evidence on Issue #12, the responsible human's self-authored comment and reviewer validation. If performed late, record as a **late real check**, not `09:00 PASS`. The run can be executed and recorded even if Auth source coverage is missing, but the **Auth monitoring readiness remains OPEN** until the telemetry gap is explained and appropriately signed off.

Separate gates still OPEN: Auth log-source coverage, independent operational policy signoff, approved effective/review dates, live Supabase-triggered alerts or an explicitly approved expiring manual-monitoring exception, real 429 evidence and production release governance.

**No future check will run from this document alone.**
