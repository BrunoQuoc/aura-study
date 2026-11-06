# AURA STUDY — Phase 3F-A: Positive Anonymous & Unpaired RLS

Date: 2026-11-06. Environment: Supabase AURA STUDY STAGING.

## Current status

- Previous Admin CAPTCHA positive and negative E2E: PASS.
- Student anonymous CAPTCHA negative: 2/2 PASS.
- Read-only database RLS preflight with an existing unpaired anonymous identity: all nine read sources returned **zero visible rows**.
- Seven of nine sources have nonempty data; Attempts and Verified Outcomes are empty and cannot independently prove isolation.
- **New positive anonymous login and browser RLS checks: PENDING.**
- **PRODUCTION NO-GO.**

## Delivered STAGING browser test

Page: `auth/phase3fa-positive-unpaired.html`

- A fresh isolated browser profile, not the existing paired Student device.
- Two explicit approvals plus successful Cloudflare Turnstile verification.
- One attempt to create an anonymous Auth user, tagged with nonprivileged STAGING test metadata for later manual inventory.
- The test does not create a pairing code, assign a learner, submit assessments, or write Learning Events.
- Confirms anonymous Auth session using the Supabase Auth server.
- Uses count-only requests to nine RLS-protected resources. Any positive row count is FAIL and stops testing. Unexpected errors are INCONCLUSIVE.
- One-shot browser guard stores only a boolean; no JWT, OTP, email, UID or challenge token is displayed or saved in persistent storage.

**Risk:** A successful signup creates a durable anonymous Supabase Auth user. Closing the tab does not delete it. The browser test performs no automatic cleanup. A browser or network error can also occur after account creation, so do not retry until the account inventory is checked.

## Post-test read-only audit

File: `supabase/audits/aura_phase3fa_unpaired_positive_lifecycle_dry_run.sql`.

Baseline before running:
- 5 Auth users (4 anonymous).
- 1 active paired Student device.
- 13 Learning Events and 0 exam attempts.

Expected if a single new test identity is created, with no other operator activity:
- Auth users 6 (5 anonymous).
- Existing paired Student remains 1.
- No new learner, pairing, event or attempt.
- The new test identity is not linked to a learner.

Keep test identity for an authorized retention review after 30 days, subject to the owner-approved retention policy. Review sessions and dependencies before any separately approved cleanup. Test metadata is user editable, so it is only an inventory hint, never an authorization control or sole deletion criterion.

## Next acceptance

The operator opens the positive test page, consents locally, runs once, and shares only the redacted result panel. Reviewer cross-checks Auth counts and active pairing. Do not mark Phase 3F PRODUCTION GO: positive browser evidence, monitoring, release approvals and plan-gated leaked-password protection remain pending.

Docs:
- https://supabase.com/docs/guides/auth/auth-anonymous
- https://supabase.com/docs/reference/javascript/auth-signinanonymously
- https://supabase.com/docs/guides/database/postgres/row-level-security
