# AURA STUDY — Phase 3A Learning Data Pipeline

Date: 2026-11-05  
Environment: **Supabase `aura-study-staging` only**  
Status: **Database & SQL negative tests PASS; browser real-JWT smoke test PENDING**  
Production release: **BLOCKED**

## Architecture

`Student UI → stable event envelope → Supabase client (Student JWT) → RLS INSERT → aura_learning_events`

Read-side projections are PostgreSQL views with `security_invoker=true`:

- `aura_learning_progress_v1`: per-learner/per-content activity counts (lesson views, practice opens, reviews, drafts, notes) plus first/last received timestamp and subject.
- `aura_learning_daily_v1`: activity grouped by UTC date and event type. Unlinked events count here.
- `aura_verified_outcomes_v1`: only GRADED_FINAL + score_verified + released_at non-null + valid score and max_score; restricted to PRACTICE/ASSESSMENT content, with household matching enforced. This is not a weakness map.

The progress/daily views exclude test events (`payload.test = true` or `payload.source = staging_phase2c`). Raw events remain append-only for audit and retry checking. There is **no scoring calculation from event payload**.

## Schema contract v1

Source table: `public.aura_learning_events`.

Existing columns continue unchanged:
- `event_id` UUID primary key, stable for retries.
- `learner_id`, `device_id` linked to a paired Student.
- `actor_uid` assigned by database via `auth.uid()`.
- `event_type`: lesson_viewed | review_opened | practice_opened | draft_saved | learner_note.
- `payload` JSON object, at most 16 KiB in stored JSONB.
- `client_created_at` timestamp from device.
- `received_at` assigned by database.

Phase 3A columns:
- `content_item_id` nullable foreign key to `aura_content_items`. Nullable for backward compatibility and generic unlinked events. Linked content must be PUBLISHED, not ANSWER_KEY/SOLUTION, and belong to the learner's household.
- `schema_version` server-owned smallint DEFAULT 1 CHECK (=1). Student cannot override.

Do not put grades, verified answers, raw secrets, access tokens, or identity claims in an untrusted client event. The client event is activity telemetry, not a trusted assessment.

## Idempotency contract

Use `createLearningEvent()` once per user action, then retain that SAME envelope for every network retry. Do not regenerate `event_id` on retry.

`appendLearningEvent()`:
1. Calls RLS-protected INSERT.
2. Returns `created` on success.
3. If conflict SQLSTATE 23505, fetches the existing event using the same caller JWT.
4. Returns `already_recorded` only if all immutable fields match.
5. Rejects a reused event_id with modified data or inaccessible owner.

This is a client-assisted idempotency protocol relying on the database's event_id primary key. No durable offline queue, retry scheduler, or rate limiter is included yet.

## Security / RLS

Student INSERT requires:
- authenticated subject matching server-populated `actor_uid`;
- one active, paired device tied to the same `learner_id`;
- when content_item_id exists: a visible published non-answer-key item belonging to the same household.

Student can INSERT only the input columns, not server-owned actor/received/schema fields. UPDATE and DELETE remain disallowed.
All views have `security_invoker=true` and SELECT only for the authenticated role; their underlying RLS policies apply.

## Completed SQL tests (transaction ROLLBACK)
- Paired Student can insert valid content-linked events.
- A replay of one event_id does not create a second row.
- DRAFT, ANSWER_KEY and other-household content references are denied.
- Two households are isolated through all read models.
- Unpaired Student sees no derived rows.
- Revoked Student loses read access and cannot append linked events.
- Test-tagged telemetry excluded from progress/daily counts.
- Only the verified, released GRADED_FINAL result enters the verified outcomes view.

An initial SQL assertion contained an ambiguous PL/pgSQL variable name; this was corrected, and the full transaction-based suite subsequently passed. Failed transaction was rolled back.

## Deployment and source

- Applied migration: `20261105073858_aura_phase3a_learning_pipeline_v1`.
- Migration source: `supabase/migrations/20261105073858_aura_phase3a_learning_pipeline_v1.sql`.
- Reusable client: `aura_learning_pipeline_v1.js`.
- Real JWT smoke page: `aura-staging-phase3.html`.

## Remaining acceptance gates

1. Open `aura-staging-phase3.html` in the logged-in Student browser and verify Student identity, dedup replay/collision, and read model access.
2. Confirm the sole persisted new test event is marked `test:true`, and Student's original device remains active.
3. Publish a **staging-only** lesson/practice item, then verify linked real-JWT activity is aggregated correctly. Leave the sample isolated and remove according to the test-data retention plan.
4. Add a durable offline retry queue with bounded backoff, reconciliation, and rate limits if offline support is required.
5. Plan Exam Engine / Auto Grading ingestion as server-authoritative writes; do not trust activity event payload as grades.
6. Review Supabase Security Advisor and anonymous test-account retention before production.

No production approval is implied.
