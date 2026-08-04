import fs from 'node:fs';
import path from 'node:path';

const roots = [
  ['en', 'docs'],
  ['tr', 'i18n/tr/docusaurus-plugin-content-docs/current'],
];
const errors = [];
const sets = [];

function walk(root) {
  return fs.readdirSync(root, {withFileTypes: true}).flatMap((entry) => {
    const full = path.join(root, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function readPortableText(file) {
  return fs.readFileSync(file, 'utf8')
    .replace(/^\uFEFF/u, '')
    .replace(/\r\n?/gu, '\n');
}

for (const [locale, root] of roots) {
  const files = walk(root).filter((file) => /\.mdx?$/u.test(file));
  sets.push(files.map((file) => path.relative(root, file).replaceAll(path.sep, '/')).sort());

  for (const file of files) {
    const text = readPortableText(file);
    if (
      !text.startsWith('---\n') ||
      !/^title:\s*\S+/mu.test(text) ||
      !/^description:\s*\S+/mu.test(text)
    ) {
      errors.push(`${locale}:${file}: frontmatter`);
    }
    if (((text.match(/```/gu) ?? []).length % 2) !== 0) {
      errors.push(`${locale}:${file}: code fence`);
    }
  }
}

if (JSON.stringify(sets[0]) !== JSON.stringify(sets[1])) {
  errors.push('Locale file sets differ');
}

const index = JSON.parse(readPortableText('src/data/search-index.json'));
if (index.length !== sets[0].length + sets[1].length) {
  errors.push(`Search index count ${index.length}`);
}
for (const entry of index) {
  if (entry.locale === 'en' && !entry.route.startsWith('/docs')) {
    errors.push(`English route ${entry.route}`);
  }
  if (entry.locale === 'tr' && !entry.route.startsWith('/tr/docs')) {
    errors.push(`Turkish route ${entry.route}`);
  }
}

for (const [file, width, height] of [
  ['static/img/guildgate-social-card.png', 1200, 630],
  ['static/img/favicon-32.png', 32, 32],
  ['static/img/favicon-16.png', 16, 16],
]) {
  const bytes = fs.readFileSync(file);
  if (bytes.readUInt32BE(16) !== width || bytes.readUInt32BE(20) !== height) {
    errors.push(`${file} size`);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(
  `Site check passed: ${sets[0].length} documents × 2 locales and ${index.length} search records.`,
);
