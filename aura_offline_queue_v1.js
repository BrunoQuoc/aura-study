/**
 * AURA STUDY — STAGING Phase 3C: durable offline Learning Event queue.
 * Same-origin IndexedDB; no JWT, service key, OTP, answer key or grades stored.
 * Browser storage can be evicted; this is not a guaranteed background service.
 * Phase 3A's appendLearningEvent remains the sole network write method.
 */
import { appendLearningEvent } from "./aura_learning_pipeline_v1.js";

const DB_NAME = "aura-study-offline-events-v1";
const STORE = "events";
const VERSION = 1;
const MAX_ITEMS_PER_OWNER = 100;
const MAX_BATCH = 10;
const MAX_ATTEMPTS = 8;
const MAX_AGE_MS = 6 * 24 * 60 * 60 * 1000; // under server 7-day limit
const BASE_DELAY_MS = 4_000;
const MAX_DELAY_MS = 15 * 60_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_TYPES = new Set(["lesson_viewed","practice_opened","review_opened","draft_saved","learner_note"]);
const NEVER_RETRY = new Set(["42501","23503","23514","22P02","22007","22023"]);
const SECURITY_TERMINAL = "EVENT_ID_COLLISION_OR_UNAUTHORIZED";

function assertUuid(value, name) {
  if (typeof value !== "string" || !UUID.test(value)) throw Error(name + " must be UUID");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));
  }
  return value;
}

function isSameEnvelope(a,b) {
  return JSON.stringify(stable(a)) === JSON.stringify(stable(b));
}

function openDatabase() {
  if (!("indexedDB" in globalThis)) return Promise.reject(Error("INDEXEDDB_UNAVAILABLE"));
  return new Promise((resolve,reject)=>{
    const request = indexedDB.open(DB_NAME,VERSION);
    request.onupgradeneeded = ()=>{
      const db=request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store=db.createObjectStore(STORE,{keyPath:"key"});
        store.createIndex("owner","owner",{unique:false});
      }
    };
    request.onsuccess = ()=>resolve(request.result);
    request.onerror = ()=>reject(request.error||Error("INDEXEDDB_OPEN_FAILED"));
    request.onblocked = ()=>reject(Error("INDEXEDDB_BLOCKED_BY_OTHER_TAB"));
  });
}

async function transaction(mode, operation) {
  const db=await openDatabase();
  return new Promise((resolve,reject)=>{
    let result;
    const tx=db.transaction(STORE,mode);
    const store=tx.objectStore(STORE);
    try {operation(store, value=>{result=value;});}
    catch(e){try{tx.abort();}catch(_){}reject(e);return;}
    tx.oncomplete=()=>{db.close();resolve(result);};
    tx.onabort=()=>{db.close();reject(tx.error||Error("INDEXEDDB_TRANSACTION_ABORTED"));};
    tx.onerror=()=>{}; // onabort emits the final error
  });
}

async function find(key) {
  return transaction("readonly",(store,finish)=>{
    const req=store.get(key);
    req.onsuccess=()=>finish(req.result??null);
  });
}

async function records(owner) {
  return transaction("readonly",(store,finish)=>{
    const req=store.index("owner").getAll(owner);
    req.onsuccess=()=>finish(req.result||[]);
  });
}

async function add(row) {
  return transaction("readwrite",(store,finish)=>{
    store.add(row);
    finish(row);
  });
}

async function revise(key,update) {
  return transaction("readwrite",(store,finish)=>{
    const req=store.get(key);
    req.onsuccess=()=>{
      if (!req.result){finish(null);return;}
      const next=update(req.result);
      if(next){store.put(next);finish(next);}
      else finish(req.result);
    };
  });
}

async function remove(key) {
  return transaction("readwrite",(store,finish)=>{
    store.delete(key);
    finish(true);
  });
}

function failureType(err) {
  const code=String(err?.code||"");
  const status=Number(err?.status||0);
  const message=String(err?.message||"");
  if (message.includes(SECURITY_TERMINAL)) return "blocked";
  if (message.includes("AURA_EVENT_DAILY_LIMIT")) return "review";
  if (message.includes("AURA_EVENT_RATE_LIMIT")) return "retry";
  if (NEVER_RETRY.has(code)) return "review";
  if ([401,403].includes(status)) return "blocked";
  if ([408,425,429].includes(status) || status>=500) return "retry";
  if (code.startsWith("08") || code==="PGRST002") return "retry";
  if (/fetch|network|offline|timeout|abort/i.test(message)) return "retry";
  return "review";
}

function delayFor(attempt) {
  const exponent=Math.min(8,Math.max(0,attempt-1));
  const base=Math.min(MAX_DELAY_MS,BASE_DELAY_MS*(2**exponent));
  // bounded jitter to avoid synchronization spikes
  return Math.min(MAX_DELAY_MS,Math.floor(base*(0.8+Math.random()*0.4)));
}

async function verifyCurrentDevice(supabase,scope) {
  const {data:identity,error:authError}=await supabase.auth.getUser();
  if (authError || !identity?.user) throw (authError||Error("AUTH_UNAVAILABLE"));
  const user=identity.user;
  if (user.id!==scope.authUid || user.is_anonymous!==true) return "account_changed";

  const {data:devices,error}=await supabase.from("aura_student_devices")
    .select("id,learner_id").eq("id",scope.deviceId).eq("learner_id",scope.learnerId);
  if (error) throw error;
  if (devices?.length!==1) return "device_revoked_or_unpaired";
  return "ok";
}

export async function verifyAndCreateScope(supabase) {
  const {data:auth,error}=await supabase.auth.getUser();
  if(error || !auth?.user || auth.user.is_anonymous!==true) throw Error("STUDENT_LOGIN_REQUIRED");
  const {data:devices,error:deviceError}=await supabase.from("aura_student_devices")
    .select("id,learner_id,auth_uid").eq("auth_uid",auth.user.id);
  if(deviceError || devices?.length!==1) throw Error("PAIRED_DEVICE_REQUIRED");
  return Object.freeze({
    authUid:auth.user.id,
    deviceId:devices[0].id,
    learnerId:devices[0].learner_id
  });
}

export class LearningOfflineQueue {
  constructor(supabase,scope) {
    if (!supabase?.from || !supabase?.auth || !scope) throw Error("STUDENT_CLIENT_AND_SCOPE_REQUIRED");
    for(const [key,value] of Object.entries({
      authUid:scope.authUid, deviceId:scope.deviceId, learnerId:scope.learnerId
    })) assertUuid(value,key);
    this.supabase=supabase;
    this.scope=Object.freeze({...scope});
    this.owner=scope.authUid+":"+scope.deviceId;
    this.busy=false;
  }

  async enqueue(event) {
    if(!event||typeof event!=="object")throw Error("EVENT_REQUIRED");
    assertUuid(event.event_id,"event_id");
    if(event.learner_id!==this.scope.learnerId || event.device_id!==this.scope.deviceId)
      throw Error("QUEUE_SCOPE_MISMATCH");
    if(!VALID_TYPES.has(event.event_type)) throw Error("UNSUPPORTED_EVENT_TYPE");
    if(event.content_item_id!==null)assertUuid(event.content_item_id,"content_item_id");
    const ts=Date.parse(event.client_created_at);
    if(!Number.isFinite(ts) || Date.now()-ts>MAX_AGE_MS || ts>Date.now()+10*60_000)
      throw Error("EVENT_TIMESTAMP_INVALID_OR_TOO_OLD");

    // Keep only minimum diagnostic telemetry. Event payloads must not contain
    // answers, scores, secrets or personal information.
    const size=new TextEncoder().encode(JSON.stringify(event)).length;
    if(size>13*1024)throw Error("EVENT_TOO_LARGE");
    const key=this.owner+"|"+event.event_id;
    const existing=await find(key);
    if(existing){
      if(!isSameEnvelope(existing.event,event))throw Error("LOCAL_EVENT_ID_COLLISION");
      return {status:"already_queued",event_id:event.event_id};
    }
    if((await records(this.owner)).length>=MAX_ITEMS_PER_OWNER)
      throw Error("OFFLINE_QUEUE_FULL");
    const now=Date.now();
    const row={key,owner:this.owner,event:structuredClone(event),
      status:"pending",createdAt:now,updatedAt:now,
      attempts:0,nextAttemptAt:0,lastCode:null};
    try{await add(row);}
    catch(error){
      if(error?.name==="ConstraintError"){
        const raced=await find(key);
        if(raced&&isSameEnvelope(raced.event,event))
          return {status:"already_queued",event_id:event.event_id};
      }
      throw error;
    }
    return {status:"queued",event_id:event.event_id};
  }

  async list() {
    const rows=await records(this.owner);
    rows.sort((a,b)=>a.createdAt-b.createdAt);
    return rows.map(row=>({
      event_id:row.event.event_id,
      event_type:row.event.event_type,
      status:row.status,
      attempts:row.attempts,
      createdAt:row.createdAt,
      nextAttemptAt:row.nextAttemptAt,
      lastCode:row.lastCode
    }));
  }

  async summary() {
    const list=await this.list();
    return {
      total:list.length,
      pending:list.filter(x=>x.status==="pending"||x.status==="retry").length,
      blocked:list.filter(x=>x.status==="blocked").length,
      review:list.filter(x=>x.status==="review").length
    };
  }

  async flush({limit=MAX_BATCH,online=true}={}) {
    if(this.busy)return {status:"busy",created:0,replayed:0,queued:(await this.summary()).total};
    if(online===false || (typeof navigator!=="undefined" && navigator.onLine===false))
      return {status:"offline",created:0,replayed:0,queued:(await this.summary()).total};
    this.busy=true;
    const result={status:"ok",created:0,replayed:0,retry:0,blocked:0,review:0,queued:0};
    try {
      let state;
      try{state=await verifyCurrentDevice(this.supabase,this.scope);}
      catch(e){return {...result,status:"auth_or_network_unavailable",
        queued:(await this.summary()).total};}
      if(state!=="ok"){
        // Do not transmit queued events if the account changed or was revoked.
        // Keep local records for owner review, never move them to a new account.
        const rows=await records(this.owner);
        for(const row of rows){
          if(row.status!=="blocked"){
            await revise(row.key,x=>({...x,status:"blocked",lastCode:state,updatedAt:Date.now()}));
          }
        }
        return {...result,status:state,blocked:rows.length,queued:rows.length};
      }

      const rows=(await records(this.owner)).sort((a,b)=>a.createdAt-b.createdAt);
      const capped=Math.max(1,Math.min(MAX_BATCH,Math.floor(limit)));
      let sent=0;
      for(const row of rows){
        if(sent>=capped)break;
        if(row.status==="blocked"||row.status==="review")continue;
        const age=Date.now()-Date.parse(row.event.client_created_at);
        if(age>MAX_AGE_MS){
          await revise(row.key,x=>({...x,status:"review",lastCode:"EVENT_EXPIRED",updatedAt:Date.now()}));
          result.review++;continue;
        }
        if(row.status==="retry" && row.nextAttemptAt>Date.now())continue;
        sent++;
        try {
          const outcome=await appendLearningEvent(this.supabase,row.event);
          if(outcome.status!=="created"&&outcome.status!=="already_recorded")
            throw Error("UNRECOGNIZED_WRITE_RESULT");
          await remove(row.key);
          if(outcome.status==="created")result.created++;
          else result.replayed++;
        } catch(error) {
          const kind=failureType(error);
          const attempts=row.attempts+1;
          const status=kind==="retry"&&attempts>=MAX_ATTEMPTS?"review":kind;
          const message=String(error?.code||error?.message||"UNKNOWN").slice(0,80);
          await revise(row.key,x=>({...x,status,attempts,
            nextAttemptAt:status==="retry"?Date.now()+delayFor(attempts):0,
            updatedAt:Date.now(),lastCode:message}));
          result[status]++;
        }
      }
      result.queued=(await this.summary()).total;
      return result;
    } finally {
      this.busy=false;
    }
  }

  /**
   * Best-effort periodic sync only while this page is open.
   * The database primary key + exact-match replay make concurrent tabs safe.
   * Service Worker/OS background sync is NOT implemented.
   */
  startAutoSync(onResult=()=>{}) {
    const tick=async()=>{try{onResult(await this.flush());}catch(_){}};
    const online=()=>{void tick();};
    const visible=()=>{if(document.visibilityState==="visible")void tick();};
    window.addEventListener("online",online);
    document.addEventListener("visibilitychange",visible);
    const timer=setInterval(tick,15_000);
    void tick();
    return ()=>{
      clearInterval(timer);
      window.removeEventListener("online",online);
      document.removeEventListener("visibilitychange",visible);
    };
  }
}

export const OFFLINE_QUEUE_LIMITS=Object.freeze({
  maxPending:MAX_ITEMS_PER_OWNER,
  maxBatch:MAX_BATCH,
  maxAttempts:MAX_ATTEMPTS,
  maxAgeDays:6,
  periodicSyncSeconds:15
});
