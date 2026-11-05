-- AURA STUDY / STAGING P0 ONLY — 2026-11-05
-- Draft SQL, NOT applied. Convert to an official migration using
--   supabase migration new aura_p0_core
-- after the CLI and a staging project are available.
-- One parent-admin household, exactly one learner per household.
-- Auth bootstrap, pairing and grading are trusted-server-only operations.
-- IMPORTANT: No client can write an official score, answer key or role.

begin;

create table if not exists public.aura_households (
  id uuid primary key default gen_random_uuid(),
  admin_uid uuid not null unique references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.aura_learners (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null unique references public.aura_households(id) on delete cascade,
  display_name text not null default 'Học sinh',
  created_at timestamptz not null default now(),
  unique (id, household_id)
);

create table if not exists public.aura_student_devices (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  learner_id uuid not null,
  auth_uid uuid not null unique references auth.users(id) on delete cascade,
  device_label text not null default 'Thiết bị học',
  paired_at timestamptz not null default now(),
  revoked_at timestamptz,
  foreign key (learner_id, household_id)
    references public.aura_learners(id, household_id) on delete cascade
);
create index if not exists aura_student_devices_learner_idx
  on public.aura_student_devices(learner_id, revoked_at);

create table if not exists public.aura_content_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.aura_households(id) on delete cascade,
  subject text not null check (subject in
    ('TOAN','NGUVAN','TIENGANH','LSDL','KHTN','TINHOC','CONGNGHE','GDCD')),
  title text not null,
  content_type text not null check (content_type in
    ('LESSON','PRACTICE','ASSESSMENT','WORKED_EXAMPLE',
     'FORMULA_NOTE','REFERENCE','ANSWER_KEY','SOLUTION','ACTIVITY','FLASHCARD_SET')),
  status text not null default 'DRAFT' check (status in
    ('DRAFT','NEEDS_REVIEW','APPROVED_PENDING_PUBLISH','PUBLISHED','PUBLISH_FAILED','REJECTED')),
  source_ref text,
  content_version integer not null default 1 check (content_version > 0),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  check ((status <> 'PUBLISHED') or published_at is not null)
);
create index if not exists aura_content_household_status_idx
  on public.aura_content_items(household_id, status);

-- Official attempt scores are written only by trusted grading service.
create table if not exists public.aura_attempts (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.aura_learners(id) on delete cascade,
  content_item_id uuid references public.aura_content_items(id) on delete set null,
  state text not null default 'SUBMITTED' check (state in
    ('SUBMITTED','PENDING_REVIEW','AI_PROVISIONAL','ADMIN_VERIFIED','GRADED_FINAL')),
  score numeric(8,3) check (score >= 0),
  max_score numeric(8,3) check (max_score > 0),
  score_verified boolean not null default false,
  submitted_at timestamptz not null default now(),
  graded_at timestamptz,
  released_at timestamptz,
  check (score is null or (max_score is not null and score <= max_score))
);
create index if not exists aura_attempts_learner_idx
  on public.aura_attempts(learner_id, submitted_at desc);

-- Append-only *ungraded* learning telemetry. Any scores or answers contained
-- inside payload must NEVER be treated as verified examination data.
create table if not exists public.aura_learning_events (
  event_id uuid primary key,
  learner_id uuid not null references public.aura_learners(id) on delete cascade,
  device_id uuid not null references public.aura_student_devices(id) on delete restrict,
  actor_uid uuid not null default auth.uid() references auth.users(id) on delete restrict,
  event_type text not null check (event_type in
    ('lesson_viewed','review_opened','practice_opened','draft_saved','learner_note')),
  payload jsonb not null default '{}'::jsonb check (
    jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 16384
  ),
  client_created_at timestamptz not null,
  received_at timestamptz not null default now()
);
create index if not exists aura_events_learner_cursor_idx
  on public.aura_learning_events(learner_id, received_at, event_id);

-- Every exposed public table MUST have RLS.
alter table public.aura_households enable row level security;
alter table public.aura_learners enable row level security;
alter table public.aura_student_devices enable row level security;
alter table public.aura_content_items enable row level security;
alter table public.aura_attempts enable row level security;
alter table public.aura_learning_events enable row level security;

-- Remove wide/default privileges; anon gets no access.
revoke all on public.aura_households, public.aura_learners,
  public.aura_student_devices, public.aura_content_items,
  public.aura_attempts, public.aura_learning_events from public, anon, authenticated;
grant usage on schema public to authenticated;
-- Trusted backend only. Never expose a service_role key in GitHub Pages.
grant select, insert, update, delete on public.aura_households, public.aura_learners,
  public.aura_student_devices, public.aura_content_items,
  public.aura_attempts, public.aura_learning_events to service_role;
grant select on public.aura_households, public.aura_learners,
  public.aura_student_devices, public.aura_content_items,
  public.aura_attempts, public.aura_learning_events to authenticated;
-- Restrict inserted columns: actor_uid and server timestamp are NOT client-writeable.
grant insert(event_id, learner_id, device_id, event_type, payload, client_created_at)
  on public.aura_learning_events to authenticated;

create policy "aura_parent_can_read_household"
  on public.aura_households for select to authenticated
  using (admin_uid = (select auth.uid()));

-- Device SELECT is for own linked device or its authorized parent.
create policy "aura_authorized_device_read"
  on public.aura_student_devices for select to authenticated
  using (
    auth_uid = (select auth.uid())
    or exists (
      select 1 from public.aura_households h
      where h.id = household_id and h.admin_uid = (select auth.uid())
    )
  );

create policy "aura_parent_or_paired_student_reads_learner"
  on public.aura_learners for select to authenticated
  using (
    exists (
      select 1 from public.aura_households h
      where h.id = household_id and h.admin_uid = (select auth.uid())
    )
    or exists (
      select 1 from public.aura_student_devices d
      where d.learner_id = id
        and d.auth_uid = (select auth.uid())
        and d.revoked_at is null
    )
  );

create policy "aura_parent_or_published_student_content"
  on public.aura_content_items for select to authenticated
  using (
    exists (
      select 1 from public.aura_households h
      where h.id = household_id and h.admin_uid = (select auth.uid())
    )
    or (
      status = 'PUBLISHED'
      -- Answer keys and solutions are never exposed via general content SELECT.
      -- Release of answers requires a separate server-authorized result endpoint.
      and content_type not in ('ANSWER_KEY','SOLUTION')
      and exists (
        select 1 from public.aura_learners l
        join public.aura_student_devices d on d.learner_id = l.id
        where l.household_id = aura_content_items.household_id
          and d.auth_uid = (select auth.uid())
          and d.revoked_at is null
      )
    )
  );

create policy "aura_parent_or_paired_student_reads_attempts"
  on public.aura_attempts for select to authenticated
  using (
    exists (
      select 1 from public.aura_learners l
      join public.aura_households h on h.id = l.household_id
      where l.id = aura_attempts.learner_id and h.admin_uid = (select auth.uid())
    )
    or (
      state = 'GRADED_FINAL' and released_at is not null
      and exists (
      select 1 from public.aura_student_devices d
      where d.learner_id = aura_attempts.learner_id
        and d.auth_uid = (select auth.uid()) and d.revoked_at is null
      )
    )
  );

create policy "aura_parent_or_paired_student_reads_events"
  on public.aura_learning_events for select to authenticated
  using (
    exists (
      select 1 from public.aura_learners l
      join public.aura_households h on h.id = l.household_id
      where l.id = aura_learning_events.learner_id
        and h.admin_uid = (select auth.uid())
    )
    or exists (
      select 1 from public.aura_student_devices d
      where d.learner_id = aura_learning_events.learner_id
        and d.auth_uid = (select auth.uid()) and d.revoked_at is null
    )
  );

create policy "aura_paired_student_can_append_ungraded_events"
  on public.aura_learning_events for insert to authenticated
  with check (
    actor_uid = (select auth.uid())
    and exists (
      select 1 from public.aura_student_devices d
      where d.id = aura_learning_events.device_id
        and d.learner_id = aura_learning_events.learner_id
        and d.auth_uid = (select auth.uid())
        and d.revoked_at is null
    )
  );

-- No INSERT/UPDATE/DELETE policies on accounts, content, attempts or devices.
-- Those require trusted authenticated server operations. No service key in JS.
commit;
