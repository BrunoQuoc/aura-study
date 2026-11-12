import {readFileSync} from "node:fs";

export function assessCadenceSla(policy, ownership) {
 const a=policy?.approval??{};
 const x=policy?.exercise??{};
 const c=policy?.cadence??{};
 const isIssueComment=x=>typeof x==="string"&&
  /^https:\/\/github\.com\/BrunoQuoc\/aura-study\/issues\/12#issuecomment-\d+$/.test(x);
 const isEvidenceLink=x=>typeof x==="string"&&
  /^https:\/\/github\.com\/BrunoQuoc\/aura-study\/issues\/12#issuecomment-\d+$/.test(x);
 const checks={
  staging_only:policy?.environment==="STAGING"&&policy?.release?.production_release_approved===false,
  no_unapproved_automation:policy?.automation_enabled===false,
  assigned_distinct_roles:ownership?.primary_owner_github==="BrunoQuoc"&&
   ownership?.backup_reviewer_github==="Sonic-2015"&&
   ownership?.primary_owner_github.toLowerCase()!==ownership?.backup_reviewer_github.toLowerCase()&&
   ownership?.owner_acceptance===true&&ownership?.backup_acceptance===true,
  manual_daily_time:c.local_time==="09:00"&&policy?.timezone==="Asia/Ho_Chi_Minh"&&
   c.days==="DAILY_INCLUDING_WEEKENDS_PROPOSED"&&c.no_24x7_coverage===true,
  explicit_owner_cadence_ack:a.accepted_by_primary===true&&isIssueComment(a.primary_cadence_ack_comment_url),
  explicit_backup_cadence_ack:a.accepted_by_backup===true&&isIssueComment(a.backup_cadence_ack_comment_url),
  primary_sla_terms_confirmed:a.sla_and_coverage_terms_confirmed_by_primary===true,
  backup_sla_terms_confirmed:a.sla_and_coverage_terms_confirmed_by_backup===true,
  independent_reviewer_signoff:a.independent_reviewer_approved===true&&isIssueComment(a.independent_policy_signoff_comment_url),
  approved_and_effective:a.approved===true&&typeof a.approved_at_utc==="string"&&
   !Number.isNaN(Date.parse(a.approved_at_utc))&&
   /^\d{4}-\d\d-\d\d$/.test(a.effective_from_local_date||"")&&
   /^\d{4}-\d\d-\d\d$/.test(a.review_due_local_date||""),
  actual_read_only_review:x.first_real_manual_check_completed===true&&isEvidenceLink(x.first_real_manual_check_issue_comment_url),
  backup_handoff_rehearsal:x.missed_review_handoff_tabletop_completed===true&&
   isEvidenceLink(x.missed_review_handoff_evidence_url),
  time_bounded_manual_monitoring_approved:policy?.exceptions?.time_bounded_manual_monitoring_exception_approved===true&&
   typeof policy?.exceptions?.expires_at_utc==="string"&&
   !Number.isNaN(Date.parse(policy.exceptions.expires_at_utc))&&
   isIssueComment(policy?.exceptions?.reviewer_approval_url)
 };
 const required=Object.entries(checks).filter(([key])=>key!=="time_bounded_manual_monitoring_approved");
 return {
  status:required.every(([,valid])=>valid)?"MANUAL_CADENCE_READY":"DRAFT_OR_PENDING",
  checks,
  full_production_monitoring_verified:false,
  production_release_approved:false
 };
}

if(process.argv[1]&&import.meta.url===new URL("file://"+process.argv[1]).href){
 const policy=JSON.parse(readFileSync(new URL("../release/phase3fb2-monitoring-cadence-sla.json",import.meta.url),"utf8"));
 const registry=JSON.parse(readFileSync(new URL("../release/phase3fb2-monitoring-ownership.json",import.meta.url),"utf8"));
 const result=assessCadenceSla(policy,registry);
 process.stdout.write("Phase3F-B2 cadence SLA: "+result.status+"\n");
 for(const [key,valid] of Object.entries(result.checks))
  process.stdout.write(key+"="+(valid?"PASS":"PENDING")+"\n");
 if(process.argv.includes("--require-pass")&&result.status!=="MANUAL_CADENCE_READY")
  process.exitCode=1;
}
