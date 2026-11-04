# AURA STUDY — Vocabulary Cards V1 (English Grade 6)
Status: PROPOSED DESIGN — awaiting Parent/Admin approval; not deployed.
Date: 2026-11-04
Parent architecture: single learner, one Parent Admin, local-first cross-device sync.
Relates to [AURA English Four Skills V1](AURA_ENGLISH_FOUR_SKILLS_V1_PROPOSAL.md) and [Source Ingestion Policy](AURA_SOURCE_INGESTION_V1.md).

## Product decision proposal
Build a short daily **Vocabulary Cards** feature, integrated into the English skills engine. Do not treat successful card flips as certified English proficiency. Each word should eventually be heard, recognized, recalled and used in a contextual sentence.

## 1. Canonical card
- `vocab_sense_id` stable across all decks; `lemma`, `display_form`, `part_of_speech`, `meaning_vi`, `meaning_en_simple` optional, `IPA`, `accent`, `pronunciation_audio_ref` with source/license/version.
- `context_example_en`, verified `context_example_vi` optional, image or visual `media_ref` when unambiguous, common collocations, spelling variants, unit/subject/topic, school-textbook source/page/version, related listening/reading/writing tasks.
- Polysemous words require a per-sense identifier and context. Different meanings cannot be silently collapsed. Image-less abstract words are valid.
- Import approved vocabulary from source files/lesson text; AI can suggest words, definitions and examples but must keep `AI_PROPOSED` until validated; a wrong dictionary meaning or pronunciation is not published as trusted.
- Avoid duplicating the same word+sense across multiple units; link shared card to several decks, with deck-specific context.
- Flashcards themselves are not the authoritative answer key for graded tests unless verified.

## 2. Three-phase daily learning loop
1. **LEARN**: Show English term + pronunciation model + optional image. Flip reveals verified Vietnamese meaning, POS and one short natural example. Allow hearing model audio (real/authorized or correctly labeled synthesized voice). 5–8 new words/day is an initial tunable suggestion, not a fixed target.
2. **RECALL**: Hide meaning before revealing. English→Vietnamese; Vietnamese→English; optional audio→identify; spelling/input rather than MCQ-only. Let student rate `Nhớ được`/`Cần ôn`, but validate actual recall with micro-questions; don't infer mastery just from self-rating or multiple-choice recognition.
3. **USE**: Child says or types a contextual sentence using the target word. Feedback checks semantics, word form and grammatical fit. Speaking recognition may be uncertain and must not penalize a child for a bad microphone/accent; label provisional if needed.

## 3. Card view / interaction
- Front: English word or image/audio prompt (depending on study mode), accessible tap/keyboard to flip. Do not show meaning on front in recall mode.
- Back: Vietnamese meaning of current sense, IPA, part of speech, natural context example, common phrase/collocation if useful, and reference audio.
- Controls: `Lật thẻ`, `Nhớ được`, `Cần ôn`, `Từ tiếp theo`; in guided mode `Nghe phát âm`; show progress through small deck without time pressure.
- Optional mode switches: Visual/English→VI, VI→English, Hear→Recognize, Spell it, Use in sentence. Do not expose modes when required audio/image unavailable.
- After "Cần ôn", reschedule and offer a brief meaning/example again. Avoid frustrating indefinite repeats in one sitting.
- One deck per source-approved Unit/topic plus automatically generated "Từ cần ôn" list. Student never has to browse Drive folders to find words.

## 4. Adaptation and spaced review
- Persist per learner per word_sense: `introduced_at`, `next_review_at`, `review_interval`, `review_history`, `recognition_correct`, `recall_correct`, `spelling_correct`, `usage_evidence`, `source_version`.
- Suggested initial review points: next day, +3, +7, +14 days. These are starting values only. Algorithm adjusts from successes/failures and reverts harder words to shorter intervals; avoid overclaiming any universally optimal schedule.
- Count vocabulary as "Đang làm quen" → "Đang nhớ" → "Dùng được" only when delayed recall/production evidence supports it. No mastery just for looking at flipped cards.
- Daily review mix due cards, a few new cards, and 1–2 in-context use tasks. When review debt is high, reduce new cards.
- Review priorities: incorrect/missed, due soon, high relevance to current Unit, words frequently seen in learner mistakes. Distinguish provisional ASR judgement from verified recall.

## 5. Connection to four English skills
- Listening: hear audio word/sentence, choose or type word, identify contextual meaning.
- Speaking: repeat target word and produce a short natural sentence; judge intelligibility, not native accent.
- Reading: detect target words in approved passage and infer meaning from context.
- Writing: complete sentence or write short personal sentence, accept legitimate forms/word order.
- Other modules can schedule linked cards when the learner struggles with a verified vocabulary item; do not overdiagnose from one error.

## 6. Admin dashboard
For each Unit/topic: approved word count, introduced, due, recalled successfully after a delay, spelling/usage supported, needs review; dates and sample sizes. Show examples of the child's own sentences where available. Admin may approve/edit/retire a word or media item and configure daily new word count; never overwrite source or erase review history.
- No misleading "100% mastered" indicator based on tapping a flip card.

## 7. Source ingestion, privacy, offline, sync
- Source-first cards: import from textbook or approved document (source URL/Drive ref/version, page and answer evidence). Generated text/examples/audio labeled with provenance. Check IPA/pronunciation accent and licensing.
- Local-first cache of cards, licensed offline audio and review events; allow silent offline card study if audio cannot be cached. If audio missing, say so rather than fabricate playback.
- IndexedDB outbox uses UUID events; sync idempotently with cloud by event ID; review schedule authoritative on server and recalculated after sync without losing either device's history.
- Private child voice recordings only when speaking mode is explicitly used; no public audio or automatic sharing.

## 8. Initial UI layout
Student → Tiếng Anh → Vocabulary Cards. Today card: "X từ mới · Y từ đến hạn ôn · Z từ cần luyện dùng câu", based on real data. Main flip card with one term, example and audio. Post-card action buttons. Status when offline.
Use current Hybrid styling, soft cards, accessible large touch targets on mobile/iPad. Do not force images on abstract words, or gamification/leaderboard for one learner.

## 9. Priorities
P0: parent-approved card content, dual-sided cards, one short contextual example, user self-rating + verified recall, daily review queue, IndexedDB persistence and cross-device sync, basic dashboard.
P1: audio pronunciation, audio→meaning, reverse cards, spelling micro-tests, contextual sentence tasks, adaptive scheduling with history.
P2: child speech practice with safe audio handling; AI feedback for usage and pronunciation after reliability tests, not auto-certification.

## 10. Acceptance tests
- A source-approved Unit 1 word appears with correct meaning and contextual sense, no duplicate across Units.
- A word with two meanings displays correct contextual sense in each deck, does not merge senses.
- First flip reveals meaning; recall prompt hides it until attempt; self-rating does not directly mark mastered.
- Missed word comes back for review, and successful delayed recall changes review schedule.
- Offline study and review events survive refresh and sync exactly once between Student and Admin on separate devices.
- Admin sees due/learned/usage evidence with last sync, not fabricated proficiency.
- Missing audio is visible as unavailable, not an inert "play" button.
- Student cannot change approved definitions or review schedule by forging a role flag.
- Voice interaction (when implemented) avoids automatic failure for uncertain microphone/ASR.
- Review of a word never reveals graded-assessment answers before the exam is submitted.

## References
British Council, TeachingEnglish: https://www.teachingenglish.org.uk/professional-development/teachers/managing-resources/articles/using-flashcards-young-learners
British Council Vietnam, vocabulary learning: https://www.britishcouncil.vn/hoc-tieng-anh/tieng-anh-tre-em/kinh-nghiem/phuong-phap-giup-tre-hoc-tot-tu-vung
Ruitenburg et al. (2026), retrieval/distributed/interleaved classroom meta-analysis: https://link.springer.com/article/10.1007/s10648-026-10225-5
