const {themes} = require('prism-react-renderer');
const lightCodeTheme = themes.vsLight ?? themes.github;
const darkCodeTheme = themes.vsDark ?? themes.dracula;
const {execFileSync} = require('node:child_process');

function hasGitHistory() {
  try {
    execFileSync('git', ['rev-parse', '--verify', 'HEAD'], {
      cwd: __dirname,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

const useJsOrg = process.env.DOCS_DOMAIN === 'jsorg';
const assetBase = useJsOrg ? '' : '/guildgate-docs';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'GuildGate',
  tagline: 'Server-side security core for Discord dashboards',
  favicon: 'img/favicon.png',
  url: useJsOrg ? 'https://guildgate.js.org' : 'https://kavtuai.github.io',
  baseUrl: useJsOrg ? '/' : '/guildgate-docs/',
  organizationName: 'Kavtuai',
  projectName: 'guildgate-docs',
  trailingSlash: false,
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  i18n: {
    defaultLocale: 'tr',
    locales: ['tr', 'en'],
    localeConfigs: {
      tr: {label: 'Türkçe', htmlLang: 'tr-TR'},
      en: {label: 'English', htmlLang: 'en-US'},
    },
  },
  headTags: [
    {tagName: 'meta', attributes: {name: 'theme-color', content: '#3262a8'}},
    {tagName: 'meta', attributes: {name: 'color-scheme', content: 'light dark'}},
    {tagName: 'link', attributes: {rel: 'apple-touch-icon', sizes: '180x180', href: `${assetBase}/img/apple-touch-icon.png`}},
    {tagName: 'link', attributes: {rel: 'icon', type: 'image/png', sizes: '32x32', href: `${assetBase}/img/favicon-32.png`}},
    {tagName: 'link', attributes: {rel: 'icon', type: 'image/png', sizes: '16x16', href: `${assetBase}/img/favicon-16.png`}},
  ],
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: 'docs',
          showLastUpdateAuthor: false,
          showLastUpdateTime: hasGitHistory(),
          breadcrumbs: true,
        },
        blog: false,
        theme: {customCss: require.resolve('./src/css/custom.css')},
        sitemap: {changefreq: 'weekly', priority: 0.7},
      },
    ],
  ],
  themeConfig: {
    image: 'img/guildgate-social-card.png',
    metadata: [
      {name: 'description', content: 'Turkish and English documentation for GuildGate 1.1.0: setup, security, storage, realtime access and public API.'},
      {name: 'keywords', content: 'GuildGate, Discord dashboard, Node.js, TypeScript, OAuth, CSRF, session security, Fastify, Express, Redis'},
    ],
    navbar: {
      title: 'GuildGate',
      logo: {alt: 'GuildGate', src: 'img/guildgate-mark.png'},
      items: [
        {type: 'docSidebar', sidebarId: 'docsSidebar', position: 'left', label: 'Dokümanlar'},
        {to: '/docs/baslangic/kurulum', label: 'Kurulum', position: 'left'},
        {to: '/docs/araclar/dogrulama-konsolu', label: 'Konsol', position: 'left', className: 'navbar-playground-link'},
        {to: '/docs/referans/public-api', label: 'API', position: 'left'},
        {type: 'localeDropdown', position: 'right'},
        {href: 'https://www.npmjs.com/package/@kavtuai/guildgate', label: 'npm', position: 'right'},
        {href: 'https://github.com/Kavtuai/guildgate', label: 'GitHub', position: 'right'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {title: 'Başlangıç', items: [
          {label: 'GuildGate nedir?', to: '/docs/giris'},
          {label: 'Kurulum', to: '/docs/baslangic/kurulum'},
          {label: 'Beş dakikalık kurulum', to: '/docs/baslangic/bes-dakikada-basla'},
          {label: 'Örnek projeler', to: '/docs/baslangic/ornekler'},
        ]},
        {title: 'Uygulama', items: [
          {label: 'İşlem katmanı', to: '/docs/istek-katmani/action'},
          {label: 'Özel depolar', to: '/docs/depolama/ozel-depolar'},
          {label: 'Gerçek zamanlı erişim', to: '/docs/gercek-zamanli/realtime-hub'},
          {label: 'Doğrulama konsolu', to: '/docs/araclar/dogrulama-konsolu'},
        ]},
        {title: 'Proje', items: [
          {label: 'npm paketi', href: 'https://www.npmjs.com/package/@kavtuai/guildgate'},
          {label: 'Kaynak kodu', href: 'https://github.com/Kavtuai/guildgate'},
          {label: 'Güvenlik bildirimi', href: 'https://github.com/Kavtuai/guildgate/security'},
          {label: 'İletişim', href: 'https://mxyouone.me/contact?category=website&website=GuildGate'},
        ]},
      ],
      copyright: `© ${new Date().getFullYear()} GuildGate. MIT lisansı ile yayımlanır.`,
    },
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
      additionalLanguages: ['bash', 'diff', 'json', 'typescript', 'yaml'],
    },
    colorMode: {defaultMode: 'dark', disableSwitch: false, respectPrefersColorScheme: true},
  },
};

module.exports = config;
