# AURA STUDY — STEP 1: Baseline Audit & Source Freeze
Status: EXECUTED PARTIALLY / SOURCE SNAPSHOT DONE / BROWSER DATA EXPORT PENDING
Audit date: 2026-11-05. Repository: BrunoQuoc/aura-study. This document is intentionally safe for a PUBLIC repo: no child PII, auth tokens, local backup contents or private Drive file IDs.

## A. Source-control checkpoint (COMPLETED)
- Production branch: `main`
- Verified production baseline SHA: `61a57f1ecaa2742438fa2e725bc22c5b3d7f582e` (verified with compare main...main)
- Pre-rebuild backup ref: `backup/pre-rebuild-2026-11-05`, created from **exact** baseline SHA.
- Isolated code branch: `rebuild/stability-v1-20261105`, created from **exact** baseline SHA.
- Architecture/design ADRs remain on `design/single-learner-sync-v1`. They are NOT applied to main or automatically deployed.
- Backup branch must be treated as read-only. SHA is the actual immutable recoverable reference. Recheck `main` SHA and baseline right before migration.
- Not yet created: independent hosted staging URL, backend/staging database, automated tests.

## B. Direct source inventory (READ-ONLY; MAIN)
Entry pages: `index.html` redirect, `student-direct.html` (~29 scripts), `admin-direct.html` (~40 scripts). Both are static GitHub Pages documents.
Verified named files in root include:
- Core: `app.js`, `data.js`, `generator.js`, `smart_engine.js`, `exam_metadata.js`, `nguvan_bank.js`, `english_bank.js`, `english_extra.js`.
- Account/login: `local_accounts_v3.js`, `local_accounts_loader.js`, `student_login_direct_fix.js`.
- Student library: `approved_library_student.js`.
- Admin/Drive: `admin_library_publish.js`, `admin_inbox.js`, `admin_inbox_autoroute.js`, `admin_inbox_queue_v2.js`, `aura_google_drive_config.js`, `aura_drive_auth_core.js`, `admin_drive_auth_bridge.js`, `admin_drive_auth_unified_patch.js`.
- Backup/report: `backup.js`, `admin_report_reset.js`, `weekly_report.js`, `sync_status.js`.
All files listed above were individually fetched/read; this is a **targeted module audit**, not a complete recursive file-tree manifest. No live-device end-to-end tests were performed.

## C. Critical architectural findings
1. `local_accounts_v3.js` stores `aura_local_students_v1`, `aura_student_session_v1`, `aura_student_profile_v1:<id>` in browser localStorage. PIN salt/hash is browser-side, not server authorization. The Student app monkey-patches `Storage.prototype` and preserves learning keys per student profile.
2. `student_login_direct_fix.js` and `local_accounts_loader.js` are additional login/lifecycle wrappers. Do **NOT** add more patches or delete any before migrating backed-up learner data.
3. `backup.js` saves `localStorage` entries whose key begins `aura_`, `exam_`, `review_`. It does NOT capture other browsers/devices, IndexedDB or arbitrary nonmatching keys. Its export contains *possibly sensitive* user data and salted PIN hash; treat as secret. Never put an exported JSON into a public GitHub branch, public Google Drive folder, chat or issue. Keep an offline private copy.
4. The login/account states and academic progress cannot reliably synchronize across devices with localStorage alone.
5. `README.md` still describes "no accounts" while production HTML loads local account v3. **Docs diverge from runtime**. Use fetched code over README for migration assumptions.
6. The existing direct Admin entry is not protected by verified backend authorization. Before any Student-private cloud data is exposed, implement server Auth + RLS.
7. `aura_drive_auth_core.js` holds Google access tokens in memory (not localStorage), but backup content remains confidential for student info and local hashed PIN.
8. `sync_status.js` provides UI status only; no verified authoritative cross-device data synchronization has been demonstrated.
9. Connected Supabase project listing returned **0 accessible projects** at audit time. This does not prove no project exists in another account; staging backend is a blocker to later steps.

## D. Google Drive read-only inventory
Connected Drive has `AURA STUDY - DATA` with four direct folders:
- `00_INBOX`
- `01_LOP_6`
- `90_LUU_TRU`
- `99_AURA_SYSTEM`

`01_LOP_6` has all eight subject folders: TOAN, NGUVAN, TIENG_ANH, KHTN, LSDL, GDCD, TINHOC, CONGNGHE. Each subject folder has six resource subfolders (lesson/exercise/exam/key/reference/review). This establishes the folder tree, NOT complete content or licence coverage.

`99_AURA_SYSTEM` has `ANSWER_BANK`, `QUESTION_BANK`, `EXAM_PACKAGES`, `BACKUP`. At audit time **BACKUP direct children = 0**. `QUESTION_BANK` and `EXAM_PACKAGES` also had 0 direct children; nested folders may contain data elsewhere. `ANSWER_BANK` has eight subject folders; contents not comprehensively enumerated.

`00_INBOX` has three subject subfolders plus rejected folder. At least one image remained inside Math INBOX; rejected folder also had a file. No source was moved, copied, deleted, approved or published during Step 1.

Drive read-only audit was **not a full backup or a recursive integrity check**. The original Drive files are untouched; a separate policy for licensed/original source export and backup is needed before any migration touches them. Do not publish private Drive IDs in public repository docs.

## E. Required local-browser backup (PENDING USER DEVICE ACTION)
The connector cannot read browser localStorage. On **each browser profile/device that actually contains study progress**:
1. Open the current **Admin** entry ON THAT SAME DEVICE AND BROWSER PROFILE (not a different laptop); click **Sao lưu**.
2. Verify a file named `AURA_STUDY_BACKUP_V2_4_2.json` (or later version) exists locally and is nonempty. Do not click `Khôi phục` yet.
3. Keep it offline in a trusted private location, labelled by device/date; do not upload publicly or paste it into chat. It may contain learning history, child accounts and PIN hashes.
4. Preserve the original browser profile and do not clear storage, reinstall app, switch origins or reset reports before the import has been tested.
5. Use a local-only backup validator or inspect counts without exposing data; the next migration step must dry-run the payload, choose exactly ONE canonical learner ID, import idempotently and compare record counts.
6. If the same data exists in several devices, preserve each device's export separately; never overwrite one with another until dedup/diff is complete.
7. Backup procedure in source only captures selected localStorage key prefixes; before production migration, compare against the live runtime's full key inventory and any IndexedDB data.
**Critical:** A code branch backup does not protect local browser history.

## F. Go/no-go gates
Step 1 technical source snapshot: PASS.
Google Drive folder discovery: PARTIAL PASS; not content-level backup.
Local learner history backup: PENDING per-device export.
Staging domain/DB and security: NOT STARTED.
Go/no-go for later destructive migration: **NO-GO until per-device backup verified, rollback tested and staging Auth+Sync ready**.

## G. Reference
Approved standards on `design/single-learner-sync-v1`:
`docs/AURA_OFFICIAL_8_SUBJECT_STANDARDS_V1_APPROVED.md`
`docs/AURA_SINGLE_LEARNER_SYNC_V1.md`
`docs/ADR_CURRICULUM_001_KNTT6_SOURCE_AFTER_SYSTEM_READY.md`

Next work on `rebuild/stability-v1-20261105`: freeze/backup requirements, staging environment, back-end schema/RLS, browser data dry-run importer and end-to-end tests, with main untouched until verified.
