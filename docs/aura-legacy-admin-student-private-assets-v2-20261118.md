# AURA STUDY — Admin → Student private file copies V2 (staging)

Date: 2026-11-18 (Asia/Ho_Chi_Minh)  
Scope: extend original **admin-direct.html** and **student-direct.html**. Existing menus, UI styling, lessons, exam engine, results and local study data remain unchanged.

## Why V2

V1 synced approved Drive metadata across paired devices, but students could still see `You need access` when opening a private Drive link. V2 adds an optional, server-hosted **private file copy** that the paired Student can open without Drive sharing.

## Architecture

- Original Admin UI: `admin-direct.html`, existing `admin_legacy_cloud_sync.js` plus new `admin_legacy_asset_sync.js`.
- Original Student UI: `student-direct.html`, existing `student_legacy_cloud_sync.js` plus new `student_legacy_asset_sync.js`.
- Original V1 metadata publishing endpoint: `aura-legacy-content-sync-v1`.
- V2 private asset gateway: `aura-legacy-content-asset-v2` (Supabase Edge, JWT required).
- Supabase private Storage bucket: `aura-legacy-approved-v2` (no public reads, maximum 6 MiB per object).
- Database migration: `supabase/migrations/20261118041949_aura_legacy_private_assets_v2_20261118.sql`. Applied on staging as migration `20261118041949`.

Allowed files: PDF, DOC, DOCX, PNG, JPG and TXT. Google Docs, Sheets or Slides may be exported to PDF **only when the Admin's existing Google OAuth session permits reading**. Otherwise Admin chooses a local copy manually; no file is silently shared through Google Drive.

## Operator flow (two different devices)

1. Admin opens **INBOX**, reviews and approves the document as before.
2. Admin visits **Thư viện** > **Xuất bản tài liệu cho Student**, signs in to the secure cloud Admin account via `aura-admin.html` if needed, and chooses **Xuất bản**.
3. If a valid Google Drive access token is already available on that Admin page, the app attempts to copy the file privately to AURA automatically. Otherwise choose **Lưu tệp lên AURA**, select the exact approved file, and confirm the copy (max 6 MiB).
4. Admin must see **Đã có tệp trên AURA** next to the published item.
5. On the separate Student device, the Student must have activated a unique paired-device link once via `aura-student.html`.
6. Student opens the **original** Student interface, then **Bài học** or **Ôn thi** > **Tài liệu mới từ Admin** > **Làm mới** > **Mở bản AURA**.
7. Admin may click **Thu hồi**; the Student list no longer returns that item after refresh. A previously issued signed download URL can remain usable **up to three minutes**, and already downloaded local copies cannot be revoked retroactively.

The old **Mở Drive** link remains as a fallback, and retains Google's original sharing requirements.

## Security and lifecycle

- Cloud Admin authorization requires a verified email and active ADMIN role, not just access to the unprotected legacy Admin URL.
- Student access requires an anonymous Auth session with active paired Student role and an unrevoked device in the same household.
- Only published V1 metadata can obtain a V2 upload ticket. A committed file is verified against actual Storage object MIME and size.
- Direct public / anon / authenticated execution rights are revoked for the private attach/read RPCs. Edge service-role calls verify the caller's identity.
- The signed upload URL expires after approximately two hours; signed download URL expires after 180 seconds. **Never cache signed URLs**.
- Publishing a new version or withdrawing content invalidates the current server-side file association. Old Storage objects require a separate administrator-controlled retention/cleanup procedure.
- Staging document type `exam` is for reference/test practice only. Official Exam Engine, grading, released scores, teacher sign-off and answer key publication remain OFF.
- Do not upload copyrighted or third-party material without permission to store a copy in private AURA Storage.

## Evidence and release criteria

- GitHub Actions `AURA STUDY - Private Admin Student Sync QA`: **10/10 mocked JS/server-source regression tests passed** on 2026-11-18. These cover original UI script hooks, upload confirmation, bad file rejection, picker cancellation, paired/unpaired Student access, off-origin URL rejection and security definitions.
- Supabase staging migration applied; Edge function deployed and active with JWT verification; private bucket public=false; service-only SQL RPC execution verified.
- After automated QA, **zero real resource metadata, zero publish events and zero Storage objects** observed. This is expected; no real Admin content was uploaded during technical tests.
- **E2E on physical Admin and Student devices NOT VERIFIED**. Needs one approved real file, positive Student open, negative after withdrawal, off-household/abandoned device checks, and actual Drive-to-private-copy confirmation.
- Until those checks pass, status remains **STAGING IMPLEMENTED / HUMAN CROSS-DEVICE ACCEPTANCE PENDING**. The feature does not enable official grades or exams.
