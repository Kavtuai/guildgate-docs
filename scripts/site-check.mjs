import fs from 'node:fs';
import path from 'node:path';

const docsRoot = path.resolve('docs');
const errors = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const docFiles = walk(docsRoot).filter((file) => file.endsWith('.md') || file.endsWith('.mdx'));
const routes = new Set(['/']);

for (const file of docFiles) {
  const relative = path.relative(docsRoot, file).replaceAll(path.sep, '/').replace(/\.mdx?$/u, '');
  const text = fs.readFileSync(file, 'utf8');

  if (!text.startsWith('---\n') || text.indexOf('\n---\n', 4) === -1) {
    errors.push(`${path.relative('.', file)}: ön bilgi bloğu eksik veya bozuk`);
  }
  if ((text.match(/```/gu) ?? []).length % 2 !== 0) {
    errors.push(`${path.relative('.', file)}: kapanmamış kod çiti`);
  }

  const levels = [...text.matchAll(/^(#{1,6})\s+/gmu)].map((match) => match[1].length);
  for (let index = 1; index < levels.length; index += 1) {
    if (levels[index] > levels[index - 1] + 1) {
      errors.push(`${path.relative('.', file)}: başlık seviyesi ${levels[index - 1]}'den ${levels[index]}'e atlıyor`);
    }
  }

  const slug = text.match(/^slug:\s*(\S+)\s*$/mu)?.[1];
  routes.add(`/docs${slug?.startsWith('/') ? slug : `/${slug ?? relative}`}`.replace(/\/$/u, ''));
}

const linkFiles = [
  ...docFiles,
  ...walk(path.resolve('src')).filter((file) => /\.(?:js|jsx)$/u.test(file)),
];

for (const file of linkFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const matches = [
    ...text.matchAll(/(?:to|href)=["']([^"']+)["']/gu),
    ...text.matchAll(/\]\((\/[^)#\s]+)(?:#[^)]+)?\)/gu),
  ];

  for (const match of matches) {
    const target = match[1]?.replace(/\/$/u, '');
    if (target?.startsWith('/docs/') && !routes.has(target)) {
      errors.push(`${path.relative('.', file)}: bulunamayan iç bağlantı ${target}`);
    }
  }
}

const sidebars = fs.readFileSync('sidebars.js', 'utf8');
for (const match of sidebars.matchAll(/'([a-z0-9ğüşöçıİ/-]+)'/giu)) {
  const id = match[1];
  if (!id.includes('/') && !['giris', 'sorun-giderme'].includes(id)) continue;
  if (!fs.existsSync(path.join(docsRoot, `${id}.mdx`)) && !fs.existsSync(path.join(docsRoot, `${id}.md`))) {
    errors.push(`sidebars.js: bulunamayan belge ${id}`);
  }
}

const png = fs.readFileSync('static/img/guildgate-social-card.png');
const pngSignature = '89504e470d0a1a0a';
if (png.subarray(0, 8).toString('hex') !== pngSignature) {
  errors.push('Sosyal paylaşım görseli geçerli bir PNG değil.');
} else {
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  if (width !== 1200 || height !== 630) {
    errors.push(`Sosyal paylaşım görseli 1200x630 değil: ${width}x${height}`);
  }
}

if (errors.length > 0) {
  console.error('Site kontrolü başarısız:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Site kontrolü tamam: ${docFiles.length} belge, ${routes.size - 1} rota.`);
