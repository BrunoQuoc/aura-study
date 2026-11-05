/**
 * AURA STUDY Phase 3F-A CAPTCHA adapter for the public STAGING login page.
 *
 * Uses separate Turnstile challenges for Admin Magic Link and new anonymous
 * Student signup. CAPTCHA is an anti-bot control, never a replacement for JWT,
 * RLS, pairing, Edge-side authorization or Supabase Auth rate limits.
 * No token is persisted to cookies, storage, network logs, or URL parameters.
 */
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const TOKEN_MIN_LENGTH = 10;

export function assertAuthSecurityConfig(config) {
  if (!config || config.environment!=="STAGING" ||
      !["disabled","turnstile"].includes(config.captchaMode)) {
    throw Error("AURA_AUTH_CONFIG_INVALID");
  }
  if(config.allowCreateAdminAuthUser!==false)
    throw Error("AURA_ADMIN_SIGNUP_MUST_BE_DISABLED");
  if(config.captchaMode==="turnstile" &&
    (typeof config.turnstileSiteKey!=="string" ||
     !/^[A-Za-z0-9_-]{12,120}$/.test(config.turnstileSiteKey))) {
    throw Error("TURNSTILE_SITE_KEY_MISSING_OR_INVALID");
  }
  return true;
}

export function createCaptchaAdapter(config, options={}) {
  assertAuthSecurityConfig(config);
  const ids=options.containers||{admin:"admin-captcha",student:"student-captcha"};
  const enabled=config.captchaMode==="turnstile";
  const api=options.api||(()=>globalThis.turnstile);
  const doc=options.document||globalThis.document;
  const widgetIds={};
  let started=null,ready=false;

  async function loadScript() {
    if(api()?.render)return;
    if (!doc?.createElement) throw Error("TURNSTILE_DOM_UNAVAILABLE");
    await new Promise((resolve,reject)=>{
      const script=doc.createElement("script");
      script.src=SCRIPT_URL;
      script.async=true;
      script.defer=true;
      script.onload=resolve;
      script.onerror=()=>reject(Error("TURNSTILE_SCRIPT_UNAVAILABLE"));
      doc.head.appendChild(script);
    });
    if(!api()?.render)throw Error("TURNSTILE_SDK_UNAVAILABLE");
  }

  async function init() {
    if(!enabled)return {enabled:false};
    if(started)return started;
    started=(async()=>{
      for(const name of ["admin","student"]){
        const container=doc.getElementById(ids[name]);
        if(!container)throw Error("TURNSTILE_CONTAINER_MISSING_"+name);
        container.hidden=false;
      }
      await loadScript();
      for(const name of ["admin","student"]){
        widgetIds[name]=api().render("#"+ids[name],{
          sitekey:config.turnstileSiteKey,
          theme:"auto",
          "response-field":false,
          "expired-callback":()=>{},
          "error-callback":()=>{}
        });
      }
      ready=true;
      return {enabled:true};
    })();
    return started;
  }

  function tokenFor(name) {
    if(!enabled)return null;
    if(!ready || !Object.hasOwn(widgetIds,name))
      throw Error("CAPTCHA_NOT_READY");
    const value=api()?.getResponse?.(widgetIds[name]);
    if(typeof value!=="string" || value.length<TOKEN_MIN_LENGTH)
      throw Error("CAPTCHA_CHALLENGE_REQUIRED");
    return value;
  }

  function reset(name) {
    if(!enabled || !ready || !Object.hasOwn(widgetIds,name))return;
    api()?.reset?.(widgetIds[name]);
  }

  return Object.freeze({enabled,init,tokenFor,reset});
}

export function anonymousAuthArgs(captchaToken) {
  return captchaToken ? {options:{captchaToken}} : undefined;
}

export function adminOtpOptions(config,redirectTo,captchaToken) {
  assertAuthSecurityConfig(config);
  if(typeof redirectTo!=="string"||!redirectTo.startsWith("https://"))
    throw Error("INVALID_AUTH_REDIRECT");
  return {
    emailRedirectTo:redirectTo,
    shouldCreateUser:false,
    ...(captchaToken?{captchaToken}:{})
  };
}
