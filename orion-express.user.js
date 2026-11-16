// ==UserScript==
// @name Orion Express
// @namespace https://github.com/TheoRuffin/orion-express
// @version 2.0.0
// @description Gestion locale de produits, photos, stock et sauvegardes — interface française.
// @match https://example.com/*
// @run-at document-end
// @noframes
// @grant none
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

const APP_CSS = ":host{all:initial;font:16px -apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;color:#172b35}*{box-sizing:border-box}.shell{height:100%;overflow:auto;background:#f6f5ef;padding:24px max(20px,env(safe-area-inset-right)) max(24px,env(safe-area-inset-bottom)) max(20px,env(safe-area-inset-left));-webkit-overflow-scrolling:touch}header,header>div,.toolbar,.stats,.card,dl>div{display:flex;align-items:center}header{justify-content:space-between;max-width:900px;margin:auto}header>div{display:block}small{font-size:10px;letter-spacing:.14em;font-weight:700;color:#55716f}h1{font-size:28px;letter-spacing:-1px;margin:5px 0 12px}h1 em{font-family:Georgia,serif;font-weight:400;color:#087b67}h2{font-size:30px;line-height:1.12;letter-spacing:-.8px;margin:14px 0 22px}h3{font-size:18px;margin:10px 0}p{line-height:1.6}button,a,input,textarea{font:inherit}button,a{touch-action:manipulation}button{min-height:46px;padding:11px 16px;border:1px solid #cbd7cf;background:#fff;color:#172b35;border-radius:12px;font-weight:600;cursor:pointer}button:disabled{opacity:.5;cursor:default}button:focus-visible,input:focus-visible,textarea:focus-visible,a:focus-visible{outline:3px solid #dc9a2b;outline-offset:3px}.primary{background:#087b67;border-color:#087b67;color:white}.origin{font-size:11px;max-width:900px;margin:8px auto 14px;color:#55716f}.hero{padding:28px;border-radius:22px;background:#e4ede4;margin-bottom:18px}.stats{gap:24px;margin-bottom:24px;font-size:13px}.stats b{display:block;font-size:27px}.toolbar{gap:8px;flex-wrap:wrap;margin:16px 0}.toolbar button{flex:1}.search{margin:24px 0 16px}label{display:block;font-weight:600;font-size:13px;margin:18px 0 8px}input,textarea{display:block;width:100%;margin-top:8px;padding:14px;border:1px solid #bdcbc3;border-radius:12px;background:white;color:#172b35;font-size:16px}textarea{resize:vertical}main,footer,#status{max-width:900px;margin:auto}.cards{display:grid;gap:12px}.card{width:100%;text-align:left;gap:16px;padding:14px}.card>div:nth-child(2){flex:1;min-width:0;overflow-wrap:anywhere}.card h3{font-size:18px;margin:5px 0}.card span{font-weight:400;font-size:13px}.thumb{width:64px;height:76px;flex-shrink:0;border-radius:10px;background:#eeeade;overflow:hidden;display:grid;place-items:center;font-size:30px}.thumb .photo,.thumb img{width:100%;height:76px;object-fit:cover}.thumb p{font-size:10px}.photo{border-radius:12px;overflow:hidden;background:#eeeade;min-width:0}.photo img{width:100%;height:180px;object-fit:contain;display:block}.photo button{font-size:12px;padding:8px;min-height:44px}.photo p{padding:12px;font-size:12px}.photos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:18px 0}.hint,footer,.tip{font-size:12px;color:#55716f}.tip{border-top:1px solid #cbd7cf;margin-top:30px;padding-top:20px}.tip b{font-size:14px}.empty{padding:30px 18px;text-align:center;border:1px dashed #bdcbc3;border-radius:18px}.file{background:#e4ede4;border-radius:12px;padding:14px}.file input{font-size:13px;padding:8px}.save{position:sticky;bottom:8px;width:100%;margin-top:18px;box-shadow:0 5px 20px #172b3522}.price{font-size:28px;color:#087b67;font-weight:700}.description{white-space:pre-wrap;overflow-wrap:anywhere}dl>div{justify-content:space-between;border-bottom:1px solid #dce3dc;padding:12px 0;gap:12px}dt{font-size:13px;color:#55716f}dd{margin:0;overflow-wrap:anywhere;text-align:right}.danger{color:#a33030;border-color:#debcbc;margin:24px 0}.sales{padding-left:20px;line-height:1.8;font-size:13px}a{color:#087b67;display:inline-block;min-height:44px;padding:12px 0;overflow-wrap:anywhere}#status{font-size:13px;line-height:1.5;padding:10px 0;color:#087b67}#status.error{color:#a33030}footer{padding:28px 0 10px;line-height:1.7}article{padding-top:20px}#sale{display:flex;gap:10px;flex-wrap:wrap;align-items:end}#sale label{flex:1;min-width:100px}#sale button{margin-bottom:8px}@media(min-width:700px){.cards{grid-template-columns:repeat(2,minmax(0,1fr))}.hero{padding:40px}.hero h2{max-width:420px;font-size:44px}.photos{grid-template-columns:repeat(3,minmax(0,1fr))}form:not(#sale){max-width:650px}header{padding-top:12px}}@media(prefers-reduced-motion:no-preference){button{transition:background .15s}button:hover{filter:brightness(.97)}}\n\n.shell.mini{padding:6px 10px}.mini header small{display:none}.mini h1{font-size:18px;margin:0}.mini header{padding:0}.mini #minimize{min-height:44px}\n";
if (document.getElementById('orion-express-v2')) return;
const host = document.createElement('div');
host.id = 'orion-express-v2';
host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#f6f5ef;color:#172b35';
const root = host.attachShadow({ mode: 'open' });
root.innerHTML = `<style>${APP_CSS}</style><div class="shell"><header><div><small>VOTRE ATELIER DE VENTE · V2</small><h1>Orion <em>Express</em></h1></div><button id="minimize" aria-label="Réduire l’application">−</button></header><div class="origin">Local · example.com · aucune synchronisation</div><div id="status" role="status" aria-live="polite"></div><main></main><footer>Les données du navigateur ne sont pas une sauvegarde. Exportez vers Fichiers régulièrement.<br>Préparation manuelle des annonces : aucune connexion ni publication sur Vinted.</footer></div>`;
document.body.append(host);
const $ = s => root.querySelector(s);
const main = $('main');
let repo, products = [], selected, dirty = false, backupURL, busy = false;
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
function status(message, bad = false) { $('#status').textContent = message; $('#status').className = bad ? 'error' : ''; }
async function safe(action) { if (busy) return; busy = true; main.inert = true; main.setAttribute('aria-busy','true'); try { await action(); } catch(e) { status(errorMessage(e), true); } finally { busy = false; main.inert = false; main.removeAttribute('aria-busy'); } }
function leave() { return !dirty || confirm('Quitter sans enregistrer les modifications ?'); }
window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
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
  main.innerHTML = `<section class="hero"><small>LE CATALOGUE</small><h2>Prêt pour la prochaine vente.</h2><div class="stats"><span><b>${products.length}</b> fiches</span><span><b>${products.reduce((n,p) => n + remaining(p),0)}</b> en stock</span></div><button class="primary" id="new">＋ Nouveau produit</button></section><div class="toolbar"><button id="export">Exporter la sauvegarde</button><button id="import">Restaurer une sauvegarde</button></div><div id="download"></div><label class="search">Retrouver une fiche<input id="search" type="search" placeholder="Titre, marque, catégorie…"></label><div class="cards"></div><input hidden type="file" accept="application/json,.json" id="backup"><section class="tip"><b>Une seule origine, vos données retrouvées</b><p>Ouvrez toujours https://example.com. Désactivez V1 avant d’utiliser V2. Une sauvegarde contient vos photos : conservez-la dans Fichiers, jamais dans le dépôt public.</p></section>`;
  bind('#new', async () => edit());
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
  main.innerHTML = `<button id="back">← Catalogue</button><article><small>APERÇU DE L’ANNONCE</small><h2>${esc(p.title)}</h2><div class="price">${money(p.price)}</div><div class="photos"></div><p class="description">${esc(p.description || 'Aucune description')}</p><dl>${[['Catégorie',p.category],['Marque',p.brand],['État',p.condition],['Colis',p.shipping],['Stock initial',p.initialStock],['Stock restant',remaining(p)]].map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><div class="toolbar"><button id="edit">Modifier</button><button id="duplicate">Dupliquer</button><button id="copy">Copier l’annonce</button><button id="copy-title">Copier le titre</button><button id="copy-description">Copier la description</button></div><textarea id="copy-fallback" hidden aria-label="Texte à copier" rows="8"></textarea><h3>Photos à joindre manuellement</h3><div id="photo-downloads" class="toolbar"></div><h3>Enregistrer une vente</h3><form id="sale"><label>Quantité<input name="quantity" type="number" value="1" min="1" max="${remaining(p)}" step="1" required inputmode="numeric"></label><label>Prix unitaire (€)<input name="unitPrice" type="number" value="${p.price}" min="0" step="0.01" required inputmode="decimal"></label><button type="submit" ${remaining(p) === 0 ? 'disabled' : ''}>Confirmer la vente</button></form><h3>Historique des ventes</h3><ul class="sales">${p.sales.length ? p.sales.map(s=>`<li>${esc(new Date(s.date).toLocaleString('fr-FR'))} · ${s.quantity} × ${money(s.unitPrice)}</li>`).join('') : '<li>Aucune vente enregistrée.</li>'}</ul><button class="danger" id="delete">Supprimer cette fiche</button></article>`;
  await renderPhotos($('.photos'),p.photos);
  for (let i=0; i<p.photos.length; i++) {
    try { const a = document.createElement('a'); a.href = await photoURL(p.photos[i]); a.download = `photo-${i+1}`; a.textContent = `Photo ${i+1} ↗`; $('#photo-downloads').append(a); } catch { /* original retained */ }
  }
  bind('#back', home); bind('#edit',async () => edit(p)); bind('#duplicate', async () => { const d = await repo.duplicate(id); await preview(d.id); status('Copie créée, historique des ventes réinitialisé.'); });
  bind('#copy',async () => copy(listing(p))); bind('#copy-title',async () => copy(p.title)); bind('#copy-description',async () => copy(p.description));
  bind('#delete', async () => { if (confirm('Supprimer définitivement cette fiche et ses photos ? Exportez une sauvegarde avant de continuer.')) { await repo.remove(id); await home(); status('Fiche supprimée.'); } });
  $('#sale').onsubmit = e => { e.preventDefault(); void safe(async () => { const data = new FormData($('#sale')); await repo.sell(id,Number(data.get('quantity')),Number(data.get('unitPrice'))); await preview(id); status('Vente enregistrée, stock mis à jour.'); }); };
}
void safe(async () => { repo = new Products(await openDB()); await home(); status('Catalogue chargé. Avant la première modification V1, exportez une sauvegarde.'); });

})();
