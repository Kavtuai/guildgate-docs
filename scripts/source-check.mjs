import fs from 'node:fs';
import path from 'node:path';

const required = [
  'package.json',
  'docusaurus.config.js',
  'sidebars.js',
  'docs/giris.mdx',
  'docs/araclar/komut-laboratuvari.mdx',
  'docs/baslangic/kurulum.mdx',
  'docs/referans/public-api.mdx',
  'src/components/CommandPlayground/index.js',
  'src/lib/command-engine.mjs',
  'src/theme/Root.js',
  '.github/workflows/deploy-pages.yml',
  'static/img/guildgate-mark.svg',
  'static/img/guildgate-social-card.png',
];

const errors = [];
for (const file of required) {
  if (!fs.existsSync(file)) errors.push(`Eksik dosya: ${file}`);
}

for (const removed of ['README.md', 'EDITORIAL_GUIDE.md']) {
  if (fs.existsSync(removed)) errors.push(`Kaldırılması gereken dosya hâlâ mevcut: ${removed}`);
}

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (!packageJson.dependencies?.['bootstrap-icons']) errors.push('Bootstrap Icons bağımlılığı eksik.');
if (packageJson.version !== '0.2.0') errors.push('Dokümantasyon sürümü 0.2.0 değil.');

const config = fs.readFileSync('docusaurus.config.js', 'utf8');
if (!config.includes('#3262a8')) errors.push('Ana renk #3262a8 değil.');
if (!config.includes('guildgate.js.org')) errors.push('js.org adresi yapılandırılmamış.');
if (!config.includes('/docs/araclar/komut-laboratuvari')) errors.push('Komut laboratuvarı menüye eklenmemiş.');

const root = fs.readFileSync('src/theme/Root.js', 'utf8');
if (!root.includes('bootstrap-icons/font/bootstrap-icons.css')) errors.push('Bootstrap Icons yerel olarak yüklenmiyor.');

const commandEngine = fs.readFileSync('src/lib/command-engine.mjs', 'utf8');
for (const forbidden of ['eval(', 'new Function', 'child_process', 'execFile(', 'execSync(', 'spawn(', 'fetch(', 'WebSocket(', 'dangerouslySetInnerHTML']) {
  if (commandEngine.includes(forbidden)) errors.push(`Komut motorunda yasak kullanım bulundu: ${forbidden}`);
}

const playground = fs.readFileSync('src/components/CommandPlayground/index.js', 'utf8');
for (const forbidden of ['dangerouslySetInnerHTML', 'eval(', 'new Function', 'fetch(', 'WebSocket(']) {
  if (playground.includes(forbidden)) errors.push(`Komut bileşeninde yasak kullanım bulundu: ${forbidden}`);
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

for (const file of walk('.')) {
  const relative = path.relative('.', file).replaceAll(path.sep, '/');
  if (relative.startsWith('node_modules/') || relative.startsWith('build/') || relative.startsWith('.git/') || relative.startsWith('.docusaurus/')) continue;
  if (fs.statSync(file).size === 0 && relative !== 'static/.nojekyll') {
    errors.push(`Gereksiz boş dosya: ${relative}`);
  }
}

for (const file of walk('docs')) {
  const text = fs.readFileSync(file, 'utf8');
  if (/example\.com\/TODO|TODO_CONTENT|LOREM IPSUM/iu.test(text)) {
    errors.push(`Placeholder bulundu: ${file}`);
  }
}

if (errors.length) {
  console.error('Kaynak kontrolü başarısız:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Kaynak kontrolü tamam.');
