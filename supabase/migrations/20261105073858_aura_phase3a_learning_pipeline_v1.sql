-- Phase 3A: learning event v1 + read models. Applied to STAGING: 2026-11-05.
-- Existing events are kept; missing content_item_id remains NULL.
ALTER TABLE public.aura_learning_events
  ADD COLUMN content_item_id uuid NULL REFERENCES public.aura_content_items(id) ON DELETE SET NULL,
  ADD COLUMN schema_version smallint NOT NULL DEFAULT 1
    CONSTRAINT aura_learning_events_schema_version_check CHECK (schema_version = 1);

CREATE INDEX aura_events_learner_content_idx
  ON public.aura_learning_events(learner_id,content_item_id,received_at DESC)
  WHERE content_item_id IS NOT NULL;

GRANT INSERT (content_item_id) ON public.aura_learning_events TO authenticated;

ALTER POLICY aura_paired_student_can_append_ungraded_events
ON public.aura_learning_events
WITH CHECK (
  actor_uid = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.aura_student_devices AS d
     WHERE d.id = aura_learning_events.device_id
       AND d.learner_id = aura_learning_events.learner_id
       AND d.auth_uid = (SELECT auth.uid())
       AND d.revoked_at IS NULL
  )
  AND (
    content_item_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.aura_content_items AS c
      JOIN public.aura_learners AS l
        ON l.household_id = c.household_id
       AND l.id = aura_learning_events.learner_id
      WHERE c.id = aura_learning_events.content_item_id
        AND c.status = 'PUBLISHED'
        AND c.content_type NOT IN ('ANSWER_KEY','SOLUTION')
    )
  )
);

CREATE VIEW public.aura_learning_progress_v1
WITH (security_invoker = true)
AS
SELECT e.learner_id,
       c.id AS content_item_id,
       c.subject,
       c.content_type,
       count(*)::bigint AS total_events,
       count(*) FILTER (WHERE e.event_type='lesson_viewed')::bigint AS lesson_views,
       count(*) FILTER (WHERE e.event_type='practice_opened')::bigint AS practice_opens,
       count(*) FILTER (WHERE e.event_type='review_opened')::bigint AS review_opens,
       count(*) FILTER (WHERE e.event_type='draft_saved')::bigint AS draft_saves,
       count(*) FILTER (WHERE e.event_type='learner_note')::bigint AS note_events,
       min(e.received_at) AS first_activity_at,
       max(e.received_at) AS last_activity_at
FROM public.aura_learning_events AS e
JOIN public.aura_content_items AS c ON c.id=e.content_item_id
JOIN public.aura_learners AS l
  ON l.id=e.learner_id AND l.household_id=c.household_id
WHERE e.payload->>'test' IS DISTINCT FROM 'true'
  AND e.payload->>'source' IS DISTINCT FROM 'staging_phase2c'
GROUP BY e.learner_id,c.id,c.subject,c.content_type;

CREATE VIEW public.aura_learning_daily_v1
WITH (security_invoker = true)
AS
SELECT learner_id,
       (received_at AT TIME ZONE 'UTC')::date AS activity_day_utc,
       event_type,
       count(*)::bigint AS event_count,
       count(DISTINCT content_item_id)::bigint AS distinct_content_items,
       max(received_at) AS latest_event_at
FROM public.aura_learning_events
WHERE payload->>'test' IS DISTINCT FROM 'true'
  AND payload->>'source' IS DISTINCT FROM 'staging_phase2c'
GROUP BY learner_id,(received_at AT TIME ZONE 'UTC')::date,event_type;

CREATE VIEW public.aura_verified_outcomes_v1
WITH (security_invoker = true)
AS
SELECT a.id AS attempt_id,
       a.learner_id,
       a.content_item_id,
       c.subject,
       c.content_type,
       a.score,
       a.max_score,
       round(100.0 * a.score / a.max_score,2) AS score_percent,
       a.submitted_at,
       a.graded_at,
       a.released_at
FROM public.aura_attempts AS a
JOIN public.aura_content_items AS c ON c.id=a.content_item_id
JOIN public.aura_learners AS l
  ON l.id=a.learner_id AND l.household_id=c.household_id
WHERE a.state='GRADED_FINAL'
  AND a.score_verified IS TRUE
  AND a.released_at IS NOT NULL
  AND a.score IS NOT NULL
  AND a.max_score > 0
  AND c.content_type IN ('PRACTICE','ASSESSMENT');

REVOKE ALL ON public.aura_learning_progress_v1,
 public.aura_learning_daily_v1,public.aura_verified_outcomes_v1 FROM PUBLIC,anon;
GRANT SELECT ON public.aura_learning_progress_v1,
 public.aura_learning_daily_v1,public.aura_verified_outcomes_v1 TO authenticated;

COMMENT ON VIEW public.aura_verified_outcomes_v1 IS
 'Verified, released results only; not a computed weakness map.';
