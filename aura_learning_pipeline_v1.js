/**
 * AURA STUDY — Phase 3A Learning Data Pipeline client, STAGING.
 *
 * Inject an authenticated Supabase client configured with the Student's JWT.
 * Never use a service_role/secret key in this module.
 * A single event envelope must be reused for every retry of one user action.
 *
 * Scores and weaknesses are NEVER derived from client-supplied event payloads.
 */
const TYPES = new Set([
  "lesson_viewed", "review_opened", "practice_opened", "draft_saved", "learner_note"
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireUuid(value, field) {
  if (typeof value !== "string" || !UUID.test(value)) {
    throw new TypeError(field + " must be a UUID");
  }
  return value;
}

function normalizedJson(value) {
  if (Array.isArray(value)) return value.map(normalizedJson);
  if (value !== null && typeof value === "object") {
    const result = {};
    for (const key of Object.keys(value).sort()) result[key] = normalizedJson(value[key]);
    return result;
  }
  return value;
}

function jsonEqual(a, b) {
  return JSON.stringify(normalizedJson(a)) === JSON.stringify(normalizedJson(b));
}

function normalizeTime(value) {
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) throw new TypeError("Invalid event timestamp");
  return new Date(ms).toISOString();
}

/**
 * Create an immutable event envelope once per actual user action. Keep this
 * object when retrying after an offline or transient network failure.
 *
 * contentItemId must be a published non-answer-key item from this learner's
 * household; the database RLS policy enforces that rule.
 */
export function createLearningEvent({
  learnerId,
  deviceId,
  eventType,
  contentItemId = null,
  payload = {},
  eventId = crypto.randomUUID(),
  clientCreatedAt = new Date().toISOString()
}) {
  requireUuid(learnerId, "learnerId");
  requireUuid(deviceId, "deviceId");
  requireUuid(eventId, "eventId");
  if (contentItemId !== null) requireUuid(contentItemId, "contentItemId");
  if (!TYPES.has(eventType)) throw new TypeError("Unsupported eventType");
  if (payload === null || Array.isArray(payload) || typeof payload !== "object") {
    throw new TypeError("payload must be an object");
  }

  // Client-side early validation. DB also limits actual JSONB storage to 16 KiB.
  const serialized = JSON.stringify(payload);
  if (typeof serialized !== "string" ||
      new TextEncoder().encode(serialized).length > 12 * 1024) {
    throw new TypeError("payload too large or not serializable");
  }
  const copy = JSON.parse(serialized);
  const event = {
    event_id: eventId,
    learner_id: learnerId,
    device_id: deviceId,
    event_type: eventType,
    content_item_id: contentItemId,
    payload: copy,
    client_created_at: normalizeTime(clientCreatedAt)
  };
  return Object.freeze(event);
}

function isSameEvent(prior, expected) {
  return prior.event_id === expected.event_id &&
    prior.learner_id === expected.learner_id &&
    prior.device_id === expected.device_id &&
    prior.content_item_id === expected.content_item_id &&
    prior.event_type === expected.event_type &&
    prior.schema_version === 1 &&
    normalizeTime(prior.client_created_at) === normalizeTime(expected.client_created_at) &&
    jsonEqual(prior.payload, expected.payload);
}

/**
 * Append only. Primary key (event_id) makes replay safe from duplicate writes.
 * A duplicate is acknowledged only when the existing row is visible to this
 * JWT and ALL immutable event fields match. Collisions are rejected.
 *
 * The caller is responsible for explicit retry/backoff; this helper does not
 * silently retry or regenerate event IDs.
 */
export async function appendLearningEvent(supabase, event) {
  if (!supabase?.from) throw new TypeError("Authenticated Supabase client required");
  const { error } = await supabase.from("aura_learning_events").insert(event);
  if (!error) return { status: "created", event_id: event.event_id };
  if (error.code !== "23505") throw error;

  const { data: prior, error: lookupError } = await supabase
    .from("aura_learning_events")
    .select("event_id,learner_id,device_id,content_item_id,event_type,payload,client_created_at,schema_version")
    .eq("event_id", event.event_id)
    .maybeSingle();

  if (lookupError || !prior || !isSameEvent(prior, event)) {
    throw new Error("EVENT_ID_COLLISION_OR_UNAUTHORIZED");
  }
  return { status: "already_recorded", event_id: event.event_id };
}

/** Read-only per-content activity; RLS + security_invoker scope all results. */
export async function getContentProgress(supabase, learnerId) {
  requireUuid(learnerId, "learnerId");
  const { data, error } = await supabase.from("aura_learning_progress_v1")
    .select("*").eq("learner_id", learnerId).order("last_activity_at", { ascending: false });
  if (error) throw error;
  return data;
}

/** Read-only daily activity buckets, grouped by UTC day. */
export async function getDailyActivity(supabase, learnerId) {
  requireUuid(learnerId, "learnerId");
  const { data, error } = await supabase.from("aura_learning_daily_v1")
    .select("*").eq("learner_id", learnerId).order("activity_day_utc", { ascending: false });
  if (error) throw error;
  return data;
}

/** Only verified, released exam/practice outcomes. No inferred weakness labels. */
export async function getVerifiedOutcomes(supabase, learnerId) {
  requireUuid(learnerId, "learnerId");
  const { data, error } = await supabase.from("aura_verified_outcomes_v1")
    .select("*").eq("learner_id", learnerId).order("released_at", { ascending: false });
  if (error) throw error;
  return data;
}
