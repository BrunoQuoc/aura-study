import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const policySource=readFileSync(new URL("../auth/phase3fb1-rate-limit-policy.js",import.meta.url),"utf8");
const {
  interpretAuthFailure,simulateRateLimitedClient,MOCK_CASES
}=await import("data:text/javascript;charset=utf-8,"+encodeURIComponent(policySource));
const page=readFileSync(new URL("../auth/phase3fb1-safe-429-simulation.html",import.meta.url),"utf8");

test("429 and rate-limit code classify safely with zero auto retry",()=>{
  for(const err of [
    {status:429,code:"over_request_rate_limit",retryAfter:"60"},
    {status:429,code:"captcha_failed",retryAfter:"30"},
    {status:400,code:"over_email_send_rate_limit"}
  ]){
    const r=interpretAuthFailure(err);
    assert.equal(r.kind,"RATE_LIMITED");
    assert.equal(r.autoRetry,false);
    assert.equal(r.createAccount,false);
  }
});

test("Retry-After is safely bounded and never triggers a timer",()=>{
  assert.equal(interpretAuthFailure({status:429,retryAfter:"60"}).retryAfterSeconds,60);
  for(const value of ["", "-1", "9999999", "not-a-number", "Wed, 06 Nov 2026 00:00:00 GMT"]){
    assert.equal(interpretAuthFailure({status:429,retryAfter:value}).retryAfterSeconds,null);
  }
});

test("captcha_failed is distinct from RATE_LIMITED unless HTTP 429",()=>{
  assert.equal(interpretAuthFailure({status:400,code:"captcha_failed"}).kind,"CAPTCHA_REJECTED");
  assert.equal(interpretAuthFailure({status:500,code:"server_error"}).kind,"OTHER_FAILURE");
});

test("all three mock flows handle one 429 without Auth requests or new users",()=>{
  assert.deepEqual(MOCK_CASES.map(x=>x.id),["admin_otp","anonymous_signup","refresh"]);
  for(const item of MOCK_CASES){
    const r=simulateRateLimitedClient(item.id);
    assert.equal(r.passed,true);
    assert.equal(r.authResponseStubCalls,1);
    assert.equal(r.actualAuthRequests,0);
    assert.equal(r.automaticRetries,0);
    assert.equal(r.newAuthUsers,0);
    assert.equal(r.pairedStudentSessionPreserved,true);
    assert.equal(r.errorKind,"RATE_LIMITED");
    assert.equal(r.retryAfterSeconds,60);
  }
});

test("unknown test cases fail closed",()=>{
  assert.throws(()=>simulateRateLimitedClient("drop_all_users"),/UNKNOWN_TEST_CASE/);
});

test("browser simulation cannot call Auth, cannot store credentials or replay",()=>{
  assert.match(page,/location\.origin==="https:\/\/brunoquoc\.github\.io"/);
  assert.match(page,/let attempted=false/);
  assert.match(page,/attempted=true;button\.disabled=true/);
  assert.match(page,/simulateRateLimitedClient/);
  assert.doesNotMatch(page,/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b/);
  assert.doesNotMatch(page,/\bsignInAnonymously\s*\(|\bsignInWithOtp\s*\(|\bcreateClient\s*\(/);
  assert.doesNotMatch(page,/\blocalStorage\.|\bsessionStorage\.|document\.cookie/);
  assert.doesNotMatch(page,/https?:\/\/[^"']*supabase\.co/);
});

test("browser script parses without static imports",()=>{
  const raw=page.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(raw);
  const withoutImports=raw.replace(/import\s+\{[\s\S]*?\}\s+from\s+["'][^"']+["'];?/g,"");
  assert.doesNotThrow(()=>new Function(withoutImports));
});
