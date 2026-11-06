-- AURA STUDY Phase 3F-A / STAGING ONLY / TRANSIENT GRADED FIXTURE
-- Operator-approved security test. This invokes a synthetic INSERT into
-- aura_attempts only inside a PL/pgSQL exception subtransaction, which MUST
-- roll back before the statement completes. No real scores are modified.
-- Output is aggregate counts only: NO UID, JWT, grades or learner payload.
-- Do not remove the controlled exception/rollback or run on production.

CREATE TEMP TABLE aura_phase3fa_security_closure_results (
  fixture_count integer, admin_attempts integer, admin_outcomes integer,
  unpaired_attempts integer, unpaired_outcomes integer,
  unpaired_learners integer, rollback_confirmed boolean
) ON COMMIT DROP;

DO $phase3fa$
DECLARE
 v_admin_uid uuid;
 v_unpaired_uid uuid;
 v_inserted_count integer := 0;
 v_admin_attempt_count integer := -1;
 v_admin_outcome_count integer := -1;
 v_unpaired_attempt_count integer := -1;
 v_unpaired_outcome_count integer := -1;
 v_unpaired_learner_count integer := -1;
BEGIN
 SELECT h.admin_uid INTO v_admin_uid FROM public.aura_households h LIMIT 1;
 SELECT u.id INTO v_unpaired_uid FROM auth.users u
 WHERE u.is_anonymous
   AND u.raw_user_meta_data->>'aura_test_phase'='3fa_positive_unpaired'
   AND u.raw_user_meta_data->>'aura_test_scope'='STAGING_ONLY'
   AND NOT EXISTS(SELECT 1 FROM public.aura_student_devices d WHERE d.auth_uid=u.id)
 ORDER BY u.created_at DESC LIMIT 1;

 IF v_admin_uid IS NULL OR v_unpaired_uid IS NULL THEN
   RAISE EXCEPTION 'MISSING_STAGING_TEST_CONTEXT';
 END IF;

 BEGIN
   INSERT INTO public.aura_attempts (
     learner_id,content_item_id,state,score,max_score,score_verified,
     graded_at,released_at
   )
   SELECT l.id,c.id,'GRADED_FINAL',7,10,true,now(),now()
   FROM public.aura_learners l
   JOIN public.aura_content_items c ON c.household_id=l.household_id
   WHERE c.content_type='PRACTICE' AND c.status='PUBLISHED'
   ORDER BY l.created_at,c.created_at LIMIT 1;

   GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
   IF v_inserted_count<>1 THEN RAISE EXCEPTION 'MISSING_PRACTICE_FIXTURE'; END IF;

   PERFORM set_config('request.jwt.claim.sub',v_admin_uid::text,true);
   EXECUTE 'SET LOCAL ROLE authenticated';
   SELECT count(*) INTO v_admin_attempt_count FROM public.aura_attempts;
   SELECT count(*) INTO v_admin_outcome_count FROM public.aura_verified_outcomes_v1;

   PERFORM set_config('request.jwt.claim.sub',v_unpaired_uid::text,true);
   SELECT count(*) INTO v_unpaired_attempt_count FROM public.aura_attempts;
   SELECT count(*) INTO v_unpaired_outcome_count FROM public.aura_verified_outcomes_v1;
   SELECT count(*) INTO v_unpaired_learner_count FROM public.aura_learners;

   RAISE EXCEPTION 'AURA_ROLLBACK_EXPECTED';
 EXCEPTION WHEN raise_exception THEN
   IF SQLERRM<>'AURA_ROLLBACK_EXPECTED' THEN RAISE; END IF;
   -- This PostgreSQL subtransaction rollback removes all synthetic grading
   -- records and restores the role/JWT test context before the results insert.
 END;

 INSERT INTO pg_temp.aura_phase3fa_security_closure_results VALUES(
   v_inserted_count,v_admin_attempt_count,v_admin_outcome_count,
   v_unpaired_attempt_count,v_unpaired_outcome_count,v_unpaired_learner_count,true
 );
END;
$phase3fa$;

SELECT * FROM pg_temp.aura_phase3fa_security_closure_results;
-- Acceptance: fixture_count=1; admin_attempts=1; admin_outcomes=1;
-- unpaired_attempts=0; unpaired_outcomes=0; unpaired_learners=0.
-- Independently run security_closure_readonly.sql to ensure persisted
-- graded_attempts=0 and verified_outcomes=0 after completion.
