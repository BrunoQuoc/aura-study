import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const code=readFileSync(new URL("../auth/phase3fb2-incident-policy.js",import.meta.url),"utf8");
const {CASES,decideIncident,runTabletop}=await import("data:text/javascript;charset=utf-8,"+encodeURIComponent(code));
const html=readFileSync(new URL("../auth/phase3fb2-incident-drill.html",import.meta.url),"utf8");

test("three synthetic scenarios get appropriate draft priority",()=>{
 assert.deepEqual(CASES.map(x=>x.id),["unpaired_leak","test_user_link","auth_5xx"]);
 assert.deepEqual(CASES.map(x=>x.severity),["P0","P1","P1"]);
 assert.throws(()=>decideIncident("delete_all_users"),/UNKNOWN_SCENARIO/);
});
test("unsafe incident never mutates production, Student or Auth",()=>{
 const report=runTabletop();
 assert.equal(report.passed,true);
 assert.equal(report.completed,3);
 for(const item of report.cases){
   assert.equal(item.authApiCalls,0);
   assert.equal(item.databaseWrites,0);
   assert.equal(item.automaticAccountDeletion,false);
   assert.equal(item.alertDelivered,false);
   assert.equal(item.ownerConfirmed,false);
   assert.equal(item.steps.length,4);
 }
});
test("P0 does not automatically disable RLS or delete accounts",()=>{
 const steps=decideIncident("unpaired_leak").steps.join(" | ");
 assert.match(steps,/Stop STAGING tests/);
 assert.match(steps,/do not alter RLS/);
 assert.match(steps,/sanitized incident record/);
 assert.doesNotMatch(steps,/disable RLS|delete all users/i);
});
test("published drill page cannot call Supabase, GitHub or alert endpoints",()=>{
 assert.match(html,/STAGING/);
 assert.match(html,/location\.pathname==="\x2faura-study\x2fauth\x2fphase3fb2-incident-drill\.html"/);
 assert.match(html,/let attempted=false/);
 assert.doesNotMatch(html,/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bcreateClient\s*\(/);
 assert.doesNotMatch(html,/signInAnonymously\s*\(|signInWithOtp\s*\(/);
 assert.doesNotMatch(html,/localStorage\.|sessionStorage\.|document\.cookie/);
 assert.doesNotMatch(html,/\.delete\s*\(|\.update\s*\(|\.insert\s*\(/);
});
test("drill page script parses with static module import removed",()=>{
 const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
 assert.ok(script);
 const js=script.replace(/import\s+\{[^}]+\}\s+from\s+["'][^"']+["'];?/g,"");
 assert.doesNotThrow(()=>new Function(js));
});
