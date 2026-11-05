# AURA STUDY — Rebuild P0 / Staging foundation
**Branch:** `rebuild/stability-v1-20261105`
**Status:** SOURCE SCAFFOLD READY · CLOUD PROJECT NOT CREATED · NOT PRODUCTION
**Baseline:** `backup/pre-rebuild-2026-11-05` at SHA `61a57f1ecaa2742438fa2e725bc22c5b3d7f582e`.

## Implemented on this branch
- `sql/aura_p0_core_draft.sql`: proposed one-learner/parent role schema, student device membership and revoked-device checks, published content registry, official grading records readable only after verified release, append-only **ungraded** learning events with RLS.
- `sql/aura_p0_security_checks.sql`: read-only database privilege and policy inspection script plus a checklist for real-identity tests.
- `client/aura_outbox.mjs`: IndexedDB durable queue for ungraded study events, safe deletion only after server acknowledgement, conflict-ignore idempotent batch transport over HTTPS/JWT.
- `client/aura_outbox.test.mjs`: dependency-free eight-case Node test suite (`node --test infra/client/aura_outbox.test.mjs` from repository root).
- `../docs/STEP1_BASELINE_AUDIT_20261105.md`: backup and inventory of the legacy system.

**This code is NOT wired into Student or Admin production HTML. No legacy localStorage or Drive files were changed.**

## Permissions / data protection
- Student does not self-create, delete or reassign learner/device accounts. A trusted server creates the household and pairs devices to the **one** learner in that household.
- Parent account is a verified permanent Supabase Auth user; the student device can use Supabase anonymous auth but must be paired and active before RLS permits access.
- Both Admin and Student are represented by a Postgres `authenticated` API role. The server validates `auth.uid()` against stored household ownership or active device membership, NOT a browser flag, email string or user-supplied metadata.
- `aura_content_items` contains metadata only. Student cannot SELECT `ANSWER_KEY` or `SOLUTION` records, regardless of PUBLISHED status. Do not store answers or solution bodies in any Student-readable lesson payload before grading.
- `aura_attempts` grades are service-write-only. Student sees them only after `GRADED_FINAL` + `score_verified` + `released_at`. There is no early release of grading or hints.
- `aura_learning_events` is untrusted activity telemetry, **not** official graded exam submissions. Data in its JSON payload is not proof of correct answers.
- The browser uses only a publishable key and a signed-in user's JWT. A service_role/secret must never enter GitHub Pages, client config or backup JSON.
- Student handwriting/voice/answer media must later go to private authenticated storage. This branch currently does NOT implement upload, pairing, grading or private buckets.

## Supabase staging activation checklist (NOT DONE)
1. Parent chooses the target Supabase **organization**; `list_organizations` returned one, but the organization has not been explicitly selected for a new project. Creating the project might incur cost and must go through the provider's confirmation flow.
2. Create a **staging** Supabase project in suitable region (suggest `ap-southeast-1`, Singapore; final choice by Parent/provider availability). Do not point anything to production domain.
3. Enable verified Parent email authentication. Enable student anonymous sign-in only with abuse protection/CAPTCHA and rate limits appropriate for public-facing app.
4. Get staging project ref, publishable key and API URL from Supabase **server settings**; only publishable values may appear in client config. Never store API secret keys in repo.
5. Convert `sql/aura_p0_core_draft.sql` into a real versioned migration **using** `supabase migration new aura_p0_core` (CLI required; not available in this agent's runtime), or apply the vetted DDL using the Supabase staging migration tool, then retain migration history. First run `sql/aura_p0_security_checks.sql` and the Security Advisor.
6. Implement two **trusted server** operations:
   - `bootstrapParent`: verified, nonanonymous parent signs in, server creates exactly one household and one learner, once only; identity and role validated server-side.
   - `pairStudentDevice`: parent obtains short-lived, single-use pairing code with bounded attempts; student anonymous Auth user redeems it via trusted server; server atomically creates active membership for the pre-existing learner. Avoid raw PIN/token in permanent DB; store hashed one-time code with TTL and auditable use.
   - `revokeStudentDevice`: parent revokes membership; subsequent server requests rejected. Check RLS after revoke. Session JWT itself may remain valid, but membership becomes immediately ineffective at database policy layer.
7. Write independent Student/Admin staging smoke test screens. No answer keys in Student bundle. Implement incremental server pull cursor and conflict rules before claiming cross-device sync.
8. Run real accounts/RLS tests: unpaired identity reads zero records, paired identity sees one learner only, revoked identity loses access, Student cannot edit grades/roles and cannot fetch keys pre-release. Run across Chrome/iPad/Android.
9. Export and verify browser-local legacy backup **from each actual student browser profile** before **any** migration; preserve separate originals, dry-run import, confirm record counts. Drive content backup also remains pending.

## Risk / NO-GO rules
- No user personal/child data in public GitHub issues/branches.
- No client-side master PIN as authorization, no broad `TO authenticated USING(true)`.
- No early answer release, no unverified AI grades entered into the official competency map.
- No mutation of existing Google Drive files or production `main`.
- No claim that the cloud sync works until a staging project exists and device E2E actually passes.

## Links
- Approved product standards: `../docs/AURA_OFFICIAL_8_SUBJECT_STANDARDS_V1_APPROVED.md` on `design/single-learner-sync-v1`.
- Official Supabase docs: https://supabase.com/docs/guides/database/postgres/row-level-security
- Anonymous login constraints: https://supabase.com/docs/guides/auth/auth-anonymous
- API security (GRANT + RLS): https://supabase.com/docs/guides/api/securing-your-api
