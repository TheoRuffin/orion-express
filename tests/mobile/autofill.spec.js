import {test,expect} from './fixture.js';
import {readFile} from 'node:fs/promises';
const script=await readFile('orion-express.user.js','utf8');
const formHTML=await readFile('tests/mobile/fixtures/vinted-form.html','utf8');
async function setup(context,page,{mode="normal"}={}){
 const openings=[];const pageCount=context.pages().length;
 const values=new Map();await context.exposeBinding('orionGM',(_,{op,key,value})=>{if(op==='get')return values.has(key)?values.get(key):value;if(op==='set')values.set(key,value);if(op==='delete')values.delete(key);});
 await context.addInitScript(()=>{window.GM_getValue=(key,value)=>window.orionGM({op:'get',key,value});window.GM_setValue=(key,value)=>window.orionGM({op:'set',key,value});window.GM_deleteValue=key=>window.orionGM({op:'delete',key});});
 await context.route('https://example.com/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'}));
 await context.route('https://www.vinted.es/**',r=>{openings.push(r.request().url());return r.fulfill({contentType:'text/html',body:formHTML});});
 await page.goto('https://example.com/');
 // Model an OS interception only in this fault fixture. Normal tests use the unchanged script and real navigation.
 const loadedScript=mode==='blocked'?script.replace('window.location.assign(url);','window.navigationAttempts=(window.navigationAttempts||0)+1;'):script;
 await page.addScriptTag({content:loadedScript});
 await page.getByRole('button',{name:'Créer « Jeu de cartes » à 10 €'}).click();await page.getByLabel('Description',{exact:true}).fill('Texte exact');await page.getByLabel('Catégorie',{exact:true}).fill('Loisirs > Jeux de société');await page.getByLabel('Marque',{exact:true}).fill('Sans marque');await page.getByLabel('État',{exact:true}).selectOption('Très bon état');await page.getByLabel('Format du colis',{exact:true}).fill('Petit');
 await page.locator('#photos').setInputFiles([{name:'one.png',mimeType:'image/png',buffer:Buffer.from('first')},{name:'two.png',mimeType:'image/png',buffer:Buffer.from('second')}]);await page.getByRole('button',{name:'Enregistrer la fiche'}).click();
 await page.getByRole('button',{name:'Préparer sur Vinted',exact:true}).click();
 const button=page.getByRole('button',{name:'Ouvrir Vinted et préremplir (test) ↗'});
 await expect(page.locator('a[href^="orion:"]')).toHaveCount(0);
 await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedLink=text;}}});});await page.getByRole('button',{name:'Copier le lien pour Orion'}).click();const url=await page.evaluate(()=>window.copiedLink);expect(url).toMatch(/^https:\/\/www\.vinted\.es\/items\/new#orion=/);
 await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('permission');}}});});await page.getByRole('button',{name:'Copier le lien pour Orion'}).click();await expect(page.getByRole('textbox',{name:'Lien à coller dans Orion'})).toHaveValue(url);
 if(mode==='blocked'){
  await button.click();return {source:page,openings,url,values};
 }
 await button.click();await page.waitForURL(url);if(mode==='nohash')await page.goto(url.split('#')[0]);const form=page;await form.waitForLoadState();await form.addScriptTag({content:script});await form.getByRole('button',{name:'Ouvrir Orion',exact:true}).click();
 expect(context.pages().length).toBe(pageCount);if(mode==='normal')expect(openings).toHaveLength(1);return {form,values,openings,nonce:new URL(url).hash.slice('#orion='.length)};
}
test('transfert entre origines, textes exacts, FileList ordre/octets, champs dynamiques et aucune publication',async({context,page})=>{
 const {form,values,nonce}=await setup(context,page);await expect(form.locator('#orion-vinted-test').getByRole('status')).toContainText('Tentative terminée');
 await expect(form.locator('#title')).toHaveValue('Jeu de cartes');await expect(form.locator('#description')).toHaveValue('Texte exact');await expect(form.locator('#price')).toHaveValue('10,00 €');await expect(form.locator('#brand')).toHaveText('Sans marque');await expect(form.locator('#condition')).toHaveText('Très bon état');expect(await form.evaluate(()=>({...window.state,confirmations:window.confirmations}))).toEqual({category:'Jeux de société',categoryPath:'Loisirs',brand:'Sans marque',condition:'Très bon état',shipping:1,price:10,confirmations:['category','brand','condition']});
 expect(JSON.parse(values.get('orion-express-launch-ack-3.2.4-'+nonce)).state).toBe('complete');
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

test('reconstruction après photos : colis Petit conservé avec les deux photos et catégorie finale',async({context,page})=>{
 await context.addInitScript(()=>{window.photoResetsParcel=true;window.rerenderParcel=true;});
 const {form}=await setup(context,page);await expect(form.locator('#orion-vinted-test').getByRole('status')).toContainText('Tentative terminée');
 await expect(form.locator('#package_type_selector_1')).toBeChecked();await expect(form.locator('#package_type_selector_2')).not.toBeChecked();await expect(form.locator('#category')).toHaveText('Jeux de société');
 expect(await form.evaluate(()=>[state.shipping,state.categoryPath,changes,!!window.submitted])).toEqual([1,'Loisirs',1,false]);expect(await form.locator('input[type=file]').evaluate(async e=>Promise.all([...e.files].map(f=>f.text())))).toEqual(['first','second']);
});


test('interception simulée par le système : aucun faux succès ni deuxième ouverture automatique',async({context,page})=>{
 const {source,openings,url}=await setup(context,page,{mode:'blocked'});
 await expect(source.locator('#vinted-launch-status')).toContainText('Ouverture demandée');await expect(source.getByRole('button',{name:'Ouvrir Vinted et préremplir (test) ↗'})).toBeDisabled();
 await expect(source.locator('#vinted-launch-status')).toContainText('Aucune confirmation',{timeout:15000});expect(openings).toHaveLength(0);expect(await source.evaluate(()=>navigationAttempts)).toBe(1);await expect(source.getByRole('button',{name:'Copier le lien pour Orion'})).toBeVisible();
 const nonce=new URLSearchParams(new URL(url).hash.slice(1)).get('orion');
 await source.evaluate(async nonce=>{await GM_setValue('orion-express-launch-ack-3.2.4-'+nonce,JSON.stringify({nonce,state:'complete',at:Date.now()}));document.dispatchEvent(new Event('visibilitychange'));},nonce);
 await expect(source.locator('#vinted-launch-status')).toContainText('Préremplissage terminé');expect(openings).toHaveLength(0);
});
test('connexion ayant perdu le fragment : reprise explicite avec les mêmes photos, sans automatique',async({context,page})=>{
 const {form,values,nonce}=await setup(context,page,{mode:'nohash'});await expect(form.locator('#orion-vinted-test').getByRole('status')).toContainText('Prêt :');await expect(form.locator('#title')).toBeEmpty();expect(await form.evaluate(()=>changes)).toBe(0);
 await form.getByRole('button',{name:'Préremplir une seule fois',exact:true}).click();await expect(form.locator('#orion-vinted-test').getByRole('status')).toContainText('Tentative terminée');await expect(form.locator('#title')).toHaveValue('Jeu de cartes');expect(await form.locator('input[type=file]').evaluate(async e=>Promise.all([...e.files].map(f=>f.text())))).toEqual(['first','second']);expect(await form.evaluate(()=>!!window.submitted)).toBe(false);expect(JSON.parse(values.get('orion-express-launch-ack-3.2.4-'+nonce)).state).toBe('complete');
});
