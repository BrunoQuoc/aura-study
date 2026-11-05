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
 * This stays "disabled" until coordinated rollout is ready.
 */
export const AURA_AUTH_SECURITY = Object.freeze({
  environment: "STAGING",
  captchaMode: "disabled", // "disabled" | "turnstile"
  turnstileSiteKey: "",
  allowCreateAdminAuthUser: false,
  magicLinkCooldownMs: 60_000
});
