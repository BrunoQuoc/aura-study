import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {assessReceipt} from "../scripts/phase3fb2-receipt-gate.mjs";

const cfg=JSON.parse(readFileSync(new URL("../release/phase3fb2-monitoring-ownership.json",import.meta.url),"utf8"));
const link=n=>"https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-"+n;

test("current STAGING has two verified role ACKs and recipient self-attestations but remains pending governance",()=>{
 assert.equal(cfg.primary_owner_github,"BrunoQuoc");
 assert.equal(cfg.backup_reviewer_github,"Sonic-2015");
 assert.equal(cfg.owner_acceptance,true);
 assert.equal(cfg.backup_acceptance,true);
 assert.equal(cfg.notification_delivery_evidence.primary_received,true);
 assert.equal(cfg.notification_delivery_evidence.backup_received,true);
 assert.equal(cfg.notification_delivery_evidence.verified_comment_authors,true);
 assert.equal(cfg.notification_delivery_evidence.approved_by_independent_reviewer,false);
 assert.equal(cfg.live_alerts_enabled,false);
 assert.equal(cfg.production_release_approved,false);
 const observed=assessReceipt(cfg);
 assert.equal(observed.checks.distinct_named_owners,true);
 assert.equal(observed.checks.cadence_approved,false);
 assert.equal(observed.checks.independent_reviewer_approved,false);
 assert.equal(observed.status,"PENDING");
});

test("unaccepted candidate or one-account review is rejected",()=>{
 const candidate={
  ...cfg,
  primary_owner_github:null,
  backup_reviewer_github:null,
  owner_acceptance:false,
  backup_acceptance:false
 };
 assert.equal(assessReceipt(candidate).status,"PENDING");
 assert.equal(assessReceipt({...cfg,backup_reviewer_github:"brunoquoc"}).status,"PENDING");
 assert.equal(assessReceipt({...cfg,owner_acceptance:false}).status,"PENDING");
});

test("even manual governance acknowledgements need valid comments and distinct reviewers",()=>{
 const full={
  ...cfg,
  review_cadence:"DAILY_09_00_VIETNAM_APPROVED",
  monitoring_cadence_sla_approved:true,
  monitoring_cadence_sla_approval_comment_url:link(8888),
  incident_intake:{...cfg.incident_intake,notification_received:true},
  notification_delivery_evidence:{
   ...cfg.notification_delivery_evidence,
   primary_received:true,
   backup_received:true,
   primary_ack_comment_url:link(1234),
   backup_ack_comment_url:link(2345),
   verified_comment_authors:true,
   approved_by_independent_reviewer:true
  }
 };
 assert.equal(assessReceipt(full).status,"HUMAN_RECEIPT_PASS");
 assert.equal(assessReceipt({...full,monitoring_cadence_sla_approved:false}).status,"PENDING");
 assert.equal(assessReceipt({...full,backup_reviewer_github:"BrunoQuoc"}).status,"PENDING");
 assert.equal(assessReceipt({...full,notification_delivery_evidence:{...full.notification_delivery_evidence,verified_comment_authors:false}}).status,"PENDING");
 assert.equal(assessReceipt({...full,notification_delivery_evidence:{...full.notification_delivery_evidence,backup_ack_comment_url:"https://example.org/fake"}}).status,"PENDING");
});

test("human GitHub receipt never proves live Supabase alert delivery or production signoff",()=>{
 const result=assessReceipt(cfg);
 assert.equal(result.does_not_prove_supabase_alerting,true);
 assert.equal(result.production_release_approved,false);
});
