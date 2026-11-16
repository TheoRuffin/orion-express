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
const visible=e=>!!e && !!(e.getClientRects().length) && !e.disabled;
export function uniqueField(doc,id,tag='INPUT') {
  const list=[...doc.querySelectorAll(`[id="${id}"]`)].filter(e=>e.tagName===tag && visible(e));
  if(list.length!==1)throw new Error(`Champ ${id} introuvable ou ambigu. Formulaire modifié ou non chargé.`);
  return list[0];
}
async function waitFor(find,ms=2500) {
  const end=Date.now()+ms;while(Date.now()<end){const result=find();if(result)return result;await new Promise(r=>setTimeout(r,100));}throw new Error('Composant Vinted non reconnu ou trop lent. Choisissez cette valeur manuellement.');
}
const fold=s=>String(s).normalize('NFD').replace(/\p{Diacritic}/gu,'').trim().toLowerCase();
export async function selectVintedChoice(doc,id,value) {
  if(!value)throw new Error('Valeur manquante dans la fiche.');
  const triggers=[...doc.querySelectorAll(`[id="${id}"]`)].filter(visible);
  if(triggers.length!==1)throw new Error(`Sélecteur ${id} absent ou ambigu.`);
  const trigger=triggers[0];
  const target=value.split('>').at(-1).trim();
  if(fold(trigger.textContent)===fold(value) || fold(trigger.value??'')===fold(value))return;
  trigger.click();
  try{
    const search=await waitFor(()=>{
      if(id==='category')return [...doc.querySelectorAll('#catalog-search-input')].find(visible);
      const owned=doc.getElementById(trigger.getAttribute('aria-controls') || '');
      const popup=owned || [...doc.querySelectorAll('[role=dialog],[role=listbox],[data-radix-popper-content-wrapper]')].filter(visible).at(-1);
      return popup && [...popup.querySelectorAll('input')].find(e=>visible(e) && /search/i.test(e.id+e.getAttribute('placeholder')));
    },700).catch(()=>null);
    if(search)setNativeValue(search,value.split('>').at(-1).trim());
    const option=await waitFor(()=>{
      const nodes=[...doc.querySelectorAll('[role="option"],[role="radio"],button[id^="catalog-"],button[id^="brand-"],[data-testid*="condition"]')].filter(visible);
      const matches=nodes.filter(e=>fold(e.textContent)===fold(target) || [...e.children].some(c=>fold(c.textContent)===fold(target)));
      return matches.length===1?matches[0]:null;
    });option.click();
  }catch(e){doc.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));throw e;}
}
export async function applyVintedProduct(doc,product,report,{photos=true}={}) {
  const hadContent=['title','description'].some(id=>String(doc.getElementById(id)?.value || '').trim());
  const results={};const attempt=async(key,fn)=>{try{await fn();results[key]='À vérifier dans Vinted';}catch(e){results[key]='Manuel : '+errorMessage(e);}report({...results});};
  // Text first: no submit, no buttons selected by generic text such as "Ajouter".
  for(const key of ['title','description','price'])await attempt(key,async()=>{
    const el=uniqueField(doc,key,key==='description'?'TEXTAREA':'INPUT');
    const value=key==='price'?product.price.toFixed(2).replace('.',','):product[key];
    if(el.value && el.value!==String(value) && !(key==='price' && Number(el.value.replace('€','').replace(',','.').trim())===0))throw new Error('Ce champ contient déjà une autre valeur ; aucun écrasement.');
    setNativeValue(el,value);if(el.value!==String(value))throw new Error('Valeur non conservée par le formulaire.');
  });
  await attempt('category',()=>selectVintedChoice(doc,'category',product.category));
  for(const key of ['brand','condition'])await attempt(key,()=>{if(results.category?.startsWith('Manuel'))throw new Error('Choisissez la catégorie avant ce champ.');return selectVintedChoice(doc,key,product[key]);});
  await attempt('shipping',async()=>{
    const aliases={petit:1,pequeno:1,small:1,moyen:2,mediano:2,medium:2,grand:3,grande:3,large:3};const size=aliases[fold(product.shipping)];
    if(!size)throw new Error('Format du colis non reconnu.');
    const radios=[...doc.querySelectorAll('[id^="package_type_selector_"]')].filter(visible);const checked=radios.find(e=>e.checked);
    // Product selection explicitly requests this parcel size, including replacing a suggested default.
    if(checked?.id===`package_type_selector_${size}`)return;
    const radio=doc.getElementById(`package_type_selector_${size}`);if(!visible(radio))throw new Error('Choix du colis non reconnu.');radio.click();
  });
  if(photos)await attempt('photos',async()=>{
    if(hadContent)throw new Error('Le formulaire contenait déjà du texte : ajout automatique de photos désactivé pour éviter les doublons.');
    const inputs=[...doc.querySelectorAll('input[type=file]')].filter(e=>!e.disabled && e.multiple);
    if(inputs.length!==1)throw new Error('Sélecteur photo absent ou ambigu.');
    const files=await preparedFiles({photos:product.photos});transferFiles(inputs[0],files);
    results.photos='Fichiers transmis au sélecteur ; téléversement à vérifier';
  });
  // Additional category attributes have no mapping in V1/V2: never guess them.
  results.dynamic='Manuel : vérifiez tous les champs supplémentaires de la catégorie';report({...results});return results;
}
