# AURA STUDY — Source ingestion policy v1
Status: DESIGN ONLY; no production changes.
Decision: Raw documents first. Never require parent to manually fit Word/PDF/scans into a template before upload. AURA extracts, proposes structure, then renders a consistent output template after Admin approval. Optional standard template is for bulk authoring.

1. Original: keep unchanged Drive file and checksum, pages and figures.
2. Extraction: OCR/text, equations, tables, image references, source page/position, quality warnings.
3. Structured output: subject, topic, document type, period, questions, solutions, evidence and version.
4. Suggest classification with confidence; Admin final confirmation. Detect exact and near duplicates; don't auto-delete.
5. If a source has a solution, extract and verify question-answer alignment. If missing, AI may solve and mark AI_PROPOSED_UNVERIFIED.
6. No unverified AI solution or ambiguous scan is auto-graded or used for Weakness Map. Admin verification or audited deterministic rule required.
7. Display separately: normalized lessons, practice, exams, references/solutions. Preserve links to originals; preserve existing question version for old attempts.
8. Publish only when readable Student copy and registry entry exist; failed publish remains retryable.
9. Test: geometry scan without answer key; clean DOCX with answer key; duplicate file; low-quality mixed PDF; publish to separate Student device.
