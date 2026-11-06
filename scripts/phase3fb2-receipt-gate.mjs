import {readFileSync} from "node:fs";

export function assessReceipt(registry){
 const e=registry.notification_delivery_evidence??{};
 const validLogin=x=>typeof x==="string"&&/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(x);
 const primary=registry.primary_owner_github;
 const backup=registry.backup_reviewer_github;
 const distinct=validLogin(primary)&&validLogin(backup)&&primary.toLowerCase()!==backup.toLowerCase();
 const validProof=x=>typeof x==="string"&&
  /^https:\/\/github\.com\/BrunoQuoc\/aura-study\/issues\/12#issuecomment-\d+$/.test(x);
 const checks={
  distinct_named_owners:!!distinct,
  primary_accepted:registry.owner_acceptance===true,
  backup_accepted:registry.backup_acceptance===true,
  cadence_approved:typeof registry.review_cadence==="string"&&
   !registry.review_cadence.includes("NOT_APPROVED")&&
   !registry.review_cadence.includes("PROPOSED"),
  primary_notification_receipt:e.primary_received===true&&validProof(e.primary_ack_comment_url),
  backup_notification_receipt:e.backup_received===true&&validProof(e.backup_ack_comment_url),
  independent_author_check:e.verified_comment_authors===true,
  independent_reviewer_approved:e.approved_by_independent_reviewer===true,
  receipt_registry_approved:registry.incident_intake?.notification_received===true
 };
 return {
  status:Object.values(checks).every(Boolean)?"HUMAN_RECEIPT_PASS":"PENDING",
  checks,does_not_prove_supabase_alerting:true,production_release_approved:false
 };
}

if(process.argv[1]&&import.meta.url===new URL("file://"+process.argv[1]).href){
 const config=JSON.parse(readFileSync(new URL("../release/phase3fb2-monitoring-ownership.json",import.meta.url),"utf8"));
 const v=assessReceipt(config);
 const line=Object.entries(v.checks).map(([k,ok])=>k+"="+(ok?"PASS":"PENDING")).join(" ");
 process.stdout.write("Phase3F-B2 "+v.status+": "+line+"\n");
 process.stdout.write("Human receipt does not prove live Supabase alert delivery.\n");
 if(process.argv.includes("--require-pass")&&v.status!=="HUMAN_RECEIPT_PASS")
  process.exitCode=1;
}
