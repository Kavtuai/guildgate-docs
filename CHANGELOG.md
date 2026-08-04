# Changelog

## 0.4.0 — 2026-08-03

- English is now the default locale at `/`; Turkish remains available under `/tr/`.
- Legacy `/en/` routes redirect to the equivalent English root route.
- The verification console now has explicit token, flag, length, prototype-key, network, storage, and DOM rendering guards.
- GuildGate 1.1.1 package, contract, security, and release documentation is included.
- Added locale parity, metadata, secret, built-output, and deployed-header checks.
- GitHub Pages build and deploy permissions are separated and clean installs use the lockfile.

# GuildGate Docs değişiklik günlüğü

## 0.3.3 — 2026-07-26

- Türkçe ve İngilizce belgeler `@kavtuai/guildgate@1.1.0` kararlı sürümüne geçirildi.
- Transaction kesinliği, PostgreSQL savepoint'leri, idempotency reservation sahipliği ve katı yanıt deadline davranışı belgelendi.
- Atomik session sınırı, Redis cache retag işlemleri, PostgreSQL rate-limit sıralaması ve Discord OAuth refresh single-flight davranışı eklendi.
- WebSocket, Socket.IO ve SSE için ortak boyut, hız, abonelik, activity, replay ve backpressure sınırları açıklandı.
- Outbox claim lease, batch, concurrency, tekrar teslim ve consumer deduplication kuralları güncellendi.
- Adapter sözleşmesi `1.1`, 16 public export yolu, üç CLI hedefi, 76 deterministik test ve coverage eşikleri belgelendi.
- Yazı standardı ve sürüm notları ürün odaklı, doğrudan ve bakım yapılabilir bir yapıya taşındı.
- Açık temadaki arama kontrastı ve IDE benzeri kod blokları korundu.

## 0.3.1 — 2026-07-26

- Header ortasına Türkçe ve İngilizce belge araması eklendi.
- `Ctrl+K` ve `Cmd+K`, klavye gezintisi, dil filtresi ve bölüm filtresi eklendi.
- Footer'a GuildGate iletişim bağlantısı eklendi.

## 0.3.0 — 2026-07-26

- Türkçe belge kümesine eş İngilizce belge kümesi eklendi.
- Sosyal paylaşım kartı, favicon seti ve iki dilli ana sayfa yenilendi.
- Kaynak, editoryal, komut motoru ve site kontrolleri genişletildi.
