// ==UserScript==
// @name Orion Express
// @namespace https://github.com/TheoRuffin/orion-express
// @version 3.1.0
// @description Catalogue local et préremplissage expérimental Vinted Espagne, sans publication.
// @match https://example.com/*
// @run-at document-end
// @noframes
// @match https://www.vinted.es/items/new*
// @grant GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
// @inject-into auto
// @updateURL https://raw.githubusercontent.com/TheoRuffin/orion-express/main/orion-express.meta.js
// @downloadURL https://raw.githubusercontent.com/TheoRuffin/orion-express/main/orion-express.user.js
// @homepageURL https://github.com/TheoRuffin/orion-express
// @supportURL https://github.com/TheoRuffin/orion-express/issues
// ==/UserScript==

(() => {
'use strict';
// No network access. Existing records are normalized in memory, never rewritten on open.
const DB_NAME = 'orion-express-db';
const MAX_BACKUP = 100 * 1024 * 1024;
const uid = () => crypto.randomUUID();
const clone = value => structuredClone(value);
function remaining(p) { return p.initialStock - p.sales.reduce((n, s) => n + s.quantity, 0); }
function normalize(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Fiche invalide.');
  const p = { ...clone(raw), schemaVersion: 2 };
  for (const key of ['title','description','category','brand','condition','shipping']) p[key] = String(raw[key] ?? '');
  p.price = Number(String(raw.price ?? 0).replace(',', '.').replace(/\s*€$/, ''));
  p.photos = raw.photos === undefined ? [] : clone(raw.photos);
  p.initialStock = raw.initialStock === undefined ? 1 : raw.initialStock;
  p.sales = raw.sales === undefined ? [] : clone(raw.sales);
  validate(p);
  return p;
}
function validate(p) {
  if (!(typeof p.id === 'string' && p.id.length || typeof p.id === 'number' && Number.isFinite(p.id))) throw new Error('Identifiant invalide.');
  if (!Number.isFinite(p.price) || p.price < 0) throw new Error('Prix invalide.');
  if (!Number.isSafeInteger(p.initialStock) || p.initialStock < 0) throw new Error('Stock initial invalide.');
  if (!Array.isArray(p.photos) || !Array.isArray(p.sales)) throw new Error('Photos ou ventes invalides.');
  for (const s of p.sales) {
    if (!s || !Number.isSafeInteger(s.quantity) || s.quantity <= 0 || !Number.isFinite(s.unitPrice) || s.unitPrice < 0 || !Number.isFinite(Date.parse(s.date))) throw new Error('Vente invalide.');
  }
  if (remaining(p) < 0) throw new Error('Stock insuffisant.');
  return p;
}
function errorMessage(e) {
  if (e?.name === 'QuotaExceededError') return 'Stockage plein : aucune modification enregistrée. Exportez une sauvegarde et libérez de l’espace.';
  if (e?.name === 'SecurityError') return 'Stockage inaccessible. Utilisez un onglet normal et autorisez le stockage du site.';
  return e?.message || 'Opération impossible. Les données existantes sont conservées.';
}
function openDB(factory = indexedDB) {
  return new Promise((resolve, reject) => {
    // No hard-coded version: retain the original version and object store.
    const req = factory.open(DB_NAME);
    let blocked = false;
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains('products')) req.result.createObjectStore('products', { keyPath: 'id' });
    };
    req.onblocked = () => { blocked = true; reject(new Error('Fermez les autres onglets example.com puis réessayez.')); };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const db = req.result;
      if (blocked) { db.close(); return; }
      db.onversionchange = () => db.close();
      if (!db.objectStoreNames.contains('products')) { db.close(); reject(new Error('Schéma V1 non reconnu : aucune donnée modifiée.')); return; }
      const store = db.transaction('products').objectStore('products');
      if (store.keyPath !== 'id' && store.keyPath !== null) { db.close(); reject(new Error('Clé V1 non reconnue : aucune donnée modifiée.')); return; }
      resolve(db);
    };
  });
}
class Products {
  constructor(db) { this.db = db; }
  transaction(mode, run) {
    return new Promise((resolve, reject) => {
      let result, failure;
      const tx = this.db.transaction('products', mode);
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => {}; // onabort is authoritative: requests may succeed before commit fails.
      tx.onabort = () => reject(failure || tx.error || new Error('Transaction annulée.'));
      const store = tx.objectStore('products');
      const fail = e => { failure = e; tx.abort(); };
      try { run(store, v => { result = v; }, fail); } catch (e) { fail(e); }
    });
  }
  allRaw() { return this.transaction('readonly', (s, done, fail) => {
    const records = s.getAll();
    s.getAllKeys().onsuccess = e => {
      const rows = records.result;
      if (rows.some((p,i) => p.id !== e.target.result[i])) { fail(new Error('Clés V1 non reconnues : aucune donnée modifiée.')); return; }
      done(rows);
    };
  }); }
  async all() { return (await this.allRaw()).map(normalize); }
  get(id) { return this.transaction('readonly', (s, done, fail) => { s.get(id).onsuccess = e => { try { done(e.target.result === undefined ? undefined : normalize(e.target.result)); } catch (err) { fail(err); } }; }); }
  mutate(id, change) {
    return this.transaction('readwrite', (s, done, fail) => {
      s.get(id).onsuccess = e => {
        try {
          const old = e.target.result;
          const next = normalize(change(old === undefined ? undefined : normalize(old)));
          if (old && old.schemaVersion !== 2) next.legacyV1 = clone(old);
          next.updatedAt = new Date(Math.max(Date.now(), (Date.parse(old?.updatedAt) || 0) + 1)).toISOString();
          if (s.keyPath === null) s.put(next, id); else s.put(next);
          done(next);
        } catch (err) { fail(err); }
      };
    });
  }
  create(fields = {}) {
    const id = uid();
    return this.mutate(id, () => ({ ...fields, id, initialStock: fields.initialStock ?? 1, sales: fields.sales ?? [], photos: fields.photos ?? [] }));
  }
  update(id, patch, expected = null) { return this.mutate(id, old => {
    if (!old) throw new Error('Fiche introuvable.');
    if (expected !== null && old.updatedAt !== expected.updatedAt) throw new Error('Cette fiche a changé dans un autre onglet. Vos modifications ne sont pas enregistrées ; copiez votre texte puis rouvrez la fiche.');
    return { ...old, ...patch, id };
  }); }
  async duplicate(id) {
    const old = await this.get(id);
    if (!old) throw new Error('Fiche introuvable.');
    const { legacyV1, ...fields } = old;
    return this.create({ ...fields, title: old.title + ' (copie)', sales: [], initialStock: old.initialStock });
  }
  sell(id, quantity, unitPrice) {
    return this.mutate(id, old => {
      if (!old) throw new Error('Fiche introuvable.');
      return { ...old, sales: [...old.sales, { id: uid(), date: new Date().toISOString(), quantity, unitPrice }] };
    });
  }
  remove(id) { return this.transaction('readwrite', (s) => { s.delete(id); }); }
  importCopies(records) {
    // Prevalidate all records before opening the single atomic transaction; never overwrite a key.
    const copies = records.map(raw => normalize({ ...raw, id: uid(), importedFrom: raw.id }));
    return this.transaction('readwrite', (s, done) => {
      for (const p of copies) { if (s.keyPath === null) s.add(p, p.id); else s.add(p); }
      done(copies.length);
    });
  }
}
function blobData(blob) {
  return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(r.error); r.readAsDataURL(blob); });
}
async function photoURL(photo) {
  if (photo instanceof Blob) return blobData(photo);
  if (typeof photo === 'string' && /^data:image\/(png|jpeg|jpg|webp|gif|avif|heic|heif);base64,/i.test(photo)) return photo;
  if (photo && typeof photo === 'object') {
    for (const key of ['dataUrl','dataURL','data','blob','url','src']) if (photo[key] !== undefined) return photoURL(photo[key]);
  }
  // Never fetch a remote photo or use an ephemeral blob URL as a durable backup.
  throw new Error('Format photo V1 non affichable. Original conservé ; exportez avant de le remplacer.');
}
async function pack(value) {
  if (value instanceof Blob) return { __orionBlob: 1, type: value.type, name: value.name ?? null, data: await blobData(value) };
  if (Array.isArray(value)) return Promise.all(value.map(pack));
  if (value && typeof value === 'object') {
    if (Object.hasOwn(value, '__orionBlob')) throw new Error('Champ réservé dans la sauvegarde.');
    const out = Object.create(null);
    for (const [k, v] of Object.entries(value)) out[k] = await pack(v);
    return out;
  }
  return value;
}
function unpack(value) {
  if (value && typeof value === 'object' && value.__orionBlob === 1) {
    if (typeof value.data !== 'string' || !/^data:[^,]*;base64,/.test(value.data)) throw new Error('Photo corrompue.');
    const bytes = Uint8Array.from(atob(value.data.split(',')[1]), c => c.charCodeAt(0));
    return value.name === null ? new Blob([bytes], { type: value.type }) : new File([bytes], value.name, { type: value.type });
  }
  if (Array.isArray(value)) return value.map(unpack);
  if (value && typeof value === 'object') {
    const out = Object.create(null);
    for (const [k,v] of Object.entries(value)) {
      if (['__proto__','constructor','prototype'].includes(k)) throw new Error('Champ interdit.');
      out[k] = unpack(v);
    }
    return out;
  }
  return value;
}
async function digest(text) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2,'0')).join('');
}
async function exportBackup(records) {
  const payload = JSON.stringify(await pack(records));
  const text = JSON.stringify({ format: 'orion-express', version: 2, createdAt: new Date().toISOString(), sha256: await digest(payload), payload });
  if (new Blob([text]).size > MAX_BACKUP) throw new Error('Sauvegarde supérieure à 100 Mo : export annulé.');
  return text;
}
async function readBackup(text) {
  if (new Blob([text]).size > MAX_BACKUP) throw new Error('Sauvegarde supérieure à 100 Mo.');
  const b = JSON.parse(text);
  if (b.format !== 'orion-express' || b.version !== 2 || typeof b.payload !== 'string' || await digest(b.payload) !== b.sha256) throw new Error('Sauvegarde non reconnue ou intégrité invalide.');
  const records = unpack(JSON.parse(b.payload));
  if (!Array.isArray(records)) throw new Error('Liste de fiches invalide.');
  records.forEach(normalize);
  return records;
}
const listing = p => [p.title, p.description, `Prix : ${p.price.toFixed(2)} €`, `Catégorie : ${p.category}`, `Marque : ${p.brand}`, `État : ${p.condition}`, `Colis : ${p.shipping}`].join('\n\n');

// Independent local workspace: never opens or modifies the product database.
const VINTED_NEW = 'https://www.vinted.es/items/new';
const PREP_FIELDS = [['title','Titre / Título'],['description','Description / Descripción'],['price','Prix / Precio'],['category','Catégorie / Categoría'],['brand','Marque / Marca'],['condition','État / Estado'],['shipping','Colis / Tamaño del paquete']];
function prepareProduct(raw) {
  const p = normalize(raw);
  if (!p.title.trim() || !p.description.trim() || p.price <= 0 || !p.photos.length || remaining(p) < 1) throw new Error('Ajoutez un titre, une description, un prix positif, au moins une photo et du stock avant de préparer.');
  const fields = Object.fromEntries(PREP_FIELDS.map(([key]) => [key,key === 'price' ? p.price.toFixed(2).replace('.',',') : p[key]]));
  return {id:'active', version:1, sourceId:p.id, createdAt:new Date().toISOString(), fields, photos:structuredClone(p.photos), checked:{}, categoryChecked:false};
}
function checkPreparation(p, key, checked) {
  if (![...PREP_FIELDS.map(([k])=>k),'photos','dynamic','review'].includes(key)) throw new Error('Étape inconnue.');
  const next = structuredClone(p); next.checked[key] = checked;
  if (key === 'category') { next.checked.dynamic=false; next.checked.brand=false; next.checked.condition=false; next.checked.shipping=false; next.checked.review=false; }
  if (key !== 'review') next.checked.review=false;
  return next;
}
function prepStore() {
  return new Promise((resolve,reject) => {
    const q=indexedDB.open('orion-express-preparations',1);
    q.onupgradeneeded=()=>q.result.createObjectStore('workspace',{keyPath:'id'});
    q.onerror=()=>reject(q.error); q.onblocked=()=>reject(new Error('Fermez les autres onglets Orion Express puis réessayez.'));
    q.onsuccess=()=>{ const db=q.result; db.onversionchange=()=>db.close(); resolve({
      run(mode,op) { return new Promise((yes,no)=>{let value;const tx=db.transaction('workspace',mode);tx.oncomplete=()=>yes(value);tx.onabort=()=>no(tx.error || new Error('Préparation non enregistrée.'));tx.onerror=()=>{}; const req=op(tx.objectStore('workspace')); if(req) req.onsuccess=()=>{value=req.result;};}); },
      async get(){return this.run('readonly',s=>s.get('active'));},
      async put(p){await this.run('readwrite',s=>s.put(p));},
      async clear(){await this.run('readwrite',s=>s.delete('active'));},
      close(){db.close();}
    });};
  });
}
async function preparedFiles(p) {
  const files=[];
  for(let i=0;i<p.photos.length;i++) {
    const url=await photoURL(p.photos[i]);
    const match=/^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i.exec(url);
    if(!match) throw new Error(`Photo ${i+1} non réutilisable. Original conservé ; remplacez-la dans la fiche.`);
    const bytes=Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0));
    if(!bytes.length) throw new Error(`Photo ${i+1} vide.`);
    const type=match[1].toLowerCase(); const ext=type.split('/')[1].replace('jpeg','jpg');
    files.push(new File([bytes],`orion-photo-${String(i+1).padStart(2,'0')}.${ext}`,{type}));
  }
  return files;
}
// ZIP STORE with CRC32, UTF-8 names, no dependency and no remote service.
async function photoArchive(files, fields) {
  const text=PREP_FIELDS.map(([k,label])=>`${label} :\n${fields[k] || 'À choisir dans Vinted'}`).join('\n\n');
  const all=[...files,new File([text],'annonce.txt',{type:'text/plain'})], chunks=[],central=[];
  let offset=0;
  for(const f of all) {
    const data=new Uint8Array(await f.arrayBuffer()),name=new TextEncoder().encode(f.name);
    let crc=0xffffffff;
    for(const byte of data){crc^=byte;for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
    crc=(crc^0xffffffff)>>>0;
    const header=new Uint8Array(30+name.length), h=new DataView(header.buffer);
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint16(12,33,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,name.length,true);header.set(name,30);
    const entry=new Uint8Array(46+name.length),c=new DataView(entry.buffer);
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint16(14,33,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);entry.set(name,46);
    chunks.push(header,data);central.push(entry);offset+=header.length+data.length;
  }
  const size=central.reduce((n,b)=>n+b.length,0),end=new Uint8Array(22),e=new DataView(end.buffer);
  e.setUint32(0,0x06054b50,true);e.setUint16(8,all.length,true);e.setUint16(10,all.length,true);e.setUint32(12,size,true);e.setUint32(16,offset,true);
  return new File([...chunks,...central,end],'orion-vinted-photos.zip',{type:'application/zip'});
}

// Experimental, user-triggered DOM adapter. Never submits or saves a listing.
const TRANSFER_KEY='orion-express-transfer-3.1';
const hasBridge=()=>typeof GM_getValue==='function' && typeof GM_setValue==='function';
async function stageTransfer(product) {
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
async function readTransfer() {
  const raw=await GM_getValue(TRANSFER_KEY,'');if(!raw)throw new Error('Aucun produit transmis. Revenez à Orion Express et préparez une fiche.');
  const t=JSON.parse(raw);
  if(t.version!==1 || !t.nonce || Date.now()-t.createdAt>24*60*60*1000)throw new Error('Transfert expiré : préparez de nouveau la fiche dans Orion Express.');
  const products=await readBackup(t.backup);if(products.length!==1)throw new Error('Transfert invalide.');
  return {transfer:t,product:normalize(products[0])};
}
function setNativeValue(input,value) {
  if(!input || input.disabled || input.readOnly)throw new Error('Champ absent ou non modifiable.');
  const proto=input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;
  if(!setter)throw new Error('Type de champ non pris en charge.');
  setter.call(input,String(value));input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));input.blur();
}
function transferFiles(input,files) {
  if(!input || input.type!=='file' || input.disabled || (!input.multiple && files.length>1))throw new Error('Sélecteur photo absent ou incompatible.');
  if(input.files.length)throw new Error('Des photos sont déjà présentes. Aucun remplacement automatique.');
  const dt=new DataTransfer();for(const file of files)dt.items.add(file);
  input.files=dt.files;
  if(input.files.length!==files.length)throw new Error('Le navigateur refuse le transfert des photos.');
  input.dispatchEvent(new Event('change',{bubbles:true}));input.dispatchEvent(new Event('input',{bubbles:true}));
}
const visible=e=>!!e && !!(e.getClientRects().length) && !e.disabled;
function uniqueField(doc,id,tag='INPUT') {
  const list=[...doc.querySelectorAll(`[id="${id}"]`)].filter(e=>e.tagName===tag && visible(e));
  if(list.length!==1)throw new Error(`Champ ${id} introuvable ou ambigu. Formulaire modifié ou non chargé.`);
  return list[0];
}
async function waitFor(find,ms=2500) {
  const end=Date.now()+ms;while(Date.now()<end){const result=find();if(result)return result;await new Promise(r=>setTimeout(r,100));}throw new Error('Composant Vinted non reconnu ou trop lent. Choisissez cette valeur manuellement.');
}
const fold=s=>String(s).normalize('NFD').replace(/\p{Diacritic}/gu,'').trim().toLowerCase();
async function selectVintedChoice(doc,id,value) {
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
async function applyVintedProduct(doc,product,report,{photos=true}={}) {
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

const APP_CSS = ":host{all:initial;font:16px -apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;color:#172b35}*{box-sizing:border-box}.shell{height:100%;overflow:auto;background:#f6f5ef;padding:24px max(20px,env(safe-area-inset-right)) max(24px,env(safe-area-inset-bottom)) max(20px,env(safe-area-inset-left));-webkit-overflow-scrolling:touch}header,header>div,.toolbar,.stats,.card,dl>div{display:flex;align-items:center}header{justify-content:space-between;max-width:900px;margin:auto}header>div{display:block}small{font-size:10px;letter-spacing:.14em;font-weight:700;color:#55716f}h1{font-size:28px;letter-spacing:-1px;margin:5px 0 12px}h1 em{font-family:Georgia,serif;font-weight:400;color:#087b67}h2{font-size:30px;line-height:1.12;letter-spacing:-.8px;margin:14px 0 22px}h3{font-size:18px;margin:10px 0}p{line-height:1.6}button,a,input,textarea{font:inherit}button,a{touch-action:manipulation}button{min-height:46px;padding:11px 16px;border:1px solid #cbd7cf;background:#fff;color:#172b35;border-radius:12px;font-weight:600;cursor:pointer}button:disabled{opacity:.5;cursor:default}button:focus-visible,input:focus-visible,textarea:focus-visible,a:focus-visible{outline:3px solid #dc9a2b;outline-offset:3px}.primary{background:#087b67;border-color:#087b67;color:white}.origin{font-size:11px;max-width:900px;margin:8px auto 14px;color:#55716f}.hero{padding:28px;border-radius:22px;background:#e4ede4;margin-bottom:18px}.stats{gap:24px;margin-bottom:24px;font-size:13px}.stats b{display:block;font-size:27px}.toolbar{gap:8px;flex-wrap:wrap;margin:16px 0}.toolbar button{flex:1}.search{margin:24px 0 16px}label{display:block;font-weight:600;font-size:13px;margin:18px 0 8px}input,textarea{display:block;width:100%;margin-top:8px;padding:14px;border:1px solid #bdcbc3;border-radius:12px;background:white;color:#172b35;font-size:16px}textarea{resize:vertical}main,footer,#status{max-width:900px;margin:auto}.cards{display:grid;gap:12px}.card{width:100%;text-align:left;gap:16px;padding:14px}.card>div:nth-child(2){flex:1;min-width:0;overflow-wrap:anywhere}.card h3{font-size:18px;margin:5px 0}.card span{font-weight:400;font-size:13px}.thumb{width:64px;height:76px;flex-shrink:0;border-radius:10px;background:#eeeade;overflow:hidden;display:grid;place-items:center;font-size:30px}.thumb .photo,.thumb img{width:100%;height:76px;object-fit:cover}.thumb p{font-size:10px}.photo{border-radius:12px;overflow:hidden;background:#eeeade;min-width:0}.photo img{width:100%;height:180px;object-fit:contain;display:block}.photo button{font-size:12px;padding:8px;min-height:44px}.photo p{padding:12px;font-size:12px}.photos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:18px 0}.hint,footer,.tip{font-size:12px;color:#55716f}.tip{border-top:1px solid #cbd7cf;margin-top:30px;padding-top:20px}.tip b{font-size:14px}.empty{padding:30px 18px;text-align:center;border:1px dashed #bdcbc3;border-radius:18px}.file{background:#e4ede4;border-radius:12px;padding:14px}.file input{font-size:13px;padding:8px}.save{position:sticky;bottom:8px;width:100%;margin-top:18px;box-shadow:0 5px 20px #172b3522}.price{font-size:28px;color:#087b67;font-weight:700}.description{white-space:pre-wrap;overflow-wrap:anywhere}dl>div{justify-content:space-between;border-bottom:1px solid #dce3dc;padding:12px 0;gap:12px}dt{font-size:13px;color:#55716f}dd{margin:0;overflow-wrap:anywhere;text-align:right}.danger{color:#a33030;border-color:#debcbc;margin:24px 0}.sales{padding-left:20px;line-height:1.8;font-size:13px}a{color:#087b67;display:inline-block;min-height:44px;padding:12px 0;overflow-wrap:anywhere}#status{font-size:13px;line-height:1.5;padding:10px 0;color:#087b67}#status.error{color:#a33030}footer{padding:28px 0 10px;line-height:1.7}article{padding-top:20px}#sale{display:flex;gap:10px;flex-wrap:wrap;align-items:end}#sale label{flex:1;min-width:100px}#sale button{margin-bottom:8px}@media(min-width:700px){.cards{grid-template-columns:repeat(2,minmax(0,1fr))}.hero{padding:40px}.hero h2{max-width:420px;font-size:44px}.photos{grid-template-columns:repeat(3,minmax(0,1fr))}form:not(#sale){max-width:650px}header{padding-top:12px}}@media(prefers-reduced-motion:no-preference){button{transition:background .15s}button:hover{filter:brightness(.97)}}\n\n.shell.mini{padding:6px 10px}.mini header small{display:none}.mini h1{font-size:18px;margin:0}.mini header{padding:0}.mini #minimize{min-height:44px}\n.prep-field{padding:16px 0;border-bottom:1px solid #cbd7cf}.check{display:flex;align-items:center;gap:12px;font-size:14px;line-height:1.5}.check input{width:24px;height:24px;flex-shrink:0;margin:0}.vinted-link{padding:14px 18px;border-radius:12px;text-decoration:none}#prep-summary{background:#e4ede4;padding:14px;border-radius:12px}#photo-zip{display:block}#resume-prep{margin-bottom:12px}\n";
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

if(location.hostname === 'www.vinted.es'){void initVintedAssistant();return;}
if (document.getElementById('orion-express-v2')) return;
const host = document.createElement('div');
host.id = 'orion-express-v2';
host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#f6f5ef;color:#172b35';
const root = host.attachShadow({ mode: 'open' });
root.innerHTML = `<style>${APP_CSS}</style><div class="shell"><header><div><small>VOTRE ATELIER DE VENTE · V3</small><h1>Orion <em>Express</em></h1></div><button id="minimize" aria-label="Réduire l’application">−</button></header><div class="origin">Local · example.com · aucune synchronisation</div><div id="status" role="status" aria-live="polite"></div><main></main><footer>Les données du navigateur ne sont pas une sauvegarde. Exportez vers Fichiers régulièrement.<br>Préparation manuelle des annonces : aucune connexion ni publication sur Vinted.</footer></div>`;
document.body.append(host);
const $ = s => root.querySelector(s);
const main = $('main');
let repo, products = [], selected, dirty = false, backupURL, busy = false;
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
function status(message, bad = false) { $('#status').textContent = message; $('#status').className = bad ? 'error' : ''; }
async function safe(action) { if (busy) return; busy = true; main.inert = true; main.setAttribute('aria-busy','true'); try { await action(); } catch(e) { status(errorMessage(e), true); } finally { busy = false; main.inert = false; main.removeAttribute('aria-busy'); } }
function leave() { return !dirty || confirm('Quitter sans enregistrer les modifications ?'); }
window.addEventListener('beforeunload', e => { if (dirty || busy) { e.preventDefault(); e.returnValue = ''; } });
$('#minimize').onclick = () => {
  const minimized = host.style.height === '58px';
  host.style.cssText = minimized ? 'position:fixed;inset:0;z-index:2147483647;background:#f6f5ef;color:#172b35' : 'position:fixed;right:8px;bottom:8px;inset:auto 8px 8px auto;height:58px;width:220px;z-index:2147483647;background:#f6f5ef;border-radius:18px;overflow:hidden';
  $('.shell').classList.toggle('mini', !minimized);
  $('#minimize').textContent = minimized ? '−' : '+';
};
async function load() { products = await repo.all(); }
function bind(id, fn) { $(id).onclick = () => safe(fn); }
async function renderPhotos(container, photos, editable = false, changed = () => {}) {
  container.replaceChildren();
  for (let i = 0; i < photos.length; i++) {
    const tile = document.createElement('div'); tile.className = 'photo';
    const img = document.createElement('img'); img.alt = `Photo ${i + 1}`; tile.append(img); container.append(tile);
    try { img.src = await photoURL(photos[i]); } catch(e) { img.remove(); const note = document.createElement('p'); note.textContent = errorMessage(e); tile.append(note); }
    if (editable) {
      const replacement = document.createElement('input'); replacement.type = 'file'; replacement.accept = 'image/*'; replacement.hidden = true;
      const replace = document.createElement('button'); replace.type = 'button'; replace.textContent = 'Remplacer';
      replace.onclick = () => replacement.click();
      replacement.onchange = () => safe(async () => { if (!replacement.files[0]) return; const file = replacement.files[0]; checkFile(file); photos[i] = file; changed(); await renderPhotos(container, photos, true, changed); });
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Retirer';
      remove.onclick = () => { photos.splice(i,1); changed(); void renderPhotos(container, photos, true, changed); };
      tile.append(replace, remove, replacement);
    }
  }
}
function checkFile(f) { if (!f.type.startsWith('image/')) throw new Error('Choisissez une image.'); if (f.size > 15 * 1024 * 1024) throw new Error('Image supérieure à 15 Mo. Réduisez-la avant ajout.'); }
async function home() {
  dirty = false; selected = undefined; await load();
  main.innerHTML = `<section class="hero"><small>LE CATALOGUE</small><h2>Prêt pour la prochaine vente.</h2><div class="stats"><span><b>${products.length}</b> fiches</span><span><b>${products.reduce((n,p) => n + remaining(p),0)}</b> en stock</span></div><button class="primary" id="new">＋ Nouveau produit</button></section><div class="toolbar"><button id="export">Exporter la sauvegarde</button><button id="import">Restaurer une sauvegarde</button></div><button id="resume-prep">Reprendre ma préparation Vinted</button><div id="download"></div><label class="search">Retrouver une fiche<input id="search" type="search" placeholder="Titre, marque, catégorie…"></label><div class="cards"></div><input hidden type="file" accept="application/json,.json" id="backup"><section class="tip"><b>Une seule origine, vos données retrouvées</b><p>Ouvrez toujours https://example.com. Désactivez V1 avant d’utiliser V2. Une sauvegarde contient vos photos : conservez-la dans Fichiers, jamais dans le dépôt public.</p></section>`;
  bind('#new', async () => edit());
  bind('#resume-prep', async () => showPreparation());
  const cards = $('.cards');
  const draw = () => {
    cards.replaceChildren(); const query = $('#search').value.toLocaleLowerCase('fr');
    const matches = products.filter(p => [p.title,p.brand,p.category,p.description].join(' ').toLocaleLowerCase('fr').includes(query));
    if (!matches.length) cards.innerHTML = `<div class="empty"><h3>${products.length ? 'Aucun résultat' : 'Votre premier produit vous attend'}</h3><p>Créez une fiche ou retrouvez votre catalogue avec une sauvegarde.</p>${products.length ? '' : '<button id="starter">Créer « Jeu de cartes » à 10 €</button>'}</div>`;
    if ($('#starter')) bind('#starter', async () => edit({ title:'Jeu de cartes', price:10, initialStock:1, photos:[], sales:[] }));
    for (const p of matches) {
      const card = document.createElement('button'); card.className = 'card';
      card.innerHTML = `<div class="thumb"></div><div><small>${esc(p.category || 'À classer')}</small><h3>${esc(p.title || 'Sans titre')}</h3><span>${money(p.price)} · ${remaining(p)} en stock</span></div><span aria-hidden="true">↗</span>`;
      card.onclick = () => safe(async () => preview(p.id)); cards.append(card);
      if (p.photos.length) void renderPhotos(card.querySelector('.thumb'), [p.photos[0]]);
      else card.querySelector('.thumb').textContent = '✧';
    }
  };
  $('#search').oninput = draw; draw();
  bind('#export', async () => {
    const records = await repo.allRaw(); const text = await exportBackup(records);
    const verified = await readBackup(text);
    if (verified.length !== records.length) throw new Error('Vérification de sauvegarde échouée.');
    if (backupURL) URL.revokeObjectURL(backupURL);
    const blob = new Blob([text], {type:'application/json'}); backupURL = URL.createObjectURL(blob);
    const filename = `orion-express-${new Date().toISOString().slice(0,10)}.backup.json`;
    $('#download').innerHTML = '<p>Sauvegarde vérifiée. Enregistrez-la dans Fichiers puis testez sa restauration.</p>';
    const a = document.createElement('a'); a.href = backupURL; a.download = filename; a.textContent = 'Télécharger à nouveau la sauvegarde'; $('#download').append(a); a.click();
    if (navigator.canShare && navigator.canShare({files:[new File([blob],filename,{type:'application/json'})]})) {
      const share = document.createElement('button'); share.textContent = 'Partager / Enregistrer dans Fichiers'; share.onclick = () => safe(async () => { await navigator.share({files:[new File([blob],filename,{type:'application/json'})]}); }); $('#download').append(share);
    }
    status(`${records.length} fiche(s) exportée(s), intégrité et lecture vérifiées.`);
  });
  bind('#import', async () => $('#backup').click());
  $('#backup').onchange = () => safe(async () => {
    const file = $('#backup').files[0]; if (!file) return;
    if (file.size > MAX_BACKUP) throw new Error('Sauvegarde supérieure à 100 Mo.');
    const records = await readBackup(await file.text());
    const photos = records.reduce((n,p) => n + p.photos.length,0);
    if (!confirm(`Sauvegarde vérifiée : ${records.length} fiche(s), ${photos} photo(s). Restaurer comme nouvelles fiches ? Les fiches actuelles seront conservées. Des doublons sont possibles.`)) return;
    const count = await repo.importCopies(records); await home(); status(`${count} fiche(s) restaurée(s). Originaux conservés.`);
  });
}
async function edit(draft) {
  const p = draft ?? { title:'', price:0, initialStock:1, photos:[], sales:[] };
  const photos = structuredClone(p.photos); selected = p.id;
  const fields = [['title','Titre','text'],['price','Prix (€)','number'],['category','Catégorie','text'],['brand','Marque','text'],['condition','État','text'],['shipping','Format du colis','text'],['initialStock','Stock initial','number']];
  main.innerHTML = `<button id="back">← Catalogue</button><h2>${p.id ? 'Modifier la fiche' : 'Nouveau produit'}</h2><form>${fields.map(([key,label,type]) => `<label>${label}<input name="${key}" type="${type}" value="${esc(p[key] ?? '')}" ${type === 'number' ? `min="0" step="${key === 'price' ? '0.01' : '1'}" required inputmode="${key === 'price' ? 'decimal' : 'numeric'}"` : ''} ${key === 'title' ? 'required maxlength="200"' : ''}></label>`).join('')}<label for="description">Description</label><textarea id="description" name="description" rows="6">${esc(p.description)}</textarea><h3>Photos · <span id="photo-count">${photos.length}</span></h3><div class="photos"></div><label class="file">＋ Ajouter des photos<input id="photos" type="file" accept="image/*" multiple></label><p class="hint">Jusqu’à 15 Mo par photo. HEIC peut être conservé sans être affichable sur tous les navigateurs. Remplacer agit seulement sur la photo choisie.</p><button class="primary save" type="submit">Enregistrer la fiche</button></form>`;
  const changed = () => { dirty = true; $('#photo-count').textContent = photos.length; };
  await renderPhotos($('.photos'), photos, true, changed);
  $('form').oninput = () => { dirty = true; };
  $('#photos').onchange = () => safe(async () => { const files = Array.from($('#photos').files); files.forEach(checkFile); photos.push(...files); changed(); await renderPhotos($('.photos'),photos,true,changed); $('#photos').value = ''; });
  bind('#back', async () => { if (leave()) await home(); });
  $('form').onsubmit = e => { e.preventDefault(); void safe(async () => {
    const data = new FormData($('form')); const patch = {photos};
    for (const [key,,type] of fields) patch[key] = type === 'number' ? Number(String(data.get(key)).replace(',','.')) : String(data.get(key)).trim();
    patch.description = String(data.get('description'));
    if (!patch.title) throw new Error('Ajoutez un titre.');
    const saved = selected === undefined ? await repo.create(patch) : await repo.update(selected,patch,{updatedAt:p.updatedAt});
    dirty = false; await preview(saved.id); status('Fiche enregistrée sur cet appareil.');
  }); };
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); status('Copié dans le presse-papiers.'); }
  catch { const box = $('#copy-fallback'); box.hidden = false; box.value = text; box.focus(); box.select(); status('Appuyez longuement sur le texte sélectionné, puis Copier.'); }
}
async function preview(id) {
  const p = await repo.get(id); if (!p) throw new Error('Fiche introuvable.');
  selected = id;
  main.innerHTML = `<button id="back">← Catalogue</button><article><small>APERÇU DE L’ANNONCE</small><h2>${esc(p.title)}</h2><div class="price">${money(p.price)}</div><div class="photos"></div><p class="description">${esc(p.description || 'Aucune description')}</p><dl>${[['Catégorie',p.category],['Marque',p.brand],['État',p.condition],['Colis',p.shipping],['Stock initial',p.initialStock],['Stock restant',remaining(p)]].map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><button id="prepare-vinted" class="primary">Préparer sur Vinted</button><div class="toolbar"><button id="edit">Modifier</button><button id="duplicate">Dupliquer</button><button id="copy">Copier l’annonce</button><button id="copy-title">Copier le titre</button><button id="copy-description">Copier la description</button></div><textarea id="copy-fallback" hidden aria-label="Texte à copier" rows="8"></textarea><h3>Photos à joindre manuellement</h3><div id="photo-downloads" class="toolbar"></div><h3>Enregistrer une vente</h3><form id="sale"><label>Quantité<input name="quantity" type="number" value="1" min="1" max="${remaining(p)}" step="1" required inputmode="numeric"></label><label>Prix unitaire (€)<input name="unitPrice" type="number" value="${p.price}" min="0" step="0.01" required inputmode="decimal"></label><button type="submit" ${remaining(p) === 0 ? 'disabled' : ''}>Confirmer la vente</button></form><h3>Historique des ventes</h3><ul class="sales">${p.sales.length ? p.sales.map(s=>`<li>${esc(new Date(s.date).toLocaleString('fr-FR'))} · ${s.quantity} × ${money(s.unitPrice)}</li>`).join('') : '<li>Aucune vente enregistrée.</li>'}</ul><button class="danger" id="delete">Supprimer cette fiche</button></article>`;
  await renderPhotos($('.photos'),p.photos);
  for (let i=0; i<p.photos.length; i++) {
    try { const a = document.createElement('a'); a.href = await photoURL(p.photos[i]); a.download = `photo-${i+1}`; a.textContent = `Photo ${i+1} ↗`; $('#photo-downloads').append(a); } catch { /* original retained */ }
  }
  bind('#prepare-vinted', async () => launchVintedTest(p));
  bind('#back', home); bind('#edit',async () => edit(p)); bind('#duplicate', async () => { const d = await repo.duplicate(id); await preview(d.id); status('Copie créée, historique des ventes réinitialisé.'); });
  bind('#copy',async () => copy(listing(p))); bind('#copy-title',async () => copy(p.title)); bind('#copy-description',async () => copy(p.description));
  bind('#delete', async () => { if (confirm('Supprimer définitivement cette fiche et ses photos ? Exportez une sauvegarde avant de continuer.')) { await repo.remove(id); await home(); status('Fiche supprimée.'); } });
  $('#sale').onsubmit = e => { e.preventDefault(); void safe(async () => { const data = new FormData($('#sale')); await repo.sell(id,Number(data.get('quantity')),Number(data.get('unitPrice'))); await preview(id); status('Vente enregistrée, stock mis à jour.'); }); };
}
void safe(async () => { repo = new Products(await openDB()); await home(); status('Catalogue chargé. Avant la première modification V1, exportez une sauvegarde.'); });

let preparationDB, preparationURLs=[];
async function workspace() { if(!preparationDB) preparationDB=await prepStore(); return preparationDB; }
async function startPreparation(product) {
  const next=prepareProduct(product);
  const files=await preparedFiles(next);
  if(files.reduce((n,f)=>n+f.size,0)>40*1024*1024) throw new Error('Photos supérieures à 40 Mo : réduisez leur taille dans une copie de la fiche avant de préparer. Les originaux sont conservés.');
  const store=await workspace(), previous=await store.get();
  if(previous && !confirm('Remplacer la préparation en cours ? Les fiches du catalogue et leurs photos seront conservées.')) return;
  await store.put(next); await showPreparation();
}
async function showPreparation() {
  const store=await workspace(); let p=await store.get();
  if(!p) {status('Aucune préparation en cours. Ouvrez une fiche puis Préparer sur Vinted.');return;}
  if(p.version!==1) throw new Error('Préparation non reconnue. Le catalogue est conservé.');
  for(const url of preparationURLs) URL.revokeObjectURL(url); preparationURLs=[];
  const files=await preparedFiles(p), archive=await photoArchive(files,p.fields);
  const url=URL.createObjectURL(archive);preparationURLs.push(url);
  main.innerHTML=`<button id="prep-back">← Retour à la fiche produit</button><section class="tip"><small>ASSISTANT VINTED ESPAGNE · PARCOURS MANUEL</small><h2>${esc(p.fields.title)}</h2><p>Informations préparées ici. Aucun champ n’est rempli sur Vinted. Copiez puis collez dans le site, et cochez seulement après vérification.</p><a class="primary vinted-link" href="${VINTED_NEW}" target="_blank" rel="noopener noreferrer">Ouvrir le vrai formulaire Vinted ↗</a><p>La connexion peut être nécessaire. Revenez à cet onglet après une interruption : la préparation est enregistrée sur cet appareil.</p></section><h3>1 · Vos ${files.length} photo(s)</h3><button id="share-photos">Partager les photos ensemble</button><a id="photo-zip" download="orion-vinted-photos.zip" href="${url}">Télécharger toutes les photos (ZIP)</a><p class="hint">Dans le partage iOS, enregistrez les images dans Photos ou Fichiers si proposé. Sinon, téléchargez le ZIP, ouvrez-le dans Fichiers pour l’extraire, puis sélectionnez les images ensemble dans le sélecteur de Vinted. Le fichier annonce.txt contient aussi les textes. Aucun envoi automatique.</p><div id="prep-photos" class="photos"></div><label class="check"><input type="checkbox" data-check="photos" ${p.checked.photos?'checked':''}> J’ai ajouté et vérifié les photos dans Vinted</label><h3>2 · Copier, coller, vérifier</h3><div id="prep-fields"></div><textarea id="copy-fallback" hidden aria-label="Texte à copier" rows="6"></textarea><h3>3 · Catégorie et vérification finale</h3><p>Choisissez la catégorie dans la recherche hiérarchique de Vinted. Pour « Jeux de société », renseignez aussi les champs supplémentaires affichés. La marque, l’état et le colis restent à sélectionner dans leurs listes.</p><button id="category-changed">J’ai changé de catégorie : revérifier les choix</button><label class="check"><input type="checkbox" data-check="dynamic" ${p.checked.dynamic?'checked':''}> J’ai vérifié les champs supplémentaires, la marque, l’état et le colis après le choix de catégorie</label><label class="check"><input type="checkbox" data-check="review" ${p.checked.review?'checked':''}> J’ai comparé toutes les informations et les photos avec l’annonce Vinted</label><p id="prep-summary" role="status"></p><p class="hint">Ces coches sont vos confirmations manuelles, pas une détection du formulaire. Publication exclusivement depuis le bouton natif Vinted. Aucune vente ni diminution du stock n’est enregistrée par cet assistant.</p><button id="clear-prep">Effacer uniquement cette préparation</button>`;
  const rows=$('#prep-fields');
  for(const [key,label] of PREP_FIELDS) {
    const row=document.createElement('section');row.className='prep-field';
    row.innerHTML=`<h3>${label}</h3><p class="description">${esc(p.fields[key] || 'À choisir manuellement dans Vinted')}</p><button type="button" data-copy="${key}" ${p.fields[key]?'':'disabled'}>Copier ${label.split(' / ')[0].toLowerCase()}</button><label class="check"><input type="checkbox" data-check="${key}" ${p.checked[key]?'checked':''}> Vérifié dans Vinted</label>`;rows.append(row);
    row.querySelector('button').onclick=()=>safe(async()=>copy(p.fields[key]));
  }
  const summary=()=>{
    const keys=[...PREP_FIELDS.map(([k])=>k),'photos','dynamic','review'];
    $('#prep-summary').textContent=`Préparé localement : ${PREP_FIELDS.filter(([k])=>p.fields[k]).length}/7 valeurs et ${files.length} photo(s). Vérifié par vous dans Vinted : ${keys.filter(k=>p.checked[k]).length}/${keys.length}.`;
  };summary();
  for(const box of root.querySelectorAll('[data-check]')) box.onchange=()=>safe(async()=>{
    const before=p,next=checkPreparation(p,box.dataset.check,box.checked);
    try {await store.put(next);p=next;} catch(e){box.checked=!!before.checked[box.dataset.check];throw e;}
    for(const b of root.querySelectorAll('[data-check]'))b.checked=!!p.checked[b.dataset.check];summary();status('Vérification enregistrée sur cet appareil.');
  });
  $('#category-changed').onclick=()=>safe(async()=>{const next=checkPreparation(p,'category',false);await store.put(next);p=next;for(const b of root.querySelectorAll('[data-check]'))b.checked=!!p.checked[b.dataset.check];summary();status('Catégorie, champs supplémentaires, marque, état et colis à revérifier.');});
  $('#share-photos').onclick=()=>safe(async()=>{
    if(!navigator.canShare?.({files}) || !navigator.share) {status('Partage multiple indisponible ici. Utilisez le ZIP ou les liens photo individuels.');return;}
    try {await navigator.share({files});status('Partage fermé. Vérifiez que les images sont enregistrées avant de les sélectionner dans Vinted.');}
    catch(e){if(e.name==='AbortError'){status('Partage annulé. Les photos restent disponibles ici.');return;}throw e;}
  });
  await renderPhotos($('#prep-photos'),files);
  files.forEach((f,i)=>{const a=document.createElement('a'),u=URL.createObjectURL(f);preparationURLs.push(u);a.href=u;a.download=f.name;a.textContent=`Enregistrer la photo ${i+1}`;$('#prep-photos').append(a);});
  bind('#prep-back',async()=>preview(p.sourceId));
  bind('#clear-prep',async()=>{if(confirm('Effacer la préparation locale ? Les produits et les photos du catalogue restent conservés.')){await store.clear();await home();status('Préparation effacée, catalogue conservé.');}});
  status('Préparation locale enregistrée. Collage, choix et ajout des photos manuels dans Vinted.');
}

})();
