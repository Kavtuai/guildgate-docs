import fs from 'node:fs';
import path from 'node:path';

const roots = ['docs', 'src', '.github'];
const extensions = new Set(['.md', '.mdx', '.js', '.jsx', '.css', '.yml', '.yaml']);
const checks = [
  ['teslim cümlesi', /(?:işte istediğin|memnuniyetle|umarım yardımcı olur)/giu],
  ['kalıp sonuç', /(?:sonuç olarak|özetle|genel olarak bakıldığında)/giu],
  ['şişirilmiş giriş', /(?:günümüzün hızla değişen|daha geniş bir perspektiften|çığır açan bir dönüm noktası)/giu],
  ['tanıtım kalıbı', /(?:kusursuz entegrasyon|sorunsuz deneyim|benzersiz bir çözüm|güçlü ve kapsamlı)/giu],
  ['gereksiz önem iddiası', /(?:kalıcı bir miras|öneminin altını çizer|hayati bir rol oynar)/giu],
  ['boş şablon alanı', /(?:<link>|\{(?:şirket|proje|isim)[^}]*\}|\[(?:buraya )?(?:kaynak|link) ekle\])/giu],
  ['turn aracı artığı', /turn\d+(?:search|view|fetch|file)\d+/giu],
  ['contentReference artığı', /contentReference/giu],
  ['OpenAI atıf artığı', /oaicite|oai_citation|attributableIndex/giu],
  ['Gemini atıf artığı', /\[cite:\s*\d+|\[span_\d+\]\(start_span\)/giu],
  ['sağlayıcı artığı', /grok_(?:card|render_citation_card_json)|attached_file|ppl-ai-file-upload/giu],
  ['writing block artığı', /:::writing\b/giu],
  ['geçici büyük placeholder', /PASTE_[A-Z0-9_]+_HERE|TODO_CONTENT|LOREM IPSUM/gu],
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const intentionalReferencePages = new Set([
  path.normalize('docs/katki/yazi-standardi.mdx'),
  path.normalize('src/lib/command-engine.mjs'),
]);

const files = roots
  .flatMap(walk)
  .filter((file) => extensions.has(path.extname(file)) && !intentionalReferencePages.has(path.normalize(file)));

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
