import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const source=(await readFile('src/launch.js','utf8')).replace(/^export /gm,'');
const NOW=1795262400000;
function fixture({readError=false,navigationError=false}={}){
 const values=new Map(),opens=[],navs=[],writes=[],failure=new Error('navigation refusée');
 const context=vm.createContext({URL,Date:{now:()=>NOW},
  window:{location:{assign:url=>{navs.push(url);if(navigationError)throw failure;}},open:(...args)=>{opens.push(['window.open',...args]);throw new Error('nouvel onglet interdit');}},
  GM_getValue:async(key,fallback)=>{if(readError)throw new Error('bridge inaccessible');return values.has(key)?values.get(key):fallback;},
  GM_setValue:async(key,value)=>{writes.push([key,value]);values.set(key,value);},
  GM_openInTab:(...args)=>{opens.push(['GM_openInTab',...args]);throw new Error('API extension interdite');}
 });
 vm.runInContext(source+'\nthis.launchTest={LAUNCH_ACK_KEY,vintedLaunchURL,navigateVintedInCurrentTab,acknowledgeVintedLaunch,readVintedLaunchAck};',context);
 return {api:context.launchTest,values,opens,navs,writes,failure};
}

test('URL de transfert : nonce entièrement encodée et conservée dans le fragment',()=>{
 const {api}=fixture();const nonce='fiche &?/#+é"=uno';const url=new URL(api.vintedLaunchURL(nonce));
 assert.equal(url.origin,'https://www.vinted.es');assert.equal(url.pathname,'/items/new');assert.equal(url.search,'');
 assert.equal(new URLSearchParams(url.hash.slice(1)).get('orion'),nonce);assert.equal(api.vintedLaunchURL('a'), 'https://www.vinted.es/items/new#orion=a');
 for(const invalid of ['',null,undefined,42,{},[], 'x'.repeat(161)])assert.throws(()=>api.vintedLaunchURL(invalid),/Identifiant/);
});

test('bouton : location.assign synchrone dans cet onglet, URL HTTPS exacte et aucun faux ACK',()=>{
 const {api,navs,opens,writes}=fixture();const result=api.navigateVintedInCurrentTab('transfer-1');
 assert.equal(result,undefined);assert.deepEqual(navs,['https://www.vinted.es/items/new#orion=transfer-1']);
 assert.deepEqual(opens,[]);assert.deepEqual(writes,[]);
});

test('navigation : entrées invalides refusées et pseudo-URL de nonce traitée comme donnée encodée',()=>{
 const {api,navs,opens}=fixture();for(const invalid of ['',null,undefined,42,{},[],'x'.repeat(161)])assert.throws(()=>api.navigateVintedInCurrentTab(invalid),/Identifiant/);
 assert.deepEqual(navs,[]);
 for(const nonce of ['javascript:alert(1)','https://evil.test/#x','orion://open-url?url=https://evil.test/']){
  api.navigateVintedInCurrentTab(nonce);const url=new URL(navs.at(-1));assert.equal(url.origin,'https://www.vinted.es');assert.equal(url.pathname,'/items/new');assert.equal(new URLSearchParams(url.hash.slice(1)).get('orion'),nonce);
 }
 assert.deepEqual(opens,[]);
});

test('navigation refusée : erreur propagée sans seconde tentative, API GM, schéma ou confirmation',()=>{
 const {api,navs,opens,writes,failure}=fixture({navigationError:true});
 assert.throws(()=>api.navigateVintedInCurrentTab('transfer-1'),error=>error===failure);
 assert.deepEqual(navs,['https://www.vinted.es/items/new#orion=transfer-1']);assert.deepEqual(opens,[]);assert.deepEqual(writes,[]);
});

test('ACK : tous les états reconnus portent nonce et horodatage, les états inconnus sont ignorés',async()=>{
 const {api,writes}=fixture();for(const state of ['ready','complete','partial','error']){
  await api.acknowledgeVintedLaunch('transfer-1',state);const [key,raw]=writes.at(-1);assert.equal(key,api.LAUNCH_ACK_KEY+'-transfer-1');assert.deepEqual(JSON.parse(raw),{nonce:'transfer-1',state,at:NOW});
 }
 const count=writes.length;for(const state of ['',null,undefined,'published','ready '])await api.acknowledgeVintedLaunch('transfer-1',state);
 await api.acknowledgeVintedLaunch('','ready');assert.equal(writes.length,count);
});

test('lecture ACK : nonce exacte, bornes de temps et états, y compris erreur explicite',async()=>{
 const {api,values}=fixture();const put=ack=>values.set(api.LAUNCH_ACK_KEY+'-transfer-1',JSON.stringify(ack));
 for(const state of ['ready','complete','partial','error']){put({nonce:'transfer-1',state,at:NOW});const ack=await api.readVintedLaunchAck('transfer-1',NOW);assert.equal(ack.state,state);assert.equal(ack.nonce,'transfer-1');}
 put({nonce:'transfer-1',state:'ready',at:NOW+5000});assert.ok(await api.readVintedLaunchAck('transfer-1',NOW));
 for(const ack of [{nonce:'other',state:'complete',at:NOW},{nonce:'transfer-1',state:'ready',at:NOW-1},{nonce:'transfer-1',state:'complete',at:NOW+5001},{nonce:'transfer-1',state:'published',at:NOW}]){put(ack);assert.equal(await api.readVintedLaunchAck('transfer-1',NOW),null);}
});

test('lecture ACK : contenu malformé et timestamp non numérique ne donnent aucun succès',async()=>{
 const {api,values}=fixture();for(const raw of ['',undefined,'{','null','[]','true',JSON.stringify({}),JSON.stringify({nonce:'transfer-1',state:'ready',at:String(NOW)}),JSON.stringify({nonce:'transfer-1',state:'ready',at:null}),JSON.stringify({nonce:'transfer-1',state:'ready',at:{}})]){
  values.set(api.LAUNCH_ACK_KEY+'-transfer-1',raw);assert.equal(await api.readVintedLaunchAck('transfer-1',NOW),null,`ACK invalide accepté : ${raw}`);
 }
 assert.equal(await fixture({readError:true}).api.readVintedLaunchAck('transfer-1',NOW),null);
});


test('ACK par transfert : deux onglets ne remplacent pas leurs confirmations',async()=>{
 const {api,values}=fixture();await api.acknowledgeVintedLaunch('transfer-1','complete');await api.acknowledgeVintedLaunch('transfer-2','partial');
 assert.equal((await api.readVintedLaunchAck('transfer-1',NOW)).state,'complete');assert.equal((await api.readVintedLaunchAck('transfer-2',NOW)).state,'partial');
 assert.equal(await api.readVintedLaunchAck('transfer-3',NOW),null);
 assert.deepEqual([...values.keys()].sort(),[api.LAUNCH_ACK_KEY+'-transfer-1',api.LAUNCH_ACK_KEY+'-transfer-2'].sort());
});
