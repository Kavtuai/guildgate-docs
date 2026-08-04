const base = (process.argv[2] ?? 'https://guildgate.js.org').replace(/\/$/u, '');
const requiredHeaders = [
  'content-security-policy',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
  'strict-transport-security',
];

async function get(route, options = {}) {
  const separator = route.includes('?') ? '&' : '?';
  const response = await fetch(`${base}${route}${separator}verify=${Date.now()}`, {
    cache: 'no-store',
    ...options,
  });
  return {response, html: await response.text()};
}

for (const [route, lang] of [['/', 'en'], ['/tr/', 'tr']]) {
  const {response, html} = await get(route, {redirect: 'follow'});
  if (!response.ok) throw new Error(`${route}: HTTP ${response.status}`);
  if (!new RegExp(`<html[^>]+lang=["']${lang}["']`, 'iu').test(html)) {
    throw new Error(`${route}: expected html lang ${lang}`);
  }
  for (const marker of [
    'hreflang="en"',
    'hreflang="tr"',
    'hreflang="x-default"',
    'rel="canonical"',
    '1.1.1',
  ]) {
    if (!html.includes(marker)) throw new Error(`${route}: ${marker} missing`);
  }
}

const legacyNoSlash = await fetch(`${base}/en/docs/giris`, {
  redirect: 'manual',
  cache: 'no-store',
});
if (
  legacyNoSlash.status !== 200 &&
  ![301, 302, 307, 308].includes(legacyNoSlash.status)
) {
  throw new Error(`/en/docs/giris: unexpected HTTP ${legacyNoSlash.status}`);
}

const legacy = await get('/en/docs/giris/', {redirect: 'follow'});
if (!legacy.response.ok) {
  throw new Error(`/en/docs/giris/: HTTP ${legacy.response.status}`);
}
if (
  !legacy.html.includes('/docs/giris') ||
  !/http-equiv=["']refresh["']|window\.location|location\.replace|location\.href/iu.test(legacy.html)
) {
  throw new Error('/en/docs/giris/: static redirect output is invalid');
}

for (const route of [
  '/docs/araclar/dogrulama-konsolu',
  '/tr/docs/araclar/dogrulama-konsolu',
]) {
  const {response} = await get(route, {redirect: 'follow'});
  if (!response.ok) throw new Error(`${route}: HTTP ${response.status}`);
}

const releaseNotes = await get('/docs/surum-notlari', {redirect: 'follow'});
if (!releaseNotes.response.ok || !releaseNotes.html.includes('Documentation site 0.4.1')) {
  throw new Error('/docs/surum-notlari: documentation version 0.4.1 is missing');
}

const root = await get('/', {redirect: 'follow'});
const missingHeaders = requiredHeaders.filter(
  (name) => !root.response.headers.has(name),
);

console.log(JSON.stringify({
  production: base,
  packageVersion: '1.1.1',
  docsVersion: '0.4.1',
  content: 'passed',
  missingResponseHeaders: missingHeaders,
}));
