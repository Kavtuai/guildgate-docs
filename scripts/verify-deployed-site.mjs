const base = (process.argv[2] ?? 'https://guildgate.js.org').replace(/\/$/u, '');
const requiredHeaders = [
  'content-security-policy',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
  'strict-transport-security',
];

async function get(route, options = {}) {
  const response = await fetch(`${base}${route}`, options);
  return {response, html: await response.text()};
}

for (const [route, lang] of [['/', 'en'], ['/tr/', 'tr']]) {
  const {response, html} = await get(route, {redirect: 'follow'});
  if (!response.ok) throw new Error(`${route}: HTTP ${response.status}`);
  if (!new RegExp(`<html[^>]+lang=["']${lang}["']`, 'iu').test(html)) {
    throw new Error(`${route}: expected html lang ${lang}`);
  }
  for (const marker of ['hreflang="en"', 'hreflang="tr"', 'hreflang="x-default"', 'rel="canonical"']) {
    if (!html.includes(marker)) throw new Error(`${route}: ${marker} missing`);
  }
  if (route === '/') {
    const missing = requiredHeaders.filter((name) => !response.headers.has(name));
    if (missing.length) {
      throw new Error(`Production header layer is incomplete: ${missing.join(', ')}`);
    }
  }
}

const legacy = await fetch(`${base}/en/docs/giris`, {redirect: 'manual'});
if (![301, 302, 307, 308].includes(legacy.status)) {
  throw new Error(`/en/docs/giris: expected redirect, received HTTP ${legacy.status}`);
}
const location = legacy.headers.get('location') ?? '';
if (!location.endsWith('/docs/giris')) {
  throw new Error(`/en/docs/giris: unexpected location ${location}`);
}

for (const route of ['/docs/araclar/dogrulama-konsolu', '/tr/docs/araclar/dogrulama-konsolu']) {
  const response = await fetch(`${base}${route}`, {redirect: 'follow'});
  if (!response.ok) throw new Error(`${route}: HTTP ${response.status}`);
}

console.log(`Production verification passed: ${base}`);
