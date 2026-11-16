import { test, expect } from './fixture.js';
import { readFile } from 'node:fs/promises';
const script = await readFile('orion-express.user.js','utf8');
const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
async function boot(page, legacy=false) {
  await page.route('https://example.com/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><title>Example Domain</title><h1>Example Domain</h1>'}));
  await page.goto('https://example.com/');
  if (legacy) await page.evaluate(async () => {
    await new Promise((resolve,reject) => { const q=indexedDB.open('orion-express-db',1); q.onupgradeneeded=()=>q.result.createObjectStore('products',{keyPath:'id'}); q.onsuccess=()=>{ const db=q.result, tx=db.transaction('products','readwrite'); tx.objectStore('products').put({id:'v1',title:'Cartes V1',description:'Ancienne fiche',price:10,photos:[new Blob(['v1'],{type:'image/png'})]}); tx.oncomplete=()=>{db.close();resolve();}; tx.onerror=()=>reject(tx.error); }; });
  });
  await page.addScriptTag({content:script}); await expect(page.getByRole('button',{name:'＋ Nouveau produit'})).toBeVisible();
}
test('iPhone simulé : CRUD, plusieurs photos, remplacement, vente, export et import',async ({page}) => {
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await boot(page); await page.getByRole('button',{name:'Créer « Jeu de cartes » à 10 €'}).click();
  await page.getByLabel('Description',{exact:true}).fill('Jeu complet, prêt à vendre.');
  await page.locator('#photos').setInputFiles([{name:'a.png',mimeType:'image/png',buffer:image},{name:'b.png',mimeType:'image/png',buffer:image}]);
  await expect(page.locator('#photo-count')).toHaveText('2');
  await page.getByRole('button',{name:'Enregistrer la fiche'}).click(); await expect(page.getByRole('heading',{name:'Jeu de cartes',exact:true})).toBeVisible();
  await expect(page.locator('.photos img')).toHaveCount(2);
  await page.getByRole('button',{name:'Modifier',exact:true}).click();
  await page.getByLabel('Description',{exact:true}).fill('Description corrigée'); await page.getByRole('button',{name:'Enregistrer la fiche'}).click();
  await expect(page.locator('.photos img')).toHaveCount(2);
  await page.getByRole('button',{name:'Modifier',exact:true}).click();
  await page.locator('.photos input[type=file]').first().setInputFiles({name:'replacement.png',mimeType:'image/png',buffer:image});
  await page.getByRole('button',{name:'Enregistrer la fiche'}).click();
  const names=await page.evaluate(async()=> {const db=await new Promise(r=>{const q=indexedDB.open('orion-express-db');q.onsuccess=()=>r(q.result);});const records=await new Promise(r=>{db.transaction('products').objectStore('products').getAll().onsuccess=e=>r(e.target.result);});db.close();return records[0].photos.map(p=>p.name);});
  expect(names).toEqual(['replacement.png','b.png']);
  await page.getByRole('button',{name:'Confirmer la vente'}).click(); await expect(page.getByRole('button',{name:'Confirmer la vente'})).toBeDisabled();
  await page.getByRole('button',{name:'← Catalogue'}).click();
  const downloadPromise=page.waitForEvent('download'); await page.getByRole('button',{name:'Exporter la sauvegarde',exact:true}).click();
  const download=await downloadPromise; const path=await download.path(); expect(path).toBeTruthy();
  page.on('dialog',d=>d.accept()); await page.locator('#backup').setInputFiles(path); await expect(page.locator('.card')).toHaveCount(2);
  await page.getByRole('button',{name:/Jeu de cartes/}).first().click(); await page.getByRole('button',{name:'Dupliquer',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Jeu de cartes (copie)'})).toBeVisible();
  await page.getByRole('button',{name:'Supprimer cette fiche'}).click(); await expect(page.locator('.card')).toHaveCount(2);
  await page.reload(); await page.addScriptTag({content:script}); await expect(page.locator('.card')).toHaveCount(2);
  await expect(page.locator('main')).toBeVisible();
  expect(await page.locator('.shell').evaluate(el=>el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({path:'tests/mobile-iphone.png',fullPage:true}); expect(errors).toEqual([]);
});
test('V1 sur la même origine : ouverture sans réécriture puis migration préservée',async ({page}) => {
  await boot(page,true);
  await page.getByRole('button',{name:/Cartes V1/}).click();
  const original=await page.evaluate(async()=>new Promise(r=>{const q=indexedDB.open('orion-express-db');q.onsuccess=()=>{const db=q.result;db.transaction('products').objectStore('products').get('v1').onsuccess=e=>{r(e.target.result.schemaVersion);db.close();};};})); expect(original).toBeUndefined();
  await page.getByRole('button',{name:'Modifier',exact:true}).click(); await page.getByLabel('Titre',{exact:true}).fill('V1 conservée');
  await page.getByRole('button',{name:'Enregistrer la fiche'}).click();
  const state=await page.evaluate(async()=>new Promise(r=>{const q=indexedDB.open('orion-express-db');q.onsuccess=()=>{const db=q.result;db.transaction('products').objectStore('products').get('v1').onsuccess=e=>{const p=e.target.result;r({old:p.legacyV1.title,photos:p.photos.length});db.close();};};}));
  expect(state).toEqual({old:'Cartes V1',photos:1});
});
test('entrée HTML affichée comme texte et import invalide sans altération',async ({page})=>{
  await boot(page); await page.getByRole('button',{name:'＋ Nouveau produit'}).click();
  await page.getByLabel('Titre',{exact:true}).fill('<img src=x onerror=alert(1)>'); await page.getByRole('button',{name:'Enregistrer la fiche'}).click();
  await expect(page.getByRole('heading',{name:'<img src=x onerror=alert(1)>'})).toBeVisible(); await expect(page.locator('article h2 img')).toHaveCount(0);
  await page.getByRole('button',{name:'← Catalogue'}).click(); await page.locator('#backup').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"version":9}')});
  await expect(page.getByRole('status')).toContainText('non reconnue'); await expect(page.locator('.card')).toHaveCount(1);
});
