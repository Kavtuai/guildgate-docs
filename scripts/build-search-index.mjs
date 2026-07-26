import fs from 'node:fs';
import path from 'node:path';

const targets = [
  {locale: 'tr', root: path.resolve('docs'), routePrefix: '/docs'},
  {locale: 'en', root: path.resolve('i18n/en/docusaurus-plugin-content-docs/current'), routePrefix: '/en/docs'},
];

const categoryLabels = {
  tr: {
    araclar: 'Araçlar',
    baslangic: 'Başlangıç',
    cli: 'CLI',
    dayaniklilik: 'Dayanıklılık',
    depolama: 'Depolama',
    'gercek-zamanli': 'Gerçek zamanlı erişim',
    'istek-katmani': 'İstek katmanı',
    katki: 'Katkı',
    kimlik: 'Kimlik ve oturum',
    mimari: 'Mimari ve güvenlik',
    referans: 'Referans',
    uretim: 'Üretim',
  },
  en: {
    araclar: 'Tools',
    baslangic: 'Getting started',
    cli: 'CLI',
    dayaniklilik: 'Resilience',
    depolama: 'Storage',
    'gercek-zamanli': 'Realtime access',
    'istek-katmani': 'Request layer',
    katki: 'Contribution',
    kimlik: 'Identity and sessions',
    mimari: 'Architecture and security',
    referans: 'Reference',
    uretim: 'Production',
  },
};

function walk(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function unquote(value = '') {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function readFrontmatter(source) {
  if (!source.startsWith('---\n')) return {body: source, data: {}};
  const end = source.indexOf('\n---\n', 4);
  if (end === -1) return {body: source, data: {}};
  const block = source.slice(4, end);
  const data = {};
  for (const line of block.split(/\r?\n/u)) {
    const match = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/u);
    if (match) data[match[1]] = unquote(match[2]);
  }
  return {body: source.slice(end + 5), data};
}

function cleanMarkdown(source) {
  return source
    .replace(/^import\s.+$/gmu, ' ')
    .replace(/^export\s.+$/gmu, ' ')
    .replace(/```[\s\S]*?```/gu, ' ')
    .replace(/`([^`]+)`/gu, '$1')
    .replace(/<[^>]+>/gu, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/gu, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, '$1')
    .replace(/^#{1,6}\s+/gmu, '')
    .replace(/[>*_|~]/gu, ' ')
    .replace(/\{[^{}]*\}/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

const entries = [];

for (const target of targets) {
  const files = walk(target.root).filter((file) => /\.mdx?$/u.test(file)).sort();
  for (const file of files) {
    const relative = path.relative(target.root, file).replaceAll(path.sep, '/').replace(/\.mdx?$/u, '');
    const source = fs.readFileSync(file, 'utf8');
    const {body, data} = readFrontmatter(source);
    const headings = [...body.matchAll(/^#{2,3}\s+(.+)$/gmu)].map((match) => cleanMarkdown(match[1])).filter(Boolean);
    const title = data.title || cleanMarkdown(body.match(/^#\s+(.+)$/mu)?.[1] ?? relative.split('/').at(-1));
    const description = data.description || cleanMarkdown(body).slice(0, 220);
    const slug = data.slug?.startsWith('/') ? data.slug : `/${data.slug || relative}`;
    const sectionKey = relative.includes('/') ? relative.split('/')[0] : 'referans';
    const category = categoryLabels[target.locale][sectionKey] || (target.locale === 'en' ? 'Documentation' : 'Dokümantasyon');
    const route = `${target.routePrefix}${slug}`.replace(/\/+/gu, '/').replace(/\/$/u, '');
    const content = cleanMarkdown(body).slice(0, 5600);

    entries.push({
      id: `${target.locale}:${relative}`,
      locale: target.locale,
      title,
      description,
      category,
      headings: headings.slice(0, 12),
      route,
      content,
    });
  }
}

const output = path.resolve('src/data/search-index.json');
fs.mkdirSync(path.dirname(output), {recursive: true});
fs.writeFileSync(output, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
console.log(`Arama dizini hazır: ${entries.length} kayıt.`);
