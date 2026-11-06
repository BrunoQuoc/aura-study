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


---

## 10. Email provider screenshot review — 2026-11-05

Operator-provided Supabase STAGING Email provider screenshot shows:
- Email provider **ON**; Secure email change **ON**.
- Secure password change **OFF**, Require current password when updating **OFF**.
- Prevent use of leaked passwords **OFF**; the UI labels the feature **Pro plan and above**.
- Minimum password length **6**; password requirements not selected.
- Email OTP expiration **3600 seconds (60 minutes)** and OTP length **8 digits**.

This is an **observation only**: no setting was toggled or saved. Keep Email provider ON for the existing Admin Magic Link. The leak-protection warning remains OPEN. Before changing password-change controls, verify whether password update or recovery is in use and whether the frontend supports reauthentication/current-password prompts. Consider length >=8 and stronger password requirements with staged regression tests. A shorter OTP lifetime requires validating all email link/OTP workflows, not just sign-in.

Plan eligibility is **not confirmed** by the screenshot. If leaked password protection is unavailable on the current plan, document approved alternatives and the release blocker rather than claiming remediation. CAPTCHA remains off until the public Turnstile widget and Supabase Auth are activated in coordinated order.


---

## 11. Plan-level refusal of leaked-password protection — 2026-11-05

The operator attempted to activate **Prevent use of leaked passwords** in the STAGING Email provider. The Dashboard displayed the server error:

> Failed to update auth configuration: Configuring leaked password protection via HaveIBeenPwned.org is available on Pro Plans and up.

A green toggle remained visible during the failed save. This is **not evidence of server activation**. A subsequent reload must be checked; the Supabase Security Advisor was independently queried and still reports `auth_leaked_password_protection` as a WARN, alongside six anonymous-sign-in policy warnings.

**Disposition:** `PASSWORD_BREACH_PROTECTION` remains **OPEN — PLAN-GATED**, not resolved and not waived. Phase 3F-A's frontend contract/RLS 4/4 pass remains valid but does not supersede this release blocker.

**Safe operator action:** switch the toggle back off, reload and verify no unsaved changes. Do not turn off Email provider; Admin Magic Link depends on it. Avoid repeated failed saves. Review password sign-in surface and whether plan upgrade or a documented Security-approved compensating control is justified. Strengthen minimum password requirements, signup/OTP rate limits, and server-side CAPTCHA only through tested, coordinated changes; those measures are **not equivalent to a breached-password corpus check** and must not be reported as having cleared this advisor.

**Next viable track:** complete STAGING Turnstile public widget + Admin and Student client challenge rollout before enabling Supabase server-side CAPTCHA. Continue to block production until independent security approval and release criteria are met.

---

## 12. Turnstile widget created and Secret Key rotation — 2026-11-05

The STAGING Turnstile widget **AURA-STUDY-STAGING** was created for `brunoquoc.github.io` in Managed mode, with pre-clearance disabled. The operator's screenshot exposed the PUBLIC Site Key and the PRIVATE Secret Key.

**Security requirement:** Treat the exposed Secret Key as compromised and rotate it in Cloudflare Turnstile → Widget Settings → Rotate Secret Key. Never copy or quote the secret in GitHub, chat, docs, screenshots or public logs. Under Cloudflare's default rotation, the prior secret can remain valid for two hours; confirm retirement of the old secret before trusting this control.

**Repository change:** Only the public Site Key was added to `auth/phase3fa-security-config.js`; `captchaMode` remains `disabled`. No Supabase server CAPTCHA setting has been modified. No real Student/Auth sessions or test data were changed.

**Next:** After operator confirms secret rotation, switch the STAGING frontend to `captchaMode: turnstile`, verify Admin and Student widgets, and only then enable Supabase Auth CAPTCHA using the newly rotated Secret Key inside the Supabase Dashboard. Keep the production `ANONYMOUS_AUTH_ABUSE` gate OPEN until validated token rejection, rate limits and RLS regression pass.

Cloudflare official rotation guide: https://developers.cloudflare.com/turnstile/troubleshooting/rotate-secret-key/

---

## 13. Frontend Turnstile activation after operator Secret Key rotation — 2026-11-06

The operator confirmed that the previously exposed Cloudflare Turnstile **Secret Key has been rotated**. Rotation is operator-reported; the server-side rotation status and old-key retirement were not independently verified. The new Secret Key has **not** been requested, stored or committed.

Frontend STAGING configuration `auth/phase3fa-security-config.js` was changed from `captchaMode: disabled` to `captchaMode: turnstile` using the already supplied **PUBLIC Site Key**. The login page includes independent Admin and Student widgets and consumes `options.captchaToken` during new Auth requests. The Auth UI informs the operator that server-side CAPTCHA has not been verified. Auth contract tests were updated for the active frontend mode.

**SERVER CAPTCHA IS STILL NOT ENABLED BY THIS CHANGE.** The Supabase Dashboard must remain OFF until the operator verifies both widgets on the deployed GitHub Pages page. No server-side Auth config, credentials, RLS, student pairing or production release settings were changed.

Required operator evidence: open `https://brunoquoc.github.io/aura-study/aura-staging-login.html` in the existing STAGING browser and confirm both CAPTCHA widgets render (Admin and Student); capture only the UI with any email/OTP/pairing codes obscured. Do not submit a fresh anonymous login or Admin OTP merely to test the widget before rollout planning.

Only after frontend acceptance: enable Cloudflare Turnstile under Supabase STAGING → Authentication → Attack Protection using the **new private Secret Key in Supabase only**, then test valid/invalid challenges with temporary test accounts and document rollback. `ANONYMOUS_AUTH_ABUSE` production gate remains OPEN until server proof and Auth throttling review.

---

## 14. Turnstile invalid sitekey — STAGING safe rollback

The operator's new GitHub Pages screenshot showed **Cloudflare Invalid sitekey** on both Admin and Student widgets. The prior Phase3F-A UI rendered its widgets using the configured public Site Key, but the actual Cloudflare challenge rejected it. Causes to check include a transcription error when copying the public Site Key from a screenshot, a disabled/removed key, or a widget hostname mismatch. Cloudflare distinguishes Invalid sitekey (110100 / 400020), Sitekey not found (110110), and Unauthorized domain (110200). Do not attribute an exact error code without browser evidence.

**Safe code response completed:** `auth/phase3fa-security-config.js` was rolled back to `captchaMode: disabled`, retaining the public Site Key value for diagnostics. **No Supabase Auth server CAPTCHA setting was enabled or changed.** The existing Admin/Student Auth sessions, database RLS and original paired Student were not modified.

Added `auth/phase3fa-turnstile-diagnostic.html`, a standalone page which renders only a Cloudflare challenge, without accessing Supabase Auth or writing new users/events. It accepts a **PUBLIC Site Key** pasted directly from Cloudflare Dashboard and displays Cloudflare client error codes or challenge success. It does not print or persist challenge tokens. Never paste the Turnstile Secret Key.

**Next required evidence:** operator copies the actual PUBLIC Site Key by clicking the copy control in Cloudflare Turnstile widget settings and pastes it into the diagnostic page; send screenshot of the diagnostic output **without displaying the key**. Once the correct public key is confirmed, replace the GitHub configuration from the authoritative copy, rerun tests, activate frontend widgets and repeat the Admin/Student browser rendering check. Only after both pass should the rotated Secret Key be entered in the **private** Supabase STAGING Attack Protection UI and server CAPTCHA be enabled.

Documentation: https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/

Release gates `ANONYMOUS_AUTH_ABUSE` and `PASSWORD_BREACH_PROTECTION` remain OPEN; production NO-GO.


---

## 15. Standalone Turnstile challenge PASS — 2026-11-06

The operator provided a browser screenshot of the **standalone Phase3F-A Site Key diagnostic** showing Cloudflare **Success!** and the local output:

> PASS — Cloudflare đã chấp nhận Site Key và trả lời challenge tại brunoquoc.github.io.

This verifies that a **public Site Key manually pasted from Cloudflare** could render and complete a Turnstile challenge on the GitHub Pages hostname. The diagnostic page deliberately did not display or retain the key, so **the exact successfully tested Site Key is not available to this repository review**; it must not be inferred from the screenshot or assumed identical to the previously stored suspect value.

Current repository status independently rechecked: `auth/phase3fa-security-config.js` still has `captchaMode: "disabled"`. Two production release gates (`ANONYMOUS_AUTH_ABUSE` and `PASSWORD_BREACH_PROTECTION`) remain **OPEN**. No server CAPTCHA enablement or Auth write has been performed.

**Next controlled action:** obtain the exact **PUBLIC Site Key** copied from the widget's Cloudflare Dashboard (do not request the Secret Key), compare and update the frontend configuration, then enable and test both Admin and Student widgets with that verified value. If the original public Site Key is actually identical, investigate browser cache/site loading and Cloudflare widget configuration before altering the key. Only after both widgets work should the operator enable Supabase server-side CAPTCHA using the rotated private Secret Key in the Dashboard.
