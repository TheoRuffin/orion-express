if (document.getElementById('orion-express-v2')) return;
Object.assign(ES,{'Choisir un format précis':'Elegir un tamaño preciso','Petit':'Pequeño','Moyen':'Mediano','Grand':'Grande'});
document.title='Orion Express';
for(const name of ['application-name','apple-mobile-web-app-title']){
  const meta=document.head.querySelector(`meta[name="${name}"]`) || document.createElement('meta');
  meta.name=name;meta.content='Orion Express';if(!meta.isConnected)document.head.append(meta);
}
const host = document.createElement('div');
host.id = 'orion-express-v2';
host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#f6f5ef;color:#172b35';
const root = host.attachShadow({ mode: 'open' });
root.innerHTML = `<style>${APP_CSS}#product-shipping{display:block;width:100%;margin:8px 0 18px;padding:14px;border:1px solid #bdcbc3;border-radius:12px;background:white;color:#172b35;font:16px -apple-system,sans-serif}</style><div class="shell"><header><div><small>VOTRE ATELIER DE VENTE · V3</small><h1>Orion <em>Express</em></h1></div><button id="minimize" aria-label="Réduire l’application">−</button></header><div class="origin">Local · example.com · aucune synchronisation</div><div id="status" role="status" aria-live="polite"></div><main></main><footer>Les données du navigateur ne sont pas une sauvegarde. Exportez vers Fichiers régulièrement.<br>Préparation manuelle des annonces : aucune connexion ni publication sur Vinted.</footer></div>`;
document.body.append(host);
attachOrionLanguage(root,root.querySelector('.shell'));
const $ = s => root.querySelector(s);
const main = $('main');
let repo, products = [], selected, dirty = false, backupURL, busy = false;
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
function status(message, bad = false) { $('#status').textContent = message; $('#status').className = bad ? 'error' : ''; }
async function safe(action) { if (busy) return; busy = true; main.inert = true; main.setAttribute('aria-busy','true'); try { await action(); } catch(e) { status(errorMessage(e), true); } finally { busy = false; main.inert = false; main.removeAttribute('aria-busy'); } }
function leave() { return !dirty || orionConfirm('Quitter sans enregistrer les modifications ?'); }
window.addEventListener('beforeunload', e => { if (dirty || busy) { e.preventDefault(); e.returnValue = ''; } });
$('#minimize').onclick = () => {
  const minimized = host.style.height === '58px';
  host.style.cssText = minimized ? 'position:fixed;inset:0;z-index:2147483647;background:#f6f5ef;color:#172b35' : 'position:fixed;right:8px;bottom:8px;inset:auto 8px 8px auto;height:58px;width:220px;z-index:2147483647;background:#f6f5ef;border-radius:18px;overflow:hidden';
  $('.shell').classList.toggle('mini', !minimized);
  $('#minimize').textContent = minimized ? '−' : '+';
};
async function load() { products = await repo.all(); }
function bind(id, fn) { $(id).onclick = () => safe(fn); }
async function renderPhotos(container, photos, editable = false, changed = () => {}) {
  container.replaceChildren();
  for (let i = 0; i < photos.length; i++) {
    const tile = document.createElement('div'); tile.className = 'photo';
    const img = document.createElement('img'); img.alt = `Photo ${i + 1}`; tile.append(img); container.append(tile);
    try { img.src = await photoURL(photos[i]); } catch(e) { img.remove(); const note = document.createElement('p'); note.textContent = errorMessage(e); tile.append(note); }
    if (editable) {
      const replacement = document.createElement('input'); replacement.type = 'file'; replacement.accept = 'image/*'; replacement.hidden = true;
      const replace = document.createElement('button'); replace.type = 'button'; replace.textContent = 'Remplacer';
      replace.onclick = () => replacement.click();
      replacement.onchange = () => safe(async () => { if (!replacement.files[0]) return; const file = replacement.files[0]; checkFile(file); photos[i] = file; changed(); await renderPhotos(container, photos, true, changed); });
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Retirer';
      remove.onclick = () => { photos.splice(i,1); changed(); void renderPhotos(container, photos, true, changed); };
      tile.append(replace, remove, replacement);
    }
  }
}
function checkFile(f) { if (!f.type.startsWith('image/')) throw new Error('Choisissez une image.'); if (f.size > 15 * 1024 * 1024) throw new Error('Image supérieure à 15 Mo. Réduisez-la avant ajout.'); }
async function home() {
  dirty = false; selected = undefined; await load();
  main.innerHTML = `<section class="hero"><small>LE CATALOGUE</small><h2>Prêt pour la prochaine vente.</h2><div class="stats"><span><b>${products.length}</b> fiches</span><span><b>${products.reduce((n,p) => n + remaining(p),0)}</b> en stock</span></div><button class="primary" id="new">＋ Nouveau produit</button></section><div class="toolbar"><button id="export">Exporter la sauvegarde</button><button id="import">Restaurer une sauvegarde</button><button id="dashboard-access">Accès direct dans Orion</button></div><button id="resume-prep">Reprendre ma préparation Vinted</button><div id="download"></div><label class="search">Retrouver une fiche<input id="search" type="search" placeholder="Titre, marque, catégorie…"></label><div class="cards"></div><input hidden type="file" accept="application/json,.json" id="backup"><section class="tip"><b>Une seule origine, vos données retrouvées</b><p>Ouvrez toujours https://example.com. Désactivez V1 avant d’utiliser V2. Une sauvegarde contient vos photos : conservez-la dans Fichiers, jamais dans le dépôt public.</p></section>`;
  bind('#new', async () => edit());
  bind('#resume-prep', async () => showPreparation());
  bind('#dashboard-access',async()=>openDashboardAccess());
  const cards = $('.cards');
  const draw = () => {
    cards.replaceChildren(); const query = $('#search').value.toLocaleLowerCase('fr');
    const matches = products.filter(p => [p.title,p.brand,p.category,p.description].join(' ').toLocaleLowerCase('fr').includes(query));
    if (!matches.length) cards.innerHTML = `<div class="empty"><h3>${products.length ? 'Aucun résultat' : 'Votre premier produit vous attend'}</h3><p>Créez une fiche ou retrouvez votre catalogue avec une sauvegarde.</p>${products.length ? '' : '<button id="starter">Créer « Jeu de cartes » à 10 €</button>'}</div>`;
    if ($('#starter')) bind('#starter', async () => edit({ title:orionLanguage==='es'?'Juego de cartas':'Jeu de cartes', price:10, initialStock:1, photos:[], sales:[] }));
    for (const p of matches) {
      const card = document.createElement('button'); card.className = 'card';
      card.innerHTML = `<div class="thumb"></div><div><small ${p.category?'data-orion-user':''}>${esc(p.category || 'À classer')}</small><h3 ${p.title?'data-orion-user':''}>${esc(p.title || 'Sans titre')}</h3><span>${money(p.price)} · ${remaining(p)} en stock</span></div><span aria-hidden="true">↗</span>`;
      card.onclick = () => safe(async () => preview(p.id)); cards.append(card);
      if (p.photos.length) void renderPhotos(card.querySelector('.thumb'), [p.photos[0]]);
      else card.querySelector('.thumb').textContent = '✧';
    }
  };
  $('#search').oninput = draw; draw();
  bind('#export', async () => {
    const records = await repo.allRaw(); const text = await exportBackup(records);
    const verified = await readBackup(text);
    if (verified.length !== records.length) throw new Error('Vérification de sauvegarde échouée.');
    if (backupURL) URL.revokeObjectURL(backupURL);
    const blob = new Blob([text], {type:'application/json'}); backupURL = URL.createObjectURL(blob);
    const filename = `orion-express-${new Date().toISOString().slice(0,10)}.backup.json`;
    $('#download').innerHTML = '<p>Sauvegarde vérifiée. Enregistrez-la dans Fichiers puis testez sa restauration.</p>';
    const a = document.createElement('a'); a.href = backupURL; a.download = filename; a.textContent = 'Télécharger à nouveau la sauvegarde'; $('#download').append(a); a.click();
    if (navigator.canShare && navigator.canShare({files:[new File([blob],filename,{type:'application/json'})]})) {
      const share = document.createElement('button'); share.textContent = 'Partager / Enregistrer dans Fichiers'; share.onclick = () => safe(async () => { await navigator.share({files:[new File([blob],filename,{type:'application/json'})]}); }); $('#download').append(share);
    }
    status(`${records.length} fiche(s) exportée(s), intégrité et lecture vérifiées.`);
  });
  bind('#import', async () => $('#backup').click());
  $('#backup').onchange = () => safe(async () => {
    const file = $('#backup').files[0]; if (!file) return;
    if (file.size > MAX_BACKUP) throw new Error('Sauvegarde supérieure à 100 Mo.');
    const records = await readBackup(await file.text());
    const photos = records.reduce((n,p) => n + p.photos.length,0);
    if (!orionConfirm(`Sauvegarde vérifiée : ${records.length} fiche(s), ${photos} photo(s). Restaurer comme nouvelles fiches ? Les fiches actuelles seront conservées. Des doublons sont possibles.`)) return;
    const count = await repo.importCopies(records); await home(); status(`${count} fiche(s) restaurée(s). Originaux conservés.`);
  });
}
async function edit(draft) {
  const p = draft ?? { title:'', price:0, initialStock:1, photos:[], sales:[] };
  const photos = structuredClone(p.photos); selected = p.id;
  const shippingChoices=shippingEditorChoices(p.shipping);
  if(p.shipping)ES[`Format actuel à préciser : ${p.shipping}`]=`Tamaño actual por precisar: ${p.shipping}`;
  const fields = [['title','Titre','text'],['price','Prix (€)','number'],['category','Catégorie','text'],['brand','Marque','text'],['condition','État','text'],['shipping','Format du colis','text'],['initialStock','Stock initial','number']];
  main.innerHTML = `<button id="back">← Catalogue</button><h2>${p.id ? 'Modifier la fiche' : 'Nouveau produit'}</h2><form>${fields.map(([key,label,type]) => (key==='condition'||key==='shipping') ? `<label for="product-${key}">${label}</label><select id="product-${key}" name="${key}">${(key==='condition'?conditionEditorChoices(p.condition):shippingChoices).map(o=>`<option value="${esc(o.value)}" ${o.selected?'selected':''}>${esc(o.label)}</option>`).join('')}</select>` : `<label>${label}<input name="${key}" type="${type}" value="${esc(p[key] ?? '')}" ${type === 'number' ? `min="0" step="${key === 'price' ? '0.01' : '1'}" required inputmode="${key === 'price' ? 'decimal' : 'numeric'}"` : ''} ${key === 'title' ? 'required maxlength="200"' : ''}></label>`).join('')}<label for="description">Description</label><textarea id="description" name="description" rows="6">${esc(p.description)}</textarea><h3>Photos · <span id="photo-count">${photos.length}</span></h3><div class="photos"></div><button id="add-photos" type="button">＋ Ajouter des photos</button><input id="photos" type="file" accept="image/*" multiple hidden><p class="hint">Jusqu’à 15 Mo par photo. HEIC peut être conservé sans être affichable sur tous les navigateurs. Remplacer agit seulement sur la photo choisie.</p><button class="primary save" type="submit">Enregistrer la fiche</button></form>`;
  const changed = () => { dirty = true; $('#photo-count').textContent = photos.length; };
  await renderPhotos($('.photos'), photos, true, changed);
  $('form').oninput = () => { dirty = true; };
  $('#add-photos').onclick = () => $('#photos').click();
  $('#photos').onchange = () => safe(async () => { const files = Array.from($('#photos').files); files.forEach(checkFile); photos.push(...files); changed(); await renderPhotos($('.photos'),photos,true,changed); $('#photos').value = ''; });
  bind('#back', async () => { if (leave()) await home(); });
  $('form').onsubmit = e => { e.preventDefault(); void safe(async () => {
    const data = new FormData($('form')); const patch = {photos};
    for (const [key,,type] of fields) patch[key] = type === 'number' ? Number(String(data.get(key)).replace(',','.')) : key==='shipping' ? String(data.get(key)) : String(data.get(key)).trim();
    patch.description = String(data.get('description'));
    if (!patch.title) throw new Error('Ajoutez un titre.');
    const saved = selected === undefined ? await repo.create(patch) : await repo.update(selected,patch,{updatedAt:p.updatedAt});
    dirty = false; await preview(saved.id); status('Fiche enregistrée sur cet appareil.');
  }); };
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); status('Copié dans le presse-papiers.'); }
  catch { const box = $('#copy-fallback'); box.hidden = false; box.value = text; box.focus(); box.select(); status('Appuyez longuement sur le texte sélectionné, puis Copier.'); }
}
async function preview(id) {
  const p = await repo.get(id); if (!p) throw new Error('Fiche introuvable.');
  selected = id;
  main.innerHTML = `<button id="back">← Catalogue</button><article><small>APERÇU DE L’ANNONCE</small><h2 data-orion-user>${esc(p.title)}</h2><div class="price">${money(p.price)}</div><div class="photos"></div><p class="description" ${p.description?'data-orion-user':''}>${esc(p.description || 'Aucune description')}</p><dl>${[['Catégorie',p.category],['Marque',p.brand],['État',p.condition],['Colis',p.shipping],['Stock initial',p.initialStock],['Stock restant',remaining(p)]].map(([k,v])=>`<div><dt>${k}</dt><dd data-orion-user>${esc(v)}</dd></div>`).join('')}</dl><button id="prepare-vinted" class="primary">Préparer sur Vinted</button><div class="toolbar"><button id="edit">Modifier</button><button id="duplicate">Dupliquer</button><button id="copy">Copier l’annonce</button><button id="copy-title">Copier le titre</button><button id="copy-description">Copier la description</button></div><textarea id="copy-fallback" hidden aria-label="Texte à copier" rows="8"></textarea><h3>Photos à joindre manuellement</h3><div id="photo-downloads" class="toolbar"></div><h3>Enregistrer une vente</h3><form id="sale"><label>Quantité<input name="quantity" type="number" value="1" min="1" max="${remaining(p)}" step="1" required inputmode="numeric"></label><label>Prix unitaire (€)<input name="unitPrice" type="number" value="${p.price}" min="0" step="0.01" required inputmode="decimal"></label><button type="submit" ${remaining(p) === 0 ? 'disabled' : ''}>Confirmer la vente</button></form><h3>Historique des ventes</h3><ul class="sales">${p.sales.length ? p.sales.map(s=>`<li>${esc(new Date(s.date).toLocaleString('fr-FR'))} · ${s.quantity} × ${money(s.unitPrice)}</li>`).join('') : '<li>Aucune vente enregistrée.</li>'}</ul><button class="danger" id="delete">Supprimer cette fiche</button></article>`;
  await renderPhotos($('.photos'),p.photos);
  for (let i=0; i<p.photos.length; i++) {
    try { const a = document.createElement('a'); a.href = await photoURL(p.photos[i]); a.download = `photo-${i+1}`; a.textContent = `Photo ${i+1} ↗`; $('#photo-downloads').append(a); } catch { /* original retained */ }
  }
  bind('#prepare-vinted', async () => {const latest=await repo.get(id);if(!latest)throw new Error('Fiche introuvable.');await launchVintedTest(latest);});
  bind('#back', home); bind('#edit',async () => edit(p)); bind('#duplicate', async () => { const d = await repo.duplicate(id); await preview(d.id); status('Copie créée, historique des ventes réinitialisé.'); });
  bind('#copy',async () => copy(listingForOrion(p))); bind('#copy-title',async () => copy(p.title)); bind('#copy-description',async () => copy(p.description));
  bind('#delete', async () => { if (orionConfirm('Supprimer définitivement cette fiche et ses photos ? Exportez une sauvegarde avant de continuer.')) { await repo.remove(id); await home(); status('Fiche supprimée.'); } });
  $('#sale').onsubmit = e => { e.preventDefault(); void safe(async () => { const data = new FormData($('#sale')); await repo.sell(id,Number(data.get('quantity')),Number(data.get('unitPrice'))); await preview(id); status('Vente enregistrée, stock mis à jour.'); }); };
}
void safe(async () => { repo = new Products(await openDB()); await home(); status('Catalogue chargé. Avant la première modification V1, exportez une sauvegarde.'); });
