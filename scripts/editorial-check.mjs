import fs from 'node:fs'; import path from 'node:path';
const roots=['docs','i18n/tr/docusaurus-plugin-content-docs/current','src'];
const patterns=[/here(?:'s| is) what you asked for/giu,/in conclusion/giu,/revolutionary|seamless|next-generation/giu,/turn\d+(?:search|view|fetch|file)\d+/giu,/contentReference|oaicite|oai_citation/giu,/TODO_CONTENT|LOREM IPSUM/gu];
const failures=[]; for(const file of roots.flatMap(walk).filter((f)=>/\.(?:mdx?|jsx?|mjs|css)$/u.test(f))){const text=fs.readFileSync(file,'utf8');for(const pattern of patterns){pattern.lastIndex=0;if(pattern.test(text))failures.push(file)}}
if(failures.length){console.error([...new Set(failures)].join('\n'));process.exit(1)} console.log(`Editorial check passed: ${roots.flatMap(walk).length} source files inspected.`);
function walk(root){return fs.readdirSync(root,{withFileTypes:true}).flatMap((e)=>{const full=path.join(root,e.name);return e.isDirectory()?walk(full):[full]})}
