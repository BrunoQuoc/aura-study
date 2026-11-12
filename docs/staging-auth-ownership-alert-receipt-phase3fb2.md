# AURA STUDY — Phase 3F-B2: Ownership & Alert Receipt

**Environment:** STAGING ONLY. **Date:** 2026-11-06. **Production:** NO-GO.
**Status:** ownership candidate nominated; neither owner nor backup has accepted; actual recipient delivery and human acknowledgement are NOT VERIFIED.

## 1. Identity and authorization boundary

- The connected GitHub login returned `BrunoQuoc`. It is a **proposed Primary candidate only**. Repository ownership/account connection does **not** constitute an accepted on-call duty.
- `release/phase3fb2-monitoring-ownership.json` keeps `primary_owner_github=null`, `backup_reviewer_github=null`, `owner_acceptance=false` and `backup_acceptance=false` until explicit approval and two separate acknowledgements.
- Backup must be a **different human/account**. A single GitHub user cannot approve and independently review the same incident.
- Never paste real email addresses, passwords, Auth/refresh tokens, magic links, JWTs, OTP, pairing codes, IP addresses, user IDs, or learner information into a GitHub issue.

## 2. Ownership proposal and explicit acceptance

Tracking ticket: [GitHub Issue #12](https://github.com/BrunoQuoc/aura-study/issues/12).

1. Operator confirms the proposed Primary `@BrunoQuoc` or supplies a different GitHub username, plus a distinct Backup Reviewer username. This **does not immediately assign** any role without user approval.
2. Verify that each account has access to the incident ticket and can subscribe/comment. If they are eligible assignees, a repository writer may assign the issue; assignment alone does not count as acceptance.
3. Each human signs in with their **own GitHub account** and independently comments on Issue #12:

   - Primary: `ACK PRIMARY — STAGING monitoring duty accepted; I can view Issues #12 and #13; preferred notification channel: GitHub Inbox/email/push; availability window: [hours in Asia/Ho_Chi_Minh].`
   - Backup: `ACK BACKUP — STAGING independent review accepted; I can view Issues #12 and #13; preferred notification channel: GitHub Inbox/email/push; availability window: [hours in Asia/Ho_Chi_Minh].`

4. Reviewer uses GitHub issue API to confirm **comment author matches the nominated account**, comments are distinct, and the issue is in the approved STAGING repository. A screenshot or assistant-authored comment is not a substitute.
5. Owner and Backup agree on review cadence, response windows, alternative contact if unavailable, and who is authorized to approve containment or cleanup. Default daily 09:00 Vietnam time is **proposal only**, not active.

## 3. GitHub notification receipt test (no Supabase traffic)

1. Each participant checks [GitHub notification settings](https://github.com/settings/notifications) and selects the delivery method they personally want. They may subscribe/watch the repository or Issue #13. Notification routing depends on their preferences; a GitHub Issue is not a real-time paging service.
2. After both participants have acknowledged ownership, an authorized third person posts a **clearly labeled DRILL ONLY / NO REAL INCIDENT** comment on [synthetic Issue #13](https://github.com/BrunoQuoc/aura-study/issues/13), with an approved @mention of the intended recipients. The commenter should not be used as their own recipient for the receipt test; self-authored activity may not produce a useful notification.
3. The notification contains **only**: test label, issue URL, timestamp, expected acknowledgement. Do not include personal data, raw Auth logs or secrets.
4. Primary and Backup each independently confirm the notification arrived through their selected channel (GitHub Inbox, email, or push) and comment on Issue #12 using their own accounts:

   - `ACK RECEIPT PRIMARY — DRILL ONLY; channel: [Inbox/email/push]; observed UTC time: [time]; source: Issue #13; no real incident.`
   - `ACK RECEIPT BACKUP — DRILL ONLY; channel: [Inbox/email/push]; observed UTC time: [time]; source: Issue #13; no real incident.`

5. A reviewer cross-checks the GitHub comment authors and timestamps. Store only the comment permalinks, delivery channel and a sanitized timestamp in the evidence registry. Avoid storing email screenshots, recipient addresses, identifiers or notification payloads.
6. **PASS — human notification receipt** requires two distinct approved accounts, authenticated self-acceptance, both receipt acknowledgements, and verified comment permalinks. Neither issue creation nor @mention alone qualifies.

**Important:** Even full PASS for this GitHub notification exercise proves only GitHub delivery under tested settings. It does **not** prove live Supabase event-to-GitHub alert delivery. The automated monitoring pipeline remains OPEN until built and tested, or an explicit time-bounded manual-monitoring exception is signed off.

## 4. Incident severity and escalation acceptance

| Scenario | Draft level | Proposed safe response | Gate |
|---|---|---|---|
| Unpaired learner row visible | P0 | Stop tests, preserve aggregated evidence and escalate | Owner/reviewer sign-off PENDING |
| Test account unexpectedly paired | P1 | Freeze pairing tests; read-only dependency audit | Owner/reviewer sign-off PENDING |
| Auth 5xx | P1 initially | Compare Auth logs and provider status; authorize rollback separately | Owner/reviewer sign-off PENDING |
| Excessive CAPTCHA failure / 429 | P2 initially | Compare baseline and rates; do not flood endpoint | Threshold and route PENDING |

After receipt confirmation, conduct a separate controlled escalation tabletop with a time-stamped acknowledgement. Do not automatically revoke legitimate Student sessions, bulk delete anonymous users, disable RLS, or alter production.

## 5. Evidence and decision status

| Condition | Current state |
|---|---|
| Static incident tabletop browser | **PASS 3/3** |
| Sanitized incident ticket persisted | **PASS** — Issue #13 |
| Connected Primary candidate | **PROPOSED** — `BrunoQuoc`, NOT accepted |
| Primary & Backup appointments | **OPEN** |
| Owner and Backup GitHub self-acknowledgements | **OPEN** |
| Recipient notification acknowledgement | **OPEN** |
| Approved cadence and response SLAs | **OPEN** |
| Live Supabase alerts / 429 threshold enforcement | **OPEN** |
| Production release | **NO-GO** |

Associated registry: `release/phase3fb2-monitoring-ownership.json`. Main tracker: [Issue #12](https://github.com/BrunoQuoc/aura-study/issues/12). Detailed B2 evidence: `docs/staging-auth-incident-readiness-phase3fb2.md`.

References: [GitHub issue assignment](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/assigning-issues-and-pull-requests-to-other-github-users) · [GitHub notification settings](https://docs.github.com/en/subscriptions-and-notifications/get-started/configuring-notifications).

---

### Verified role self-acknowledgements — 2026-11-12

- Primary `BrunoQuoc`: self-authored [ACK PRIMARY](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6680960922); selected GitHub Inbox.
- Backup `Sonic-2015`: self-authored [ACK BACKUP](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6812366506); selected GitHub Inbox.
- Both distinct role acknowledgements now **PASS**. Backup has repository `read` access, but is **not** a GitHub issue assignee; this does not invalidate the user's independent ACK.
- Notification receipt **PENDING** for both. Do NOT mistake role ACK, assignment, @mention or ticket creation for notification proof.
- A safe alert-delivery test needs an independent authorized sender to post `DRILL ONLY` with both approved @mentions on synthetic [Issue #13](https://github.com/BrunoQuoc/aura-study/issues/13). Using the Primary's own GitHub account as sender would not establish notification delivery to that same account.
- Each participant must confirm the received notification on Issue #12 from their own account, specifying the chosen channel and UTC receipt time. Reviewer verifies comment author and links before updating receipt evidence.
- The owner-approved monitoring cadence, actual Supabase alert pipeline, escalation and real 429 thresholds remain OPEN. **PRODUCTION NO-GO**.
