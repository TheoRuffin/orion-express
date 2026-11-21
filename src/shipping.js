// Product strings stay unchanged until the user explicitly chooses a precise size.
export const ORION_SHIPPING=[
 {key:'small',size:1,fr:'Petit',es:'Pequeño',aliases:['Pequeno']},
 {key:'medium',size:2,fr:'Moyen',es:'Mediano',aliases:[]},
 {key:'large',size:3,fr:'Grand',es:'Grande',aliases:[]}
];
const shippingKey=value=>String(value??'').normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/\s+/g,' ').trim().toLowerCase();
export function resolveOrionShipping(value){
 const text=shippingKey(value);
 const match=ORION_SHIPPING.find(option=>[option.key,option.fr,option.es,...option.aliases].some(alias=>shippingKey(alias)===text));
 if(!match)throw new Error('Format du colis non reconnu ou manquant dans la fiche.');
 return match;
}
export function shippingEditorChoices(current=''){
 let known;try{known=resolveOrionShipping(current);}catch{}
 return [
  {value:'',label:'Choisir un format précis',selected:!current},
  ...(current&&!known?[{value:String(current),label:`Format actuel à préciser : ${current}`,selected:true}]:[]),
  ...ORION_SHIPPING.map(option=>({value:known?.key===option.key?String(current):option.fr,label:option.fr,selected:known?.key===option.key}))
 ];
}
