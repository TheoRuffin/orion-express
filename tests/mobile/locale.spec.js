import {test,expect} from './fixture.js';
import {readFile} from 'node:fs/promises';
const script=await readFile('orion-express.user.js','utf8');
async function boot(page,url='https://example.com/'){

 await page.route('https://example.com/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'}));
 await page.goto(url);await page.addScriptTag({content:script});
}
test('espagnol par défaut, drapeaux en haut et choix français conservé après rechargement',async({page})=>{
 await boot(page);await expect(page.getByRole('button',{name:'＋ Nuevo producto',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Todo listo para la próxima venta.'})).toBeVisible();
 expect(await page.locator('#orion-express-v2').getAttribute('lang')).toBe('es');
 const flags=page.locator('[data-orion-languages]');expect((await flags.boundingBox()).y).toBeLessThan(100);await page.screenshot({path:'tests/spanish-home-iphone.png'});
 await page.getByRole('button',{name:'Français',exact:true}).click();await expect(page.getByRole('button',{name:'＋ Nouveau produit',exact:true})).toBeVisible();
 await page.reload();await page.addScriptTag({content:script});await expect(page.getByRole('button',{name:'＋ Nouveau produit',exact:true})).toBeVisible();expect(await page.locator('#orion-express-v2').getAttribute('lang')).toBe('fr');
});
test('changement de langue sans perdre la saisie, modifier les fiches ou traduire leurs textes',async({page})=>{
 await boot(page);await page.getByRole('button',{name:'＋ Nuevo producto',exact:true}).click();
 await expect(page.getByRole('button',{name:'＋ Añadir fotos',exact:true})).toBeVisible();await expect(page.locator('#photos')).toBeHidden();await page.getByLabel('Título',{exact:true}).fill('Description');await page.getByLabel('Descripción',{exact:true}).fill('Stock restant');await page.getByLabel('Marca',{exact:true}).fill('Marque');
 const chooser=page.waitForEvent('filechooser');await page.getByRole('button',{name:'＋ Añadir fotos',exact:true}).click();await (await chooser).setFiles({name:'locale.png',mimeType:'image/png',buffer:Buffer.from('original-photo-bytes')});
 await page.getByRole('button',{name:'Français',exact:true}).click();await expect(page.getByLabel('Titre',{exact:true})).toHaveValue('Description');await expect(page.getByLabel('Description',{exact:true})).toHaveValue('Stock restant');
 await page.getByRole('button',{name:'Español',exact:true}).click();await page.getByRole('button',{name:'Guardar ficha',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Description',exact:true})).toBeVisible();await expect(page.locator('.description')).toHaveText('Stock restant');await expect(page.locator('dd').filter({hasText:'Marque'})).toHaveText('Marque');await expect(page.locator('.photos img')).toHaveCount(1);
 await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copyTest=text;}}});});await page.getByRole('button',{name:'Copiar anuncio',exact:true}).click();expect(await page.evaluate(()=>window.copyTest)).toContain('Precio : 0.00 €');expect(await page.evaluate(()=>window.copyTest)).toContain('Stock restant');
 const dialog=page.waitForEvent('dialog');const clicked=page.getByRole('button',{name:'Eliminar esta ficha',exact:true}).click();const d=await dialog;expect(d.message()).toContain('¿Eliminar');await d.dismiss();await clicked;
 const raw=await page.evaluate(async()=>new Promise(resolve=>{const q=indexedDB.open('orion-express-db');q.onsuccess=()=>{const db=q.result;db.transaction('products').objectStore('products').getAll().onsuccess=async e=>{const p=e.target.result[0];db.close();resolve({title:p.title,description:p.description,brand:p.brand,bytes:await p.photos[0].text()});};};}));expect(raw).toEqual({title:'Description',description:'Stock restant',brand:'Marque',bytes:'original-photo-bytes'});
 await page.screenshot({path:'tests/spanish-iphone.png'});
});
test('panneau Vinted en espagnol, erreur traduite, bascule française sans toucher au site natif',async({page})=>{
 await page.route('https://www.vinted.es/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><h1>Vends ton article</h1><input id="title" value="Titre privé">'}));
 await page.goto('https://www.vinted.es/items/new');await page.addScriptTag({content:script});await page.getByRole('button',{name:'Abrir Orion',exact:true}).click();await expect(page.locator('#orion-vinted-test').getByRole('button',{name:'Borrar transferencia local',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Vends ton article'})).toBeVisible();await expect(page.locator('#title')).toHaveValue('Titre privé');
 await page.getByRole('button',{name:'Français',exact:true}).click();await expect(page.locator('#orion-vinted-test').getByRole('button',{name:'Effacer le transfert local',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Réduire Orion',exact:true}).click();await expect(page.locator('#orion-vinted-test').locator('[data-orion-languages]')).toBeHidden();const rect=await page.locator('#orion-vinted-test').boundingBox();expect(rect.width).toBeLessThan(120);
});

test('préférence de langue partagée entre catalogue et panneau Vinted via GM, sans données produit',async({page,context})=>{
 const prefs=new Map();await context.exposeBinding('langGM',(_,{op,key,value})=>{if(op==='get')return prefs.get(key)??value;prefs.set(key,value);});await context.addInitScript(()=>{window.GM_getValue=(key,value)=>window.langGM({op:'get',key,value});window.GM_setValue=(key,value)=>window.langGM({op:'set',key,value});});
 await context.route('https://www.vinted.es/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><h1>Site natif</h1>'}));
 await boot(page);await page.getByRole('button',{name:'Français',exact:true}).click();await expect(page.getByRole('button',{name:'＋ Nouveau produit',exact:true})).toBeVisible();
 const target=await context.newPage();await target.goto('https://www.vinted.es/items/new');await target.addScriptTag({content:script});await target.getByRole('button',{name:'Ouvrir Orion',exact:true}).click();expect(await target.locator('#orion-vinted-test').getAttribute('lang')).toBe('fr');await target.getByRole('button',{name:'Español',exact:true}).click();await expect(target.locator('#orion-vinted-test').getByRole('button',{name:'Borrar transferencia local',exact:true})).toBeVisible();
 await page.reload();await page.addScriptTag({content:script});await expect(page.getByRole('button',{name:'＋ Nuevo producto',exact:true})).toBeVisible();expect([...prefs.keys()]).toEqual(['orion-express-language']);
});
