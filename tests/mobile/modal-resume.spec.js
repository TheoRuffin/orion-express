import {test,expect} from './fixture.js';import {readFile} from 'node:fs/promises';
const html=await readFile('tests/mobile/fixtures/vinted-form.html','utf8');
const modules=(await Promise.all(['vinted-adapter.js','condition.js'].map(f=>readFile('src/'+f,'utf8')))).join('\n').replace(/^export /gm,'');
test('reprise modal React : champ principal aria-hidden, choix actif et Fait avant retour accessible',async({page})=>{
 await page.route('https://www.vinted.es/**',r=>r.fulfill({contentType:'text/html',body:html}));await page.goto('https://www.vinted.es/items/new');await page.addScriptTag({content:`(()=>{const errorMessage=e=>e.message;${modules};window.modalTest=selectVintedChoice;})();`});
 await page.evaluate(()=>{for(const id of ['category','condition'])document.getElementById(id).addEventListener('click',()=>document.querySelector('form').setAttribute('aria-hidden','true'));done.addEventListener('click',()=>document.querySelector('form').removeAttribute('aria-hidden'));});
 await page.locator('#category').click();await expect(page.locator('form')).toHaveAttribute('aria-hidden','true');
 await page.evaluate(()=>modalTest(document,'category','Loisirs > Jeux de société'));await expect(page.locator('#popup')).toBeHidden();await expect(page.locator('#category')).toHaveText('Jeux de société');await expect(page.locator('form')).not.toHaveAttribute('aria-hidden','true');
 await expect(page.locator('#condition')).toBeVisible();await page.locator('#condition').click();await expect(page.locator('form')).toHaveAttribute('aria-hidden','true');await page.evaluate(()=>modalTest(document,'condition','Nuevo sin etiquetas'));
 await expect(page.locator('#condition')).toHaveText('Neuf sans étiquette');await expect(page.locator('#popup')).toBeHidden();await expect(page.locator('form')).not.toHaveAttribute('aria-hidden','true');expect(await page.evaluate(()=>[confirmations,!!window.submitted])).toEqual([['category','condition'],false]);
});
