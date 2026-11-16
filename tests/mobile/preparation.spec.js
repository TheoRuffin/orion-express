import {test,expect} from './fixture.js';
import {readFile} from 'node:fs/promises';
const script=await readFile('orion-express.user.js','utf8');
const photo=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
async function setup(page){
 await page.route('https://example.com/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><title>Catalogue test</title>'}));
 await page.goto('https://example.com/');await page.addScriptTag({content:script});await page.getByRole('button',{name:'Créer « Jeu de cartes » à 10 €'}).click();
 await page.getByLabel('Description',{exact:true}).fill('Jeu de cartes complet');await page.locator('#photos').setInputFiles([{name:'1.png',mimeType:'image/png',buffer:photo},{name:'2.png',mimeType:'image/png',buffer:photo}]);await page.getByRole('button',{name:'Enregistrer la fiche'}).click();
}
test('préparation, photos groupées, reprise et catégorie sans altérer le catalogue',async({page})=>{
 await setup(page);await page.getByRole('button',{name:'Préparer sur Vinted',exact:true}).click();
 await expect(page.locator('#prep-photos img')).toHaveCount(2);await expect(page.locator('#prep-summary')).toContainText('2 photo(s)');
 const dl=page.waitForEvent('download');await page.getByRole('link',{name:'Télécharger toutes les photos (ZIP)'}).click();expect((await dl).suggestedFilename()).toBe('orion-vinted-photos.zip');
 await page.locator('[data-check=brand]').check();await expect(page.locator('[data-check=brand]')).toBeChecked();
 await page.getByRole('button',{name:'J’ai changé de catégorie : revérifier les choix'}).click();await expect(page.locator('[data-check=brand]')).not.toBeChecked();
 await page.locator('[data-check=photos]').check();await expect(page.getByRole('status').first()).toContainText('Vérification enregistrée');await page.reload();await page.addScriptTag({content:script});await page.getByRole('button',{name:'Reprendre ma préparation Vinted'}).click();await expect(page.locator('[data-check=photos]')).toBeChecked();
 expect(await page.locator('.shell').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);await page.screenshot({path:'tests/preparation-iphone.png'});
 await page.getByRole('button',{name:'← Retour à la fiche produit'}).click();await expect(page.locator('.photos img')).toHaveCount(2);await expect(page.getByRole('heading',{name:'Jeu de cartes',exact:true})).toBeVisible();
});
test('formulaire contrôlé Vinted : transfert manuel, champs dynamiques et aucune soumission',async({page,context})=>{
 await setup(page);await page.getByRole('button',{name:'Préparer sur Vinted',exact:true}).click();
 // Clipboard is controlled in this test: no assertion about iOS clipboard permissions.
 await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.testCopied=text;}}});});
 await page.getByRole('button',{name:'Copier titre',exact:true}).click();const copied=await page.evaluate(()=>window.testCopied);expect(copied).toBe('Jeu de cartes');
 await context.route('https://www.vinted.es/**',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><h1>FORMULAIRE CONTRÔLÉ, PAS VINTED RÉEL</h1><form onsubmit="event.preventDefault();window.submitted=true"><label>Título<input id="title"></label><label>Fotos<input type="file" multiple accept="image/*"></label><label for="category">Categoría</label><select id="category" onchange="document.querySelector('#dynamic').hidden=false"><option>Elegir</option><option>Juegos de mesa</option></select><div id="dynamic" hidden><label>Idioma<input></label></div><button>Publicar</button></form>`}));
 const popup=page.waitForEvent('popup');await page.getByRole('link',{name:'Ouvrir le vrai formulaire Vinted ↗'}).click();const form=await popup;await form.waitForLoadState();
 await form.getByLabel('Título',{exact:true}).fill(copied);await form.getByLabel('Categoría',{exact:true}).selectOption({label:'Juegos de mesa'});await expect(form.getByLabel('Idioma')).toBeVisible();await form.getByLabel('Fotos').setInputFiles({name:'manual.png',mimeType:'image/png',buffer:photo});
 expect(await form.evaluate(()=>!!window.submitted)).toBe(false);await expect(form.locator('#orion-express-v2')).toHaveCount(0);await expect(form.getByLabel('Título',{exact:true})).toHaveValue('Jeu de cartes');
});
test('erreurs de préparation et annulation de partage gardent les données',async({page})=>{
 await setup(page);await page.getByRole('button',{name:'Préparer sur Vinted',exact:true}).click();
 await page.evaluate(()=>{Object.defineProperty(navigator,'canShare',{value:()=>true});Object.defineProperty(navigator,'share',{value:async()=>{throw new DOMException('Cancel','AbortError');}});});
 await page.getByRole('button',{name:'Partager les photos ensemble'}).click();await expect(page.getByRole('status').first()).toContainText('Partage annulé');await expect(page.locator('[data-check=photos]')).not.toBeChecked();
 await page.getByRole('button',{name:'← Retour à la fiche produit'}).click();await page.getByRole('button',{name:'Modifier',exact:true}).click();await page.getByLabel('Description',{exact:true}).fill('');await page.getByRole('button',{name:'Enregistrer la fiche'}).click();await page.getByRole('button',{name:'Préparer sur Vinted',exact:true}).click();await expect(page.getByRole('status')).toContainText('Ajoutez');const photoCount=await page.evaluate(async()=>new Promise(resolve=>{const q=indexedDB.open('orion-express-db');q.onsuccess=()=>{const db=q.result;db.transaction('products').objectStore('products').getAll().onsuccess=e=>{resolve(e.target.result[0].photos.length);db.close();};};}));expect(photoCount).toBe(2);
});
