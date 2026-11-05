# AURA STUDY — Learning Content Sourcing Blueprint V1
Status: PROPOSAL — awaiting parent approval, not deployed. Date: 2026-11-05.
Scope: one Grade-6 learner, one parent Admin, 8 approved subjects; content should support reliable grading and individual study plans.

## Decision
Do not rely on bulk scraping eNetStudy or any publisher. Build a **verified Curriculum Map + Existing Approved Sources + Original AURA Learning Packs + Licensed External Resource Links + Learner Error-Derived Follow-ups**. Source rights and grading evidence are independent gates.

## 1. Priority sources
P0 Family/School: the learner's textbook series by subject, school weekly lesson names and assignment scope, teacher handouts/review outlines/returned tests, and already parent-owned original work. Only upload and transform material with appropriate authorization; private educational use does not justify public redistribution. School materials are schedule alignment evidence; any third-party content rights are separately assessed.
P1 Publisher reference: Hành trang số (NXBGD https://hanhtrangso.nxbgd.vn/sach-dien-tu/), Hoc10 (Cánh Diều https://www.hoc10.vn/hoc-lieu/), publisher-provided legitimate reading links. Prefer link + mapping, not copy/rehost without explicit permission.
P1 Free study on official sites: Khan Academy Vietnam for supplemental math https://vi.khanacademy.org/; British Council LearnEnglish Teens https://learnenglishteens.britishcouncil.org/skills for level-adjusted language, with copyright terms at https://www.britishcouncil.org/terms. Free access ≠ permission to republish. PhET for science/math https://phet.colorado.edu/vi/ with licensing conditions https://phet.colorado.edu/en/licensing (regular HTML sims CC BY-NC currently; verify each item, attribution and noncommercial boundaries).
P0 AURA-authored: Generate **new independent explanations, examples, practice variants and rubrics** grounded in approved learning goals and checked facts, not verbatim remixes of protected textbook question banks or paywalled resources. Deterministic objective answers can use independently validated math/verifier and Admin approval. Literature essays and others use approved rubric and provisional/review statuses.
P1 Errors: verified learner errors / slow recall define targeted new practice; student submissions are private evidence, not material for publication.

## 2. Official curriculum framework
Use MOET GDPT 2018, relevant adjustments and the corresponding subject programs as **scope/competency blueprint**, never as a substitute for a specific assigned textbook sequence. Verify reference text and current amendments. Official text: https://vbpl.moj.gov.vn/bogiaoducdaotao/Pages/vbpq-toanvan.aspx?ItemID=146721 ; note record shows partially superseded; refresh current amendments before indexing. Family confirms textbook series by subject and current unit, particularly English Global Success versus other series.

## 3. Subject acquisition targets
- Toán: existing source-backed bank + school exercises; Khan Academy link for explanation; create new concept checks, near/far transfer and verified multi-step solutions; photo-written word problems and geometry.
- Ngữ văn: textbook reading assignments and authorised excerpts/link + school's rubric; original new reading/grammar questions; handwriting photo submissions; no mandatory copy of proprietary literary passages, no fake quotations.
- English: approved school Unit and rights-cleared audio; British Council study links; original card senses/example sentences/4-skill prompts; Writing & Vocabulary spelling/use on paper/photo; speaking audio private. Never invent soundtrack to a publisher's listening exam.
- Lịch sử & Địa lí: school map/timeline requirements, government/museum education references with rights checking; new timelines/interpretation questions and sourced facts; typed essay.
- KHTN: school science lesson targets, open/appropriately licensed diagrams or PhET links; new science scenario and evidence-based observation, no unsafe unguided experiments; typed essay.
- Tin học: class practical skill and verified software-version instructions, safe original screenshots, short practice tasks, typed answer; collect evidence for actual skills.
- Công nghệ: school curricular topic and properly sourced device/procedure images, original process tasks/rubrics and safe practical activities; typed essay.
- GDCD: program targets and trusted civic/legal information (current versions verified), original school-level age-appropriate scenarios and multiple valid reasoned answers; typed essay.

## 4. Minimum viable Content Pack per current topic
- `topic_id`, subject, textbook mapping and source evidence.
- 1 concise lesson aligned to a verified expected outcome.
- 1 correctly verified worked example where appropriate.
- 5–10 varied short prompts (not a fixed volume quota), with source-backed/independently verified keys and alternative-valid-answer handling.
- 1 brief review assignment with release policy; essay rubric/question-wise photo or typed response per official subject standard.
- 1 misconception-to-remediation map and review schedule.
- 1 rights/attribution entry. All items versioned and labelled `READY / NEEDS_REVIEW / LINK_ONLY / WAITING_SOURCE`.

## 5. Practical intake workflow
1. Parent supplies **textbook series per subject, current chapter/unit, weekly school goals**; optionally school outlines or assignments. Avoid requiring full textbook scans.
2. Existing AURA `data.js`, `nguvan_bank.js`, `exam_metadata.js` and approved Drive INBOX are inventoried, with no destructive edits. Current registry reports: Toán GK1 ready, Ngữ văn partial, English Units 1–3 partial; KHTN, LSDL, GDCD, Tin học, Công nghệ awaiting sources; verify actual coverage before making claims.
3. Build Curriculum Map, flag missing resources, derive a weekly source gap list.
4. Parent uploads permitted originals into INBOX. AURA parses/proposes classification and versions; checks rights, QA, near-duplicates, answer status and source provenance.
5. AURA generates original independent learn/practice pack for missing topics; judge evidence and Admin review before scoring/publishing.
6. Publish only if Student on separate device can open content; external links remain links, with **manual completion status distinct from AURA-verified grades**.
7. Collect reliable error evidence; schedule next micropractice or spaced review. Weekly Admin summary lists source gaps and new approved packs.

## 6. Rights policy
Classes: `OWNED`, `LICENSED_IMPORT`, `OPEN_LICENSE_CONDITIONS`, `EXTERNAL_LINK_ONLY`, `RIGHTS_UNVERIFIED`.
- eNetStudy/HEID publisher, Hoc10, Hành trang số: generally external resource/reference unless an explicit external import license/permission is obtained.
- Khan Academy: free personal learning; some educational content has item-specific CC licenses, do not assume all can be copied. Official terms: https://www.khanacademy.org/about/docs/khan-academy-terms-of-service
- British Council: personal noncommercial use with credit, but republishing to another website prohibited without written permission: https://www.britishcouncil.org/terms
- PhET: check current CC BY-NC 4.0 licensing and attribution; different products/older copies may have different terms.
- Never use account cookies or guarded network calls to extract paywalled content. Never claim a source has an open API unless verified.

## 7. Pilot and acceptance
Pilot the **current school week's topics across 8 subjects**, not entire all-year corpus. A practical first pack is one current topic per subject plus extant ready materials; missing or invalid source shows `WAITING_SOURCE`, not fabricated coverage.
- Parent reviews mapping, source legitimacy and grading evidence.
- Student studies and submits under approved handwriting/typed/speaking rules; Admin sees evidence across devices.
- Verify exact source link, permissions, content version and no-answer-leak. Original question correctness is spot checked; every exam key verified or marked review.
- Do not claim automatic third-party progress sync without a documented authorized integration.
- Production remains frozen until accepted stability rollout.
