// No network access. Existing records are normalized in memory, never rewritten on open.
export const DB_NAME = 'orion-express-db';
export const MAX_BACKUP = 100 * 1024 * 1024;
export const uid = () => crypto.randomUUID();
const clone = value => structuredClone(value);
export function remaining(p) { return p.initialStock - p.sales.reduce((n, s) => n + s.quantity, 0); }
export function normalize(raw) {
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
export function validate(p) {
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
export function errorMessage(e) {
  if (e?.name === 'QuotaExceededError') return 'Stockage plein : aucune modification enregistrée. Exportez une sauvegarde et libérez de l’espace.';
  if (e?.name === 'SecurityError') return 'Stockage inaccessible. Utilisez un onglet normal et autorisez le stockage du site.';
  return e?.message || 'Opération impossible. Les données existantes sont conservées.';
}
export function openDB(factory = indexedDB) {
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
export class Products {
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
export function blobData(blob) {
  return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(r.error); r.readAsDataURL(blob); });
}
export async function photoURL(photo) {
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
export async function exportBackup(records) {
  const payload = JSON.stringify(await pack(records));
  const text = JSON.stringify({ format: 'orion-express', version: 2, createdAt: new Date().toISOString(), sha256: await digest(payload), payload });
  if (new Blob([text]).size > MAX_BACKUP) throw new Error('Sauvegarde supérieure à 100 Mo : export annulé.');
  return text;
}
export async function readBackup(text) {
  if (new Blob([text]).size > MAX_BACKUP) throw new Error('Sauvegarde supérieure à 100 Mo.');
  const b = JSON.parse(text);
  if (b.format !== 'orion-express' || b.version !== 2 || typeof b.payload !== 'string' || await digest(b.payload) !== b.sha256) throw new Error('Sauvegarde non reconnue ou intégrité invalide.');
  const records = unpack(JSON.parse(b.payload));
  if (!Array.isArray(records)) throw new Error('Liste de fiches invalide.');
  records.forEach(normalize);
  return records;
}
export const listing = p => [p.title, p.description, `Prix : ${p.price.toFixed(2)} €`, `Catégorie : ${p.category}`, `Marque : ${p.brand}`, `État : ${p.condition}`, `Colis : ${p.shipping}`].join('\n\n');
