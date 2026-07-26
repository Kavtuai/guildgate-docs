/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
module.exports = {
  docsSidebar: [
    'giris',
    {
      type: 'category',
      label: 'Başlangıç',
      collapsed: false,
      items: [
        'baslangic/kurulum',
        'baslangic/bes-dakikada-basla',
        'baslangic/ornekler',
        'baslangic/ilk-yapilandirma',
        'baslangic/sorumluluk-sinirlari',
      ],
    },
    {
      type: 'category',
      label: 'Mimari ve güvenlik',
      items: [
        'mimari/genel-bakis',
        'mimari/tehdit-modeli',
        'mimari/islem-yasam-dongusu',
      ],
    },
    {
      type: 'category',
      label: 'Kimlik ve oturum',
      items: ['kimlik/discord-oauth', 'kimlik/oturumlar', 'kimlik/csrf-origin'],
    },
    {
      type: 'category',
      label: 'İstek katmanı',
      items: ['istek-katmani/action', 'istek-katmani/yetkilendirme', 'istek-katmani/framework-bagdastiricilari'],
    },
    {
      type: 'category',
      label: 'Depolama',
      items: ['depolama/depo-sozlesmeleri', 'depolama/bellek-redis', 'depolama/ozel-depolar', 'depolama/kalici-kayitlar'],
    },
    {
      type: 'category',
      label: 'Dayanıklılık ve gözlem',
      items: ['dayaniklilik/kilit-retry-circuit-breaker', 'dayaniklilik/audit-outbox-telemetri'],
    },
    {
      type: 'category',
      label: 'Gerçek zamanlı erişim',
      items: ['gercek-zamanli/realtime-hub'],
    },
    {
      type: 'category',
      label: 'Araçlar',
      collapsed: false,
      items: ['araclar/dogrulama-konsolu', 'cli/doctor', 'cli/writing-check'],
    },
    {
      type: 'category',
      label: 'Referans',
      items: ['referans/public-api', 'referans/yapilandirma', 'referans/hatalar-ve-diller', 'referans/gecis-ve-surumleme'],
    },
    {
      type: 'category',
      label: 'Üretim ve katkı',
      items: ['uretim/guvenlik-kontrol-listesi', 'uretim/test-ve-yayin', 'katki/yazi-standardi', 'surum-notlari'],
    },
    'sorun-giderme',
  ],
};
