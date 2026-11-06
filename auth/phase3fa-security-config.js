/**
 * AURA STUDY Phase 3F-A - STAGING public Auth UI configuration.
 *
 * A site key is PUBLIC; a Turnstile SECRET key must NEVER be committed here.
 * Server-side Supabase Auth CAPTCHA is not enabled by this configuration.
 *
 * Required activation order:
 * (1) register Turnstile domains and obtain site key
 * (2) set mode to "turnstile" + public site key, publish & test UI
 * (3) enable matching Supabase Auth server-side CAPTCHA using private secret
 * (4) test parent Magic Link and a fresh test Student anonymous session.
 *
 * STAGING frontend: direct Cloudflare-copied public Site Key verified through
 * standalone diagnostic; now show both Admin and Student challenges.
 * Supabase server CAPTCHA is independently controlled in its Auth Dashboard;
 * STAGING server enforcement was confirmed by prior Admin and anonymous
 * negative CAPTCHA tests. Do not infer server settings from this file.
 */
export const AURA_AUTH_SECURITY = Object.freeze({
  environment: "STAGING",
  captchaMode: "turnstile", // "disabled" | "turnstile"
  turnstileSiteKey: "0x4AAAAAAF0s6GoYAG1_O4uG",
  allowCreateAdminAuthUser: false,
  magicLinkCooldownMs: 60_000
});
