-- AURA STUDY Phase 3E: deterministic STAGING role/grades regression.
-- Test fixtures and simulated revoke are all rolled back. DO NOT RUN IN PROD.
BEGIN;
SET LOCAL statement_timeout='20000ms';

SELECT set_config('p3e.learner',(SELECT learner_id::text FROM public.aura_student_devices WHERE revoked_at IS NULL LIMIT 1),true);
SELECT set_config('p3e.device',(SELECT id::text FROM public.aura_student_devices WHERE revoked_at IS NULL LIMIT 1),true);
SELECT set_config('p3e.student',(SELECT auth_uid::text FROM public.aura_student_devices WHERE revoked_at IS NULL LIMIT 1),true);
SELECT set_config('p3e.admin',(SELECT admin_uid::text FROM public.aura_households LIMIT 1),true);
SELECT set_config('p3e.practice',(SELECT id::text FROM public.aura_content_items WHERE source_ref='AURA_STAGING_PHASE3B:PRACTICE:v1' LIMIT 1),true);

DO $fixture$
DECLARE rejected boolean;
BEGIN
 IF current_setting('p3e.practice',true) IS NULL THEN RAISE EXCEPTION 'No Phase 3B staging practice'; END IF;
 INSERT INTO public.aura_attempts
   (learner_id,content_item_id,state,score,max_score,score_verified,released_at)
 VALUES
   (current_setting('p3e.learner')::uuid,current_setting('p3e.practice')::uuid,'PENDING_REVIEW',3,10,false,NULL),
   (current_setting('p3e.learner')::uuid,current_setting('p3e.practice')::uuid,'GRADED_FINAL',5,10,true,NULL),
   (current_setting('p3e.learner')::uuid,current_setting('p3e.practice')::uuid,'GRADED_FINAL',8,10,true,now());
 rejected:=false;
 BEGIN
  INSERT INTO public.aura_attempts
   (learner_id,content_item_id,state,score,max_score,score_verified,released_at)
  VALUES (current_setting('p3e.learner')::uuid,current_setting('p3e.practice')::uuid,'GRADED_FINAL',6,10,false,now());
 EXCEPTION WHEN check_violation THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'Unverified result illegally released'; END IF;
 rejected:=false;
 BEGIN
  INSERT INTO public.aura_attempts
   (learner_id,content_item_id,state,score,max_score,score_verified,released_at)
  VALUES (current_setting('p3e.learner')::uuid,current_setting('p3e.practice')::uuid,'ADMIN_VERIFIED',6,10,true,now());
 EXCEPTION WHEN check_violation THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'Nonfinal attempt illegally released'; END IF;
END $fixture$;

SELECT set_config('request.jwt.claim.sub',current_setting('p3e.student'),true);
SET LOCAL ROLE authenticated;
DO $student$
BEGIN
 IF (SELECT count(*) FROM public.aura_attempts)<>1 THEN
   RAISE EXCEPTION 'Student can read unfinished or unreleased attempts'; END IF;
 IF (SELECT count(*) FROM public.aura_verified_outcomes_v1)<>1 THEN
   RAISE EXCEPTION 'Verified final outcome is not visible'; END IF;
 IF has_table_privilege('authenticated','public.aura_attempts','INSERT')
    OR has_table_privilege('authenticated','public.aura_attempts','UPDATE')
    OR has_table_privilege('authenticated','public.aura_attempts','DELETE') THEN
    RAISE EXCEPTION 'Attempt mutation privilege leaked'; END IF;
 IF has_function_privilege('authenticated','public.aura_redeem_device_pairing(text,uuid,text)','EXECUTE')
    OR has_function_privilege('authenticated','public.aura_bootstrap_parent(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'Privileged RPC permission leaked'; END IF;
END $student$;
RESET ROLE;

SELECT set_config('request.jwt.claim.sub',current_setting('p3e.admin'),true);
SET LOCAL ROLE authenticated;
DO $parent$
BEGIN
 IF (SELECT count(*) FROM public.aura_attempts)<>3 THEN
  RAISE EXCEPTION 'Parent missing own review record'; END IF;
END $parent$;
RESET ROLE;

SELECT set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
SET LOCAL ROLE authenticated;
DO $unpaired$
BEGIN
 IF (SELECT count(*) FROM public.aura_attempts)<>0
 OR (SELECT count(*) FROM public.aura_verified_outcomes_v1)<>0
 THEN RAISE EXCEPTION 'Unpaired account can see results'; END IF;
END $unpaired$;
RESET ROLE;

UPDATE public.aura_student_devices SET revoked_at=now()
WHERE id=current_setting('p3e.device')::uuid AND revoked_at IS NULL;

SELECT set_config('request.jwt.claim.sub',current_setting('p3e.student'),true);
SET LOCAL ROLE authenticated;
DO $revoked$
BEGIN
 IF (SELECT count(*) FROM public.aura_attempts)<>0
 OR (SELECT count(*) FROM public.aura_verified_outcomes_v1)<>0
 THEN RAISE EXCEPTION 'Revoked device can read results'; END IF;
END $revoked$;
RESET ROLE;
ROLLBACK;

SELECT 'PASS: final/release constraints, parent/student isolation, zero client grading privileges, revoked and unpaired denial; all fixtures rolled back' AS result;
