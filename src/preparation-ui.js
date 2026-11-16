let preparationDB, preparationURLs=[];
async function workspace() { if(!preparationDB) preparationDB=await prepStore(); return preparationDB; }
async function startPreparation(product) {
  const next=prepareProduct(product);
  const files=await preparedFiles(next);
  if(files.reduce((n,f)=>n+f.size,0)>40*1024*1024) throw new Error('Photos supérieures à 40 Mo : réduisez leur taille dans une copie de la fiche avant de préparer. Les originaux sont conservés.');
  const store=await workspace(), previous=await store.get();
  if(previous && !confirm('Remplacer la préparation en cours ? Les fiches du catalogue et leurs photos seront conservées.')) return;
  await store.put(next); await showPreparation();
}
async function showPreparation() {
  const store=await workspace(); let p=await store.get();
  if(!p) {status('Aucune préparation en cours. Ouvrez une fiche puis Préparer sur Vinted.');return;}
  if(p.version!==1) throw new Error('Préparation non reconnue. Le catalogue est conservé.');
  for(const url of preparationURLs) URL.revokeObjectURL(url); preparationURLs=[];
  const files=await preparedFiles(p), archive=await photoArchive(files,p.fields);
  const url=URL.createObjectURL(archive);preparationURLs.push(url);
  main.innerHTML=`<button id="prep-back">← Retour à la fiche produit</button><section class="tip"><small>ASSISTANT VINTED ESPAGNE · PARCOURS MANUEL</small><h2>${esc(p.fields.title)}</h2><p>Informations préparées ici. Aucun champ n’est rempli sur Vinted. Copiez puis collez dans le site, et cochez seulement après vérification.</p><a class="primary vinted-link" href="${VINTED_NEW}" target="_blank" rel="noopener noreferrer">Ouvrir le vrai formulaire Vinted ↗</a><p>La connexion peut être nécessaire. Revenez à cet onglet après une interruption : la préparation est enregistrée sur cet appareil.</p></section><h3>1 · Vos ${files.length} photo(s)</h3><button id="share-photos">Partager les photos ensemble</button><a id="photo-zip" download="orion-vinted-photos.zip" href="${url}">Télécharger toutes les photos (ZIP)</a><p class="hint">Dans le partage iOS, enregistrez les images dans Photos ou Fichiers si proposé. Sinon, téléchargez le ZIP, ouvrez-le dans Fichiers pour l’extraire, puis sélectionnez les images ensemble dans le sélecteur de Vinted. Le fichier annonce.txt contient aussi les textes. Aucun envoi automatique.</p><div id="prep-photos" class="photos"></div><label class="check"><input type="checkbox" data-check="photos" ${p.checked.photos?'checked':''}> J’ai ajouté et vérifié les photos dans Vinted</label><h3>2 · Copier, coller, vérifier</h3><div id="prep-fields"></div><textarea id="copy-fallback" hidden aria-label="Texte à copier" rows="6"></textarea><h3>3 · Catégorie et vérification finale</h3><p>Choisissez la catégorie dans la recherche hiérarchique de Vinted. Pour « Jeux de société », renseignez aussi les champs supplémentaires affichés. La marque, l’état et le colis restent à sélectionner dans leurs listes.</p><button id="category-changed">J’ai changé de catégorie : revérifier les choix</button><label class="check"><input type="checkbox" data-check="dynamic" ${p.checked.dynamic?'checked':''}> J’ai vérifié les champs supplémentaires, la marque, l’état et le colis après le choix de catégorie</label><label class="check"><input type="checkbox" data-check="review" ${p.checked.review?'checked':''}> J’ai comparé toutes les informations et les photos avec l’annonce Vinted</label><p id="prep-summary" role="status"></p><p class="hint">Ces coches sont vos confirmations manuelles, pas une détection du formulaire. Publication exclusivement depuis le bouton natif Vinted. Aucune vente ni diminution du stock n’est enregistrée par cet assistant.</p><button id="clear-prep">Effacer uniquement cette préparation</button>`;
  const rows=$('#prep-fields');
  for(const [key,label] of PREP_FIELDS) {
    const row=document.createElement('section');row.className='prep-field';
    row.innerHTML=`<h3>${label}</h3><p class="description">${esc(p.fields[key] || 'À choisir manuellement dans Vinted')}</p><button type="button" data-copy="${key}" ${p.fields[key]?'':'disabled'}>Copier ${label.split(' / ')[0].toLowerCase()}</button><label class="check"><input type="checkbox" data-check="${key}" ${p.checked[key]?'checked':''}> Vérifié dans Vinted</label>`;rows.append(row);
    row.querySelector('button').onclick=()=>safe(async()=>copy(p.fields[key]));
  }
  const summary=()=>{
    const keys=[...PREP_FIELDS.map(([k])=>k),'photos','dynamic','review'];
    $('#prep-summary').textContent=`Préparé localement : ${PREP_FIELDS.filter(([k])=>p.fields[k]).length}/7 valeurs et ${files.length} photo(s). Vérifié par vous dans Vinted : ${keys.filter(k=>p.checked[k]).length}/${keys.length}.`;
  };summary();
  for(const box of root.querySelectorAll('[data-check]')) box.onchange=()=>safe(async()=>{
    const before=p,next=checkPreparation(p,box.dataset.check,box.checked);
    try {await store.put(next);p=next;} catch(e){box.checked=!!before.checked[box.dataset.check];throw e;}
    for(const b of root.querySelectorAll('[data-check]'))b.checked=!!p.checked[b.dataset.check];summary();status('Vérification enregistrée sur cet appareil.');
  });
  $('#category-changed').onclick=()=>safe(async()=>{const next=checkPreparation(p,'category',false);await store.put(next);p=next;for(const b of root.querySelectorAll('[data-check]'))b.checked=!!p.checked[b.dataset.check];summary();status('Catégorie, champs supplémentaires, marque, état et colis à revérifier.');});
  $('#share-photos').onclick=()=>safe(async()=>{
    if(!navigator.canShare?.({files}) || !navigator.share) {status('Partage multiple indisponible ici. Utilisez le ZIP ou les liens photo individuels.');return;}
    try {await navigator.share({files});status('Partage fermé. Vérifiez que les images sont enregistrées avant de les sélectionner dans Vinted.');}
    catch(e){if(e.name==='AbortError'){status('Partage annulé. Les photos restent disponibles ici.');return;}throw e;}
  });
  await renderPhotos($('#prep-photos'),files);
  files.forEach((f,i)=>{const a=document.createElement('a'),u=URL.createObjectURL(f);preparationURLs.push(u);a.href=u;a.download=f.name;a.textContent=`Enregistrer la photo ${i+1}`;$('#prep-photos').append(a);});
  bind('#prep-back',async()=>preview(p.sourceId));
  bind('#clear-prep',async()=>{if(confirm('Effacer la préparation locale ? Les produits et les photos du catalogue restent conservés.')){await store.clear();await home();status('Préparation effacée, catalogue conservé.');}});
  status('Préparation locale enregistrée. Collage, choix et ajout des photos manuels dans Vinted.');
}
