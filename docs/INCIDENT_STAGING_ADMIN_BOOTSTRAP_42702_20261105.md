# AURA STUDY — Staging incident: Admin bootstrap rejected after verified login
Date: 2026-11-05. Status: **FIX APPLIED / SQL DRY-RUN PASS / BROWSER RETEST PENDING**
Environment: Supabase staging only, project `ufqzuowjhdqpydqvcsob`.

## User-visible symptom
Admin clicked "Kiểm tra và kích hoạt quyền Admin"; staging page displayed
"This identity is not approved for Admin".

## Verified findings
- Exactly one Auth user was present for the preauthorized address, with verified email and non-anonymous identity.
- The SHA-256 email allowlist had one matching enabled entry.
- Household and learner rows were both zero after the failed click.
- Running `aura_bootstrap_parent(uuid)` under a rollback transaction reproduced SQLSTATE **42702**:
  ambiguous `household_id` inside `INSERT INTO aura_learners ... ON CONFLICT (household_id)`.
- The Edge handler incorrectly mapped **every** RPC error to a 403 "identity not approved" message; this concealed server SQL failures.

## Fixes applied
1. Versioned migration `20261105043009_aura_p0_bootstrap_conflict_fix_v1` (source: `infra/sql/aura_p0_bootstrap_conflict_fix.sql`) changes conflict target to `ON CONFLICT ON CONSTRAINT aura_learners_household_id_key`, avoiding the conflict with `RETURNS TABLE (household_id uuid,...)` output variable.
2. Edge Function `aura-identity-pair` redeployed **version 4** (source: `infra/edge/aura-identity-pair/index.ts`), distinguishes the explicit SQLSTATE 42501 authorization failure from other server-side RPC errors; no sensitive SQL error details are returned to browsers.

## Verification and next step
- Migration applied successfully; staging migration list confirms it.
- Repeated the bootstrap call with the verified, allowed Auth user inside `BEGIN ... ROLLBACK`: **1 result row**, no ambiguous-column exception.
- No user data was migrated; as of last read, still **0 households / 0 learner profiles**.
- The final user click is necessary to verify the actual authenticated browser → Edge → SQL path and commit the single household + learner.
- RLS policies and service-only RPC grants remain intact; existing unrelated staging Security Advisor notices are documented separately (two deliberate private-table deny-all INFO notices, plus Auth leaked-password-protection WARN).
- Production Student/Admin entrypoints were not touched; existing learner browser data untouched.

**Retest:** open `https://brunoquoc.github.io/aura-study/aura-staging-login.html`; refresh; click **Kiểm tra và kích hoạt quyền Admin**. If successful, the site should say "Đã xác minh quyền Admin và hồ sơ một học sinh trên Staging". Only after that test check DB counts and start pairing.
