/**
 * AURA STUDY — Phase 3F-A STAGING-only anonymous CAPTCHA negative policy.
 * NOT an anonymous signup test with a real CAPTCHA.
 * In an unsafe/misconfigured server, any accepted negative request may create
 * ONE anonymous user. The UI must stop immediately, preserve evidence and
 * require review — never claim "no account can be created" unconditionally.
 */
export const BAD_ANON_TOKEN = "aura-staging-deliberately-invalid-anonymous-captcha-token";
export const EXACT_STAGING_ORIGIN = "https://brunoquoc.github.io";
export const EXACT_STAGING_PATH =
  "/aura-study/auth/phase3fa-student-captcha-negative.html";
export const EXPECTED_SUPABASE_URL =
  "https://ufqzuowjhdqpydqvcsob.supabase.co";

export function buildAnonymousNegative(kind) {
  if(kind==="invalid")return {options:{captchaToken:BAD_ANON_TOKEN}};
  if(kind==="missing")return undefined;
  throw new Error("INVALID_TEST_KIND");
}

export function classifyAnonymousCaptcha(error,data) {
  if(!error) {
    return {state:"FAIL",reason:"server_accepted_request",
      possibleNewAnonymousUser:!!(data?.user||data?.session)};
  }
  const code=typeof error.code==="string"?error.code:"";
  const status=Number.isInteger(error.status)?error.status:null;
  // A rate-limit error is not proof of CAPTCHA enforcement even if error
  // details are inconsistent or contain a CAPTCHA-related code.
  if(status===429 || code.includes("rate_limit") || code.startsWith("over_")) {
    return {state:"INCONCLUSIVE",reason:"rate_limited",possibleNewAnonymousUser:false};
  }
  if(code==="captcha_failed")
    return {state:"PASS",reason:"captcha_failed",possibleNewAnonymousUser:false};
  return {state:"INCONCLUSIVE",reason:"other_auth_error",possibleNewAnonymousUser:false};
}
