import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../public');
const files=await readdir(root,{recursive:true});
assert.ok(!files.some(f=>/(^|\/)(preview-|tests|\.env|\.runtime)|\.(sqlite|db|md|pdf|tar|zip)$/.test(f)));
assert.equal(files.filter(f=>f.startsWith('assets/approved/style-covers/')&&f.endsWith('.png')).length,36);
assert.equal(files.filter(f=>f.startsWith('assets/inky-motion/')&&f.endsWith('-sheet.webp')).length,6);
const index=await readFile(path.join(root,'index.html'),'utf8');
for(const m of index.matchAll(/(?:src|href)="([^"#?]+)(?:\?[^"#]*)?"/g)){
 if(!m[1].includes(':'))assert.ok((await stat(path.join(root,m[1]))).isFile(),m[1]);
}
assert.match(await readFile(path.join(root,'checkout-config.js'),'utf8'),/enabled:false/);
for(const file of files.filter(f=>/\.(js|html|css)$/.test(f))){
 assert.doesNotMatch(await readFile(path.join(root,file),'utf8'),/(?:sk|rk)_(?:test|live)_[A-Za-z0-9]{12,}|whsec_[A-Za-z0-9]{12,}|\/Users\//,file);
}
console.log('Verified 36 covers, six animated Inkys, entry references, disabled Checkout and no private files/secrets.');
