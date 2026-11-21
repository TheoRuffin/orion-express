import {test,expect} from './fixture.js';
import {readFile} from 'node:fs/promises';
const modules=(await Promise.all(['vinted-adapter.js','condition.js','choice-audit.js'].map(file=>readFile('src/'+file,'utf8')))).join('\n').replace(/^export /gm,'');
const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>[hidden]{display:none!important}input,button{font:16px sans-serif;padding:10px}[role=dialog]{position:fixed;inset:15px;background:white;border:1px solid}</style>
<form onsubmit="event.preventDefault();window.submitted=true"><div id="fields"><input id="category" readonly onclick="openCategory()" value="Jeux de société" aria-expanded="false" aria-controls="category-menu"><input id="condition" readonly value="Neuf sans étiquette" aria-expanded="false" aria-controls="condition-menu"><div id="package-size-1" role="presentation"><span data-testid="1-package-size--cell--title">Petit</span><input type="radio" id="package_type_selector_1" checked></div><div id="package-size-2" role="button"><span data-testid="2-package-size--cell--title">Moyen</span><input type="radio" id="package_type_selector_2"></div><input id="photos" type="file" multiple></div><button>Ajouter</button><button>Publier</button></form>
<section id="category-menu" role="dialog" hidden><h2>Catégorie</h2><input id="catalog-search-input"><div role="radio" id="category-a" aria-checked="false"><span class="web_ui__Cell__title">Jeux de société</span><span class="web_ui__Cell__body">Loisirs et collections</span><input type="radio"></div><div role="radio" id="category-b" aria-checked="false"><span class="web_ui__Cell__title">Jeux de société</span><span class="web_ui__Cell__body">Enfants > Jeux et jouets</span><input type="radio"></div><button id="category-done" disabled type="button">Fait</button></section><section id="condition-menu" role="dialog" hidden><h2>État</h2><div role="radio"><span class="web_ui__Cell__title">Neuf sans étiquette</span></div><button type="button">Fait</button></section>
<script>window.clicks=0;document.addEventListener('click',()=>window.clicks++);
function openCategory(){document.getElementById('category-menu').hidden=false;document.getElementById('category').setAttribute('aria-expanded','true');document.getElementById('category-done').disabled=true;for(const row of document.querySelectorAll('#category-menu [role=radio]')){row.setAttribute('aria-checked','false');row.querySelector('input').checked=false;}}
for(const row of document.querySelectorAll('#category-menu [role=radio]'))row.onclick=()=>{for(const option of document.querySelectorAll('#category-menu [role=radio]')){option.setAttribute('aria-checked',String(option===row));option.querySelector('input').checked=option===row;}window.pickedPath=row.querySelector('.web_ui__Cell__body').textContent;document.getElementById('category-done').disabled=false;};
document.getElementById('category-done').onclick=()=>{document.getElementById('category').value='Jeux de société';document.getElementById('category').setAttribute('aria-expanded','false');document.getElementById('category-menu').hidden=true;};</script>`;
async function init(page){
 await page.route('https://www.vinted.es/**',route=>route.fulfill({contentType:'text/html',body:html}));await page.goto('https://www.vinted.es/items/new');
 await page.addScriptTag({content:`(()=>{const errorMessage=e=>e.message;${modules};window.auditTest={auditVintedChoices,watchVintedChoices,selectVintedChoice};})();`});
 await page.evaluate(()=>{window.product={category:'Jeux de société',condition:'Nuevo sin etiquetas',shipping:'Pequeño'};Object.defineProperty(product,'photos',{get(){throw new Error('photos interdites');}});});
}
test('audit : valeurs attendues brutes, états FR/ES, colis exclusif et aucune action ni lecture photo',async({page})=>{
 await init(page);await page.locator('#photos').setInputFiles([{name:'one.png',mimeType:'image/png',buffer:Buffer.from('first')},{name:'two.png',mimeType:'image/png',buffer:Buffer.from('second')}]);
 await page.evaluate(()=>product.category='  Jeux de société  ');
 const rows=await page.evaluate(()=>auditTest.auditVintedChoices(document,product));expect(rows.map(row=>[row.key,row.expected,row.actual,row.matches])).toEqual([['category','  Jeux de société  ','Jeux de société',true],['condition','Nuevo sin etiquetas','Neuf sans étiquette',true],['shipping','Pequeño','Petit',true]]);
 expect(await page.evaluate(()=>auditTest.auditVintedChoices(document,{category:'Autre',condition:'Neuf avec étiquette',shipping:'Moyen'}).map(row=>row.matches))).toEqual([false,false,false]);
 expect(await page.evaluate(()=>[clicks,!!window.submitted])).toEqual([0,false]);expect(await page.locator('#photos').evaluate(async node=>Promise.all([...node.files].map(file=>file.text())))).toEqual(['first','second']);
 await page.evaluate(()=>document.querySelector('[data-testid=\"1-package-size--cell--title\"]').textContent='Moyen');expect((await page.evaluate(()=>auditTest.auditVintedChoices(document,product)))[2].matches).toBe(false);await page.evaluate(()=>document.querySelector('[data-testid=\"1-package-size--cell--title\"]').textContent='Petit');
 await page.evaluate(()=>document.getElementById('package_type_selector_2').checked=true);const shipping=await page.evaluate(()=>auditTest.auditVintedChoices(document,product).find(row=>row.key==='shipping'));expect(shipping.matches).toBe(false);expect(shipping.reason).toBe('Plusieurs colis sélectionnés.');
});
test('menu catégorie ou état encore ouvert : un libellé principal correct ne suffit pas',async({page})=>{
 await init(page);await page.evaluate(()=>{document.getElementById('category').removeAttribute('aria-expanded');document.getElementById('category-menu').hidden=false;document.getElementById('catalog-search-input').hidden=true;});
 let rows=await page.evaluate(()=>auditTest.auditVintedChoices(document,product));expect(rows[0].matches).toBe(false);expect(rows[0].reason).toBe('Menu encore ouvert.');
 await page.evaluate(()=>{document.getElementById('category-menu').hidden=true;document.getElementById('condition-menu').hidden=false;document.getElementById('condition').removeAttribute('aria-expanded');});
 rows=await page.evaluate(()=>auditTest.auditVintedChoices(document,product));expect(rows[0].matches).toBe(true);expect(rows[1].matches).toBe(false);expect(rows[1].reason).toBe('Menu encore ouvert.');expect(await page.evaluate(()=>clicks)).toBe(0);
});
test('watch : reset des propriétés état et colis après quatre secondes révoque les succès',async({page})=>{
 await init(page);await page.evaluate(()=>{window.reports=[];window.stopAudit=auditTest.watchVintedChoices(document,product,rows=>reports.push(rows));setTimeout(()=>{document.getElementById('condition').value='Bon état';document.getElementById('package_type_selector_1').checked=false;document.getElementById('package_type_selector_2').checked=true;},4000);});
 expect(await page.evaluate(()=>reports[0].every(row=>row.matches))).toBe(true);
 await page.waitForFunction(()=>reports.at(-1)?.find(row=>row.key==='condition').actual==='Bon état'&&reports.at(-1)?.find(row=>row.key==='shipping').actual==='Moyen',undefined,{timeout:8000});
 expect(await page.evaluate(()=>reports.at(-1).map(row=>row.matches))).toEqual([true,false,false]);expect(await page.evaluate(()=>[clicks,!!window.submitted])).toEqual([0,false]);await page.evaluate(()=>stopAudit());
});
test('watch : pas de boucle dans le panneau shadow, émission sur différence et nettoyage pagehide',async({page})=>{
 await init(page);await page.evaluate(()=>{window.reports=[];window.reads=0;const raw=product.category;Object.defineProperty(product,'category',{get(){window.reads++;return raw;}});const host=document.createElement('section');host.id='orion-vinted-test';document.body.append(host);window.panel=host.attachShadow({mode:'open'});window.stopAudit=auditTest.watchVintedChoices(document,product,rows=>{reports.push(rows);panel.textContent='État vérifié '+reports.length;});host.lang='fr';const input=document.createElement('input');panel.append(input);input.dispatchEvent(new Event('input',{bubbles:true,composed:true}));});
 await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,50)));expect(await page.evaluate(()=>[reports.length,reads])).toEqual([1,1]);
 await page.evaluate(()=>{document.getElementById('condition').value='Très bon état';document.getElementById('condition').dispatchEvent(new Event('change',{bubbles:true}));});await page.waitForFunction(()=>reports.length===2);expect(await page.evaluate(()=>reports.at(-1)[1].matches)).toBe(false);
 await page.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pagehide'));document.getElementById('condition').value='Neuf sans étiquette';document.getElementById('condition').dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('package-size-1').setAttribute('role','button');});
 await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,1200)));expect(await page.evaluate(()=>reports.length)).toBe(2);await page.evaluate(()=>{stopAudit();stopAudit();});
});

test('watch : retour bfcache relit immédiatement les propriétés puis arrêt définitif hors cache',async({page})=>{
 await init(page);
 const reports=await page.evaluate(async()=>{
  window.reports=[];window.stopAudit=auditTest.watchVintedChoices(document,product,rows=>reports.push(rows));
  window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));
  // A property-only restoration emits neither a DOM mutation nor an input/change event.
  document.getElementById('condition').value='Bon état';
  window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));
  await new Promise(resolve=>queueMicrotask(resolve));
  return window.reports;
 });
 expect(reports).toHaveLength(2);expect(reports[0][1]).toMatchObject({actual:'Neuf sans étiquette',matches:true});expect(reports[1][1]).toMatchObject({actual:'Bon état',matches:false});
 await page.evaluate(async()=>{
  window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false}));
  document.getElementById('condition').value='Très bon état';
  document.getElementById('condition').dispatchEvent(new Event('change',{bubbles:true}));
  document.getElementById('package-size-1').setAttribute('role','button');
  window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));
  await new Promise(resolve=>setTimeout(resolve,1200));
  stopAudit();stopAudit();
 });
 expect(await page.evaluate(()=>window.reports)).toHaveLength(2);expect(await page.evaluate(()=>[clicks,!!window.submitted])).toEqual([0,false]);
});


test('chemin A/B : même feuille ne prouve pas la hiérarchie, menu manuel et tentative invalident la preuve',async({page})=>{
 await init(page);const pathA='Loisirs et collections > Jeux de société',pathB='Enfants > Jeux et jouets > Jeux de société';
 await page.evaluate(value=>product.category=value,pathA);
 expect((await page.evaluate(()=>auditTest.auditVintedChoices(document,product)))[0]).toMatchObject({matches:false,reason:'Chemin de catégorie à confirmer.'});
 await page.evaluate(value=>auditTest.selectVintedChoice(document,'category',value),pathA);
 expect(await page.evaluate(()=>window.pickedPath)).toBe('Loisirs et collections');expect((await page.evaluate(()=>auditTest.auditVintedChoices(document,product)))[0].matches).toBe(true);
 await page.evaluate(value=>product.category=value,pathB);expect((await page.evaluate(()=>auditTest.auditVintedChoices(document,product)))[0]).toMatchObject({matches:false,reason:'Chemin de catégorie à confirmer.'});
 await page.evaluate(value=>product.category=value,pathA);await page.locator('#category').click();expect((await page.evaluate(()=>auditTest.auditVintedChoices(document,product)))[0].reason).toBe('Menu encore ouvert.');
 await page.locator('#category-b').click();await page.locator('#category-done').click();expect(await page.evaluate(()=>window.pickedPath)).toBe('Enfants > Jeux et jouets');
 expect((await page.evaluate(()=>auditTest.auditVintedChoices(document,product)))[0]).toMatchObject({actual:'Jeux de société',matches:false,reason:'Chemin de catégorie à confirmer.'});
 await page.evaluate(value=>auditTest.selectVintedChoice(document,'category',value),pathA);expect((await page.evaluate(()=>auditTest.auditVintedChoices(document,product)))[0].matches).toBe(true);
 await page.evaluate(async()=>{try{await auditTest.selectVintedChoice(document,'category','');}catch{}});expect((await page.evaluate(()=>auditTest.auditVintedChoices(document,product)))[0]).toMatchObject({matches:false,reason:'Chemin de catégorie à confirmer.'});
});
