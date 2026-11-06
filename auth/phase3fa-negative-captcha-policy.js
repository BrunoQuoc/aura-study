/**
 * Phase 3F-A — deliberately narrow verification policy.
 * An actual Auth API error with code "captcha_failed" is the ONLY PASS.
 * Rate limits, network errors, invalid addresses and other failures are NOT
 * evidence that a CAPTCHA challenge was rejected.
 *
 * Negative requests are for an EXISTING Admin address and MUST use
 * shouldCreateUser:false. No Student anonymous signup or JWT operations.
 */
export const INVALID_CAPTCHA_TOKEN="aura-staging-negative-test-invalid-token-not-issued-by-cloudflare";

export function classifyCaptchaNegative(error) {
  if (!error) return {state:"FAIL",reason:"request_accepted"};
  const code=typeof error.code==="string"?error.code:"";
  const status=Number.isInteger(error.status)?error.status:null;
  if(code==="captcha_failed")return {state:"PASS",reason:"captcha_failed"};
  if(status===429 || code.startsWith("over_") && code.includes("rate_limit"))
    return {state:"INCONCLUSIVE",reason:"rate_limited"};
  return {state:"INCONCLUSIVE",reason:"other_auth_error"};
}

export function buildNegativeOtpRequest(email,kind,redirectTo) {
  if(typeof email!=="string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    throw Error("INVALID_REGISTERED_ADMIN_EMAIL");
  if(!["invalid","missing"].includes(kind))throw Error("INVALID_TEST_KIND");
  if(redirectTo!=="https://brunoquoc.github.io/aura-study/aura-staging-login.html")
    throw Error("INVALID_REDIRECT");
  return {
    email:email.trim(),
    options:{
      shouldCreateUser:false,
      emailRedirectTo:redirectTo,
      ...(kind==="invalid"?{captchaToken:INVALID_CAPTCHA_TOKEN}:{})
    }
  };
}
