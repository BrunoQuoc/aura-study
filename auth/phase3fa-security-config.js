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
 * Frontend Turnstile enabled for STAGING; Supabase server CAPTCHA remains separate.
 * Do not enable Supabase CAPTCHA until both widgets are verified on GitHub Pages.
 */
export const AURA_AUTH_SECURITY = Object.freeze({
  environment: "STAGING",
  captchaMode: "turnstile", // "disabled" | "turnstile"
  turnstileSiteKey: "0x4AAAAAAF0s6GoYAG1_04uG",
  allowCreateAdminAuthUser: false,
  magicLinkCooldownMs: 60_000
});
