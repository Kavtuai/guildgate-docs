import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import CommandPlayground from '../components/CommandPlayground';
import styles from './index.module.css';
import {releaseMetadata} from '../data/release-metadata.mjs';

const CONTENT = {
  tr: {
    layoutTitle: 'Discord dashboard güvenlik çekirdeği',
    layoutDescription: `GuildGate ${releaseMetadata.packageVersion} için Türkçe ve İngilizce kurulum, güvenlik, depolama, gerçek zamanlı erişim ve API belgeleri.`,
    eyebrow: `${releaseMetadata.packageName} · ${releaseMetadata.packageVersion}`,
    title: 'Discord dashboard güvenliğini tek yerde yönet.',
    subtitle: 'GuildGate; OAuth, oturum, CSRF, yetki, istek sınırı, denetim kaydı ve realtime kontrollerini sunucuda toplar. Arayüzüne ve veritabanına karışmaz.',
    start: 'Beş dakikada başla',
    console: 'Konsolu aç',
    copy: 'Kurulum komutunu kopyala',
    copied: 'Kopyalandı',
    visualLabel: 'Korunan yazma isteğinin denetim sırası',
    request: 'PATCH /guilds/:id/settings',
    action: 'guild.settings.update',
    result: 'Ayarlar kaydedildi',
    audit: 'Denetim olayı sıraya alındı',
    steps: [
      ['Origin', 'Tam eşleşme', 'bi-globe2'],
      ['Oturum', 'Etkin', 'bi-person-check'],
      ['CSRF', 'Eşleşti', 'bi-key'],
      ['Yetki', 'MANAGE_GUILD', 'bi-patch-check'],
      ['Kayıt', 'Tamamlandı', 'bi-database-check'],
    ],
    sectionKicker: 'Sınırlar açık kalsın',
    sectionTitle: 'Kütüphane güvenlik kararını toplar; ürün kararını senden almaz.',
    sectionText: 'Hangi kullanıcının neyi değiştirebileceğini sen belirlersin. GuildGate, bu kararın her yazma isteğinde aynı sırayla uygulanmasını sağlar.',
    features: [
      {
        icon: 'bi-person-lock',
        title: 'Ham oturum belirteci depoda yer almaz',
        text: 'Tarayıcı opak bir değer taşır. Sunucu özet karşılaştırması, süre sonu, boşta kalma süresi, yenileme ve iptal kurallarını birlikte uygular.',
      },
      {
        icon: 'bi-diagram-3',
        title: 'Korunan yazmalar aynı boru hattından geçer',
        text: 'Girdi, kaynak, origin, oturum, CSRF, kullanıcı izni, bot izni, idempotency ve kaynak kilidi ayrı dosyalara dağılmaz.',
      },
      {
        icon: 'bi-database-lock',
        title: 'Depo seçimi uygulamada kalır',
        text: 'PostgreSQL, MySQL, MongoDB, SQLite, Redis, mevcut ORM ya da kendi depolama servisinle store sözleşmelerini uygulayabilirsin.',
      },
      {
        icon: 'bi-broadcast-pin',
        title: 'Realtime aboneliği de yetki ister',
        text: 'WebSocket, Socket.IO ve SSE bağlantıları oturum, sunucu erişimi, sıra numarası, yeniden oynatma ve geri basınç kurallarıyla çalışır.',
      },
    ],
    codeKicker: 'İlk korunan işlem',
    codeTitle: 'Kaynağı, yetkiyi ve kaydı tek tanımda buluştur.',
    codeText: 'İşlem tanımı yalnızca HTTP rotasını sarmalamaz. Tekrarlanan isteği, eş zamanlı yazmayı, transaction kancasını, önbellek temizliğini ve denetim olayını da aynı yaşam döngüsüne bağlar.',
    codeLink: 'İşlem katmanını incele',
    consoleKicker: 'Kuralları dene',
    consoleTitle: 'Bir ayarı değiştirmeden önce hangi kontrolde duracağını gör.',
    consoleText: 'Doğrulama konsolu kabuk açmaz ve ağ isteği göndermez. Belgelenmiş örnekler üzerinde origin, oturum, depo, izin, istek sınırı ve realtime kararlarını kontrol eder.',
    consoleLink: 'Komutların tamamını aç',
    trust: [
      ['Node.js 22+', 'Desteklenen çalışma ortamı'],
      ['TypeScript', 'Paketle gelen tip bildirimleri'],
      ['DB bağımsız', 'Store sözleşmeleri'],
      ['TR / EN', 'Doküman ve hata mesajları'],
    ],
  },
  en: {
    layoutTitle: 'Security core for Discord dashboards',
    layoutDescription: `English and Turkish documentation for GuildGate ${releaseMetadata.packageVersion}, covering setup, security, storage, realtime access and the public API.`,
    eyebrow: `${releaseMetadata.packageName} · ${releaseMetadata.packageVersion}`,
    title: 'Keep Discord dashboard security in one place.',
    subtitle: 'GuildGate keeps OAuth, sessions, CSRF, authorization, rate limits, audit records and realtime checks together on the server. Your UI and database stay under your control.',
    start: 'Start in five minutes',
    console: 'Open the console',
    copy: 'Copy install command',
    copied: 'Copied',
    visualLabel: 'Validation order for a protected write',
    request: 'PATCH /guilds/:id/settings',
    action: 'guild.settings.update',
    result: 'Settings saved',
    audit: 'Audit event queued',
    steps: [
      ['Origin', 'Exact match', 'bi-globe2'],
      ['Session', 'Active', 'bi-person-check'],
      ['CSRF', 'Matched', 'bi-key'],
      ['Permission', 'MANAGE_GUILD', 'bi-patch-check'],
      ['Commit', 'Complete', 'bi-database-check'],
    ],
    sectionKicker: 'Keep the boundaries visible',
    sectionTitle: 'The library centralizes security decisions without taking over product rules.',
    sectionText: 'You decide who may change each resource. GuildGate makes sure the same checks run in the same order for every protected write.',
    features: [
      {
        icon: 'bi-person-lock',
        title: 'Raw session tokens stay out of storage',
        text: 'The browser carries an opaque value. The server combines digest comparison, absolute expiry, idle expiry, rotation and revocation.',
      },
      {
        icon: 'bi-diagram-3',
        title: 'Protected writes share one pipeline',
        text: 'Input, resource, origin, session, CSRF, user permission, bot permission, idempotency and resource locks do not drift across route files.',
      },
      {
        icon: 'bi-database-lock',
        title: 'Your application keeps control of storage',
        text: 'Implement the store contracts with PostgreSQL, MySQL, MongoDB, SQLite, Redis, an existing ORM or a private storage service.',
      },
      {
        icon: 'bi-broadcast-pin',
        title: 'Realtime subscriptions require authorization',
        text: 'WebSocket, Socket.IO and SSE connections apply session, guild access, sequencing, replay and backpressure rules.',
      },
    ],
    codeKicker: 'First protected action',
    codeTitle: 'Keep resource lookup, authorization and persistence in one definition.',
    codeText: 'An action definition does more than wrap an HTTP route. It can connect idempotency, concurrent-write protection, transaction hooks, cache invalidation and audit events to the same lifecycle.',
    codeLink: 'Read the action layer',
    consoleKicker: 'Try the rules',
    consoleTitle: 'See which check stops a request before changing a real setting.',
    consoleText: 'The verification console does not open a shell or send network requests. It evaluates documented origin, session, store, permission, rate-limit and realtime examples.',
    consoleLink: 'Open every command',
    trust: [
      ['Node.js 22+', 'Supported runtime'],
      ['TypeScript', 'Bundled type declarations'],
      ['DB agnostic', 'Store contracts'],
      ['TR / EN', 'Documentation and messages'],
    ],
  },
};

function SecurityVisual({content}) {
  return (
    <div className={styles.securityVisual} role="img" aria-label={content.visualLabel}>
      <div className={styles.orbit} aria-hidden="true"><span /><span /><span /></div>
      <div className={styles.requestBadge}>
        <span>PATCH</span>
        <code>{content.request.replace('PATCH ', '')}</code>
      </div>
      <div className={styles.securityPanel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.panelEyebrow}>{content.action}</span>
            <strong>{content.visualLabel}</strong>
          </div>
          <i className="bi bi-shield-lock" aria-hidden="true" />
        </div>
        <div className={styles.pathRail} aria-hidden="true"><span /></div>
        <div className={styles.checkList}>
          {content.steps.map(([label, value, icon], index) => (
            <div className={styles.checkRow} style={{'--delay': `${index * 520}ms`}} key={label}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <span className={styles.checkIcon}><i className={`bi ${icon}`} /></span>
              <span className={styles.checkLabel}>{label}</span>
              <strong>{value}</strong>
              <i className="bi bi-check-circle-fill" aria-hidden="true" />
            </div>
          ))}
        </div>
        <div className={styles.panelResult}>
          <i className="bi bi-check2-circle" aria-hidden="true" />
          <div><strong>{content.result}</strong><span>{content.audit}</span></div>
        </div>
      </div>
    </div>
  );
}

function HomepageHeader({content}) {
  const [copied, setCopied] = React.useState(false);
  const install = 'npm install @kavtuai/guildgate';
  const copyInstall = async () => {
    try {
      await navigator.clipboard?.writeText(install);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <header className={styles.hero}>
      <div className="container">
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}><i className="bi bi-box-seam" aria-hidden="true" /> {content.eyebrow}</div>
            <Heading as="h1" className={styles.title}>{content.title}</Heading>
            <p className={styles.subtitle}>{content.subtitle}</p>
            <div className={styles.actions}>
              <Link className={clsx('button button--primary button--lg', styles.primaryButton)} to="/docs/baslangic/bes-dakikada-basla">
                <i className="bi bi-arrow-right-circle" aria-hidden="true" /> {content.start}
              </Link>
              <Link className={clsx('button button--secondary button--lg', styles.secondaryButton)} to="/docs/araclar/dogrulama-konsolu">
                <i className="bi bi-terminal" aria-hidden="true" /> {content.console}
              </Link>
            </div>
            <div className={styles.installLine}>
              <span><i className="bi bi-terminal-fill" aria-hidden="true" /></span>
              <code>{install}</code>
              <button type="button" onClick={copyInstall} aria-label={content.copy} title={content.copy}>
                <i className={copied ? 'bi bi-check2' : 'bi bi-copy'} aria-hidden="true" />
              </button>
              <span className={clsx(styles.copyState, copied && styles.copyStateVisible)} aria-live="polite">{content.copied}</span>
            </div>
          </div>
          <SecurityVisual content={content} />
        </div>
        <div className={styles.trustBar}>
          {content.trust.map(([value, label]) => (
            <div key={value}><strong>{value}</strong><span>{label}</span></div>
          ))}
        </div>
      </div>
    </header>
  );
}

function FeatureSection({content}) {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.sectionIntro}>
          <div>
            <span className={styles.kicker}>{content.sectionKicker}</span>
            <Heading as="h2">{content.sectionTitle}</Heading>
          </div>
          <p>{content.sectionText}</p>
        </div>
        <div className={styles.featureGrid}>
          {content.features.map((feature) => (
            <article key={feature.title} className={styles.feature}>
              <span className={styles.featureIcon}><i className={`bi ${feature.icon}`} aria-hidden="true" /></span>
              <Heading as="h3">{feature.title}</Heading>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CodeSection({content}) {
  return (
    <section className={styles.codeSection}>
      <div className="container">
        <div className={styles.codeGrid}>
          <div className={styles.codeCopy}>
            <span className={styles.kicker}>{content.codeKicker}</span>
            <Heading as="h2">{content.codeTitle}</Heading>
            <p>{content.codeText}</p>
            <Link to="/docs/istek-katmani/action" className={styles.textLink}>{content.codeLink} <i className="bi bi-arrow-right" aria-hidden="true" /></Link>
          </div>
          <pre className={styles.codeBlock}><code>{`const updateSettings = gate.action({
  name: "guild.settings.update",
  parse: parseSettings,
  resource: ({ guildId }) => ({
    type: "guild",
    id: guildId,
  }),
  authorize: canManageGuild,
  transaction: { required: true, isolation: "serializable" },
  execute: saveSettings,
  invalidate: ({ guildId }) => [\`guild:\${guildId}:settings\`],
});`}</code></pre>
        </div>
      </div>
    </section>
  );
}

function PlaygroundSection({content}) {
  return (
    <section className={styles.playgroundSection}>
      <div className="container">
        <div className={styles.playgroundHeading}>
          <div>
            <span className={styles.kicker}>{content.consoleKicker}</span>
            <Heading as="h2">{content.consoleTitle}</Heading>
          </div>
          <p>{content.consoleText}</p>
        </div>
        <CommandPlayground compact />
        <div className={styles.playgroundFooter}>
          <Link to="/docs/araclar/dogrulama-konsolu">{content.consoleLink} <i className="bi bi-arrow-right" aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const {i18n} = useDocusaurusContext();
  const locale = i18n.currentLocale === 'en' ? 'en' : 'tr';
  const content = CONTENT[locale];

  return (
    <Layout title={content.layoutTitle} description={content.layoutDescription}>
      <HomepageHeader content={content} />
      <main>
        <FeatureSection content={content} />
        <CodeSection content={content} />
        <PlaygroundSection content={content} />
      </main>
    </Layout>
  );
}
