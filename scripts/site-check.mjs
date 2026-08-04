import fs from 'node:fs'; import path from 'node:path';
const roots=[['en','docs'],['tr','i18n/tr/docusaurus-plugin-content-docs/current']]; const errors=[];
const walk=(root)=>fs.readdirSync(root,{withFileTypes:true}).flatMap((e)=>e.isDirectory()?walk(path.join(root,e.name)):[path.join(root,e.name)]);
const sets=[];
for(const [locale,root] of roots){const files=walk(root).filter((f)=>/\.mdx?$/u.test(f));sets.push(files.map((f)=>path.relative(root,f).replaceAll(path.sep,'/')).sort());for(const file of files){const text=fs.readFileSync(file,'utf8');if(!text.startsWith('---\n')||!/^title:\s*\S+/mu.test(text)||!/^description:\s*\S+/mu.test(text))errors.push(`${locale}:${file}: frontmatter`);if((text.match(/```/gu)??[]).length%2)errors.push(`${locale}:${file}: code fence`)}}
if(JSON.stringify(sets[0])!==JSON.stringify(sets[1]))errors.push('Locale file sets differ');
const index=JSON.parse(fs.readFileSync('src/data/search-index.json','utf8')); if(index.length!==sets[0].length+sets[1].length)errors.push(`Search index count ${index.length}`);for(const entry of index){if(entry.locale==='en'&&!entry.route.startsWith('/docs'))errors.push(`English route ${entry.route}`);if(entry.locale==='tr'&&!entry.route.startsWith('/tr/docs'))errors.push(`Turkish route ${entry.route}`)}
for(const [file,w,h] of [['static/img/guildgate-social-card.png',1200,630],['static/img/favicon-32.png',32,32],['static/img/favicon-16.png',16,16]]){const b=fs.readFileSync(file);if(b.readUInt32BE(16)!==w||b.readUInt32BE(20)!==h)errors.push(`${file} size`)}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}console.log(`Site check passed: ${sets[0].length} documents × 2 locales and ${index.length} search records.`);
