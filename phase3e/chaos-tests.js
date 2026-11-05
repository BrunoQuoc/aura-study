/**
 * AURA STUDY Phase 3E — non-destructive browser chaos tests.
 *
 * Creates RANDOM, MOCK-only Student/Device UUIDs and IndexedDB rows.
 * Sends NO requests to Supabase. Deletes only those mock-owned IndexedDB rows.
 * Tests the exact existing LearningOfflineQueue and appendLearningEvent code.
 */
import { LearningOfflineQueue } from "../aura_offline_queue_v1.js";
import { createLearningEvent } from "../aura_learning_pipeline_v1.js";

const STORE="events";
const DB_NAME="aura-study-offline-events-v1";
const TEST_SOURCE="staging_phase3e_mock_only";

function invariant(value, message) {
  if (!value) throw new Error(message);
}
function scopeForTest() {
  return {
    authUid:crypto.randomUUID(),
    deviceId:crypto.randomUUID(),
    learnerId:crypto.randomUUID()
  };
}
function makeEvent(scope) {
  return createLearningEvent({
    learnerId:scope.learnerId,
    deviceId:scope.deviceId,
    eventType:"lesson_viewed",
    contentItemId:null,
    payload:{test:true,source:TEST_SOURCE}
  });
}

function fakeClient(scope, mode) {
  const state={writes:0,server:new Map(),revoked:false,changed:false};
  const client={
    auth:{
      async getUser() {
        return {data:{user:{
          id:state.changed?crypto.randomUUID():scope.authUid,
          is_anonymous:true
        }},error:null};
      }
    },
    from(table) {
      if(table==="aura_student_devices") {
        const query={
          select(){return this;},
          eq(){return this;},
          then(resolve,reject) {
            return Promise.resolve({error:null,data:state.revoked?[]:[{
              id:scope.deviceId,learner_id:scope.learnerId
            }]}).then(resolve,reject);
          }
        };
        return query;
      }
      if(table==="aura_learning_events") {
        return {
          async insert(event) {
            state.writes++;
            if(mode==="always_timeout") return {
              error:{code:"PGRST002",status:503,message:"simulated timeout"}
            };
            if(mode==="commit_then_timeout") {
              if(!state.server.has(event.event_id)){
                state.server.set(event.event_id,{...event,schema_version:1});
                return {error:{
                  code:"PGRST002",status:503,message:"simulated timeout after server commit"
                }};
              }
              return {error:{code:"23505",status:409,message:"duplicate key"}};
            }
            throw new Error("UNEXPECTED_MOCK_MODE");
          },
          select() {
            const query={
              eventId:null,
              eq(column,value) {
                invariant(column==="event_id","Incorrect mock lookup column");
                this.eventId=value;
                return this;
              },
              async maybeSingle() {
                return {data:state.server.get(this.eventId)||null,error:null};
              }
            };
            return query;
          }
        };
      }
      throw new Error("UNEXPECTED_MOCK_TABLE");
    }
  };
  return {client,state};
}

/**
 * IndexedDB cleanup is *strictly* scoped to a fresh, synthetic UUID owner.
 * It cannot target the paired Student or any different account queue.
 */
async function cleanupMockScope(scope) {
  const owner=scope.authUid+":"+scope.deviceId;
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,1);
    request.onupgradeneeded=()=>{
      // Only for environments where this diagnostic is run first.
      const db=request.result;
      if(!db.objectStoreNames.contains(STORE)){
        const store=db.createObjectStore(STORE,{keyPath:"key"});
        store.createIndex("owner","owner",{unique:false});
      }
    };
    request.onerror=()=>reject(request.error||Error("MOCK_CLEANUP_OPEN_FAILED"));
    request.onsuccess=()=>{
      const db=request.result;
      const tx=db.transaction(STORE,"readwrite");
      const store=tx.objectStore(STORE);
      const found=store.index("owner").getAllKeys(owner);
      let cleaned=0;
      found.onsuccess=()=>{
        for(const key of found.result||[]){
          if(typeof key!=="string" || !key.startsWith(owner+"|"))
            continue;
          store.delete(key);
          cleaned++;
        }
      };
      tx.oncomplete=()=>{db.close();resolve(cleaned);};
      tx.onabort=()=>{db.close();reject(tx.error||Error("MOCK_CLEANUP_FAILED"));};
    };
  });
}

async function withVirtualTime(fn) {
  const now=Date.now;
  let current=now();
  try {
    Date.now=()=>current;
    return await fn({advance:ms=>{current+=ms;}});
  } finally {
    Date.now=now;
  }
}

async function runScoped(name,fn) {
  const scope=scopeForTest();
  try {
    const result=await fn(scope);
    return {name,status:"PASS",detail:result};
  } catch(error) {
    return {name,status:"FAIL",detail:String(error?.message||"Unknown error")};
  } finally {
    // Mock UUID scopes have no relationship to actual Auth identities.
    await cleanupMockScope(scope);
  }
}

async function lostAckAfterCommit(scope) {
  const {client,state}=fakeClient(scope,"commit_then_timeout");
  const queue=new LearningOfflineQueue(client,scope);
  const event=makeEvent(scope);
  const enqueued=await queue.enqueue(event);
  invariant(enqueued.status==="queued","Failed to enqueue");
  const repeated=await queue.enqueue(event);
  invariant(repeated.status==="already_queued","Local dedup failed");
  return withVirtualTime(async clock=>{
    const initial=await queue.flush();
    invariant(initial.retry===1 && state.writes===1 && state.server.size===1,
      "First network timeout did not preserve a pending event");
    invariant((await queue.summary()).pending===1,"Event disappeared after lost acknowledgment");
    clock.advance(20*60_000);
    const recovered=await queue.flush();
    invariant(recovered.replayed===1 && recovered.created===0,
      "Duplicate replay not reconciled");
    invariant((await queue.summary()).total===0,
      "Queue not cleared after server acknowledgment");
    invariant(state.server.size===1 && state.writes===2,
      "Exactly-once server acceptance failed");
    return "Lost HTTP acknowledgment → retry → already_recorded; 1 server event, queue empty";
  });
}

async function retryExhaustion(scope) {
  const {client,state}=fakeClient(scope,"always_timeout");
  const queue=new LearningOfflineQueue(client,scope);
  await queue.enqueue(makeEvent(scope));
  return withVirtualTime(async clock=>{
    for(let i=1;i<=8;i++){
      const outcome=await queue.flush();
      const list=await queue.list();
      invariant(list.length===1&&list[0].attempts===i,
        "Attempt count not persisted at "+i);
      invariant(list[0].status===(i===8?"review":"retry"),
        "Retry exhaustion state incorrect at "+i);
      invariant(outcome.created===0&&outcome.replayed===0,
        "A failed mock upload was incorrectly acknowledged");
      clock.advance(20*60_000);
    }
    const ninth=await queue.flush();
    invariant(state.writes===8 && ninth.created===0,
      "Review state was retransmitted after exhaustion");
    return "8 failed attempts → review, no ninth upload; original envelope retained for review";
  });
}

async function changedAccount(scope) {
  const {client,state}=fakeClient(scope,"always_timeout");
  const queue=new LearningOfflineQueue(client,scope);
  await queue.enqueue(makeEvent(scope));
  state.changed=true;
  const result=await queue.flush();
  const list=await queue.list();
  invariant(result.status==="account_changed"&&list.length===1 &&
    list[0].status==="blocked"&&state.writes===0,
    "Account switch did not fail closed");
  return "Account switch → blocked; 0 API writes";
}

async function revokedDevice(scope) {
  const {client,state}=fakeClient(scope,"always_timeout");
  const queue=new LearningOfflineQueue(client,scope);
  await queue.enqueue(makeEvent(scope));
  state.revoked=true;
  const result=await queue.flush();
  const list=await queue.list();
  invariant(result.status==="device_revoked_or_unpaired"&&list.length===1 &&
    list[0].status==="blocked"&&state.writes===0,
    "Revocation did not fail closed");
  return "Revoked device → blocked; 0 API writes";
}

export async function runPhase3EChaosSuite(onTest=()=>{}) {
  if(navigator.onLine===false) throw new Error("Run this mock suite while browser reports online");
  const cases=[
    ["Lost acknowledgment after commit",lostAckAfterCommit],
    ["Retry exhaustion (8 failures)",retryExhaustion],
    ["Account changed while queue pending",changedAccount],
    ["Device revoked while queue pending",revokedDevice]
  ];
  const results=[];
  for(const [name,test] of cases) {
    const result=await runScoped(name,test);
    results.push(result);
    onTest(result);
  }
  return {
    pass:results.filter(x=>x.status==="PASS").length,
    total:results.length,results,
    remoteSupabaseWrites:0,
    localCleanup:"Only random, mock-owned records were removed after each case."
  };
}
