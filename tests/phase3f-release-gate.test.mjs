import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkProductionGates } from "../scripts/phase3f-release-gate.mjs";

const manifest = JSON.parse(readFileSync(
  new URL("../release/phase3f-production-gates.json",import.meta.url),"utf8"));

const copy = value => JSON.parse(JSON.stringify(value));

test("current STAGING evidence is NO-GO for PRODUCTION",()=>{
  const result=checkProductionGates(manifest);
  assert.equal(result.go,false);
  assert.ok(result.problems.some(x=>x.includes("ANONYMOUS_AUTH_ABUSE")));
});

test("fail closed if release manifest missing",()=>{
  assert.equal(checkProductionGates(null).go,false);
});

test("fail closed if required gate was removed",()=>{
  const modified=copy(manifest);
  modified.gates.pop();
  assert.equal(checkProductionGates(modified).go,false);
});

test("fail closed on duplicate required gate ID",()=>{
  const modified=copy(manifest);
  modified.gates[1].id=modified.gates[0].id;
  assert.equal(checkProductionGates(modified).go,false);
});

test("fail closed on unverified PROD_PASS",()=>{
  const modified=copy(manifest);
  modified.target_environment="PRODUCTION";
  modified.production_release_approved=true;
  modified.gates.forEach(g=>g.status="PROD_PASS");
  assert.equal(checkProductionGates(modified).go,false);
});

test("fail closed on matching security/product approval record",()=>{
  const modified=makeFullyApproved();
  modified.approval.product.record_url=modified.approval.security.record_url;
  assert.equal(checkProductionGates(modified).go,false);
});

test("only complete independent production evidence could pass",()=>{
  const modified=makeFullyApproved();
  assert.equal(checkProductionGates(modified).go,true);
});

function makeFullyApproved(){
  const modified=copy(manifest);
  modified.target_environment="PRODUCTION";
  modified.production_release_approved=true;
  modified.release_commit_sha="f".repeat(40);
  modified.gates.forEach(g=>{
    g.status="PROD_PASS";
    g.verified_at_utc="2026-11-05T10:00:00Z";
    g.production_evidence_url="https://example.invalid/evidence/"+g.id;
  });
  modified.approval.security={approved:true,record_url:"https://example.invalid/security-signoff"};
  modified.approval.product={approved:true,record_url:"https://example.invalid/product-signoff"};
  return modified;
}
