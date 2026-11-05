# AURA STUDY — PHASE 3C / Offline Queue, Reliable Sync & Data Governance

Date: 2026-11-05  
Environment: **Supabase `aura-study-staging` only**  
Backend status: **INGEST GUARD TESTS PASS**  
Browser / actual device status: **E2E PENDING**  
Production approval: **NOT GRANTED**

## Components delivered

1. `aura_offline_queue_v1.js` — reusable same-origin IndexedDB queue scoped to the authenticated Student UID and paired device; no token material persisted by this module.
2. `aura-staging-phase3c.html` — four browser tests: Student+IndexedDB, forced offline enqueue without network, manual authenticated flush/reconciliation, and governance/progress check.
3. `supabase/migrations/20261105082644_aura_phase3c_ingest_abuse_guard_v1.sql` — PostgreSQL event ingestion trigger, applied to STAGING.
4. `supabase/audits/aura_phase3c_staging_governance_dry_run.sql` — read-only counts and security checks; never deletes data.

Phase 3A's `aura_learning_pipeline_v1.js` remains the source of truth for event envelopes and idempotent server writes. Phase 3B's published synthetic lesson/practice items remain intact.

## Queue architecture

`Student action → immutable event_id/envelope → IndexedDB → reconnect/login+device check → Supabase INSERT (RLS) → exact-event reconciliation → delete ONLY acknowledged local queue item`

### Local storage, scope and limits

- IndexedDB database: `aura-study-offline-events-v1`, events store with owner index.
- Scoped to `authUid:deviceId`; never migrate queued events to a different account/device.
- Maximum **100 pending/review rows per scope**, maximum **10 transmitted per flush**.
- Maximum **8 transient attempts**, exponential backoff with jitter, capped at **15 minutes**.
- Client event age window: **6 days** (below the server's 7-day ingest window).
- Optional auto-sync while page is open: once every **15 seconds**, plus browser online/visible events.
- `auth.getUser()` and active device query are repeated before sending queued events.
- Successful writes or verified exact duplicates remove the corresponding local queue item. A collision with changed content is NOT acknowledged.
- Permanent rejects and account switching mark rows blocked/review; do not silently delete or submit them under another identity.

### Important limitations

- IndexedDB can be cleared/evicted by browser settings, private browsing or low storage. **Do not claim guaranteed local durability**.
- No operating-system/background/Service Worker sync after the page closes.
- Queue is not encrypted separately at rest; avoid collecting answers, grades, medical info, passwords, tokens, pairing codes or personal notes as telemetry. Threat-model shared devices before real learner usage.
- A queue record with stale revocation or loss of authorization must remain local as blocked for review; do not bypass RLS.
- The browser diagnostic creates only a synthetic `lesson_viewed` event tagged `payload.test=true`, which the Phase3A read models exclude. Server still stores the raw event.

## Server-side abuse controls

Active trigger: `public.aura_events_ingest_guard_v1`.

- 60 accepted events per minute per device;
- 1,000 accepted events in a rolling 24-hour period per device;
- client timestamp no older than 7 days and no more than 10 minutes in the future;
- advisory transaction lock per device to serialize quota checks;
- `SECURITY INVOKER` trigger function; no direct function `EXECUTE` granted to `anon` or `authenticated`;
- existing RLS enforces paired-device/learner/content access, while server-owned fields remain protected.

**SQL tests passed** on STAGING:
- 8-day-old timestamp rejected;
- 15-minute-future timestamp rejected;
- allowed writes up to the 60/minute cap; the 61st rejected;
- 1,000 synthetic historical events within 24h caused the next Student insert to be rejected.

The quota tests inserted synthetic rows inside transactions with **ROLLBACK**. They did not modify persistent learner or device state. Thresholds are STAGING defaults and must be evaluated under actual application usage before production.

## Data governance: inventory and cleanup proposal

The Phase3C migration **does not run DELETE or TRUNCATE**. The read-only audit counts only aggregate data and avoids exposing user IDs, emails, JWT, OTP or pairing codes.

Recommended decision points prior to enabling real learner data:
- Document owners and retention categories for local queued records, STAGING synthetic events, retired test devices, anonymous Auth users and audit logs.
- Suggested local queue handling: 6-day retry eligibility, rows older than that flagged for review, manual deletion only after approved procedure. No automatic local purge in v1.
- Suggested STAGING synthetic event review cycle: 30 days after each accepted phase, but **do not enact deletion before approval**.
- Preserve approval/audit evidence separately before approved cleanup.
- For deletion of STAGING-only Auth accounts, first inspect event/device foreign-key dependencies; never delete the original Student/household or any real learner data.
- Revoked devices and unsuccessful auth attempts may need separate retention due to security audit.
- Monitor rate-limit rejects and malicious retries, plus Supabase Auth anonymous-user abuse controls and Security Advisor warnings.

## Browser E2E checklist

Open `aura-staging-phase3c.html` using the same GitHub Pages origin/browser as the paired STAGING Student.

1. **Kiểm tra Student và hàng đợi**: JWT/device valid; IndexedDB available.
2. **Tạo và lưu 1 event offline thử nghiệm**: event stored locally; second enqueue with same event ID returns `already_queued` without network.
3. **Đồng bộ và đối chiếu**: online Student JWT submits event and RLS accepts it; exact duplicate can be recognized, acknowledgment removes local pending record.
4. **Kiểm tra queue + Learning Progress**: query confirms server test event is marked `test:true`, and Progress still excludes it.

For a stronger offline test, run Step 2, reload the page while offline, then restore connectivity and authenticate before Step 3. An offline reload cannot create new events until the page obtains a verified Student scope, but previously queued events must remain until sync/explicit browser deletion.

Expected new database state after running these checks: at least one new STAGING Phase3C test event, one active paired Student device, unchanged Phase3B progress counters, zero attempts/scores.

## Remaining acceptance gates

- Real browser JWT/IndexedDB test 4/4.
- Server-side verification of persisted `staging_phase3c` test event(s), owner linkage, receipt timestamp, event-id uniqueness, and 0 unauthorized writes.
- Confirm no persistent traces from rate-cap SQL tests.
- Review and finalize retention/delete policy with authorization.
- Monitor Supabase security advisors (anonymous sign-ins and leaked-password warning still pending). Implement stronger abuse mitigations as usage requires.
- Do not promote database, queue client or STAGING fixture data to PRODUCTION yet.
