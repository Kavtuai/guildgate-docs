import fs from 'node:fs';
import path from 'node:path';

const required = [
  'package.json',
  'docusaurus.config.js',
  'sidebars.js',
  'docs/giris.mdx',
  'docs/baslangic/kurulum.mdx',
  'docs/referans/public-api.mdx',
  '.github/workflows/deploy-pages.yml',
  'static/img/guildgate-mark.svg',
  'static/img/guildgate-social-card.png',
];

const errors = [];
for (const file of required) {
  if (!fs.existsSync(file)) errors.push(`Eksik dosya: ${file}`);
}

const config = fs.readFileSync('docusaurus.config.js', 'utf8');
if (!config.includes('#3262a8')) errors.push('Ana renk #3262a8 değil.');
if (!config.includes('guildgate.js.org')) errors.push('js.org adresi yapılandırılmamış.');

function walk(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

for (const file of walk('docs')) {
  const text = fs.readFileSync(file, 'utf8');
  if (/example\.com\/TODO|LOREM IPSUM|TODO_CONTENT/iu.test(text)) {
    errors.push(`Placeholder bulundu: ${file}`);
  }
}

if (errors.length) {
  console.error('Kaynak kontrolü başarısız:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Kaynak kontrolü tamam.');
