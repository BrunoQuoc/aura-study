/**
 * AURA STUDY Phase 3D — same-origin cross-tab lock for event delivery.
 * Web Locks are fail-closed: when unavailable, DO NOT attempt uncoordinated
 * upload in multiple tabs. IndexedDB remains available for offline enqueue.
 */
export function webLocksSupported() {
  return typeof navigator !== "undefined" &&
    typeof navigator.locks?.request === "function";
}
export function ownerLockName(scope) {
  return "aura-study-phase3d-flush-v1:" + scope.authUid + ":" + scope.deviceId;
}
export async function withSyncLock(scope,work) {
  if (!webLocksSupported()) return {status:"web_locks_unavailable"};
  return navigator.locks.request(ownerLockName(scope), {
    mode:"exclusive", ifAvailable:true
  }, async lock=>{
    if(!lock)return {status:"locked_by_another_tab"};
    return await work();
  });
}
export async function testLockHeld(scope,holdMs=8_000) {
  return withSyncLock(scope, async()=>{
    await new Promise(resolve=>setTimeout(resolve,holdMs));
    return {status:"released_after_test"};
  });
}
