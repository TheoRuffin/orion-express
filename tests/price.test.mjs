import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseVintedPrice} from '../src/vinted-adapter.js';
test('prix FR/ES : nombres, point, virgule, symbole euro et espace insécable',()=>{
 for(const input of [10,'10','10.00','10,00','10 €','10,00\u00a0€',' 10.00 € '])assert.equal(parseVintedPrice(input),10);
 assert.equal(parseVintedPrice('10,25'),10.25);
});
test('prix non numériques, négatifs, ambigus ou trop précis refusés',()=>{
 for(const input of [NaN,Infinity,-10,'-10','NaN €','10 euros','10,00x','',null,{},'1.234,56','10,001',10.001])assert.throws(()=>parseVintedPrice(input),/Prix invalide/);
});
