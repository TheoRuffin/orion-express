import {test,expect} from './fixture.js';
import {readFile} from 'node:fs/promises';
const script=await readFile('orion-express.user.js','utf8');
async function boot(context,page,overrides={}){
 const gm=new Map();
 await context.exposeBinding('choiceGM',(_,{op,key,value})=>{if(op==='get')return gm.has(key)?gm.get(key):value;if(op==='set')gm.set(key,value);if(op==='delete')gm.delete(key);});
 await context.addInitScript(()=>{window.GM_getValue=(key,value)=>window.choiceGM({op:'get',key,value});window.GM_setValue=(key,value)=>window.choiceGM({op:'set',key,value});window.GM_deleteValue=key=>window.choiceGM({op:'delete',key});});
 await page.route('https://example.com/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'}));await page.goto('https://example.com/');
 await page.evaluate(async fields=>new Promise(resolve=>{const q=indexedDB.open('orion-express-db');q.onupgradeneeded=()=>q.result.createObjectStore('products',{keyPath:'id'});q.onsuccess=()=>{const db=q.result,tx=db.transaction('products','readwrite');tx.objectStore('products').put({id:'source',title:'Producto fuente',description:'Descripción inicial',price:10,category:'Loisirs > Jeux de société',brand:'Sans marque',condition:'Très bon état',shipping:'Moyen',photos:[new Blob(['foto-original'],{type:'image/png'})],...fields});tx.oncomplete=()=>{db.close();resolve();};};}),overrides);
 await page.addScriptTag({content:script});await page.getByRole('button',{name:/Producto fuente/}).click();return gm;
}
async function record(page){return page.evaluate(async()=>new Promise(resolve=>{const q=indexedDB.open('orion-express-db');q.onsuccess=()=>{const db=q.result;db.transaction('products').objectStore('products').get('source').onsuccess=async e=>{const p=e.target.result;db.close();resolve({condition:p.condition,shipping:p.shipping,category:p.category,description:p.description,photo:await p.photos[0].text(),updatedAt:p.updatedAt});};};}));}
test('préparation depuis aperçu périmé : relit les trois valeurs enregistrées sans toucher les photos',async({context,page})=>{
 const gm=await boot(context,page);await expect(page.locator('dd').filter({hasText:'Moyen'})).toHaveText('Moyen');
 // Simulate another catalogue tab updating the same saved product while this preview remains open.
 await page.evaluate(async()=>new Promise(resolve=>{const q=indexedDB.open('orion-express-db');q.onsuccess=()=>{const db=q.result,tx=db.transaction('products','readwrite'),store=tx.objectStore('products');store.get('source').onsuccess=e=>store.put({...e.target.result,condition:'Nuevo sin etiquetas',shipping:'Pequeño',category:'Enfants > Jeux et jouets > Jeux de société',updatedAt:'2026-11-21T12:00:00.000Z'});tx.oncomplete=()=>{db.close();resolve();};};}));
 const current=await record(page);await page.getByRole('button',{name:'Préparer sur Vinted',exact:true}).click();await expect.poll(()=>gm.has('orion-express-transfer-3.1')).toBe(true);
 const transfer=JSON.parse(gm.get('orion-express-transfer-3.1')),product=JSON.parse(JSON.parse(transfer.backup).payload)[0];
 expect({condition:product.condition,shipping:product.shipping,category:product.category,updatedAt:product.updatedAt}).toEqual({condition:'Nuevo sin etiquetas',shipping:'Pequeño',category:'Enfants > Jeux et jouets > Jeux de société',updatedAt:'2026-11-21T12:00:00.000Z'});
 expect(product.photos).toHaveLength(1);expect(product.photos[0].data).toBe('data:image/png;base64,Zm90by1vcmlnaW5hbA==');expect(await record(page)).toEqual(current);
});
test('éditeur : ancien colis inconnu conservé sans défaut Moyen, puis choix précis et état/photo intacts',async({context,page})=>{
 await boot(context,page,{shipping:' Caja antigua V1 ',condition:'Nuevo con etiquetas'});await page.getByRole('button',{name:'Modifier',exact:true}).click();
 const shipping=page.getByLabel('Format du colis',{exact:true});await expect(shipping).toHaveValue(' Caja antigua V1 ');await expect(shipping.locator('option:checked')).toHaveText('Format actuel à préciser :  Caja antigua V1 ');await expect(page.getByLabel('État',{exact:true})).toHaveValue('Nuevo con etiquetas');
 await page.getByLabel('Description',{exact:true}).fill('Description modifiée');await page.getByRole('button',{name:'Enregistrer la fiche',exact:true}).click();let current=await record(page);expect(current.shipping).toBe(' Caja antigua V1 ');expect(current.condition).toBe('Nuevo con etiquetas');expect(current.photo).toBe('foto-original');
 await page.getByRole('button',{name:'Modifier',exact:true}).click();await page.getByRole('button',{name:'Español',exact:true}).click();await expect(page.getByLabel('Tamaño del paquete',{exact:true})).toHaveValue(' Caja antigua V1 ');await page.getByLabel('Tamaño del paquete',{exact:true}).selectOption('Petit');await expect(page.getByLabel('Tamaño del paquete',{exact:true}).locator('option:checked')).toHaveText('Pequeño');await page.getByRole('button',{name:'Guardar ficha',exact:true}).click();current=await record(page);expect(current.shipping).toBe('Petit');expect(current.condition).toBe('Nuevo con etiquetas');expect(current.photo).toBe('foto-original');
});
