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
