import fs from 'node:fs';
import path from 'node:path';

const locales = [
  {name: 'tr', root: path.resolve('docs')},
  {name: 'en', root: path.resolve('i18n/en/docusaurus-plugin-content-docs/current')},
];
const errors = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function inspectLocale({name, root}) {
  const docFiles = walk(root).filter((file) => /\.mdx?$/u.test(file));
  const routes = new Set(['/']);

  for (const file of docFiles) {
    const relative = path.relative(root, file).replaceAll(path.sep, '/').replace(/\.mdx?$/u, '');
    const text = fs.readFileSync(file, 'utf8');

    if (!text.startsWith('---\n') || text.indexOf('\n---\n', 4) === -1) {
      errors.push(`${name}/${relative}: ön bilgi bloğu eksik veya bozuk`);
    }
    if (!/^title:\s*\S+/mu.test(text) || !/^description:\s*\S+/mu.test(text)) {
      errors.push(`${name}/${relative}: title veya description eksik`);
    }
    if ((text.match(/```/gu) ?? []).length % 2 !== 0) {
      errors.push(`${name}/${relative}: kapanmamış kod çiti`);
    }

    const levels = [...text.matchAll(/^(#{1,6})\s+/gmu)].map((match) => match[1].length);
    for (let index = 1; index < levels.length; index += 1) {
      if (levels[index] > levels[index - 1] + 1) {
        errors.push(`${name}/${relative}: başlık seviyesi ${levels[index - 1]}'den ${levels[index]}'e atlıyor`);
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
      ...text.matchAll(/\]\((\.\.?\/[^)#\s]+)(?:#[^)]+)?\)/gu),
    ];

    for (const match of matches) {
      const target = match[1];
      if (!target) continue;
      if (target.startsWith('/docs/')) {
        const clean = target.replace(/\/$/u, '');
        if (!routes.has(clean)) errors.push(`${name}/${path.relative(root, file)}: bulunamayan iç bağlantı ${clean}`);
      } else if (target.startsWith('.')) {
        const resolved = path.resolve(path.dirname(file), target);
        const candidates = [resolved, `${resolved}.md`, `${resolved}.mdx`, path.join(resolved, 'index.md'), path.join(resolved, 'index.mdx')];
        if (!candidates.some((candidate) => fs.existsSync(candidate))) {
          errors.push(`${name}/${path.relative(root, file)}: bulunamayan göreli bağlantı ${target}`);
        }
      }
    }
  }

  return {docFiles, routes};
}

const results = locales.map(inspectLocale);
const trIds = results[0].docFiles.map((file) => path.relative(locales[0].root, file).replaceAll(path.sep, '/')).sort();
const enIds = results[1].docFiles.map((file) => path.relative(locales[1].root, file).replaceAll(path.sep, '/')).sort();
if (JSON.stringify(trIds) !== JSON.stringify(enIds)) errors.push('Dil belge kimlikleri birebir eşleşmiyor.');

const sidebars = fs.readFileSync('sidebars.js', 'utf8');
for (const match of sidebars.matchAll(/'([a-z0-9ğüşöçıİ/-]+)'/giu)) {
  const id = match[1];
  if (!id.includes('/') && !['giris', 'sorun-giderme', 'surum-notlari'].includes(id)) continue;
  for (const locale of locales) {
    if (!fs.existsSync(path.join(locale.root, `${id}.mdx`)) && !fs.existsSync(path.join(locale.root, `${id}.md`))) {
      errors.push(`sidebars.js: ${locale.name} dilinde belge yok: ${id}`);
    }
  }
}

function inspectPng(file, expectedWidth, expectedHeight) {
  if (!fs.existsSync(file)) {
    errors.push(`Görsel bulunamadı: ${file}`);
    return;
  }
  const png = fs.readFileSync(file);
  if (png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    errors.push(`${file}: geçerli PNG değil`);
    return;
  }
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  if (width !== expectedWidth || height !== expectedHeight) {
    errors.push(`${file}: ${expectedWidth}x${expectedHeight} bekleniyordu, ${width}x${height} bulundu`);
  }
}

inspectPng('static/img/guildgate-social-card.png', 1200, 630);
inspectPng('static/img/favicon-32.png', 32, 32);
inspectPng('static/img/favicon-16.png', 16, 16);
inspectPng('static/img/apple-touch-icon.png', 180, 180);
inspectPng('static/img/icon-192.png', 192, 192);
inspectPng('static/img/icon-512.png', 512, 512);

if (errors.length > 0) {
  console.error('Site kontrolü başarısız:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Site kontrolü tamam: ${trIds.length} belge × 2 dil, sosyal kart ve favicon seti doğrulandı.`);
