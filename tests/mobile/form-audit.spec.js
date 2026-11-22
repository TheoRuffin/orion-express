import {test,expect} from './fixture.js';
import {readFile} from 'node:fs/promises';
const modules=(await Promise.all(['vinted-adapter.js','condition.js','choice-audit.js','form-audit.js'].map(file=>readFile('src/'+file,'utf8')))).join('\n').replace(/^export /gm,'');
const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>[hidden]{display:none!important}body{font:16px sans-serif}input,textarea,button{font:inherit;padding:8px}</style>
<form id="listing" onsubmit="event.preventDefault();window.submitted=true"><input id="title" value="Juego exacto"><textarea id="description">Primera línea\nSegunda línea</textarea><input id="price" value="10,00 €"><button id="category" type="button" aria-expanded="false">Jeux de société</button><button id="brand" type="button" aria-expanded="false" aria-controls="brand-menu">Sin marca</button><button id="condition" type="button" aria-expanded="false">Nuevo sin etiquetas</button><div id="package-size-1" role="presentation"><span>Pequeño</span><input id="package_type_selector_1" type="radio" checked></div><div id="package-size-2" role="button"><span>Mediano</span><input id="package_type_selector_2" type="radio"></div><input id="photos" type="file" multiple><button>Ajouter</button><button>Publier</button></form><div id="brand-menu" role="dialog" aria-labelledby="brand" hidden><h2>Marca</h2><input id="brand-search-input"></div><div id="orion-vinted-test"><input aria-invalid="true" value="Orion UI only"></div>`;
async function init(page){
 await page.route('https://www.vinted.es/**',route=>route.fulfill({contentType:'text/html',body:html}));await page.goto('https://www.vinted.es/items/new');
 await page.addScriptTag({content:`(()=>{const errorMessage=e=>e.message;${modules};window.formAudit={auditVintedForm,auditVintedPhotos};})();`});
 await page.evaluate(()=>{
   window.clicks=0;document.addEventListener('click',()=>window.clicks++);
   window.product=Object.freeze({title:'Juego exacto',description:'Primera línea\r\nSegunda línea',price:10,category:'Jeux de société',brand:'Sin marca',condition:'Neuf sans étiquette',shipping:'Petit',photos:Object.freeze(['original-photo-1','original-photo-2'])});
 });
}
async function rows(page){return page.evaluate(()=>formAudit.auditVintedForm(document,product,{photoManifest:window.manifest}));}
const row=(rows,key)=>rows.find(value=>value.key===key);
test('audit complet : huit champs lus, texte exact et aucun clic ni modification des originaux',async({page})=>{
 await init(page);const actual=await rows(page);expect(actual.map(value=>value.key)).toEqual(['title','description','price','category','brand','condition','shipping','photos']);
 expect(actual.filter(value=>value.key!=='photos').every(value=>value.matches)).toBe(true);expect(row(actual,'photos')).toMatchObject({matches:false,state:'unverified',reason:'Photos natives à vérifier.'});
 expect(await page.evaluate(()=>[clicks,!!window.submitted,product.photos.join('|'),document.getElementById('description').value])).toEqual([0,false,'original-photo-1|original-photo-2','Primera línea\nSegunda línea']);
 await page.evaluate(()=>{document.getElementById('title').value='Juego exacto ';document.getElementById('description').value='Primera línea\nSegunda línea ';});const changed=await rows(page);expect(row(changed,'title').matches).toBe(false);expect(row(changed,'description').matches).toBe(false);
});
test('prix : formats FR/ES en centimes et vraie valeur du nouveau champ après remplacement DOM',async({page})=>{
 await init(page);for(const value of ['10','10.00','10,00','10 €']){await page.locator('#price').fill(value);expect(row(await rows(page),'price').matches).toBe(true);}
 for(const value of ['NaN €','10,001','11,00 €','']){await page.locator('#price').fill(value);expect(row(await rows(page),'price').matches).toBe(false);}
 await page.evaluate(()=>{const replacement=document.createElement('input');replacement.id='price';replacement.value='19,00 €';document.getElementById('price').replaceWith(replacement);});expect(row(await rows(page),'price')).toMatchObject({actual:'19,00 €',matches:false});
});
test('marque : fenêtre non confirmée, changement tardif et valeur native sélectionnée',async({page})=>{
 await init(page);expect(row(await rows(page),'brand').matches).toBe(true);
 await page.evaluate(()=>{document.getElementById('brand-menu').hidden=false;});expect(row(await rows(page),'brand')).toMatchObject({matches:false,reason:'Menu encore ouvert.'});
 await page.evaluate(()=>{document.getElementById('brand-menu').hidden=true;document.getElementById('brand').textContent='Otra marca';});expect(row(await rows(page),'brand')).toMatchObject({actual:'Otra marca',matches:false});
 await page.evaluate(()=>{const input=document.createElement('input');input.id='brand';input.readOnly=true;input.value='Sin marca';document.getElementById('brand').replaceWith(input);});expect(row(await rows(page),'brand').matches).toBe(true);
});
test('marque : fond aria-hidden pendant le menu puis fermeture et valeur finale accessibles',async({page})=>{
 await init(page);await page.evaluate(()=>{document.getElementById('listing').setAttribute('aria-hidden','true');document.getElementById('brand-menu').hidden=false;});
 expect(row(await rows(page),'brand')).toMatchObject({actual:'Sin marca',matches:false,reason:'Menu encore ouvert.'});
 await page.evaluate(()=>{document.getElementById('brand-menu').hidden=true;});expect(row(await rows(page),'brand')).toMatchObject({actual:'Sin marca',matches:false,reason:'Champ non accessible.'});
 await page.evaluate(()=>{document.getElementById('listing').removeAttribute('aria-hidden');});expect(row(await rows(page),'brand')).toMatchObject({actual:'Sin marca',matches:true,reason:'Valeur vérifiée.'});expect(await page.evaluate(()=>[clicks,!!window.submitted])).toEqual([0,false]);
});
test('prix et marque : source invalide, champ absent ou ambigu, erreur de marque et aucune substitution',async({page})=>{
 await init(page);for(const price of ['pas un prix',Number.NaN,Infinity]){const actual=await page.evaluate(price=>formAudit.auditVintedForm(document,{...product,price}),price);expect(row(actual,'price')).toMatchObject({matches:false,reason:'Prix invalide ou non reconnu dans Vinted.'});}
 const empty=await page.evaluate(()=>formAudit.auditVintedForm(document,{...product,brand:''}));expect(row(empty,'brand')).toMatchObject({matches:false,reason:'Valeur manquante dans la fiche.'});
 await page.evaluate(()=>{document.getElementById('brand').setAttribute('aria-invalid','true');});expect(row(await rows(page),'brand')).toMatchObject({matches:false,reason:'Champ signalé invalide par Vinted.'});
 await page.evaluate(()=>{document.getElementById('brand').removeAttribute('aria-invalid');for(const id of ['price','brand'])document.getElementById(id).after(document.getElementById(id).cloneNode(true));});
 for(const key of ['price','brand'])expect(row(await rows(page),key)).toMatchObject({matches:false,reason:'Champ absent ou ambigu.'});
 await page.evaluate(()=>{for(const id of ['price','brand'])document.querySelectorAll(`[id="${id}"]`).forEach(field=>field.remove());});for(const key of ['price','brand'])expect(row(await rows(page),key)).toMatchObject({matches:false,reason:'Champ absent ou ambigu.'});
 expect(await page.evaluate(()=>[clicks,!!window.submitted])).toEqual([0,false]);
});
test('validations natives : aria-invalid, contrainte HTML et erreurs associées visibles, sans confondre aide',async({page})=>{
 await init(page);await page.evaluate(()=>{
   document.getElementById('title').setAttribute('aria-invalid','true');
   document.getElementById('price').setCustomValidity('Rechazado');
   for(const [field,id,attribute,role]of [['description','description-error','aria-describedby','alert'],['brand','brand-message','aria-errormessage','']]){
     const error=document.createElement('p');error.id=id;error.textContent='Valor rechazado';if(role)error.setAttribute('role',role);document.body.append(error);document.getElementById(field).setAttribute(attribute,id);
   }
   const help=document.createElement('p');help.id='condition-help';help.textContent='Selecciona el estado real';document.body.append(help);document.getElementById('condition').setAttribute('aria-describedby',help.id);
 });const invalid=await rows(page);for(const key of ['title','price','description','brand'])expect(row(invalid,key).matches).toBe(false);expect(row(invalid,'condition').matches).toBe(true);
 await page.evaluate(()=>{document.getElementById('title').removeAttribute('aria-invalid');document.getElementById('price').setCustomValidity('');document.getElementById('description-error').hidden=true;document.getElementById('brand-message').remove();document.getElementById('package-size-1').setAttribute('aria-invalid','true');});const restored=await rows(page);for(const key of ['title','price','description','brand'])expect(row(restored,key).matches).toBe(true);expect(row(restored,'shipping').matches).toBe(false);
});
test('erreurs associées : ids explicites et assertive reconnus, aide ordinaire et erreur cachée ignorées',async({page})=>{
 await init(page);await page.evaluate(()=>{
   const error=document.createElement('p');error.id='price-error';error.textContent='Precio rechazado';document.body.append(error);document.getElementById('price').setAttribute('aria-describedby',error.id);
   const announcement=document.createElement('p');announcement.id='brand-notice';announcement.setAttribute('aria-live','assertive');announcement.textContent='Marca rechazada';document.body.append(announcement);document.getElementById('brand').setAttribute('aria-describedby',announcement.id);
 });for(const key of ['price','brand'])expect(row(await rows(page),key)).toMatchObject({matches:false,reason:expect.stringContaining('Erreur associée au champ')});
 await page.evaluate(()=>{document.getElementById('price-error').style.display='none';document.getElementById('brand-notice').removeAttribute('aria-live');});for(const key of ['price','brand'])expect(row(await rows(page),key).matches).toBe(true);
});
test('photos : FileList exact avec manifeste reste un transfert local, aucune acceptation native inventée',async({page})=>{
 await init(page);await page.locator('#photos').setInputFiles([{name:'one.png',mimeType:'image/png',buffer:Buffer.from('first')},{name:'two.png',mimeType:'image/png',buffer:Buffer.from('second')}]);
 await page.evaluate(()=>{window.manifest=[...document.getElementById('photos').files].map(({name,size,type,lastModified})=>({name,size,type,lastModified}));});expect(row(await rows(page),'photos')).toMatchObject({matches:false,state:'uploaded',reason:'Photos natives à vérifier.'});
 const original=await page.locator('#photos').evaluate(async input=>Promise.all([...input.files].map(file=>file.text())));expect(original).toEqual(['first','second']);
 await page.evaluate(()=>window.manifest.reverse());expect(row(await rows(page),'photos').state).toBe('mismatch');await page.evaluate(()=>{manifest.reverse();manifest[0].size++;});expect(row(await rows(page),'photos').state).toBe('mismatch');
 await page.evaluate(()=>{manifest[0].size--;document.getElementById('photos').setAttribute('aria-invalid','true');});expect(row(await rows(page),'photos').state).toBe('invalid');expect(await page.locator('#photos').evaluate(async input=>Promise.all([...input.files].map(file=>file.text())))).toEqual(original);expect(await page.evaluate(()=>[clicks,!!window.submitted])).toEqual([0,false]);
});
test('champ supplémentaire invalide : signalé sans intégrer recherche des menus ni panneau Orion',async({page})=>{
 await init(page);await page.evaluate(()=>{
   const field=document.createElement('input');field.id='players';field.required=true;document.getElementById('listing').append(field);
   const search=document.createElement('input');search.id='catalog-search-input';search.setAttribute('aria-invalid','true');document.getElementById('listing').append(search);
 });expect(row(await rows(page),'dynamic')).toMatchObject({matches:false,actual:'1 champ(s) signalé(s) invalide(s)'});
 await page.locator('#players').fill('2');expect(row(await rows(page),'dynamic')).toBeUndefined();expect(await page.evaluate(()=>[clicks,!!window.submitted])).toEqual([0,false]);
});
