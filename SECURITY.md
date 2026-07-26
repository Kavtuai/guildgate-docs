# Güvenlik

Dokümantasyon sitesinde güvenlik açığı bulursan herkese açık kayıtta gizli anahtar, belirteç veya kişisel veri paylaşma. Ana GuildGate deposunun güvenlik bildirim kanalını kullan.

Site statik olarak yayımlanır. Discord istemci sırrı, bot belirteci, OAuth belirteci, oturum anahtarı ve veritabanı bağlantısı istemci koduna eklenmemelidir.

Doğrulama konsolu gerçek kabuk veya serbest JavaScript çalıştırmaz. Girdi tarayıcı sekmesinde değerlendirilir, ağa gönderilmez ve kalıcı depoya yazılmaz. İzin listesi dışına çıkan, ağ erişimi ekleyen veya girdiyi kod olarak değerlendiren değişiklik güvenlik incelemesi olmadan kabul edilmez.

Kullanıcıya dönen mesajlar sabit hata kodundan yerelleştirilir. Ham dependency hatası, stack, dosya yolu, sorgu, cookie, token veya iç policy ayrıntısı istemciye taşınmaz.
