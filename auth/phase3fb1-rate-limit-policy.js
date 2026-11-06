/**
 * AURA STUDY Phase 3F-B1 — pure, offline Auth rate-limit policy.
 * Simulated statuses only: NO Supabase clients, fetch, credentials or storage.
 * Can be adopted by the real Auth UI in a separate audited change; this file
 * alone does NOT prove the production login UI handles HTTP 429.
 */

export const MOCK_CASES = Object.freeze([
  Object.freeze({id:"admin_otp",label:"Admin Magic Link / OTP"}),
  Object.freeze({id:"anonymous_signup",label:"Student anonymous signup"}),
  Object.freeze({id:"refresh",label:"Auth token refresh"})
]);

export function interpretAuthFailure({status,code,retryAfter}={}) {
  if(status===429 || typeof code==="string" && (code.startsWith("over_") || code.includes("rate_limit"))) {
    const seconds=Number(retryAfter);
    return Object.freeze({
      kind:"RATE_LIMITED",autoRetry:false,createAccount:false,
      retryAfterSeconds:Number.isInteger(seconds)&&seconds>=1&&seconds<=3600?seconds:null,
      guidance:"Quá giới hạn yêu cầu. Không tự gửi lại; thử thủ công sau khi hết thời gian chờ."
    });
  }
  if(code==="captcha_failed")return Object.freeze({
    kind:"CAPTCHA_REJECTED",autoRetry:false,createAccount:false,
    retryAfterSeconds:null,guidance:"CAPTCHA không hợp lệ. Không tính là rate limit PASS."
  });
  return Object.freeze({
    kind:"OTHER_FAILURE",autoRetry:false,createAccount:false,
    retryAfterSeconds:null,guidance:"Lỗi xác thực cần kiểm tra, không tự retry."
  });
}

/**
 * Entirely synthetic client call; never leaves this JavaScript function.
 * Invariants mimic a client which handles 429 without retrying or mutating
 * an already paired Student session.
 */
export function simulateRateLimitedClient(testCaseId){
  const entry=MOCK_CASES.find(x=>x.id===testCaseId);
  if(!entry)throw Error("UNKNOWN_TEST_CASE");
  const pairedSessionSentinel=Object.freeze({paired:true,device:"existing_test_device"});
  let stubInvocations=0,autoRetries=0,createdAccounts=0;
  const stubAuthResponse=()=>{
    stubInvocations++;
    return Object.freeze({status:429,code:"over_request_rate_limit",retryAfter:"60"});
  };
  const result=interpretAuthFailure(stubAuthResponse());
  // The intentionally absent retry loop and sign-up side effect are the
  // behavior under test. No Supabase SDK or real HTTP API is involved.
  const didPreserveSession=pairedSessionSentinel.paired===true;
  return Object.freeze({
    caseId:entry.id,
    label:entry.label,
    authResponseStubCalls:stubInvocations,
    actualAuthRequests:0,
    newAuthUsers:createdAccounts,
    automaticRetries:autoRetries,
    pairedStudentSessionPreserved:didPreserveSession,
    errorKind:result.kind,
    retryAfterSeconds:result.retryAfterSeconds,
    passed:stubInvocations===1&&autoRetries===0&&createdAccounts===0&&
      didPreserveSession&&result.kind==="RATE_LIMITED"&&result.autoRetry===false,
    guidance:result.guidance
  });
}
