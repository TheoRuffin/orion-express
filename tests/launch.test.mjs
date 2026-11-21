import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const source=(await readFile('src/launch.js','utf8')).replace(/^export /gm,'');
const NOW=1795262400000;
function fixture({available=true,readError=false}={}){
 const values=new Map(),opens=[],writes=[],handle={closed:false,close(){}};
 const context=vm.createContext({URL,Date:{now:()=>NOW},
  GM_getValue:async(key,fallback)=>{if(readError)throw new Error('bridge inaccessible');return values.has(key)?values.get(key):fallback;},
  GM_setValue:async(key,value)=>{writes.push([key,value]);values.set(key,value);},
  ...(available?{GM_openInTab:(url,options)=>{opens.push({url,options:{...options}});return handle;}}:{})
 });
 vm.runInContext(source+'\nthis.launchTest={LAUNCH_ACK_KEY,vintedLaunchURL,orionLaunchURL,openVintedBrowserTab,acknowledgeVintedLaunch,readVintedLaunchAck};',context);
 return {api:context.launchTest,values,opens,writes,handle};
}

test('URL de transfert : nonce entièrement encodée et conservée dans le fragment',()=>{
 const {api}=fixture();const nonce='fiche &?/#+é"=uno';const url=new URL(api.vintedLaunchURL(nonce));
 assert.equal(url.origin,'https://www.vinted.es');assert.equal(url.pathname,'/items/new');assert.equal(url.search,'');
 assert.equal(new URLSearchParams(url.hash.slice(1)).get('orion'),nonce);assert.equal(api.vintedLaunchURL('a'), 'https://www.vinted.es/items/new#orion=a');
 for(const invalid of ['',null,undefined,42,{},[], 'x'.repeat(161)])assert.throws(()=>api.vintedLaunchURL(invalid),/Identifiant/);
});

test('schéma Orion documenté : dashboard et Vinted gardent leur URL complète, hash compris',()=>{
 const {api}=fixture();for(const target of ['https://example.com/','https://example.com/#dashboard','https://www.vinted.es/items/new#orion=a%26b']){
  const native=api.orionLaunchURL(target);assert.ok(native.startsWith('orion://open-url?url='));
  assert.equal(new URL(native).searchParams.get('url'),target);assert.equal(new URL(native).hash,'');
 }
});

test('schéma Orion : destinations tierces, chemins inattendus et identifiants sont refusés',()=>{
 const {api}=fixture();for(const target of ['http://example.com/','https://example.com.evil.test/','https://evil.test/','https://www.vinted.es/','https://www.vinted.es/items/new/','https://www.vinted.es/items/123','https://vinted.es/items/new','https://example.com/private','https://user:secret@example.com/','https://user@www.vinted.es/items/new','javascript:alert(1)','data:text/html,test','orion://open-url?url=https://example.com/','invalid'])assert.throws(()=>api.orionLaunchURL(target));
});

test('bouton : appel synchrone unique de GM_openInTab avec active et insert, handle sans faux ACK',()=>{
 const {api,opens,handle,writes}=fixture();const result=api.openVintedBrowserTab('transfer-1');assert.equal(result,handle);
 assert.deepEqual(opens,[{url:'https://www.vinted.es/items/new#orion=transfer-1',options:{active:true,insert:true}}]);assert.deepEqual(writes,[]);
 assert.throws(()=>api.openVintedBrowserTab(''),/Identifiant/);assert.equal(opens.length,1);
 const absent=fixture({available:false});assert.throws(()=>absent.api.openVintedBrowserTab('transfer-1'),/indisponible/);assert.deepEqual(absent.opens,[]);
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
