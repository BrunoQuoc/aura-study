import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=readFileSync(new URL("../auth/phase3fa-anonymous-captcha-policy.js",import.meta.url),"utf8");
const {
 buildAnonymousNegative,classifyAnonymousCaptcha,BAD_ANON_TOKEN,
 EXACT_STAGING_ORIGIN,EXACT_STAGING_PATH
}=await import("data:text/javascript;charset=utf-8,"+encodeURIComponent(source));

test("invalid challenge supplied only for first case",()=>{
 assert.deepEqual(buildAnonymousNegative("invalid"),
   {options:{captchaToken:BAD_ANON_TOKEN}});
 assert.equal(buildAnonymousNegative("missing"),undefined);
 assert.throws(()=>buildAnonymousNegative("valid"),/INVALID_TEST_KIND/);
});

test("only direct CAPTCHA rejection proves negative enforcement",()=>{
 assert.deepEqual(classifyAnonymousCaptcha({code:"captcha_failed",status:422},null),
   {state:"PASS",reason:"captcha_failed",possibleNewAnonymousUser:false});
 assert.equal(classifyAnonymousCaptcha({code:"captcha_failed",status:429},null).state,
   "INCONCLUSIVE");
 assert.equal(classifyAnonymousCaptcha({code:"other",status:400},null).state,
   "INCONCLUSIVE");
 assert.equal(classifyAnonymousCaptcha({code:"over_request_rate_limit",status:429},null).state,
   "INCONCLUSIVE");
});

test("unexpected API acceptance FAILS even if SDK returns no user",()=>{
 const noUser=classifyAnonymousCaptcha(null,null);
 const withUser=classifyAnonymousCaptcha(null,{user:{id:"synthetic"}});
 assert.equal(noUser.state,"FAIL");
 assert.equal(noUser.possibleNewAnonymousUser,false);
 assert.equal(withUser.state,"FAIL");
 assert.equal(withUser.possibleNewAnonymousUser,true);
});

test("browser page requires consent, exact staging origin and one-shot stop",()=>{
 const html=readFileSync(new URL("../auth/phase3fa-student-captcha-negative.html",import.meta.url),"utf8");
 assert.equal(EXACT_STAGING_ORIGIN,"https://brunoquoc.github.io");
 assert.equal(EXACT_STAGING_PATH,
   "/aura-study/auth/phase3fa-student-captcha-negative.html");
 assert.match(html,/location\.pathname===EXACT_STAGING_PATH/);
 assert.match(html,/let attempted=false/);
 assert.match(html,/attempted=true/);
 assert.match(html,/consent\.checked/);
 assert.match(html,/for\(const kind of \["invalid","missing"\]\)/);
 assert.match(html,/if\(verdict\.state==="FAIL"\)/);
 assert.match(html,/persistSession:false/);
 assert.match(html,/autoRefreshToken:false/);
 assert.match(html,/detectSessionInUrl:false/);
 assert.doesNotMatch(html,/localStorage\.|sessionStorage\.|signInWithOtp\s*\(|signUp\s*\(/);
 assert.doesNotMatch(html,/auth\.admin\.deleteUser|signInWithPassword/);
 assert.doesNotMatch(html,/console\.log/);
});

test("rate limit review does not exercise a request flood",()=>{
 const html=readFileSync(new URL("../auth/phase3fa-student-captcha-negative.html",import.meta.url),"utf8");
 assert.match(html,/auth\/rate-limits/);
 assert.doesNotMatch(html,/setInterval|Promise\.all\(|for\s*\(let i=0;i<100/);
});
