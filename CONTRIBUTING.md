# Katkı rehberi

Bu depo GuildGate dokümantasyon sitesini içerir. Paket davranışıyla ilgili hata ve özellik talepleri ana GuildGate deposunda açılmalıdır.

## Yerel çalışma

```bash
npm install
npm run dev
```

Değişikliği göndermeden önce:

```bash
npm run validate
```

## Belge değişiklikleri

- API adı ve kod alanı değiştirilmez; açıklaması Türkçe yazılır.
- Sürüme bağlı davranışta ilgili GuildGate sürümü belirtilir.
- Çalışmayan veya varsayıma dayanan kod örneği eklenmez.
- Dış bağlantılar açılarak kontrol edilir.
- `docs/katki/yazi-standardi.mdx` içindeki kurallar uygulanır.

## Komut laboratuvarı

Yeni komut eklerken `src/lib/command-engine.mjs` içindeki izin listesi kullanılır. Dinamik kod değerlendirme, işletim sistemi komutu, ağ isteği veya kullanıcı girdisini HTML olarak gösterme kabul edilmez. `npm run command:check` yeni senaryoyu kapsamalıdır.
