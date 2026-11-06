import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=readFileSync(new URL("../auth/phase3fa-positive-unpaired-policy.js",import.meta.url),"utf8");
const {
 buildPositiveAnonymousOptions,validNewAnonymousAuth,classifyRead,
 isExpectedHost,RLS_READ_MATRIX,ATTEMPT_GUARD
}=await import("data:text/javascript;charset=utf-8,"+encodeURIComponent(source));

test("exact official STAGING host required",()=>{
 assert.equal(isExpectedHost("https://brunoquoc.github.io",
  "/aura-study/auth/phase3fa-positive-unpaired.html"),true);
 assert.equal(isExpectedHost("https://evil.example",
  "/aura-study/auth/phase3fa-positive-unpaired.html"),false);
 assert.equal(isExpectedHost("https://brunoquoc.github.io",
  "/aura-study/aura-staging-login.html"),false);
});

test("accept only a CAPTCHA challenge and mark one reviewable anonymous user",()=>{
 assert.throws(()=>buildPositiveAnonymousOptions(""),/VALID_TURNSTILE_TOKEN_REQUIRED/);
 assert.throws(()=>buildPositiveAnonymousOptions("short"),/VALID_TURNSTILE_TOKEN_REQUIRED/);
 const request=buildPositiveAnonymousOptions("test-token-never-sent");
 assert.equal(request.options.captchaToken,"test-token-never-sent");
 assert.equal(request.options.data.aura_test_phase,"3fa_positive_unpaired");
 assert.equal(request.options.data.aura_test_scope,"STAGING_ONLY");
 assert.equal(request.options.data.retention_review,"manual_30_days");
 assert.equal(ATTEMPT_GUARD,"aura_phase3fa_positive_unpaired_attempt_v1");
});

test("server-verified user must match signed-in anonymous session",()=>{
 const data={user:{id:"synthetic",is_anonymous:true},
 session:{access_token:"not-a-real-token",user:{id:"synthetic"}}};
 assert.equal(validNewAnonymousAuth(data,{id:"synthetic",is_anonymous:true}),true);
 assert.equal(validNewAnonymousAuth(data,{id:"other",is_anonymous:true}),false);
 assert.equal(validNewAnonymousAuth(data,{id:"synthetic",is_anonymous:false}),false);
 assert.equal(validNewAnonymousAuth({user:{id:"a"},session:null},{id:"a"}),false);
});

test("9 exact read sources including three invoker views",()=>{
 assert.equal(RLS_READ_MATRIX.length,9);
 assert.equal(new Set(RLS_READ_MATRIX.map(x=>x.table)).size,9);
 const views=RLS_READ_MATRIX.filter(x=>x.table.endsWith("_v1"));
 assert.equal(views.length,3);
 const baseline=RLS_READ_MATRIX.filter(x=>x.nonEmptyBaseline);
 assert.equal(baseline.length,7);
 assert.ok(RLS_READ_MATRIX.some(x=>x.table==="aura_content_items"));
 assert.ok(RLS_READ_MATRIX.some(x=>x.table==="aura_student_devices"));
});

test("0 rows pass; unauthorized access denied; any visible rows FAIL",()=>{
 assert.deepEqual(classifyRead(0,null,true),
  {state:"PASS",reason:"rls_zero"});
 assert.deepEqual(classifyRead(0,null,false),
  {state:"PASS",reason:"zero_no_seed_data"});
 assert.deepEqual(classifyRead(null,{code:"42501"},true),
  {state:"PASS",reason:"permission_denied"});
 assert.equal(classifyRead(1,null,true).state,"FAIL");
 assert.equal(classifyRead(5,null,false).state,"FAIL");
 assert.equal(classifyRead(null,null,true).state,"INCONCLUSIVE");
 assert.equal(classifyRead(null,{code:"PGRST301"},true).state,"INCONCLUSIVE");
});

test("browser harness is consent-gated, one-shot, count-only, no domain tables written",()=>{
 const html=readFileSync(new URL("../auth/phase3fa-positive-unpaired.html",import.meta.url),"utf8");
 assert.match(html,/id="consent-auth"/);
 assert.match(html,/id="consent-lifecycle"/);
 assert.match(html,/authConsent\.checked&&lifeConsent\.checked|!authConsent\.checked\|\|!lifeConsent\.checked/);
 assert.match(html,/localStorage\.setItem\(ATTEMPT_GUARD,"attempted"\)/);
 assert.match(html,/priorAttempt=true/);
 assert.match(html,/persistSession:false/);
 assert.match(html,/autoRefreshToken:false/);
 assert.match(html,/detectSessionInUrl:false/);
 assert.match(html,/buildPositiveAnonymousOptions\(validCaptchaToken\)/);
 assert.match(html,/auth\.getUser\(\)/);
 assert.match(html,/count:"exact",head:true/);
 assert.match(html,/for\(const item of RLS_READ_MATRIX\)/);
 assert.doesNotMatch(html,/\.insert\(|\.update\(|\.upsert\(|\.delete\(|auth\.admin\.deleteUser/);
 assert.doesNotMatch(html,/\.functions\.invoke\(/);
 assert.doesNotMatch(html,/localStorage\.setItem\([^,]+,\s*captchaToken/);
 assert.doesNotMatch(html,/console\.log\(/);
});

test("browser test JavaScript parses after module imports are removed",()=>{
 const html=readFileSync(new URL("../auth/phase3fa-positive-unpaired.html",import.meta.url),"utf8");
 const code=html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
 assert.ok(code);
 const withoutImports=code.replace(/import\s+\{[^}]+\}\s+from\s+["'][^"']+["'];?/g,"")
   .replace(/import\s+\{[^}]+\}\s+from\s+["'][^"']+["'];?/g,"");
 assert.doesNotThrow(()=>new Function(withoutImports));
});
