import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const root = (path) => readFileSync(new URL("../"+path,import.meta.url),"utf8");
const lifecycle = root("supabase/audits/aura_phase3fa_security_closure_readonly.sql");
const scored = root("supabase/audits/aura_phase3fa_graded_isolation_rollback.sql");
const logs = root("supabase/audits/aura_phase3fa_auth_logs_monitor.sql");
const report = root("docs/staging-auth-security-closure-phase3fa.md");
const manifest = JSON.parse(root("release/phase3f-production-gates.json"));

test("retention inventory is aggregate-only and contains no destructive DML",()=>{
 assert.match(lifecycle,/phase3fa_tagged_anonymous/);
 assert.match(lifecycle,/earliest_review_due_at_utc/);
 assert.match(lifecycle,/tagged_sessions/);
 assert.match(lifecycle,/tagged_refresh_tokens/);
 assert.match(lifecycle,/tagged_device_records/);
 assert.match(lifecycle,/tagged_learning_events/);
 assert.doesNotMatch(lifecycle,/^\s*(?:DELETE|UPDATE|TRUNCATE|DROP|ALTER)\s/mi);
 assert.doesNotMatch(lifecycle,/SELECT\s+\*\s+FROM\s+auth\.users/i);
});

test("scored fixture is rolled back by controlled inner exception",()=>{
 assert.match(scored,/CREATE TEMP TABLE/i);
 assert.match(scored,/ON COMMIT DROP/i);
 assert.match(scored,/INSERT INTO public\.aura_attempts/i);
 assert.match(scored,/GET DIAGNOSTICS v_inserted_count = ROW_COUNT/i);
 assert.match(scored,/RAISE EXCEPTION 'AURA_ROLLBACK_EXPECTED'/);
 assert.match(scored,/EXCEPTION WHEN raise_exception THEN/);
 assert.match(scored,/IF SQLERRM<>'AURA_ROLLBACK_EXPECTED' THEN RAISE/);
 assert.match(scored,/EXECUTE 'SET LOCAL ROLE authenticated'/);
 assert.match(scored,/unpaired_attempts integer/);
 assert.match(scored,/unpaired_outcomes integer/);
 assert.doesNotMatch(scored,/^\s*(?:COMMIT|DELETE|TRUNCATE)\b/mi);
});

test("monitor script aggregates metadata only, without request payloads",()=>{
 assert.match(logs,/captcha_rejections/);
 assert.match(logs,/auth_edge_429/);
 assert.match(logs,/auth_http_5xx/);
 assert.match(logs,/countIf\(/);
 assert.doesNotMatch(logs,/SELECT\s+\*/i);
 assert.doesNotMatch(logs,/log_attributes\['(?:remote_addr|mail_to|user_id|request\.search|request\.url)'\]/i);
 assert.doesNotMatch(logs,/^\s*(?:DELETE|UPDATE|INSERT|TRUNCATE)\s/mi);
});

test("release gate stays blocked pending 429 alerts and plan-gated password screening",()=>{
 const gate=manifest.gates.find(x=>x.id==="ANONYMOUS_AUTH_ABUSE");
 const password=manifest.gates.find(x=>x.id==="PASSWORD_BREACH_PROTECTION");
 assert.equal(manifest.production_release_approved,false);
 assert.equal(gate.status,"OPEN");
 assert.equal(password.status,"OPEN");
 assert.match(report,/PRODUCTION.*NO-GO/i);
 assert.match(report,/429/);
 assert.match(report,/2026-12-06 07:14 UTC/);
 assert.match(report,/1.*refresh token/i);
});
