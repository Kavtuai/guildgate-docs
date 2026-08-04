import fs from 'node:fs'; import path from 'node:path';
const required=['package.json','docusaurus.config.js','docs/giris.mdx','i18n/tr/docusaurus-plugin-content-docs/current/giris.mdx','src/lib/command-engine.mjs','src/data/release-metadata.mjs','scripts/build-search-index.mjs','.github/workflows/deploy-pages.yml'];
const errors=[]; for(const file of required) if(!fs.existsSync(file)) errors.push(`Missing file: ${file}`);
const engine=fs.readFileSync('src/lib/command-engine.mjs','utf8');
for(const token of ['eval(', 'new Function', 'child_process', 'fetch(', 'WebSocket(', 'localStorage', 'sessionStorage', 'indexedDB']) if(engine.includes(token)) errors.push(`Console engine uses forbidden token: ${token}`);
for(const file of ['docs/katki/yazi-standardi.mdx','docs/surum-notlari.mdx','i18n/tr/docusaurus-plugin-content-docs/current/katki/yazi-standardi.mdx','i18n/tr/docusaurus-plugin-content-docs/current/surum-notlari.mdx']) {const text=fs.readFileSync(file,'utf8'); if(/AI writing|AI yaz|yapay zek[âa]|author detection|writer detection/iu.test(text)) errors.push(`${file}: unrelated writing-detection text`)}
const pkg=JSON.parse(fs.readFileSync('package.json','utf8')); if(pkg.version!=='0.4.0') errors.push('Docs version is not 0.4.0');
if(errors.length){console.error(errors.join('\n'));process.exit(1)} console.log('Source check passed: required files, console boundary, writing standard and release pages.');
