import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

async function loadBrowserModule(path){
  const source=readFileSync(new URL(path,import.meta.url),"utf8");
  return import("data:text/javascript;charset=utf-8,"+encodeURIComponent(source));
}

const configModule=await loadBrowserModule("../auth/phase3fa-security-config.js");
const challenge=await loadBrowserModule("../auth/phase3fa-turnstile.js");
const {
  assertAuthSecurityConfig,createCaptchaAdapter,
  adminOtpOptions,anonymousAuthArgs
}=challenge;
const config=configModule.AURA_AUTH_SECURITY;

test("STAGING leaves server CAPTCHA activation gated until coordinated rollout",()=>{
  assert.equal(config.environment,"STAGING");
  assert.equal(config.captchaMode,"disabled");
  assert.equal(config.turnstileSiteKey,"");
  assert.equal(config.allowCreateAdminAuthUser,false);
  assert.equal(assertAuthSecurityConfig(config),true);
});

test("Admin Magic Link refuses automatic signup",()=>{
  const options=adminOtpOptions(config,
    "https://brunoquoc.github.io/aura-study/aura-staging-login.html");
  assert.equal(options.shouldCreateUser,false);
  assert.equal(Object.hasOwn(options,"captchaToken"),false);
});

test("unsafe redirection rejected; official and localhost accepted",()=>{
  assert.throws(()=>adminOtpOptions(config,
    "https://evil.example/aura-staging-login.html"),/INVALID_AUTH_REDIRECT/);
  assert.throws(()=>adminOtpOptions(config,
    "https://brunoquoc.github.io/aura-study/aura-staging-login.html?next=https://evil.example"),
    /INVALID_AUTH_REDIRECT/);
  assert.equal(adminOtpOptions(config,
    "http://localhost:4173/aura-staging-login.html").shouldCreateUser,false);
});

test("Turnstile mode without site key fails closed",()=>{
  assert.throws(()=>createCaptchaAdapter({...config,captchaMode:"turnstile"}),
    /TURNSTILE_SITE_KEY_MISSING_OR_INVALID/);
});

test("Unknown mode or enabled Admin auto-signup fails closed",()=>{
  assert.throws(()=>assertAuthSecurityConfig({...config,captchaMode:"unknown"}),
    /AURA_AUTH_CONFIG_INVALID/);
  assert.throws(()=>assertAuthSecurityConfig({...config,allowCreateAdminAuthUser:true}),
    /AURA_ADMIN_SIGNUP_MUST_BE_DISABLED/);
});

test("when disabled, no SDK or token is required",async()=>{
  const adapter=createCaptchaAdapter(config);
  assert.deepEqual(await adapter.init(),{enabled:false});
  assert.equal(adapter.tokenFor("admin"),null);
  assert.equal(adapter.tokenFor("student"),null);
  assert.equal(anonymousAuthArgs(null),undefined);
});

test("Turnstile requires separate valid tokens and resets after each request",async()=>{
  const containers={"admin-captcha":{hidden:true},"student-captcha":{hidden:true}};
  const responses={admin:null,student:null};
  const ids={admin:"widget-admin",student:"widget-student"};
  const mock={
    render(selector,opts){
      assert.equal(opts.sitekey,"sample_Public_1234567890");
      return selector==="#admin-captcha"?ids.admin:ids.student;
    },
    getResponse(id){return id===ids.admin?responses.admin:responses.student;},
    reset(id){
      if(id===ids.admin)responses.admin=null;
      if(id===ids.student)responses.student=null;
    }
  };
  const adapter=createCaptchaAdapter({
    ...config,captchaMode:"turnstile",turnstileSiteKey:"sample_Public_1234567890"
  },{api:()=>mock,document:{getElementById:id=>containers[id]}});
  assert.deepEqual(await adapter.init(),{enabled:true});
  assert.equal(containers["admin-captcha"].hidden,false);
  assert.equal(containers["student-captcha"].hidden,false);
  assert.throws(()=>adapter.tokenFor("admin"),/CAPTCHA_CHALLENGE_REQUIRED/);
  responses.admin="token-admin-not-a-real-challenge";
  responses.student="token-student-not-a-real-challenge";
  assert.equal(adminOtpOptions(config,
    "https://brunoquoc.github.io/aura-study/aura-staging-login.html",
    adapter.tokenFor("admin")).captchaToken,responses.admin);
  assert.deepEqual(anonymousAuthArgs(adapter.tokenFor("student")),
    {options:{captchaToken:responses.student}});
  adapter.reset("admin");
  assert.throws(()=>adapter.tokenFor("admin"),/CAPTCHA_CHALLENGE_REQUIRED/);
  assert.equal(adapter.tokenFor("student"),responses.student);
  adapter.reset("student");
  assert.throws(()=>adapter.tokenFor("student"),/CAPTCHA_CHALLENGE_REQUIRED/);
});

test("live login page uses guarded OTP and anonymous token options",()=>{
  const html=readFileSync(new URL("../aura-staging-login.html",import.meta.url),"utf8");
  assert.match(html,/adminOtpOptions\(AURA_AUTH_SECURITY,redirectTo,captchaToken\)/);
  assert.match(html,/anonymousAuthArgs\(captchaToken\)/);
  assert.doesNotMatch(html,/shouldCreateUser:\s*true/);
});
