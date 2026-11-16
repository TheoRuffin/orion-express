import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepareProduct,checkPreparation,preparedFiles,photoArchive,prepStore,VINTED_NEW } from '../src/preparation.js';
import { IDBFactory } from 'fake-indexeddb';
import { mkdtemp,writeFile,rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
const product={id:'card',title:'Cartes',description:'Jeu complet',price:10,initialStock:2,sales:[],photos:['data:image/png;base64,YWJj']};
test('préparation sélective sans mutation V2, prix espagnol et photo inchangée',()=>{
  const original=structuredClone(product),p=prepareProduct(product);assert.deepEqual(original,product);assert.equal(p.fields.price,'10,00');assert.deepEqual(p.photos,product.photos);assert.equal(p.sourceId,'card');assert.equal(VINTED_NEW,'https://www.vinted.es/items/new');
});
test('fiches incomplètes et rupture de stock refusées',()=>{
  for(const patch of [{title:''},{description:''},{price:0},{photos:[]},{initialStock:0}])assert.throws(()=>prepareProduct({...product,...patch}),/Ajoutez/);
});
test('changement de catégorie invalide les contrôles dépendants et la relecture',()=>{
  const p=prepareProduct(product);p.checked={photos:true,brand:true,condition:true,shipping:true,dynamic:true,review:true};
  const next=checkPreparation(p,'category',true);for(const k of ['brand','condition','shipping','dynamic','review'])assert.equal(next.checked[k],false);assert.equal(next.checked.photos,true);assert.equal(p.checked.review,true);
  assert.throws(()=>checkPreparation(p,'publish',true),/inconnue/);
});
test('photo réutilisée sans changement des octets, format et extension',async()=>{
  const files=await preparedFiles(prepareProduct(product));assert.equal(await files[0].text(),'abc');assert.equal(files[0].name,'orion-photo-01.png');assert.equal(files[0].type,'image/png');
  await assert.rejects(preparedFiles({photos:['https://external.invalid/private']}),/Format photo/);
});
test('archive ZIP lisible avec CRC vérifiés et tous les originaux',async()=>{
  const p=prepareProduct(product),files=await preparedFiles(p),zip=await photoArchive(files,p.fields);
  const dir=await mkdtemp(join(tmpdir(),'orion-zip-'));
  try{const path=join(dir,'photos.zip');await writeFile(path,new Uint8Array(await zip.arrayBuffer()));const result=execFileSync('python3',['-c','import zipfile,sys; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; assert z.read("orion-photo-01.png")==b"abc"; assert "10,00" in z.read("annonce.txt").decode(); print(len(z.namelist()))',path],{encoding:'utf8'});assert.equal(result.trim(),'2');}finally{await rm(dir,{recursive:true,force:true});}
});
test('reprise durable, un seul snapshot et suppression isolée du catalogue',async()=>{
  globalThis.indexedDB=new IDBFactory();const store=await prepStore(),p=prepareProduct(product);await store.put(p);await store.put(p);store.close();
  const reopened=await prepStore();assert.deepEqual((await reopened.get()).photos,p.photos);await reopened.clear();assert.equal(await reopened.get(),undefined);reopened.close();assert.equal(product.photos.length,1);
});
