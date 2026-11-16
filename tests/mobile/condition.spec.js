import {test,expect} from './fixture.js';import {readFile} from 'node:fs/promises';
const html=await readFile('tests/mobile/fixtures/vinted-form.html','utf8');
const modules=(await Promise.all(['vinted-adapter.js','condition.js'].map(f=>readFile('src/'+f,'utf8')))).join('\n').replace(/^export /gm,'');
const script=await readFile('orion-express.user.js','utf8');
async function init(page){await page.route('https://www.vinted.es/**',r=>r.fulfill({contentType:'text/html',body:html}));await page.goto('https://www.vinted.es/items/new');await page.addScriptTag({content:`(()=>{const errorMessage=e=>e.message;${modules};window.conditionTest=selectVintedCondition;})();`});await page.evaluate(()=>dependent.hidden=false);}
const states=[['Neuf avec étiquette','Nuevo con etiquetas'],['Neuf sans étiquette','Nuevo sin etiquetas'],['Très bon état','Muy bueno']];
for(const [fr,es]of states)test(`état ${fr} : radio effectif, Fait et correspondances FR/ES vérifiés`,async({page})=>{
 await init(page);
 for(const [wanted,label]of [[es,fr],[fr,es]]){
  await page.evaluate(({states,label})=>{const spanish=states.some(([,e])=>e===label);window.conditionOptions=states.map(([f,e])=>[spanish?e:f,'Descripción / description secondaire']);document.getElementById('condition').textContent='Sélectionne un état';window.conditionDelay=900;},{states,label});
  await page.evaluate(value=>{window.conditionOutcome=null;window.conditionTest(document,value).then(v=>window.conditionOutcome={ok:v},e=>window.conditionOutcome={error:e.message});},wanted);
  const row=page.getByRole('radio').filter({hasText:label}).filter({has:page.locator('input[type=radio]')});
  await expect(row).toHaveAttribute('aria-checked','true');await expect(row.locator('input')).toBeChecked();await expect(page.locator('#done')).toBeDisabled();
  await page.waitForFunction(()=>window.conditionOutcome);expect(await page.evaluate(()=>conditionOutcome.error)).toBeUndefined();await expect(page.locator('#condition')).toHaveText(label);await expect(page.locator('#popup')).toBeHidden();expect(await page.evaluate(()=>conditionBeforeConfirm)).toEqual({semantic:true,native:true,enabled:true});expect(await page.evaluate(()=>!!window.submitted)).toBe(false);
 }
});
test('Neuf ambigu : menu fermé, Fait non cliqué et état inchangé',async({page})=>{
 await init(page);const error=await page.evaluate(async()=>{try{await conditionTest(document,'Neuf');}catch(e){return e.message;}});expect(error).toContain('ambigu');await expect(page.locator('#popup')).toBeHidden();await expect(page.locator('#condition')).toHaveText('État');expect(await page.evaluate(()=>confirmations)).toEqual([]);
});
test('cocher seulement le DOM natif ne valide pas le composant ni Fait',async({page})=>{
 await init(page);await page.evaluate(()=>window.fakeNativeConditionOnly=true);const error=await page.evaluate(async()=>{try{await conditionTest(document,'Neuf avec étiquette');}catch(e){return e.message;}});expect(error).toBeTruthy();await expect(page.locator('#done')).toBeDisabled();expect(await page.evaluate(()=>state.condition)).toBe('');expect(await page.evaluate(()=>confirmations)).toEqual([]);await expect(page.locator('#popup')).toBeVisible();
});
test('menu restant ouvert après Fait : ne jamais annoncer un succès',async({page})=>{
 await init(page);await page.evaluate(()=>window.keepConditionMenuOpen=true);const error=await page.evaluate(async()=>{try{await conditionTest(document,'Neuf sans étiquette');}catch(e){return e.message;}});expect(error).toBeTruthy();await expect(page.locator('#popup')).toBeVisible();expect(await page.evaluate(()=>confirmations)).toEqual(['condition']);expect(await page.evaluate(()=>!!window.submitted)).toBe(false);
});
test('fiche ancienne Neuf : choix précis sans altérer photos et autres champs',async({page})=>{
 await page.route('https://example.com/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'}));await page.goto('https://example.com/');
 await page.evaluate(async()=>new Promise(resolve=>{const q=indexedDB.open('orion-express-db');q.onupgradeneeded=()=>q.result.createObjectStore('products',{keyPath:'id'});q.onsuccess=()=>{const db=q.result,tx=db.transaction('products','readwrite');tx.objectStore('products').put({id:'legacy',title:'Cartes anciennes',description:'Texte original',price:10,category:'Jeux de société',brand:'Marque originale',condition:'Neuf',shipping:'Petit',photos:[new Blob(['original-photo'],{type:'image/png'})]});tx.oncomplete=()=>{db.close();resolve();};};}));
 await page.addScriptTag({content:script});await page.getByRole('button',{name:/Cartes anciennes/}).click();await page.getByRole('button',{name:'Modifier',exact:true}).click();await expect(page.getByLabel('État',{exact:true})).toHaveValue('Neuf');await page.getByLabel('État',{exact:true}).selectOption('Neuf sans étiquette');await page.getByRole('button',{name:'Enregistrer la fiche'}).click();
 const result=await page.evaluate(async()=>new Promise(resolve=>{const q=indexedDB.open('orion-express-db');q.onsuccess=()=>{const db=q.result;db.transaction('products').objectStore('products').get('legacy').onsuccess=async e=>{const p=e.target.result;db.close();resolve({condition:p.condition,title:p.title,description:p.description,price:p.price,brand:p.brand,shipping:p.shipping,photo:await p.photos[0].text()});};};}));expect(result).toEqual({condition:'Neuf sans étiquette',title:'Cartes anciennes',description:'Texte original',price:10,brand:'Marque originale',shipping:'Petit',photo:'original-photo'});
});

test('variante mobile liée au changement natif : même état précis, confirmation vérifiée',async({page})=>{
 await init(page);await page.evaluate(()=>window.conditionNativeHandlerOnly=true);await page.evaluate(()=>conditionTest(document,'Nuevo sin etiquetas'));await expect(page.locator('#condition')).toHaveText('Neuf sans étiquette');await expect(page.locator('#popup')).toBeHidden();expect(await page.evaluate(()=>conditionBeforeConfirm)).toEqual({semantic:true,native:true,enabled:true});expect(await page.evaluate(()=>confirmations)).toEqual(['condition']);
});
