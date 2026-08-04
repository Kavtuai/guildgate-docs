/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
module.exports = {
  docsSidebar: [
    'giris',
    {
      type: 'category',
      label: 'Getting started',
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
      label: 'Architecture and security',
      items: [
        'mimari/genel-bakis',
        'mimari/tehdit-modeli',
        'mimari/islem-yasam-dongusu',
      ],
    },
    {
      type: 'category',
      label: 'Identity and sessions',
      items: ['kimlik/discord-oauth', 'kimlik/oturumlar', 'kimlik/csrf-origin'],
    },
    {
      type: 'category',
      label: 'Request layer',
      items: ['istek-katmani/action', 'istek-katmani/yetkilendirme', 'istek-katmani/framework-bagdastiricilari'],
    },
    {
      type: 'category',
      label: 'Storage',
      items: ['depolama/depo-sozlesmeleri', 'depolama/bellek-redis', 'depolama/ozel-depolar', 'depolama/kalici-kayitlar'],
    },
    {
      type: 'category',
      label: 'Resilience and observability',
      items: ['dayaniklilik/kilit-retry-circuit-breaker', 'dayaniklilik/audit-outbox-telemetri'],
    },
    {
      type: 'category',
      label: 'Realtime access',
      items: ['gercek-zamanli/realtime-hub'],
    },
    {
      type: 'category',
      label: 'Tools',
      collapsed: false,
      items: ['araclar/dogrulama-konsolu', 'cli/doctor', 'cli/writing-check'],
    },
    {
      type: 'category',
      label: 'Reference',
      items: ['referans/public-api', 'referans/yapilandirma', 'referans/hatalar-ve-diller', 'referans/gecis-ve-surumleme'],
    },
    {
      type: 'category',
      label: 'Production and contribution',
      items: ['uretim/guvenlik-kontrol-listesi', 'uretim/test-ve-yayin', 'katki/yazi-standardi', 'surum-notlari'],
    },
    'sorun-giderme',
  ],
};
