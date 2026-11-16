async function launchVintedTest(product) {
  if(!hasBridge()){await startPreparation(product);status('Transfert extension indisponible : préparation manuelle ouverte.');return;}
  const t=await stageTransfer(product);
  main.innerHTML=`<button id="test-back">← Retour à la fiche</button><h2>Transfert prêt</h2><p>Produit et photos enregistrés dans le stockage de Violentmonkey ; transfert valable 24 heures. Aucun serveur de transfert.</p><a class="primary vinted-link" href="https://www.vinted.es/items/new#orion=${encodeURIComponent(t.nonce)}" target="_blank" rel="noopener noreferrer">Ouvrir Vinted et préremplir (test) ↗</a><p>Expérimental : contrôlez tous les champs et les images. Le script ne publie ni ne sauvegarde de brouillon. Les valeurs supplémentaires inconnues restent manuelles.</p><button id="manual-prep">Utiliser la préparation manuelle</button>`;
  bind('#test-back',()=>preview(product.id));bind('#manual-prep',()=>startPreparation(product));
}
async function initVintedAssistant(){
  const host=document.createElement('div');host.id='orion-vinted-test';host.style.cssText='position:fixed;right:8px;bottom:8px;z-index:2147483646;max-width:calc(100vw - 16px);width:360px';
  const root=host.attachShadow({mode:'open'});root.innerHTML=`<style>:host{font:15px -apple-system,sans-serif;color:#172b35}*{box-sizing:border-box}section{padding:14px;background:#f6f5ef;border:2px solid #087b67;border-radius:14px;max-height:55vh;overflow:auto}button,a{font:inherit;display:inline-block;padding:12px;min-height:44px;margin:4px;border-radius:9px;border:1px solid #087b67;background:white;color:#087b67}p,li{line-height:1.4}ul{padding-left:18px}textarea{width:100%;font-size:16px}</style><section><button id="toggle">Réduire</button><div id="body"><b>Orion Express · préremplissage expérimental</b><p id="status" role="status">Chargement du transfert local…</p><button id="fill" disabled>Préremplir une seule fois</button><button id="retry" disabled>Réessayer les textes et choix (sans photos)</button><ul id="result"></ul><p>Aucune publication ni sauvegarde de brouillon automatique. La présence dans un champ ne confirme pas sa validation par Vinted. Vérifiez les photos et les champs dépendants après chaque changement de catégorie.</p><a href="https://example.com/" target="_blank" rel="noopener">Retour au catalogue</a><button id="clear">Effacer le transfert local</button></div></section>`;document.body.append(host);
  const $=s=>root.querySelector(s);let busy=false,used=false,product,transfer;
  $('#toggle').onclick=()=>{const body=$('#body');body.hidden=!body.hidden;$('#toggle').textContent=body.hidden?'Ouvrir Orion':'Réduire';};
  const run=async(fn)=>{if(busy)return;busy=true;$('#fill').disabled=true;$('#retry').disabled=true;try{await fn();}catch(e){$('#status').textContent=errorMessage(e);}finally{busy=false;$('#fill').disabled=used||!product;$('#retry').disabled=!used||!product;}};
  const perform=async(photos)=>{
    if(location.pathname!=='/items/new')throw new Error('Ouvrez le formulaire de création Vinted.');
    if(!navigator.onLine)throw new Error('Connexion indisponible. Aucun transfert lancé.');
    uniqueField(document,'title');uniqueField(document,'description','TEXTAREA');
    if(photos){const lock=await GM_getValue(TRANSFER_KEY+'-used','');if(lock===transfer.nonce){used=true;throw new Error('Ce transfert a déjà été tenté. Reprenez les textes sans photos ou préparez de nouveau la fiche.');}await GM_setValue(TRANSFER_KEY+'-used',transfer.nonce);used=true;}
    const draw=results=>{$('#result').replaceChildren();for(const [k,v]of Object.entries(results)){const li=document.createElement('li');li.textContent=`${Object.fromEntries(PREP_FIELDS)[k] || ({photos:'Photos',dynamic:'Champs supplémentaires'})[k] || k} : ${v}`;$('#result').append(li);}};
    await applyVintedProduct(document,product,draw,{photos});$('#status').textContent='Tentative terminée. Vérifiez chaque champ et chaque miniature native Vinted. Rien n’a été publié.';
  };
  const fill=async photos=>{if(!navigator.locks?.request)throw new Error('Verrou de sécurité indisponible dans ce navigateur. Utilisez la préparation manuelle.');return navigator.locks.request('orion-express-fill',()=>perform(photos));};
  $('#fill').onclick=()=>run(()=>fill(true));$('#retry').onclick=()=>run(()=>fill(false));
  $('#clear').onclick=()=>run(async()=>{await GM_deleteValue(TRANSFER_KEY);product=null;$('#status').textContent='Transfert local effacé. Catalogue conservé.';});
  await run(async()=>{({transfer,product}=await readTransfer());const expected=new URLSearchParams(location.hash.slice(1)).get('orion');if(expected && expected!==transfer.nonce)throw new Error('Ce lien correspond à un autre transfert. Préparez de nouveau la fiche.');$('#status').textContent=`Prêt : ${product.title}, ${product.photos.length} photo(s). Lancez le test lorsque le formulaire est chargé.`;if(expected){await waitFor(()=>visible(document.getElementById('title')),12000);await fill(true);}});
}
