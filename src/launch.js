// Browser-owned navigation; a returned tab handle is never proof of a loaded form.
export const LAUNCH_ACK_KEY='orion-express-launch-ack-3.2.4';
export function vintedLaunchURL(nonce){
 if(typeof nonce!=='string'||!nonce||nonce.length>160)throw new Error('Identifiant de transfert invalide.');
 return 'https://www.vinted.es/items/new#orion='+encodeURIComponent(nonce);
}
export function orionLaunchURL(url){
 const target=new URL(url);
 if(target.protocol!=='https:'||target.username||target.password||!((target.origin==='https://example.com'&&target.pathname==='/')||(target.origin==='https://www.vinted.es'&&target.pathname==='/items/new')))throw new Error('Destination Orion non reconnue.');
 return 'orion://open-url?url='+encodeURIComponent(target.href);
}
export function openVintedBrowserTab(nonce){
 if(typeof GM_openInTab!=='function')throw new Error('Ouverture par extension indisponible. Utilisez Ouvrir avec Orion.');
 return GM_openInTab(vintedLaunchURL(nonce),{active:true,insert:true});
}
export async function acknowledgeVintedLaunch(nonce,state){
 if(!nonce || !['ready','complete','partial','error'].includes(state))return;
 await GM_setValue(LAUNCH_ACK_KEY+'-'+nonce,JSON.stringify({nonce,state,at:Date.now()}));
}
export async function readVintedLaunchAck(nonce,since){
 try{const ack=JSON.parse(await GM_getValue(LAUNCH_ACK_KEY+'-'+nonce,''));return ack&&Number.isFinite(ack.at)&&ack.nonce===nonce&&ack.at>=since&&ack.at<=Date.now()+5000&&['ready','complete','partial','error'].includes(ack.state)?ack:null;}catch{return null;}
}
