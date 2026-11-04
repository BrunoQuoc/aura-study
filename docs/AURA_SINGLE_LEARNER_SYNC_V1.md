# AURA STUDY — Single Learner, Parent Admin, Local-first Sync
Status: DESIGN ONLY · NOT DEPLOYED
Design version: 1.0 · 2026-11-04
Branch: `design/single-learner-sync-v1`

## 0. Product decision
- Exactly **one learner profile** for this family; one parent/admin role. Multiple devices are allowed, NOT multiple learners.
- Student can only read approved material, learn, attempt assessments, see their own progress.
- Parent/Admin manages material approvals, assignments, grading/review, reports and device pairing.
- Student and Admin must work either on the **same browser/device** or on **separate devices**.
- Keep current Hybrid UI and Home layout. No new decorative features during stability rebuild.
- Never create fake answers, grades, classification confidence or timestamps.

## 1. Why rebuild
Current app is static frontend hosted on GitHub Pages; accounts and progress are in browser localStorage. Scripts include `local_accounts_v3.js`, `student_login_direct_fix.js`, loader-based wrappers; Admin→Student published-library is also localStorage-based. Sharing a URL does NOT share browser storage. A cross-device parent dashboard requires a server-authoritative dataset. Do not repair with another wrapper/observer.

## 2. Target architecture
- Frontend: keep GitHub Pages Student and Admin surfaces, existing Hybrid style.
- Identity/database: Supabase Auth + Postgres with Row Level Security (RLS), one family and exactly one learner row. Server is authoritative for role, published materials, assessment results and sync acknowledgments.
- Student identity: device-local Supabase anonymous auth identity, **useless until parent-authorized pairing** binds `auth.uid()` to the family learner via server-validated one-time code. New device = new identity paired to SAME learner record. On lost/reinstalled device, revoke old membership and re-pair. Anonymous accounts cannot self-recover across devices. Enable abuse prevention (CAPTCHA/rate limiting). Use parent authorization for pairing.
- Admin identity: parent's verified email OTP/magic link (permanent Supabase Auth identity). No shared admin PIN or URL-only admin authority.
- Student local-first store: IndexedDB `content_cache`, `learning_state`, `outbox_events`, `sync_cursor`. Offline preloaded lesson/exam assets and offline attempts; don't assume arbitrary Drive files are cached.
- Sync service: authenticated API + RLS / strictly validated server operation; idempotent outbox push + incremental pull. Optional Realtime for UX, NEVER relied upon for correctness.
- Google Drive: original files and source references remain in Drive; backend materials registry is source of truth for **published** learning materials. For Student access, serve an authorized private cached copy/preview in controlled Storage (or trusted backend proxy), not a raw URL requiring the child's Google account.
- Avoid exposing service keys, Google refresh tokens, or privileged credentials in GitHub Pages JS or localStorage; privileged Drive copy operations run only from trusted backend.

## 3. Authorization model
- `families` (single household, parent_auth_uid)
- `learners` (one row bound to family; fixed ID; no Student CRUD)
- `device_memberships` (auth_uid, learner_id, role=student, active, revoked_at, paired_at)
- Parent auth identity is admin; no client-writable role flags.
- All exposed tables have RLS. Student can SELECT published material and own progress and INSERT own validated, immutable attempt events. Student cannot UPDATE grades, PUBLISH material, modify another identity or edit role/pairing.
- Admin can read learner events, create assignments, review grading, approve/reject material, pair/revoke device. Sensitive mutation via trusted server operation enforcing admin identity.
- An anonymous Supabase Auth user has the Postgres `authenticated` role; RLS must enforce exact membership, not `TO authenticated` alone. Never trust `user_metadata` as role.
- Parent/Admin switch on a shared browser must authenticate separately; do not implement a client-side role flag as an access-control boundary.

## 4. Minimum database / data model
- `learner_profiles(id, family_id, display_name, created_at)`
- `device_memberships(id, auth_user_id, learner_id, paired_at, revoked_at, device_label)`
- `materials(id, source_drive_file_id, source_name, content_sha256, subject, doc_type, period, source_provenance, status, private_storage_key, approved_by, approved_at, published_at, version)`
- `material_approvals(id, material_id, suggested_metadata, confirmed_metadata, quality_audit, decision, actor_id, created_at)`
- `question_bank(id, material_id, subject, topic_id, question_type, source_evidence, answer_key, gradable, version)`
- `assignments(id, learner_id, exam_snapshot_id, issued_by, due_at, state)`
- `learning_events(event_id UUID UNIQUE, learner_id, device_id, event_type, content_ref, payload_json, client_created_at, server_received_at)`
- `attempts(id, learner_id, exam_snapshot_id, created_at, submitted_at, grading_status, score, grading_version)`
- `attempt_answers(attempt_id, question_id, response_json, source_evidence, grading_status, correctness, score_component)`
- `sync_receipts(device_id, event_id, accepted_at)` or server-side unique event IDs for deduplication.
- Report and weakness scores are **derived from reliably graded answers**; never merge subject marks into one score or treat ungradable as zero.

## 5. Sync contract
1. Local event is saved in an IndexedDB transaction BEFORE acknowledging user action; outbox state `pending`.
2. UI immediately shows local result and `Chưa đồng bộ`. Offline is allowed only for cached, authorized learner content.
3. When online and authenticated, push batches with `event_id`, `device_id`, `learner_id`, schema version; server authorizes membership, validates, inserts idempotently and returns accepted IDs.
4. Delete/mark outbox events only after server ACK. Use bounded retry with backoff; no destructive clear-on-failure.
5. Pull server changes by cursor after push; reconcile by event ID/version. Use cursor from server, not client clocks, to avoid missing events.
6. Attempts/submissions are append-only, uniquely identified; do NOT use last-write-wins for grade, answers, or attempts. Duplicate pushes do not duplicate grades.
7. Lesson progress is derived from events. An explicit parent reset event has an epoch/version; old queued progress cannot resurrect a reset.
8. If the same draft is edited on two devices, preserve both conflicting drafts or require user choice; never silently overwrite an answer.
9. Student shows exact states: `Đã lưu trên máy`, `Đang đồng bộ`, `Đã đồng bộ`, `Cần thử lại`. Parent sees pending data warning / last successfully synced.
10. Network returns and app foreground both trigger sync. Background sync is best-effort only.

## 6. Reliable approval/publication
State machine:
`INBOX → QUALITY_CHECKED → PENDING_ADMIN → APPROVED_PENDING_PUBLISH → PUBLISHED`
alternative: `REJECTED`, `PUBLISH_FAILED`.
- Parent confirms subject, document type, exam period and evidence; AURA suggestion is NOT authoritative.
- On approval, trusted backend copies/verifies a private Student-readable preview/content, creates or updates registry idempotently with unique Drive file ID and content hash, and marks PUBLISHED **only after** object is readable.
- The Student library queries only PUBLISHED records from shared registry. Examinations and exercises are visible in the subject resources but are NOT mislabeled normalized lessons.
- If Drive move/copy/preview fails, show `PUBLISH_FAILED` and retry control; never show success or silently disappear.
- Rejected files remain archived outside INBOX and are never automatically re-queued.
- Respect existing `drive.file` scope boundaries; parent may need to pick/select source folder once. Do not assume broad Drive enumeration permissions.

## 7. Migration plan, no production edits until validated
A. Freeze main release; make a full local browser backup of `aura_*`, `exam_*`, `review_*` and inventory Drive docs.
B. Build in separate branch with a staging Supabase project (no secrets in GitHub). Add migrations, RLS and tests first.
C. Parent signs in and pairs learner's browser; Student can access only one fixed learner.
D. Import legacy `aura_local_students_v1` and each `aura_student_profile_v1:*` only after Admin chooses the ONE canonical learner source. Dry-run counts, preserve original backup, assign deterministic import IDs and prevent duplicates.
E. Import approved-material registry, verify Drive links / preview copies, do not auto-publish uncertain entries.
F. Run regression tests, then deploy behind controlled rollout; keep old build / backups for rollback until acceptance.
G. Disable legacy local-account and OAuth/INBOX monkey patches only after replacement is tested. No edits on production until pilot passes.

## 8. Acceptance / release gate
- Admin logs in on phone A, pairs one Student on tablet B.
- Student reloads app and logs in after tab close; can read a cached lesson offline and submit an attempt offline.
- Offline attempt is stored locally; after reconnect it syncs exactly once; Admin on phone A sees the correct subject, score, wrong answers and sync time.
- Relaunch both devices; result unchanged; duplicate replay creates no duplicate attempt.
- Admin approves one image and one DOCX exam. Student sees both under correct subject/type, can open authorized content without Google sign-in.
- Simulated publish failure shows PUBLISH_FAILED and does NOT show a published Student item.
- Parent resets progress: older offline events cannot recreate erased progress.
- Revoke Student device; its subsequent network requests are rejected even if UI has a stale cache.
- RLS cross-role tests: Student cannot alter question keys, grades, materials, role, or pairing.
- No frontend JS runtime exceptions, infinite observers, hidden OAuth popup or 404 under desktop Chrome / iOS Safari / Android Chrome.
- Success means full browser E2E and real-device Google Drive/parent-student cross-device test, not merely source inspection.

## 9. Stop rules
- No new UI features / styling iterations until P0 acceptance passes.
- No storing privileged secrets in frontend.
- No claim of successful cross-device test until independently verified.
- No loss of existing student attempts, typed answers, wrong-book or approved source links.

## 10. Official vendor references
- Auth: https://supabase.com/docs/guides/auth
- Anonymous student identity limits: https://supabase.com/docs/guides/auth/auth-anonymous
- Parent email OTP: https://supabase.com/docs/guides/auth/auth-email-passwordless
- RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Storage policies: https://supabase.com/docs/guides/storage/security/access-control
