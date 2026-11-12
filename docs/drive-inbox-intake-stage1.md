# AURA STUDY — Google Drive INBOX discovery | Stage 1

**Status:** read-only source discovery; not a source import daemon; not automatic Question Bank publishing.

## Current ground truth

Owner's AURA STUDY - DATA / 00_INBOX contains nested subject directories. On 2026-11-12, the connected Google Drive inventory found **10 original DOCX files** within these 6 subdirectories:

- Toán: 5 GK1 test papers + 1 practice sheet
- Ngữ văn: 2 knowledge files + 1 practice sheet
- Tiếng Anh: 1 Global Success Units 1–3 practice file explicitly labeled **without answers**

These are original files, not ten published banks. The existing static \`aura_data/processed_sources.json\` records five blocked math exams with missing embedded figures, three truncated literature documents, one missing-answer English source, and one represented math review. It is an **old source registry snapshot**, not evidence that new Drive files have been imported.

## Architecture boundary

The tool \`scripts/drive-inbox-discovery.mjs\` is deliberately **read-only**. With an authorized, short-lived Drive access token in an environment variable, it:

1. Verifies the explicit root folder has the exact name \`00_INBOX\`.
2. Walks nested directories breadth-first and Drive API v3 pagination; bounds folder count, file count, pages, and depth.
3. Collects metadata only (\`id\`, \`name\`, \`mimeType\`, \`size\`, \`modifiedTime\`, \`md5Checksum\`).
4. Guesses subject/type/period from **folder and filename as review hints**, never authoritative school-period assignments.
5. Joins against existing \`aura_data/processed_sources.json\` for blocked/represented/new/changed review status. A changed source is never silently accepted.
6. Outputs summary *counts only*. An optional private inventory can be saved under \`.aura_private/\`, which is gitignored. It contains private file IDs/names, so must **not** be uploaded to GitHub, screenshots, public logs, or external sharing.
8. Never downloads document bytes, moves or deletes a file, changes Drive sharing, or modifies AURA Question Bank.

Supported read permission: a valid OAuth token with **metadata read** access to the relevant tree (for example, \`drive.metadata.readonly\` with explicit authorized owner consent). A \`drive.file\` token from the existing browser uploader does **not** guarantee access to files manually uploaded through Drive. Do not escalate a browser OAuth token without owner consent. Do not put tokens in the web page, repository, GitHub Actions variables, CI logs, command arguments or git commits.

**No production OAuth credential or scan schedule has been installed.** The existing Google Drive connector used in the conversation is not a token for the deployed GitHub Pages application.

## Local trial when authorization is ready

From the repository root, in a trusted non-shared terminal, provide a **short-lived** read-only access token and the exact root folder ID via secure environment setup:

    node scripts/drive-inbox-discovery.mjs --help

    # Once the authorized environment variables have been set privately:
    node scripts/drive-inbox-discovery.mjs
    node scripts/drive-inbox-discovery.mjs --write-private

Output: only counts on stdout. The optional inventory file is \`.aura_private/drive-inbox-inventory.json\`, not a public artifact. Rotate/revoke the token as required. If Google returns 401/403, stop and resolve authorization; never call it a complete scan.

Offline QA (safe, synthetic):

    node --test tests/drive-inbox-discovery.test.mjs

## Stage 2 — planned, not yet implemented

1. **Credential/consent:** owner-approved, revocable integration with least-privilege read scope. Server-side credential handling and operational safeguards, no broad token in GitHub Pages.
2. **Scheduled job:** idempotent read-only scan using a secure runtime; source-ID + modifiedTime and checksum dedup, pagination and alerting. OAuth token refresh, frequency, ownership and SLA must be explicit before enabling.
3. **Complete extraction:** authorized download of the original document, preserve figures/media and question-answer associations. DOCX/PDF/Google Docs/scan parsers must verify original length, page and image counts. Partial extraction => BLOCKED.
4. **Review queue:** evidence, confidence, mismatch/missing-answer checks; Admin approves or rejects structured questions. Keep file original and source provenance; never guess missing answers, images, or grade periods.
5. **Versioned Question Bank:** only validated items move to bank with schema, provenance, version/audit, rollback and CI. Do not infer availability across the 8 subjects from source count.

This is distinct from Supabase production gates, which remain NO-GO.
