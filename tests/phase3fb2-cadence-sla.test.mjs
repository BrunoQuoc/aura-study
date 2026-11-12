import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {assessCadenceSla} from "../scripts/phase3fb2-cadence-sla-gate.mjs";

const policy=JSON.parse(readFileSync(new URL("../release/phase3fb2-monitoring-cadence-sla.json",import.meta.url),"utf8"));
const registry=JSON.parse(readFileSync(new URL("../release/phase3fb2-monitoring-ownership.json",import.meta.url),"utf8"));
const comment=id=>"https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-"+id;

test("draft cadence does not silently activate on accepted ownership and receipt",()=>{
 const s=assessCadenceSla(policy,registry);
 assert.equal(s.status,"DRAFT_OR_PENDING");
 assert.equal(s.checks.assigned_distinct_roles,true);
 assert.equal(s.checks.manual_daily_time,true);
 assert.equal(s.checks.explicit_owner_cadence_ack,true);
 assert.equal(s.checks.explicit_backup_cadence_ack,true);
 assert.equal(s.checks.primary_sla_terms_confirmed,true);
 assert.equal(s.checks.backup_sla_terms_confirmed,true);
 assert.equal(s.checks.cadence_comment_authors_verified,true);
 assert.equal(s.checks.independent_reviewer_signoff,false);
 assert.equal(s.checks.actual_read_only_review,false);
 assert.equal(s.production_release_approved,false);
 assert.equal(s.full_production_monitoring_verified,false);
 assert.equal(policy.automation_enabled,false);
});

test("completed manual plan demands distinct role ACKs, independent approval and operational evidence",()=>{
 const completed=structuredClone(policy);
 completed.approval={
  accepted_by_primary:true,primary_cadence_ack_comment_url:comment(1),
  accepted_by_backup:true,backup_cadence_ack_comment_url:comment(2),
  sla_and_coverage_terms_confirmed_by_primary:true,
  sla_and_coverage_terms_confirmed_by_backup:true,
  cadence_comment_authors_verified:true,
  independent_reviewer_approved:true,independent_policy_signoff_comment_url:comment(3),
  approved:true,approved_at_utc:"2026-11-13T01:00:00Z",
  effective_from_local_date:"2026-11-14",review_due_local_date:"2026-11-21"
 };
 completed.exercise={
  first_real_manual_check_completed:true,first_real_manual_check_issue_comment_url:comment(4),
  missed_review_handoff_tabletop_completed:true,missed_review_handoff_evidence_url:comment(7),
  missed_review_handoff_primary_scenario_comment_url:comment(5),
  missed_review_handoff_backup_takeover_comment_url:comment(6),
  missed_review_handoff_primary_review_comment_url:comment(7),
  missed_review_handoff_participants_verified:true,
  missed_review_handoff_correct_order:true,
  missed_review_handoff_tabletop_only:true
 };
 assert.equal(assessCadenceSla(completed,registry).status,"MANUAL_CADENCE_READY");
 for(const field of ["accepted_by_primary","accepted_by_backup","sla_and_coverage_terms_confirmed_by_primary","sla_and_coverage_terms_confirmed_by_backup","cadence_comment_authors_verified","independent_reviewer_approved","approved"]){
  const bad=structuredClone(completed);
  bad.approval[field]=false;
  assert.equal(assessCadenceSla(bad,registry).status,"DRAFT_OR_PENDING");
 }
 const absentCheck=structuredClone(completed);
 absentCheck.exercise.first_real_manual_check_completed=false;
 assert.equal(assessCadenceSla(absentCheck,registry).status,"DRAFT_OR_PENDING");
 const unverifiedHandoff=structuredClone(completed);
 unverifiedHandoff.exercise.missed_review_handoff_participants_verified=false;
 assert.equal(assessCadenceSla(unverifiedHandoff,registry).status,"DRAFT_OR_PENDING");
 const sameAccountComment=structuredClone(completed);
 sameAccountComment.exercise.missed_review_handoff_backup_takeover_comment_url=comment(5);
 assert.equal(assessCadenceSla(sameAccountComment,registry).status,"DRAFT_OR_PENDING");
 const badLink=structuredClone(completed);
 badLink.approval.backup_cadence_ack_comment_url="https://untrusted.example/receipt";
 assert.equal(assessCadenceSla(badLink,registry).status,"DRAFT_OR_PENDING");
});

test("manual staging governance never approves production or claims 24/7 alerting",()=>{
 const result=assessCadenceSla(policy,registry);
 assert.equal(result.production_release_approved,false);
 assert.equal(result.full_production_monitoring_verified,false);
 assert.equal(policy.cadence.no_24x7_coverage,true);
 assert.equal(policy.release.live_supabase_alerting_verified,false);
});
