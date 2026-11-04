# AURA STUDY — Toán 6: Learning & Practice Engine V1
Status: PROPOSED DESIGN · NOT YET APPROVED BY PARENT · NOT DEPLOYED
Date: 2026-11-04
Context: one Grade-6 learner, one Parent/Admin, shared or separate devices, local-first reliable sync.
References: EEF "Improving Mathematics in Key Stages 2 and 3" (https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/maths-ks-2-3), IES/WWC "Organizing Instruction and Study" (https://ies.ed.gov/ncee/wwc/PracticeGuide/1), WWC mathematics intervention grades K–6 (https://ies.ed.gov/ncee/wwc/PracticeGuide/26).

## 1. Goal
The child understands WHY a method works, solves independently, retains concepts after delay, transfers across problem forms, and corrects the underlying causes of errors. Do not optimize for speed or number of attempted problems at the cost of accurate understanding; never equate one test score to long-term mastery.

## 2. Core teaching loop: 6 stages
1. **Diagnose (2–4 brief items):** prerequisite concepts, vocabulary, arithmetic, previous mistakes, confidence only if child elects to answer; diagnostic is not punitive.
2. **Explain concretely and visually:** use number lines, quantities, fraction areas, geometric constructions, tables/charts, contexts appropriate to subject. Connect to mathematical symbols and definitions explicitly; fade visual aids after understanding.
3. **Worked example:** short, correct, source-verified, step-by-step, explaining the reason for each transition, units/conditions, possible misconception. Then a second partially completed example.
4. **Guided then independent practice:** similar item -> near transfer -> changed-context item. Fade hints rather than present full answer immediately.
5. **Error analysis and self-correction:** confirm error with evidence; offer targeted prompt -> first step -> partial working -> full worked solution only when needed. Ask child to correct or explain, then verify with a new variant. Never confidently invent why a child erred.
6. **Delayed review:** retrieval quizzes at planned intervals, interleaving after initial familiarity. Example starting schedule next day / 3 / 7 / 14 days is a tunable default, not an empirically universal optimum. Adjust to success, delay and response time.

## 3. One short adaptive session
Candidate 25–30 min (tune by actual child response, not a rigid target):
- 3 min retrieval of earlier material
- 5–7 min concept using diagrams and reasoned explanation
- 5 min worked example and a faded example
- 8–10 min independent practice, at most 3–5 targeted items
- 4 min error correction and teach-back ("Vì sao cách này đúng?")
- 2 min goal of next practice / review
If a student shows persistent confusion, stop new questions and reteach prerequisite; if mastered, increase transfer difficulty and reduce repetition.

## 4. Three mastery signals and release gate
- Conceptual understanding: explain meaning, identify counterexamples, select strategy, connect visual to symbols.
- Procedural fluency: correct and reasonably efficient steps, correct notation and units.
- Transfer and retention: solve a changed-form problem and answer correctly after a delay without seeing solution.
Proposed (not validated) heuristic: 2 correct independent items on two distinct variants, an explanation, and one later retrieval to label "tạm vững". **No fixed percent threshold claims mastery automatically.** Need a calibrated question pool and evidence sufficient for each learner skill. Record insufficient evidence explicitly.

## 5. Problem format and hint policy
- Question object: `question_id`, `topic_id`, `skill_id`, `prerequisite_skill_ids`, `concept_target`, `question_type`, `difficulty`, `source_ref`, `diagram_asset`, `answer_key`, `verifier`, `steps_or_rubric`, `verified_status`, `content_version`.
- Same item may have multiple Student response paths: numeric/formula entry, multiple choice where useful, drawn-on-paper handwritten photo for multi-step/geometry proof, and optional voice explain-back.
- Staged hint ladder: (H1) recall concept/definition, (H2) choose strategy, (H3) show first step, (H4) reveal partial working, (H5) full worked explanation after genuine attempt or request. Record hints separately; correctness after full hint does not count as independent mastery.
- For visually complex questions, never derive facts from a not-to-scale diagram; require text data and a verified diagram.
- Question/solution generated from AI must be labeled "AI_PROPOSED_UNVERIFIED" and cannot enter graded exams/Weakness Map until verified by approved key or rule.

## 6. Error classification (evidence-based)
- CONCEPT: mistaken definition/relationship/prerequisite.
- PROCEDURE: correct concept, incorrect operation/algorithm/ordering.
- REPRESENTATION: diagram/notation/units misread or represented wrongly.
- PROBLEM_READING: missed a condition or selected wrong goal, grounded in response.
- COMPUTATION: isolated arithmetic slip with otherwise sound method.
- REASONING: unsupported inference/incomplete justification.
- UNCERTAIN: insufficient work/image data; never assume "careless" or "lazy".
For each confirmed error, store `observed_step`, `expected_step`, `evidence_ref`, `error_label`, `confidence`, `remediation_skill`; only use verified graded evidence in official Weakness Map.

## 7. Grade 6 content structure
- Số và Đại số: operations, integers, divisibility, fractions and other grade-scope source-confirmed units.
- Hình học và Đo lường: properties, constructions, perimeter/area and geometric explanations as supported by approved source. Diagram and units always retained.
- Thống kê và Xác suất: tables, charts, observations, simple probability as supported by approved source.
- Every approved lesson maps to `strand > topic > skill > prerequisite`, plus book/curriculum metadata when sourced/confirmed. Do not infer SGK/term solely from file name.

## 8. Student UI
Home: "Hôm nay học gì?" displays 1 current topic + 1 review due + optional short check-in. Progress visualizes skill states without showing speculative numbers.
Learning screen: Big concept, one manipulable/clear diagram, clear worked example, one question at a time, stepwise hints, self-explain input.
Practice: easy->near transfer->changed-form; breaks and no punitive timer in first conceptual phase; speed drills optional only after accurate method is learned.
Math written work: child may solve on paper and attach photos to exact question; show crop, multi-page, page order, image quality. OCR is candidate text, original photo remains the evidence. Auto-grade only with reliable parsing+verifiable method; otherwise Parent review. Never award zero due to OCR failure.

## 9. Parent Admin dashboard
Display per topic/skill:
- Last independent performance and delayed-review performance, number of graded questions and evidence sufficiency.
- Error taxonomy with examples and actual student steps/evidence (not personality/effort judgments).
- Hint dependence, follow-up correction, mastery retention; separate "first attempt without hint" from "correct after hint".
- Suggested next action: reteach a prerequisite, solve 2 near-transfer items, do delayed review, or test a changed-form problem.
- Written-photo answer and parent/manual review history.
- Weekly report: newly understood skills, retained skills, weak prerequisites, pending ungraded answers, source coverage gaps.
No single global "Math ability" score without a defined and validated model; distinguish verified vs provisional/insufficient data.

## 10. Study cadence and progression
Suggest initial schedule 3–5 short sessions/week plus spaced micro-reviews; adjust based on schoolwork, fatigue and learner's results.
New idea first with similar items to establish method; mix problem types only once basic understanding exists. Avoid pure blocked repetition and avoid random mixing too early.
Diagnostic for missing prerequisites drives explanations; no "fast track" by skipping important foundations.
Optional recall cards for facts/definitions; avoid substituting flashcards for mathematical reasoning.

## 11. Integration with source standards & sync
- Follow `docs/AURA_CONTENT_STANDARD_8_SUBJECTS_V1.md` and `docs/AURA_SOURCE_INGESTION_V1.md`.
- Every lesson/example/answer references validated source or transparently labeled AI proposal.
- AURA local-first events: `lesson_viewed`, `diagnostic_attempt`, `practice_attempt`, `hint_used`, `self_explanation`, `correction_submitted`, `review_attempt`, `parent_review`; immutable UUID, learner, device, question version, server acknowledgement. Must dedup across devices.
- Student cannot edit approved key, grades, source rights, or sync receipts; parent can review with an audit trail.

## 12. Acceptance tests / P0-P2
P0:
1) A source-backed Grade 6 topic has a verified lesson + worked example + 3 valid variants.
2) Diagnostic finds missing prerequisite and sends student to a simpler explanation; only then next skill.
3) Correct after hint is not counted as first-try independent mastery.
4) An incorrect solution receives a relevant concept/step hint; child corrects and answers new variant.
5) Answer and review event offline sync exactly once to Admin on a second device; no data loss.
6) Unverified question or unclear geometry image never generates an official score.
7) Photo-written geometry/free-response remains pending parent review if OCR/verifier uncertain.
P1: adaptive delayed review, per-skill Error Analysis/Weakness Map, Admin recommendations, variant and interleaving policy, snapshot exams.
P2: sophisticated visuals/manipulatives, optional voice explain-back, advanced diagnostic tuning after P0 validation.

**No production code change without parent confirmation, backed-up legacy data, real-device E2E and rollback plan.**
