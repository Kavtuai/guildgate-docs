import fs from 'node:fs';

function resolveOutput(...candidates) {
  const match = candidates.find((candidate) => fs.existsSync(candidate));
  if (!match) {
    throw new Error(`Missing build output. Checked: ${candidates.join(', ')}`);
  }
  return match;
}

const outputs = {
  enHome: resolveOutput('build/index.html'),
  trHome: resolveOutput('build/tr/index.html'),
  enIntro: resolveOutput('build/docs/giris.html', 'build/docs/giris/index.html'),
  trIntro: resolveOutput('build/tr/docs/giris.html', 'build/tr/docs/giris/index.html'),
  en404: resolveOutput('build/404.html'),
  tr404: resolveOutput('build/tr/404.html'),
  enSitemap: resolveOutput('build/sitemap.xml'),
  trSitemap: resolveOutput('build/tr/sitemap.xml'),
};

const en = fs.readFileSync(outputs.enHome, 'utf8');
const tr = fs.readFileSync(outputs.trHome, 'utf8');

if (!/<html[^>]+lang="en"/u.test(en)) {
  throw new Error('English html lang missing');
}

if (!/<html[^>]+lang="tr"/u.test(tr)) {
  throw new Error('Turkish html lang missing');
}

for (const [name, html] of [
  ['en', en],
  ['tr', tr],
]) {
  for (const marker of [
    'hreflang="en"',
    'hreflang="tr"',
    'hreflang="x-default"',
    'rel="canonical"',
  ]) {
    if (!html.includes(marker)) {
      throw new Error(`${name}: ${marker} missing`);
    }
  }
}

const sitemapChecks = [
  ['English', outputs.enSitemap, '/docs/giris'],
  ['Turkish', outputs.trSitemap, '/tr/docs/giris'],
];

for (const [locale, sitemapPath, expectedRoute] of sitemapChecks) {
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  if (!sitemap.includes(expectedRoute)) {
    throw new Error(`${locale} sitemap is missing ${expectedRoute}`);
  }
}

console.log(
  'Build output passed: English root, Turkish /tr, localized 404 files, per-locale sitemaps, canonical and hreflang metadata.',
);
