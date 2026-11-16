import {test,expect} from './fixture.js';
import {readFile} from 'node:fs/promises';
const script=await readFile('orion-express.user.js','utf8');
const formHTML=await readFile('tests/mobile/fixtures/vinted-form.html','utf8');
async function setup(context,page){
 const values=new Map();await context.exposeBinding('orionGM',(_,{op,key,value})=>{if(op==='get')return values.has(key)?values.get(key):value;if(op==='set')values.set(key,value);if(op==='delete')values.delete(key);});
 await context.addInitScript(()=>{window.GM_getValue=(key,value)=>window.orionGM({op:'get',key,value});window.GM_setValue=(key,value)=>window.orionGM({op:'set',key,value});window.GM_deleteValue=key=>window.orionGM({op:'delete',key});});
 await context.route('https://example.com/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'}));
 await context.route('https://www.vinted.es/**',r=>r.fulfill({contentType:'text/html',body:formHTML}));
 await page.goto('https://example.com/');await page.addScriptTag({content:script});
 await page.getByRole('button',{name:'Créer « Jeu de cartes » à 10 €'}).click();await page.getByLabel('Description',{exact:true}).fill('Texte exact');await page.getByLabel('Catégorie',{exact:true}).fill('Loisirs > Jeux de société');await page.getByLabel('Marque',{exact:true}).fill('Sans marque');await page.getByLabel('État',{exact:true}).fill('Très bon état');await page.getByLabel('Format du colis',{exact:true}).fill('Petit');
 await page.locator('#photos').setInputFiles([{name:'one.png',mimeType:'image/png',buffer:Buffer.from('first')},{name:'two.png',mimeType:'image/png',buffer:Buffer.from('second')}]);await page.getByRole('button',{name:'Enregistrer la fiche'}).click();
 await page.getByRole('button',{name:'Préparer sur Vinted',exact:true}).click();
 const popup=page.waitForEvent('popup');await page.getByRole('link',{name:'Ouvrir Vinted et préremplir (test) ↗'}).click();const form=await popup;await form.waitForLoadState();await form.addScriptTag({content:script});await form.getByRole('button',{name:'Ouvrir Orion',exact:true}).click();return {form,values};
}
test('transfert entre origines, textes exacts, FileList ordre/octets, champs dynamiques et aucune publication',async({context,page})=>{
 const {form}=await setup(context,page);await expect(form.locator('#orion-vinted-test').getByRole('status')).toContainText('Tentative terminée');
 await expect(form.locator('#title')).toHaveValue('Jeu de cartes');await expect(form.locator('#description')).toHaveValue('Texte exact');await expect(form.locator('#price')).toHaveValue('10,00 €');await expect(form.locator('#brand')).toHaveText('Sans marque');await expect(form.locator('#condition')).toHaveText('Très bon état');expect(await form.evaluate(()=>({...window.state,confirmations:window.confirmations}))).toEqual({category:'Jeux de société',categoryPath:'Loisirs',brand:'Sans marque',condition:'Très bon état',shipping:1,price:10,confirmations:['category','brand','condition']});
 const files=await form.locator('input[type=file]').evaluate(async e=>Promise.all([...e.files].map(f=>f.text())));expect(files).toEqual(['first','second']);expect(await form.evaluate(()=>window.changes)).toBe(1);expect(await form.evaluate(()=>!!window.submitted)).toBe(false);
 await expect(form.getByRole('button',{name:'Préremplir une seule fois'})).toBeDisabled();await form.getByRole('button',{name:'Réessayer les textes et choix (sans photos)'}).click();await expect(form.locator('#orion-vinted-test').getByRole('status')).toContainText('Tentative terminée');expect(await form.evaluate(()=>window.changes)).toBe(1);
});
test('reprise ne réinjecte pas les photos et valeurs modifiées conservées',async({context,page})=>{
 const {form}=await setup(context,page);await expect(form.locator('#orion-vinted-test').getByRole('status')).toContainText('Tentative terminée');
 await form.locator('#title').fill('Ne pas remplacer');await form.getByRole('button',{name:'Réessayer les textes et choix (sans photos)'}).click();await expect(form.locator('#orion-vinted-test').getByRole('status')).toContainText('Tentative terminée');await expect(form.locator('#title')).toHaveValue('Ne pas remplacer');
 await form.reload();await form.addScriptTag({content:script});await form.getByRole('button',{name:'Ouvrir Orion',exact:true}).click();await expect(form.locator('#orion-vinted-test').getByRole('status')).toContainText('déjà été tenté');expect(await form.evaluate(()=>window.changes)).toBe(0);
});

test('bouton compact repliable : dimensions tactiles et aucun masquage large du bas écran',async({context,page})=>{
 const {form}=await setup(context,page);await expect(form.locator('#orion-vinted-test').getByRole('status')).toContainText('Tentative terminée');
 await form.getByRole('button',{name:'Réduire Orion',exact:true}).click();await expect(form.locator('#orion-vinted-test').locator('#body')).toBeHidden();
 const box=await form.locator('#orion-vinted-test').boundingBox();expect(box.width).toBeLessThan(120);expect(box.height).toBeLessThan(65);expect(box.height).toBeGreaterThanOrEqual(44);
 await form.screenshot({path:'tests/vinted-compact.png'});await form.getByRole('button',{name:'Ouvrir Orion',exact:true}).click();await expect(form.locator('#orion-vinted-test').getByRole('status')).toBeVisible();
});
