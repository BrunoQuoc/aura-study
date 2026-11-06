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
| Anonymous sign-ins | `/auth/v1/signup` (without email/phone) | IP-based; October 26, 2026 docs indicate **customizable**; verify actual Dashboard values and limits before changes. | **PENDING DASHBOARD REVIEW** |
| OTP sends | `/auth/v1/otp` | Project-wide limit; **customizable**. | **PENDING** |
| OTP/email resend cooldown | `/auth/v1/otp` | Per-user interval; **customizable**. | **PENDING** |
| Built-in outbound email quota | `/auth/v1/signup`, `/auth/v1/recover`, etc. | Project-wide built-in quota; customization generally requires custom SMTP. | **PENDING** |
| Verification | `/auth/v1/verify` | IP-based; October 26, 2026 docs indicate **customizable** for verify/token limits, subject to available project settings. | **PENDING** |
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


### 5. Operator evidence: anonymous CAPTCHA and Rate Limits — 2026-11-06

**Evidence accepted: STAGING anonymous CAPTCHA negative E2E 2/2 PASS; Auth Rate Limits dashboard inventory REVIEWED.**

The operator provided two screenshots:

1. STAGING `phase3fa-student-captcha-negative.html` output:
   - `1. INVALID CAPTCHA TOKEN — PASS: captcha_failed (Auth server)`
   - `2. MISSING CAPTCHA TOKEN — PASS: captcha_failed (Auth server)`
   - `KẾT LUẬN — 2/2 PASS: STUDENT ANONYMOUS CAPTCHA NEGATIVE`
   - The output explicitly indicates no pairing, Learning Event or score requests were issued by the harness.
2. Supabase STAGING Authentication → Rate Limits dashboard screenshot, read-only, showing the current settings below.

| Auth setting | Observed STAGING value | Unit / scope |
|---|---:|---|
| Outbound emails | **2** | emails per hour, project |
| Outbound SMS | 30 | SMS per hour, project |
| Token refresh | 150 | requests per 5 minutes per IP (UI also indicates 1800/hour) |
| Token verification | 30 | requests per 5 minutes per IP (UI also indicates 360/hour) |
| Anonymous sign-ins | **30** | requests per hour per IP |
| Other signup/sign-in | 30 | requests per 5 minutes per IP (excludes anonymous) |
| Web3 signup/sign-in | 30 | requests per 5 minutes per IP |
| Minimum email resend interval | 60 | seconds; UI labels this as applicable when custom SMTP is configured |
| IP Address Forwarding | OFF | no forwarded IP override |

**Independent post-test read-only database check:** 5 Auth users (4 anonymous), 1 household, 1 learner, 1 active paired Student device, 13 Learning Events, 0 attempts. Counts unchanged from before the two negative requests. No account deletion or change was performed.

**Scope/limitations:** Both anonymous negative requests returned `captcha_failed` from the Auth server. This establishes enforcement on the tested anonymous signup path, not a successful new anonymous login, a complete RLS-negative cross-tenant test, or evidence of IP rate limiting at a threshold. The Rate Limits screenshot establishes the UI settings only; it is **not** a load test or proof of 429 behavior. There was **no rate-limit stress testing**.

**Operational evaluation:**
- The built-in project email quota of **2/hour** is restrictive for multiple Admin Magic Link tests; preserve this and sequence requests rather than increasing unrelated limits blindly. Moving to custom SMTP / Send Email hook is a separate approved decision.
- **30 anonymous sign-ins/hour/IP** plus CAPTCHA provides useful layered protection but not a complete anti-abuse or device admission policy. Continue to enforce device pairing and tenant-scoped RLS.
- **IP Address Forwarding OFF** is not an immediate blocker for this direct GitHub Pages client with a public Supabase publishable key; forwarded client-IP handling is a separate trusted-server/secret-key feature. Do not enable it for the browser client.
- Supabase documentation updated **2026-10-26** indicates that several rate limits, including anonymous sign-ins and token verification/refresh, are customizable in relevant project settings. Earlier guidance declaring them categorically immutable was outdated. The review did **not** change any setting; avoid promoting any test value as a recommended new setting without a tested workload and security owner sign-off.

**Remaining gates:** one controlled positive fresh anonymous signup using valid Turnstile and an approved temporary Auth-user lifecycle, an unpaired RLS denial check, Auth abuse monitoring and independent release review. `ANONYMOUS_AUTH_ABUSE` remains **OPEN**, and **PRODUCTION NO-GO**. Password leak-protection remains unavailable under the current plan without a formally approved alternative.

Updated docs: https://supabase.com/docs/guides/auth/rate-limits

### 6. Next bounded acceptance — not yet executed

After an operator approves a lifecycle for **one temporary unpaired anonymous test identity**, use an isolated browser profile (not the active Student device) to confirm:
1. Valid Turnstile challenge permits at most one new anonymous Auth sign-in and `is_anonymous=true`.
2. The new unpaired identity cannot query learner records, published learner content, learning events or other learners' household information.
3. No pairing code is generated, no learning/score event is written; original Student pairing and existing counts except the approved temporary Auth user remain intact.
4. Record exact candidate account ownership, expiration, audit dependencies and authorized eventual cleanup; **no automatic deletes**.
5. Review production-readiness evidence and Auth abuse monitoring before considering clearance.

**Do not perform these steps automatically as a side effect of negative-test acceptance.**
