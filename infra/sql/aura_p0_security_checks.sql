-- AURA staging P0 security invariants. READ-ONLY checks; do not run on production.
-- Execute after infra/sql/aura_p0_core_draft.sql has been applied to a STAGING project.
-- These checks audit grants/RLS schema, not full authenticated role E2E tests.
do $$
declare tbl text;
begin
  foreach tbl in array array[
    'aura_households','aura_learners','aura_student_devices',
    'aura_content_items','aura_attempts','aura_learning_events'
  ] loop
    if not exists (
      select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname=tbl and c.relrowsecurity
    ) then
      raise exception 'RLS missing for %.%', 'public', tbl;
    end if;

    if has_table_privilege('anon', 'public.' || tbl, 'SELECT')
      or has_table_privilege('anon', 'public.' || tbl, 'INSERT')
      or has_table_privilege('anon', 'public.' || tbl, 'UPDATE')
      or has_table_privilege('anon', 'public.' || tbl, 'DELETE')
    then
      raise exception 'anon should have no table privilege on %', tbl;
    end if;

    if has_table_privilege('authenticated', 'public.' || tbl, 'UPDATE')
       or has_table_privilege('authenticated', 'public.' || tbl, 'DELETE')
    then
      raise exception 'Client must not update/delete %', tbl;
    end if;
  end loop;

  foreach tbl in array array[
    'aura_households','aura_learners','aura_student_devices',
    'aura_content_items','aura_attempts'
  ] loop
    if has_table_privilege('authenticated', 'public.' || tbl, 'INSERT') then
      raise exception 'Client must not INSERT %', tbl;
    end if;
  end loop;

  if not has_column_privilege(
    'authenticated','public.aura_learning_events','event_id','INSERT'
  ) then raise exception 'Student append access missing'; end if;

  if has_column_privilege(
    'authenticated','public.aura_learning_events','actor_uid','INSERT'
  ) or has_column_privilege(
    'authenticated','public.aura_learning_events','received_at','INSERT'
  ) then raise exception 'Client may forge server-authored fields'; end if;

  if not exists (
    select 1 from pg_policies where schemaname='public'
      and tablename='aura_content_items' and cmd='SELECT'
      and qual ilike '%ANSWER_KEY%' and qual ilike '%SOLUTION%'
  ) then raise exception 'Content key/SOLUTION gating policy missing'; end if;

  if not exists (
    select 1 from pg_policies where schemaname='public'
      and tablename='aura_attempts' and cmd='SELECT'
      and qual ilike '%released_at%' and qual ilike '%GRADED_FINAL%'
  ) then raise exception 'Premature grade release policy missing'; end if;

  raise notice 'AURA P0 static security checks passed; run real-identity tests next.';
end $$;

-- Manual staging E2E tests still required:
-- 1. Parent permanent Auth account reads its own household and learner.
-- 2. Unpaired anonymous Auth user reads zero learner/content/event rows.
-- 3. Paired anonymous Auth user sees exactly own learner and published non-key content.
-- 4. Student cannot SELECT ANSWER_KEY/SOLUTION or unreleased grade.
-- 5. Student INSERTs only own ungraded event; UPDATE/DELETE roles, grades, keys denied.
-- 6. Revoke membership via TRUSTED SERVER; following requests rejected.
-- 7. Another user/family cannot impersonate learner via crafted learner_id/device_id.
-- 8. Student event retries with same UUID do not create duplicate rows.
