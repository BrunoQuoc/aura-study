# AURA STUDY — Local-first Multi-user Checkpoint

Date: 2026-10-29
Status: ACTIVE IMPLEMENTATION BASELINE

## Core rule
AURA remains local-first on one browser/device.

Shared data:
- Approved learning library (`aura_library_index_v1`)
- Drive/INBOX configuration and routing metadata
- Admin source/metadata decisions

Per-student data:
- Attempts and scores
- Wrong-answer book
- Smart stats / recent question state
- Exam drafts and generated exams
- Review answers/progress
- Lesson progress and last subject
- Report reset cutoff

## Student accounts
Admin can create one local user per student.
Each student has:
- display name
- username
- PIN hash + salt
- active/locked status
- isolated local learning profile

This is device-local access separation, not server authentication.

## Login behavior
Student page requires a valid local student session.
Student UI contains learning, practice, exams and results only.
Existing pre-user learning data is migrated once into the first student who successfully logs in, so legacy progress is not silently lost.

## Approved document pipeline
Device upload → `00_INBOX` → AURA classification/quality/duplicate checks → Admin confirms → Drive auto-route → APPROVED decision → shared library index → Student library.

Both Admin publisher and Student reader include recovery from APPROVED decision history so a temporary publish-hook failure does not permanently hide an approved document.

## Routing rule
Because OAuth uses `drive.file`, subject folders are authorized/mapped once per subject. After mapping, future approved documents for that subject are routed automatically. If an accessible matching type subfolder exists, AURA routes deeper; otherwise it safely uses the mapped subject folder while preserving subject/type/period metadata for the Student library.

## Multi-user reset
When local student users exist, learning reset must be performed per student profile. Legacy device-wide report reset must not be used as the authoritative multi-user reset.

## Limitations
- Accounts/progress do not sync across devices.
- Local PIN is not equivalent to server-side security.
- Admin remains on a separate Admin URL; true Admin authentication is a future milestone.
- Cloud Sync must preserve this shared-library + per-student-profile split.
