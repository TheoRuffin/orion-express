import { normalize, remaining, photoURL } from './core.js';
// Independent local workspace: never opens or modifies the product database.
export const VINTED_NEW = 'https://www.vinted.es/items/new';
export const PREP_FIELDS = [['title','Titre / Título'],['description','Description / Descripción'],['price','Prix / Precio'],['category','Catégorie / Categoría'],['brand','Marque / Marca'],['condition','État / Estado'],['shipping','Colis / Tamaño del paquete']];
export function prepareProduct(raw) {
  const p = normalize(raw);
  if (!p.title.trim() || !p.description.trim() || p.price <= 0 || !p.photos.length || remaining(p) < 1) throw new Error('Ajoutez un titre, une description, un prix positif, au moins une photo et du stock avant de préparer.');
  const fields = Object.fromEntries(PREP_FIELDS.map(([key]) => [key,key === 'price' ? p.price.toFixed(2).replace('.',',') : p[key]]));
  return {id:'active', version:1, sourceId:p.id, createdAt:new Date().toISOString(), fields, photos:structuredClone(p.photos), checked:{}, categoryChecked:false};
}
export function checkPreparation(p, key, checked) {
  if (![...PREP_FIELDS.map(([k])=>k),'photos','dynamic','review'].includes(key)) throw new Error('Étape inconnue.');
  const next = structuredClone(p); next.checked[key] = checked;
  if (key === 'category') { next.checked.dynamic=false; next.checked.brand=false; next.checked.condition=false; next.checked.shipping=false; next.checked.review=false; }
  if (key !== 'review') next.checked.review=false;
  return next;
}
export function prepStore() {
  return new Promise((resolve,reject) => {
    const q=indexedDB.open('orion-express-preparations',1);
    q.onupgradeneeded=()=>q.result.createObjectStore('workspace',{keyPath:'id'});
    q.onerror=()=>reject(q.error); q.onblocked=()=>reject(new Error('Fermez les autres onglets Orion Express puis réessayez.'));
    q.onsuccess=()=>{ const db=q.result; db.onversionchange=()=>db.close(); resolve({
      run(mode,op) { return new Promise((yes,no)=>{let value;const tx=db.transaction('workspace',mode);tx.oncomplete=()=>yes(value);tx.onabort=()=>no(tx.error || new Error('Préparation non enregistrée.'));tx.onerror=()=>{}; const req=op(tx.objectStore('workspace')); if(req) req.onsuccess=()=>{value=req.result;};}); },
      async get(){return this.run('readonly',s=>s.get('active'));},
      async put(p){await this.run('readwrite',s=>s.put(p));},
      async clear(){await this.run('readwrite',s=>s.delete('active'));},
      close(){db.close();}
    });};
  });
}
export async function preparedFiles(p) {
  const files=[];
  for(let i=0;i<p.photos.length;i++) {
    const url=await photoURL(p.photos[i]);
    const match=/^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i.exec(url);
    if(!match) throw new Error(`Photo ${i+1} non réutilisable. Original conservé ; remplacez-la dans la fiche.`);
    const bytes=Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0));
    if(!bytes.length) throw new Error(`Photo ${i+1} vide.`);
    const type=match[1].toLowerCase(); const ext=type.split('/')[1].replace('jpeg','jpg');
    files.push(new File([bytes],`orion-photo-${String(i+1).padStart(2,'0')}.${ext}`,{type}));
  }
  return files;
}
// ZIP STORE with CRC32, UTF-8 names, no dependency and no remote service.
export async function photoArchive(files, fields) {
  const text=PREP_FIELDS.map(([k,label])=>`${label} :\n${fields[k] || 'À choisir dans Vinted'}`).join('\n\n');
  const all=[...files,new File([text],'annonce.txt',{type:'text/plain'})], chunks=[],central=[];
  let offset=0;
  for(const f of all) {
    const data=new Uint8Array(await f.arrayBuffer()),name=new TextEncoder().encode(f.name);
    let crc=0xffffffff;
    for(const byte of data){crc^=byte;for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
    crc=(crc^0xffffffff)>>>0;
    const header=new Uint8Array(30+name.length), h=new DataView(header.buffer);
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint16(12,33,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,name.length,true);header.set(name,30);
    const entry=new Uint8Array(46+name.length),c=new DataView(entry.buffer);
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint16(14,33,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);entry.set(name,46);
    chunks.push(header,data);central.push(entry);offset+=header.length+data.length;
  }
  const size=central.reduce((n,b)=>n+b.length,0),end=new Uint8Array(22),e=new DataView(end.buffer);
  e.setUint32(0,0x06054b50,true);e.setUint16(8,all.length,true);e.setUint16(10,all.length,true);e.setUint32(12,size,true);e.setUint32(16,offset,true);
  return new File([...chunks,...central,end],'orion-vinted-photos.zip',{type:'application/zip'});
}
