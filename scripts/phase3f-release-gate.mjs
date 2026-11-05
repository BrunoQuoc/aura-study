/**
 * AURA STUDY Phase 3F — fail-closed PRODUCTION release gate validator.
 * Node 20+; reads only committed governance manifest, no network/secrets.
 *
 * node scripts/phase3f-release-gate.mjs              # exit 2 until GO
 * node scripts/phase3f-release-gate.mjs --summary    # informational, exit 0
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const REQUIRED_IDS = [
  "RLS_AND_TENANT_ISOLATION",
  "VERIFIED_OUTCOMES_INTEGRITY",
  "OFFLINE_IDEMPOTENCY",
  "ANONYMOUS_AUTH_ABUSE",
  "PASSWORD_BREACH_PROTECTION",
  "SHARED_DEVICE_SESSION_PRIVACY",
  "REAL_FAULT_INJECTION",
  "RETENTION_AND_CLEANUP",
  "PERFORMANCE_AND_CAPACITY",
  "BACKUP_RESTORE_RECOVERY",
  "ALERTING_AND_INCIDENT_RESPONSE",
  "DEPENDENCY_AND_SECRET_AUDIT",
  "SECURITY_SIGNOFF",
  "PRODUCT_SIGNOFF"
];

const VALID_STATUSES = new Set(["OPEN","STAGING_PASS","PROD_PASS"]);
const SHA40 = /^[0-9a-f]{40}$/;
const RELEASE_URL = /^https:\/\/[^ \t\r\n]+$/;
function validRecord(record) {
  return record && record.approved === true &&
    typeof record.record_url === "string" && RELEASE_URL.test(record.record_url);
}

export function checkProductionGates(manifest) {
  const problems=[];
  if (!manifest || manifest.schema_version !== 1 || manifest.product !== "AURA STUDY") {
    problems.push("Wrong schema/product.");
  }
  if (manifest?.target_environment !== "PRODUCTION") {
    problems.push("Target environment is not PRODUCTION.");
  }
  if (manifest?.production_release_approved !== true) {
    problems.push("Explicit production approval is absent.");
  }
  if (typeof manifest?.release_commit_sha !== "string" ||
      !SHA40.test(manifest.release_commit_sha)) {
    problems.push("No pinned 40-hex release commit SHA.");
  }

  const gates = Array.isArray(manifest?.gates) ? manifest.gates : [];
  const ids=gates.map(x=>x?.id);
  const distinct=new Set(ids);
  if (distinct.size!==gates.length || gates.length!==REQUIRED_IDS.length ||
      REQUIRED_IDS.some(id=>!distinct.has(id))) {
    problems.push("Required gate IDs missing, duplicated or unrecognized.");
  }

  for(const gate of gates){
    if(!VALID_STATUSES.has(gate?.status)){
      problems.push("Unrecognized gate status "+String(gate?.id));continue;
    }
    if(gate.status!=="PROD_PASS"){
      problems.push("Gate is not production-ready: "+gate.id+" ("+gate.status+")");
      continue;
    }
    if(typeof gate.production_evidence_url!=="string" ||
       !RELEASE_URL.test(gate.production_evidence_url) ||
       !Number.isFinite(Date.parse(gate.verified_at_utc))) {
      problems.push("Production evidence missing for "+gate.id);
    }
  }
  if(!validRecord(manifest?.approval?.security)){
    problems.push("Independent security approval record is absent.");
  }
  if(!validRecord(manifest?.approval?.product)){
    problems.push("Product owner approval record is absent.");
  }
  // Distinct independent approval documents, not a single self-attestation.
  if(manifest?.approval?.security?.record_url &&
     manifest.approval.security.record_url===manifest?.approval?.product?.record_url){
    problems.push("Security and product approvals must be separate records.");
  }

  return {go:problems.length===0,problems};
}

const executedAsScript = process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (executedAsScript) {
  const manifestPath = resolve(dirname(fileURLToPath(import.meta.url)),
    "../release/phase3f-production-gates.json");
  let m;
  try { m = JSON.parse(readFileSync(manifestPath,"utf8")); }
  catch(e) {
    console.error("NO-GO: manifest missing, malformed or inaccessible.");
    process.exit(2);
  }
  const result=checkProductionGates(m);
  const label=result.go?"GO":"NO-GO";
  console.log("AURA STUDY — "+label+" | "+result.problems.length+" unresolved release checks");
  for(const x of result.problems) console.log("- "+x);
  if(process.argv.includes("--summary")) process.exit(0);
  process.exit(result.go?0:2);
}
