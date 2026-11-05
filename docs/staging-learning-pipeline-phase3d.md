# AURA STUDY — Phase 3D / Offline Resilience & Operational Hardening

Date: 2026-11-05. Environment: **Supabase aura-study-staging** + GitHub Pages.  
Status: **CODE DEPLOYED TO GITHUB; LOGIC / BACKEND BASELINE CHECKS PASS; REAL-BROWSER E2E PENDING**.  
**PRODUCTION NOT APPROVED.** No account deletion, event cleanup, or revocation was executed in this phase.

## Why Phase 3D exists

Phase 3C's page imports Supabase JS from an external CDN at initial page load, so a cold offline reload is not guaranteed. The Phase 3C queue also had a read-then-write capacity check that could race between tabs. Phase 3D adds a small offline-first shell and cross-tab coordination while preserving the Phase 3A/3B event pipeline and Phase 3C security rules.

## Artifacts

- `phase3d/index.html`: browser E2E test for real offline reload, app-shell cache, offline enqueue, sync, cross-tab lock, governance.
- `phase3d/sw.js`: path-scoped Service Worker; cache allowlist includes only static HTML and same-origin JavaScript needed to render and enqueue offline. Never caches Supabase endpoints, auth responses, tokens or third-party CDN modules.
- `phase3d/offline-context.js`: IndexedDB stores last-online-verified minimal IDs (auth UID, device ID, learner ID, synthetic lesson ID), with a **24-hour offline authoring lease**. These IDs are *routing metadata*, not reusable authorization.
- `phase3d/resilient-sync.js`: Web Locks exclusive `ifAvailable` lock keyed to owner+device. When unsupported or unavailable, **fail closed** and do not sync.
- `aura_offline_queue_v1.js`: upgraded with atomic `get/count/add` under a single IndexedDB readwrite transaction to avoid concurrent-tab cap races. Existing store format and version remain unchanged.
- `supabase/audits/aura_phase3d_operational_dry_run.sql`: read-only audit aggregates; does not print actual user IDs, emails or secrets; never deletes.
- Existing `aura_learning_pipeline_v1.js` is still responsible for exact-`event_id` replay checks and RLS-protected inserts.

## Process

1. Visit `phase3d/index.html` online on the **same origin/browser** that holds the paired STAGING Student session.
2. Click **Cài trang offline**. The Service Worker pre-caches the offline shell. After install it may be necessary to reload online once to get the page under SW control.
3. Click **Xác minh Student + lưu ngữ cảnh 24 giờ**. The server validates the JWT and active paired device; only then is the metadata cached.
4. In browser DevTools Network, select **Offline**, then reload the page while offline. This should serve HTML and local modules from the Service Worker. No Supabase JS CDN is fetched during offline load.
5. Click **Tạo một sự kiện khi offline**. This uses cached metadata and `aura_offline_queue_v1.js` to enqueue a unique `lesson_viewed` with `payload.test=true` and `source=staging_phase3d`. No network requests occur during this operation. The same event ID is re-enqueued to test local deduplication.
6. Restore network; click **Đồng bộ / đối chiếu**. The application dynamically imports pinned Supabase JS, checks the *current* Student JWT and device authorization via server, obtains the cross-tab lock, flushes the queue, and compares exact acknowledged event IDs with server rows. It cannot treat cached scope as a credential.
7. In two tabs of the **Phase 3D** page, click **Giữ khóa 8 giây** in tab A and **Đồng bộ** in tab B before release. Tab B should report `locked_by_another_tab` and must not send.
8. Click **Kiểm tra queue và Learning Progress**. Counted lesson views must exclude all `payload.test=true` events. The test never creates grades or exam attempts.

## Security assumptions and limitations

- Offline local capture may continue for at most 24 hours after a legitimate online authorization, even if subsequent revocation cannot yet be checked while disconnected. **Submission ALWAYS requires fresh online authorization**, and RLS remains authoritative.
- A shared browser/device might expose cached UUID routing metadata or queued event telemetry to another local user of the same origin. Never queue free-text answers, scores, JWTs, email addresses or sensitive notes; implement device isolation and encryption policy before real learner use.
- Service Worker control is limited to the `phase3d/` path and an explicit static-resource allowlist. It does NOT intercept/cache auth/REST/API responses or other AURA STUDY pages.
- This is **no background sync after app closure**. The user must reopen the page. Browser eviction or explicit clearing of IndexedDB/CacheStorage can still lose unsent events.
- Web Locks coordinate Phase 3D pages on the same origin. Legacy Phase 3C pages do not acquire these locks; do not run both sync clients at once. The server `event_id` primary key still prevents duplicate acceptance.
- In multi-device situations and for expired event IDs, human review is necessary; never rewrite an event ID just to bypass server limits.
- The page uses a publishable Supabase key only and dynamically imports a pinned version of `supabase-js` only when online. The external package dependency should be vendored and integrity/audit strategy approved before production.

## Verified today

- GitHub files created and syntactically parsed.
- Mocked concurrent Web Locks test returned one accepted lock-holder and one `locked_by_another_tab`, max concurrent holders 1.
- Database baseline confirmed: **1 household, 1 learner, 1 active Student device, 3 historically revoked test devices, 2 synthetic published content items, 7 existing learning events, 0 exam attempts**.
- Supabase Phase 3C server quota trigger is still enabled and existing Student RLS is unchanged.
- Read-only inventory: **0 Phase3D events currently persisted**, **0 synthetic events older than 30 days**, **0 retired devices older than 30 days**, **3 anonymous Auth users lacking an active device**. This is an inventory, not permission to delete those users.
- Supabase Security Advisor still warns about anonymous sign-ins on relevant tables and leaked-password protection. Tables without policies remain intentionally private pending review.

## E2E acceptance gates

- Browser screenshot showing Service Worker static shell cached and Student scope verified while online.
- Real offline reload succeeds and allows one event enqueue after reload, with the browser reporting offline.
- Reconnect/manual flush returns PASS, one new event is persisted, matching JWT Student/device/learner/content, and local queue is empty.
- Two-tab lock test returns `locked_by_another_tab`; only one tab sends.
- Existing Phase3B Progress remains 1 lesson view and 1 practice open, with 0 verified outcomes.
- A separate future chaos test should cover failed HTTP request after a server-side commit, retry exhaustion, Storage eviction and attempted local access after account change/revocation.

## Data Governance policy — PROPOSED, NOT APPROVED

- Do **not** auto-delete test data, Auth users, queues, or revoked-device records.
- Proposed review cadence: synthetic STAGING events and test-only content **30 days after phase sign-off**; do not equate review with deletion.
- Proposed local queue handling: 6-day send window, 8 transient retries; after exhaustion the event stays in review state rather than being silently deleted.
- Proposed retired device/anonymous account review: confirm ownership, FK dependencies and audit retention, preserve original active Student, obtain explicit sign-off before any cleanup.
- Admin-owned production data retention, encryption-at-rest, jurisdictional/privacy compliance, and a reliable long-term audit process must be designed separately.

## Next step

**Phase 3D Browser E2E acceptance** is pending. Production rollout remains blocked until security, test-data governance, operational runbook, and real offline/reconnection tests pass.


---

## Phase 3D E2E evidence review — 2026-11-05

**Decision: PARTIAL PASS; complete Phase 3D E2E is NOT YET ACCEPTED. Production remains BLOCKED.**

User-provided browser screenshot indicates:
- JWT/paired Student verification succeeded and minimal offline scope was cached; Web Locks API reported SUPPORTED.
- Local IndexedDB enqueue and same-ID local duplicate suppression passed; queue had one pending item.
- Successful manual sync/reconciliation of one `event_id`, after which local queue showed zero pending/retry/blocked/review items.
- Governance/Progress check passed, excluding `test:true` telemetry from counted lesson progress.
- Tab A reported that it held the lock for eight seconds, but there is no screenshot of tab B returning `locked_by_another_tab`.

**Two unfulfilled browser acceptance gates:**
1. Offline step explicitly displayed `QUEUE PASS — Chưa xác minh mất mạng thật` and `navigator.onLine: true`. This is proof of an IndexedDB enqueue but **NOT** proof of offline reload or real disconnection.
2. Cross-tab test only shows tab A's successful lock hold; tab B's denied acquisition is **NOT** evidenced.

### Independent Supabase STAGING verification
- **Exactly one** `aura_learning_events` row with `payload.source=staging_phase3d`, scenario `offline_reload`; exactly one distinct event ID.
- Event: `lesson_viewed`, `payload.test=true`, schema_version 1, correct learner/device/actor, active paired Student, published STAGING Phase3B LESSON. Receipt present at approximately **16:01 Asia/Ho_Chi_Minh, 2026-11-05**.
- Two Phase3B contents; **1** current active Student device; total **8** Learning Events; **0** attempts or outcomes.
- Learning Progress unchanged: one `lesson_viewed` and one `practice_opened`; paired Student role simulation sees 0 Admin households, 1 Phase3D event, two counted progress activities.
- No writes or cleanup were executed during this verification.

### Next browser evidence required

**Actual offline reload:**
1. While online, on the same paired Student browser, click Install Service Worker and wait for PASS, then Verify Student/Save Context and wait for PASS. Reload once online if necessary so the worker controls the page.
2. In DevTools Network select **Offline** (or disconnect Wi-Fi), then reload `phase3d/index.html` while still offline.
3. Click **Tạo một sự kiện khi offline**. Required evidence: the page reloads and result includes `PASS — Đã tạo event khi trình duyệt báo mất mạng` with `navigator.onLine: false`.
4. Reconnect and run sync; verify new unique event and empty queue afterward.

**Two-tab exclusion:**
1. Open the same Phase3D URL in tab A and tab B in the same browser profile.
2. On tab A click **Giữ khóa 8 giây**; within eight seconds click **Đồng bộ** on tab B.
3. Required evidence: tab B reports `locked_by_another_tab` and makes no upload; tab A eventually reports lock released.

Browser IndexedDB content and Web Locks are not directly verifiable by Supabase SQL, so browser evidence is essential. The 4/4 click sequence does not by itself complete the real-offline or concurrent-tab proofs. A screenshot of only tab A is insufficient.

**Other unresolved gates**: storage eviction, session expiry and revocation while queued, long transient errors, formal data retention/deletion policy, Supabase Security Advisor issues. These remain outside the current browser smoke-test acceptance and block production readiness.


---

## Phase 3D real offline/reconnect retest — 2026-11-05

**Decision: REAL OFFLINE QUEUE + RECONNECT SYNC ACCEPTED FOR TESTED CASES; PHASE 3D E2E STILL PARTIAL.**

User-provided screenshot shows:
- Step 1: online Student/JWT paired device revalidation and cached minimal scope PASS; Web Locks SUPPORTED.
- Step 2: `navigator.onLine: false` and explicit `PASS — Đã tạo event khi trình duyệt báo mất mạng`; three queued offline, local duplicate suppression PASS. This now proves the local operation was invoked with a browser-reported offline state. A screenshot alone cannot independently establish that the page was reloaded after disconnection, though that is the indicated manual test procedure.
- Step 3: manual reconnection/flush reports three created and reconciled `event_id` records, zero remaining queued/retry entries.
- Step 5: local queue shows zero pending/blocked/review; read model excludes test telemetry, lesson view stays at one.
- Step 4: **still only shows tab A** holding/releasing the lock for eight seconds. No tab B `locked_by_another_tab` evidence has been provided.

### Independent Supabase confirmation
- Exactly **four** persistent Phase3D-tagged events now exist, with **four distinct event IDs**: one from the prior partial run, three new events received at approximately **16:11 Asia/Ho_Chi_Minh**.
- All four: event type `lesson_viewed`, scenario `offline_reload`, `payload.test=true`, schema_version 1, correct actor/learner/device, active device, published Phase3B lesson and non-null server receipt.
- STAGING totals: 11 Learning Events, 1 household, 1 learner, 1 active Student device, 3 revoked historical test devices, 2 synthetic published content items, 0 attempts, 0 verified outcomes.
- Paired Student simulated RLS view continues showing 0 Admin households and 4 visible Phase3D events.
- Progress still counts exactly one lesson view and one practice open; test events are not included.

### Remaining minimum acceptance gate
During an overlapping two-tab test, tab B must return `locked_by_another_tab` while tab A holds the Web Lock. Only tab A's `released_after_test` result is shown so far. Capture tab B's response or implement a deterministic two-context browser test to demonstrate exclusion. The JS/mock lock test passed earlier but does not replace a browser two-tab E2E proof.

### Remaining production blockers
Final data retention/deletion approval, real storage-eviction and expired-session tests, retry error-chaos testing, compatibility/security review for shared devices and Supabase Security Advisor warnings. No cleanup or production deployment performed.


---

## Phase 3D STAGING E2E sign-off — 2026-11-05 (multi-tab confirmation)

**Decision: ACCEPTED — Phase 3D E2E smoke test scope on STAGING.**  
**Production deployment: NOT APPROVED. Data Governance retention/deletion policy: NOT APPROVED.**

### Evidence received
- The user supplied a separate screenshot of **tab B**, captured during the two-tab Web Locks test. Step 3 reports exactly:
  `PASS — locked_by_another_tab: tab này không được cấp khóa và không gửi dữ liệu.`
- Combined with the previously supplied tab A result showing a held/released eight-second lock and the earlier logic test confirming only one holder, the browser-level contention check is **PASS**.
- Prior Phase 3D offline test screenshot shows `navigator.onLine: false`, event stored without network, and subsequently three unique event IDs synced when online. We rely on the user-run browser test for the offline reload step; neither Supabase SQL nor this screenshot alone independently proves the browser reload gesture.
- Prior test: local queue 0 after acknowledgement, Progress excluding `test:true` events.

### Post-submission database snapshot
- 1 active Student device.
- 13 total Learning Events; 6 Phase3D-tagged events with 6 distinct IDs.
- 0 persisted attempts.
- The progress view continues to count 2 activities (one original Phase3B lesson view + one practice open).
- These are aggregate observations after the multi-tab evidence was submitted. They do not attribute additional events to the tab B lock attempt.

### Scope of sign-off
The documented browser acceptance suite is complete: offline queue under `navigator.onLine=false`, reconnection, exact-event reconciliation, testing data excluded from progress, and cross-tab exclusion reported by tab B. This is **STAGING E2E sign-off for the specific flows tested**, not a certification of full offline or security resilience.

### Outstanding release blockers
- Data-retention and cleanup plan with explicit authorization; no deletions were carried out.
- Storage eviction, session expiry and device revocation during queued activity, interrupted-network error/retry exhaustion, and more comprehensive multi-tab/real-device stress testing.
- Security review of cached shared-device metadata, external dependency policy, Supabase Auth anonymous user abuse, rate limiting and leaked password protection.
- Production deployment remains blocked.

**Next proposed focus:** Phase 3E — Operational Security, Test-data Lifecycle & Production Readiness Gates. Do not begin production promotion until all release blockers are resolved.
