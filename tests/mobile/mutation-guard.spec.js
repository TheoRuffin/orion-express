import {test,expect} from './fixture.js';
import {readFile} from 'node:fs/promises';

const html=await readFile('tests/mobile/fixtures/vinted-form.html','utf8');
const modules=(await Promise.all(['vinted-adapter.js','condition.js'].map(file=>readFile('src/'+file,'utf8')))).join('\n').replace(/^export /gm,'');
async function init(page){
 await page.route('https://www.vinted.es/**',route=>route.fulfill({contentType:'text/html',body:html}));
 await page.goto('https://www.vinted.es/items/new');
 await page.addScriptTag({content:`(()=>{const errorMessage=e=>e.message;${modules};window.guardTest={setVintedMutationGuard,assertVintedMutationAllowed,clickVintedElement,setNativeValue,setVintedPrice,selectVintedChoice,selectVintedCondition,selectVintedShipping};})();`});
 await page.evaluate(()=>{
  dependent.hidden=false;window.allowed=true;window.clicks=0;window.writes=0;
  document.addEventListener('click',()=>window.clicks++);
  document.addEventListener('input',()=>window.writes++);
  window.removeGuard=guardTest.setVintedMutationGuard(document,()=>{if(!window.allowed){const error=new Error('Préparation interrompue.');error.name='OrionPreparationStopped';throw error;}});
 });
}

test('garde interrompue : aucune écriture ni clic, photos intactes et nettoyage des gardes imbriquées',async({page})=>{
 await init(page);
 await page.locator('input[type=file]').setInputFiles([{name:'one.png',mimeType:'image/png',buffer:Buffer.from('first')},{name:'two.png',mimeType:'image/png',buffer:Buffer.from('second')}]);
 const result=await page.evaluate(async()=>{
  window.allowed=false;const before={clicks,writes};
  const actions=[()=>guardTest.setNativeValue(title,'Remplacement interdit'),()=>guardTest.clickVintedElement(category),()=>guardTest.setVintedPrice(document,10,{replace:true}),()=>guardTest.selectVintedChoice(document,'category','Loisirs > Jeux de société'),()=>guardTest.selectVintedCondition(document,'Neuf sans étiquette'),()=>guardTest.selectVintedShipping(document,'Petit')];
  const errors=[];for(const action of actions){try{await action();errors.push(null);}catch(error){errors.push(error.name);}}
  const inner=guardTest.setVintedMutationGuard(document,()=>{});guardTest.setNativeValue(title,'Autorisé par la garde active');inner();inner();
  let restored;try{guardTest.setNativeValue(title,'Ancienne garde perdue');}catch(error){restored=error.name;}
  removeGuard();removeGuard();guardTest.setNativeValue(description,'Garde nettoyée');
  return {before,errors,restored,clicks,writes,title:title.value,description:description.value,condition:state.condition,shipping:state.shipping,confirmations,files:await Promise.all([...document.querySelector('input[type=file]').files].map(file=>file.text())),submitted:!!window.submitted};
 });
 expect(result.errors).toEqual(Array(6).fill('OrionPreparationStopped'));
 expect(result).toMatchObject({restored:'OrionPreparationStopped',clicks:result.before.clicks,writes:result.before.writes+2,title:'Autorisé par la garde active',description:'Garde nettoyée',condition:'',shipping:2,confirmations:[],files:['first','second'],submitted:false});
 await expect(page.locator('#popup')).toBeHidden();
});

test('état interrompu pendant attente de Fait : le radio reste coché sans confirmation tardive',async({page})=>{
 await init(page);await page.evaluate(()=>{
  window.conditionDelay=1000;window.outcome=null;
  guardTest.selectVintedCondition(document,'Nuevo sin etiquetas').then(value=>window.outcome={value},error=>window.outcome={name:error.name,message:error.message});
 });
 const option=page.getByRole('radio').filter({hasText:'Neuf sans étiquette'});
 await expect(option).toHaveAttribute('aria-checked','true');await expect(option.locator('input')).toBeChecked();await expect(page.locator('#done')).toBeDisabled();
 const clicksAtStop=await page.evaluate(()=>{window.allowed=false;return clicks;});
 await page.waitForFunction(()=>window.outcome);
 expect(await page.evaluate(()=>outcome)).toEqual({name:'OrionPreparationStopped',message:'Préparation interrompue.'});
 await expect(page.locator('#done')).toBeEnabled();await expect(page.locator('#popup')).toBeVisible();
 expect(await page.evaluate(()=>[clicks,state.condition,confirmations,!!window.submitted])).toEqual([clicksAtStop,'',[],false]);
});

test('catégorie interrompue avant chargement des choix : aucun clic de sélection et erreur conservée',async({page})=>{
 await init(page);
 await page.evaluate(()=>{
  category.addEventListener('click',()=>{window.allowed=false;window.clicksAtStop=clicks+1;},{once:true});
  window.outcome=null;guardTest.selectVintedChoice(document,'category','Loisirs > Jeux de société').then(value=>window.outcome={value},error=>window.outcome={name:error.name,message:error.message});
 });
 await page.waitForFunction(()=>window.outcome);
 expect(await page.evaluate(()=>outcome)).toEqual({name:'OrionPreparationStopped',message:'Préparation interrompue.'});
 expect(await page.evaluate(()=>[clicks,clicksAtStop,state.category,confirmations,!!window.submitted])).toEqual([1,1,'',[],false]);
 await expect(page.locator('#popup')).toBeVisible();await expect(page.locator('#done')).toBeDisabled();
});

test('colis interrompu après clic du conteneur : aucun clic natif de secours après délai',async({page})=>{
 await init(page);
 await page.evaluate(()=>{
  window.parcelNativeHandlerOnly=true;window.outcome=null;
  document.getElementById('package-size-1').addEventListener('click',()=>{window.allowed=false;window.clicksAtStop=clicks+1;},{once:true});
  guardTest.selectVintedShipping(document,'Petit').then(value=>window.outcome={value},error=>window.outcome={name:error.name,message:error.message});
 });
 await page.waitForFunction(()=>window.outcome);
 expect(await page.evaluate(()=>outcome.name)).toBe('OrionPreparationStopped');
 expect(await page.evaluate(()=>[clicks,clicksAtStop,state.shipping,!!window.submitted])).toEqual([1,1,2,false]);
 await expect(page.locator('#package_type_selector_2')).toBeChecked();await expect(page.locator('#package_type_selector_1')).not.toBeChecked();
});

test('prix : remplacement explicite seulement et prix invalide refusé avant mutation',async({page})=>{
 await init(page);await page.evaluate(()=>{price.value='12,50 €';state.price=12.5;});
 const refused=await page.evaluate(async()=>{try{await guardTest.setVintedPrice(document,'10 €');}catch(error){return error.message;}});
 expect(refused).toContain('aucun écrasement');await expect(page.locator('#price')).toHaveValue('12,50 €');
 await page.evaluate(()=>guardTest.setVintedPrice(document,'10,00',{replace:true}));
 await expect(page.locator('#price')).toHaveValue('10,00\u00a0€');expect(await page.evaluate(()=>state.price)).toBe(10);
 const before=await page.evaluate(()=>writes);
 const invalid=await page.evaluate(async()=>{try{await guardTest.setVintedPrice(document,'NaN €',{replace:true});}catch(error){return error.message;}});
 expect(invalid).toContain('Prix invalide');expect(await page.evaluate(()=>writes)).toBe(before);await expect(page.locator('#price')).toHaveValue('10,00\u00a0€');
 expect(await page.evaluate(()=>!!window.submitted)).toBe(false);
});

test('prix recréé : un ancien input détaché correct ne valide jamais le prix visible divergent',async({page})=>{
 await init(page);await page.evaluate(()=>{
  price.addEventListener('input',()=>{
   window.oldPrice=price;
   setTimeout(()=>{const replacement=document.createElement('input');replacement.id='price';replacement.value='10,00 €';oldPrice.replaceWith(replacement);setTimeout(()=>replacement.value='19,00 €',150);},50);
  },{once:true});
 });
 const error=await page.evaluate(async()=>{try{await guardTest.setVintedPrice(document,'10');}catch(error){return error.message;}});
 expect(error).toBeTruthy();expect(await page.evaluate(()=>oldPrice.isConnected)).toBe(false);await expect(page.locator('#price')).toHaveValue('19,00 €');
 expect(await page.evaluate(()=>Number(oldPrice.value.replace('€','').replace(',','.').trim()))).toBe(10);expect(await page.evaluate(()=>!!window.submitted)).toBe(false);
});
