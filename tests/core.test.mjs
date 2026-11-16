import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { Products, openDB, normalize, remaining, exportBackup, readBackup, photoURL, errorMessage, DB_NAME, MAX_BACKUP } from '../src/core.js';
// Browser FileReader equivalent for serialization tests in Node.
globalThis.FileReader = class {
  readAsDataURL(blob) { blob.arrayBuffer().then(buffer => { this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString('base64')}`; this.onload(); }, e => { this.error = e; this.onerror(); }); }
};
const connections = [];
afterEach(() => { connections.splice(0).forEach(db => db.close()); });
async function repo(factory = new IDBFactory()) { const db = await openDB(factory); connections.push(db); return new Products(db); }
const seed = { title:'Jeu de cartes',price:10,initialStock:5,photos:[new Blob(['image'],{type:'image/png'})] };
function legacy(factory, options = {keyPath:'id'}) {
  return new Promise((resolve,reject) => { const r = factory.open(DB_NAME,1); r.onupgradeneeded = () => r.result.createObjectStore('products',options); r.onerror = () => reject(r.error); r.onsuccess = () => resolve(r.result); });
}
test('CRUD et duplication avec photos indépendantes et historique réinitialisé',async () => {
  const r = await repo(); const p = await r.create(seed); assert.equal(p.price,10);
  await r.update(p.id,{title:'Cartes neuves'}); assert.equal((await r.get(p.id)).title,'Cartes neuves');
  await r.sell(p.id,2,9); const copy = await r.duplicate(p.id);
  assert.notEqual(copy.id,p.id); assert.equal(copy.sales.length,0); assert.equal(copy.photos.length,1);
  await r.remove(p.id); assert.equal(await r.get(p.id),undefined); assert.equal((await r.all()).length,1);
});
test('persistance après fermeture et réouverture IndexedDB',async () => {
  const factory = new IDBFactory(); const r = await repo(factory); const p = await r.create(seed); r.db.close();
  const reopened = await repo(factory); assert.equal((await reopened.get(p.id)).title,seed.title); assert.equal(await (await reopened.get(p.id)).photos[0].text(),'image');
});
test('édition texte conserve photos, remplacement ciblé et retrait explicite',async () => {
  const r = await repo(); const p = await r.create({...seed,photos:['data:image/png;base64,YQ==','data:image/png;base64,Yg==']});
  await r.update(p.id,{description:'Texte modifié'}); assert.deepEqual((await r.get(p.id)).photos,p.photos);
  await r.update(p.id,{photos:['data:image/png;base64,Yw==',p.photos[1]]}); assert.equal((await r.get(p.id)).photos[1],p.photos[1]);
  await r.update(p.id,{photos:[]}); assert.deepEqual((await r.get(p.id)).photos,[]);
});
test('migration V1 en lecture seule, clés numériques, champs inconnus et original conservés',async () => {
  const factory = new IDBFactory(); const db = await legacy(factory);
  const old = {id:42,title:'Ancien jeu',price:'10 €',photos:[new Blob(['V1'],{type:'image/png'})],privateExtra:'conserver'};
  await new Products(db).transaction('readwrite', s => s.add(old)); db.close();
  const r = await repo(factory); const p = (await r.all())[0]; assert.equal(p.schemaVersion,2); assert.equal(p.initialStock,1);
  assert.equal((await r.allRaw())[0].schemaVersion,undefined); assert.equal(r.db.version,1);
  await r.update(42,{title:'Modifié'}); const changed = await r.get(42);
  assert.equal(changed.privateExtra,'conserver'); assert.equal(changed.legacyV1.title,old.title); assert.equal(await changed.photos[0].text(),'V1');
  await r.update(42,{description:'encore'}); assert.equal((await r.get(42)).legacyV1.title,old.title);
});
test('magasin V1 avec clé externe conservé',async () => {
  const factory = new IDBFactory(); const db = await legacy(factory,undefined); // explicit out-of-line fixture below
  db.close();
  // Separate factory because undefined uses default parameters.
  const f = new IDBFactory(); const d = await legacy(f,{});
  await new Products(d).transaction('readwrite',s => s.add({id:'a',title:'V1',price:10,photos:[]},'a')); d.close();
  const r = await repo(f); await r.update('a',{title:'V2'}); assert.equal((await r.get('a')).title,'V2');
});
test('export/import restaure Blob, File, photos enveloppées et original V1',async () => {
  const r = await repo(); await r.create({...seed,photos:[new File(['file'],'carte.png',{type:'image/png'}),{dataUrl:'data:image/png;base64,YQ=='}]});
  const raw = await r.allRaw();
  // Node 22 structuredClone turns File into Blob; test the browser serializer directly for File metadata.
  raw[0].photos[0] = new File(['file'],'carte.png',{type:'image/png'});
  const text = await exportBackup(raw); const decoded = await readBackup(text);
  assert.equal(await decoded[0].photos[0].text(),'file'); assert.equal(decoded[0].photos[0].name,'carte.png');
  assert.equal(await photoURL(decoded[0].photos[1]),'data:image/png;base64,YQ==');
  const other = await repo(); await other.importCopies(decoded); assert.equal((await other.all()).length,1);
  assert.notEqual((await other.all())[0].id,raw[0].id);
  await other.importCopies(decoded); assert.equal((await other.all()).length,2);
});
test('backup corrompu, mauvaise version et limite refusés avant écriture',async () => {
  const text = await exportBackup([normalize({id:'p',price:10})]); const bad = JSON.parse(text); bad.payload = bad.payload.replace('10','99');
  await assert.rejects(readBackup(JSON.stringify(bad)),/intégrité/);
  bad.version=9; await assert.rejects(readBackup(JSON.stringify(bad)),/non reconnue/);
  await assert.rejects(readBackup('x'.repeat(MAX_BACKUP+1)),/100 Mo/);
  const r = await repo(); await assert.rejects(async () => r.importCopies([{id:'a',price:2},{id:'b',price:-1}]),/Prix/); assert.equal((await r.all()).length,0);
});
test('stock calculé, survente et stock initial inférieur aux ventes refusés',async () => {
  const r = await repo(); const p = await r.create(seed); await r.sell(p.id,3,10); assert.equal(remaining(await r.get(p.id)),2);
  await assert.rejects(r.sell(p.id,3,10),/Stock insuffisant/); await assert.rejects(r.sell(p.id,-1,10),/Vente invalide/);
  await assert.rejects(r.update(p.id,{initialStock:1}),/Stock insuffisant/); assert.equal((await r.get(p.id)).sales.length,1);
});
test('ventes concurrentes atomiques empêchent la survente',async () => {
  const r = await repo(); const p = await r.create({...seed,initialStock:1});
  const results = await Promise.allSettled([r.sell(p.id,1,10),r.sell(p.id,1,10)]);
  assert.equal(results.filter(x=>x.status==='fulfilled').length,1); assert.equal(remaining(await r.get(p.id)),0);
});
test('erreur de quota annule la transaction et conserve les anciennes photos',async () => {
  const r = await repo(); const p = await r.create(seed);
  const real = r.db.transaction.bind(r.db);
  const broken = new Products({transaction(...args) {
    const tx = real(...args); const getStore = tx.objectStore.bind(tx);
    tx.objectStore = (...a) => { const s = getStore(...a); s.put = () => { throw new DOMException('Full','QuotaExceededError'); }; return s; }; return tx;
  }});
  await assert.rejects(broken.update(p.id,{photos:[]}),{name:'QuotaExceededError'});
  assert.equal((await r.get(p.id)).photos.length,1); assert.match(errorMessage({name:'QuotaExceededError'}),/aucune modification/);
});
test('import atomique : erreur sur la seconde fiche annule la première',async () => {
  const r = await repo(); let writes=0; const real = r.db.transaction.bind(r.db);
  const broken = new Products({transaction(...args) {
    const tx=real(...args), getStore=tx.objectStore.bind(tx);
    tx.objectStore = (...a) => { const s=getStore(...a), add=s.add.bind(s); s.add=(...v) => { if (++writes===2) throw new DOMException('Full','QuotaExceededError'); return add(...v); }; return s; }; return tx;
  }});
  await assert.rejects(broken.importCopies([{id:'a',price:1},{id:'b',price:2}]),{name:'QuotaExceededError'}); assert.equal((await r.all()).length,0);
});
test('photo distante non chargée, formats usuels V1 reconnus',async () => {
  await assert.rejects(photoURL('https://private.example/photo.jpg'),/Format photo/);
  assert.match(await photoURL({blob:new Blob(['ok'],{type:'image/png'})}),/^data:image/);
});
test('métadonnées stables et build reproductible octet pour octet',async () => {
  const before = await readFile('orion-express.user.js','utf8'); execFileSync(process.execPath,['scripts/build.mjs']);
  const after = await readFile('orion-express.user.js','utf8'); assert.equal(before,after);
  const meta = await readFile('orion-express.meta.js','utf8'); assert.ok(after.startsWith(meta));
  for (const key of ['name','namespace','version','match','updateURL','downloadURL','grant']) assert.match(meta,new RegExp(`// @${key} `));
  assert.match(meta,/@match https:\/\/example.com\/\*/); assert.match(meta,/@version 2\.0\.0/);
  assert.match(meta,/@updateURL https:\/\/raw.githubusercontent.com\/TheoRuffin\/orion-express\/main\/orion-express.meta.js/);
  assert.doesNotMatch(after,/@require|\beval\(|\bfetch\(|XMLHttpRequest/);
  execFileSync(process.execPath,['--check','orion-express.user.js']);
});

test('édition obsolète refuse de remplacer les photos modifiées dans un autre onglet',async () => {
  const r=await repo(); const p=await r.create(seed);
  await r.update(p.id,{photos:['data:image/png;base64,YQ==']},{updatedAt:p.updatedAt});
  await assert.rejects(r.update(p.id,{photos:p.photos},{updatedAt:p.updatedAt}),/autre onglet/);
  assert.equal((await r.get(p.id)).photos[0],'data:image/png;base64,YQ==');
});

test('annulation après réussite de la requête : aucun faux succès de sauvegarde',async () => {
  const r=await repo(), p=await r.create(seed), real=r.db.transaction.bind(r.db);
  const broken=new Products({transaction(...args) {
    const tx=real(...args), getStore=tx.objectStore.bind(tx);
    tx.objectStore=(...a)=>{const s=getStore(...a), put=s.put.bind(s); s.put=(...v)=>{const req=put(...v);req.addEventListener('success',()=>tx.abort());return req;};return s;};return tx;
  }});
  await assert.rejects(broken.update(p.id,{title:'non enregistré'}));
  assert.equal((await r.get(p.id)).title,seed.title);
});
test('schéma et clé V1 inconnus refusés sans écriture',async () => {
  const factory=new IDBFactory(), db=await legacy(factory,{keyPath:'custom'}); db.close();
  await assert.rejects(openDB(factory),/Clé V1 non reconnue/);
  const f=new IDBFactory(), d=await legacy(f,{});
  await new Products(d).transaction('readwrite',s=>s.add({id:'different',price:10},'original'));d.close();
  const r=await repo(f);await assert.rejects(r.allRaw(),/Clés V1 non reconnues/);
  assert.equal(await r.transaction('readonly',(s,done)=>{s.count().onsuccess=e=>done(e.target.result);}),1);
});
