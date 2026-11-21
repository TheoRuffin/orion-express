import {test} from 'node:test';import assert from 'node:assert/strict';
import {vintedShippingSize} from '../src/vinted-adapter.js';
test('formats de colis FR/ES explicites, aucune valeur par défaut pour une fiche inconnue',()=>{
 for(const [value,size]of [['Petit',1],['Pequeño',1],[' PEQUEÑO ',1],['Moyen',2],['Mediano',2],['Grand',3],['Grande',3]])assert.equal(vintedShippingSize(value),size);
 for(const value of ['',undefined,null,'Inconnu','Petit ou Moyen'])assert.throws(()=>vintedShippingSize(value),/non reconnu/);
});
