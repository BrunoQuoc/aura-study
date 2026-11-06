/**
 * AURA STUDY Phase 3F-B2: offline tabletop policy (STAGING).
 * No network, no Supabase SDK, no credentials and no mutation.
 * Severity labels are DRAFT, awaiting an incident owner and reviewer.
 */
export const CASES = Object.freeze([
  {id:"unpaired_leak",title:"Unpaired Student sees learner data",severity:"P0",expected:"STOP_AND_ESCALATE"},
  {id:"test_user_link",title:"Tagged test identity gains a pairing",severity:"P1",expected:"FREEZE_AND_REVIEW"},
  {id:"auth_5xx",title:"Auth 5xx observed in log snapshot",severity:"P1",expected:"INVESTIGATE_AND_NOTIFY"}
]);

const SAFE_ACTIONS={
  unpaired_leak:[
    "Stop STAGING tests; do not alter RLS as a workaround",
    "Preserve aggregate evidence, time window and test scenario only",
    "Open a sanitized incident record for security owner/reviewer",
    "Request an authorized containment decision; do not revoke real Student"
  ],
  test_user_link:[
    "Pause creation or pairing tests",
    "Compare authorized pairing records and read-only test identity inventory",
    "Open a sanitized incident record for security owner/reviewer",
    "Wait for authorized remediation; no bulk account deletion"
  ],
  auth_5xx:[
    "Compare new Auth snapshot to previous baseline",
    "Inspect provider status and rate-limit versus service-error classification",
    "Record impact and contact the responsible owner",
    "Only apply a separately approved rollback"
  ]
};

export function decideIncident(id){
  const scenario=CASES.find(x=>x.id===id);
  if(!scenario)throw Error("UNKNOWN_SCENARIO");
  return Object.freeze({
    id, title:scenario.title, severity:scenario.severity,
    action:scenario.expected,
    steps:Object.freeze([...SAFE_ACTIONS[id]]),
    authApiCalls:0, databaseWrites:0, automaticAccountDeletion:false,
    alertDelivered:false, ownerConfirmed:false
  });
}

export function runTabletop(){
  const cases=CASES.map(x=>decideIncident(x.id));
  const pass=cases.every(c=>c.steps.length===4 &&
    c.authApiCalls===0 && c.databaseWrites===0 &&
    c.automaticAccountDeletion===false && c.alertDelivered===false);
  return Object.freeze({passed:pass,completed:cases.length,total:CASES.length,cases});
}
