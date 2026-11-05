# AURA STUDY — STAGING AUTH / PHASE 2C

Date: 2026-11-05  
Scope: Supabase project `aura-study-staging`, GitHub Pages diagnostic.  
Production approval: **NOT GRANTED**.

## Change
Applied Supabase migration `20261105061902_aura_phase2c_grant_scoped_learning_event_insert`.

The `authenticated` role receives INSERT on only these columns of `public.aura_learning_events`:
`event_id, learner_id, device_id, event_type, payload, client_created_at`.

RLS still requires:
- `actor_uid = auth.uid()` (server default).
- An active `aura_student_devices` row owned by the authenticated user with matching learner/device.
- `revoked_at IS NULL`.

No INSERT privilege is granted on `actor_uid` or `received_at`; no UPDATE/DELETE privileges are granted.

## Database tests — passed
- Valid paired student INSERT, with server-populated actor/time.
- Unpaired account INSERT denied.
- Admin impersonating student INSERT denied.
- Cross-learner INSERT denied.
- Unknown device INSERT denied.
- Actor UID override denied.
- Revoked device INSERT denied.

All simulated INSERT and revocation tests ran in transactions with ROLLBACK. Baseline verified after tests: 1 active device, 0 revoked devices, 0 learning events, 1 household, 1 learner.

## Real JWT test interface
`aura-staging-phase2c.html` uses the existing Admin/Student Supabase browser sessions.

Available actions:
1. Verify Admin via Auth server, Edge Function and RLS.
2. Verify Student via Auth server, Edge Function and RLS.
3. Append/read one clearly labeled STAGING test learning event.
4. Optionally create/pair/revoke a separate temporary Student and verify that its old JWT can no longer read/write. This action creates persistent test Auth/device rows and rotates any outstanding unused pairing code.

**The actual browser/JWT test has NOT been executed by the assistant.** It requires the user's browser session. The GitHub source commit is verified; GitHub Pages publication and live HTTP responses remain unverified.

## Remaining exit gates
- Browser real-JWT Admin check.
- Browser real-JWT Student check.
- Browser real-JWT Learning Event append/read.
- Browser isolated temporary-device revocation test.
- Review Supabase Advisor warnings, quota/rate limits, lifecycle of anonymous test accounts and stale temporary records.

Never share passwords, OTPs, JWTs or pairing codes in issues, chat, screenshots or repository files.


---

## Post-run E2E verification — 2026-11-05

**STAGING acceptance: ACCEPTED for the four Phase 2C scenarios; production deployment is NOT approved.**

User reports running **4/4** browser checks:
- Admin checked with real Supabase session.
- Student checked through Supabase Auth, Edge Function and RLS.
- Inserted and read back one Learning Event.
- Created, paired and revoked a separate temporary Student device, then checked authorization.

### Independent backend evidence (SQL)
- `auth.users`: 3 users, 2 anonymous.
- `aura_households`: 1 household; `aura_learners`: 1 learner.
- `aura_student_devices`: 2 devices total, 1 active (original), 1 revoked (the Phase 2C temporary device).
- `aura_learning_events`: 1 event identified by `payload.source = staging_phase2c`, type `lesson_viewed`.
- The event's `actor_uid` matched the device Auth UID, its learner matched the device learner and `received_at` was present.
- `aura_pairing_requests`: 2 redeemed requests.

### HTTP log evidence
Within the Supabase logs checked after the user-run:
- `POST /rest/v1/aura_learning_events`: HTTP 201 (accepted), plus HTTP 403 (denied request).
- `GET /rest/v1/aura_learning_events`: HTTP 200.
- `POST /functions/v1/aura-identity-pair`: HTTP 200 and 403 entries.

Caveat: HTTP status alone does not show the complete response body or map every request to one particular test. Browser-level JWT assertions are confirmed by the user's reported PASS results, supported by these logs, the database state, and earlier rollback-only RLS negative tests. The assistant did not impersonate the user's browser session.

### Scope of sign-off
Phase 2C browser scenarios have been accepted on STAGING. No changes were made in this verification step. Production approval remains blocked pending security advisor review, deployment controls, event integrity/idempotency tests, anonymous test-account retention policy, and Learning Data Pipeline design.

Do not publish raw JWTs, email addresses, pairing codes or user IDs in test reports.
