import test from "node:test";
import assert from "node:assert/strict";
import { AuraOutbox, auraSupabaseEventTransport } from "./aura_outbox.mjs";

const learner_id = "1e0eae0e-0a00-4e0e-8a0a-eeeeeeeeeeee";
const device_id = "2e0eae0e-0a00-4e0e-8a0a-eeeeeeeeeeee";
let seq = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, "0")}`;
const now = () => "2026-11-05T00:00:00.000Z";
function memoryStore() {
  const rows = new Map();
  return {
    rows,
    async put(e) { rows.set(e.event_id, e); },
    async delete(id) { rows.delete(id); },
    async list() { return Array.from(rows.values()); }
  };
}

test("write locally before acknowledging enqueue", async () => {
  const store = memoryStore();
  const outbox = new AuraOutbox({store, transport: {}, uuid, now});
  const e = await outbox.enqueue({learner_id, device_id, event_type: "lesson_viewed"});
  assert.equal(store.rows.has(e.event_id), true);
  assert.equal(await outbox.pendingCount(), 1);
});

test("network failure keeps local outbox", async () => {
  const store = memoryStore();
  const outbox = new AuraOutbox({store, uuid, now,
    transport: {async sendEvents() {throw Error("offline");}}});
  await outbox.enqueue({learner_id, device_id, event_type: "review_opened"});
  const result = await outbox.flush();
  assert.equal(result.status, "retry_needed");
  assert.equal(result.pending, 1);
});

test("ack removes only acknowledged events", async () => {
  const store = memoryStore();
  const outbox = new AuraOutbox({store, uuid, now,
    transport: {async sendEvents(items) {return {acknowledged_ids: [items[0].event_id]};}}});
  await outbox.enqueue({learner_id, device_id, event_type: "review_opened"});
  await outbox.enqueue({learner_id, device_id, event_type: "review_opened"});
  const result = await outbox.flush();
  assert.equal(result.acknowledged, 1);
  assert.equal(result.pending, 1);
});

test("unexpected server ACK cannot remove records", async () => {
  const store = memoryStore();
  const outbox = new AuraOutbox({store, uuid, now,
    transport: {async sendEvents() {return {acknowledged_ids: [uuid()]};}}});
  await outbox.enqueue({learner_id, device_id, event_type: "lesson_viewed"});
  const result = await outbox.flush();
  assert.equal(result.status, "retry_needed");
  assert.equal(result.pending, 1);
});

test("a client cannot queue an official grade event", async () => {
  const outbox = new AuraOutbox({store: memoryStore(), uuid, now, transport:{}});
  await assert.rejects(outbox.enqueue({learner_id, device_id, event_type:"grade_changed"}));
});

test("concurrent flush calls share a single network request", async () => {
  let calls = 0;
  const store = memoryStore();
  const outbox = new AuraOutbox({store, uuid, now,
    transport: {async sendEvents(items) {calls++;return {acknowledged_ids:items.map(x=>x.event_id)};}}});
  await outbox.enqueue({learner_id, device_id, event_type:"draft_saved"});
  await Promise.all([outbox.flush(), outbox.flush()]);
  assert.equal(calls, 1);
  assert.equal(await outbox.pendingCount(), 0);
});

test("transport uses an access JWT and idempotent conflict-ignore", async () => {
  const sent = [];
  const transport = auraSupabaseEventTransport({
    supabaseUrl:"https://staging.example.supabase.co",
    publishableKey:"sb_publishable_testing_only",
    getAccessToken: async () => "test-jwt",
    fetchImpl: async (url, options) => { sent.push({url:String(url), options});return {ok:true,status:201}; }
  });
  const event = {event_id:uuid(),learner_id,device_id,event_type:"lesson_viewed",
    payload:{},client_created_at:now()};
  const result = await transport.sendEvents([event]);
  assert.deepEqual(result.acknowledged_ids, [event.event_id]);
  assert.equal(sent[0].options.method,"POST");
  assert.match(sent[0].options.headers.Prefer,/ignore-duplicates/);
  assert.equal(JSON.parse(sent[0].options.body)[0].actor_uid, undefined);
});

test("reject HTTP errors and preserve state", async () => {
  const transport = auraSupabaseEventTransport({
    supabaseUrl:"https://staging.example.supabase.co",
    publishableKey:"sb_publishable_testing_only",
    getAccessToken:async()=> "test-jwt",
    fetchImpl:async()=>({ok:false,status:403})
  });
  const store = memoryStore();
  const outbox = new AuraOutbox({store,transport,uuid,now});
  await outbox.enqueue({learner_id,device_id,event_type:"lesson_viewed"});
  const result = await outbox.flush();
  assert.equal(result.status, "retry_needed");
  assert.equal(result.pending, 1);
});
