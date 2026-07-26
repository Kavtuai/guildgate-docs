import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

const features = [
  {number: '01', title: 'Sunucu tarafında kalır', text: 'Oturum, CSRF, origin denetimi ve yetki kararları tarayıcıya bırakılmaz.'},
  {number: '02', title: 'Uygulamana uyum sağlar', text: 'Veritabanını, arayüzü ve web çatısını sen seçersin. GuildGate güvenlik sözleşmesini kurar.'},
  {number: '03', title: 'Dağıtık çalışmaya hazırdır', text: 'Geçici kayıtları Redis’e taşıyabilir, kalıcı kayıtları kendi veritabanında tutabilirsin.'},
];

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.hero}>
      <div className="container">
        <div className={styles.heroGrid}>
          <div>
            <div className={styles.eyebrow}>@kavtuai/guildgate · v0.1.0</div>
            <Heading as="h1" className={styles.title}>{siteConfig.title}</Heading>
            <p className={styles.subtitle}>Discord bot yönetim panellerinde oturum, OAuth, CSRF, yetkilendirme ve kontrollü yazma işlemlerini tek yerde toplar.</p>
            <div className={styles.actions}>
              <Link className={clsx('button button--primary button--lg', styles.primaryButton)} to="/docs/baslangic/kurulum">Kuruluma geç</Link>
              <Link className={clsx('button button--secondary button--lg', styles.secondaryButton)} to="/docs/giris">Nasıl çalıştığını oku</Link>
            </div>
            <div className={styles.install}><span>$</span><code>npm install @kavtuai/guildgate</code></div>
          </div>
          <div className={styles.gateVisual} aria-hidden="true">
            <div className={styles.gateFrame}><div className={styles.gateDoor}><span>GG</span></div></div>
            <div className={styles.orbitOne}></div><div className={styles.orbitTwo}></div>
          </div>
        </div>
      </div>
    </header>
  );
}

function FeatureSection() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.sectionHeading}>
          <span>Çekirdek yaklaşım</span>
          <Heading as="h2">Güvenlik kurallarını dağınık ara katmanlardan çıkar.</Heading>
        </div>
        <div className={styles.featureGrid}>
          {features.map((feature) => (
            <article key={feature.number} className={styles.feature}>
              <span>{feature.number}</span><Heading as="h3">{feature.title}</Heading><p>{feature.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickStart() {
  return (
    <section className={styles.quickStart}>
      <div className="container">
        <div className={styles.quickGrid}>
          <div>
            <span className={styles.kicker}>Beş dakikalık başlangıç</span>
            <Heading as="h2">Önce sınırları kur, sonra uç noktayı yaz.</Heading>
            <p>GuildGate bir yönetim paneli üretmez. Mevcut Fastify veya Express sunucuna eklenir; oturum ve yazma kurallarını aynı sözleşmeye bağlar.</p>
            <Link to="/docs/baslangic/ilk-yapilandirma" className={styles.textLink}>İlk yapılandırmayı aç →</Link>
          </div>
          <pre className={styles.codeBlock}><code>{`const gate = createGuildGate({\n  app,\n  owners,\n  locale,\n  security,\n  stores,\n});`}</code></pre>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <Layout title="Discord yönetim paneli güvenlik çekirdeği" description="GuildGate 0.1.0 Türkçe dokümantasyonu">
      <HomepageHeader />
      <main><FeatureSection /><QuickStart /></main>
    </Layout>
  );
}
