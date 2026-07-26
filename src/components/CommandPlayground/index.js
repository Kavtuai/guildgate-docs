import React, {useMemo, useRef, useState} from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {commandEngineLimits, executeCommand} from '../../lib/command-engine.mjs';
import styles from './styles.module.css';

const COPY = {
  tr: {
    title: 'Doğrulama konsolu',
    notice: 'Bu konsol bir kabuk açmaz ve girdini sunucuya göndermez. GuildGate’in belgelenmiş karar kurallarını tarayıcıda kontrol eder.',
    ready: 'Konsol hazır.',
    readyDetail: '`help` ile komutları aç veya aşağıdaki örneklerden birini seç.',
    quick: 'Hazır komutlar',
    empty: 'Konsol temiz.',
    input: 'Doğrulama komutu',
    run: 'Kontrol et',
    clear: 'Temizle',
    rate: 'Dakikalık konsol sınırına ulaştın. Kısa bir süre sonra tekrar dene.',
    status: (maxLength, maxPerMinute) => `${maxLength} karakter · ${maxPerMinute}/dk · ağ isteği yok`,
  },
  en: {
    title: 'Verification console',
    notice: 'This console does not open a shell or send your input to a server. It checks GuildGate’s documented decision rules in your browser.',
    ready: 'Console ready.',
    readyDetail: 'Run `help` or choose one of the examples below.',
    quick: 'Ready commands',
    empty: 'Console cleared.',
    input: 'Verification command',
    run: 'Check',
    clear: 'Clear',
    rate: 'You reached the console limit for this minute. Try again shortly.',
    status: (maxLength, maxPerMinute) => `${maxLength} characters · ${maxPerMinute}/min · no network requests`,
  },
};

const QUICK_COMMANDS = [
  'doctor',
  'config check --preset production',
  'session policy --ttl 86400000 --idle 1800000 --rotate 900000 --max 5',
  'store check --session persistent --oauth persistent --rate redis --lock redis --audit persistent',
  'action test guild.settings.update --method PATCH --origin https://panel.example.com --session valid --csrf valid --permission MANAGE_GUILD --bot-permission VIEW_CHANNEL',
  'realtime check --transport websocket --sequence 42 --resume 40',
];

function makeEntry(command, lines) {
  return {id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, command, lines};
}

export default function CommandPlayground({compact = false}) {
  const {i18n} = useDocusaurusContext();
  const locale = i18n.currentLocale === 'en' ? 'en' : 'tr';
  const text = COPY[locale];
  const [input, setInput] = useState('doctor');
  const [history, setHistory] = useState(() => [
    {
      id: 'welcome',
      command: '',
      lines: [
        {text: text.ready, tone: 'success'},
        {text: text.readyDetail, tone: 'info'},
      ],
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const commandHistory = useRef([]);
  const runTimes = useRef([]);
  const inputRef = useRef(null);

  const statusText = useMemo(
    () => text.status(commandEngineLimits.maxCommandLength, commandEngineLimits.maxCommandsPerMinute),
    [text],
  );

  const run = (commandValue = input) => {
    const command = commandValue.trim();
    const now = Date.now();
    runTimes.current = runTimes.current.filter((timestamp) => now - timestamp < 60_000);

    if (runTimes.current.length >= commandEngineLimits.maxCommandsPerMinute) {
      setHistory((current) => [
        ...current.slice(-59),
        makeEntry(command, [{text: text.rate, tone: 'error'}]),
      ]);
      return;
    }

    runTimes.current.push(now);
    const result = executeCommand(command, {locale});
    if (result.clear) {
      setHistory([]);
      setInput('');
      return;
    }

    setHistory((current) => [...current.slice(-59), makeEntry(result.command, result.lines)]);
    if (command && commandHistory.current.at(-1) !== command) {
      commandHistory.current.push(command);
      commandHistory.current = commandHistory.current.slice(-30);
    }
    setHistoryIndex(-1);
    setInput('');
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      run();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const nextIndex = Math.min(historyIndex + 1, commandHistory.current.length - 1);
      if (nextIndex >= 0) {
        setHistoryIndex(nextIndex);
        setInput(commandHistory.current[commandHistory.current.length - 1 - nextIndex]);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = historyIndex - 1;
      if (nextIndex < 0) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(nextIndex);
        setInput(commandHistory.current[commandHistory.current.length - 1 - nextIndex]);
      }
    }
  };

  const useQuickCommand = (command) => {
    setInput(command);
    inputRef.current?.focus();
  };

  return (
    <section className={clsx(styles.shell, compact && styles.compact)} aria-label={text.title}>
      <div className={styles.topbar}>
        <div className={styles.brandMark} aria-hidden="true"><i className="bi bi-terminal" /></div>
        <div className={styles.title}>{text.title}</div>
      </div>

      <div className={styles.notice}>
        <i className="bi bi-info-circle" aria-hidden="true" />
        <span>{text.notice}</span>
      </div>

      {!compact && (
        <div className={styles.quickCommands} aria-label={text.quick}>
          {QUICK_COMMANDS.map((command) => (
            <button type="button" key={command} onClick={() => useQuickCommand(command)}>
              <i className="bi bi-arrow-return-right" aria-hidden="true" />
              <span>{command}</span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.output} role="log" aria-live="polite">
        {history.length === 0 && <div className={styles.empty}>{text.empty}</div>}
        {history.map((entry) => (
          <div className={styles.entry} key={entry.id}>
            {entry.command && <div className={styles.commandLine}><span>›</span><code>{entry.command}</code></div>}
            <div className={styles.resultLines}>
              {entry.lines.map((item, index) => (
                <div className={clsx(styles.resultLine, styles[item.tone] ?? styles.normal)} key={`${entry.id}-${index}`}>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.inputRow}>
        <span className={styles.prompt} aria-hidden="true">›</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          maxLength={commandEngineLimits.maxCommandLength}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          aria-label={text.input}
          placeholder="help"
        />
        <button type="button" onClick={() => run()} aria-label={text.run}>
          <i className="bi bi-play-fill" aria-hidden="true" />
          {text.run}
        </button>
      </div>

      <div className={styles.footerLine}>
        <span><i className="bi bi-lock" aria-hidden="true" /> {statusText}</span>
        <button type="button" onClick={() => run('clear')}><i className="bi bi-trash3" aria-hidden="true" /> {text.clear}</button>
      </div>
    </section>
  );
}
