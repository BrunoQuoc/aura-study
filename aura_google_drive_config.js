/* AURA STUDY — public browser configuration for Google Drive Admin integration.
   API key and OAuth Client ID are browser-visible by design and MUST remain restricted
   in Google Cloud to the AURA GitHub Pages origin and required APIs only. */
(function(){
  window.AURA_GOOGLE_DRIVE_CONFIG=Object.freeze({
    clientId:'704823170664-vkldvvlh4qp4jrkhg630tnaea6riv8vk.apps.googleusercontent.com',
    apiKey:'AIzaSyB6Ckih2n92ecqMS__9ms5x2uvzMobM3oI',
    appId:'704823170664',
    scope:'https://www.googleapis.com/auth/drive.file',
    expectedInboxName:'00_INBOX'
  });

  /* Compatibility guard:
     Several Admin modules share the same Google Identity script id.
     Some older loaders only check data-loaded="1". If another module loaded
     the script first without setting that flag, the upload loader could wait
     forever for a load event that had already fired. Keep the shared script
     state explicit so Upload / Quality / Queue can coexist safely. */
  function markGoogleScript(script){
    if(!script)return;
    const id=script.id||'';
    if(id!=='aura-google-gsi'&&id!=='aura-google-api')return;
    const mark=()=>{script.dataset.loaded='1'};
    if(id==='aura-google-gsi'&&window.google?.accounts?.oauth2){mark();return}
    if(id==='aura-google-api'&&window.gapi){mark();return}
    script.addEventListener('load',mark,{once:true});
  }
  document.querySelectorAll('#aura-google-gsi,#aura-google-api').forEach(markGoogleScript);
  new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{
    if(n?.nodeType===1&&n.tagName==='SCRIPT')markGoogleScript(n);
  }))).observe(document.head,{childList:true});

  if(document.body.classList.contains('admin-shell')){
    const auth=document.createElement('script');
    auth.src='admin_inbox_auth_hint.js?v=auth-r1';
    auth.async=true;
    document.head.appendChild(auth);

    const rebuild=document.createElement('script');
    rebuild.src='admin_drive_library_rebuild.js?v=rebuild-r2';
    rebuild.async=false;
    rebuild.dataset.auraDriveRebuild='1';
    document.head.appendChild(rebuild);
  }
})();