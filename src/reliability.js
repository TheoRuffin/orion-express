// One bounded preparation session. Repairs never transfer photos or submit a form.
export const VINTED_REPAIR_FIELDS=['category','brand','condition','shipping','title','description','price'];
export function createVintedRecovery(doc,product,{audit,report=()=>{},requestRecovery=()=>{},isBusy=()=>false,onStop=()=>{},durationMs=60000,stableMs=1400,debounceMs=500,maxRepairs=2}={}){
  const view=doc.defaultView,endsAt=Date.now()+durationMs,repairs=new Map(),owned=new Set(),nonce=new URLSearchParams(view.location.hash.slice(1)).get('orion');
  let active=true,armed=false,working=false,queued,expiry,results={},stopReason='';
  for(const key of ['title','description']){
    const value=doc.getElementById(key)?.value;
    if(value==='' || auditFormText(value)===auditFormText(product[key]))owned.add(key);
  }
  try{const value=doc.getElementById('price')?.value;if(!value || parseVintedPrice(value)===0 || parseVintedPrice(value)===parseVintedPrice(product.price))owned.add('price');}catch{}
  const own=node=>!!node?.closest?.('#orion-vinted-test,#orion-express-v2') || !!node?.getRootNode?.().host?.matches?.('#orion-vinted-test,#orion-express-v2');
  function stopped(message){const error=new Error(message);error.name='OrionPreparationStopped';return error;}
  function stop(message='',notify=false){
    if(!active)return;active=false;stopReason=message;view.clearTimeout(queued);view.clearTimeout(expiry);
    for(const name of ['pointerdown','click','keydown','beforeinput'])doc.removeEventListener(name,onUser,true);
    view.removeEventListener('pagehide',onPageHide);view.removeEventListener('pageshow',wake);view.removeEventListener('online',wake);view.removeEventListener('hashchange',onContextChange);view.removeEventListener('popstate',onContextChange);doc.removeEventListener('visibilitychange',wake);
    if(notify)onStop(message);
  }
  function assertActive(){
    if(!active)throw stopped(stopReason || 'Correction automatique arrêtée.');
    if(Date.now()>=endsAt){stop('Délai de correction atteint. Vérifiez les champs signalés.');throw stopped(stopReason);}
    if(view.location.hostname!=='www.vinted.es' || view.location.pathname!=='/items/new'){
      stop('Navigation changée : correction automatique arrêtée.');throw stopped(stopReason);
    }
    const currentNonce=new URLSearchParams(view.location.hash.slice(1)).get('orion');
    if(currentNonce && currentNonce!==nonce){stop('Le transfert a changé : rechargez le formulaire avant de préparer cette fiche.');throw stopped(stopReason);}
    if(view.navigator.onLine===false || doc.visibilityState==='hidden')throw stopped('Préparation en pause. Reprise au retour sur le formulaire connecté.');
  }
  function onUser(event){
    const node=event.composedPath?.()[0] || event.target;
    if(!event.isTrusted || own(node))return;
    if(!['pointerdown','click'].includes(event.type) || node?.closest?.('input,textarea,select,button,label,[contenteditable],[role=button],[role=radio],[role=option],[role=dialog],[id^="package-size-"]'))stop('Modification manuelle détectée : corrections automatiques arrêtées.',true);
  }
  function onPageHide(event){if(!event.persisted)stop();}
  function onContextChange(){try{assertActive();}catch(error){if(!active)onStop(error.message);}}
  function wake(){if(active)observe(audit());}
  for(const name of ['pointerdown','click','keydown','beforeinput'])doc.addEventListener(name,onUser,true);
  view.addEventListener('pagehide',onPageHide);view.addEventListener('pageshow',wake);view.addEventListener('online',wake);view.addEventListener('hashchange',onContextChange);view.addEventListener('popstate',onContextChange);doc.addEventListener('visibilitychange',wake);
  expiry=view.setTimeout(()=>stop('Délai de correction atteint. Vérifiez les champs signalés.'),durationMs);
  function eligible(row){
    if(!row || row.matches || !VINTED_REPAIR_FIELDS.includes(row.key) || (repairs.get(row.key)||0)>=maxRepairs || !String(row.expected).trim())return false;
    if(['title','description','price'].includes(row.key) && !owned.has(row.key))return false;
    try{if(row.key==='condition')resolveOrionCondition(product.condition);if(row.key==='shipping')vintedShippingSize(product.shipping);if(row.key==='price')parseVintedPrice(product.price);}catch{return false;}
    return true;
  }
  function candidate(rows){
    // An existing mobile picker can make every background field inaccessible.
    const open=rows.find(row=>VINTED_REPAIR_FIELDS.includes(row.key) && row.reason==='Menu encore ouvert.');
    if(open)return eligible(open)?open:null;
    const category=rows.find(row=>row.key==='category');
    // A failed category owns the meaning of the dependent fields.
    if(category && !category.matches)return eligible(category)?category:['title','description','price'].map(key=>rows.find(row=>row.key===key)).find(row=>eligible(row)&&visible(doc.getElementById(row.key)));
    return VINTED_REPAIR_FIELDS.map(key=>rows.find(row=>row.key===key)).find(eligible);
  }
  function observe(rows){
    if(!active || !armed || working || isBusy())return;
    if(Date.now()>=endsAt){stop();return;}
    if(doc.visibilityState==='hidden' || view.navigator.onLine===false || !candidate(rows))return;
    if(queued!==undefined)return;
    queued=view.setTimeout(()=>{queued=undefined;if(!active || working || isBusy())return;try{assertActive();if(candidate(audit()))Promise.resolve(requestRecovery()).catch(()=>{});}catch{}},debounceMs);
  }
  async function guarded(task){
    assertActive();working=true;view.clearTimeout(queued);queued=undefined;
    const cleanup=setVintedMutationGuard(doc,assertActive);
    try{return await task();}finally{cleanup();working=false;}
  }
  async function repairField(key){
    if(['title','description'].includes(key)){
      const field=await waitFor(()=>{assertActive();try{return uniqueField(doc,key,key==='description'?'TEXTAREA':'INPUT');}catch{return null;}},4500);
      setNativeValue(field,product[key]);
      await waitForStable(()=>{assertActive();try{return auditFormText(uniqueField(doc,key,key==='description'?'TEXTAREA':'INPUT').value)===auditFormText(product[key]);}catch(error){if(error.name==='OrionPreparationStopped')throw error;return false;}},300,4500);
      return 'Valeur corrigée puis relue dans Vinted.';
    }
    if(key==='price')return setVintedPrice(doc,product.price,{replace:true});
    if(key==='shipping')return selectVintedShipping(doc,product.shipping);
    return selectVintedChoice(doc,key,product[key]);
  }
  return {
    guarded,
    arm(initialResults){results={...initialResults};for(const key of ['title','description','price'])if(typeof results[key]==='string'&&!results[key].startsWith('Manuel'))owned.add(key);armed=true;},
    observe,
    stop,
    async reconcile(){return guarded(async()=>{
      for(;;){
        assertActive();const rows=audit(),next=candidate(rows);
        if(!next){
          const known=rows.filter(row=>VINTED_REPAIR_FIELDS.includes(row.key));
          if(known.some(row=>!row.matches)){
            let changed=false;for(const row of known)if(!row.matches && (repairs.get(row.key)||0)>=maxRepairs && !results[row.key]?.startsWith('Manuel')){results[row.key]='Manuel : Limite de corrections atteinte. Valeur à vérifier dans Vinted.';changed=true;}
            if(changed)report({...results});return {rows,stable:false};
          }
          const signature=JSON.stringify(known);
          await new Promise(resolve=>view.setTimeout(resolve,stableMs));assertActive();
          const final=audit(),finalKnown=final.filter(row=>VINTED_REPAIR_FIELDS.includes(row.key));
          if(finalKnown.every(row=>row.matches) && JSON.stringify(finalKnown)===signature)return {rows:final,stable:true};
          continue;
        }
        const key=next.key;repairs.set(key,(repairs.get(key)||0)+1);
        try{results[key]=await repairField(key);}catch(error){if(error.name==='OrionPreparationStopped')throw error;results[key]='Manuel : '+errorMessage(error);}
        report({...results});
        await new Promise(resolve=>view.setTimeout(resolve,150));
      }
    });},
    get active(){return active;},
    get reason(){return stopReason;}
  };
}
