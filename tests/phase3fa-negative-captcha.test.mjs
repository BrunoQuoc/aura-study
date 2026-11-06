import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../auth/phase3fa-negative-captcha-policy.js",import.meta.url),"utf8");
const {classifyCaptchaNegative,buildNegativeOtpRequest,INVALID_CAPTCHA_TOKEN}=
 await import("data:text/javascript;charset=utf-8,"+encodeURIComponent(source));
const TARGET="https://brunoquoc.github.io/aura-study/aura-staging-login.html";
const email="existing-admin@example.org";

test("only documented CAPTCHA failure counts as PASS",()=>{
 assert.deepEqual(classifyCaptchaNegative({code:"captcha_failed",status:400}),
 {state:"PASS",reason:"captcha_failed"});
 assert.equal(classifyCaptchaNegative({code:"invalid_credentials",status:400}).state,"INCONCLUSIVE");
 assert.equal(classifyCaptchaNegative({code:"over_email_send_rate_limit",status:429}).state,"INCONCLUSIVE");
 assert.equal(classifyCaptchaNegative({code:"captcha_failed",status:429}).state,"PASS");
});

test("accepted Auth API request is FAIL, not PASS",()=>{
 assert.deepEqual(classifyCaptchaNegative(null),{state:"FAIL",reason:"request_accepted"});
 assert.deepEqual(classifyCaptchaNegative(undefined),{state:"FAIL",reason:"request_accepted"});
});

test("no-test request can sign up a new user",()=>{
 for(const kind of ["invalid","missing"]) {
  const payload=buildNegativeOtpRequest(email,kind,TARGET);
  assert.equal(payload.email,email);
  assert.equal(payload.options.shouldCreateUser,false);
  assert.equal(payload.options.emailRedirectTo,TARGET);
 }
});

test("missing CAPTCHA test omits token, does not send a blank token",()=>{
 const req=buildNegativeOtpRequest(email,"missing",TARGET);
 assert.equal(Object.hasOwn(req.options,"captchaToken"),false);
});

test("invalid CAPTCHA test supplies deliberately invalid token",()=>{
 const req=buildNegativeOtpRequest(email,"invalid",TARGET);
 assert.equal(req.options.captchaToken,INVALID_CAPTCHA_TOKEN);
 assert.ok(INVALID_CAPTCHA_TOKEN.length>10);
});

test("reject other test kinds and redirect destinations",()=>{
 assert.throws(()=>buildNegativeOtpRequest(email,"valid",TARGET),/INVALID_TEST_KIND/);
 assert.throws(()=>buildNegativeOtpRequest(email,"invalid","https://attacker.example"),/INVALID_REDIRECT/);
 assert.throws(()=>buildNegativeOtpRequest("invalid","invalid",TARGET),/INVALID_REGISTERED_ADMIN_EMAIL/);
});

test("browser diagnostic is explicit one-shot, private and does not touch anonymous Auth",()=>{
 const html=readFileSync(new URL("../auth/phase3fa-server-captcha-negative.html",import.meta.url),"utf8");
 assert.match(html,/let attempted=false/);
 assert.match(html,/attempted=true/);
 assert.match(html,/shouldCreateUser:false/);
 assert.match(html,/persistSession:false/);
 assert.match(html,/autoRefreshToken:false/);
 assert.match(html,/onExpectedOrigin/);
 assert.doesNotMatch(html,/signInAnonymously\s*\(/);
 assert.doesNotMatch(html,/sessionStorage\.|localStorage\./);
 assert.doesNotMatch(html,/console\.log\s*\(/);
});
