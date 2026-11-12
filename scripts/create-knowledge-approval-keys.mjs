#!/usr/bin/env node
/* Run on a trusted operator machine, not in an ordinary public CI job.
 * The private key is written ONLY into the gitignored .aura_private folder.
 * No private key content is printed, uploaded or added to git.
 */
import fs from 'node:fs';
import path from 'node:path';
import {generateKeyPairSync,createHash} from 'node:crypto';
const base=path.resolve('.aura_private/knowledge-approval');
if(fs.existsSync(path.join(base,'p256-private.pem')))throw Error('Private key already exists: refusing overwrite');
fs.mkdirSync(base,{recursive:true,mode:0o700});
const {publicKey,privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1',
 publicKeyEncoding:{type:'spki',format:'der'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
const keyPath=path.join(base,'p256-private.pem');
fs.writeFileSync(keyPath,privateKey,{mode:0o600,flag:'wx'});
const kid=createHash('sha256').update(publicKey).digest('hex').slice(0,24);
const publicRecord={
 schemaVersion:1,kind:'aura_knowledge_release_public_trust_v1',
 activeKeyId:kid,publicKeys:[{kid,spkiBase64:publicKey.toString('base64')}],
 setupRequired:false
};
const trustPath=path.join(base,'trust-public.json');
fs.writeFileSync(trustPath,JSON.stringify(publicRecord,null,2)+'\n',{mode:0o600,flag:'wx'});
console.log('CREATED private key at .aura_private/knowledge-approval/p256-private.pem');
console.log('CREATED public record at .aura_private/knowledge-approval/trust-public.json');
console.log('Fingerprint (safe to share): '+kid);
console.log('Operator: add private PEM as GitHub Environment secret AURA_KNOWLEDGE_P256_PRIVATE_KEY_PEM.');
console.log('Operator: commit ONLY the PUBLIC trust JSON at aura_data/approved_knowledge/trust.json.');
console.log('Never paste, upload, commit, or send the private PEM through the repository or chat.');
