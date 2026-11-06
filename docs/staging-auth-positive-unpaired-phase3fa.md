# AURA STUDY — Phase 3F-A: Positive Anonymous & Unpaired RLS

Date: 2026-11-06. Environment: Supabase AURA STUDY STAGING.

## Current status

- Previous Admin CAPTCHA positive and negative E2E: PASS.
- Student anonymous CAPTCHA negative: 2/2 PASS.
- Read-only database RLS preflight with an existing unpaired anonymous identity: all nine read sources returned **zero visible rows**.
- Seven of nine sources have nonempty data; Attempts and Verified Outcomes are empty and cannot independently prove isolation.
- **Positive anonymous login with valid Turnstile: PASS. Real-browser unpaired RLS: 9/9 PASS (7 sources with seed data, 2 empty baseline).**
- **Post-test Auth/data lifecycle inventory: PASS; 1 test identity tagged and unpaired.**
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

Operator screenshot and Supabase inventory were received and reconciled. Continue with explicit 30-day test-account retention review, abuse monitoring / 429 strategy, seeded Attempts/Verified Outcomes isolation coverage, independent production approvals and plan-gated leaked-password protection. Do not mark Phase 3F PRODUCTION GO.

Docs:
- https://supabase.com/docs/guides/auth/auth-anonymous
- https://supabase.com/docs/reference/javascript/auth-signinanonymously
- https://supabase.com/docs/guides/database/postgres/row-level-security


## Acceptance — real browser positive E2E and post-test lifecycle audit

**Decision (2026-11-06): STAGING POSITIVE ANONYMOUS & UNPAIRED RLS E2E ACCEPTED, WITH COVERAGE LIMITS.**

The operator's browser screenshot shows Cloudflare Turnstile Success, both consent checkboxes accepted, one-time positive anonymous signup, successful Supabase Auth server identity verification with `is_anonymous=true`, and nine count-only RLS reads returning zero accessible rows.

**Browser access checks:** Household 0; Learner 0; Student devices 0; Knowledge Library 0; Learning Events 0; Learning Progress 0; Daily Activity 0; Attempts 0 (no seed records); Verified Outcomes 0 (no seed records). Thus 9/9 count-only checks PASS, with **seven seeded sources and two empty-source limitations**. The page did not submit learning events, grades, pairings or exam attempts.

**Independent Supabase read-only audit AFTER the browser run:**

| Measure | Baseline | Post-test | Conclusion |
|---|---:|---:|---|
| Total Auth users | 5 | 6 | Exactly +1 expected |
| Anonymous Auth users | 4 | 5 | Exactly +1 expected |
| Phase3F-A positive metadata marker | 0 | 1 | Tagged test account exists |
| Active Student pairings | 1 | 1 | Original paired device preserved |
| Tagged user's device records (active or revoked) | 0 | 0 | No pairing history for test UID |
| Tagged user's Learning Events | 0 | 0 | No test learner writes |
| All Learning Events | 13 | 13 | Unchanged |
| Attempts | 0 | 0 | Unchanged |
| Households / Learners | 1 / 1 | 1 / 1 | Unchanged |
| Published/staged content items | 2 | 2 | Unchanged |

Tagged user created **2026-11-06 07:14 UTC** (operator-identifying UID deliberately not copied into this report). All test-account metadata is user-editable, an **inventory hint only**, never an authorization source or sole deletion criterion. At audit time the account is newer than 30 days and has no device or event links.

**Lifecycle:** retain the isolated test identity for a manually approved review at the 30-day milestone, unless a documented exception is authorized. Do not automatically delete or revoke Auth sessions. Any future cleanup requires an authorized operator to verify the exact identity and dependencies privately, retention obligations and approval trail. Closing the private window does not delete the server-side Auth account.

**Scope not covered:** Attempts and Verified Outcomes currently lack seeded records, so RLS denial against a nonempty graded dataset remains untested; threshold-based 429 enforcement and monitoring; production-auth account policies; plan-gated leaked-password protection. `ANONYMOUS_AUTH_ABUSE` stays **OPEN**, and production release remains **NO-GO**.
