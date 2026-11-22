import {test,expect} from './fixture.js';
import {readFile} from 'node:fs/promises';
const html=await readFile('tests/mobile/fixtures/vinted-form.html','utf8');
const modules=(await Promise.all(['vinted-adapter.js','condition.js','choice-audit.js','form-audit.js','reliability.js'].map(file=>readFile('src/'+file,'utf8')))).join('\n').replace(/^export /gm,'');
const one=Buffer.from('first-original-photo'),two=Buffer.from('second-original-photo');
async function init(page,{settings={},initial={},source={},nonce}={}){
 await page.route('https://www.vinted.es/**',route=>route.fulfill({contentType:'text/html',body:html}));await page.goto('https://www.vinted.es/items/new');
 await page.addScriptTag({content:`(()=>{const errorMessage=e=>e.message;${modules};window.recoveryTest={auditVintedForm,createVintedRecovery,selectVintedChoice,setVintedPrice};})();`});
 await page.evaluate(async()=>{
   window.product=Object.freeze({title:'Juego exacto',description:'Descripción exacta\nSin cambios',price:10,category:'Loisirs > Jeux de société',brand:'Sans marque',condition:'Très bon état',shipping:'Petit',photos:Object.freeze(['original-photo-one','original-photo-two'])});
   await recoveryTest.selectVintedChoice(document,'category',product.category);
   document.getElementById('title').value=product.title;document.getElementById('description').value=product.description;
   document.getElementById('price').value='10,00 €';state.price=10;
   document.getElementById('brand').textContent=product.brand;state.brand=product.brand;
   document.getElementById('condition').textContent=product.condition;state.condition=product.condition;dependent.hidden=false;parcel(1);
 });
 await page.locator('input[type=file]').setInputFiles([{name:'one.png',mimeType:'image/png',buffer:one},{name:'two.png',mimeType:'image/png',buffer:two}]);
 await page.evaluate(({settings,initial,source,nonce})=>{
   if(nonce!==undefined)history.replaceState(null,'','#orion='+encodeURIComponent(nonce));
   if(Object.keys(source).length)window.product=Object.freeze({...product,...source});
   for(const [key,value]of Object.entries(initial))document.getElementById(key).value=value;
   window.manifest=[...document.querySelector('input[type=file]').files].map(({name,size,type,lastModified})=>({name,size,type,lastModified}));
   window.reports=[];window.outcomes=[];window.failures=[];window.stopMessages=[];window.recoveryRequests=0;window.mutations=[];window.manualBusy=false;
   window.audit=()=>recoveryTest.auditVintedForm(document,product,{photoManifest:manifest});
   document.addEventListener('input',event=>{if(['title','description','price'].includes(event.target.id))mutations.push({key:event.target.id,value:event.target.value,at:performance.now(),kind:'input'});},true);
   document.addEventListener('click',event=>mutations.push({key:event.target.id,at:performance.now(),kind:'click'}),true);
   window.runRecovery=()=>recovery.reconcile().then(outcome=>{outcomes.push(outcome);return outcome;},error=>{failures.push({name:error.name,message:error.message});return {error:error.name};});
   window.recovery=recoveryTest.createVintedRecovery(document,product,{audit,report:result=>reports.push(result),requestRecovery:()=>{recoveryRequests++;return runRecovery();},isBusy:()=>manualBusy,onStop:message=>stopMessages.push(message),stableMs:80,debounceMs:35,durationMs:20000,...settings});
   recovery.arm(Object.fromEntries(audit().filter(row=>['title','description','price'].includes(row.key)).map(row=>[row.key,row.matches?'Valeur vérifiée.':'Manuel : contenu antérieur conservé.'])));
 },{settings,initial,source,nonce});
}
async function assertOriginals(page){
 expect(await page.locator('input[type=file]').evaluate(async input=>Promise.all([...input.files].map(file=>file.text())))).toEqual([one.toString(),two.toString()]);
 expect(await page.evaluate(()=>[changes,!!window.submitted,product.photos.join('|')])).toEqual([1,false,'original-photo-one|original-photo-two']);
 const photos=await page.evaluate(()=>audit().find(row=>row.key==='photos'));expect(photos).toMatchObject({matches:false,state:'uploaded',reason:'Photos natives à vérifier.'});
}
async function assertSeven(page){
 const known=await page.evaluate(()=>audit().filter(row=>row.key!=='photos'&&row.key!=='dynamic'));expect(known).toHaveLength(7);expect(known.filter(row=>!row.matches)).toEqual([]);
 await expect(page.locator('#title')).toHaveValue('Juego exacto');await expect(page.locator('#description')).toHaveValue('Descripción exacta\nSin cambios');await expect(page.locator('#price')).toHaveValue(/10[,.]00\s*€/);await expect(page.locator('#category')).toHaveText('Jeux de société');await expect(page.locator('#brand')).toHaveText('Sans marque');await expect(page.locator('#condition')).toHaveText('Très bon état');await expect(page.locator('#package_type_selector_1')).toBeChecked();await expect(page.locator('#package_type_selector_2')).not.toBeChecked();
}
test('reset tardif des sept valeurs : reprise automatique bornée, valeurs finales exactes et photos intactes',async({page})=>{
 await init(page);expect((await page.evaluate(()=>runRecovery())).stable).toBe(true);
 await page.evaluate(()=>{setTimeout(()=>{
   document.getElementById('title').value='Réinitialisé';document.getElementById('description').value='Description réinitialisée';document.getElementById('price').value='19,00 €';state.price=19;
   document.getElementById('category').textContent='Catégorie';state.category='';document.getElementById('brand').textContent='Autre marque';state.brand='Autre marque';document.getElementById('condition').textContent='Neuf avec étiquette';state.condition='Neuf avec étiquette';parcel(2);recovery.observe(audit());
 },150);});
 await page.waitForFunction(()=>outcomes.length===2,undefined,{timeout:16000});expect(await page.evaluate(()=>[recoveryRequests,outcomes.at(-1).stable,failures])).toEqual([1,true,[]]);await assertSeven(page);await assertOriginals(page);
});
test('changement de catégorie : champs dépendants recréés puis marque, état et colis rétablis',async({page})=>{
 await init(page);await page.evaluate(()=>{
   document.getElementById('done').addEventListener('click',()=>{if(confirmations.at(-1)!=='category')return;document.getElementById('brand').textContent='Marque';state.brand='';document.getElementById('condition').textContent='État';state.condition='';parcel(2);dependent.hidden=true;setTimeout(()=>{dependent.hidden=false;},250);});
   document.getElementById('category').textContent='Catégorie';state.category='';dependent.hidden=true;parcel(2);
 });const result=await page.evaluate(()=>runRecovery());expect(result.stable).toBe(true);await assertSeven(page);await assertOriginals(page);expect(await page.evaluate(()=>state.categoryPath)).toBe('Loisirs');
});
test('marque ouverte : priorité au modal avec formulaire aria-hidden, sans rouvrir la catégorie',async({page})=>{
 await init(page);await page.evaluate(()=>{
   document.getElementById('brand').addEventListener('click',()=>document.querySelector('form').setAttribute('aria-hidden','true'));
   document.getElementById('done').addEventListener('click',()=>document.querySelector('form').removeAttribute('aria-hidden'));
   document.getElementById('brand').click();mutations=[];
 });
 const before=await page.evaluate(()=>audit());expect(before.find(row=>row.key==='category')).toMatchObject({matches:false,reason:'Champ non accessible.'});expect(before.find(row=>row.key==='brand')).toMatchObject({matches:false,reason:'Menu encore ouvert.'});
 const result=await page.evaluate(()=>runRecovery());expect(result.stable).toBe(true);await expect(page.locator('#popup')).toBeHidden();await expect(page.locator('form')).not.toHaveAttribute('aria-hidden','true');expect(await page.evaluate(()=>mutations.filter(event=>event.kind==='click'&&event.key==='category'))).toEqual([]);await assertSeven(page);await assertOriginals(page);
});
test('budget : deux corrections par champ au total, arm et nouvelles observations ne réinitialisent pas le budget',async({page})=>{
 await init(page);for(let index=0;index<2;index++){
   await page.evaluate(index=>{document.getElementById('title').value='Reset '+index;document.getElementById('price').value='20,00 €';state.price=20;},index);
   expect((await page.evaluate(()=>runRecovery())).stable).toBe(true);
 }
 expect(await page.evaluate(()=>[mutations.filter(event=>event.kind==='input'&&event.key==='title').length,mutations.filter(event=>event.kind==='input'&&event.key==='price').length])).toEqual([2,2]);
 await page.evaluate(()=>{recovery.arm({});document.getElementById('title').value='Troisième reset';document.getElementById('price').value='30,00 €';state.price=30;recovery.observe(audit());});
 const result=await page.evaluate(()=>runRecovery());expect(result.stable).toBe(false);await page.waitForTimeout(150);await expect(page.locator('#title')).toHaveValue('Troisième reset');await expect(page.locator('#price')).toHaveValue('30,00 €');expect(await page.evaluate(()=>[mutations.filter(event=>event.kind==='input'&&event.key==='title').length,mutations.filter(event=>event.kind==='input'&&event.key==='price').length,recoveryRequests])).toEqual([2,2,0]);await assertOriginals(page);
});
test('textes et prix différents avant la session : aucune prise de possession ni écrasement',async({page})=>{
 await init(page,{initial:{title:'Titre manuel antérieur',description:'Description manuelle antérieure',price:'12,00 €'}});const result=await page.evaluate(()=>runRecovery());expect(result.stable).toBe(false);await expect(page.locator('#title')).toHaveValue('Titre manuel antérieur');await expect(page.locator('#description')).toHaveValue('Description manuelle antérieure');await expect(page.locator('#price')).toHaveValue('12,00 €');expect(await page.evaluate(()=>mutations)).toEqual([]);await assertOriginals(page);
});
test('ancien prix NaN corrigé au premier passage : propriété reprise au arm, puis reset tardif corrigé',async({page})=>{
 await init(page,{initial:{price:'NaN €'}});await page.evaluate(async()=>{await recovery.guarded(()=>recoveryTest.setVintedPrice(document,product.price));recovery.arm({price:'Prix vérifié : 10.00 €'});document.getElementById('price').value='NaN €';});
 expect((await page.evaluate(()=>runRecovery())).stable).toBe(true);await expect(page.locator('#price')).toHaveValue(/10[,.]00\s*€/);await assertOriginals(page);
});
test('catégorie source manquante : textes et prix possédés corrigés sans toucher aux choix dépendants',async({page})=>{
 await init(page,{source:{category:''}});await page.evaluate(()=>{document.getElementById('title').value='Reset indépendant';document.getElementById('description').value='Description réinitialisée';document.getElementById('price').value='18,00 €';state.price=18;document.getElementById('brand').textContent='Autre marque';document.getElementById('condition').textContent='Neuf avec étiquette';parcel(2);});
 const result=await page.evaluate(()=>runRecovery());expect(result.stable).toBe(false);await expect(page.locator('#title')).toHaveValue('Juego exacto');await expect(page.locator('#description')).toHaveValue('Descripción exacta\nSin cambios');await expect(page.locator('#price')).toHaveValue(/10[,.]00\s*€/);await expect(page.locator('#brand')).toHaveText('Autre marque');await expect(page.locator('#condition')).toHaveText('Neuf avec étiquette');await expect(page.locator('#package_type_selector_2')).toBeChecked();expect(await page.evaluate(()=>mutations.filter(event=>event.kind==='click'))).toEqual([]);await assertOriginals(page);
});
test('reprise différée : un passage UI déjà occupé empêche la correction, puis une nouvelle observation la relance',async({page})=>{
 await init(page,{settings:{debounceMs:80}});await page.evaluate(()=>{document.getElementById('title').value='Reset pendant occupation';recovery.observe(audit());manualBusy=true;});await page.waitForTimeout(160);expect(await page.evaluate(()=>[recoveryRequests,mutations.length])).toEqual([0,0]);
 await page.evaluate(()=>{manualBusy=false;recovery.observe(audit());});await page.waitForFunction(()=>outcomes.length===1);expect(await page.evaluate(()=>[recoveryRequests,outcomes[0].stable])).toEqual([1,true]);await assertSeven(page);await assertOriginals(page);
});
test('hors ligne : aucune correction, événement online réel relance la même session sans photos',async({context,page})=>{
 await init(page);await context.setOffline(true);await page.waitForFunction(()=>navigator.onLine===false);
 await page.evaluate(()=>{document.getElementById('title').value='Reset hors ligne';parcel(2);recovery.observe(audit());});await page.waitForTimeout(180);expect(await page.evaluate(()=>[recoveryRequests,mutations.length,recovery.active])).toEqual([0,0,true]);
 await context.setOffline(false);await page.waitForFunction(()=>outcomes.length===1,undefined,{timeout:10000});expect(await page.evaluate(()=>[recoveryRequests,outcomes.at(-1).stable])).toEqual([1,true]);await assertSeven(page);await assertOriginals(page);
});
test('visibilité contrôlée : pause en arrière-plan puis visibilitychange relit et corrige au retour',async({page})=>{
 await init(page);await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.getElementById('description').value='Reset caché';recovery.observe(audit());});await page.waitForTimeout(180);expect(await page.evaluate(()=>[recoveryRequests,mutations.length])).toEqual([0,0]);
 await page.evaluate(()=>{delete document.visibilityState;document.dispatchEvent(new Event('visibilitychange'));});await page.waitForFunction(()=>outcomes.length===1);expect(await page.evaluate(()=>outcomes.at(-1).stable)).toBe(true);await assertSeven(page);await assertOriginals(page);
});
test('vrai pointer natif sur role=button : arrêt définitif, aucune correction après intervention',async({page})=>{
 await init(page);await page.evaluate(()=>{const button=document.createElement('div');button.id='native-div-button';button.setAttribute('role','button');button.tabIndex=0;button.textContent='Choix natif';document.body.prepend(button);});
 await page.locator('#native-div-button').click();expect(await page.evaluate(()=>[recovery.active,stopMessages.length])).toEqual([false,1]);
 await page.evaluate(()=>{document.getElementById('title').value='Valeur conservée après clic';recovery.observe(audit());});expect((await page.evaluate(()=>runRecovery())).error).toBe('OrionPreparationStopped');await page.waitForTimeout(120);await expect(page.locator('#title')).toHaveValue('Valeur conservée après clic');expect(await page.evaluate(()=>mutations.filter(event=>event.kind==='input'))).toEqual([]);await assertOriginals(page);
});
test('vrai keydown Escape sur body : arrêt même hors champ de saisie',async({page})=>{
 await init(page);await page.evaluate(()=>{document.activeElement?.blur();document.body.tabIndex=-1;document.body.focus();});await page.keyboard.press('Escape');expect(await page.evaluate(()=>[recovery.active,stopMessages.length])).toEqual([false,1]);
 await page.evaluate(()=>{document.getElementById('description').value='Intervention clavier';recovery.observe(audit());});await page.waitForTimeout(120);await expect(page.locator('#description')).toHaveValue('Intervention clavier');expect(await page.evaluate(()=>mutations.filter(event=>event.kind==='input'))).toEqual([]);await assertOriginals(page);
});
test('vraie saisie via fill : beforeinput natif arrête le moteur et préserve la valeur manuelle',async({page})=>{
 await init(page);await page.evaluate(()=>{window.trustedBeforeInput=[];document.addEventListener('beforeinput',event=>trustedBeforeInput.push(event.isTrusted),true);});await page.locator('#title').fill('Titre saisi manuellement');
 expect(await page.evaluate(()=>[recovery.active,stopMessages.length,trustedBeforeInput])).toEqual([false,1,[true]]);await page.evaluate(()=>recovery.observe(audit()));await page.waitForTimeout(150);await expect(page.locator('#title')).toHaveValue('Titre saisi manuellement');await assertOriginals(page);
});
test('deadline pendant chargement du choix : aucun clic ni changement après expiration',async({page})=>{
 await init(page,{settings:{durationMs:300}});await page.evaluate(()=>{window.choiceDelay=700;document.getElementById('category').textContent='Catégorie';state.category='';window.pendingRecovery=runRecovery();});
 await page.waitForFunction(()=>!recovery.active);const count=await page.evaluate(()=>mutations.length);await page.waitForFunction(()=>failures.length===1,undefined,{timeout:2500});await page.waitForTimeout(250);expect(await page.evaluate(()=>mutations.length)).toBe(count);expect(await page.evaluate(()=>failures[0].name)).toBe('OrionPreparationStopped');await assertOriginals(page);await expect(page.locator('#popup')).toBeVisible();
});
test('hash de transfert changé dans le même document : ancienne session arrêtée avant toute autre correction',async({page})=>{
 await init(page,{nonce:'transfer-original'});await page.evaluate(()=>{document.getElementById('category').textContent='Catégorie';state.category='';document.getElementById('title').value='Titre du nouveau contexte';window.pendingRecovery=runRecovery();});
 await expect(page.locator('#popup')).toBeVisible();await page.evaluate(()=>{location.hash='orion=transfer-autre';});await page.waitForFunction(()=>!recovery.active);const count=await page.evaluate(()=>mutations.length);
 await page.waitForFunction(()=>failures.length===1);await page.waitForTimeout(120);expect(await page.evaluate(()=>mutations.length)).toBe(count);await expect(page.locator('#title')).toHaveValue('Titre du nouveau contexte');expect(await page.evaluate(()=>[failures[0].name,recovery.reason])).toEqual(['OrionPreparationStopped','Le transfert a changé : rechargez le formulaire avant de préparer cette fiche.']);await assertOriginals(page);
});
