import {test} from 'node:test';import assert from 'node:assert/strict';
import {resolveOrionCondition,conditionEditorChoices} from '../src/condition.js';
test('états français et espagnols mappés explicitement sans confusion avec/sans étiquette',()=>{
 for(const [fr,es,key]of [['Neuf avec étiquette','Nuevo con etiquetas','new_with_tags'],['Neuf sans étiquette','Nuevo sin etiquetas','new_without_tags'],['Très bon état','Muy bueno','very_good']]){assert.equal(resolveOrionCondition(fr).key,key);assert.equal(resolveOrionCondition(es).key,key);}
 assert.equal(resolveOrionCondition('  très BON ÉTAT  ').key,'very_good');assert.equal(resolveOrionCondition('Muy buen estado').key,'very_good');
});
test('Neuf et Nuevo sont ambigus : aucune valeur implicite, inconnus refusés',()=>{
 for(const value of ['Neuf','Nuevo','New'])assert.throws(()=>resolveOrionCondition(value),/ambigu/);
 for(const value of ['',undefined,'Presque neuf','Comme neuf'])assert.throws(()=>resolveOrionCondition(value),/non reconnu/);
});
test('éditeur : choix précis, valeurs anciennes conservées et aucune conversion sans choix',()=>{
 for(const original of ['Neuf','Nuevo con etiquetas','Très bon état','Valeur V1 privée']){const options=conditionEditorChoices(original);assert.equal(options.filter(o=>o.selected).length,1);assert.equal(options.find(o=>o.selected).value,original);assert.ok(options.some(o=>o.label==='Neuf avec étiquette'));assert.ok(options.some(o=>o.label==='Neuf sans étiquette'));}
 assert.equal(conditionEditorChoices().find(o=>o.selected).value,'');
});
