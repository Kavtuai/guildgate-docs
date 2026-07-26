import React, {useMemo, useRef, useState} from 'react';
import clsx from 'clsx';
import {commandEngineLimits, executeCommand} from '../../lib/command-engine.mjs';
import styles from './styles.module.css';

const QUICK_COMMANDS = [
  'doctor',
  'config check --preset production',
  'origin check https://panel.example.com',
  'action test guild.settings.update --method PATCH --origin https://panel.example.com --session valid --csrf valid --permission MANAGE_GUILD --bot-permission VIEW_CHANNEL',
];

function makeEntry(command, lines) {
  return {id: `${Date.now()}-${Math.random()}`, command, lines};
}

export default function CommandPlayground({compact = false}) {
  const [input, setInput] = useState('doctor');
  const [history, setHistory] = useState(() => [
    {
      id: 'welcome',
      command: '',
      lines: [
        {text: 'GuildGate komut laboratuvarı hazır.', tone: 'success'},
        {text: 'Komutlar tarayıcıda, sabit bir izin listesiyle simüle edilir.', tone: 'info'},
        {text: 'Komut listesini görmek için help yaz.', tone: 'normal'},
      ],
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const commandHistory = useRef([]);
  const runTimes = useRef([]);
  const inputRef = useRef(null);

  const statusText = useMemo(
    () => `${commandEngineLimits.maxCommandLength} karakter · ${commandEngineLimits.maxCommandsPerMinute}/dk · ağ erişimi yok`,
    [],
  );

  const run = (commandValue = input) => {
    const command = commandValue.trim();
    const now = Date.now();
    runTimes.current = runTimes.current.filter((timestamp) => now - timestamp < 60_000);

    if (runTimes.current.length >= commandEngineLimits.maxCommandsPerMinute) {
      setHistory((current) => [
        ...current.slice(-79),
        makeEntry(command, [{text: 'Dakikalık yerel sınır aşıldı. Biraz bekleyip tekrar dene.', tone: 'error'}]),
      ]);
      return;
    }

    runTimes.current.push(now);
    const result = executeCommand(command);
    if (result.clear) {
      setHistory([]);
      setInput('');
      return;
    }

    setHistory((current) => [...current.slice(-79), makeEntry(result.command, result.lines)]);
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
    <section className={clsx(styles.shell, compact && styles.compact)} aria-label="GuildGate komut laboratuvarı">
      <div className={styles.topbar}>
        <div className={styles.windowDots} aria-hidden="true"><span /><span /><span /></div>
        <div className={styles.title}><i className="bi bi-terminal" aria-hidden="true" /> Komut laboratuvarı</div>
        <div className={styles.isolation}><i className="bi bi-shield-check" aria-hidden="true" /> Yerel simülasyon</div>
      </div>

      <div className={styles.notice}>
        <i className="bi bi-info-circle" aria-hidden="true" />
        <span>Bu alan gerçek kabuk komutu, JavaScript kodu veya ağ isteği çalıştırmaz. Yalnızca belgelenmiş GuildGate senaryolarını sınar.</span>
      </div>

      {!compact && (
        <div className={styles.quickCommands} aria-label="Hazır komutlar">
          {QUICK_COMMANDS.map((command) => (
            <button type="button" key={command} onClick={() => useQuickCommand(command)}>
              <i className="bi bi-lightning-charge" aria-hidden="true" />
              <span>{command}</span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.output} role="log" aria-live="polite">
        {history.length === 0 && <div className={styles.empty}>Terminal temizlendi.</div>}
        {history.map((entry) => (
          <div className={styles.entry} key={entry.id}>
            {entry.command && <div className={styles.commandLine}><span>$</span><code>{entry.command}</code></div>}
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
        <span className={styles.prompt} aria-hidden="true">$</span>
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
          aria-label="Test komutu"
          placeholder="help"
        />
        <button type="button" onClick={() => run()} aria-label="Komutu çalıştır">
          <i className="bi bi-play-fill" aria-hidden="true" />
          Çalıştır
        </button>
      </div>

      <div className={styles.footerLine}>
        <span><i className="bi bi-lock" aria-hidden="true" /> {statusText}</span>
        <button type="button" onClick={() => run('clear')}><i className="bi bi-trash3" aria-hidden="true" /> Temizle</button>
      </div>
    </section>
  );
}
