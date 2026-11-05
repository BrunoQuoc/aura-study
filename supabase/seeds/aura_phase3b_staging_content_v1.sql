-- AURA STUDY Phase 3B — STAGING ONLY.
-- Two synthetic PUBLISHED items, no genuine study material, scores, identities or secrets.
-- Already seeded against the Supabase aura-study-staging project on 2026-11-05.
-- IMPORTANT: Do NOT apply to production. Re-running should never duplicate rows.
BEGIN;
DO $seed$
DECLARE v_household uuid; v_count integer;
BEGIN
 IF (SELECT count(*) FROM public.aura_households) <> 1
 OR (SELECT count(*) FROM public.aura_learners) <> 1
 OR (SELECT count(*) FROM public.aura_student_devices WHERE revoked_at IS NULL) <> 1
 THEN RAISE EXCEPTION 'STAGING fixture requires exactly one household, learner, active Student'; END IF;
 SELECT id INTO v_household FROM public.aura_households LIMIT 1;
 SELECT count(*) INTO v_count FROM public.aura_content_items
 WHERE source_ref IN ('AURA_STAGING_PHASE3B:LESSON:v1','AURA_STAGING_PHASE3B:PRACTICE:v1');
 IF v_count = 2 THEN
   IF EXISTS (
    SELECT 1 FROM public.aura_content_items
    WHERE source_ref IN ('AURA_STAGING_PHASE3B:LESSON:v1','AURA_STAGING_PHASE3B:PRACTICE:v1')
      AND (household_id <> v_household OR subject <> 'TOAN'
        OR status <> 'PUBLISHED' OR
         (source_ref='AURA_STAGING_PHASE3B:LESSON:v1' AND content_type <> 'LESSON') OR
         (source_ref='AURA_STAGING_PHASE3B:PRACTICE:v1' AND content_type <> 'PRACTICE'))
   ) THEN RAISE EXCEPTION 'Existing fixture does not match Phase3B requirements'; END IF;
 ELSIF v_count = 0 THEN
   INSERT INTO public.aura_content_items
   (household_id,subject,title,content_type,status,source_ref,content_version,published_at)
   VALUES
   (v_household,'TOAN','[STAGING TEST] Toán 6 — Bài học mẫu Phase 3B',
    'LESSON','PUBLISHED','AURA_STAGING_PHASE3B:LESSON:v1',1,now()),
   (v_household,'TOAN','[STAGING TEST] Toán 6 — Luyện tập mẫu Phase 3B',
    'PRACTICE','PUBLISHED','AURA_STAGING_PHASE3B:PRACTICE:v1',1,now());
 ELSE
   RAISE EXCEPTION 'Only %/2 fixtures exist; manual reconciliation required',v_count;
 END IF;
END $seed$;
COMMIT;
-- No lesson body, answer key, grade or attempt is created by this seed.
