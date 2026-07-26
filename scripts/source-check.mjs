import fs from 'node:fs';
import path from 'node:path';

const englishDocsRoot = 'i18n/en/docusaurus-plugin-content-docs/current';
const required = [
  'package.json',
  'docusaurus.config.js',
  'sidebars.js',
  'docs/giris.mdx',
  'docs/araclar/dogrulama-konsolu.mdx',
  'docs/baslangic/kurulum.mdx',
  'docs/referans/public-api.mdx',
  `${englishDocsRoot}/giris.mdx`,
  `${englishDocsRoot}/araclar/dogrulama-konsolu.mdx`,
  `${englishDocsRoot}/referans/public-api.mdx`,
  'src/components/CommandPlayground/index.js',
  'src/components/CommandPlayground/styles.module.css',
  'src/components/DocSearch/index.js',
  'src/components/DocSearch/styles.module.css',
  'src/data/search-index.json',
  'scripts/build-search-index.mjs',
  'src/lib/command-engine.mjs',
  'src/theme/Root.js',
  '.github/workflows/deploy-pages.yml',
  'static/img/favicon.png',
  'static/img/favicon-16.png',
  'static/img/favicon-32.png',
  'static/img/apple-touch-icon.png',
  'static/img/guildgate-mark.png',
  'static/img/guildgate-social-card.png',
];

const errors = [];
for (const file of required) {
  if (!fs.existsSync(file)) errors.push(`Eksik dosya: ${file}`);
}

for (const removed of [
  'README.md',
  'EDITORIAL_GUIDE.md',
  'docs/araclar/komut-laboratuvari.mdx',
  'docs/istek-katmani/fastify-express.mdx',
  'docs/uretim/github-pages-jsorg.mdx',
  'static/img/guildgate-mark.svg',
  'static/img/favicon.svg',
]) {
  if (fs.existsSync(removed)) errors.push(`Kaldırılması gereken dosya hâlâ mevcut: ${removed}`);
}

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (!packageJson.dependencies?.['bootstrap-icons']) errors.push('Bootstrap Icons bağımlılığı eksik.');
if (packageJson.version !== '0.3.1') errors.push('Dokümantasyon sürümü 0.3.1 değil.');
if (!String(packageJson.engines?.node ?? '').includes('22')) errors.push('Node.js 22 motor şartı eksik.');

const config = fs.readFileSync('docusaurus.config.js', 'utf8');
for (const expected of [
  '#3262a8',
  'guildgate.js.org',
  "locales: ['tr', 'en']",
  '/docs/araclar/dogrulama-konsolu',
  'img/favicon.png',
  'img/guildgate-social-card.png',
  'https://mxyouone.me/contact?category=website&website=GuildGate',
]) {
  if (!config.includes(expected)) errors.push(`Docusaurus yapılandırmasında beklenen değer yok: ${expected}`);
}

const root = fs.readFileSync('src/theme/Root.js', 'utf8');
if (!root.includes('bootstrap-icons/font/bootstrap-icons.css')) errors.push('Bootstrap Icons yerel olarak yüklenmiyor.');
if (!root.includes('DocSearch')) errors.push('Genel doküman araması Root bileşenine bağlanmamış.');

const commandEngine = fs.readFileSync('src/lib/command-engine.mjs', 'utf8');
for (const forbidden of ['eval(', 'new Function', 'child_process', 'execFile(', 'execSync(', 'spawn(', 'fetch(', 'WebSocket(', 'dangerouslySetInnerHTML']) {
  if (commandEngine.includes(forbidden)) errors.push(`Komut motorunda yasak kullanım bulundu: ${forbidden}`);
}


const searchComponent = fs.readFileSync('src/components/DocSearch/index.js', 'utf8');
for (const forbidden of ['dangerouslySetInnerHTML', 'eval(', 'new Function', 'fetch(', 'XMLHttpRequest', 'WebSocket(', 'localStorage', 'sessionStorage']) {
  if (searchComponent.includes(forbidden)) errors.push(`Arama bileşeninde yasak kullanım bulundu: ${forbidden}`);
}
if (!searchComponent.includes("event.key.toLowerCase() === 'k'")) errors.push('Ctrl+K arama kısayolu eksik.');
if (!searchComponent.includes("language === 'all'")) errors.push('Arama dil filtresi eksik.');
const searchStyles = fs.readFileSync('src/components/DocSearch/styles.module.css', 'utf8');
if (!searchStyles.includes('left:50%') || !searchStyles.includes('translateX(-50%)')) errors.push('Header arama düğmesi ortalanmamış.');

const playground = fs.readFileSync('src/components/CommandPlayground/index.js', 'utf8');
for (const forbidden of ['dangerouslySetInnerHTML', 'eval(', 'new Function', 'fetch(', 'WebSocket(', 'localStorage', 'sessionStorage']) {
  if (playground.includes(forbidden)) errors.push(`Komut bileşeninde yasak kullanım bulundu: ${forbidden}`);
}
if (/Tarayıcıda güvenli|Safe in your browser/u.test(playground)) errors.push('Kaldırılan konsol rozeti yeniden eklenmiş.');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

for (const file of walk('.')) {
  const relative = path.relative('.', file).replaceAll(path.sep, '/');
  if (/^(?:node_modules|build|\.git|\.docusaurus)\//u.test(relative)) continue;
  if (fs.statSync(file).size === 0 && relative !== 'static/.nojekyll') {
    errors.push(`Gereksiz boş dosya: ${relative}`);
  }
}

const textRoots = ['docs', englishDocsRoot, 'src', '.github'];
const textExtensions = new Set(['.md', '.mdx', '.js', '.jsx', '.css', '.yml', '.yaml', '.json']);
const bannedVisibleResidue = [
  ['eski konsol etiketi', /yerel simülasyon|local simulation/iu],
  ['geçici içerik', /example\.com\/TODO|TODO_CONTENT|LOREM IPSUM|<link>/iu],
  ['model aracı artığı', /contentReference|oaicite|oai_citation|turn\d+(?:search|view|fetch|file)\d+/iu],
];

const residueReferencePages = new Set([
  path.normalize('docs/cli/writing-check.mdx'),
  path.normalize(`${englishDocsRoot}/cli/writing-check.mdx`),
]);

for (const rootDir of textRoots) {
  for (const file of walk(rootDir)) {
    if (!textExtensions.has(path.extname(file)) || residueReferencePages.has(path.normalize(file)) || path.normalize(file) === path.normalize('src/data/search-index.json')) continue;
    const text = fs.readFileSync(file, 'utf8');
    for (const [label, pattern] of bannedVisibleResidue) {
      if (pattern.test(text)) errors.push(`${file}: ${label}`);
    }
  }
}

const trDocs = walk('docs').filter((file) => /\.mdx?$/u.test(file)).map((file) => path.relative('docs', file).replaceAll(path.sep, '/')).sort();
const enDocs = walk(englishDocsRoot).filter((file) => /\.mdx?$/u.test(file)).map((file) => path.relative(englishDocsRoot, file).replaceAll(path.sep, '/')).sort();
if (JSON.stringify(trDocs) !== JSON.stringify(enDocs)) {
  errors.push(`Türkçe ve İngilizce belge kümeleri eşit değil: TR ${trDocs.length}, EN ${enDocs.length}`);
}

if (errors.length) {
  console.error('Kaynak kontrolü başarısız:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Kaynak kontrolü tamam: ${trDocs.length} Türkçe ve ${enDocs.length} İngilizce belge.`);
