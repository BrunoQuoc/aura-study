/**
 * AURA P0 local-first outbox (ES module, no external dependencies).
 * Staging-only. Events are UNGRADED telemetry; never use this endpoint
 * for exam scores, answer keys, role changes or published content.
 *
 * The storage adapter persists every event before UI claims local save.
 * Transport must ACK only after server confirms a durable, authorized write.
 */
const EVENT_TYPES = new Set([
  "lesson_viewed", "review_opened", "practice_opened", "draft_saved", "learner_note"
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertUuid(value, name) {
  if (typeof value !== "string" || !UUID.test(value)) {
    throw new TypeError(name + " phải là UUID hợp lệ");
  }
}
function checkEvent(e) {
  ["event_id", "learner_id", "device_id"].forEach(k => assertUuid(e[k], k));
  if (!EVENT_TYPES.has(e.event_type)) throw new TypeError("Sự kiện không được phép");
  if (!e.payload || Array.isArray(e.payload) || typeof e.payload !== "object") {
    throw new TypeError("payload phải là object");
  }
  // Bound network payload; database also enforces pg_column_size.
  if (JSON.stringify(e.payload).length > 14000) throw new RangeError("Payload quá lớn");
  if (!Number.isFinite(Date.parse(e.client_created_at))) throw new TypeError("Thiếu thời gian tạo");
}

export class AuraOutbox {
  constructor({ store, transport, now = () => new Date().toISOString(),
                uuid = () => crypto.randomUUID(), batchSize = 20 } = {}) {
    if (!store || !transport || !Number.isInteger(batchSize) || batchSize < 1 || batchSize > 50)
      throw new TypeError("Cấu hình outbox không hợp lệ");
    this.store = store;
    this.transport = transport;
    this.now = now;
    this.uuid = uuid;
    this.batchSize = batchSize;
    this.activeSync = null;
  }

  async enqueue({ learner_id, device_id, event_type, payload = {} }) {
    const event = { event_id: this.uuid(), learner_id, device_id,
      event_type, payload, client_created_at: this.now() };
    checkEvent(event);
    // No UI success before this transaction resolves.
    await this.store.put(event);
    return Object.freeze({ ...event });
  }

  async pendingCount() { return (await this.store.list()).length; }

  async flush() {
    // Collapse concurrent sync calls; no duplicate simultaneous POST.
    if (this.activeSync) return this.activeSync;
    this.activeSync = this._flushOnce();
    try { return await this.activeSync; }
    finally { this.activeSync = null; }
  }

  async _flushOnce() {
    const unsent = (await this.store.list()).slice(0, this.batchSize);
    if (!unsent.length) return { status: "synced", acknowledged: 0, pending: 0 };
    try {
      unsent.forEach(checkEvent);
      const ack = await this.transport.sendEvents(unsent);
      if (!Array.isArray(ack?.acknowledged_ids)) throw Error("Máy chủ chưa ACK");
      const requested = new Set(unsent.map(e => e.event_id));
      const accepted = new Set();
      for (const id of ack.acknowledged_ids) {
        if (!requested.has(id)) throw Error("ACK không khớp yêu cầu");
        accepted.add(id);
      }
      // Delete only exactly ACK'd IDs. The rest stays in outbox.
      for (const id of accepted) await this.store.delete(id);
      const pending = await this.pendingCount();
      return { status: pending ? "pending" : "synced",
        acknowledged: accepted.size, pending };
    } catch (err) {
      return { status: "retry_needed", acknowledged: 0,
        pending: await this.pendingCount(),
        error: err instanceof Error ? err.message : String(err) };
    }
  }
}

/**
 * Browser IndexedDB adapter. Persists events in its own store; never deletes
 * legacy localStorage. Does not depend on whether another browser is open.
 */
export class AuraIndexedDbOutboxStore {
  constructor({ indexedDBImpl = globalThis.indexedDB, name = "aura-staging-v1" } = {}) {
    if (!indexedDBImpl) throw Error("Thiết bị không hỗ trợ IndexedDB");
    this.indexedDB = indexedDBImpl;
    this.name = name;
    this.dbPromise = null;
  }
  async db() {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      const r = this.indexedDB.open(this.name, 1);
      r.onupgradeneeded = () => {
        const db = r.result;
        if (!db.objectStoreNames.contains("outbox")) {
          db.createObjectStore("outbox", { keyPath: "event_id" });
        }
      };
      r.onerror = () => reject(r.error || Error("Không mở được IndexedDB"));
      r.onsuccess = () => resolve(r.result);
      r.onblocked = () => reject(Error("IndexedDB đang bị phiên khác khóa"));
    }).catch(e => { this.dbPromise = null; throw e; });
    return this.dbPromise;
  }
  async request(mode, method, arg) {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("outbox", mode);
      const r = tx.objectStore("outbox")[method](...(arg === undefined ? [] : [arg]));
      let data;
      r.onsuccess = () => { data = r.result; };
      tx.oncomplete = () => resolve(data);
      tx.onerror = () => reject(tx.error || r.error || Error("Lỗi lưu cục bộ"));
      tx.onabort = () => reject(tx.error || Error("Đã hủy giao dịch"));
    });
  }
  async put(e) { return this.request("readwrite", "put", e); }
  async delete(id) { return this.request("readwrite", "delete", id); }
  async list() {
    const list = await this.request("readonly", "getAll");
    return list.sort((a, b) =>
      a.client_created_at.localeCompare(b.client_created_at) ||
      a.event_id.localeCompare(b.event_id));
  }
}

/** PostgREST adapter. Publishable key is public; JWT is fetched on demand. */
export function auraSupabaseEventTransport({
  supabaseUrl, publishableKey, getAccessToken, fetchImpl = fetch
}) {
  const base = new URL(supabaseUrl);
  if (!(base.protocol === "https:" ||
    (base.protocol === "http:" && ["localhost", "127.0.0.1"].includes(base.hostname)))) {
    throw Error("Supabase URL phải dùng HTTPS");
  }
  if (!publishableKey || typeof getAccessToken !== "function") throw Error("Thiếu cấu hình");
  return {
    async sendEvents(events) {
      events.forEach(checkEvent);
      const token = await getAccessToken();
      if (!token) throw Error("Phiên học sinh chưa xác thực");
      const endpoint = new URL("/rest/v1/aura_learning_events?on_conflict=event_id", base);
      const res = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          apikey: publishableKey,
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
          Prefer: "resolution=ignore-duplicates,return=minimal"
        },
        body: JSON.stringify(events)
      });
      if (!res.ok) throw Error("Máy chủ từ chối đồng bộ (HTTP " + res.status + ")");
      // PostgREST 2xx after conflict-ignore means all IDs are durably present
      // or matched existing unique IDs. Server must enforce RLS for inserts.
      return { acknowledged_ids: events.map(e => e.event_id) };
    }
  };
}
