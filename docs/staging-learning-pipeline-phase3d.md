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
