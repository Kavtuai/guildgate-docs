import fs from 'node:fs';
import path from 'node:path';

const roots = ['docs', 'src'];
const extensions = new Set(['.md', '.mdx', '.js', '.jsx', '.css']);
const checks = [
  ['sonuç olarak', /sonuç olarak/giu],
  ['özetle', /\bözetle\b/giu],
  ['bu kapsamlı rehber', /bu kapsamlı rehber/giu],
  ['derinlemesine inceleyelim', /derinlemesine inceleyelim/giu],
  ['günümüzün hızla değişen', /günümüzün hızla değişen/giu],
  ['oyunun kurallarını değiştiren', /oyunun kurallarını değiştiren/giu],
  ['kusursuz entegrasyon', /kusursuz entegrasyon/giu],
  ['sorunsuz deneyim', /sorunsuz deneyim/giu],
  ['turn...search artık değeri', /turn\d+(?:search|view|fetch)\d+/giu],
  ['contentReference artık değeri', /contentReference/giu],
  ['oaicite artık değeri', /oaicite|oai_citation/giu],
  ['cite placeholder', /\[cite:\s*\d+/giu],
  ['writing block artığı', /:::writing\{/giu],
  ['placeholder URL', /PASTE_[A-Z0-9_]+_HERE/gu],
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const intentionalReferencePages = new Set([path.normalize('docs/katki/yazi-standardi.mdx')]);
const files = roots.flatMap(walk).filter((file) => extensions.has(path.extname(file)) && !intentionalReferencePages.has(path.normalize(file)));
const failures = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const [label, pattern] of checks) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) failures.push(`${file}: ${label}`);
  }
}

if (failures.length) {
  console.error('Editoryal kontrol başarısız:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Editoryal kontrol tamam: ${files.length} dosya.`);
