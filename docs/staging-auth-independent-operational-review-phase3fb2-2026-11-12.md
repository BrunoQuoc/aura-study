# AURA STUDY — Phase 3F-B2 Independent Operational Review Packet

**STAGING ONLY** • Prepared: **2026-11-12** • **REVIEW REQUEST / HOLD**, not operational approval.

## 1. Decision and scope

The operator has explicitly requested to **skip the first scheduled 09:00 manual-monitoring acceptance step** and proceed to the next governance task. This is a **DEFERRED / NOT ACCEPTED** test, **not a PASS and not a waiver** of monitoring attendance, telemetry, or live-alert requirements. The previously proposed 2026-11-13 09:00 trial is no longer being pursued **as the first mandatory acceptance checkpoint in this workflow**. This does not cancel or modify the manually agreed recurring monitoring responsibilities.

This packet enables independent review of the evidence already captured, identification of open risks, and a human **HOLD** or conditional recommendation; it does **not** authorize setting `approval.approved=true`, `first_real_manual_check_completed=true`, or `production_release_approved=true`.

## 2. Evidence that can be independently reviewed now

| Evidence | Source | Scope / status |
|---|---|---|
| Primary + Backup duty acceptance | [Issue #12](https://github.com/BrunoQuoc/aura-study/issues/12) self-authored ACKs | PASS role acceptance |
| Reciprocal GitHub Inbox synthetic receipt | [Issue #12](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6812558525) and [Backup](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6812578418) | 2/2 recipient self-report; **not a Supabase alert** |
| Full manual cadence / targets | [Primary](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6813565895) and [Backup](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6813579412) | 09:00 VN, weekends, 09:15 takeover, 09:30 evidence; P0/P1/P2 ACK 15m/60m/4h after actual detection during agreed coverage |
| Read-only aggregate snapshot | [12 Nov summary](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6815347992) | 6 Auth users, 5 anonymous, 1 active paired device, 13 Learning Events, 0 Attempts; **counts only**, no 09:00 attendance |
| Logs Explorer operator screenshots | [12 Nov source coverage summary](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6815264719) | 5 edge_logs, **no auth_logs observed** in sampled rolling 24h; 0 observed error counters in narrow sample does not show Auth healthy |
| Independent snapshot-review self-ACKs | [Primary](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6814311117) and [Backup](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6814290472) | Human short-form acknowledgements only; **no independent execution** |
| Missed-review handoff rehearsal | [Primary scenario](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6814391249) → [Backup takeover](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6814400852) → [Primary review](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6814413737) | **3/3 PASS TABLETOP ONLY**, no actual service latency or on-time shift |

## 3. Non-waivable readiness blockers

1. **Actual scheduled 09:00 manual check remains UNVERIFIED**. Operator elected to skip this acceptance step; no replacement source of evidence, exception approval, or measurement has been provided.
2. **Auth event telemetry remains INCOMPLETE**: operator's source list had edge_logs but no auth_logs. Cannot infer whether no Auth activity occurred or whether ingestion/retention/configuration needs examination.
3. **No real Supabase-to-notification alert path was established**. GitHub @mention drill does not substitute.
4. **No measured P0/P1/P2 on-call response times**, no independently confirmed operational availability; once-daily manual review cannot be represented as 24/7.
5. **No independent operational governance decision**, approved effective date, or review due date.
6. **Real server-side 429 and other production release gates** remain open.

## 4. Reviewer authorization and safe decision

Independent reviewer must be a separately authenticated and **authorized** person distinct from the Primary. Backup `Sonic-2015` can contribute a separate technical evaluation, but nomination or prior Backup acknowledgment does **not** automatically grant governance signoff authority.

Before any signoff, reviewer checks the evidence links and issues a **specific, truthful** finding; no assistant may self-endorse a human's approval.

**Suggested GitHub Issue #12 reviewer comment (only after personally reviewing):**

```text
INDEPENDENT REVIEW — Phase 3F-B2 STAGING — HOLD
Reviewer GitHub account: [my own username]
Scope reviewed: role ACK, cadence/response-target ACK, 2026-11-12 read-only snapshots, 3/3 tabletop handoff.
Findings: evidence supports STAGING mock/role governance only; first actual scheduled 09:00 manual review was skipped and remains unverified; auth_logs absent in observed rolling 24h sources; no Supabase-triggered alert or 24/7 SLA verified.
Decision: HOLD operational readiness / NO PRODUCTION approval.
Required follow-up: actual monitored shift OR separately authorized documented exception, Auth log coverage assessment, and live alert channel or explicitly approved expiring manual-monitoring exception.
```

If reviewer disagrees, they must edit the findings and evidence appropriately. A HOLD acknowledgment must **not** set `independent_reviewer_approved=true`; that flag represents a later separate operational approval only.

## 5. Next possible work that does not depend on the skipped shift

- **Read-only Auth log coverage investigation**: verify service log types, filters, time-window/retention, availability and traffic expectations without generating Auth test traffic or revealing sensitive logs.
- **Review gap closure plan**: propose independently reviewed alternative acceptance or a time-bound manual-monitoring exception. This is a proposal, not an approval.
- **Monitoring integration design**: design a safe alert pipeline with explicit approval before enabling any webhooks or credentials.

**Governance status:** review packet prepared; independent human HOLD/review pending. All release gates remain as previously recorded, **PRODUCTION NO-GO**.
