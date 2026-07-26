# Katkı rehberi

Bu depo GuildGate dokümantasyon sitesini içerir. Paket davranışıyla ilgili hata ve özellik talepleri ana GuildGate deposunda açılmalıdır.

## Yerel çalışma

```bash
npm install
npm run dev
```

İngilizce siteyi tek başına açmak için:

```bash
npm run start:en
```

Değişikliği göndermeden önce:

```bash
npm run validate
```

## İki dil kuralı

`docs/` altında eklenen veya değiştirilen her sayfanın İngilizce karşılığı `i18n/en/docusaurus-plugin-content-docs/current/` altında aynı belge kimliğiyle bulunmalıdır. Kod alanları ve export adları çevrilmez; açıklama metni doğal biçimde yazılır.

## Belge değişiklikleri

- Sürüme bağlı davranışta ilgili GuildGate sürümünü yaz.
- Varsayıma dayanan veya çalıştırılmamış kod örneği ekleme.
- Dış bağlantıları açarak kontrol et.
- Kullanıcı yanıtına iç hata, sır, store anahtarı veya debug ayrıntısı koyma.
- `docs/katki/yazi-standardi.mdx` içindeki dili koru.

## Doğrulama konsolu

Yeni komut yalnızca `src/lib/command-engine.mjs` içindeki açık izin listesine eklenebilir. Dinamik kod değerlendirme, işletim sistemi komutu, ağ isteği, kalıcı tarayıcı depolaması veya kullanıcı girdisini HTML olarak işleme kabul edilmez. Her yeni davranış `npm run command:check` içinde sınanmalıdır.
