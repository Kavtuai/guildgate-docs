const lightCodeTheme = require('prism-react-renderer').themes.github;
const darkCodeTheme = require('prism-react-renderer').themes.dracula;
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

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'GuildGate',
  tagline: 'Discord yönetim paneli sunucuları için güvenlik çekirdeği',
  favicon: 'img/favicon.svg',
  url: useJsOrg ? 'https://guildgate.js.org' : 'https://kavtuai.github.io',
  baseUrl: useJsOrg ? '/' : '/guildgate-docs/',
  organizationName: 'Kavtuai',
  projectName: 'guildgate-docs',
  trailingSlash: false,
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  i18n: {
    defaultLocale: 'tr',
    locales: ['tr'],
    localeConfigs: {
      tr: {label: 'Türkçe', htmlLang: 'tr-TR'},
    },
  },
  headTags: [
    {tagName: 'meta', attributes: {name: 'theme-color', content: '#3262a8'}},
    {tagName: 'meta', attributes: {name: 'color-scheme', content: 'light dark'}},
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
        sitemap: {changefreq: 'weekly', priority: 0.6},
      },
    ],
  ],
  themeConfig: {
    image: 'img/guildgate-social-card.png',
    metadata: [
      {name: 'description', content: 'GuildGate 0.1.0 için Türkçe kurulum, güvenlik ve API belgeleri.'},
      {name: 'keywords', content: 'GuildGate, Discord yönetim paneli, Node.js, TypeScript, OAuth, CSRF, oturum güvenliği'},
    ],
    navbar: {
      title: 'GuildGate',
      logo: {alt: 'GuildGate logosu', src: 'img/guildgate-mark.svg'},
      items: [
        {type: 'docSidebar', sidebarId: 'docsSidebar', position: 'left', label: 'Dokümanlar'},
        {to: '/docs/baslangic/kurulum', label: 'Kurulum', position: 'left'},
        {to: '/docs/referans/public-api', label: 'API', position: 'left'},
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
          {label: 'İlk yapılandırma', to: '/docs/baslangic/ilk-yapilandirma'},
        ]},
        {title: 'Geliştirme', items: [
          {label: 'İşlem hattı', to: '/docs/istek-katmani/action'},
          {label: 'Dışa açık API', to: '/docs/referans/public-api'},
          {label: 'Sorun giderme', to: '/docs/sorun-giderme'},
        ]},
        {title: 'Proje', items: [
          {label: 'npm paketi', href: 'https://www.npmjs.com/package/@kavtuai/guildgate'},
          {label: 'Kaynak kodu', href: 'https://github.com/Kavtuai/guildgate'},
          {label: 'MIT lisansı', href: 'https://github.com/Kavtuai/guildgate/blob/main/LICENSE'},
        ]},
      ],
      copyright: `© ${new Date().getFullYear()} GuildGate. MIT lisansı ile yayımlanır.`,
    },
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
      additionalLanguages: ['bash', 'json', 'typescript'],
    },
    colorMode: {defaultMode: 'dark', disableSwitch: false, respectPrefersColorScheme: true},
  },
};

module.exports = config;
