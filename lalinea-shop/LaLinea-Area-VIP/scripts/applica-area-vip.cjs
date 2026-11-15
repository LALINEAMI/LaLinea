const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const pacchetto=path.resolve(__dirname,'..');
const candidati=[...new Set([process.cwd(),path.dirname(pacchetto)])].filter(p=>fs.existsSync(path.join(p,'app/vip/page.tsx'))&&fs.existsSync(path.join(p,'app/api/vip/login/route.ts')));
if(candidati.length!==1){console.error('Cartella del sito non identificata in modo univoco. Metti LaLinea-Area-VIP accanto a package.json e apri il terminale del sito.');process.exit(1);}
const root=candidati[0],page=path.join(root,'app/vip/page.tsx'),login=path.join(root,'app/api/vip/login/route.ts');
const die=m=>{console.error(m);process.exit(1);};
if(!fs.existsSync(page)||!fs.existsSync(login))die('Esegui il comando nella cartella principale del sito, accanto a package.json.');
const originale=fs.readFileSync(page,'utf8'),accesso=fs.readFileSync(login),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
if(originale.includes('LALINEA_VIP_NOVITA_V1')){console.log('Area VIP già aggiornata. Nessun file modificato.');process.exit(0);}
for(const expected of ['setCliente','setMovimenti','telefono','pin','LALINEA_CLASSIFICA_VIP_LINK_V1','/api/vip/login'])if(!originale.includes(expected))die('La pagina VIP è diversa da quella verificata: nessuna modifica applicata.');
if(!accesso.toString().includes('makeSession(cliente)')||!accesso.toString().includes('bcrypt.compare'))die('Il login è diverso da quello verificato: nessuna modifica applicata.');
let ts;try{ts=require(require.resolve('typescript',{paths:[root]}));}catch{die('TypeScript non disponibile nel progetto. Nessuna modifica applicata.');}
const files=['app/vip/VipNovita.tsx','app/api/vip/area/route.ts','lib/lalineaVipArea.ts','lib/lalineaVipTypes.ts','lib/vendor/lalinea-qrcode.js','lib/vendor/lalinea-qrcode.d.ts','lib/vendor/LICENSE-qrcode-generator.txt'];
for(const file of files){if(!fs.existsSync(path.join(pacchetto,'modelli',file+'.txt')))die('Pacchetto incompleto: '+file);if(fs.existsSync(path.join(root,file)))die('Esiste già '+file+'. Nessuna sovrascrittura automatica.');}
const marker='{/* LALINEA_CLASSIFICA_VIP_LINK_V1 */}';if(originale.split(marker).length!==2)die('Punto di inserimento non unico. Nessuna modifica.');
const aggiornato=originale.replace('import { useState } from "react";', 'import { useState } from "react";\nimport VipNovita from "./VipNovita";').replace(marker,'{/* LALINEA_VIP_NOVITA_V1 */}\n          <VipNovita telefono={telefono} pin={pin} onAggiornamento={(dati) => { setCliente(dati.cliente); setMovimenti(dati.movimenti); }} />\n\n          '+marker);
if(!aggiornato.includes('import VipNovita'))die('Import React diverso da quello verificato. Nessuna modifica.');
for(const [file,source] of [['app/vip/page.tsx',aggiornato],...files.filter(f=>f.endsWith('.ts')||f.endsWith('.tsx')).map(f=>[f,fs.readFileSync(path.join(pacchetto,'modelli',f+'.txt'),'utf8')])]){
 const parsed=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);if(parsed.parseDiagnostics.length)die('Errore di sintassi in '+file+'. Nessuna modifica applicata.');
}
const backup=page+'.prima-area-vip';if(fs.existsSync(backup))die('Esiste già il backup '+backup+'. Verifica prima i file.');
fs.writeFileSync(backup,originale,{flag:'wx'});const created=[];
try{for(const file of files){const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(pacchetto,'modelli',file+'.txt'),target,fs.constants.COPYFILE_EXCL);created.push(target);}fs.writeFileSync(page,aggiornato);if(hash(fs.readFileSync(login))!==hash(accesso))throw Error('Il login è cambiato durante l’installazione.');}
catch(e){fs.writeFileSync(page,originale);for(const file of created.reverse())fs.unlinkSync(file);throw e;}
console.log('Installata solo la sezione VIP: storico ordini e tessera QR. Login, checkout e carrello invariati.');
console.log('Esegui npm run build, controlla git diff e configura LALINEA_VIP_PORTAL_KEY su Vercel. Il comando non pubblica il sito.');
