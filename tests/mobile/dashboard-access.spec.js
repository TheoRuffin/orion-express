import {test,expect} from './fixture.js';
import {readFile} from 'node:fs/promises';
const script=await readFile('orion-express.user.js','utf8');
async function boot(page){
 await page.addInitScript(()=>localStorage.setItem('orion-express-language','es'));
 await page.route('https://example.com/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Example Domain</title>'}));
 await page.goto('https://example.com/');
 await page.evaluate(async()=>new Promise(resolve=>{const q=indexedDB.open('orion-express-db');q.onupgradeneeded=()=>q.result.createObjectStore('products',{keyPath:'id'});q.onsuccess=()=>{const db=q.result,tx=db.transaction('products','readwrite');tx.objectStore('products').put({id:'existing',title:'Producto original',description:'Texto original',price:10,photos:[new Blob(['foto-original'],{type:'image/png'})]});tx.oncomplete=()=>{db.close();resolve();};};}));
 await page.addScriptTag({content:script});await expect(page.locator('.card')).toHaveCount(1);
}
test('accès dashboard : origine exacte, lien Orion documenté, titre app et copie sans toucher les produits',async({page})=>{
 await boot(page);await expect(page).toHaveTitle('Orion Express');await expect(page.locator('meta[name="application-name"]')).toHaveAttribute('content','Orion Express');await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute('content','Orion Express');await expect(page.locator('link[rel="manifest"],meta[name="apple-mobile-web-app-capable"]')).toHaveCount(0);
 await page.getByRole('button',{name:'Acceso directo en Orion',exact:true}).click();await expect(page.getByRole('heading',{name:'Acceso directo en Orion',exact:true})).toBeVisible();await expect(page.getByRole('textbox',{name:'Dirección del panel',exact:true})).toHaveValue('https://example.com/');
 const link=page.getByRole('link',{name:'Abrir el panel en Orion',exact:true});await expect(link).toHaveAttribute('href','orion://open-url?url=https%3A%2F%2Fexample.com%2F');
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copiedDashboard=text;}}}));
 await page.getByRole('button',{name:'Copiar dirección del panel',exact:true}).click();expect(await page.evaluate(()=>copiedDashboard)).toBe('https://example.com/');
 await page.getByRole('button',{name:'Copiar enlace del atajo de Orion',exact:true}).click();expect(await page.evaluate(()=>copiedDashboard)).toBe('orion://open-url?url=https%3A%2F%2Fexample.com%2F');
 await expect(page.locator('main')).toContainText('este modo cierra las pestañas de la sesión anterior');await expect(page.locator('main')).toContainText('el userscript no puede modificarlos');
 await page.getByRole('button',{name:'Français',exact:true}).click();await expect(page.getByRole('heading',{name:'Accès direct dans Orion',exact:true})).toBeVisible();await page.getByRole('button',{name:'← Catalogue',exact:true}).click();await expect(page.locator('.card')).toHaveCount(1);await page.getByRole('button',{name:/Producto original/}).click();await expect(page.getByRole('heading',{name:'Producto original',exact:true})).toBeVisible();
 const value=await page.evaluate(async()=>new Promise(resolve=>{const q=indexedDB.open('orion-express-db');q.onsuccess=()=>{const db=q.result;db.transaction('products').objectStore('products').get('existing').onsuccess=async e=>{const p=e.target.result;db.close();resolve({title:p.title,description:p.description,price:p.price,photo:await p.photos[0].text(),schemaVersion:p.schemaVersion});};};}));expect(value).toEqual({title:'Producto original',description:'Texto original',price:10,photo:'foto-original',schemaVersion:undefined});
});
test('accès dashboard : refus du presse-papiers affiche le lien complet sélectionnable',async({page})=>{
 await boot(page);await page.getByRole('button',{name:'Acceso directo en Orion',exact:true}).click();await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('denied');}}}));
 await page.getByRole('button',{name:'Copiar enlace del atajo de Orion',exact:true}).click();const text=page.getByRole('textbox',{name:'Texto para copiar',exact:true});await expect(text).toBeVisible();await expect(text).toHaveValue('orion://open-url?url=https%3A%2F%2Fexample.com%2F');expect(await text.evaluate(e=>e.selectionEnd-e.selectionStart)).toBe((await text.inputValue()).length);await expect(page.getByRole('status')).toContainText('Mantén pulsado');
 await page.getByRole('button',{name:'← Catálogo',exact:true}).click();await expect(page.locator('.card')).toHaveCount(1);await expect(page).toHaveTitle('Orion Express');
});
