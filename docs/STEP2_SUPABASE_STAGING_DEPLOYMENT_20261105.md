# AURA STUDY — Bước 2, Staging Deployment Record
Ngày triển khai: 2026-11-05
Environment: STAGING ONLY; no student records migrated and no production changes.

## Supabase project
- Project: `aura-study-staging`
- Project ref: `ufqzuowjhdqpydqvcsob`
- Region: `ap-southeast-1` (Singapore)
- Reported creation quote: 0 USD/month (this is the provider quote at creation, not a promise of permanent future pricing).
- Project status at inspection: `ACTIVE_HEALTHY`
- Migration: `20261105034452_aura_p0_core_single_learner_v1` (applied successfully via Supabase migration action)
- Source SQL: `infra/sql/aura_p0_core_draft.sql` (now represents the applied *first migration*; subsequent schema changes must have their own migration names; never edit deployed history in place).

## Live schema checks (executed against staging)
- 6 public tables exist: `aura_households`, `aura_learners`, `aura_student_devices`, `aura_content_items`, `aura_attempts`, `aura_learning_events`.
- Every table has `relrowsecurity = true`.
- The `anon` role has no table SELECT privilege.
- `authenticated` does not have table UPDATE privilege on any of these tables.
- Read-only `infra/sql/aura_p0_security_checks.sql` executed without an exception.
- Supabase Security Advisor: `lints: []` at time of inspection.
- Simulated unpaired authenticated role, JWT subject `11111111-1111-4111-8111-111111111111`: SELECT count returned **zero rows for all six tables**. This is a no-fixture test (does not establish that a real admin or paired student works).

## Verified local-first client logic
- Staging source: `infra/client/aura_outbox.mjs`; event queue backed by IndexedDB and server-ACK gated deletes.
- 8 mock transport unit cases passed during source-level execution (offline retention, retry, partial and unexpected ACKs, duplicate concurrent flush, auth request, invalid event type).
- Test suite persisted: `infra/client/aura_outbox.test.mjs`.
- **Not yet tested** with a real browser IndexedDB, authenticated Student JWT, real PostgREST insert, or two actual devices.

## Security limits / not completed
- No parent identity is provisioned or bound to `aura_households.admin_uid`. We do not infer Admin credentials from Supabase organization name or email.
- No trusted parent-bootstrap, one-time device-pairing or revocation Edge Functions are deployed. **Do not create a public first-claim-admin endpoint without preauthorizing the correct parent UID/email.**
- Supabase Auth configuration (verified email, anonymous sign-in anti-abuse, rate limits), storage buckets, attachment uploads and exam grading services are not yet implemented.
- Existing repository login scripts are **not** wired to staging; no GitHub Pages runtime changes.
- No local browser history or existing Google Drive documents have been migrated. Do not delete/clear existing browser data.
- Protected exam answer-key release requires a separate server-authenticated endpoint; `ANSWER_KEY` and `SOLUTION` are excluded from ordinary Student SELECT; provisional grades are hidden.

## Next gates
1. Admin confirms the email address they will use for login or pre-provisions a verified Supabase Auth identity through a secure Admin-only action (do not send password or OTP in chat).
2. Implement trusted parent bootstrap restricted to that verified identity; **no untrusted public "claim admin"** path.
3. Implement signed, short-lived, one-time device-pairing flow with rate limits and revocation, plus service-only writes and audit logs. Use a separate migration for pairing token storage.
4. Run real Auth + RLS tests using authenticated Admin, unpaired anonymous student, paired student and revoked student on staging.
5. Wire a separate staging-only Student/Admin UI to the secure backend (not existing production pages). Confirm offline→online across devices.
6. Keep existing browser backups pending. Never migrate or switch production before verified backups, rollback and E2E.
