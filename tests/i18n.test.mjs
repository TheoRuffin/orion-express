import {test} from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';
const source=await readFile('src/i18n.js','utf8');
function context(){const c=vm.createContext({});vm.runInContext(source,c);return c;}
test('traductions espagnoles des menus, erreurs et messages variables, sans altérer les données interpolées',()=>{
 const c=context();const tr=text=>vm.runInContext(`translateOrion(${JSON.stringify(text)})`,c);
 assert.equal(tr('＋ Nouveau produit'),'＋ Nuevo producto');assert.equal(tr('Orion '),'Orion ');assert.equal(tr('Stockage plein : aucune modification enregistrée. Exportez une sauvegarde et libérez de l’espace.'),'Almacenamiento lleno: no se ha guardado ningún cambio. Exporta una copia y libera espacio.');
 assert.equal(tr('Prêt : Description, 2 photo(s). Lancez le test lorsque le formulaire est chargé.'),'Listo: Description, 2 foto(s). Inicia la prueba cuando se cargue el formulario.');assert.equal(tr('Photo 2 vide.'),'La foto 2 está vacía.');assert.equal(tr('Prix / Precio : Prix vérifié : 10.00 €'),'Precio: Precio verificado: 10.00 €');
 assert.equal(tr('Erreur associée au champ : Mon texte privé'),'Error asociado al campo: Mon texte privé');assert.equal(tr('Manuel : Limite de corrections atteinte. Valeur à vérifier dans Vinted.'),'Manual: Se ha alcanzado el límite de correcciones. Revisa este valor en Vinted.');assert.equal(tr('2 fichier(s) dans le sélecteur'),'2 archivo(s) en el selector');
});
test('français disponible et messages d’origine conservés pour le retour de langue',()=>{const c=context();vm.runInContext("orionLanguage='fr'",c);assert.equal(vm.runInContext("translateOrion('Préparer sur Vinted')",c),'Préparer sur Vinted');assert.equal(vm.runInContext("translateOrion('Titre / Título')",c),'Titre');});
