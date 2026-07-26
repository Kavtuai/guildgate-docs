import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import CommandPlayground from '../components/CommandPlayground';
import styles from './index.module.css';

const features = [
  {
    icon: 'bi-person-lock',
    title: 'Oturum sunucuda tutulur',
    text: 'Tarayıcıda rol ve yetki taşıyan okunabilir belirteçler yerine iptal edilebilir opak oturumlar kullanılır.',
  },
  {
    icon: 'bi-shield-check',
    title: 'Yazma isteği tek yerde denetlenir',
    text: 'Origin, CSRF, hız sınırı, yetki ve kaynak kilidi aynı işlem tanımında görünür.',
  },
  {
    icon: 'bi-database-lock',
    title: 'Depo seçimi sende kalır',
    text: 'Kısa ömürlü kayıtları Redis’e, kalıcı kayıtları kendi veritabanına bağlayabilirsin.',
  },
];

const checks = [
  ['Origin', 'Tam eşleşme', 'bi-globe2'],
  ['Oturum', 'Geçerli', 'bi-person-check'],
  ['CSRF', 'Doğrulandı', 'bi-key'],
  ['Yetki', 'MANAGE_GUILD', 'bi-patch-check'],
];

function SecurityVisual() {
  return (
    <div className={styles.securityVisual} aria-label="Korunan istek denetimi örneği">
      <div className={styles.visualGlow} aria-hidden="true" />
      <div className={styles.requestBadge}>
        <span>PATCH</span>
        <code>/guilds/42/settings</code>
      </div>
      <div className={styles.securityPanel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.panelEyebrow}>guild.settings.update</span>
            <strong>İstek denetimi</strong>
          </div>
          <span className={styles.liveState}><i className="bi bi-circle-fill" /> çalışıyor</span>
        </div>
        <div className={styles.checkList}>
          {checks.map(([label, value, icon], index) => (
            <div className={styles.checkRow} style={{'--delay': `${index * 140}ms`}} key={label}>
              <span className={styles.checkIcon}><i className={`bi ${icon}`} /></span>
              <span>{label}</span>
              <strong>{value}</strong>
              <i className="bi bi-check-circle-fill" aria-hidden="true" />
            </div>
          ))}
        </div>
        <div className={styles.panelResult}>
          <i className="bi bi-check2-circle" aria-hidden="true" />
          <div><strong>İşlem çalıştırıldı</strong><span>Denetim kaydı yazıldı · 84 ms</span></div>
        </div>
      </div>
      <div className={styles.connectionLine} aria-hidden="true"><span /></div>
    </div>
  );
}

function HomepageHeader() {
  return (
    <header className={styles.hero}>
      <div className="container">
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}><i className="bi bi-box-seam" /> @kavtuai/guildgate · 0.1.0</div>
            <Heading as="h1" className={styles.title}>Dashboard güvenliğini uç noktalara dağıtma.</Heading>
            <p className={styles.subtitle}>GuildGate; Discord OAuth, oturum, CSRF, origin ve yetki kontrollerini sunucu tarafında ortak bir işlem düzenine bağlar. Arayüzünü ve veri katmanını değiştirmez.</p>
            <div className={styles.actions}>
              <Link className={clsx('button button--primary button--lg', styles.primaryButton)} to="/docs/baslangic/kurulum">
                <i className="bi bi-arrow-right-circle" aria-hidden="true" /> Kuruluma geç
              </Link>
              <Link className={clsx('button button--secondary button--lg', styles.secondaryButton)} to="/docs/araclar/komut-laboratuvari">
                <i className="bi bi-terminal" aria-hidden="true" /> Komutları dene
              </Link>
            </div>
            <div className={styles.installLine}>
              <span><i className="bi bi-terminal-fill" /></span>
              <code>npm install @kavtuai/guildgate</code>
              <button type="button" onClick={() => navigator.clipboard?.writeText('npm install @kavtuai/guildgate')} aria-label="Kurulum komutunu kopyala">
                <i className="bi bi-copy" aria-hidden="true" />
              </button>
            </div>
          </div>
          <SecurityVisual />
        </div>
      </div>
    </header>
  );
}

function FeatureSection() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.sectionIntro}>
          <div>
            <span className={styles.kicker}>Neyi düzenler?</span>
            <Heading as="h2">Kontrol sırası kodda açıkça görünür.</Heading>
          </div>
          <p>Bir yazma isteği başarısız olduğunda hangi kontrolde durduğunu görebilirsin. Ürün kuralı yine uygulamana ait olur.</p>
        </div>
        <div className={styles.featureGrid}>
          {features.map((feature) => (
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

function CodeSection() {
  return (
    <section className={styles.codeSection}>
      <div className="container">
        <div className={styles.codeGrid}>
          <div className={styles.codeCopy}>
            <span className={styles.kicker}>İlk işlem</span>
            <Heading as="h2">Kaynağı, yetkiyi ve çalıştırma adımını aynı tanımda tut.</Heading>
            <p>Örnekteki işlem önce girdiyi daraltır, sonra hedef sunucuyu belirler. Kullanıcı yetkisi geçmezse kayıt işlemi çağrılmaz.</p>
            <Link to="/docs/istek-katmani/action" className={styles.textLink}>İşlem tanımını incele <i className="bi bi-arrow-right" /></Link>
          </div>
          <pre className={styles.codeBlock}><code>{`const updateSettings = gate.action({
  name: "guild.settings.update",
  parse: parseSettings,
  resource: (input) => ({
    type: "guild",
    id: input.guildId,
  }),
  authorize: canManageGuild,
  execute: saveSettings,
});`}</code></pre>
        </div>
      </div>
    </section>
  );
}

function PlaygroundSection() {
  return (
    <section className={styles.playgroundSection}>
      <div className="container">
        <div className={styles.playgroundHeading}>
          <div>
            <span className={styles.kicker}>Tarayıcı içi deneme</span>
            <Heading as="h2">Kontrollerin hangi sırada çalıştığını komutla gör.</Heading>
          </div>
          <p>Laboratuvar gerçek sunucuya bağlanmaz. Sabit komut listesi üzerinden örnek ortam, origin, yetki ve istek sınırı sonuçlarını üretir.</p>
        </div>
        <CommandPlayground compact />
        <div className={styles.playgroundFooter}>
          <Link to="/docs/araclar/komut-laboratuvari">Tüm komutları ve güvenlik sınırlarını aç <i className="bi bi-arrow-right" /></Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <Layout title="Discord yönetim paneli güvenlik çekirdeği" description="GuildGate Türkçe kurulum, güvenlik ve API belgeleri">
      <HomepageHeader />
      <main>
        <FeatureSection />
        <CodeSection />
        <PlaygroundSection />
      </main>
    </Layout>
  );
}
