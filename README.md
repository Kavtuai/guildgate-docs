# GuildGate Dokümantasyonu

`@kavtuai/guildgate` 0.1.0 için Türkçe Docusaurus sitesi.

## Yerel çalışma

```bash
npm install
npm run dev
```

`npm run start` komutu da aynı geliştirme sunucusunu açar.

Üretim derlemesi, proje henüz bir Git deposu değilken de çalışır. Git geçmişi varsa belge sayfalarında son güncelleme zamanı gösterilir.

## Kontroller

```bash
npm run editorial:check
npm run source:check
npm run site:check
npm run build
```

Hepsini tek komutla çalıştırmak için:

```bash
npm run validate
```

## Yayın kipleri

Varsayılan derleme, GitHub Pages proje adresini kullanır:

```bash
npm run build
```

js.org özel alan adı etkinleştirildikten sonra:

```bash
DOCS_DOMAIN=jsorg npm run build
```

Windows PowerShell:

```powershell
$env:DOCS_DOMAIN = "jsorg"
npm run build
```

Yayın ayrıntıları: `docs/uretim/github-pages-jsorg.mdx`
