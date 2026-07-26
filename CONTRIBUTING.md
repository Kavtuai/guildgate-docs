# Katkı rehberi

GuildGate dokümantasyonundaki değişiklikler teknik olarak doğrulanabilir, Türkçe ve doğrudan olmalıdır.

## Çalışma düzeni

```bash
npm install
npm run start
```

Değişikliği göndermeden önce:

```bash
npm run check
npm run build
```

## Metin kuralları

- API adı ve kod alanı değiştirilemez; açıklaması Türkçe yazılır.
- Yeni bir davranış belgeleniyorsa ilgili GuildGate sürümü belirtilir.
- Çalışmayan veya yalnızca varsayıma dayanan kod örneği eklenmez.
- Dış bağlantı açılarak doğrulanır.
- `docs/katki/yazi-standardi.mdx` içindeki editoryal ölçütler uygulanır.

Paket davranışıyla ilgili hata ve özellik talepleri ana GuildGate deposunda açılmalıdır. Bu depo yalnızca dokümantasyon sitesi içindir.
