function renderVintedChoices(container,product,rows){
  container.replaceChildren();const doc=container.ownerDocument,table=doc.createElement('table'),head=doc.createElement('tr');
  for(const title of rows?['Champ','Fiche enregistrée','Lu dans Vinted','Contrôle']:['Champ','Fiche enregistrée']){const th=doc.createElement('th');th.scope='col';th.textContent=title;head.append(th);}table.append(head);
  for(const key of rows?rows.map(row=>row.key):['category','condition','shipping']){
    const row=rows?.find(item=>item.key===key),tr=doc.createElement('tr');
    const label=doc.createElement('th');label.scope='row';label.textContent=({title:'Titre',description:'Description',price:'Prix',category:'Catégorie',brand:'Marque',condition:'État',shipping:'Colis',photos:'Photos',dynamic:'Champs supplémentaires'})[key];tr.append(label);
    for(const text of rows?[row.expected||'—',row.actual||'—']:[String(product[key]||'—')]){const td=doc.createElement('td');if(!['photos','dynamic'].includes(key))td.dataset.orionUser='';td.textContent=text;tr.append(td);}
    if(row){const td=doc.createElement('td');td.textContent=row.matches?'Valeur vérifiée.':row.reason;td.style.color=row.matches?'#087b67':'#a23d17';if(!row.matches&&row.detail){const detail=doc.createElement('p');detail.textContent=row.detail;td.append(detail);}tr.append(td);}table.append(tr);
  }container.append(table);
}
async function launchVintedTest(product) {
  if(!hasBridge()){await startPreparation(product);status('Transfert extension indisponible : préparation manuelle ouverte.');return;}
  const t=await stageTransfer(product),link=vintedLaunchURL(t.nonce);
  main.innerHTML=`<button id="test-back">← Retour à la fiche</button><h2>Transfert prêt</h2><h3>Choix enregistrés dans la fiche</h3><div id="source-choices"></div><p>Produit et photos enregistrés dans le stockage de Violentmonkey ; transfert valable 24 heures. Aucun serveur de transfert.</p><button id="open-vinted" class="primary">Ouvrir Vinted et préremplir (test) ↗</button><p id="vinted-launch-status" role="status">Le bouton charge le formulaire dans cet onglet Orion.</p><p>Si Orion propose l’app Vinted, choisissez Jamais. Si l’app s’ouvre encore, utilisez Copier le lien pour Orion et collez le lien complet dans la barre d’adresse. Le lien spécial Orion a été retiré car il échouait sur iPhone.</p><details><summary>Vinted s’ouvre dans l’app ?</summary><p>Dans Orion : Réglages → Général → App Opener. Si une règle vinted.es ou www.vinted.es est présente, choisissez Never / Jamais. Si nécessaire, remettez la règle sur Ask / Demander, puis relancez le bouton et choisissez Never. Le balayage de droite à gauche retire uniquement cette règle, sans effacer les fiches.</p></details><button id="copy-vinted-link">Copier le lien pour Orion</button><textarea id="vinted-link-fallback" readonly hidden aria-label="Lien à coller dans Orion" rows="3"></textarea><p id="vinted-link-status" role="status"></p><p>Expérimental : contrôlez tous les champs et les images. Le script ne publie ni ne sauvegarde de brouillon. Les valeurs supplémentaires inconnues restent manuelles.</p><button id="manual-prep">Utiliser la préparation manuelle</button>`;
  renderVintedChoices(main.querySelector('#source-choices'),product);
  const button=main.querySelector('#open-vinted'),message=main.querySelector('#vinted-launch-status');
  let requested=false,since=0,timer;
  const showAck=async()=>{
    if(!since||!message.isConnected)return;
    const ack=await readVintedLaunchAck(t.nonce,since);
    if(ack){message.textContent=({ready:'Formulaire Orion reconnu. Préremplissage en cours.',complete:'Préremplissage terminé dans l’onglet Vinted. Vérifiez l’annonce.',partial:'Formulaire reçu : certains champs demandent une vérification dans l’onglet Vinted.',error:'Le formulaire a signalé une erreur. Consultez le bouton Orion dans l’onglet Vinted.'})[ack.state];return ack;}
  };
  const watch=()=>{
    clearInterval(timer);let checks=0;
    timer=setInterval(async()=>{if(!message.isConnected){clearInterval(timer);return;}const ack=await showAck();if(ack&&ack.state!=='ready'){clearInterval(timer);return;}if(++checks>=24){clearInterval(timer);if(!ack){message.textContent='Aucune confirmation du formulaire. Si l’app s’ouvre, collez le lien complet dans la barre d’adresse d’Orion. Aucun second onglet automatique.';}else if(ack.state==='ready'){message.textContent='Formulaire Orion reconnu. Consultez l’onglet Vinted pour vérifier le résultat.';}}},500);
  };
  button.onclick=()=>{
    if(requested)return;requested=true;button.disabled=true;since=Date.now();
    try{message.textContent='Ouverture demandée. En attente du formulaire dans Orion…';watch();navigateVintedInCurrentTab(t.nonce);}
    catch(e){requested=false;button.disabled=false;message.textContent=errorMessage(e);}
  };

  const resume=()=>{if(message.isConnected)void showAck();else{window.removeEventListener('pageshow',resume);document.removeEventListener('visibilitychange',resume);}};window.addEventListener('pageshow',resume);document.addEventListener('visibilitychange',resume);
  bind('#copy-vinted-link',async()=>{
    const note=main.querySelector('#vinted-link-status');
    try{await navigator.clipboard.writeText(link);note.textContent='Lien copié. Collez-le dans la barre d’adresse d’Orion.';}
    catch{const field=main.querySelector('#vinted-link-fallback');field.value=link;field.hidden=false;field.focus();field.select();note.textContent='Appuyez longuement sur le lien sélectionné, puis Copier. Collez-le dans la barre d’adresse d’Orion.';}
  });
  bind('#test-back',()=>preview(product.id));bind('#manual-prep',()=>startPreparation(product));
}
async function initVintedAssistant(){
  const host=document.createElement('div');host.id='orion-vinted-test';host.style.cssText='position:fixed;right:calc(env(safe-area-inset-right, 0px) + 8px);bottom:calc(env(safe-area-inset-bottom, 0px) + 8px);z-index:2147483646;max-width:calc(100vw - 16px);width:auto';
  const root=host.attachShadow({mode:'open'});root.innerHTML=`<style>:host{font:15px -apple-system,sans-serif;color:#172b35}*{box-sizing:border-box}section{width:min(360px,calc(100vw - 16px));padding:14px;background:#f6f5ef;border:2px solid #087b67;border-radius:14px;max-height:55vh;overflow:auto}button,a{font:inherit;display:inline-block;padding:12px;min-height:44px;margin:4px;border-radius:9px;border:1px solid #087b67;background:white;color:#087b67}p,li{line-height:1.4}table{width:100%;border-collapse:collapse;font-size:12px}td,th{padding:5px;text-align:left;vertical-align:top;overflow-wrap:anywhere;border-bottom:1px solid #ddd}ul{padding-left:18px}textarea{width:100%;font-size:16px}#toggle{position:sticky;top:0;z-index:1}section.folded [data-orion-languages]{display:none!important}section.folded{width:auto;padding:0;border:0;background:transparent}section.folded #toggle{margin:0;padding:8px 12px;min-height:44px;border-radius:22px;background:#087b67;color:white}</style><section class="folded"><button id="toggle" aria-label="Ouvrir Orion" aria-expanded="false">Orion</button><div id="body" hidden><b>Orion Express · préremplissage expérimental</b><p id="status" role="status">Chargement du transfert local…</p><button id="fill" disabled>Préremplir une seule fois</button><button id="retry" disabled>Réessayer les textes et choix (sans photos)</button><h3>Choix de la fiche et contrôle actuel</h3><div id="live-choices" aria-live="polite"></div><ul id="result"></ul><p>Aucune publication ni sauvegarde de brouillon automatique. La présence dans un champ ne confirme pas sa validation par Vinted. Vérifiez les photos et les champs dépendants après chaque changement de catégorie.</p><a href="https://example.com/" target="_blank" rel="noopener">Retour au catalogue</a><button id="clear">Effacer le transfert local</button></div></section>`;document.body.append(host);
  attachOrionLanguage(root,root.querySelector('section'));
  const $=s=>root.querySelector(s);let busy=false,used=false,needsAttention=false,product,transfer,updateAudit,stopAudit,recovery,photoFiles,photoManifest;
  let fatalError=false,choiceResults={},ackState,ackChain=Promise.resolve();
  const audit=()=>auditVintedForm(document,product,{photoManifest});
  const updateAck=rows=>{
    if(!used || !transfer)return ackChain;
    const state=fatalError?'error':rows.some(row=>!row.matches)?'partial':'complete';
    if(state===ackState)return ackChain;ackState=state;
    ackChain=ackChain.catch(()=>{}).then(()=>acknowledgeVintedLaunch(transfer.nonce,state)).catch(error=>{ackState=null;throw error;});return ackChain;
  };
  const expected=new URLSearchParams(location.hash.slice(1)).get('orion');
  $('#toggle').onclick=()=>{const body=$('#body');body.hidden=!body.hidden;$('#toggle').textContent=body.hidden?(needsAttention?'Orion !':'Orion'):'Réduire';$('#toggle').setAttribute('aria-label',body.hidden?'Ouvrir Orion':'Réduire Orion');$('#toggle').setAttribute('aria-expanded',String(!body.hidden));root.querySelector('section').classList.toggle('folded',body.hidden);};
  const run=async(fn)=>{if(busy)return;busy=true;fatalError=false;$('#fill').disabled=true;$('#retry').disabled=true;try{await fn();}catch(e){if(expected||transfer?.nonce)await acknowledgeVintedLaunch(expected||transfer.nonce,'error').catch(()=>{});fatalError=true;needsAttention=true;$('#status').textContent=errorMessage(e);if($('#body').hidden)$('#toggle').textContent='Orion !';}finally{busy=false;$('#fill').disabled=used||!product;$('#retry').disabled=!used||!product;if(updateAudit&&product)updateAudit(audit());}};
  const draw=results=>{
    choiceResults=results;$('#result').replaceChildren();
    for(const [key,value]of Object.entries(results)){if(VINTED_REPAIR_FIELDS.includes(key))continue;const li=document.createElement('li');li.textContent=`${({photos:'Photos',dynamic:'Champs supplémentaires'})[key] || key} : ${value}`;$('#result').append(li);}
    updateAudit?.(audit());
  };
  const perform=async(photos,automatic=false)=>{
    if(automatic&&!recovery?.active)return;
    $('#status').textContent='Vérification et correction automatiques…';
    if(location.pathname!=='/items/new')throw new Error('Ouvrez le formulaire de création Vinted.');
    if(!navigator.onLine)throw new Error('Connexion indisponible. Aucun transfert lancé.');
    if(!automatic){
      if(photos){uniqueField(document,'title');uniqueField(document,'description','TEXTAREA');}
      else if(!document.getElementById('title')||!document.getElementById('description'))throw new Error('Ouvrez le formulaire de création Vinted.');
      if(photos){const lock=await GM_getValue(TRANSFER_KEY+'-used','');if(lock===transfer.nonce || await GM_getValue(TRANSFER_KEY+'-used-'+transfer.nonce,false)){used=true;throw new Error('Ce transfert a déjà été tenté. Reprenez les textes sans photos ou préparez de nouveau la fiche.');}await GM_setValue(TRANSFER_KEY+'-used-'+transfer.nonce,true);await GM_setValue(TRANSFER_KEY+'-used',transfer.nonce);used=true;}
      recovery?.stop();choiceResults={};
      recovery=createVintedRecovery(document,product,{audit,report:draw,isBusy:()=>busy,requestRecovery:()=>run(()=>fill(false,true)),onStop:message=>{$('#status').textContent=message;}});
    }
    try{
      if(!automatic){const initial=await recovery.guarded(()=>applyVintedProduct(document,product,draw,{photos,photoFiles}));recovery.arm(initial);}
      if(recovery?.active)await recovery.reconcile();
      await updateAck(audit());$('#status').textContent='Tentative terminée. Vérifiez chaque champ et chaque miniature native Vinted. Rien n’a été publié.';
    }catch(error){
      if(error.name!=='OrionPreparationStopped')throw error;
      if(!automatic)recovery.arm(choiceResults);
      await updateAck(audit());$('#status').textContent=errorMessage(error);
    }
  };
  const fill=async(photos,automatic=false)=>{if(!navigator.locks?.request)throw new Error('Verrou de sécurité indisponible dans ce navigateur. Utilisez la préparation manuelle.');return navigator.locks.request('orion-express-fill',()=>perform(photos,automatic));};
  $('#fill').onclick=()=>run(()=>fill(true));$('#retry').onclick=()=>run(()=>fill(false));
  $('#clear').onclick=()=>run(async()=>{recovery?.stop();await GM_deleteValue(TRANSFER_KEY);stopAudit?.();stopAudit=null;updateAudit=null;product=null;photoFiles=null;photoManifest=null;$('#live-choices').replaceChildren();needsAttention=false;if($('#body').hidden)$('#toggle').textContent='Orion';$('#status').textContent='Transfert local effacé. Catalogue conservé.';});
  await run(async()=>{
    if(!hasBridge())throw new Error('Stockage Violentmonkey inaccessible. Vérifiez les autorisations du script.');
    let loaded,lastError;
    // A fresh extension-created tab can initially see an older GM cache. Never select that old product.
    for(let i=0;i<6;i++){
      try{loaded=await readTransfer();if(expected&&expected!==loaded.transfer.nonce)throw new Error('Ce lien correspond à un autre transfert. Préparez de nouveau la fiche.');break;}
      catch(e){lastError=e;loaded=null;if(!expected||i===5)throw lastError;await new Promise(r=>setTimeout(r,200));}
    }
    ({transfer,product}=loaded);
    try{photoFiles=await preparedFiles(product);photoManifest=photoFiles.map(file=>({name:file.name,size:file.size,type:file.type,lastModified:file.lastModified}));}catch{photoFiles=undefined;photoManifest=undefined;}
    updateAudit=rows=>{
      renderVintedChoices($('#live-choices'),product,rows.map(row=>({...row,detail:!row.matches&&choiceResults[row.key]?.startsWith('Manuel')?choiceResults[row.key]:''})));
      needsAttention=fatalError||(!busy&&used&&rows.some(row=>!row.matches));if($('#body').hidden)$('#toggle').textContent=needsAttention?'Orion !':'Orion';
      recovery?.observe(rows);
      if(used&&!busy)void updateAck(rows).catch(error=>{fatalError=true;$('#status').textContent=errorMessage(error);});
    };
    stopAudit?.();stopAudit=watchVintedChoices(document,product,updateAudit,{audit});
    $('#status').textContent=`Prêt : ${product.title}, ${product.photos.length} photo(s). Lancez le test lorsque le formulaire est chargé.`;
    if(expected){await waitFor(()=>visible(document.getElementById('title'))&&visible(document.getElementById('description')),20000);await acknowledgeVintedLaunch(expected,'ready');await fill(true);}
  });
}
