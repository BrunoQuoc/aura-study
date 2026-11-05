# AURA STUDY — Phase 3F-A: Auth Security Hardening

**As-of:** November 5, 2026. **Environment:** Supabase aura-study-staging / GitHub BrunoQuoc/aura-study.
**Decision:** **PARTIAL STAGING HARDENING SHIPPED; SERVER CAPTCHA AND RATE LIMIT REMEDIATION PENDING; PRODUCTION NO-GO.**

No changes were made to Supabase Auth settings, existing learner records, paired Student devices, server RLS or production.

## 1. Baseline and observed risks

- 8/8 public AURA business tables have RLS. Anonymous Student users get the PostgreSQL authenticated role, so ownership/device checks must remain authoritative.
- Auth user inventory: five users total, four anonymous, one email-provider Admin user with a stored password hash. No passwords or hashes were exported.
- One household, one learner, one active paired Student, three previously revoked test devices; two synthetic content entries, 13 events, zero attempts.
- No active unused pairing codes.
- Supabase Security Advisor still warns about anonymous sign-in policies and disabled leaked-password protection. Two internal backend tables deliberately have RLS with no client-facing policies.
- The existing identity-pair Edge Function verifies JWTs, checks Admin activation, limits pairing codes to 10 minutes, and uses CORS origin filtering. CORS is not rate limiting. Abuse monitoring/throttling for privileged actions needs additional review.
- Previously, the public Admin OTP login used shouldCreateUser:true, permitting creation of unregistered Auth accounts, although allowlist-based Admin bootstrap still denied actual Admin rights.

## 2. Implemented on STAGING GitHub Pages

| Component | Delivered change |
|---|---|
| aura-staging-login.html | Admin OTP now uses shouldCreateUser:false, so unknown email addresses are not auto-created through this UI; adds a 60-second UI resend cooldown and separate optional CAPTCHA paths for Admin and Student. |
| auth/phase3fa-security-config.js | Staging config, CAPTCHA currently **disabled**, public Turnstile Site Key blank. |
| auth/phase3fa-turnstile.js | Turnstile adapter, separate Admin and Student challenges, token validation/reset and allowlisted OTP redirect origins. |
| auth/phase3fa-check.html | Read-only existing-session and RLS smoke checks; no login, Auth user creation or pairing requests. |
| tests/phase3fa-auth-hardening.test.mjs | Offline contract tests for OTP, CAPTCHA, origin and token separation. |
| .github/workflows/aura-phase3fa-auth-hardening.yml | Manual-only read-only tests. No deploy steps or Supabase secrets. |

**Important:** Server-side CAPTCHA enforcement was **not verified or changed** in this phase; do not infer activation from the frontend code. A local cooldown is NOT a defense against direct API calls. A Site Key can be public; the private Turnstile Secret Key must never be committed to GitHub or shared in chat.

## 3. Coordinated Turnstile activation (NOT YET EXECUTED)

1. Create a STAGING-only Cloudflare Turnstile widget restricted to brunoquoc.github.io, and test permitted local domains separately. Keep the Secret Key private.
2. Set captchaMode to "turnstile" and enter the public Site Key in auth/phase3fa-security-config.js. Publish GitHub Pages. Confirm visible widgets for both Admin Magic Link and new Student anonymous signup.
3. Confirm requests without a solved challenge cannot proceed in the frontend; verify signInWithOtp and signInAnonymously receive options.captchaToken. The frontend resets challenges after a call.
4. Only after the frontend is confirmed ready, enable CAPTCHA in Supabase STAGING Dashboard → Authentication → Bot and Abuse Protection → Enable CAPTCHA protection. Select Cloudflare Turnstile and enter the private Secret Key in Supabase settings, not GitHub.
5. Use a separate temporary test browser profile to test a new anonymous Student login and a registered Admin's Magic Link. Do not alter the original paired Student. A new anonymous user requires test-account lifecycle approval.
6. Verify valid challenges succeed and missing/invalid tokens fail server-side; check Admin allowlist, pairing, RLS, and post-test Auth counts.
7. If login fails after server activation, temporarily revert the STAGING server CAPTCHA toggle first. Leave the new UI compatible with CAPTCHA, and inspect Auth logs. Never disable RLS to fix an Auth problem.

Official docs:
- https://supabase.com/docs/guides/auth/auth-captcha
- https://supabase.com/docs/reference/javascript/auth-signinanonymously
- https://supabase.com/docs/guides/auth/auth-anonymous

## 4. Server Auth rate limits (PENDING)

Supabase Dashboard → Authentication → Rate Limits. Review the actual present limit and units for anonymous sign-ins, OTP/email sends, verification and refresh. Set a conservative, usage-informed configuration and verify normal Admin/Student onboarding alongside controlled 429 behavior. Keep OTPs, JWTs and personal identifiers out of public logs.

Reference: https://supabase.com/docs/guides/auth/rate-limits

## 5. Leaked password protection (PENDING)

Because the email-provider account has a password hash, Magic Link usage alone does not justify dismissing the warning. Determine whether password sign-in is enabled. Enable leaked-password protection if available, or formally document and approve a suitable alternative; verify Admin Magic Link continues to work after changing Auth settings. No password/hash needs to be read or shared.

Reference: https://supabase.com/docs/guides/auth/password-security

## 6. Test and acceptance

Run the read-only phase3fa-check.html page on the original browser profile:
- UI contract: Admin auto-signup disabled; CAPTCHA status reported.
- Student Auth: original paired device still recognized without making a new user.
- Student RLS: two Phase3B published synthetic entries readable.
- Admin Auth: existing Admin session valid in its usual browser profile; no OTP requested.

After activating server CAPTCHA, run a separate controlled new-login test with valid and invalid CAPTCHA tokens, Admin OTP, a temporary anonymous device and RLS negative cases. Also validate configured Auth limits with safe controlled 429 tests and rescan Supabase Security Advisor.

**These post-activation tests are NOT YET PASSED.**

## 7. Release gate status

The Phase 3F Production Readiness manifest must retain ANONYMOUS_AUTH_ABUSE and PASSWORD_BREACH_PROTECTION as **OPEN** until server-side enforcement and independently reviewed evidence exist.

**Production remains NO-GO.** Do not copy STAGING accounts, learner content, or diagnostic events to production.


---

## 8. Auth browser regression acceptance — 2026-11-05

**Decision: ACCEPTED — read-only STAGING Auth UI/session/RLS regression, 4/4 checks.**
**Not accepted: server-side CAPTCHA, Auth rate limits and leaked-password protection; PRODUCTION remains NO-GO.**

### Browser evidence from the paired user's session

1. **UI Auth contract — PASS:** public login config enforces no automatic new Admin Auth account via the UI's Magic Link (`shouldCreateUser:false`). CAPTCHA frontend mode is explicitly **CHƯA KÍCH HOẠT**; Supabase server CAPTCHA remains **CHƯA XÁC MINH**. This checks UI contract, not actual negative signup via Auth API.
2. **Student Auth and device — PASS:** Auth `getUser()` returned the existing anonymous Student; paired-device RLS lookup succeeded.
3. **Knowledge Library RLS — PASS:** Student read **2/2 PUBLISHED Phase3B** content items. Test did not write Learning Events or scores.
4. **Admin Auth — PASS:** existing Admin session authenticated with the Auth server, without requesting new OTP or pairing code. This does **not** by itself re-test Admin's full bootstrap authorization.

### Independent Supabase snapshot after screenshot

- 5 Auth users, 4 anonymous.
- 1 household, 1 learner, **1 active paired Student device**, 3 historically revoked devices.
- 13 Learning Events, **0 Phase3F-A events**, 0 attempts; 2 published Phase3B items; 2 counted activities in Learning Progress.
- Simulated Student RLS query: 2 published content items, 1 active paired device visible, **0 household Admin rows**, 2 counted progress events.
- Security Advisor unchanged: six `auth_allow_anonymous_sign_ins` warnings, one `auth_leaked_password_protection` warning and two informational tables intentionally without direct RLS policies.

### Explicitly unresolved before any Phase 3F-A server security sign-off

- Configure and activate Cloudflare Turnstile frontend widget + matching Supabase Auth server CAPTCHA (coordinated rollout; no secret in repo/chat).
- Validate anonymous signup and Admin OTP with valid CAPTCHA, reject missing/invalid CAPTCHA via the actual server, and check active Student unaffected.
- Inspect / adjust server Auth rate limits with an approved owner, then test controlled 429 without production traffic.
- Enable leaked-password protection if available, or formally approve an alternative after verifying actual password-login settings.
- Repeat Security Advisor, RLS and Auth E2E evidence and record operator sign-off.

The existing Auth/anonymous-abuse and password-protection production release gates remain **OPEN**. No server Auth configuration was changed by the browser tests. No STAGING data cleanup or production promotion performed.


---

## 9. Attack Protection dashboard evidence — 2026-11-05

The operator provided a screenshot of **Supabase STAGING → Authentication → Attack Protection**. The visible settings show:

- **Enable Captcha protection: OFF** (toggle gray).
- **Prevent use of leaked passwords: DISABLED**, with an entry point named **Configure in email provider**.
- No unsaved changes were visible; **Save changes** was inactive.

These are **observed dashboard settings**, not evidence of configuration activation. No key, token, email or personal data was supplied, and no server configuration was changed.

**Safe activation sequence:** Create a STAGING-only Cloudflare Turnstile widget, add its **public Site Key** to the public frontend and publish/verify functioning independent Admin and Student challenges; only then enable CAPTCHA in Supabase using the **private Secret Key** inside the Dashboard. Verify valid/invalid tokens for both signup and Magic Link, restore the STAGING CAPTCHA toggle to OFF first if it blocks onboarding. Do not disable RLS or revoke the original paired Student. For leaked password protection, inspect the email provider setting and plan availability without changing login methods by assumption.

**Status:** `ANONYMOUS_AUTH_ABUSE` and `PASSWORD_BREACH_PROTECTION` remain OPEN. Production NO-GO.
