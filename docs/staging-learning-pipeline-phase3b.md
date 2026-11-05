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
