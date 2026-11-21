import {test,expect} from './fixture.js';
import {readFile} from 'node:fs/promises';
const adapter=(await readFile('src/vinted-adapter.js','utf8')).replace(/^export /gm,'');
const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>[hidden]{display:none!important}body{font:16px sans-serif}input,button{font:inherit;padding:10px}[role=dialog]{position:fixed;inset:10px;background:white;border:1px solid;padding:12px}[role=radio]{padding:15px}</style>
<form onsubmit="event.preventDefault();window.submitted=true"><input id="category" readonly aria-controls="desktop-popup" onclick="mobile.hidden=false;this.setAttribute('aria-expanded','true')"><button>Ajouter</button><button>Publier</button></form>
<div id="desktop-popup" role="listbox" hidden><div role="radio">Jeux de société</div></div>
<section id="mobile" role="dialog" aria-modal="true" hidden><div role="listbox" id="mobile-options"><input id="catalog-search-input"><div role="radio" id="wanted" aria-checked="false"><span class="web_ui__Cell__title">Jeux de société</span><span class="web_ui__Cell__body">Loisirs et collections</span><label for="choice-radio"><input id="choice-radio" type="radio"></label></div></div><footer><button id="done" type="button" disabled>Fait</button></footer></section>
<div id="hidden-parent" aria-hidden="true"><span id="aria-child">Inactif</span></div><div id="inert-parent" inert><span id="inert-child">Inerte</span></div><div id="visibility-parent" style="visibility:hidden"><span id="visibility-child">Invisible</span></div><div id="display-parent" style="display:none"><span id="display-child">Masqué</span></div><fieldset disabled><input id="disabled-child"></fieldset><span id="ordinary">Visible</span>
<script>
window.confirmations=0;wanted.querySelector('input').onclick=e=>e.stopPropagation();
wanted.onclick=()=>{wanted.querySelector('input').checked=true;if(window.fakeNativeOnly)return;wanted.setAttribute('aria-checked','true');setTimeout(()=>done.disabled=false,80);};
done.onclick=()=>{window.beforeConfirm={semantic:wanted.getAttribute('aria-checked'),native:wanted.querySelector('input').checked,enabled:!done.disabled};document.getElementById('category').value='Jeux de société';document.getElementById('category').setAttribute('aria-expanded','false');mobile.hidden=true;window.confirmations++;};
</script>`;
async function init(page){
 await page.route('https://www.vinted.es/**',r=>r.fulfill({contentType:'text/html',body:html}));await page.goto('https://www.vinted.es/items/new');
 await page.addScriptTag({content:`(()=>{const errorMessage=e=>e.message;${adapter};window.popupTest={visible,popupFor,selectVintedChoice};})();`});
}
test('visibilité effective : aria-hidden, inert, CSS et fieldset désactivé ne sont pas interactifs',async({page})=>{
 await init(page);expect(await page.evaluate(()=>['aria-child','inert-child','visibility-child','display-child','disabled-child','ordinary'].map(id=>popupTest.visible(document.getElementById(id))))).toEqual([false,false,false,false,false,true]);
 expect(await page.locator('#aria-child').evaluate(e=>e.getClientRects().length>0)).toBe(true);expect(await page.locator('#visibility-child').evaluate(e=>e.getClientRects().length>0)).toBe(true);
});
test('popover desktop caché ignoré, vrai dialog mobile retenu avec son footer extérieur à la listbox',async({page})=>{
 await init(page);await page.locator('#category').click();
 expect(await page.evaluate(()=>[popupTest.popupFor(document,document.getElementById('category')).id,popupTest.popupFor(document,document.getElementById('category'),wanted).id])).toEqual(['mobile','mobile']);
 for(const mode of ['aria','visibility','inert']){
  await page.evaluate(mode=>{const old=document.getElementById('desktop-popup');old.hidden=false;old.removeAttribute('aria-hidden');old.removeAttribute('inert');old.style.visibility='visible';if(mode==='aria')old.setAttribute('aria-hidden','true');if(mode==='visibility')old.style.visibility='hidden';if(mode==='inert')old.setAttribute('inert','');},mode);
  expect(await page.evaluate(()=>popupTest.popupFor(document,document.getElementById('category')).id)).toBe('mobile');
 }
});
test('catégorie : valeur native string finale, vrai choix puis confirmation dans le footer mobile',async({page})=>{
 await init(page);await page.evaluate(()=>popupTest.selectVintedChoice(document,'category','Loisirs et collections > Jeux de société'));
 await expect(page.locator('#category')).toHaveValue('Jeux de société');await expect(page.locator('#mobile')).toBeHidden();
 expect(await page.evaluate(()=>({valueType:typeof document.getElementById('category').value,before:window.beforeConfirm,confirmations,submitted:!!window.submitted}))).toEqual({valueType:'string',before:{semantic:'true',native:true,enabled:true},confirmations:1,submitted:false});
});
test('radio DOM seul : aucun succès ni Fait même avec un ancien popover caché',async({page})=>{
 await init(page);await page.evaluate(()=>window.fakeNativeOnly=true);
 const error=await page.evaluate(async()=>{try{await popupTest.selectVintedChoice(document,'category','Loisirs et collections > Jeux de société');}catch(e){return e.message;}});
 expect(error).toContain('category');await expect(page.locator('#category')).toHaveValue('');await expect(page.locator('#mobile')).toBeVisible();await expect(page.locator('#done')).toBeDisabled();expect(await page.evaluate(()=>[confirmations,!!window.submitted])).toEqual([0,false]);
});
