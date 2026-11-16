// Explicit semantic mapping only. The product schema remains a string.
export const ORION_CONDITIONS=[
 {key:'new_with_tags',fr:'Neuf avec étiquette',es:'Nuevo con etiquetas',aliases:['Neuf avec étiquettes','Nuevo con etiqueta','New with tags']},
 {key:'new_without_tags',fr:'Neuf sans étiquette',es:'Nuevo sin etiquetas',aliases:['Neuf sans étiquettes','Nuevo sin etiqueta','New without tags']},
 {key:'very_good',fr:'Très bon état',es:'Muy bueno',aliases:['Muy buen estado','Very good']},
 {key:'good',fr:'Bon état',es:'Bueno',aliases:['Buen estado','Good']},
 {key:'fair',fr:'Satisfaisant',es:'Satisfactorio',aliases:['Aceptable','Fair']}
];
const conditionKey=value=>String(value??'').normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/\s+/g,' ').trim().toLowerCase();
export function resolveOrionCondition(value){
 const text=conditionKey(value);
 if(['neuf','nuevo','new'].includes(text))throw new Error('État ambigu : choisissez Neuf avec étiquette ou Neuf sans étiquette dans la fiche produit.');
 const match=ORION_CONDITIONS.find(c=>[c.key,c.fr,c.es,...c.aliases].some(v=>conditionKey(v)===text));
 if(!match)throw new Error('État absent ou non reconnu : choisissez un état précis dans la fiche produit.');return match;
}
export function conditionEditorChoices(current=''){
 let known;try{known=resolveOrionCondition(current);}catch{}
 return [
 {value:'',label:'Choisir un état précis',selected:!current},
 ...(current&&!known?[{value:String(current),label:`État actuel à préciser : ${current}`,selected:true}]:[]),
 ...ORION_CONDITIONS.map(c=>({value:known?.key===c.key?String(current):c.fr,label:c.fr,selected:known?.key===c.key}))
 ];
}
function conditionOfCell(cell){
 const explicit=cell.querySelector('[data-testid$="--title"],[class*="Cell__title"]');
 const title=explicit?.textContent || cell.getAttribute('aria-label') || cell.textContent;
 // A description appended to a condition is not an alias. Inspect exact nested labels.
 const candidates=explicit?[title]:[title,...[...cell.querySelectorAll('span,div,label')].map(e=>e.textContent)];
 const matches=new Map();for(const label of candidates){try{const c=resolveOrionCondition(label);matches.set(c.key,c);}catch{}}
 return matches.size===1?[...matches.values()][0]:null;
}
const conditionSelected=cell=>{
 if(!cell)return false;
 // aria-checked on the component is authoritative; native checked alone may be a DOM-only change.
 if(cell.hasAttribute('aria-checked')){const input=cell.querySelector('input[type=radio]');return cell.getAttribute('aria-checked')==='true' && (!input || input.checked);}
 return cell.matches('input[type=radio]')?cell.checked:!!cell.querySelector('input[type=radio]:checked');
};
export async function selectVintedCondition(doc,value){
 const desired=resolveOrionCondition(value); // Reject "Neuf" before opening the menu.
 const trigger=await waitFor(()=>{const list=[...doc.querySelectorAll('[id="condition"]')].filter(visible);return list.length===1?list[0]:null;},4500);
 const currentMatches=()=>{try{return resolveOrionCondition(selectedText(doc.getElementById('condition'))).key===desired.key;}catch{return false;}};
 const menuAlreadyVisible=()=>{const scope=popupFor(doc,trigger);return scope && visible(scope) && [...scope.querySelectorAll('[role=radio],[role=option]')].some(cell=>visible(cell)&&conditionOfCell(cell));};
 if(currentMatches() && trigger.getAttribute('aria-expanded')!=='true' && !menuAlreadyVisible())return `État vérifié : ${selectedText(trigger)}`;
 if(trigger.getAttribute('aria-expanded')!=='true')trigger.click();
 let chosen;
 const findCell=()=>{
   const scope=popupFor(doc,trigger) || doc;
   const matches=[...scope.querySelectorAll('[role=radio],[role=option]')].filter(visible).filter(cell=>conditionOfCell(cell)?.key===desired.key);
   return matches.length===1?matches[0]:null;
 };
 chosen=await waitFor(findCell,4500);
 const menuRoot=popupFor(doc,trigger,chosen);
 // Click the actual semantic cell, not a nested radio whose DOM checked state can bypass the component.
 chosen.click();
 const closed=()=>currentMatches() && doc.getElementById('condition')?.getAttribute('aria-expanded')!=='true' && (!findCell()) && (!menuRoot || !menuRoot.isConnected || !visible(menuRoot));
 // Some mobile variants bind only the native radio's change handler. Retry that same precise option once.
 try{await waitFor(()=>conditionSelected(findCell()) || closed(),500);}catch{const cell=findCell();const input=cell?.matches('input[type=radio]')?cell:cell?.querySelector('input[type=radio]');if(input && !input.disabled)input.click();}
 await waitFor(()=>conditionSelected(findCell()) || closed(),3500);
 const action=await waitFor(()=>{
   if(closed())return {closed:true};
   const cell=findCell();if(!conditionSelected(cell))return null;
   const scope=popupFor(doc,trigger,cell) || doc;
   const buttons=[...scope.querySelectorAll('button')].filter(b=>visible(b) && b.getAttribute('aria-disabled')!=='true' && ['fait','listo','hecho','done'].includes(fold(b.textContent)));
   return buttons.length===1?{button:buttons[0]}:null;
 },4500);
 if(action.button){
   if(!conditionSelected(findCell()))throw new Error('État non coché : confirmation annulée.');
   action.button.click();
 }
 await waitFor(closed,4500);
 return `État vérifié : ${selectedText(doc.getElementById('condition'))}`;
}
