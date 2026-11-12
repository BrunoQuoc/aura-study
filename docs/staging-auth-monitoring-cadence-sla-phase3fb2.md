# AURA STUDY — Phase 3F-B2: Monitoring Cadence & Response Targets

**Status:** DRAFT / STAGING ONLY / NOT APPROVED. **Reference date:** 2026-11-12.

## 1. Purpose and current evidence

- Primary: [BrunoQuoc ACK](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6680960922). Backup: [Sonic-2015 ACK](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6812366506). Both self-ACKed receipt of reciprocal synthetic GitHub Inbox mentions (details in `docs/staging-auth-ownership-alert-receipt-phase3fb2.md`).
- This manual STAGING plan does **not** run automatically and does **not** provide 24/7 coverage. A GitHub Issue is not an alert source from Supabase.
- No production learner traffic, Auth retry flood, server-rate-limit stress test, session revocation, account deletion, RLS changes, paid Supabase Log Drains or production promotion is authorized by this plan.

## 2. Proposed recurring review schedule — approval REQUIRED

| Field | Proposal |
|---|---|
| Frequency | Every day, including weekends — proposed only |
| Start | 09:00 Asia/Ho_Chi_Minh |
| Primary | `@BrunoQuoc` |
| Backup | `@Sonic-2015` |
| Evidence deadline | 09:30 VN, sanitized Issue #12 update |
| No Primary check by 09:15 | Backup follows up or covers check; this is a human step, no automatic reminder exists |
| No confirmed check by 09:30 | Log `MISSED REVIEW`, notify both humans and pause high-risk STAGING tests until checked |
| Weekends/holidays/unavailability | Explicitly arrange an accountable backup in advance; do not silently assume coverage |

**Coverage warning:** A once-daily scan can miss an incident for close to a day. Response targets below apply **from confirmed detection/notification during agreed coverage**, not from undetected event onset, and are *targets* until explicitly accepted.

## 3. Draft response targets — not a live SLA

| Severity | Illustrative trigger | Human ACK target after detection | Triage/decision target after detection | Safe initial action |
|---|---|---:|---:|---|
| P0 | Any suspected cross-learner RLS exposure | 15 min | 30 min | STOP risky STAGING tests; preserve sanitized evidence; escalate to both people |
| P1 | Unexpected synthetic user pairing or confirmed Auth 5xx degradation | 60 min | 120 min | Freeze affected tests, read-only audit and obtain reviewer approval |
| P2 | Repeated 429 / CAPTCHA anomalies compared with baseline | 4 h | 24 h | Investigate aggregate trend; do not stress or retry endpoints |

Severity is based on credible evidence, not synthetic tabletop labels. Because this is daily *manual* monitoring, these response targets cannot be represented as 24/7 guarantees, even after approval. Escalate P0 immediately on detection; do not wait until 09:00 if already aware.

## 4. Manual daily operating checklist

1. Primary opens [Issue #12](https://github.com/BrunoQuoc/aura-study/issues/12) and confirms no outstanding incident and no missing prior review; read the Supabase STAGING dashboard Auth Log Explorer, not production.
2. Run or inspect **read-only aggregate** 24-hour monitoring query from [`aura_phase3fb1_auth_monitor_24h.sql`](https://github.com/BrunoQuoc/aura-study/blob/main/supabase/audits/aura_phase3fb1_auth_monitor_24h.sql), and compare against the last *timestamped* baseline. Counts are diagnostic; do not infer thresholds from a single prior sample.
3. Record timestamp/timezone, 24-hour window, total Auth requests, `captcha_failed`, OTP/signup HTTP 400, HTTP 429, Auth 5xx, change from previous sample and review conclusion. Avoid raw logs, IP addresses, emails, tokens, Auth IDs, learner details and precise private identifiers.
4. Cross-check only approved aggregate inventory (anonymous test users, paired Student device count, Learning Event count, Attempts), with separate read-only audit where available; do not copy individual identities into Issues.
5. If P0/P1: open a **sanitized** STAGING incident issue; notify Primary/Backup through an approved channel, keep Issue #12 as tracker, log detection and human acknowledgement timestamps. Do not claim real alert delivery merely because a GitHub issue was created.
6. Backup independently reviews aggregate deviations / missed check, confirms in Issue #12, and escalates discrepancy. This does not imply the Backup has database access or assignee rights.

### Sanitized daily evidence template (paste into Issue #12 only AFTER completing an actual check)

```text
STAGING DAILY MONITOR — manual, read-only
Date/time: YYYY-MM-DD HH:MM Asia/Ho_Chi_Minh
Auth log 24h window end UTC: YYYY-MM-DDTHH:MMZ
Auth aggregate: total=[number]; captcha_failed=[number]; OTP/signup 400=[number]; HTTP429=[number]; HTTP5xx=[number]
Previous comparable sample UTC: [time or NONE]
Change/decision: [short sanitized summary]
Anomaly/incident issue: [link or NONE]
Reviewer: [GitHub username]; follow-up: [decision]
NO PII, TOKENS, IPs, EMAILS, USER IDs, LEARNER RECORDS
```

Do not populate numbers from the old 2026-11-06 snapshot for a new daily check; run a fresh read-only query and record the actual window.

## 5. Independent approval protocol

On [Issue #12](https://github.com/BrunoQuoc/aura-study/issues/12), **each person must explicitly accept the proposed schedule and response targets**, not just their previously ACKed duty:

- `@BrunoQuoc`: `APPROVE CADENCE PRIMARY — STAGING only; daily 09:00 Asia/Ho_Chi_Minh including weekends; review evidence by 09:30; P0 ACK 15m / P1 60m / P2 4h FROM DETECTION during coverage; no 24/7 guarantee; manual operation.`
- `@Sonic-2015`: `APPROVE CADENCE BACKUP — STAGING only; daily 09:00 Asia/Ho_Chi_Minh including weekends; Backup takes over missed primary check after 09:15; review evidence by 09:30; P0 ACK 15m / P1 60m / P2 4h FROM DETECTION during coverage; manual operation.`

The operator records verified comment URLs and decision timestamp, effective date, and next review due date in `release/phase3fb2-monitoring-cadence-sla.json`. A distinct authorized reviewer must separately sign off the incident playbook; do not auto-approve based on a comment that merely repeats test text. Current registry approval flags remain false.

**Before marking cadence operational:** perform one actual aggregate-only read-only check, capture a sanitized evidence comment, and rehearse missed Primary check / Backup takeover with no real incident; require evidence of manual notifications (or a separately approved time-bounded manual-monitoring exception). A GitHub comment is not an active 09:00 reminder.

## 6. Closeout limits

- Stage A: runbook and draft schedule created — **DONE**.
- Stage B: two independent schedule approvals, named availability and escalation path — **OPEN**.
- Stage C: actual first review + Backup handoff drill + independent reviewer approval — **OPEN**.
- Stage D: live Supabase-to-alert integration and bounded server 429 tests — **OPEN**.

Ownership registry: `release/phase3fb2-monitoring-ownership.json`; policy record: `release/phase3fb2-monitoring-cadence-sla.json`; workflow remains manual-only. Release: 3 STAGING_PASS / 11 OPEN; PRODUCTION NO-GO.


### Short-form cadence acknowledgements — 2026-11-12

- `BrunoQuoc` posted [APPROVE CADENCE PRIMARY](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6813565895).
- `Sonic-2015` posted [APPROVE CADENCE BACKUP](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6813579412).
- Source author and exact text verified through GitHub. Both comments are **short-form intent only**: neither explicitly confirms weekend coverage, response targets, Backup takeover or no-24/7 scope.
- The source policy records these comment URLs but keeps `accepted_by_primary=false`, `accepted_by_backup=false`, `sla_and_coverage_terms_confirmed_by_primary=false`, `sla_and_coverage_terms_confirmed_by_backup=false`, `approval.approved=false`.
- To record full agreement, each author **edits their own comment or adds a new self-authored comment** repeating the specific approval sentence from §5. Independent reviewer must verify the final author and contents; no assistant-authored comments or inferred intent may substitute.
- After explicit agreement, the runbook still requires initial live **read-only** aggregate monitoring check, availability/handoff exercise, independent sign-off and review date before manual cadence is operational. No scheduled reminder, GitHub Action cron or Supabase live alert is active. **PRODUCTION NO-GO**.


### Full cadence terms accepted by both roles — 2026-11-12

The two short comments were **edited in place**. Verified through GitHub Issue #12 after edit:

- [BrunoQuoc full Primary approval](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6813565895): daily manual review 09:00 Asia/Ho_Chi_Minh including weekends; evidence by 09:30; Backup follow-up at 09:15; P0/P1/P2 ACK targets 15m/60m/4h from actual human detection during coverage; no 24/7 promise or automation.
- [Sonic-2015 full Backup approval](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6813579412): same coverage, Backup cover at 09:15, evidence 09:30, P0/P1/P2 acknowledgement targets and no automation.

**PASS — two role-level approvals and explicit response-target consent.** Registry `release/phase3fb2-monitoring-cadence-sla.json` now sets both accepted flags, both terms-confirmed flags and author verification to true, while keeping `approval.approved=false` and `independent_reviewer_approved=false`.

**Still OPEN:** independent playbook/reviewer signoff; first real aggregate-only daily monitoring evidence (not a copied historical sample); missed-Primary Backup handoff tabletop; effective and next-review dates; verification of any actual alert source. These are required before claiming active/manual readiness. Neither a daily reminder nor 24/7 incident monitoring has been activated. PRODUCTION NO-GO.
