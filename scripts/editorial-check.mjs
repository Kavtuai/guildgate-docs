import fs from 'node:fs';
import path from 'node:path';

const roots = ['docs', 'i18n/en/docusaurus-plugin-content-docs/current', 'src', '.github'];
const extensions = new Set(['.md', '.mdx', '.js', '.jsx', '.css', '.yml', '.yaml', '.json']);
const checks = [
  ['teslim cümlesi', /(?:işte istediğin|memnuniyetle|umarım yardımcı olur|here(?:'s| is) what you asked for|glad to help)/giu],
  ['kalıp sonuç', /(?:sonuç olarak|(?:^|[\s.!?])özetle(?:[\s,;.!?]|$)|genel olarak bakıldığında|in conclusion|to summarize|overall,? it is clear)/gimu],
  ['şişirilmiş giriş', /(?:günümüzün hızla değişen|daha geniş bir perspektiften|çığır açan bir dönüm noktası|in today'?s rapidly evolving|in the ever-evolving|a groundbreaking milestone)/giu],
  ['tanıtım kalıbı', /(?:kusursuz entegrasyon|sorunsuz deneyim|benzersiz bir çözüm|güçlü ve kapsamlı|seamless integration|unparalleled solution|robust and comprehensive|unlock the power)/giu],
  ['gereksiz önem iddiası', /(?:kalıcı bir miras|öneminin altını çizer|hayati bir rol oynar|stands as a testament|plays a pivotal role|underscores the importance)/giu],
  ['belirsiz atıf', /(?:uzmanlara göre|kaynaklara göre|genel görüşe göre|experts say|according to sources|it is widely believed)/giu],
  ['boş şablon alanı', /(?:<link>|\{(?:şirket|proje|isim)[^}]*\}|\[(?:buraya )?(?:kaynak|link) ekle\])/giu],
  ['turn aracı artığı', /turn\d+(?:search|view|fetch|file)\d+/giu],
  ['contentReference artığı', /contentReference/giu],
  ['bozuk atıf işareti', /oaicite|oai_citation|attributableIndex/giu],
  ['bozuk span işareti', /\[cite:\s*\d+|\[span_\d+\]\(start_span\)/giu],
  ['harici araç artığı', /grok_(?:card|render_citation_card_json)|attached_file|ppl-ai-file-upload/giu],
  ['writing block artığı', /:::writing\b/giu],
  ['geçici büyük placeholder', /PASTE_[A-Z0-9_]+_HERE|TODO_CONTENT|LOREM IPSUM/gu],
  ['eski konsol etiketi', /yerel simülasyon|local simulation/giu],
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const intentionalReferencePages = new Set([
  path.normalize('src/lib/command-engine.mjs'),
  path.normalize('docs/cli/writing-check.mdx'),
  path.normalize('i18n/en/docusaurus-plugin-content-docs/current/cli/writing-check.mdx'),
]);

const files = roots
  .flatMap(walk)
  .filter((file) => extensions.has(path.extname(file)) && !intentionalReferencePages.has(path.normalize(file)) && path.normalize(file) !== path.normalize('src/data/search-index.json'));

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
