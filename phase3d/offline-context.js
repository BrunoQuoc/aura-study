/**
 * AURA STUDY Phase 3D STAGING - metadata cache for offline event authoring.
 * NO JWT, refresh token, email, pairing code or password is persisted here.
 * Cached identity is NOT an authorization credential and MUST NEVER be sent
 * to the API without re-verifying the actual Supabase user and paired device.
 */
const DB_NAME = "aura-study-phase3d-context-v1";
const STORE = "verified_scopes";
const TTL_MS = 24 * 60 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function openDb() {
  return new Promise((resolve,reject) => {
    if (typeof indexedDB === "undefined") {reject(Error("INDEXEDDB_UNAVAILABLE"));return;}
    const request = indexedDB.open(DB_NAME,1);
    request.onupgradeneeded = () => {
      const db=request.result;
      if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:"key"});
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error||Error("CONTEXT_DB_UNAVAILABLE"));
    request.onblocked = () => reject(Error("CONTEXT_DB_BLOCKED"));
  });
}

async function access(mode,operation) {
  const db = await openDb();
  return new Promise((resolve,reject) => {
    const tx = db.transaction(STORE,mode);
    const store=tx.objectStore(STORE);
    let output;
    try{operation(store,v=>{output=v;});}
    catch(e){tx.abort();reject(e);return;}
    tx.oncomplete=()=>{db.close();resolve(output);};
    tx.onabort=()=>{db.close();reject(tx.error||Error("CONTEXT_TX_ABORTED"));};
  });
}

function valid(metadata){
  return metadata && [metadata.authUid,metadata.deviceId,metadata.learnerId,metadata.lessonId].every(v=>typeof v==="string"&&UUID.test(v))
    && Number.isFinite(metadata.verifiedAt);
}

export async function saveVerifiedScope(scope,lessonId) {
  const row = {
    key:"active",authUid:scope.authUid,deviceId:scope.deviceId,
    learnerId:scope.learnerId,lessonId,
    verifiedAt:Date.now()
  };
  if(!valid(row))throw Error("INVALID_VERIFIED_SCOPE");
  await access("readwrite",(store,done)=>{store.put(row);done(true);});
  return Object.freeze({...row});
}

export async function readOfflineScope() {
  const row=await access("readonly",(store,done)=>{
    const request=store.get("active");
    request.onsuccess=()=>done(request.result??null);
  });
  if(!valid(row))return {status:"missing",scope:null};
  if(Date.now()<row.verifiedAt-60_000||Date.now()-row.verifiedAt>TTL_MS)
    return {status:"expired",scope:null};
  const {authUid,deviceId,learnerId,lessonId,verifiedAt}=row;
  return {status:"cached",scope:Object.freeze({authUid,deviceId,learnerId,lessonId,verifiedAt})};
}

export const OFFLINE_SCOPE_TTL_HOURS=24;
