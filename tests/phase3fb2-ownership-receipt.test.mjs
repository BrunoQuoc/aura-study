import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {assessReceipt} from "../scripts/phase3fb2-receipt-gate.mjs";

const cfg=JSON.parse(readFileSync(new URL("../release/phase3fb2-monitoring-ownership.json",import.meta.url),"utf8"));
const link=n=>"https://github.com/BrunoQuoc/aura-study/issues/12#issuecomment-"+n;

test("nominated connected account is never treated as accepted Primary",()=>{
 assert.equal(cfg.primary_owner_candidate_github,"BrunoQuoc");
 assert.equal(cfg.primary_owner_github,null);
 assert.equal(cfg.backup_reviewer_github,null);
 assert.equal(cfg.owner_acceptance,false);
 assert.equal(cfg.backup_acceptance,false);
 assert.equal(cfg.live_alerts_enabled,false);
 assert.equal(assessReceipt(cfg).status,"PENDING");
});

test("different accepted GitHub users and independent receipt proof are all required",()=>{
 const full={
  ...cfg,
  primary_owner_github:"BrunoQuoc",
  backup_reviewer_github:"AURAbackup",
  owner_acceptance:true,
  backup_acceptance:true,
  review_cadence:"DAILY_09_00_VIETNAM_APPROVED",
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
 assert.equal(assessReceipt({...full,backup_reviewer_github:"brunoquoc"}).status,"PENDING");
 assert.equal(assessReceipt({...full,owner_acceptance:false}).status,"PENDING");
 assert.equal(assessReceipt({...full,incident_intake:{...full.incident_intake,notification_received:false}}).status,"PENDING");
 assert.equal(assessReceipt({...full,notification_delivery_evidence:{...full.notification_delivery_evidence,verified_comment_authors:false}}).status,"PENDING");
 assert.equal(assessReceipt({...full,notification_delivery_evidence:{...full.notification_delivery_evidence,backup_ack_comment_url:"https://example.org/fake"}}).status,"PENDING");
});

test("even acknowledged GitHub receipt cannot grant production release",()=>{
 const observed=assessReceipt(cfg);
 assert.equal(observed.does_not_prove_supabase_alerting,true);
 assert.equal(observed.production_release_approved,false);
});
