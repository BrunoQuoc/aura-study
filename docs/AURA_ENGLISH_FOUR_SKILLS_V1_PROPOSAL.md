# AURA STUDY — TIẾNG ANH 6: FOUR-SKILL LEARNING DESIGN V1
Status: PROPOSED DESIGN / CHỜ PHỤ HUYNH DUYỆT — NOT DEPLOYED
Date: 2026-11-04
System: one learner / one Parent Admin / same or separate device / local-first reliable sync.
Integration: AURA_CONTENT_STANDARD_8_SUBJECTS_V1.md, AURA_SOURCE_INGESTION_V1.md, AURA_SINGLE_LEARNER_SYNC_V1.md.
Source scope: Grade 6 curriculum and parent-approved textbook sources; existing English Units 1–3 GK1 mapping is based on supported curriculum scope, NOT guessed labels. Do not claim a CEFR certification based on an uncalibrated app quiz.

## 1. Goal
Develop **Listening, Speaking, Reading and Writing** in meaningful contexts, building vocabulary, grammar, pronunciation and communicative functions across all four. Prioritize evidence of communication and progress, not sheer number of correct multiple-choice answers. Different tasks may require different skill balance, and each skill is assessed separately.

## 2. Instructional model: integrated topic loop
Pre-check 2–4 simple prompts to identify current vocabulary, grammar and comprehension needs. Every thematic learning unit is built from approved lesson/word/grammar/audio/text resources:
A. Context → short accessible situation and goal.
B. LISTEN → purposeful audio and comprehension task.
C. SPEAK → model + prompt, repeat briefly then answer independently.
D. READ → accessible passage, find meaning and evidence, vocabulary-in-context.
E. WRITE → learner creates 1–6 sentences or message suited to level.
F. REVIEW → error-targeted feedback + retrieval after delay.
Don't overload every 20-min session with full graded tests across four skills; distribute practice over the week, use varied tasks and revisit vocabulary across modes.
Example topic "My School": listen to two students talking; speak to describe favourite place; read a short school passage; type 4–6 personal sentences.

## 3. Four skill implementations
### 3A Listening
- Content: real or appropriately produced authorised audio of dialogue, instruction, announcement, descriptive passage; preserve audio source, speakers, transcript, language variant, exact clip timing, length and content version.
- Before listening: share topic and task purpose (not transcript/answers). During guided learning allow replay, slower playback and short segments. After answering: show targeted feedback, transcript and highlighted evidence **only in guided mode**.
- Assessment: question order and audio replay count configured in immutable exam snapshot, transcript not served before submission; auto-grade verified MCQ, matching, short fill, order events; if no licensed/usable audio or evidence, mark listening task unavailable instead of inventing audio or wrong grade.
- If synthesizing speech for original practice scripts, label clearly as synthesized/AI-generated; require parent-approved content and a stable audio version before graded listening use.

### 3B Speaking
- Modes: listen-repeat with clear model; prompt-answer; role-play conversation with short turns; image description; 20–60 second mini-talk based on level and task (illustrative lengths, adjustable).
- Browser mic capture with explicit permission, local preview/re-record, stable audio file version, secure/private upload, replay for child and parent. Interactive AI role-play is a later service-dependent feature; record-and-assess is initial P0 baseline.
- Criterion rubric: task completion and clarity of meaning, relevant vocab, grammatical adequacy, intelligible pronunciation, response fluency/turn taking if applicable; rubric weights by task. **Do not penalise native-language accent** if speech is understandable. No automatic personality/confidence judgments.
- Speech recognition/transcription uncertainty, noise, missing mic permission, unsupported language/audio or clipped recording → NEEDS_RETRY/NEEDS_PARENT_REVIEW, never automatic zero. A speech-to-text transcript is not perfect evidence of actual pronunciation. Provisional AI oral scores distinctly labeled and admin-reviewable.
- After graded submission: show 1–2 actionable pronunciation/phrasing suggestions with audio model when authorized, and allow new recording to practise again, not overwrite original.

### 3C Reading
- Content: source/rights verified short authentic/adapted passages, chats, notices, simple emails, schedules, school information, with linked image if essential.
- Skills: skimming gist, scanning details, inference consistent with age/level, contextual meaning, locating evidence, short summarization.
- Guided mode can highlight evidence after student answers; assessment hides all clues/answer keys until final release.
- Auto-grade verified objective responses; short explanations evaluated by rubric; don't reward pure keyword spotting without understanding when task expects reasoning.

### 3D Writing
- **Default for English writing/essay: TYPED DIRECTLY ON WEB**, unless parent later selects handwriting for specific assignments. This is a proposal, not a previously approved decision.
- Stages: vocabulary/sentence chunks → sentence building → rewriting with meaning preserved → short message/e-mail/paragraph → independent text and revision. Keep original learner wording; AI never silently writes or fixes answers in a graded submission.
- Typed textarea with autosave, simple formatting only when needed; task-based word count, prompt and allowed assistance shown. Timed exams can disable spellcheck/autocorrect where technically possible but cannot guarantee OS keyboard behaviour.
- Rubric: task relevance/meaning, structure/cohesion, vocabulary, grammar, spelling/punctuation; task-specific weights and examples. Accept different valid phrasing and paraphrases, not only exact sample text.
- After submission and grading: show annotated errors + explanatory feedback + suggested sentence/paragraph or outline. Allow a **second independent revision attempt**; keep original and revised versions separate.
- Short cloze or sentence reorder uses verified answer logic; open writing remains provisional AI grade unless verified by admin / robust rubric process.

## 4. Shared assessment policy
- Two modes: `LEARN_GUIDED` can provide graduated hints/feedback, transcript in post-practice learning; `PRACTICE_SUBMISSION` / `ASSESSMENT` MUST wait for **SUBMIT FULL ASSIGNMENT → GRADE → RELEASE RESULTS & MODEL/TRANSCRIPT**.
- Do not give per-question correctness, full examples, hidden answer key, transcript or score during assessed attempt, including via early frontend data transfer. Protect on server.
- A whole assignment with four skills releases feedback only when all required skill parts are submitted and allowed grading is complete; missing/unclear voice audio requires retry or parent review, never fake completed status.
- Distinguish objective verified grading from `AI_GRADED_PROVISIONAL` and `ADMIN_VERIFIED`; scores incomplete are `PENDING_REVIEW`, not 0. Weakness Map only uses verified evidence.
- For school materials without audio/source answer key: classify `NEEDS_SOURCE` and request original audio/key or Admin-approved newly-produced practice alternative. Never fabricate “official” source answers.
- Retrieval/flashcards for vocabulary can be optional as support, not replacement for listening/speaking/reading/writing; spaced review is adaptive, no one universally optimal timing.

## 5. Individual learner pathway
- Initial non-punitive diagnostic per skill using short listening audio, 1 short voice prompt, a short reading, a typed mini-writing task plus basic vocabulary and grammar; report evidence insufficiency as such.
- CEFR-inspired "can do" micro-outcomes by skill are descriptive guidance, NOT CEFR level certification. Match syllabus/book/semester using verified metadata, adjust difficulty by observed success and task independence.
- Skill-specific mastery: listening comprehension by task, speaking meaning/pronunciation/fluency, reading gist/detail/evidence, writing content/coherence/grammar/vocab. Store separate outcomes, uncertainties and hints; no deceptive combined English "ability" based only on MCQ.
- When a skill is weak, supplement with targeted minimal activities (e.g., 2-min listening for numbers and time, prompt to say 2 sentences, short reading of timetable, rewrite 2 sentences). Re-test with new form after delay.
- Example starting weekly cadence (flexible): Session 1 listening+speaking (20–25 min); Session 2 reading+writing (20–25); Session 3 integrated topic (20–30); Session 4 short review+assessment (15–25). Not all skills must be scored each day.
- Parent dashboard can show % tasks completed and verified criterion outcomes per skill with sample count and last assessed date, NOT uncalibrated CEFR ratings.

## 6. Language support layer
- `vocabulary_items`: lemma, POS, meaning, pronunciation model/audio source, spelling, example, topic/Unit, frequency/review, contextual usage.
- `grammar_patterns`: rule + use + contrasted example + error counterexample + ability to apply in listening/speaking/reading/writing.
- `pronunciation_targets`: words/phrases/rhythm/stress / intelligibility (not native accent imitation).
- `functional_language`: greeting, asking directions, requesting, giving opinions, describing routines, etc.
- Put vocabulary and grammar into meaningful communicative situations, with optional light recall drills.

## 7. Suggested metadata and event models
Each `english_task`: task_id, skill LISTENING|SPEAKING|READING|WRITING, subskill, topic, Unit/book, source_id, audio/media_id, transcript_access_policy, question_version, rubric_version, answer_state, difficulty, required_client_capability, mode, grading_type.
Each `english_attempt`: unique attempt_id, learner_id, device_id, task_id, submitted_at, server_ack, immutable response, grading_status, result_version, review_history.
Voice: private object key, audio SHA256, format/duration, mic permission state (no sensitive OS details), processing status, optional recognized_text and uncertainty. Audio source: rights flag, transcript provenance, playback version.
Track `listen_played`, `listening_response`, `speaking_recorded`, `reading_response`, `writing_draft`, `writing_submitted`, `feedback_released`, `revision_attempt`, `review_retrieval`; send idempotent UUID events via local outbox.
Admin can revoke media/device; retention policy configurable; child recordings, photos, text in authenticated private storage, no public direct URLs or secrets in Pages scripts.

## 8. Frontend
Student Subject Home:
- "Hôm nay học gì?" topic card and review due, not just four isolated tabs.
- Four skill entries with task status and targeted micro-practice.
- Practice mode shows feedback and optional retries. Exam mode shows snapshot, progress by skill, submit-all button.
- If audio cannot play/mic denied, show a technical retry action or alternative non-assessed task without marking zero; do not silently swap listening/speaking with text-only and claim equivalent score.
Admin:
- 4 separate skill dashboards with rubric, evidence sufficiency, last sync, sample answers/audio, reading proof, writing drafts and revisions.
- Error tags: listening sounds/numbers/details; speaking meaning/pronunciation/phrasing; reading gist/evidence; writing word order/tense/agreement/word choice/cohesion. Only based on observed evidence.
- Performance after feedback, especially independent retry, differentiated from first attempt.

## 9. Priority
P0: source-backed reading, listening with controlled audio/transcript, writing directly on web, basic recording/upload speaking with security, all-skills submission/after-grade reveal, role auth and sync, manual-admin review, 4-skill dashboard with evidence status.
P1: graded speaking with validated rubric and provisional AI feedback, targeted remedial tasks, written revision, spaced vocab/grammar review, adaptive diagnostics.
P2: interactive AI spoken role-play, deeper phonetic feedback and phonological progress ONLY after voice recordings/privacy and score validity are tested.
If resources cannot support reliable speaking/voice grading, offer recording + parent evaluation as safe P0 rather than pretend fully automated conversation/grading.

## 10. Acceptance criteria
1. Source verified audio plays on Safari iPad/Android/desktop and can be cached; no transcript or answer leaks pre-submission in assessment.
2. Student records a 30s speaking answer and saves it; mic denial or noise not marked zero; audio remains private and parent sees it on another device.
3. Reading questions track both objective accuracy and evidential short answer; no improper guessing on omitted figures.
4. Student writes an email text with autosave, offline survives refresh and sync returns only one final submission.
5. When an assessment includes all 4 skills, no hints, transcript, results, or model answer appears before the full assignment is submitted and grading permitted.
6. An insufficient speech recognizer confidence or unverified source key yields parent review instead of a fabricated official grade.
7. Exam results show four separate skills and sample sizes / verification state, not one misleading overall score.
8. Speaking feedback does not require native accent; assessment judges intelligibility and communicative purpose.
9. Parent reviews a submitted recording/text on second device and can validate/adjust with audit trail; private security checks pass.
10. No claimed CEFR certification from uncalibrated tests; Unit/term label grounded in source or parent confirmation.

## 11. References
- Council of Europe, CEFR descriptors: https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors
- British Council LearnEnglish Teens skill sections: https://learnenglishteens.britishcouncil.org/skills
- British Council young learner testing: https://www.teachingenglish.org.uk/professional-development/teachers/assessing-learning/young-learner-testing
- British Council listening for young learners: https://www.teachingenglish.org.uk/professional-development/teachers/knowing-subject/listening-young-learners
- British Council top tips speaking: https://www.teachingenglish.org.uk/comment/217632
- British Council writing and young learners: https://www.teachingenglish.org.uk/professional-development/teachers/knowing-subject/writing-and-young-learners

This is a **PROPOSAL** pending parent approval. DO NOT alter production or claim microphone, live speaking chatbot, autograding or cloud sync is already working.
