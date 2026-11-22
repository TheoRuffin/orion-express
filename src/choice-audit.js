// Read-only final values. Never opens a picker, changes a field or reads photos.
function auditChoiceField(doc,id){
 const nodes=[...doc.querySelectorAll(`[id="${id}"]`)];
 const shown=nodes.filter(visible);
 return shown.length===1?shown[0]:nodes.length===1?nodes[0]:null;
}
function auditChoiceMenuOpen(doc,trigger,key){
 if(trigger?.getAttribute('aria-expanded')==='true')return true;
 const searchId=key==='category'?'catalog-search-input':'condition-search-input';
 if(visible(doc.getElementById(searchId)))return true;
 const owned=String(trigger?.getAttribute('aria-controls') || '').split(/\s+/).filter(Boolean).map(id=>doc.getElementById(id));
 if(owned.some(visible))return true;
 const names=key==='category'?['categorie','categoria','category']:['etat','estado','condition'];
 const scope=popupFor(doc,trigger);
 if(!visible(scope))return false;
 if(String(scope.getAttribute('aria-labelledby') || '').split(/\s+/).includes(trigger?.id))return true;
 const labels=[scope.getAttribute('aria-label'),...[...scope.querySelectorAll('h1,h2,h3,[role=heading]')].filter(visible).map(node=>node.textContent)];
 if(labels.some(label=>names.includes(fold(label || ''))))return true;
 if(key==='condition')return [...scope.querySelectorAll('[role=radio],[role=option]')].filter(visible).some(cell=>{
   const label=cell.querySelector('[data-testid$="--title"],[class*="Cell__title"]')?.textContent || cell.getAttribute('aria-label') || cell.textContent;
   try{resolveOrionCondition(label);return true;}catch{return false;}
 });
 return false;
}
function auditTextChoice(doc,product,key){
 const expected=String(product?.[key] ?? ''),trigger=auditChoiceField(doc,key),actual=String(selectedText(trigger)).trim();
 const row={key,expected,actual,matches:false,reason:''};
 const menuOpen=trigger && auditChoiceMenuOpen(doc,trigger,key);
 if(key==='category' && menuOpen)clearVintedCategoryEvidence(doc);
 if(!expected.trim()){row.reason='Valeur manquante dans la fiche.';return row;}
 if(!trigger){row.reason='Champ absent ou ambigu.';return row;}
 if(menuOpen){row.reason='Menu encore ouvert.';return row;}
 if(!visible(trigger)){row.reason='Champ non accessible.';return row;}
 if(key==='category'){
   const target=parts(expected).at(-1);
   row.matches=!!target && fold(actual)===fold(target);
   if(row.matches && parts(expected).length>1 && !hasVintedCategoryEvidence(doc,expected,actual)){row.matches=false;row.reason='Chemin de catégorie à confirmer.';return row;}
 }else{
   let desired,current;
   try{desired=resolveOrionCondition(expected);}catch{row.reason='État de la fiche à préciser.';return row;}
   try{current=resolveOrionCondition(actual);}catch{row.reason='État non reconnu dans Vinted.';return row;}
   row.matches=desired.key===current.key;
 }
 row.reason=row.matches?'Valeur vérifiée.':'Valeur différente de la fiche.';
 return row;
}
function auditShippingDisplay(doc,radio){
 const id=radio.id.slice('package_type_selector_'.length),cell=doc.getElementById('package-size-'+id);
 const heading=cell?.querySelector('[data-testid$="--title"],[class*="Cell__title"]');
 const text=String(heading?.textContent || cell?.textContent || radio.getAttribute('aria-label') || '').trim();
 const candidates=[text,radio.getAttribute('aria-label'),...[...(heading || cell)?.querySelectorAll('span,div') || []].map(node=>node.textContent)];
 const sizes=new Set();for(const candidate of candidates){try{sizes.add(vintedShippingSize(candidate));}catch{}}
 return {text,size:sizes.size===1?[...sizes][0]:null};
}
function auditShippingChoice(doc,product){
 const expected=String(product?.shipping ?? '');
 const selected=[...doc.querySelectorAll('input[type=radio][id^="package_type_selector_"]:checked')];
 const displayed=selected.map(radio=>auditShippingDisplay(doc,radio)),actual=displayed.map(value=>value.text).join(' / ');
 const row={key:'shipping',expected,actual,matches:false,reason:''};
 if(!expected.trim()){row.reason='Valeur manquante dans la fiche.';return row;}
 let size;try{size=vintedShippingSize(expected);}catch{row.reason='Format du colis à préciser.';return row;}
 if(selected.length>1){row.reason='Plusieurs colis sélectionnés.';return row;}
 row.matches=selected.length===1 && displayed[0].size===size && shippingSelected(doc,size);
 row.reason=row.matches?'Valeur vérifiée.':selected.length===1 && (selected[0].id!==`package_type_selector_${size}` || displayed[0].size!==null && displayed[0].size!==size)?'Valeur différente de la fiche.':'Sélection du colis non confirmée.';
 return row;
}
export function auditVintedChoices(doc,product){
 return [auditTextChoice(doc,product,'category'),auditTextChoice(doc,product,'condition'),auditShippingChoice(doc,product)];
}
export function watchVintedChoices(doc,product,onChange,{audit=auditVintedChoices}={}){
 const view=doc.defaultView;
 let stopped=false,queued=false,last;
 const own=node=>{
   const element=node?.nodeType===1?node:node?.parentElement;
   return !!element?.closest?.('#orion-vinted-test,#orion-express-v2') || !!element?.getRootNode?.().host?.matches?.('#orion-vinted-test,#orion-express-v2');
 };
 const check=()=>{
   if(stopped)return;
   const rows=audit(doc,product),signature=JSON.stringify(rows);
   if(signature!==last){last=signature;onChange(rows);}
 };
 const schedule=()=>{if(stopped||queued)return;queued=true;queueMicrotask(()=>{queued=false;check();});};
 const onEvent=event=>{if(!own(event.composedPath?.()[0] || event.target))schedule();};
 const observer=new view.MutationObserver(records=>{if(records.some(record=>!own(record.target)))schedule();});
 observer.observe(doc.body,{subtree:true,childList:true,characterData:true,attributes:true});
 doc.addEventListener('input',onEvent,true);doc.addEventListener('change',onEvent,true);
 const timer=view.setInterval(check,1000);
 const onPageHide=event=>{if(!event.persisted)stop();};
 const onPageShow=event=>{if(event.persisted)schedule();};
 function stop(){
   if(stopped)return;stopped=true;observer.disconnect();view.clearInterval(timer);
   doc.removeEventListener('input',onEvent,true);doc.removeEventListener('change',onEvent,true);
   view.removeEventListener('pagehide',onPageHide);view.removeEventListener('pageshow',onPageShow);
 }
 view.addEventListener('pagehide',onPageHide);view.addEventListener('pageshow',onPageShow);check();return stop;
}
