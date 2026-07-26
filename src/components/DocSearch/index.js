import React, {useEffect, useMemo, useRef, useState} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import searchIndex from '../../data/search-index.json';
import styles from './styles.module.css';

const COPY = {
  tr: {
    button: 'Ara',
    dialog: 'Dokümanlarda ara',
    placeholder: 'Kurulum, OAuth, CSRF, store, realtime…',
    close: 'Kapat',
    allLanguages: 'Tüm diller',
    turkish: 'Türkçe',
    english: 'English',
    allSections: 'Tüm bölümler',
    results: (count) => `${count} sonuç`,
    noResults: 'Bu ifadeyle eşleşen bir belge bulunamadı.',
    hint: 'Başlık, bölüm adı ve belge metninde arar.',
    keyboard: 'Ctrl K',
    open: 'Aramayı aç',
    language: 'Dil',
    section: 'Bölüm',
    currentLanguage: 'Bu dil',
    suggested: 'Hızlı bağlantılar',
  },
  en: {
    button: 'Search',
    dialog: 'Search the documentation',
    placeholder: 'Installation, OAuth, CSRF, stores, realtime…',
    close: 'Close',
    allLanguages: 'All languages',
    turkish: 'Türkçe',
    english: 'English',
    allSections: 'All sections',
    results: (count) => `${count} results`,
    noResults: 'No documentation matched that search.',
    hint: 'Searches titles, section names and document text.',
    keyboard: 'Ctrl K',
    open: 'Open search',
    language: 'Language',
    section: 'Section',
    currentLanguage: 'Current language',
    suggested: 'Quick links',
  },
};

const QUICK_ROUTES = new Set([
  'tr:giris',
  'tr:baslangic/kurulum',
  'tr:baslangic/bes-dakikada-basla',
  'tr:referans/public-api',
  'tr:araclar/dogrulama-konsolu',
  'en:giris',
  'en:baslangic/kurulum',
  'en:baslangic/bes-dakikada-basla',
  'en:referans/public-api',
  'en:araclar/dogrulama-konsolu',
]);

function normalize(value) {
  return String(value ?? '')
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ı', 'i')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s./_-]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

function scoreEntry(entry, query, currentLocale) {
  if (!query) return QUICK_ROUTES.has(entry.id) ? 100 : 0;
  const tokens = normalize(query).split(' ').filter(Boolean);
  const title = normalize(entry.title);
  const description = normalize(entry.description);
  const category = normalize(entry.category);
  const headings = normalize(entry.headings.join(' '));
  const content = normalize(entry.content);
  let score = entry.locale === currentLocale ? 5 : 0;

  for (const token of tokens) {
    if (title === token) score += 60;
    else if (title.startsWith(token)) score += 38;
    else if (title.includes(token)) score += 28;
    if (category.includes(token)) score += 14;
    if (headings.includes(token)) score += 12;
    if (description.includes(token)) score += 8;
    if (content.includes(token)) score += 3;
  }

  return score;
}

export default function DocSearch() {
  const {i18n, siteConfig} = useDocusaurusContext();
  const currentLocale = i18n.currentLocale === 'en' ? 'en' : 'tr';
  const text = COPY[currentLocale];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState(currentLocale);
  const [category, setCategory] = useState('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    setLanguage(currentLocale);
  }, [currentLocale]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const categories = useMemo(() => {
    const pool = searchIndex.filter((entry) => language === 'all' || entry.locale === language);
    return [...new Set(pool.map((entry) => entry.category))].sort((a, b) => a.localeCompare(b, currentLocale));
  }, [language, currentLocale]);

  const results = useMemo(() => {
    const normalizedQuery = normalize(query);
    return searchIndex
      .filter((entry) => language === 'all' || entry.locale === language)
      .filter((entry) => category === 'all' || entry.category === category)
      .map((entry) => ({...entry, score: scoreEntry(entry, normalizedQuery, currentLocale)}))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, currentLocale))
      .slice(0, 12);
  }, [query, language, category, currentLocale]);

  useEffect(() => {
    setCategory('all');
  }, [language]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, language, category]);

  const close = () => {
    setOpen(false);
    setQuery('');
    setCategory('all');
    setLanguage(currentLocale);
  };

  const onInputKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault();
      const base = siteConfig.baseUrl === '/' ? '' : siteConfig.baseUrl.replace(/\/$/u, '');
      window.location.assign(`${base}${results[activeIndex].route}`);
    }
  };

  return (
    <>
      <button type="button" className={styles.trigger} onClick={() => setOpen(true)} aria-label={text.open}>
        <i className="bi bi-search" aria-hidden="true" />
        <span className={styles.triggerLabel}>{text.button}</span>
        <kbd>{text.keyboard}</kbd>
      </button>

      {open && (
        <div className={styles.overlay} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}>
          <section className={styles.dialog} role="dialog" aria-modal="true" aria-label={text.dialog}>
            <div className={styles.searchRow}>
              <i className="bi bi-search" aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder={text.placeholder}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck="false"
                aria-label={text.dialog}
              />
              <button type="button" onClick={close} aria-label={text.close}><i className="bi bi-x-lg" aria-hidden="true" /></button>
            </div>

            <div className={styles.filters}>
              <div className={styles.languageFilters} aria-label={text.language}>
                <button type="button" className={language === currentLocale ? styles.activeFilter : ''} onClick={() => setLanguage(currentLocale)}>{text.currentLanguage}</button>
                <button type="button" className={language === (currentLocale === 'tr' ? 'en' : 'tr') ? styles.activeFilter : ''} onClick={() => setLanguage(currentLocale === 'tr' ? 'en' : 'tr')}>{currentLocale === 'tr' ? text.english : text.turkish}</button>
                <button type="button" className={language === 'all' ? styles.activeFilter : ''} onClick={() => setLanguage('all')}>{text.allLanguages}</button>
              </div>
              <label className={styles.categoryFilter}>
                <span className={styles.srOnly}>{text.section}</span>
                <select value={category} onChange={(event) => setCategory(event.target.value)}>
                  <option value="all">{text.allSections}</option>
                  {categories.map((item) => <option value={item} key={item}>{item}</option>)}
                </select>
              </label>
            </div>

            <div className={styles.resultMeta}>
              <span>{query ? text.results(results.length) : text.suggested}</span>
              <span>{text.hint}</span>
            </div>

            <div className={styles.results} role="listbox" aria-label={text.results(results.length)}>
              {results.map((result, index) => (
                <Link
                  key={result.id}
                  to={result.route}
                  className={`${styles.result} ${index === activeIndex ? styles.activeResult : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={close}
                  role="option"
                  aria-selected={index === activeIndex}>
                  <span className={styles.resultIcon}><i className="bi bi-file-earmark-text" aria-hidden="true" /></span>
                  <span className={styles.resultCopy}>
                    <strong>{result.title}</strong>
                    <small>{result.description}</small>
                    <span className={styles.resultDetails}><span>{result.category}</span><span>{result.locale === 'tr' ? 'TR' : 'EN'}</span></span>
                  </span>
                  <i className="bi bi-arrow-right" aria-hidden="true" />
                </Link>
              ))}
              {results.length === 0 && <div className={styles.empty}><i className="bi bi-search" aria-hidden="true" /><p>{text.noResults}</p></div>}
            </div>

            <div className={styles.shortcutBar}>
              <span><kbd>↑</kbd><kbd>↓</kbd> {currentLocale === 'en' ? 'Navigate' : 'Gezin'}</span>
              <span><kbd>Enter</kbd> {currentLocale === 'en' ? 'Open' : 'Aç'}</span>
              <span><kbd>Esc</kbd> {text.close}</span>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
