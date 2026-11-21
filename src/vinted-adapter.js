// Experimental, user-triggered DOM adapter. Never submits or saves a listing.
export const TRANSFER_KEY='orion-express-transfer-3.1';
export const hasBridge=()=>typeof GM_getValue==='function' && typeof GM_setValue==='function';
export async function stageTransfer(product) {
  const p=normalize(product); prepareProduct(p); // same completeness and stock validation
  const snapshot={...p,legacyV1:undefined};
  const backup=await exportBackup([snapshot]);
  if(new Blob([backup]).size>40*1024*1024)throw new Error('Transfert supérieur à 40 Mo. Utilisez le partage manuel des photos.');
  const transfer={version:1,nonce:uid(),createdAt:Date.now(),backup};
  await GM_setValue(TRANSFER_KEY,JSON.stringify(transfer));
  const saved=await GM_getValue(TRANSFER_KEY,'');
  if(saved!==JSON.stringify(transfer))throw new Error('Transfert local non confirmé. Réessayez ou utilisez la préparation manuelle.');
  return transfer;
}
export async function readTransfer() {
  const raw=await GM_getValue(TRANSFER_KEY,'');if(!raw)throw new Error('Aucun produit transmis. Revenez à Orion Express et préparez une fiche.');
  const t=JSON.parse(raw);
  if(t.version!==1 || !t.nonce || Date.now()-t.createdAt>24*60*60*1000)throw new Error('Transfert expiré : préparez de nouveau la fiche dans Orion Express.');
  const products=await readBackup(t.backup);if(products.length!==1)throw new Error('Transfert invalide.');
  return {transfer:t,product:normalize(products[0])};
}
export function setNativeValue(input,value) {
  if(!input || input.disabled || input.readOnly)throw new Error('Champ absent ou non modifiable.');
  const proto=input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;
  if(!setter)throw new Error('Type de champ non pris en charge.');
  setter.call(input,String(value));input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));input.blur();
}
export function transferFiles(input,files) {
  if(!input || input.type!=='file' || input.disabled || (!input.multiple && files.length>1))throw new Error('Sélecteur photo absent ou incompatible.');
  if(input.files.length)throw new Error('Des photos sont déjà présentes. Aucun remplacement automatique.');
  const dt=new DataTransfer();for(const file of files)dt.items.add(file);
  input.files=dt.files;
  if(input.files.length!==files.length)throw new Error('Le navigateur refuse le transfert des photos.');
  input.dispatchEvent(new Event('change',{bubbles:true}));input.dispatchEvent(new Event('input',{bubbles:true}));
}
const visible=e=>{
  if(!e || typeof e.getClientRects!=='function' || !e.isConnected || !e.getClientRects().length || e.matches(':disabled'))return false;
  const view=e.ownerDocument?.defaultView;
  for(let node=e;node?.nodeType===1;node=node.parentElement){
    if(node.hidden || node.hasAttribute('inert') || node.getAttribute('aria-hidden')==='true')return false;
    const style=view?.getComputedStyle(node);
    if(style && (style.display==='none' || ['hidden','collapse'].includes(style.visibility) || style.contentVisibility==='hidden'))return false;
  }
  return true;
};
export function uniqueField(doc,id,tag='INPUT') {
  const list=[...doc.querySelectorAll(`[id="${id}"]`)].filter(e=>e.tagName===tag && visible(e));
  if(list.length!==1)throw new Error(`Champ ${id} introuvable ou ambigu. Formulaire modifié ou non chargé.`);
  return list[0];
}
async function waitFor(find,ms=2500) {
  const end=Date.now()+ms;while(Date.now()<end){const result=find();if(result)return result;await new Promise(r=>setTimeout(r,100));}throw new Error('Composant Vinted non reconnu ou trop lent. Choisissez cette valeur manuellement.');
}
const fold=s=>String(s).normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/\s+/g,' ').trim().toLowerCase();
export function parseVintedPrice(raw) {
  if(typeof raw==='number') {if(!Number.isFinite(raw)||raw<0||!Number.isSafeInteger(Math.round(raw*100))||Math.abs(raw*100-Math.round(raw*100))>0.000001)throw new Error('Prix invalide.');return raw;}
  if(typeof raw!=='string')throw new Error('Prix invalide.');
  const text=raw.trim().replace(/\s*€$/,'').trim();
  if(!/^\d+(?:[.,]\d{1,2})?$/.test(text))throw new Error('Prix invalide : utilisez par exemple 10, 10.00, 10,00 ou 10 €.');
  return parseVintedPrice(Number(text.replace(',','.')));
}
export async function setVintedPrice(doc,raw) {
  const amount=parseVintedPrice(raw); // validate before touching the DOM
  const el=await waitFor(()=>{try{return uniqueField(doc,'price');}catch{return null;}},4500);
  const previous=el.value;
  const existing=(()=>{try{return parseVintedPrice(previous);}catch{return null;}})();
  if(existing!==null && existing!==0 && existing!==amount)throw new Error('Le prix contient déjà une autre valeur ; aucun écrasement.');
  el.focus();setNativeValue(el,amount.toFixed(2));
  await waitFor(()=>{try{return parseVintedPrice(el.value)===amount;}catch{return false;}},4500);
  // Allow a delayed formatting/controlled-state update, then check again.
  await new Promise(r=>setTimeout(r,250));
  if(parseVintedPrice(el.value)!==amount)throw new Error('Prix non conservé après formatage.');
  return `Prix vérifié : ${amount.toFixed(2)} €`;
}
const isVintedSelected=e=>{
  if(!e)return false;
  const native=e.matches('input[type=radio]')?e:e.querySelector('input[type=radio]');
  if(e.hasAttribute('aria-checked'))return e.getAttribute('aria-checked')==='true' && (!native || native.checked);
  return native?.checked===true || e.getAttribute('aria-selected')==='true';
};
async function waitForStable(find,stableMs=700,ms=4500){
  let since=0;
  return waitFor(()=>{if(!find()){since=0;return false;}if(!since)since=Date.now();return Date.now()-since>=stableMs;},ms);
}
const selectedText=e=>e?.querySelector('[data-testid$="--value"]')?.textContent ?? (e?.matches('input,select')?e.value:e?.textContent) ?? '';
function parts(value){return String(value).split(/\s*(?:>|›)\s*/).map(v=>v.trim()).filter(Boolean);}
// A visible leaf label alone cannot prove the requested category hierarchy.
const vintedCategoryEvidence=new WeakMap();
function clearVintedCategoryEvidence(doc){vintedCategoryEvidence.delete(doc);}
function categoryEvidencePath(value){return parts(value).map(fold).join(' > ');}
function hasVintedCategoryEvidence(doc,value,actual){
  const evidence=vintedCategoryEvidence.get(doc);
  return !!evidence && evidence.path===categoryEvidencePath(value) && evidence.leaf===fold(actual);
}
function optionInfo(el,target) {
  const leaves=[...el.querySelectorAll('div,span,label')].filter(n=>fold(n.textContent)===fold(target));
  const matches=fold(el.textContent)===fold(target) || leaves.length>0 || fold(el.getAttribute('aria-label'))===fold(target);
  if(!matches)return null;
  const title=el.querySelector('[data-testid$="--title"],[class*="Cell__title"]')?.textContent || target;
  if(fold(title)!==fold(target))return null;
  const body=el.querySelector('[class*="Cell__body"],[data-orion-path]')?.textContent || String(el.textContent).trim().slice(String(title).trim().length).trim();
  return {el,title:String(title).trim(),path:parts(body)};
}
function popupFor(doc,trigger,option) {
  const selector='[role=dialog],[role=menu],[role=listbox],[data-radix-popper-content-wrapper]';
  // The mobile dialog owns its footer; an inner listbox need not contain its Fait button.
  const scopeFor=node=>{
    const dialog=node.closest('[role=dialog]');
    if(visible(dialog))return dialog;
    const scope=node.matches(selector)?node:node.closest(selector);
    return visible(scope)?scope:null;
  };
  if(visible(option)){const scope=scopeFor(option);if(scope)return scope;}
  const owned=String(trigger?.getAttribute('aria-controls') || '').split(/\s+/).filter(Boolean).map(id=>doc.getElementById(id)).filter(visible);
  for(const node of owned){const scope=scopeFor(node);if(scope)return scope;return node;}
  const popups=[...doc.querySelectorAll(selector)].filter(visible);
  if(trigger?.id){
    const related=popups.filter(node=>String(node.getAttribute('aria-labelledby') || '').split(/\s+/).includes(trigger.id));
    if(related.length)return scopeFor(related.at(-1));
  }
  return popups.filter(node=>node.getAttribute('role')==='dialog').at(-1) || popups.at(-1);
}
function pickerTrigger(doc,id){
  const candidates=[...doc.querySelectorAll(`[id="${id}"]`)].filter(e=>e.isConnected&&!e.matches(':disabled'));
  const active=candidates.filter(visible);if(active.length===1)return active[0];
  // ReactModal makes the background inert/aria-hidden while its existing picker is open.
  if(candidates.length===1 && visible(popupFor(doc,candidates[0])))return candidates[0];
  return null;
}
export async function selectVintedChoice(doc,id,value) {
  if(id==='condition')return selectVintedCondition(doc,value);
  if(id==='category')clearVintedCategoryEvidence(doc);
  const path=parts(value);if(!path.length)throw new Error('Valeur manquante dans la fiche.');const target=path.at(-1);
  const trigger=await waitFor(()=>pickerTrigger(doc,id),4500);
  const searchId=id==='category'?'catalog-search-input':`${id}-search-input`;
  const menuVisible=()=>visible(doc.getElementById(searchId)) || visible(popupFor(doc,trigger));
  if(fold(selectedText(trigger))===fold(target) && path.length===1 && trigger.getAttribute('aria-expanded')!=='true' && !menuVisible())return `Sélection vérifiée : ${target}`;
  if(trigger.getAttribute('aria-expanded')!=='true' && !menuVisible())trigger.click();
  try {
    const search=await waitFor(()=>{
      const exact=doc.getElementById(searchId);
      if(visible(exact))return exact;
      const popup=popupFor(doc,trigger);return popup && [...popup.querySelectorAll('input')].find(e=>visible(e) && /search/i.test(e.id+e.getAttribute('placeholder')));
    },id==='condition'?500:1800).catch(()=>null);
    if(search)setNativeValue(search,target);
    let chosen;
    const findChoice=()=>{
      const scope=popupFor(doc,trigger) || doc;
      const nodes=[...scope.querySelectorAll('[role=option],[role=radio]')].filter(visible);
      const matches=nodes.map(el=>optionInfo(el,target)).filter(Boolean).filter(info=>id!=='category' || path.length===1 || fold(info.path.join(' > '))===fold(path.slice(0,-1).join(' > ')));
      return matches.length===1?matches[0]:null;
    };
    chosen=await waitFor(findChoice,4500);
    const menuRoot=popupFor(doc,trigger,chosen.el);
    const closed=()=>visible(doc.getElementById(id)) && doc.getElementById(id)?.getAttribute('aria-expanded')!=='true' && fold(selectedText(doc.getElementById(id)))===fold(target) && !findChoice() && (!menuRoot || !menuRoot.isConnected || !visible(menuRoot)) && (!search || !visible(doc.getElementById(search.id)));
    // Selection belongs to the live component. A nested native checked flag alone is not enough.
    if(!isVintedSelected(chosen.el))chosen.el.click();
    try{await waitFor(()=>isVintedSelected(findChoice()?.el)||closed(),500);}catch{
      const cell=findChoice()?.el;
      const radio=cell?.matches('input[type=radio]')?cell:cell?.querySelector('input[type=radio]');
      if(radio && !radio.disabled)radio.click(); // only the same exact option, once
    }
    await waitFor(()=>isVintedSelected(findChoice()?.el)||closed(),3500);
    // Only exact confirmation labels; never Add/Publish/Save draft.
    const confirm=await waitFor(()=>{
      if(closed())return {closed:true};
      if(!isVintedSelected(findChoice()?.el))return null;
      const scope=popupFor(doc,trigger,findChoice()?.el) || doc;
      const buttons=[...scope.querySelectorAll('button')].filter(e=>visible(e) && e.getAttribute('aria-disabled')!=='true' && ['fait','listo','hecho','done'].includes(fold(e.textContent)));
      if(buttons.length===1)return {button:buttons[0]};return null;
    },4500);
    if(confirm.button){if(!isVintedSelected(findChoice()?.el))throw new Error('Option non sélectionnée : confirmation annulée.');confirm.button.click();}
    await waitForStable(closed,300);
    if(id==='category' && path.length>1)vintedCategoryEvidence.set(doc,{path:categoryEvidencePath(value),leaf:fold(target)});
    return `Sélection vérifiée : ${chosen.title}${id==='category' && chosen.path.length?' ('+chosen.path.join(' > ')+')':''}`;
  }catch(e){throw new Error(`${id} : ${errorMessage(e)}`);}
}
export function vintedShippingSize(value){
  const aliases={petit:1,pequeno:1,small:1,moyen:2,mediano:2,medium:2,grand:3,grande:3,large:3};const size=aliases[fold(value)];
  if(!size)throw new Error('Format du colis non reconnu ou manquant dans la fiche.');
  return size;
}
function shippingSelected(doc,size){
  const radio=doc.getElementById(`package_type_selector_${size}`),cell=doc.getElementById(`package-size-${size}`);
  if(!radio || !cell || !visible(cell) || !radio.checked)return false;
  if([...doc.querySelectorAll('input[id^="package_type_selector_"]:checked')].some(e=>e!==radio))return false;
  if(cell.hasAttribute('aria-checked') && cell.getAttribute('aria-checked')!=='true')return false;
  // The real Vinted selected cell becomes role=presentation; unselected cells remain role=button.
  const cells=[...doc.querySelectorAll('[id^="package-size-"]')];
  if(cells.some(e=>e.getAttribute('role')==='presentation') && cell.getAttribute('role')!=='presentation')return false;
  return true;
}
export async function selectVintedShipping(doc,value) {
  const size=vintedShippingSize(value);
  await waitFor(()=>{const cell=doc.getElementById(`package-size-${size}`);return visible(cell) && doc.getElementById(`package_type_selector_${size}`);},6000);
  for(let attempt=0;attempt<2;attempt++){
    if(!shippingSelected(doc,size)) {
      const cell=doc.getElementById(`package-size-${size}`),radio=doc.getElementById(`package_type_selector_${size}`);
      const label=[...cell.querySelectorAll('label')].find(l=>l.htmlFor===radio.id) || [...doc.querySelectorAll('label')].find(l=>l.htmlFor===radio.id);
      const control=[cell,label,radio].find(visible);if(!control)throw new Error('Choix du colis non accessible.');control.click();
      try{await waitFor(()=>shippingSelected(doc,size),600);}catch{const liveRadio=doc.getElementById(`package_type_selector_${size}`);if(liveRadio && !liveRadio.disabled)liveRadio.click();}
    }
    try{await waitForStable(()=>shippingSelected(doc,size),900,2200);return `Colis vérifié : ${value}`;}catch{if(attempt===1)throw new Error('Le colis demandé ne reste pas sélectionné. Vérifiez le format dans Vinted.');}
  }
}
export async function applyVintedProduct(doc,product,report,{photos=true}={}) {
  const hadContent=['title','description'].some(id=>String(doc.getElementById(id)?.value || '').trim());
  const results={};const attempt=async(key,fn)=>{try{const message=await fn();results[key]=message || 'À vérifier dans Vinted';}catch(e){results[key]='Manuel : '+errorMessage(e);}report({...results});};
  // Photos first: later category-dependent fields must follow native upload/loading updates.
  if(photos)await attempt('photos',async()=>{
    if(hadContent)throw new Error('Le formulaire contenait déjà du texte : ajout automatique de photos désactivé pour éviter les doublons.');
    const inputs=[...doc.querySelectorAll('input[type=file]')].filter(e=>!e.disabled && e.multiple);
    if(inputs.length!==1)throw new Error('Sélecteur photo absent ou ambigu.');
    const files=await preparedFiles({photos:product.photos});transferFiles(inputs[0],files);
    await waitForStable(()=>![...doc.querySelectorAll('[role=progressbar],[aria-busy="true"]')].some(visible),900,15000);
    return 'Fichiers transmis au sélecteur ; téléversement à vérifier';
  });
  // Resume an already-open category modal before accessing its hidden background fields.
  if(!photos)await attempt('category',()=>selectVintedChoice(doc,'category',product.category));
  // No submit, no buttons selected by generic text such as "Ajouter".
  for(const key of ['title','description'])await attempt(key,async()=>{
    const el=uniqueField(doc,key,key==='description'?'TEXTAREA':'INPUT');
    const value=product[key];
    if(el.value && el.value!==String(value) && !(key==='price' && Number(el.value.replace('€','').replace(',','.').trim())===0))throw new Error('Ce champ contient déjà une autre valeur ; aucun écrasement.');
    setNativeValue(el,value);if(el.value!==String(value))throw new Error('Valeur non conservée par le formulaire.');
  });
  await attempt('price',()=>setVintedPrice(doc,product.price));
  if(photos)await attempt('category',()=>selectVintedChoice(doc,'category',product.category));
  for(const key of ['brand','condition'])await attempt(key,()=>{if(results.category?.startsWith('Manuel'))throw new Error('Choisissez et confirmez la catégorie avant ce champ.');return selectVintedChoice(doc,key,product[key]);});
  // Recheck the precise condition after dependent loading, before the parcel. No new photos on retry.
  const verifyCategory=async()=>{
    const target=parts(product.category).at(-1);
    await waitForStable(()=>{const trigger=doc.getElementById('category');return trigger && fold(selectedText(trigger))===fold(target) && trigger.getAttribute('aria-expanded')!=='true' && !visible(doc.getElementById('catalog-search-input'));},400);
    return results.category;
  };
  if(!results.category?.startsWith('Manuel'))await attempt('category',verifyCategory);
  if(!results.category?.startsWith('Manuel') && !results.condition?.startsWith('Manuel'))await attempt('condition',()=>selectVintedCondition(doc,product.condition));
  await attempt('shipping',()=>{if(results.category?.startsWith('Manuel'))throw new Error('Choisissez et confirmez la catégorie avant ce champ.');return selectVintedShipping(doc,product.shipping);});
  if(!results.category?.startsWith('Manuel'))await attempt('category',verifyCategory);
  // Additional category attributes have no mapping in V1/V2: never guess them.
  results.dynamic='Manuel : vérifiez tous les champs supplémentaires de la catégorie';report({...results});return results;
}
