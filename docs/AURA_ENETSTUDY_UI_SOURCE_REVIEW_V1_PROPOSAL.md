# AURA STUDY — eNetStudy UI & Licensed Content Integration Review V1
Status: PROPOSAL / PENDING PARENT APPROVAL — NOT DEPLOYED
Date: 2026-11-05
Context: one Grade-6 learner + parent Admin; local-first sync; approved 8-subject standards.

## Review basis
- Parent-provided screenshot of the eNetStudy student homepage (2026-11-05), without using the depicted student's identity.
- Parent-supplied deep link to a copyrighted-learning-material page under hocsinh.qlms.vn; external browsing could not retrieve the page's protected content.
- Public vendor docs:
  - https://docs.enetstudy.vn/hoc-sinh.html
  - https://docs.enetstudy.vn/giao-vien-hoc-lieu-so.html
- Public student portal redirects to login. **No login, paid content access, programmatic download or proof of an official content export API was established.**

## I. CONTENT SOURCING — permission-first
1. Categories:
   - OWNED_ORIGINAL: parent-created or otherwise fully authorised material; import original PDF/DOCX/PPTX/XLSX/images, hash, extract, normalize and grade with verified answers.
   - LICENSED_IMPORT: content explicitly licensed for external copies/derivatives/import; retain provenance, permitted uses, expiry and attribution, import only within grant scope.
   - LICENSED_LINK_ONLY: paid/third-party material accessible solely on source site; store URL, source/publisher, course/book/Unit mapping and optional user-entered completion; open externally under user's own valid access.
   - PUBLIC_OPEN_LICENSE: eligible open educational resource with conditions and attribution followed.
   - UNVERIFIED_RIGHTS: quarantine/metadata-only until verified; no bulk extraction, redistribution or training use assumed.
2. A paid subscription or logged-in webpage alone does NOT grant redistribution or copying into a separate platform; obtain written licence, official export permission, authorised API, or use external link instead.
3. No authentication-bypass, stream ripping, cookie/session replay, bulk scraping behind access controls, or copyright-protection circumvention. No uploading vendor credentials or student access tokens into a public GitHub repo.
4. If the vendor offers an official API/export/SCORM/LTI integration that permits the intended use, evaluate its documented exact scope. Vendor docs describing *importing* SCORM and content into eNetStudy do not prove it *exports* third-party publisher content.
5. Embedding in AURA is **not guaranteed**: use only if technically iframe-allowed and contract/licence permits. Default to opening a permitted official page in new tab, with no claim of in-app tracking without an authorised integration.
6. Provenance registry metadata: `provider`, `origin_url`, `origin_asset_id` (only if authorised), `license_status`, `license_type`, `allowed_uses`, `expires_at`, `source_ref`, `checksum_if_imported`, `link_verified_at`, `content_availability`, `last_reviewed_at`. Do not store third-party original without licence.
7. AURA generated *original* explanations/questions may follow a topic standard, but should not recreate publisher's protected expression/images/audio/question-bank by extracting inaccessible pages.
8. Do not auto-claim independent progress/grade after external link visit; if no API, show manual `Đã học nguồn ngoài` check-in separate from verified assessment evidence.

## II. UI features to learn from, not clone
Screenshot visibly contains top navigation, left rail, week calendar, publishers' Grade-6 material cards with cover images and counts, a right-rail journey summary (time, points, ranking), and an AI helper chat.
Principles to adapt:
- Clearly prioritised Home and navigation.
- A week-plan strip with 5–7 days and task statuses, but **AURA's parent-approved learning plan**, not unsupported automatic school timetable.
- Cards for each of eight subjects with real `new`, `due`, `in progress`, `completed` metadata; no borrowed brand covers/illustrations without rights.
- Right-rail personal progress: `Hôm nay học gì?`, subject progress, due assignments, skill weaknesses, graded vs ungraded, last sync; NOT class ranking or school point leaderboard.
- Context-specific AI tutor for guided learning only; assessment mode never reveals keys/solves before complete submission and grading.
- Parent Admin panel separate from Student. Never display Admin actions in Student by simply hiding CSS; enforce server authorization.
- Keep AURA's approved Hybrid gradient, Student Home "Hôm nay mình học gì?", rounded light cards. Do not copy layout pixel-by-pixel, proprietary branding, icons or external copyrighted cover artwork.

UI to omit:
- Promotional banner and vendor advertising.
- Teacher/class/school administration, class rank 28/51, merit-point economy; only one learner.
- Large publisher carousel for multiple textbooks the child does not use.
- Unnecessary sidebar expansion and commercial plan widgets.

## III. Proposed AURA Student Home desktop layout
Header: AURA STUDY | Hôm nay mình học gì? | offline/sync status | Student access.
Sidebar (max 6 entries): Trang chủ / Học theo môn / Bài cần làm / Luyện tập & Kiểm tra / Thư viện / Tiến độ.
Main: 
A. Today's focus: one new lesson, one overdue review, one next assessment as applicable.
B. Week study plan: weekdays with parent-set activities, real due dates, `not_started/in_progress/submitted/pending_grade/done` statuses.
C. Subject grid (eight only), each shows current topic, approved resources, last verified progress.
D. Library resources: tabs LESSON/PRACTICE/ASSESSMENT/WORKED_EXAMPLE/FORMULA_NOTE/REFERENCE, linked answers and solutions hidden until grade.
Right column: last sync, recent earned/retained skills, pending paper-photo grading, today's mini-goals, one relevant guided tutor prompt.
Mobile/iPad: collapse sidebar, today/week first, subject cards below, progress drawer; big touch targets; no desktop-only three-column squeeze.

## IV. Admin Home
- One Student profile only.
- At-a-glance status: latest sync time/device, recent study sessions, due reviews, pending attempts/photo-written work, submitted ungraded text/voice.
- Per-subject Weakness Map by verified evidence and sample size, no invented global ability percentage.
- Assignments planner, approved library inbox/status, source licence state, publish errors with retries.
- Parent review queue for unverified grade/OCR/ASR plus clear decision logs.

## V. Data model
- `external_resources(id,provider,origin_url,title,subject,topic,doc_type,access_model,license_status,allowed_uses,verified_at)`
- `parent_resource_links(resource_id,learner_id,assigned_at,due_at,manual_completed_at)`
- `learning_plan_items(id,learner_id,subject,topic,resource_id,activity_mode,due_at,status,created_by)`
- Internal `learning_assets` only for licensed or owned imported content; external link events must never masquerade as exam attempts.
- Sync outbox events: `plan_item_opened` and `manual_external_complete` are distinct from `verified_attempt`, which requires AURA-owned score evidence.

## VI. Acceptance tests
1. Screenshot-inspired layout remains readable mobile/iPad and preserves current Hybrid design.
2. Home shows one learner, 8 subjects, no classroom rankings or school-specific controls.
3. Week plan displays assigned and completed status, not arbitrary timetable.
4. Admin assignment becomes visible on Student device after sync; offline completion reconciles idempotently.
5. External eNetStudy deep link opens only under permitted rights, no contents secretly copied.
6. No claim of scoring/tracking external content without official integration; manual done is marked as manual.
7. Licensed imported PDF, where authorised, retains attribution, original, provenance, extraction warnings and verified grading gate.
8. Student sees no answers before full submission + grading; AI helper honours learning vs assessment modes.
9. Private parent/student data and credentials cannot be accessed via URL guessing or frontend flags.
10. No production change until parent approval, backup, staging, live-device E2E, security audit and rollback.

## VII. Suggested implementation order
P0: preserve AURA Hybrid and implement reliable auth/sync/content provenance + status and role control.
P1: Student Home week-plan + subject cards + parent assignments + progress card.
P1: external learning resources as outbound links with licence and provenance labels.
P2: optional authorised content-provider integration via official vendor API/contract; no assumption an API exists.
No implementation in this document.
