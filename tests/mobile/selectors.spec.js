import {test,expect} from './fixture.js';
import {readFile} from 'node:fs/promises';
const html=await readFile('tests/mobile/fixtures/vinted-form.html','utf8');
const adapter=(await readFile('src/vinted-adapter.js','utf8')).replace(/^export /gm,'')+'\n'+(await readFile('src/condition.js','utf8')).replace(/^export /gm,'');
async function init(page){await page.route('https://www.vinted.es/**',r=>r.fulfill({contentType:'text/html',body:html}));await page.goto('https://www.vinted.es/items/new');await page.addScriptTag({content:`(()=>{const errorMessage=e=>e.message;${adapter};window.adapterTest={setVintedPrice,selectVintedChoice,selectVintedShipping};})();`});}
test('prix canonique formaté : 10 €, NaN récupérable, entrée invalide sans mutation',async({page})=>{
 await init(page);await page.evaluate(()=>adapterTest.setVintedPrice(document,'10 €'));await expect(page.locator('#price')).toHaveValue('10,00 €');
 expect(await page.evaluate(()=>state.price)).toBe(10);
 expect(await page.evaluate(async()=>{try{await adapterTest.setVintedPrice(document,'invalid');}catch(e){return e.message;}})).toContain('Prix invalide');await expect(page.locator('#price')).toHaveValue('10,00 €');
 await page.locator('#price').fill('NaN €');await page.evaluate(()=>adapterTest.setVintedPrice(document,'10,00'));expect(await page.evaluate(()=>state.price)).toBe(10);await expect(page.locator('#price')).toHaveValue('10,00 €');
});
test('catégorie exacte, chemin hiérarchique, confirmation mobile et choix dépendants réels',async({page})=>{
 await init(page);await page.evaluate(()=>adapterTest.selectVintedChoice(document,'category','Enfants > Jeux et jouets > Jeux de société'));
 expect(await page.evaluate(()=>[state.category,state.categoryPath])).toEqual(['Jeux de société','Enfants > Jeux et jouets']);await expect(page.locator('#popup')).toBeHidden();
 await page.evaluate(()=>adapterTest.selectVintedChoice(document,'brand','Sans marque'));await page.evaluate(()=>adapterTest.selectVintedChoice(document,'condition','Très bon état'));await page.evaluate(()=>adapterTest.selectVintedShipping(document,'Petit'));
 expect(await page.evaluate(()=>[state.brand,state.condition,state.shipping,confirmations])).toEqual(['Sans marque','Très bon état',1,['category','brand','condition']]);await expect(page.locator('#package_type_selector_1')).toBeChecked();await expect(page.locator('#package_type_selector_2')).not.toBeChecked();expect(await page.evaluate(()=>!!window.submitted)).toBe(false);
});
test('ambiguïté de catégorie et marque indisponible : aucune substitution ni confirmation',async({page})=>{
 await init(page);const error=await page.evaluate(async()=>{try{await adapterTest.selectVintedChoice(document,'category','Jeux de société');}catch(e){return e.message;}});expect(error).toContain('category');expect(await page.evaluate(()=>state.category)).toBe('');expect(await page.evaluate(()=>confirmations)).toEqual([]);
 // Reset the controlled fixture, then prove absence of a requested brand leaves it blank.
 await page.reload();await page.addScriptTag({content:`(()=>{const errorMessage=e=>e.message;${adapter};window.adapterTest={selectVintedChoice};})();`});await page.evaluate(()=>adapterTest.selectVintedChoice(document,'category','Loisirs > Jeux de société'));
 const brandError=await page.evaluate(async()=>{try{await adapterTest.selectVintedChoice(document,'brand','Marque absente');}catch(e){return e.message;}});expect(brandError).toContain('brand');expect(await page.evaluate(()=>state.brand)).toBe('');expect(await page.evaluate(()=>confirmations)).toEqual(['category']);
});
test('menus desktop à fermeture immédiate vérifiés sans clic Fait supplémentaire',async({page})=>{
 await init(page);await page.evaluate(()=>{window.desktop=true;});await page.evaluate(()=>adapterTest.selectVintedChoice(document,'category','Loisirs > Jeux de société'));await page.evaluate(()=>adapterTest.selectVintedChoice(document,'condition','Très bon état'));expect(await page.evaluate(()=>[state.category,state.condition])).toEqual(['Jeux de société','Très bon état']);await expect(page.locator('#popup')).toBeHidden();
});
