# AURA STUDY — MVP Family Learning Journey Acceptance

**QA scope:** current GitHub Pages Student/Admin direct pages, 2026-11-12.
**Release posture:** **DRAFT PR / NOT MERGED / NO DEPLOYMENT OR PRODUCTION APPROVAL.**
**Data safety:** all automated tests use in-memory synthetic localStorage and no network; never use real learner data for testing.

## 1. Grounded current architecture

- Student page: `student-direct.html`; Admin page: `admin-direct.html`.
- Static GitHub Pages frontend: no server-side identity or true remote learner-data synchronization. The Admin URL is **not authenticated**.
- Student loads the **local-first** `local_accounts_v3.js`, whose per-browser student profiles and salted PIN hashes live in localStorage. The local PIN is **not** Supabase Auth and not a security boundary against someone with the same browser/URL.
- Learning state, attempts, wrong-answer notebook, generated exams and relevant per-student profile records are stored locally. Moving browsers/devices or clearing site data can lose records if backup is absent.
- Admin's `backup.js` exports/restores matching `aura_`, `exam_`, `review_` localStorage keys. Exported JSON can contain student data and salted PIN hashes; treat it as private.

## 2. Source inspection findings

| Scenario / evidence | Current acceptance |
|---|---|
| Student direct page assets | **STATIC PASS**: 46 local asset references checked against repository tree; 0 missing |
| Admin direct page assets | **STATIC PASS**: 60 local asset references checked; 0 missing |
| Math exam draft, MC auto-grade, persistence, history | **SYNTHETIC VM SAMPLE PASS**: 5/10 on 2 eligible questions; missing-image question excluded; essay draft preserved |
| Wrong-answer notebook / retry | **STATIC WIRING CHECKED**: `learner_tools.js` defines recording and retry; `aura_pro_2026.js` dynamically loads `exam_timer.js`, whose grade wrapper calls the recorder. Browser integration is **PENDING** |
| Generated practice / weakness map | **CODE EXISTS**: `generator.js`, `smart_engine.js`, `exam_year_flow.js`, `multisubject_results.js`; actual browser journey **PENDING** |
| Multi-student local PIN flow, profile separation | **CODE EXISTS**: `local_accounts_v3.js`; two-account browser test **PENDING**. No server-side identity/authorization |
| Backup/restore | **OFFLINE TEST ADDED**: `tests/mvp-family-flow.test.mjs` simulates export/import of synthetic attempt, essay draft, wrong book and local profile; manual browser round-trip **PENDING** |
| Documentation alignment | README previously claimed no login; candidate PR explains optional per-browser Student PIN and unauthenticated Admin |
| Mobile/iPad experience | **MANUAL REAL-DEVICE TEST PENDING** (responsive screenshots and touch navigation not certified) |

### Source chain clarified

Do **not** treat lack of a literal `<script src="exam_timer.js">` in `student-direct.html` as proof the timer/wrong-book is broken. The file is loaded dynamically by `aura_pro_2026.js`. Its real execution and the resulting wrong-book entries still require browser testing.

`node --test tests/mvp-family-flow.test.mjs` checks synthetic code behavior. A passing Node test **does not** certify UI navigation, local PIN security, real cross-device synchronization, data backups on an iPad, or release readiness.

## 3. Required browser acceptance with isolated **synthetic** data

**Use a fresh browser profile or private window**, not a browser holding real study history. If testing the existing family profile is unavoidable, first export backup and verify its file can be read. Never share the backup in GitHub, chat or public folders.

| # | Operator action | Required observed result | Evidence |
|---:|---|---|---|
| 1 | Open `student-direct.html` with no local Student profile | Login/selection clearly communicates missing student or setup; no data loss | Screenshot, date/browser |
| 2 | Open `admin-direct.html`; create a *synthetic* student and PIN | Student appears locally; no Supabase account created | Screenshot, omit PIN |
| 3 | Open Student with synthetic student/PIN; also test incorrect PIN | Valid PIN works, wrong PIN rejected; not mistaken for server login | Screenshot, no PIN shown |
| 4 | Open a ready Math exam, answer only one eligible question wrongly; type synthetic essay | Draft survives navigation/reload; blocked image-less MC excluded | Timestamp + result screenshot |
| 5 | Submit exam exactly once | Correct score and eligible denominator; attempt saved once; wrong answers visible | Score + attempt count |
| 6 | Open **Kết quả → Sổ câu sai → Luyện lại** | Wrong item appears, retry records learning without inflating exam grade | Screenshot + summary |
| 7 | Generate a practice exercise in a supported subject and submit | Only sufficiently sourced questions graded; non-auto graded answers labeled | Screenshot + attempt count |
| 8 | Switch to a **second** local synthetic Student profile | First Student answers/score are isolated, return to first restores own state | Side-by-side anonymized counts |
| 9 | Admin exports backup; inspect JSON for expected key groups **locally** | Backup contains learning progress and profile data, no file shared publicly | File existence + hashes/counts (no content) |
| 10 | Restore backup in a **new isolated profile**, test an existing question draft and result | Data loads with expected history/answers and consistent student identity | Screenshot, no identifiers |
| 11 | Test offline/reload if applicable, plus narrow-screen mobile navigation | No duplicate submits, broken navigation or cache loop | Device/browser version + result |
| 12 | Re-run logout/return and final backup check | No unintended leakage between local students; no real data modified | Operator signoff |

**Manual functional acceptance is PENDING until real browser evidence for all required scenarios is reviewed.** The prior Supabase Phase 3F STAGING_PASS release gates are separate and are **not replaced** by this family UI checklist.

## 4. Highest priority risks / release decisions

1. **Admin access is unauthenticated.** Limit current usage to a trusted family context; do not onboard external users or claim protected Admin privileges.
2. **Local PIN is not robust account security.** Every same-origin visitor/extension with browser data access can potentially read or modify local records; do not present PIN as a production-grade identity layer.
3. **Backup is essential.** Deleted browser data or a new device will not inherit local data automatically. JSON backup may contain sensitive learner information; protect it.
4. **Notebook and weakness flow need observed browser integration**, not just available code paths.
5. **STAGING server-centric features remain separate and unapproved**: 11 production release gates OPEN, Auth log visibility inconclusive, incident SLA and live alerts not signed off.
6. Do not merge this test/documentation PR until CI checks and scope are reviewed; it does not itself fix live UX or authorize Production.

## 5. Gate definitions

- **FAMILY_MVP_SOURCE_QA**: PASS only after offline Node checks complete on a PR and referenced assets exist. This is not an operational release gate.
- **FAMILY_MVP_BROWSER_E2E**: PENDING until synthetic Student/Admin walkthrough, two local accounts, grading, notebook, backup/restore and mobile are exercised.
- **FAMILY_MVP_LIMITED_USE**: Can be considered for **trusted family-only pilot** after browser E2E and backup signoff, with known Admin/localStorage limitations accepted.
- **AURA_STUDY_PRODUCTION_GO**: **NO-GO** until the existing `release/phase3f-production-gates.json` reaches its independent 14/14 `PROD_PASS` and security/product signoffs. Never infer GO from a family MVP smoke test.

## 6. Work committed in the draft QA branch

- `tests/mvp-family-flow.test.mjs`: node:vm in-memory synthetic Math, drafts, score denominator, history, backup round-trip, source wiring and local asset existence.
- `.github/workflows/aura-mvp-family-smoke.yml`: Node 22 PR/manual offline checks; **does not contact Supabase or Google Drive**.
- `README.md`: describe real local PIN profile behavior and Admin authentication limitation.
- This acceptance sheet: operator steps and status ledger.

**Next operational work:** review CI run and execute isolated browser checklist. Do not declare the 12-step browser matrix PASS from source inspection alone.
