// Read-only form audit. FileList proves a local hand-off, never native upload acceptance.
function auditFormField(doc,id,tag){
  const fields=[...doc.querySelectorAll(`[id="${id}"]`)].filter(node=>(!tag || node.tagName===tag) && visible(node));
  return fields.length===1?fields[0]:null;
}
const auditFormText=value=>String(value ?? '').replace(/\r\n/g,'\n');
function auditAssociatedError(doc,field){
  for(const attribute of ['aria-errormessage','aria-describedby']){
    const ids=String(field.getAttribute(attribute) || '').split(/\s+/).filter(Boolean);
    for(const id of ids){
      const node=doc.getElementById(id);
      if(!visible(node) || !node.textContent?.trim())continue;
      const error=attribute==='aria-errormessage' || node.getAttribute('role')==='alert' || node.getAttribute('aria-live')==='assertive' || /(?:^|[-_])(error|errors|erreur|invalid)(?:$|[-_])/i.test(id) || node.matches('[data-testid$="--error"]');
      if(error)return 'Erreur associée au champ : '+node.textContent.trim();
    }
  }
  return '';
}
function auditFormError(doc,field,{emptyInvalid=false}={}){
  if(!field)return '';
  if(field.getAttribute('aria-invalid')==='true')return 'Champ signalé invalide par Vinted.';
  const associated=auditAssociatedError(doc,field);if(associated)return associated;
  if(field.validity?.valid===false && (emptyInvalid || String(field.value || '').length))return 'Valeur refusée par la validation du formulaire.';
  return '';
}
function auditFormValue(doc,product,key){
  const field=auditFormField(doc,key,key==='description'?'TEXTAREA':'INPUT');
  const expected=auditFormText(product?.[key]),actual=auditFormText(field?.value);
  const row={key,expected,actual,matches:false,reason:''};
  if(!field){row.reason='Champ absent ou ambigu.';return row;}
  const error=auditFormError(doc,field);if(error){row.reason=error;return row;}
  if(!expected.trim()){row.reason='Valeur manquante dans la fiche.';return row;}
  if(key==='price'){
    try{row.matches=Math.round(parseVintedPrice(expected)*100)===Math.round(parseVintedPrice(actual)*100);}
    catch{row.reason='Prix invalide ou non reconnu dans Vinted.';return row;}
  }else row.matches=actual===expected;
  row.reason=row.matches?'Valeur vérifiée.':'Valeur différente de la fiche.';
  return row;
}
function auditBrandMenuOpen(doc,trigger){
  if(trigger?.getAttribute('aria-expanded')==='true' || visible(doc.getElementById('brand-search-input')))return true;
  const owned=String(trigger?.getAttribute('aria-controls') || '').split(/\s+/).filter(Boolean).map(id=>doc.getElementById(id));
  if(owned.some(visible))return true;
  const scope=popupFor(doc,trigger);if(!visible(scope))return false;
  if(String(scope.getAttribute('aria-labelledby') || '').split(/\s+/).includes(trigger?.id))return true;
  return [scope.getAttribute('aria-label'),...[...scope.querySelectorAll('h1,h2,h3,[role=heading]')].filter(visible).map(node=>node.textContent)].some(label=>['marque','marca','brand'].includes(fold(label || '')));
}
function auditFormBrand(doc,product){
  const expected=String(product?.brand ?? ''),field=auditChoiceField(doc,'brand'),actual=String(selectedText(field)).trim();
  const row={key:'brand',expected,actual,matches:false,reason:''};
  if(!expected.trim()){row.reason='Valeur manquante dans la fiche.';return row;}
  if(!field){row.reason='Champ absent ou ambigu.';return row;}
  if(auditBrandMenuOpen(doc,field)){row.reason='Menu encore ouvert.';return row;}
  if(!visible(field)){row.reason='Champ non accessible.';return row;}
  const error=auditFormError(doc,field);if(error){row.reason=error;return row;}
  row.matches=fold(actual)===fold(expected);row.reason=row.matches?'Valeur vérifiée.':'Valeur différente de la fiche.';
  return row;
}
export function auditVintedPhotos(doc,manifest,expectedCount){
  const known=Array.isArray(manifest),count=known?manifest.length:expectedCount;
  const row={key:'photos',expected:Number.isSafeInteger(count)?`${count} photo(s)`:'Photos du produit',actual:'',matches:false,reason:'Photos natives à vérifier.',state:'unverified'};
  const inputs=[...doc.querySelectorAll('input[type=file]')].filter(node=>!node.disabled && node.multiple);
  if(inputs.length!==1){row.reason=inputs.length?'Sélecteur photo ambigu. Photos natives à vérifier.':'Photos natives à vérifier.';return row;}
  const input=inputs[0],files=[...(input.files || [])];row.actual=`${files.length} fichier(s) dans le sélecteur`;
  const error=auditFormError(doc,input);if(error){row.reason=error;row.state='invalid';return row;}
  if(!known)return row;
  const same=files.length===manifest.length && files.every((file,index)=>{
    const wanted=manifest[index];
    return wanted && file.name===wanted.name && file.size===wanted.size && file.type===wanted.type && (wanted.lastModified===undefined || file.lastModified===wanted.lastModified);
  });
  row.state=same?'uploaded':'mismatch';
  if(!same)row.reason='Les fichiers du sélecteur ne correspondent pas au transfert. Photos natives à vérifier.';
  return row;
}
function auditDynamicForm(doc){
  const title=doc.getElementById('title'),form=title?.form || title?.closest('form');if(!form)return null;
  const known=new Set(['title','description','price','category','brand','condition']);
  const errors=[...form.querySelectorAll('input,select,textarea,[aria-invalid="true"]')].filter(field=>visible(field) && !known.has(field.id) && field.type!=='file' && !field.id.startsWith('package_type_selector_') && !field.closest('[role=dialog],[role=menu],[role=listbox],#orion-vinted-test,#orion-express-v2') && !/search/i.test(field.type+' '+field.id)).map(field=>auditFormError(doc,field,{emptyInvalid:true})).filter(Boolean);
  return errors.length?{key:'dynamic',expected:'Champs supplémentaires valides',actual:`${errors.length} champ(s) signalé(s) invalide(s)`,matches:false,reason:errors[0]}:null;
}
export function auditVintedForm(doc,product,{photoManifest}={}){
  const choices=auditVintedChoices(doc,product).map(row=>{
    const fields=row.key==='shipping'?[...doc.querySelectorAll('input[type=radio][id^="package_type_selector_"]:checked')].flatMap(radio=>[radio,doc.getElementById('package-size-'+radio.id.slice('package_type_selector_'.length))]):[auditFormField(doc,row.key)];
    const error=fields.map(field=>auditFormError(doc,field)).find(Boolean);
    return error?{...row,matches:false,reason:error}:row;
  });
  const rows=[auditFormValue(doc,product,'title'),auditFormValue(doc,product,'description'),auditFormValue(doc,product,'price'),choices.find(row=>row.key==='category'),auditFormBrand(doc,product),choices.find(row=>row.key==='condition'),choices.find(row=>row.key==='shipping'),auditVintedPhotos(doc,photoManifest,product?.photos?.length)];
  const dynamic=auditDynamicForm(doc);if(dynamic)rows.push(dynamic);
  return rows;
}
