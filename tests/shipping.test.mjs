import {test} from 'node:test';import assert from 'node:assert/strict';
import {vintedShippingSize} from '../src/vinted-adapter.js';
import {resolveOrionShipping,shippingEditorChoices} from '../src/shipping.js';
test('formats de colis FR/ES explicites identiques dans la fiche et l’adaptateur',()=>{
 for(const [value,size]of [['Petit',1],['Pequeño',1],[' PEQUEÑO ',1],['Pequeno',1],['small',1],['Moyen',2],['Mediano',2],['medium',2],['Grand',3],['Grande',3],['large',3]]){
  assert.equal(vintedShippingSize(value),size);assert.equal(resolveOrionShipping(value).size,size);
 }
 for(const value of ['',undefined,null,'Inconnu','Petit ou Moyen']){assert.throws(()=>vintedShippingSize(value),/non reconnu/);assert.throws(()=>resolveOrionShipping(value),/non reconnu/);}
});
test('éditeur colis : alias et valeurs anciennes conservés sans sélection implicite',()=>{
 for(const current of ['Pequeño','small','Moyen','Grand',' Valeur V1 inconnue ']){
  const choices=shippingEditorChoices(current),selected=choices.filter(choice=>choice.selected);
  assert.equal(selected.length,1);assert.equal(selected[0].value,current);
  assert.ok(choices.some(choice=>choice.label==='Petit'));assert.ok(choices.some(choice=>choice.label==='Moyen'));assert.ok(choices.some(choice=>choice.label==='Grand'));
 }
 assert.equal(shippingEditorChoices().find(choice=>choice.selected).value,'');
 assert.equal(shippingEditorChoices('Ancien format inconnu').find(choice=>choice.label==='Moyen').selected,false);
});
