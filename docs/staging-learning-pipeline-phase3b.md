# AURA STUDY — PHASE 3B / Content-linked Learning Progress

Date: 2026-11-05. Supabase environment: **aura-study-staging only**.  
State: **SQL/RLS tests PASS; live Student JWT/browser tests PENDING**.  
Production approval: **NOT GRANTED**.

## Purpose

Verify the integrated path:

`PUBLISHED Knowledge Library content → paired Student JWT → INSERT aura_learning_events(content_item_id) → security_invoker progress and daily views`

`aura_verified_outcomes_v1` remains server-authoritative; only verified and released final assessments appear. No test grades are written persistently.

## Persisted STAGING-only content fixtures

Seeded two synthetic, published Toán 6 content entries into the existing single STAGING household:

| source_ref | content_type | status | subject |
|---|---|---|---|
| `AURA_STAGING_PHASE3B:LESSON:v1` | LESSON | PUBLISHED | TOAN |
| `AURA_STAGING_PHASE3B:PRACTICE:v1` | PRACTICE | PUBLISHED | TOAN |

Both titles explicitly start with `[STAGING TEST]`. Neither item contains actual lesson text, answer keys, scores or learner data.

Reproducible guarded seed SQL: `supabase/seeds/aura_phase3b_staging_content_v1.sql`. This is a **seed**, not a schema migration.

## Database verification — PASS

Tests were performed in an outer SQL transaction and **ROLLBACK** was completed successfully:

1. JWT/RLS simulation: paired Student reads exactly two published content items.
2. Student writes one `lesson_viewed` on the lesson and one `practice_opened` on the practice using the proper linked content IDs.
3. `aura_learning_progress_v1` returns exactly two content groups and expected counters.
4. `aura_learning_daily_v1` counts those two events; historical `payload.test = true` diagnostic events remain excluded.
5. Attempt lifecycle (server-authored, transaction-only): `SUBMITTED` and unreleased `GRADED_FINAL` not exposed; one verified/released `GRADED_FINAL` yielded 80% in `aura_verified_outcomes_v1`.
6. Student cannot insert events referencing DRAFT, ANSWER_KEY or foreign household content.
7. Other household Student and unpaired account cannot read original household content or progress.
8. Simulated device revocation removes access to content/read models and blocks new linked event writes.

The tests did not create persistent attempts or scores and did not revoke the real Student.

## Browser E2E (real Student JWT)

Test page: `aura-staging-phase3b.html` in the repository root.

1. Open the page **in the same GitHub Pages origin/browser** used to pair the STAGING Student.
2. Click **Kiểm tra hai nội dung PUBLISHED**. Expect PASS with two sample content items.
3. Click **Ghi bài học + luyện tập**. Expect two linked events and successful duplicate retry acknowledgement.
4. Click **Đối chiếu tiến độ và kết quả**. Expect progress for both content items, daily count at least two, and Verified Outcomes = 0 with the current empty attempts table.

The page uses the existing `aura-stage-student-v1` Supabase browser session, `aura_learning_pipeline_v1.js`, and a publishable key. It does not expose the service key or store raw JWTs in reports.

### Synthetic events are intentionally counted in STAGING progress

This Phase 3B E2E verifies the **normal** activity aggregation path. Therefore events are tagged with
`payload.source='staging_phase3b'` and `payload.synthetic=true` **without** `payload.test=true`: unlike earlier diagnostic events, they are deliberately counted in STAGING progress/daily views. They must never be copied into a production learner record.

To avoid accidental repeat accumulation, the browser checks for a previously recorded event with the same Student/device/content/scenario and skips creating a new one on later runs. Exact retry uses the same event envelope and `event_id`.

## Data hygiene and cleanup

- Retain the two published synthetic content rows until live browser E2E passes.
- STAGING read models will include the linked synthetic events.
- Following acceptance and explicit authorized cleanup, target only event rows with both the precise STAGING source markers and matching content IDs; delete event rows before deleting the two synthetic content rows. Confirm that all targeted IDs belong to the intended STAGING household.
- Do not delete or alter the original learner, household or paired Student.
- Preserve audit/acceptance record in GitHub; do not include JWT, OTP, pairing codes, auth user IDs or email addresses.

## Remaining gates

- Real browser E2E 3/3 on GitHub Pages.
- Confirm newly persisted Phase 3B events match Student/device/content and that 1 active original Student remains.
- Run Supabase Security Advisor after data changes and plan test-account/event retention.
- Phase 3C: offline queue, bounded retries, rate limits and event-data governance if required.
- Design a server-authoritative grading/attempt pipeline before deriving Error Analysis or Weakness Map.

Phase 3B database scope may be accepted when SQL/RLS tests PASS. Whole Phase 3B requires browser E2E evidence and a final DB check.


---

## Phase 3B E2E acceptance — 2026-11-05

**Decision: PHASE 3B ACCEPTED ON STAGING for the three browser E2E scenarios. Production remains BLOCKED.**

The user supplied a screenshot of `aura-staging-phase3b.html` with three successful checks:
1. Student Auth and RLS returned exactly two Phase 3B PUBLISHED Knowledge Library entries.
2. Student appended `lesson_viewed` and `practice_opened` linked to their respective content items; replayed identical event IDs and read each event back.
3. Student JWT read `aura_learning_progress_v1` and `aura_learning_daily_v1` with one lesson view and one practice open; `aura_verified_outcomes_v1` returned zero grades.

### Independently verified Supabase STAGING data

- Exactly **two** `public.aura_learning_events` records tagged `payload.source='staging_phase3b'`; exactly two distinct event IDs.
- One event references `AURA_STAGING_PHASE3B:LESSON:v1` with type `lesson_viewed`, one references `AURA_STAGING_PHASE3B:PRACTICE:v1` with `practice_opened`.
- Both records have `schema_version=1`, matching event/learner/device Auth identifiers and server receipt timestamps.
- The actual progress view returns two groups for `TOAN`, each with one corresponding activity; the daily view totals two activities.
- A read-only SQL role simulation with the current Student UID returns two Phase 3B content entries, two events, two progress groups, two daily activities, zero verified outcomes and **zero visible Admin households**.
- Exactly one learner, one household and one **active** Student device remain. There are three **previously revoked** temporary test devices; none was revoked by this verification. There are no persisted exam attempts or grades.
- Aggregated Supabase API logs include HTTP 201 for successful learning-event INSERTs, 409 for duplicate event IDs, and HTTP 200 for the three read-model GET endpoints. Aggregated log rows do not prove per-request response bodies; browser screenshot and database checks support the detailed acceptance.

### Remaining controls

- Retain the two STAGING content fixtures and the two synthetic Phase 3B events until an authorized cleanup plan is approved; these synthetic events are deliberately counted in STAGING progress.
- Do not copy these fixtures, users, or events to production.
- Acknowledge the Supabase Security Advisor warnings for anonymous sign-ins and leaked-password protection; resolve or document compensating controls before a production decision.
- Phase 3C should focus on durable offline delivery/retries, reconciliation, abuse controls, retention/cleanup, and safe monitoring.
- Scores, verified results and Weakness Map labels must be generated through server-authoritative pipelines, not client activity telemetry.
