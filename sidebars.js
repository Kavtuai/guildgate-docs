/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
module.exports = {
  docsSidebar: [
    'giris',
    {
      type: 'category',
      label: 'Başlangıç',
      collapsed: false,
      items: ['baslangic/kurulum', 'baslangic/ilk-yapilandirma', 'baslangic/sorumluluk-sinirlari'],
    },
    {
      type: 'category',
      label: 'Kimlik ve oturum',
      items: ['kimlik/discord-oauth', 'kimlik/oturumlar', 'kimlik/csrf-origin'],
    },
    {
      type: 'category',
      label: 'İstek katmanı',
      items: ['istek-katmani/action', 'istek-katmani/yetkilendirme', 'istek-katmani/fastify-express'],
    },
    {
      type: 'category',
      label: 'Depolama',
      items: ['depolama/bellek-redis', 'depolama/kalici-kayitlar'],
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
      items: ['araclar/komut-laboratuvari', 'cli/doctor', 'cli/writing-check'],
    },
    {
      type: 'category',
      label: 'Referans',
      items: ['referans/public-api', 'referans/yapilandirma', 'referans/hatalar-ve-diller'],
    },
    {
      type: 'category',
      label: 'Yayın ve bakım',
      items: ['uretim/guvenlik-kontrol-listesi', 'uretim/github-pages-jsorg', 'katki/yazi-standardi', 'surum-notlari'],
    },
    'sorun-giderme',
  ],
};
