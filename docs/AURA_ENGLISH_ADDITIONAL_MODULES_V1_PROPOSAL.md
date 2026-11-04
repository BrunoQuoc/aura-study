# AURA STUDY — English Additional Learning Modules V1
Status: PROPOSED ONLY — pending parent approval, not production
Date: 2026-11-04
Context: one Grade 6 learner, one Admin, shared or separate devices, local-first reliable sync.
Supersedes nothing. Complements docs/AURA_ENGLISH_FOUR_SKILLS_V1_PROPOSAL.md and docs/AURA_VOCABULARY_CARDS_V1_PROPOSAL.md.

## Purpose
Complete the four-skills design with specific learning mechanisms that lead to actual communicative ability and school exam success, without fragmenting the app into many parallel learning products. No gamification, automatic CEFR certification, or unreliable AI scoring.

## 1. Grammar Builder (P0)
Student should recognize grammar in a meaningful sentence, infer/review concise rule, reconstruct a changed sentence and produce an independent example.
Task ladder: notice a pattern (e.g. She goes to school) → contrast (I go / She goes) → reorder sentence → rewrite by subject/time → create own context sentence.
Keep question source, accepted variants, curriculum Unit, expected concept, verified key and explain-back; support alternate grammatical constructions when valid. Error coach tracks pattern only with enough evidence. Guided learning reveals hints, assessments reveal keys only after full submission and grading.

## 2. Pronunciation Lab (P1)
Listen to authentic/licensed or labeled synthesized reference → record voice → replay → choose one specific sound/stress/intonation goal → retry as a new take, with history.
Assess intelligibility, word and sentence stress, final sounds when reliably observable; do not require native-like accent. Microphone denied/noise/ASR uncertainty must not produce a zero. AI feedback remains provisional with parent review if necessary. Voice stored privately with auth and retention controls, never public GitHub assets.

## 3. Listen & Write (P0/P1)
Short, level-appropriate audio from verified source. Student listens and types exactly or near-exactly according to task contract. In guided practice, allow configurable replay; in formal assessment, replay limit enforced server side / assessment policy. After final submission, report missed content words, spelling and punctuation separately; don't infer overall listening ability from dictated text alone. If source audio missing, mark unavailable and don't synthesize a supposedly original textbook audio.

## 4. English Missions (P1)
One age-appropriate scenario integrates four skills and previously approved vocab/grammar. e.g. My School: listen to dialogue, read notice, describe school orally, write a short text. Missions use approved source content or clearly labeled AI-created materials and only require 2–4 short activities, not four full tests per session.
Each mission records outcomes by skill, not a single uncalibrated "English proficiency" score. Conversation role-play generated live is a P2 extension dependent on safe AI service and speech reliability.

## 5. English Error Coach (P0)
Source of evidence: verified Reading/Grammar/Listening answers, Writing revision with rubric, Speaking recordings where quality supports assessment. Classify demonstrated mistakes into grammar agreement/word order, spelling/word choice, gist/detail, speech clarity/pronunciation. Do not assume student "careless", "lazy", or bad at speaking due to transcription errors.
Feedback: quote the relevant learner portion, explain one key correction without rewriting the whole answer, ask child to self-correct, then check a new example. Record independent retry separately from accuracy after seeing solution. Use the history to create due-review vocabulary or pattern exercises, and report recurrence and resolution to Admin.

## 6. One English subject, two learning paths
- School Practice: approved Unit/term scope, vocabulary, grammar, reading, listening, writing/rewrite and exam generator. Never assume Unit label or calendar period from file name alone.
- Real English: pronunciation, role-play-like missions, everyday speaking and listening for function. Shared underlying word senses, grammar patterns, skills, source and review data.
- Keep 4-skill navigation and daily recommended activities, not 7+ homepage tabs. Parent can prioritize exam preparation without deleting Real English progress.

## 7. UX / daily recommendation
Student Home recommends at most one short new concept/activity, one due review, and optionally one mini-mission. Example: 3 grammar pattern prompts + 5 vocabulary cards + 1 speaking/reading task, adjusted from data.
Practice mode allows hints and corrections at appropriate points; formal graded assignment mode locks keys/transcript/model answers and feedback until **submit whole assignment → grade/verify → release**.
Admin dashboard: by four skill outcomes, vocabulary recall/usage, grammar patterns mastered/under review, sound issues only from reliable audio, repeated mistakes corrected, assignment completion and last-sync with grade confidence. Compare verified evidence, not inflated score of card flipping.

## 8. Priority and dependencies
P0: integrate Grammar Builder, Error Coach and a basic text-audio dictation activity with approved lesson sources, preserve answer/version, full-submission rules, local-first sync and admin review.
P1: Pronunciation Lab (record/playback/private storage, cautious feedback), integrated missions and personalized review.
P2: live AI Speaking Partner, automatic detailed pronunciation grading and adaptive mission creation only after tests of privacy, audio quality and reliability.
Prototypes can illustrate an interaction but are NOT proof the service works.

## 9. Acceptance criteria
1. A source-verified present-simple pattern yields at least 3 contrastive/reconstruction/independent tasks; valid alternate answers not falsely rejected.
2. Key, hints and model answers cannot be fetched early from the Student client during an assessed attempt.
3. Dictation uses real approved audio; missing audio does not silently fall back to text and claim listening grade.
4. Speaking recording on iPad/Android/PC with mic-denial or noise shows retry/pending, never forced 0.
5. Error Coach cites actual response evidence, offers self-correction, then tests new item; metrics distinguish helped vs independent success.
6. One mission links the same verified vocabulary/grammar to at least two skills, avoiding duplicate card definitions.
7. Offline text answers and review events survive restart and sync once; audio uploads reconcile without loss.
8. Admin on another device sees reliable skill trend and pending review, not fabricated automatic proficiency.
9. AI-generated examples are labeled, reviewed before use in graded exams; all source material licensed or parent provided for private educational use.
10. Parent-approved migration and rollback plan before deployment.

## Supporting educational sources
- British Council: Teaching children grammar in context https://www.britishcouncil.vn/en/blog/teach-kids-english-home
- British Council LearnEnglish Teens skills https://learnenglishteens.britishcouncil.org/skills
- British Council, feedback and self-correction https://www.teachingenglish.org.uk/professional-development/teachers/teaching-knowledge-database/d-h/feedback
- Education Endowment Foundation, Metacognition and Self-Regulated Learning (2025) https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/metacognition
