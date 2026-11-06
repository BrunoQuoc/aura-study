/**
 * Phase 3F-A - Positive anonymous signup and unpaired RLS isolation.
 * STAGING ONLY. This helper is pure; no network requests, credentials or UI.
 * options.data is a NON-PRIVILEGED audit marker, NOT an authorization claim.
 * The server RLS predicates, not user_metadata, decide learner access.
 */
export const PHASE3FA_POSITIVE_MARKER = "3fa_positive_unpaired";
export const STAGING_HOST = "https://brunoquoc.github.io";
export const STAGING_PATH = "/aura-study/auth/phase3fa-positive-unpaired.html";
export const STAGING_SUPABASE_URL = "https://ufqzuowjhdqpydqvcsob.supabase.co";
export const ATTEMPT_GUARD = "aura_phase3fa_positive_unpaired_attempt_v1";

export const RLS_READ_MATRIX = Object.freeze([
  {label:"Household",table:"aura_households",column:"id",nonEmptyBaseline:true},
  {label:"Learner",table:"aura_learners",column:"id",nonEmptyBaseline:true},
  {label:"Paired devices",table:"aura_student_devices",column:"id",nonEmptyBaseline:true},
  {label:"Knowledge Library",table:"aura_content_items",column:"id",nonEmptyBaseline:true},
  {label:"Learning Events",table:"aura_learning_events",column:"event_id",nonEmptyBaseline:true},
  {label:"Exam Attempts",table:"aura_attempts",column:"id",nonEmptyBaseline:false},
  {label:"Learning Progress",table:"aura_learning_progress_v1",column:"learner_id",nonEmptyBaseline:true},
  {label:"Daily Activity",table:"aura_learning_daily_v1",column:"learner_id",nonEmptyBaseline:true},
  {label:"Verified Outcomes",table:"aura_verified_outcomes_v1",column:"attempt_id",nonEmptyBaseline:false}
]);

export function isExpectedHost(origin,pathname) {
  return origin===STAGING_HOST && pathname===STAGING_PATH;
}

export function buildPositiveAnonymousOptions(token) {
  if(typeof token!=="string" || token.length<10)
    throw new Error("VALID_TURNSTILE_TOKEN_REQUIRED");
  return {options:{
    captchaToken:token,
    data:{
      aura_test_phase:PHASE3FA_POSITIVE_MARKER,
      aura_test_scope:"STAGING_ONLY",
      aura_test_purpose:"unpaired_rls_isolation",
      retention_review:"manual_30_days"
    }
  }};
}

export function validNewAnonymousAuth(data,authServerUser) {
  if(!data?.user || !data?.session?.access_token || !authServerUser)
    return false;
  return data.user.is_anonymous===true &&
    data.session.user?.id===data.user.id &&
    authServerUser.id===data.user.id &&
    authServerUser.is_anonymous===true;
}

export function classifyRead(count,error,nonEmptyBaseline) {
  if(error){
    if(error.code==="42501")return {state:"PASS",reason:"permission_denied"};
    return {state:"INCONCLUSIVE",reason:"read_error"};
  }
  if(count===0)return {state:"PASS",reason:nonEmptyBaseline?"rls_zero":"zero_no_seed_data"};
  if(Number.isInteger(count) && count>0)return {state:"FAIL",reason:"unpaired_data_visible"};
  return {state:"INCONCLUSIVE",reason:"count_unavailable"};
}
