# AURA STUDY — Phase 3F-B2: Missed 09:00 Review / Backup Handoff Drill

**STAGING ONLY — MANUAL DRILL, NOT A LIVE INCIDENT** (prepared 2026-11-12).

## Purpose and boundaries

Test whether the accepted Backup Reviewer can take over a missed daily 09:00 review, create a safe record and return the action to Primary. This is a **tabletop** simulation: no automatic scheduler, no actual 09:15 handoff, no Supabase Auth writes, no account deletions or access-control changes.

Primary: `BrunoQuoc`. Backup: `Sonic-2015`. Both previously agreed on daily manual 09:00 Vietnam-time monitoring including weekends, a 09:15 Backup follow-up and 09:30 evidence deadline. They did **not** approve 24/7 alerting.

## Preconditions

- Use [GitHub Issue #12](https://github.com/BrunoQuoc/aura-study/issues/12), not a live severity incident issue, to collect self-authored DRILL ONLY comments.
- Each participant signs into their own account. One person must not post both replies via another account.
- The [first read-only snapshot report](https://github.com/BrunoQuoc/aura-study/blob/main/docs/staging-auth-monitoring-first-manual-check-phase3fb2-2026-11-12.md) is an assistant-assisted aggregate-only sample, **not** an already verified 09:00 Primary attendance record.
- Do not simulate an actual missed review in release records; label every tabletop step **DRILL ONLY**.

## Bounded two-person dry run

1. Primary (`BrunoQuoc`) opens Issue #12 and self-posts:

   `DRILL ONLY — PRIMARY MISSED 09:00 SCENARIO. This is a tabletop simulation, not an actual missed review. Backup Sonic-2015: demonstrate 09:15 takeover procedure using the published aggregate-only STAGING checklist. No real Auth traffic or incident.`

2. Backup (`Sonic-2015`) opens the first read-only snapshot and cadence runbook, checks the **aggregate-only** values and notices Auth/edge log visibility is missing in the sampled 24h window, then self-posts:

   `DRILL ONLY — ACK BACKUP TAKEOVER. Simulated 09:15 handoff accepted; checked 2026-11-12 aggregate snapshot and flagged missing Auth/edge log coverage for review. I would post a sanitized check before 09:30 after completing an authorized fresh read-only review. No live incident or automated alert.`

3. Primary independently reviews the Backup comment and self-posts:

   `DRILL ONLY — ACK PRIMARY HANDOFF REVIEW. Backup takeover process verified as a tabletop only. Auth log coverage needs investigation; no actual 09:00 attendance or live incident was verified.`

4. An authorized reviewer verifies each comment's **actual GitHub author**, correct order of comments, links to Issue #12, no real user/learner identifiers, and records the comment URLs. Do not invent submission timestamps: capture real wall-clock time from the participants if needed.

## Pass / fail

| Condition | Meaning |
|---|---|
| Correct Primary and Backup author each role comment | **Required** |
| Scenario explicitly says DRILL ONLY and 'not real missed review' | **Required** |
| Backup cites same approved STAGING aggregate snapshot and notices Auth visibility caveat | **Required** |
| Primary reviews and reviewer verifies comment authors | **Required** |
| Simulated 09:15/09:30 procedure followed in explanatory text | **Tabletop only**, not measured service latency |

Only after these self-authored comments have been verified may `missed_review_handoff_tabletop_completed` be set true. A PASS still does not imply a real on-time monitoring schedule, an automated missed-review reminder, a Supabase Auth alert, a 24/7 incident SLA, or Production approval.

## Outstanding operational gates

Separate requirements: Primary self-reviews an actual daily aggregate report; independent operational signoff and effective/review date; confirm intended availability; clarify Auth/edge logs visibility; establish a real alert source or an explicit expiring manual exception. All PRODUCTION gates continue NO-GO.
