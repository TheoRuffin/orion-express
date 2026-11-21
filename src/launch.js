// Browser-owned navigation; a returned tab handle is never proof of a loaded form.
export const LAUNCH_ACK_KEY='orion-express-launch-ack-3.2.4';
export function vintedLaunchURL(nonce){
 if(typeof nonce!=='string'||!nonce||nonce.length>160)throw new Error('Identifiant de transfert invalide.');
 return 'https://www.vinted.es/items/new#orion='+encodeURIComponent(nonce);
}
export function navigateVintedInCurrentTab(nonce){
 const url=vintedLaunchURL(nonce);
 window.location.assign(url);
}
export async function acknowledgeVintedLaunch(nonce,state){
 if(!nonce || !['ready','complete','partial','error'].includes(state))return;
 await GM_setValue(LAUNCH_ACK_KEY+'-'+nonce,JSON.stringify({nonce,state,at:Date.now()}));
}
export async function readVintedLaunchAck(nonce,since){
 try{const ack=JSON.parse(await GM_getValue(LAUNCH_ACK_KEY+'-'+nonce,''));return ack&&Number.isFinite(ack.at)&&ack.nonce===nonce&&ack.at>=since&&ack.at<=Date.now()+5000&&['ready','complete','partial','error'].includes(ack.state)?ack:null;}catch{return null;}
}
