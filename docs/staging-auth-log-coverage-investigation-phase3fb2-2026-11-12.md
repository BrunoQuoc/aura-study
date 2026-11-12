# AURA STUDY — Phase 3F-B2: Auth telemetry coverage investigation

**STAGING ONLY • READ-ONLY INVESTIGATION • 2026-11-12, approximately 12:58 Asia/Ho_Chi_Minh**.

**Decision:** `AUTH_TELEMETRY_INCONCLUSIVE`. Root cause **NOT VERIFIED**. Never equate an empty Auth source with a functioning Auth error monitor.

## 1. Scope

Connected Supabase STAGING project `aura-study-staging` (`ufqzuowjhdqpydqvcsob`), confirmed `ACTIVE_HEALTHY` at project level. Performed read-only ClickHouse (Supabase Logs Explorer) count aggregates, read-only PostgreSQL metadata and count aggregates, and reviewed current public Supabase documentation. No Auth requests, account or session changes, database writes, log storage setting changes, API secrets, raw auth events, paid log drains, or production modifications.

`ACTIVE_HEALTHY` is project-level health, **not** certification of log delivery or security alert operation.

## 2. Latest live 24h Logs Explorer observations

| Log source or fixed-route aggregate | Observed count |
|---|---:|
| `pgbouncer_logs` | 81 |
| `postgres_logs` | 20 |
| `postgrest_logs` | 15 |
| `edge_logs` | 5 |
| `realtime_logs` | 4 |
| `storage_logs` | 1 |
| `auth_logs` | 0 observed / absent from group result |
| `auth_audit_logs` | 0 observed / absent from group result |
| Gateway requests under `/auth/v1/` | 2 |
| Of those, `/auth/v1/health` | 2 |
| Selected interactive Auth endpoints (`otp/signup/token/verify/user`) | 0 |
| Auth gateway HTTP 429, HTTP 5xx | 0 observed |

Only two fixed-route Auth-related Edge requests appeared; **both were health checks**. An absence of interactive Auth paths in this fixed set is not a comprehensive inventory of all possible Auth routes or request failures. Other log sources prove logs are present generally, **not** that the Auth-specific pipeline was tested.

Compared with [the 2026-11-12 operator screenshot](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6815264719), `edge_logs=5` still appears. Postgres and connection-log totals differ because measurements occur at different times with rolling 24h windows. Do not interpret those differences as ingestion changes.

## 3. PostgreSQL Auth activity and audit table

Read-only query at **2026-11-12T05:58:41Z**:

| Count-only metric | Value |
|---|---:|
| Auth users total | 6 |
| New Auth users in last 24h | 0 |
| Auth session rows total | 4 |
| New Auth sessions in last 24h | 0 |
| Updated Auth sessions in last 24h | 0 |
| New refresh token rows in last 24h | 0 |

Separate Auth audit table query at **2026-11-12T05:58:02Z**:

| Audit metric | Value |
|---|---:|
| PostgreSQL `auth.audit_log_entries` (all time) | 0 |
| PostgreSQL audit entries (24h) | 0 |
| PostgreSQL audit entries (7d) | 0 |

The table is present and was inspected using `information_schema.columns`. No event payloads, IP addresses or identities were retrieved. Per current Supabase guidance, **storage of Auth Audit Logs in PostgreSQL is optional**: an empty table is not evidence that the server logging pipeline failed. Conversely, no recent session rows **does not rule out** unsuccessful login attempts.

## 4. Distinguish the three log sources

Supabase documents `auth_logs` as Auth server logs (login, OAuth, JWT and email), `auth_audit_logs` as authentication audit events, and `edge_logs` as API Gateway HTTP requests. These are not interchangeable:

- Source reference: https://supabase.com/docs/guides/observability/log-field-reference
- Auth Audit Logs and optional Postgres storage: https://supabase.com/docs/guides/auth/audit-logs
- No matching rows troubleshooting: https://supabase.com/docs/guides/observability/advanced-log-filtering

Read-only diagnostic scripts:

- `supabase/audits/aura_phase3fb2_auth_telemetry_coverage_24h.sql` — Logs Explorer
- `supabase/audits/aura_phase3fb2_auth_audit_activity_24h.sql` — PostgreSQL SQL Editor

## 5. Evidence-based analysis

**Plausible, not proven:** Low or absent interactive Auth traffic during the selected 24h window. This is consistent with zero recently created Auth users/sessions/refresh tokens and no observed interactive Auth Gateway paths. It **does not** prove a fully functional Auth log source, nor exclude failed sign-in attempts, delayed ingestion, filtering, configured retention, or unexpected log configuration.

**Not established:** Auth service incident, missing log platform, verified Auth event collection, live real-time alert delivery, actual server rate limiting or 24/7 coverage.

## 6. Non-destructive next validation

1. The independent authorized reviewer checks `Authentication → Configuration → Audit Logs` **read-only** and records whether Postgres audit storage is currently enabled or disabled. **Do not toggle it**.
2. In Logs Explorer, check `auth_logs` **and** `auth_audit_logs` with the same known 24h interval and compare to API Gateway `edge_logs`. Make sure log type filters are not excluding either source.
3. Check whether any authentic sign-in/OTP/session-refresh event was independently known to occur in the interval, without disclosing emails/user IDs or creating new Auth traffic. If none, the missing source is **unproven rather than broken**.
4. If a controlled Auth event test becomes necessary, prepare a separate risk-bounded proposal and obtain independent authorization **before** test activity. Do not run login floods, create extra anonymous learner accounts or modify database logging under this task.
5. An independent reviewer must separately evaluate the deferred 09:00 monitoring acceptance and sign off any remediation or time-limited exception. Neither this research nor an assistant-authored GitHub comment constitutes human approval.

**Governance:** phase3FB2 Independent Operational Review remains **PENDING**; skipped 09:00 acceptance is **DEFERRED NOT PASS**; `ALERTING_AND_INCIDENT_RESPONSE` remains **OPEN**; **PRODUCTION NO-GO**.


## 7. Audit Logs configuration screenshot — 2026-11-12

User-supplied dashboard screenshot shows **Authentication → Configuration → Audit Logs → Write audit logs to the database = OFF** (grey switch). [Issue #12 audit note](https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-6816208559). No setting was changed. This optional setting is consistent with an empty PostgreSQL `auth.audit_log_entries` table, but **it does not explain or establish a defect in the separate `auth_logs` or `auth_audit_logs` Logs Explorer streams**. Centralized Auth event telemetry remains UNVERIFIED because there was no independently known real interactive Auth event in the sampled rolling 24h window.

Next: an authorized reviewer should compare the centralized source rows over a timestamped, independently known historical Auth operation window, without revealing identifiers or causing new Auth requests. If no corroborated event window exists, retain status INCONCLUSIVE pending a separately approved bounded test. No switches or data were changed; independent review and production gates remain OPEN.
