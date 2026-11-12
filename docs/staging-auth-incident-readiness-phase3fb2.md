# AURA STUDY — PHASE 3F-B2
## Monitoring Ownership, Alert Delivery & Incident Drill

**Review date:** 2026-11-06 (Asia/Ho_Chi_Minh).  
**Environment:** Supabase `aura-study-staging` + GitHub Pages.  
**Decision:** SOURCE/TICKET INTAKE IMPLEMENTED; OPERATOR TABLETOP PENDING; REAL NOTIFICATION & OWNER ACCEPTANCE PENDING. **PRODUCTION NO-GO.**

### 1. Read-only evidence and scope

The previous B1 mock browser test showed **4/4 PASS** (Admin OTP, anonymous signup, token refresh, CAPTCHA/429 differentiation), without Auth API calls or new users. This is not a real Auth threshold test.

Latest B2 read-only checkpoint at **2026-11-06 08:07:12 UTC**:
- Auth users: **6** (anonymous **5**).
- Active paired Student: **1**, Learning Events: **13**, Attempts: **0**, tagged test identity: **1**.
- Rolling 24-hour available log records: **352**.
- `captcha_failed`: **4**; Auth edge 429: **0**; Auth 5xx: **0**.
- B1 snapshot recorded **349** available rows. Differences in total log count are not sufficient evidence of Auth abuse or actual 429 threshold enforcement.

Source log query: `supabase/audits/aura_phase3fb1_auth_monitor_24h.sql`. Data inventory: `supabase/audits/aura_phase3fa_security_closure_readonly.sql`.

### 2. Ownership registry — NOT YET APPROVED

Machine-readable registry: `release/phase3fb2-monitoring-ownership.json`.

| Responsibility | Proposed scope | Assigned/accepted |
|---|---|---|
| Primary monitoring owner | Reviews aggregate Auth metrics, creates/triages incident, records decisions | **UNASSIGNED** |
| Independent backup/reviewer | Covers absence and verifies P0/P1 handling; cannot self-approve destructive actions | **UNASSIGNED** |
| Security approval authority | Approves emergency actions and release/exception evidence | **UNASSIGNED** |
| Ticket intake | GitHub Issue #12 tracker; sanitized incident template | **AVAILABLE** |
| Daily monitoring cadence | Example: 09:00 Vietnam time during STAGING acceptance | **PROPOSAL ONLY — NOT ACTIVE** |
| External email/push channel | Confirm reachable recipient and test delivery | **NOT CONFIGURED** |

Do not infer that the GitHub repository owner is on-call. Assignment requires explicit consent, a named responsible account/role, a backup and an agreed schedule. The system must fail closed for any `owner_accepted=false` production gate.

### 3. Incident priority and minimum response

Draft severity below has **not** been signed off by an incident owner.

| Trigger | Severity | Initial safe action |
|---|---|---|
| Unpaired learner/score exposure | **P0** | Stop STAGING tests, preserve sanitized evidence, escalate; **never disable RLS as workaround** |
| Test identity unexpectedly paired | **P1** | Pause pairing tests, verify authorized actions/dependencies, escalate |
| Auth 5xx / persistent login outage | **P1** (impact dependent) | Compare time window to baseline, check provider, escalate before any rollback |
| Sustained CAPTCHA rejects / 429 | **P2** initially | Compare threshold and rate-limit observations, investigate; no request floods |

Proposed response workflow: **Detect → Classify → Contain testing → Preserve privacy-safe evidence → Escalate to primary + backup → Authorize remediation → Verify recovery → Close with owner-approved retrospective**.

The incident ticket must include only the UTC window, source, severity, aggregate counts and a non-sensitive decision. Do not paste JWT, OTP, Turnstile secret, pairing code, user IDs, IP addresses, account emails or learner records. Do not perform bulk deletion, device revocation or changes to Supabase Auth and RLS without authorization.

### 4. Synthetic delivery: GitHub Issue inbox, not actual notification

**Ticket delivery to the GitHub Issues inbox: VERIFIED.** A fabricated P0/unpaired learner exposure scenario was written as [Issue #13](https://github.com/BrunoQuoc/aura-study/issues/13); subsequent GitHub issue search independently returned it. Its title clearly says `DRILL ONLY`, and content confirms **no real exposure**.

This only demonstrates that a **sanitized ticket was created and persisted on GitHub**. It is **NOT evidence** of an automatic Supabase alert, webhook, email/push receipt, human acknowledgement, or incident-response SLA.

The [sanitized issue template](https://github.com/BrunoQuoc/aura-study/blob/main/.github/ISSUE_TEMPLATE/aura-staging-incident.yml) provides a standard ticket format with required privacy and authorization acknowledgements. Treat repository visibility as potentially public; minimize metadata accordingly.

Official Supabase Log Drains support external alert pipelines but require Pro/Team/Enterprise and separate add-on charges. No paid log drain, third-party vendor, notification channel or credential was configured as part of B2.

### 5. Offline incident tabletop (browser)

Browser page: `auth/phase3fb2-incident-drill.html`  
Pure decision module: `auth/phase3fb2-incident-policy.js`  
Unit tests: `tests/phase3fb2-incident-drill.test.mjs`  
Manual-only workflow: `.github/workflows/aura-phase3fb2-incident-drill.yml`

Three fabricated scenarios:

1. **P0** — an unpaired Student would see a learner row.
2. **P1** — a tagged test identity receives unexpected device pairing.
3. **P1** — Auth server 5xx appears.

The offline policy proposes escalation and preserves evidence. It intentionally makes **zero Auth calls, database writes, session mutations, account deletions or outbound notifications**. This proves the logic of the draft tabletop only, not actual incident readiness. The operator screenshot confirms **3/3 PASS**. This verifies mock-only tabletop handling, not alert delivery.

### 6. Phase 3F-B2 acceptance

| Gate | Evidence | Status |
|---|---|---|
| Read-only STAGING baseline | SQL and Log Explorer aggregates | **PASS** |
| Severity / response playbook draft | Version-controlled policy and runbook | **IMPLEMENTED, OWNER REVIEW OPEN** |
| Safe tabletop source tests | Pure JS tests and static page | **IMPLEMENTED** |
| Tabletop browser run | Operator screenshot: 3/3 | **PASS — MOCK ONLY** |
| Sanitized incident issue intake | Issue #13 created and re-found | **PASS — TICKET INBOX ONLY** |
| Real email/push/automated alert delivery | A named recipient acknowledges receipt | **OPEN** |
| Primary/backup monitoring ownership | BrunoQuoc and Sonic-2015 self-authored ACKs verified | **PASS — STAGING DUTY ACCEPTANCE** |
| GitHub Inbox cross-account receipt drill | Two distinct senders and recipients; Issue #12 human ACKs | **PASS 2/2 — SELF-REPORTED RECEIPT ONLY** |
| Monitoring cadence / incident SLA | BrunoQuoc and Sonic-2015 full terms accepted; independent signoff and first check pending | **ROLE ACK PASS / OPERATION OPEN** |
| Real Supabase HTTP 429 / alert response | Bounded test and independent evidence | **OPEN** |

**Closure criteria:** After owner + backup accept, choose a supported alerting path; perform one no-sensitive-data notification delivery exercise with actual acknowledgement; record an approved tabletop decision; establish a monitoring cadence; and verify either approved manual-monitoring exception or actual automated alerting. Production remains NO-GO until every relevant release condition passes.

### 7. Account lifecycle cross-check

The one Phase3F-A anonymous test user remains under manual 30-day review ([Issue #11](https://github.com/BrunoQuoc/aura-study/issues/11)) due **2026-12-06 07:14 UTC (14:14 Vietnam time)**. It has no device/event links, but prior audits found one Auth session and refresh token. No deletion or session revocation authorized.

Other references: [Phase 3F-B tracker #12](https://github.com/BrunoQuoc/aura-study/issues/12), [Phase 3F release gates](https://github.com/BrunoQuoc/aura-study/blob/main/release/phase3f-production-gates.json), [Supabase Log Drains](https://supabase.com/docs/guides/observability/log-drains).


### 8. Operator browser tabletop acceptance

2026-11-06: Operator screenshot shows **3/3 PASS** for P0 unpaired-data exposure, P1 unexpected test-user pairing and P1 Auth 5xx in a static STAGING rehearsal. Each case reports zero Auth API calls, zero database writes and no automatic deletion. This is **mock-only** acceptance. The result also explicitly states **actual alert delivery not verified** and **monitoring owner unassigned**. No real incident, human notification acknowledgement, or on-call readiness is established. PRODUCTION NO-GO.


### 9. Ownership & receipt verification protocol

As of 2026-11-06, the connected GitHub account `BrunoQuoc` has been recorded as a **proposed Primary candidate only**, without appointment or acceptance. Backup remains UNASSIGNED. Owner/Backup self-authored acknowledgements and human receipt of a synthetic Issue #13 notification are pending. Candidate identity must never imply on-call duty. Source of truth: `release/phase3fb2-monitoring-ownership.json`. The safe, no-PII protocol and receipt evidence requirements are in `docs/staging-auth-ownership-alert-receipt-phase3fb2.md`. Offline guard is `scripts/phase3fb2-receipt-gate.mjs`. GitHub Issue #12 contains the operator participation instructions. No live Supabase alert, real 429 or production change is implied.


### 10. Independent Primary and Backup role acknowledgements — 2026-11-12

GitHub Issue #12 comment authors were independently verified: `BrunoQuoc` submitted [ACK PRIMARY](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6680960922) and `Sonic-2015` submitted [ACK BACKUP](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6812366506). Both selected GitHub Inbox, so STAGING duty acceptance is recorded as **PASS** for both roles.

Alert delivery remains unverified: neither account has provided a receipt acknowledgement from a new synthetic notification, and no live Supabase-to-GitHub alert integration has been established. The backup currently has repository read permission but is not an Issue #12 assignee. To test actual receipt, use an independent authorized sender for synthetic Issue #13 (not one of the intended receivers), then collect self-authored receipt comments, verify the actors, and record approved response cadence. **PRODUCTION NO-GO**.

### 11. Reciprocal recipient receipt drill — 2026-11-12

STAGING-only two-account GitHub mention drill is now **2/2 recipient self-ACK PASS**, source authors and recipient authors verified on GitHub Issue #13 and #12 respectively. Primary: `Sonic-2015` [trigger](https://github.com/BrunoQuoc/aura-study/issues/13#issuecomment-6812476673) -> `BrunoQuoc` [ACK RECEIPT PRIMARY](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6812558525). Backup: `BrunoQuoc` [trigger](https://github.com/BrunoQuoc/aura-study/issues/13#issuecomment-6812564741) -> `Sonic-2015` [ACK RECEIPT BACKUP](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6812578418).

No independent GitHub inbox delivery telemetry or provider timestamps available in retrieved issue comments; do not claim confirmed notification latency or a live Supabase alert. Human response is acknowledged; independent governance reviewer sign-off, monitoring schedule/SLA and actual alert pipeline are not approved. PRODUCTION remains NO-GO.


### 12. Draft monitoring cadence and response targets — 2026-11-12

**DRAFT, NOT APPROVED:** Proposed manual STAGING review daily at 09:00 Asia/Ho_Chi_Minh, Primary BrunoQuoc, Backup Sonic-2015, sanitized evidence by 09:30, Backup handoff at 09:15 if missing. P0 proposed ACK target 15 min from human detection, P1 60 min, P2 4h; these are not 24/7 promises.

Runbook: [`docs/staging-auth-monitoring-cadence-sla-phase3fb2.md`](https://github.com/BrunoQuoc/aura-study/blob/main/docs/staging-auth-monitoring-cadence-sla-phase3fb2.md). Policy: `release/phase3fb2-monitoring-cadence-sla.json`. Required next evidence: distinct approval comments from Primary and Backup, approved coverage/response windows and independent reviewer signoff, at least one real read-only daily check, and missed-check tabletop handoff. Neither scheduled monitoring nor alerts were activated. Alerting & Incident Response production gate remains OPEN; production NO-GO.


### 13. Short-form cadence intent verified — 2026-11-12

Both role-specific short-form cadence comments are present on Issue #12: [BrunoQuoc](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6813565895) and [Sonic-2015](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6813579412). Authors independently checked. Since neither comment specifies 09:00 weekend coverage, P0/P1/P2 targets or Backup takeover, these are **in-principle approvals only**, not completed operational SLA consent. Full terms, independent policy sign-off, first real manual read-only check and handoff rehearsal remain OPEN; live Supabase alerts off and PRODUCTION NO-GO.


### 14. Full monitoring cadence consent verified — 2026-11-12

GitHub Issue #12 shows both users **edited their existing comments** into full STAGING-only manual monitoring and SLA-target acceptance. Exact source comments: [BrunoQuoc Primary](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6813565895) and [Sonic-2015 Backup](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6813579412). Confirmed 09:00 VN daily incl. weekends, Backup handoff from 09:15, review evidence by 09:30, P0/P1/P2 human ACK targets 15/60/240 minutes after actual detection during coverage, no 24/7 guarantee and no automation. **Role-level agreement PASS**, but no executed daily monitoring, no independent final governance signoff and no live Supabase alert integration. Release remains NO-GO.


### 15. Backup handoff tabletop 3/3 — 2026-11-12

All three self-authored GitHub Issue #12 comments were observed in correct order: [Primary scenario](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6814391249), [Backup takeover](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6814400852), [Primary review](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6814413737). Backup explicitly acknowledged the aggregate snapshot and missing Auth/edge log coverage. This is **PASS — STAGING TABLETOP ONLY**. Real 09:00 attendance, real response-time measurement, independent operational signoff and live Supabase alert pipeline remain unverified; PRODUCTION NO-GO.
