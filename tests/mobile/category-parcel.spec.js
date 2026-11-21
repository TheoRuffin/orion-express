import {test,expect} from './fixture.js';
import {readFile} from 'node:fs/promises';
const html=await readFile('tests/mobile/fixtures/vinted-form.html','utf8');
const modules=(await Promise.all(['vinted-adapter.js','condition.js'].map(f=>readFile('src/'+f,'utf8')))).join('\n').replace(/^export /gm,'');
async function init(page){
 await page.route('https://www.vinted.es/**',r=>r.fulfill({contentType:'text/html',body:html}));await page.goto('https://www.vinted.es/items/new');
 await page.addScriptTag({content:`(()=>{const errorMessage=e=>e.message;${modules};window.choiceTest={selectVintedChoice,selectVintedShipping,applyVintedProduct};})();`});
}
const category='Enfants > Jeux et jouets > Jeux de société';
test('catégorie : composant recréé, radio réellement coché puis Fait actif et fermé',async({page})=>{
 await init(page);await page.evaluate(()=>{window.rerenderChoice=true;window.choiceDelay=1000;done.textContent='Listo';});
 await page.evaluate(value=>{window.outcome=null;choiceTest.selectVintedChoice(document,'category',value).then(ok=>window.outcome={ok},e=>window.outcome={error:e.message});},category);
 const option=page.locator('[role=radio]').filter({hasText:'Enfants > Jeux et jouets'});
 await expect(option).toHaveAttribute('aria-checked','true');await expect(option.locator('input')).toBeChecked();await expect(page.locator('#done')).toBeDisabled();
 await page.waitForFunction(()=>window.outcome);expect(await page.evaluate(()=>outcome.error)).toBeUndefined();await expect(page.locator('#popup')).toBeHidden();
 expect(await page.evaluate(()=>[state.category,state.categoryPath,choiceBeforeConfirm,confirmations,!!window.submitted])).toEqual(['Jeux de société','Enfants > Jeux et jouets',{semantic:true,native:true,enabled:true},['category'],false]);
});
test('catégorie : variante liée au radio natif, même option exacte et aucune autre',async({page})=>{
 await init(page);await page.evaluate(()=>window.choiceNativeHandlerOnly=true);await page.evaluate(value=>choiceTest.selectVintedChoice(document,'category',value),category);
 await expect(page.locator('#category')).toHaveText('Jeux de société');await expect(page.locator('#popup')).toBeHidden();expect(await page.evaluate(()=>state.categoryPath)).toBe('Enfants > Jeux et jouets');expect(await page.evaluate(()=>choiceBeforeConfirm)).toEqual({semantic:true,native:true,enabled:true});
});
test('catégorie : checked natif sans état du composant ne valide pas Fait',async({page})=>{
 await init(page);await page.evaluate(()=>window.fakeNativeChoiceOnly=true);
 const error=await page.evaluate(async value=>{try{await choiceTest.selectVintedChoice(document,'category',value);}catch(e){return e.message;}},category);
 expect(error).toBeTruthy();await expect(page.locator('#done')).toBeDisabled();expect(await page.evaluate(()=>[state.category,confirmations,!!window.submitted])).toEqual(['',[],false]);
});
test('catégorie : champ modifié mais menu toujours ouvert reste une erreur',async({page})=>{
 await init(page);await page.evaluate(()=>window.keepChoiceMenuOpen=true);
 const error=await page.evaluate(async value=>{try{await choiceTest.selectVintedChoice(document,'category',value);}catch(e){return e.message;}},category);
 expect(error).toBeTruthy();await expect(page.locator('#popup')).toBeVisible();expect(await page.evaluate(()=>confirmations)).toEqual(['category']);
});
test('colis : FR/ES, vrai état après recréation, défaut Moyen remplacé et retour tardif corrigé',async({page})=>{
 await init(page);await page.evaluate(()=>{window.rerenderParcel=true;window.parcelNativeHandlerOnly=true;window.revertParcelOnce=true;});
 for(const [value,size]of [['Pequeño',1],['Grand',3],['Mediano',2],['Petit',1]]){
  await page.evaluate(value=>choiceTest.selectVintedShipping(document,value),value);
  await expect(page.locator('#package_type_selector_'+size)).toBeChecked();await expect(page.locator('#package-size-'+size)).toHaveAttribute('role','presentation');
  expect(await page.evaluate(()=>[state.shipping,[...document.querySelectorAll('input[id^="package_type_selector_"]:checked')].map(e=>e.id)])).toEqual([size,['package_type_selector_'+size]]);
 }expect(await page.evaluate(()=>!!window.submitted)).toBe(false);
});
test('colis : radio natif seul contradictoire avec Moyen ne compte jamais comme succès',async({page})=>{
 await init(page);await page.evaluate(()=>window.fakeNativeParcelOnly=true);
 const error=await page.evaluate(async()=>{try{await choiceTest.selectVintedShipping(document,'Petit');}catch(e){return e.message;}});
 expect(error).toBeTruthy();expect(await page.evaluate(()=>state.shipping)).toBe(2);await expect(page.locator('#package-size-2')).toHaveAttribute('role','presentation');expect(await page.evaluate(()=>!!window.submitted)).toBe(false);
});

test('catégorie déjà affichée mais menu ouvert sans aria-expanded : confirmation indispensable',async({page})=>{
 await init(page);await page.locator('#category').click();await expect(page.locator('[role=radio]')).toHaveCount(3);
 await page.evaluate(()=>{category.textContent='Jeux de société';category.removeAttribute('aria-expanded');});
 await page.evaluate(()=>choiceTest.selectVintedChoice(document,'category','Jeux de société').then(()=>{throw new Error('faux succès');},()=>{}));
 await expect(page.locator('#popup')).toBeVisible();expect(await page.evaluate(()=>confirmations)).toEqual([]);
 // With an exact path the pending mobile choice can be confirmed, despite missing aria-expanded.
 await page.evaluate(value=>choiceTest.selectVintedChoice(document,'category',value),'Loisirs > Jeux de société');await expect(page.locator('#popup')).toBeHidden();expect(await page.evaluate(()=>state.categoryPath)).toBe('Loisirs');
});
