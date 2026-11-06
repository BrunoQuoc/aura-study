# AURA STUDY — PHASE 3F-A
## Anonymous Student CAPTCHA Verification & Auth Rate Limits

**Environment:** Supabase `aura-study-staging`, GitHub Pages `brunoquoc.github.io/aura-study`  
**Date:** 2026-11-06  
**Current decision:** **NEGATIVE TEST IMPLEMENTED, BROWSER E2E PENDING. RATE LIMIT CONFIG REVIEW PENDING. PRODUCTION NO-GO.**

### 1. Baseline and inherited acceptance

- Admin Turnstile frontend widget PASS, Magic Link + PKCE + Admin API authorization positive E2E PASS.
- Admin OTP Auth server CAPTCHA negative verification **2/2 PASS**, observed `captcha_failed` for invalid and absent tokens.
- Existing STAGING baseline: **5 Auth users (4 anonymous), 1 active paired Student device, 13 Learning Events, 0 attempts**. No write or existing Student revocation performed during development of this phase.
- Turnstile Site Key is **public**. The rotated Turnstile Secret Key must never be shared via chat or committed to GitHub.

### 2. Negative anonymous Auth endpoint test — implementation

**Browser UI:** `auth/phase3fa-student-captcha-negative.html`  
**Rules:** `auth/phase3fa-anonymous-captcha-policy.js`  
**Unit tests:** `tests/phase3fa-anonymous-captcha.test.mjs`  
**CI:** `.github/workflows/aura-phase3fa-auth-hardening.yml` (manual-only, no network from tests)

The diagnostic calls `supabase.auth.signInAnonymously()` on STAGING:
1. One request with an intentionally invalid `options.captchaToken`.
2. Only if step 1 returns an explicit `captcha_failed`, one request with **no CAPTCHA token**.

It uses a **new isolated Auth client** with `persistSession:false`, `autoRefreshToken:false`, `detectSessionInUrl:false`; it cannot replace the stored Admin or paired Student session in the AURA login page. The operator must consent to the possibility of an unexpected Auth user being created if CAPTCHA is misconfigured. Once clicked, the suite is single-use and has **no retries**. It never requests pairing codes, writes Learning Events, or displays JWTs, user IDs, session information, OTPs or raw Auth error bodies.

**CRITICAL:** Unlike Admin OTP with `shouldCreateUser:false`, `signInAnonymously()` **can create a durable anonymous Auth account** if the server unexpectedly accepts a negative request. Therefore, "no account created" is not an unconditional promise. The page halts immediately and warns that any accidentally created test account requires an authorized review and cleanup workflow. No automatic deletion occurs.

| Request result | Interpretation |
|---|---|
| `captcha_failed` | **PASS** for that negative case |
| HTTP 429, `over_*_rate_limit` | **INCONCLUSIVE**, rate-limit behavior is not CAPTCHA proof |
| Other Auth error or connection failure | **INCONCLUSIVE**, do not retry blindly |
| Successful request | **FAIL**, possible new Auth user, stop and inspect counts |

**Acceptance requires 2/2 PASS**, a screenshot containing only the output panel, and a post-test Supabase Auth user/device/event count cross-check.

### 3. Rate limits — READ-ONLY review, actual values not yet captured

Supabase Dashboard → **Authentication → Rate Limits**:
https://supabase.com/dashboard/project/ufqzuowjhdqpydqvcsob/auth/rate-limits

| Protection | Endpoint | Supabase documentation | Config evidence |
|---|---|---|---|
| Anonymous sign-ins | `/auth/v1/signup` (without email/phone) | IP-based; documentation lists as **not customizable**; built-in limit and burst. | **PENDING DASHBOARD REVIEW** |
| OTP sends | `/auth/v1/otp` | Project-wide limit; **customizable**. | **PENDING** |
| OTP/email resend cooldown | `/auth/v1/otp` | Per-user interval; **customizable**. | **PENDING** |
| Built-in outbound email quota | `/auth/v1/signup`, `/auth/v1/recover`, etc. | Project-wide built-in quota; customization generally requires custom SMTP. | **PENDING** |
| Verification | `/auth/v1/verify` | IP-based; documentation lists as **not customizable**. | **PENDING** |
| Refresh token | `/auth/v1/token` | IP-based; documentation lists as **not customizable**. | **PENDING** |

The Dashboard and provider configuration are the authoritative sources for current project-specific values, not generic documentation defaults. Connected Supabase tools in this session do **not** provide a read method for the Auth management configuration, and no access token for the Management API should be supplied to ChatGPT. A screenshot of the Rate Limits page with secrets/redacted account data is the next required evidence.

**Avoid request flooding to force HTTP 429.** One screenshot of a settings page can confirm configured thresholds, but does **not** independently establish enforcement. Any later load/429 tests require a bounded plan, dedicated test identities, a low-traffic window, authorized operator ownership and observability. 429 is not interchangeable with CAPTCHA validation failure.

References:
- https://supabase.com/docs/guides/auth/rate-limits
- https://supabase.com/docs/reference/javascript/auth-signinanonymously
- https://supabase.com/docs/guides/auth/auth-anonymous
- https://supabase.com/docs/guides/auth/auth-captcha

### 4. Acceptance roadmap

- **A — Anonymous CAPTCHA negative:** 2/2 `captcha_failed` using STAGING browser test and post-test Auth count unchanged.
- **B — Anonymous CAPTCHA positive:** isolated single-use temporary Student `signInAnonymously({options:{captchaToken}})`, confirm `is_anonymous`, verify **no unpaired access** under RLS. Requires approved test-user retention/cleanup plan. Do not pair with the active learner.
- **C — Rate limit configuration inventory:** review Dashboard values, units, bursts and operator ownership for OTP, anonymous, verification and refresh. No stress testing without approval.
- **D — Final security review:** Supabase Security Advisor, leaked-password Pro-only warning disposition, secure device handling and independent sign-off.

**No phase or production release gate is marked PASS until its own evidence is received. PRODUCTION NO-GO.**
