import {releaseMetadata} from '../data/release-metadata.mjs';
const MAX_COMMAND_LENGTH = 240;
const MAX_COMMANDS_PER_MINUTE = 20;
const MAX_TOKENS = 32;
const MAX_TOKEN_LENGTH = 160;
const MAX_FLAGS = 16;
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const BLOCKED_TOKENS = ['&&', '||', ';', '|', '>', '<', '`', '$(', '${', '\u0000'];
const SECRET_PATTERNS = [
  /\b(?:ghp|gho|github_pat)_[A-Za-z0-9_]{16,}\b/u,
  /\bsk-[A-Za-z0-9_-]{20,}\b/u,
  /\bmfa\.[A-Za-z0-9_-]{20,}\b/u,
  /\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{20,}\b/u,
  /\b(?:Bot|Bearer)\s+[A-Za-z0-9._~-]{20,}\b/iu,
];

const ACTION_POLICIES = new Map([
  ['guild.settings.update', {
    method: 'PATCH',
    userPermission: 'MANAGE_GUILD',
    botPermission: 'VIEW_CHANNEL',
    resource: 'guild:42',
  }],
  ['guild.role.create', {
    method: 'POST',
    userPermission: 'MANAGE_ROLES',
    botPermission: 'MANAGE_ROLES',
    resource: 'guild:42',
  }],
  ['guild.member.timeout', {
    method: 'POST',
    userPermission: 'MODERATE_MEMBERS',
    botPermission: 'MODERATE_MEMBERS',
    resource: 'guild:42/member:84',
  }],
]);

const ALLOWED_PERMISSIONS = new Set([
  'MANAGE_GUILD',
  'MANAGE_ROLES',
  'MODERATE_MEMBERS',
  'VIEW_CHANNEL',
]);

const SAFE_ORIGINS = new Set([
  'https://panel.example.com',
  'http://localhost:3000',
]);

const TEXT = {
  tr: {
    empty: 'Bir komut yaz.',
    tooLong: `Komut ${MAX_COMMAND_LENGTH} karakteri aşamaz.`,
    singleLine: 'Konsol tek satırlık komut kabul eder.',
    blockedSyntax: 'Kabuk operatörleri ve yönlendirme karakterleri burada kapalıdır.',
    secret: 'Bu girdi bir erişim anahtarı veya belirteç içeriyor olabilir. Gizli değerleri konsola yapıştırma.',
    unknown: (command) => `Komut bulunamadı: ${command || '—'}`,
    useHelp: '`help` komutu kullanılabilir seçenekleri listeler.',
    helpTitle: 'Komutlar',
    examplesTitle: 'Örnekler',
    doctorTitle: 'Yapılandırma özeti',
    configTitle: (preset) => `${preset} profili`,
    originTitle: (origin) => `Origin: ${origin}`,
    actionTitle: (name) => `İşlem: ${name}`,
    rateTitle: 'İstek sınırı sonucu',
    sessionTitle: 'Oturum politikası',
    storeTitle: 'Depo yerleşimi',
    realtimeTitle: 'Gerçek zamanlı bağlantı',
    securityTitle: (topic) => `Güvenlik notu: ${topic}`,
    usage: 'Kullanım',
    valid: 'Geçerli',
    invalid: 'Geçersiz',
    passed: 'Kontrol geçti.',
    denied: 'İstek reddedildi.',
    allowed: 'İstek işleme alınabilir.',
  },
  en: {
    empty: 'Enter a command.',
    tooLong: `Commands cannot exceed ${MAX_COMMAND_LENGTH} characters.`,
    singleLine: 'The console accepts one line at a time.',
    blockedSyntax: 'Shell operators and redirection characters are disabled here.',
    secret: 'This input may contain an access key or token. Do not paste secrets into the console.',
    unknown: (command) => `Command not found: ${command || '—'}`,
    useHelp: 'Run `help` to list the available commands.',
    helpTitle: 'Commands',
    examplesTitle: 'Examples',
    doctorTitle: 'Configuration summary',
    configTitle: (preset) => `${preset} profile`,
    originTitle: (origin) => `Origin: ${origin}`,
    actionTitle: (name) => `Action: ${name}`,
    rateTitle: 'Rate-limit result',
    sessionTitle: 'Session policy',
    storeTitle: 'Store layout',
    realtimeTitle: 'Realtime connection',
    securityTitle: (topic) => `Security note: ${topic}`,
    usage: 'Usage',
    valid: 'Valid',
    invalid: 'Invalid',
    passed: 'Check passed.',
    denied: 'Request denied.',
    allowed: 'The request may proceed.',
  },
};

function localeOf(value) {
  return value === 'en' ? 'en' : 'tr';
}

function line(text, tone = 'normal') {
  return {text, tone};
}

function tokenize(input) {
  const tokens = [];
  let current = '';
  let quote = null;
  let escaped = false;

  for (const character of input) {
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }
    if (character === '\\' && quote) {
      escaped = true;
      continue;
    }
    if (quote) {
      if (character === quote) quote = null;
      else current += character;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (/\s/u.test(character)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }
    current += character;
    if (current.length > MAX_TOKEN_LENGTH) throw new Error('TOKEN_TOO_LONG');
  }

  if (escaped || quote) throw new Error('UNTERMINATED_QUOTE');
  if (current) tokens.push(current);
  if (tokens.length > MAX_TOKENS) throw new Error('TOO_MANY_TOKENS');
  return tokens;
}

function parseFlags(tokens) {
  const args = [];
  const flags = new Map();

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith('--')) {
      args.push(token);
      continue;
    }

    const name = token.slice(2);
    if (flags.size >= MAX_FLAGS || DANGEROUS_KEYS.has(name) || !/^[a-z][a-z0-9-]{0,63}$/u.test(name)) throw new Error('INVALID_FLAG');
    const next = tokens[index + 1];
    if (!name || !next || next.startsWith('--')) {
      flags.set(name, true);
      continue;
    }

    if (next.length > MAX_TOKEN_LENGTH) throw new Error('TOKEN_TOO_LONG');
    flags.set(name, next);
    index += 1;
  }

  return {args, flags};
}

function rejectUnsafeInput(input, locale) {
  const t = TEXT[locale];
  if (!input) return t.empty;
  if (input.length > MAX_COMMAND_LENGTH) return t.tooLong;
  if (/\r|\n|\t/u.test(input)) return t.singleLine;
  if (BLOCKED_TOKENS.some((token) => input.includes(token))) return t.blockedSyntax;
  if (SECRET_PATTERNS.some((pattern) => pattern.test(input))) return t.secret;
  if (/(?:^|\s)(?:__proto__|constructor|prototype)(?:\s|$|\.)/iu.test(input)) return locale === 'en' ? 'Unsafe object keys are not accepted.' : 'Güvensiz obje anahtarları kabul edilmez.';
  return null;
}

function helpOutput(locale) {
  if (locale === 'en') {
    return [
      line(TEXT.en.helpTitle, 'heading'),
      line('help                                      List commands'),
      line('version                                   Show the documented package version'),
      line('contracts                                 Show contract markers'),
      line('exports                                   List public export paths'),
      line('doctor [--json]                           Review a reference deployment profile'),
      line('config check --preset NAME                Check development or production rules'),
      line('origin check URL                          Test an exact origin match'),
      line('session policy [flags]                    Review TTL, idle, rotation and session caps'),
      line('store check [flags]                       Review store placement'),
      line('store list|contract                       Review 1.1 store capabilities'),
      line('idempotency reservation                   Explain reservation ownership'),
      line('transaction finality                      Explain commit finality'),
      line('deadline settlement                       Explain bounded late settlement'),
      line('action test NAME [flags]                  Walk through a protected write'),
      line('rate-limit test --requests N --limit N    Check a fixed-window result'),
      line('realtime check [flags]                    Check resume and sequence handling'),
      line('realtime limits|transports|replay         Review realtime 1.1 behavior'),
      line('cli doctor|writing-check|migration        Show installed CLI help summary'),
      line('security explain TOPIC                    Explain csrf, origin, session or locks'),
      line('examples                                  Show ready-to-run examples'),
      line('clear                                     Clear the console'),
    ];
  }

  return [
    line(TEXT.tr.helpTitle, 'heading'),
    line('help                                      Komutları listeler'),
    line('version                                   Belgelenen paket sürümünü gösterir'),
    line('contracts                                 Sözleşme işaretlerini gösterir'),
    line('exports                                   Public export yollarını listeler'),
    line('doctor [--json]                           Örnek üretim profilini inceler'),
    line('config check --preset NAME                development veya production kurallarını denetler'),
    line('origin check URL                          Tam origin eşleşmesini sınar'),
    line('session policy [flags]                    TTL, boşta kalma, yenileme ve oturum sınırını inceler'),
    line('store check [flags]                       Depo yerleşimini inceler'),
    line('store list|contract                       1.1 store yeteneklerini inceler'),
    line('idempotency reservation                   Reservation sahipliğini açıklar'),
    line('transaction finality                      Commit kesinliğini açıklar'),
    line('deadline settlement                       Sınırlı geç tamamlanmayı açıklar'),
    line('action test NAME [flags]                  Korunan bir yazma isteğini adım adım kontrol eder'),
    line('rate-limit test --requests N --limit N    Sabit pencere sonucunu hesaplar'),
    line('realtime check [flags]                    Sıra ve yeniden bağlanma değerlerini kontrol eder'),
    line('realtime limits|transports|replay         Realtime 1.1 davranışını inceler'),
    line('cli doctor|writing-check|migration        Kurulu CLI yardım özetini gösterir'),
    line('security explain TOPIC                    csrf, origin, session veya locks konusunu açıklar'),
    line('examples                                  Hazır örnekleri gösterir'),
    line('clear                                     Konsolu temizler'),
  ];
}

function examplesOutput(locale) {
  const commands = [
    'contracts',
    'exports',
    'doctor',
    'doctor --json',
    'config check --preset production',
    'origin check https://panel.example.com',
    'session policy --ttl 86400000 --idle 1800000 --rotate 900000 --max 5',
    'store check --session persistent --oauth persistent --rate redis --lock redis --audit persistent',
    'store contract',
    'idempotency reservation',
    'transaction finality',
    'deadline settlement',
    'action test guild.settings.update --method PATCH --origin https://panel.example.com --session valid --csrf valid --permission MANAGE_GUILD --bot-permission VIEW_CHANNEL',
    'rate-limit test --requests 8 --limit 5',
    'realtime check --transport socketio --sequence 42 --resume 40',
    'realtime transports',
    'cli migration',
    'security explain csrf',
  ];
  return [line(TEXT[locale].examplesTitle, 'heading'), ...commands.map((command) => line(command, 'code'))];
}

function doctorOutput(locale, jsonMode) {
  const report = {
    ok: false,
    package: '@kavtuai/guildgate',
    version: releaseMetadata.packageVersion,
    runtime: 'Node.js 22.x',
    profile: 'reference-production',
    checks: {
      httpsBaseUrl: 'pass',
      csrfSecret: 'pass',
      auditIpSalt: 'pass',
      allowedOrigins: 2,
      sessionStore: 'persistent',
      rateLimitStore: 'redis',
      lockStore: 'redis',
      oauthTokenKeyring: 'missing',
    },
    warnings: ['OAuth token keyring is required before Discord login is enabled.'],
  };

  if (jsonMode) {
    return JSON.stringify(report, null, 2).split('\n').map((text) => line(text, 'code'));
  }

  if (locale === 'en') {
    return [
      line(TEXT.en.doctorTitle, 'heading'),
      line(`✓ Package: ${releaseMetadata.packageName} ${releaseMetadata.packageVersion}`, 'success'),
      line('✓ Runtime: Node.js 22.x', 'success'),
      line('✓ HTTPS base URL and exact origin list', 'success'),
      line('✓ Persistent sessions, Redis rate limits and Redis locks', 'success'),
      line('! OAuth token keyring is missing', 'warning'),
      line('Add the keyring before enabling Discord login.', 'info'),
    ];
  }

  return [
    line(TEXT.tr.doctorTitle, 'heading'),
    line(`✓ Paket: ${releaseMetadata.packageName} ${releaseMetadata.packageVersion}`, 'success'),
    line('✓ Çalışma ortamı: Node.js 22.x', 'success'),
    line('✓ HTTPS temel adres ve tam origin listesi', 'success'),
    line('✓ Kalıcı oturum, Redis istek sınırı ve Redis kilidi', 'success'),
    line('! OAuth token anahtar halkası eksik', 'warning'),
    line('Discord girişini açmadan önce anahtar halkasını ekle.', 'info'),
  ];
}

function configOutput(locale, preset) {
  const t = TEXT[locale];
  if (!['development', 'production'].includes(preset)) {
    return [line(`${t.usage}: config check --preset development|production`, 'error')];
  }

  if (preset === 'development') {
    return locale === 'en'
      ? [
          line(t.configTitle(preset), 'heading'),
          line('✓ localhost may appear in the origin list', 'success'),
          line('✓ Memory stores are acceptable for tests', 'success'),
          line('✓ Secure cookies may be disabled on plain HTTP', 'success'),
          line('Use a production profile before deployment.', 'info'),
        ]
      : [
          line(t.configTitle(preset), 'heading'),
          line('✓ localhost origin listesinde bulunabilir', 'success'),
          line('✓ Bellek depoları testlerde kullanılabilir', 'success'),
          line('✓ Düz HTTP üzerinde Secure çerez kapatılabilir', 'success'),
          line('Dağıtımdan önce production profiline geç.', 'info'),
        ];
  }

  return locale === 'en'
    ? [
        line(t.configTitle(preset), 'heading'),
        line('✓ HTTPS base URL', 'success'),
        line('✓ No localhost origins', 'success'),
        line('✓ Secure, HttpOnly session cookie', 'success'),
        line('✓ Persistent session and OAuth stores', 'success'),
        line('✓ Redis namespaces separated by environment', 'success'),
        line(t.passed, 'success'),
      ]
    : [
        line(t.configTitle(preset), 'heading'),
        line('✓ HTTPS temel adres', 'success'),
        line('✓ Origin listesinde localhost yok', 'success'),
        line('✓ Secure ve HttpOnly oturum çerezi', 'success'),
        line('✓ Kalıcı oturum ve OAuth depoları', 'success'),
        line('✓ Redis ad alanları ortama göre ayrılmış', 'success'),
        line(t.passed, 'success'),
      ];
}

function originOutput(locale, value) {
  const t = TEXT[locale];
  let url;
  try {
    url = new URL(value);
  } catch {
    return [line(locale === 'en' ? 'Enter a valid HTTP or HTTPS URL.' : 'Geçerli bir HTTP veya HTTPS adresi gir.', 'error')];
  }

  if (!/^https?:$/u.test(url.protocol)) {
    return [line(locale === 'en' ? 'Only HTTP and HTTPS origins are supported.' : 'Yalnızca HTTP ve HTTPS origin değerleri desteklenir.', 'error')];
  }

  const origin = url.origin;
  if (SAFE_ORIGINS.has(origin)) {
    return [
      line(t.originTitle(origin), 'heading'),
      line(locale === 'en' ? '✓ Exact match found' : '✓ Tam eşleşme bulundu', 'success'),
      line(t.allowed, 'success'),
    ];
  }

  return [
    line(t.originTitle(origin), 'heading'),
    line(locale === 'en' ? '✕ No exact match in the allowlist' : '✕ İzin listesinde tam eşleşme yok', 'error'),
    line(t.denied, 'error'),
  ];
}

function actionOutput(locale, name, flags) {
  const t = TEXT[locale];
  const policy = ACTION_POLICIES.get(name);
  if (!policy) {
    return [
      line(locale === 'en' ? `Unknown action: ${name}` : `Bilinmeyen işlem: ${name}`, 'error'),
      line((locale === 'en' ? 'Available actions: ' : 'Kullanılabilir işlemler: ') + [...ACTION_POLICIES.keys()].join(', '), 'info'),
    ];
  }

  const method = String(flags.get('method') ?? policy.method).toUpperCase();
  const origin = String(flags.get('origin') ?? 'https://panel.example.com');
  const session = String(flags.get('session') ?? 'valid');
  const csrf = String(flags.get('csrf') ?? 'valid');
  const permission = String(flags.get('permission') ?? policy.userPermission).toUpperCase();
  const botPermission = String(flags.get('bot-permission') ?? policy.botPermission).toUpperCase();

  const result = [line(t.actionTitle(name), 'heading')];
  const fail = (message) => {
    result.push(line(`✕ ${message}`, 'error'));
    result.push(line(t.denied, 'error'));
    return result;
  };

  result.push(line(locale === 'en' ? '✓ Input matches the documented example schema' : '✓ Girdi belgelenen örnek şemayla eşleşti', 'success'));
  result.push(line((locale === 'en' ? '✓ Resource: ' : '✓ Kaynak: ') + policy.resource, 'success'));

  if (method !== policy.method) {
    return fail(locale === 'en'
      ? `Expected ${policy.method}; received ${method}.`
      : `${policy.method} bekleniyordu; ${method} geldi.`);
  }
  result.push(line((locale === 'en' ? '✓ Method: ' : '✓ Yöntem: ') + method, 'success'));

  let parsedOrigin;
  try {
    parsedOrigin = new URL(origin).origin;
  } catch {
    return fail(locale === 'en' ? 'Origin is not a valid URL.' : 'Origin geçerli bir URL değil.');
  }

  if (!SAFE_ORIGINS.has(parsedOrigin)) {
    return fail(locale === 'en' ? `Origin is not allowed: ${parsedOrigin}` : `Origin izin listesinde değil: ${parsedOrigin}`);
  }
  result.push(line(locale === 'en' ? '✓ Origin matched exactly' : '✓ Origin tam eşleşti', 'success'));

  if (session !== 'valid') {
    return fail(locale === 'en' ? 'The session is invalid or expired.' : 'Oturum geçersiz veya süresi dolmuş.');
  }
  result.push(line(locale === 'en' ? '✓ Session is active' : '✓ Oturum etkin', 'success'));

  if (csrf !== 'valid') {
    return fail(locale === 'en' ? 'The CSRF token does not match the session.' : 'CSRF belirteci oturumla eşleşmedi.');
  }
  result.push(line(locale === 'en' ? '✓ CSRF token matches the session' : '✓ CSRF belirteci oturumla eşleşti', 'success'));

  if (!ALLOWED_PERMISSIONS.has(permission) || permission !== policy.userPermission) {
    return fail(locale === 'en'
      ? `User permission must be ${policy.userPermission}; received ${permission}.`
      : `Kullanıcı izni ${policy.userPermission} olmalı; ${permission} geldi.`);
  }
  result.push(line((locale === 'en' ? '✓ User permission: ' : '✓ Kullanıcı izni: ') + permission, 'success'));

  if (!ALLOWED_PERMISSIONS.has(botPermission) || botPermission !== policy.botPermission) {
    return fail(locale === 'en'
      ? `Bot permission must be ${policy.botPermission}; received ${botPermission}.`
      : `Bot izni ${policy.botPermission} olmalı; ${botPermission} geldi.`);
  }
  result.push(line((locale === 'en' ? '✓ Bot permission: ' : '✓ Bot izni: ') + botPermission, 'success'));
  result.push(line(locale === 'en' ? '✓ Rate limit, idempotency key and resource lock are available' : '✓ İstek sınırı, idempotency anahtarı ve kaynak kilidi uygun', 'success'));
  result.push(line(t.allowed, 'success'));
  return result;
}

function rateLimitOutput(locale, flags) {
  const requests = Number(flags.get('requests') ?? 8);
  const limit = Number(flags.get('limit') ?? 5);
  if (!Number.isInteger(requests) || !Number.isInteger(limit) || requests < 1 || limit < 1 || requests > 50 || limit > 50) {
    return [line(locale === 'en' ? 'requests and limit must be integers from 1 to 50.' : 'requests ve limit 1 ile 50 arasında tam sayı olmalı.', 'error')];
  }

  const accepted = Math.min(requests, limit);
  const rejected = Math.max(0, requests - limit);
  return [
    line(TEXT[locale].rateTitle, 'heading'),
    line((locale === 'en' ? 'Accepted: ' : 'Kabul edilen: ') + accepted, 'success'),
    line((locale === 'en' ? 'Rejected: ' : 'Reddedilen: ') + rejected, rejected ? 'warning' : 'success'),
    line(locale === 'en'
      ? `${accepted} of ${requests} requests fit in the current window.`
      : `${requests} isteğin ${accepted} tanesi mevcut pencereye sığıyor.`, 'info'),
  ];
}

function sessionPolicyOutput(locale, flags) {
  const ttl = Number(flags.get('ttl') ?? 86_400_000);
  const idle = Number(flags.get('idle') ?? 1_800_000);
  const rotate = Number(flags.get('rotate') ?? 900_000);
  const maximum = Number(flags.get('max') ?? 5);
  const values = [ttl, idle, rotate, maximum];
  if (values.some((value) => !Number.isInteger(value) || value < 1)) {
    return [line(locale === 'en' ? 'All policy values must be positive integers.' : 'Tüm politika değerleri pozitif tam sayı olmalı.', 'error')];
  }
  if (idle > ttl || rotate > ttl || maximum > 20) {
    return [line(locale === 'en'
      ? 'idle and rotate must not exceed ttl; max must not exceed 20.'
      : 'idle ve rotate ttl değerini, max ise 20 değerini aşmamalı.', 'error')];
  }
  return locale === 'en'
    ? [
        line(TEXT.en.sessionTitle, 'heading'),
        line(`✓ Absolute TTL: ${ttl} ms`, 'success'),
        line(`✓ Idle timeout: ${idle} ms`, 'success'),
        line(`✓ Rotation interval: ${rotate} ms`, 'success'),
        line(`✓ Maximum sessions per user: ${maximum}`, 'success'),
        line('Use revocation and rotation together; either one alone leaves a gap.', 'info'),
      ]
    : [
        line(TEXT.tr.sessionTitle, 'heading'),
        line(`✓ Mutlak yaşam süresi: ${ttl} ms`, 'success'),
        line(`✓ Boşta kalma süresi: ${idle} ms`, 'success'),
        line(`✓ Yenileme aralığı: ${rotate} ms`, 'success'),
        line(`✓ Kullanıcı başına oturum: ${maximum}`, 'success'),
        line('İptal ve yenilemeyi birlikte kullan; tek başına biri yeterli koruma sağlamaz.', 'info'),
      ];
}

function storeCheckOutput(locale, flags) {
  const values = {
    session: String(flags.get('session') ?? 'persistent'),
    oauth: String(flags.get('oauth') ?? 'persistent'),
    rate: String(flags.get('rate') ?? 'redis'),
    lock: String(flags.get('lock') ?? 'redis'),
    audit: String(flags.get('audit') ?? 'persistent'),
  };
  const allowed = new Set(['memory', 'persistent', 'redis']);
  if (Object.values(values).some((value) => !allowed.has(value))) {
    return [line(locale === 'en' ? 'Store values must be memory, persistent or redis.' : 'Depo değerleri memory, persistent veya redis olmalı.', 'error')];
  }
  const warnings = [];
  if (values.session === 'memory' || values.oauth === 'memory' || values.audit === 'memory') {
    warnings.push(locale === 'en' ? 'Persistent records should not use memory in production.' : 'Kalıcı kayıtlar üretimde memory kullanmamalı.');
  }
  if (values.rate !== 'redis' || values.lock !== 'redis') {
    warnings.push(locale === 'en' ? 'Multi-instance deployments need shared rate-limit and lock stores.' : 'Birden fazla instance ortak istek sınırı ve kilit deposu kullanmalı.');
  }
  const rows = Object.entries(values).map(([name, value]) => line(`✓ ${name}: ${value}`, 'success'));
  return [line(TEXT[locale].storeTitle, 'heading'), ...rows, ...warnings.map((warning) => line(`! ${warning}`, 'warning')), line(warnings.length ? TEXT[locale].invalid : TEXT[locale].passed, warnings.length ? 'warning' : 'success')];
}

function realtimeOutput(locale, flags) {
  const transport = String(flags.get('transport') ?? 'websocket').toLowerCase();
  const sequence = Number(flags.get('sequence') ?? 42);
  const resume = Number(flags.get('resume') ?? 40);
  if (!['websocket', 'socketio', 'sse'].includes(transport)) {
    return [line(locale === 'en' ? 'transport must be websocket, socketio or sse.' : 'transport websocket, socketio veya sse olmalı.', 'error')];
  }
  if (!Number.isInteger(sequence) || !Number.isInteger(resume) || sequence < 0 || resume < 0 || resume > sequence) {
    return [line(locale === 'en' ? 'sequence and resume must be non-negative integers, and resume cannot exceed sequence.' : 'sequence ve resume sıfırdan küçük olamaz; resume sequence değerini aşamaz.', 'error')];
  }
  const missed = sequence - resume;
  return locale === 'en'
    ? [
        line(TEXT.en.realtimeTitle, 'heading'),
        line(`✓ Transport: ${transport}`, 'success'),
        line('✓ Subscription requires an active session and guild authorization', 'success'),
        line(`✓ Resume cursor: ${resume}; latest sequence: ${sequence}`, 'success'),
        line(`${missed} event${missed === 1 ? '' : 's'} would be replayed before live delivery.`, 'info'),
      ]
    : [
        line(TEXT.tr.realtimeTitle, 'heading'),
        line(`✓ Taşıma: ${transport}`, 'success'),
        line('✓ Abonelik etkin oturum ve sunucu yetkisi istiyor', 'success'),
        line(`✓ Devam imleci: ${resume}; son sıra: ${sequence}`, 'success'),
        line(`Canlı yayından önce ${missed} olay yeniden gönderilir.`, 'info'),
      ];
}

function securityExplainOutput(locale, topic) {
  const notes = {
    tr: {
      csrf: ['CSRF belirteci oturuma bağlanır.', 'Sunucu, yazma isteğinde çerez ve belirteci birlikte doğrular.', 'Origin kontrolü CSRF denetiminin yerine geçmez.'],
      origin: ['İzin listesi tam origin eşleşmesi kullanır.', 'Alt alan adı, port ve protokol değişiklikleri ayrı origin sayılır.', 'Üretimde HTTP ve localhost değerlerini listeye ekleme.'],
      session: ['Tarayıcı yalnızca opak oturum değerini taşır.', 'Sunucu ham belirteci saklamaz; özetini karşılaştırır.', 'Mutlak süre, boşta kalma süresi, yenileme ve iptal birlikte çalışır.'],
      locks: ['Kaynak kilidi aynı kayda gelen eş zamanlı yazmaları sıraya koyar.', 'Dağıtık kilit yenilenir ve fencing token eski sahibin yazmasını durdurur.', 'Veritabanı işlemi yine kendi transaction sınırını korur.'],
    },
    en: {
      csrf: ['The CSRF token is bound to the session.', 'The server validates the cookie and token together on writes.', 'Origin validation does not replace CSRF validation.'],
      origin: ['The allowlist uses exact origin matching.', 'A different subdomain, port or protocol is a different origin.', 'Do not allow HTTP or localhost in production.'],
      session: ['The browser carries an opaque session value.', 'The server stores and compares a digest, not the raw token.', 'Absolute TTL, idle expiry, rotation and revocation work together.'],
      locks: ['A resource lock serializes concurrent writes to the same target.', 'Renewable distributed locks and fencing tokens stop stale owners.', 'Your database transaction still owns record-level consistency.'],
    },
  };
  const selected = notes[locale][topic];
  if (!selected) {
    return [line(`${TEXT[locale].usage}: security explain csrf|origin|session|locks`, 'error')];
  }
  return [line(TEXT[locale].securityTitle(topic), 'heading'), ...selected.map((note) => line(`• ${note}`, 'info'))];
}


function contractOutput(locale) {
  return locale === 'en'
    ? [
        line('Contract markers', 'heading'),
        line(`Adapter contract: ${releaseMetadata.adapterContract}`, 'success'),
        line(`Action contract: ${releaseMetadata.actionContract}`, 'success'),
        line(`Realtime contract: ${releaseMetadata.realtimeContract}`, 'success'),
      ]
    : [
        line('Sözleşme işaretleri', 'heading'),
        line(`Adapter sözleşmesi: ${releaseMetadata.adapterContract}`, 'success'),
        line(`Action sözleşmesi: ${releaseMetadata.actionContract}`, 'success'),
        line(`Realtime sözleşmesi: ${releaseMetadata.realtimeContract}`, 'success'),
      ];
}

function exportOutput(locale) {
  const paths = [
    '.', 'discord', 'fastify', 'express', 'redis', 'realtime', 'testing', 'analytics',
    'contracts', 'discordjs', 'hono', 'operator', 'postgres', 'telemetry', 'transactions', 'locks',
  ];
  return [
    line(locale === 'en' ? 'Public export paths (16)' : 'Public export yolları (16)', 'heading'),
    ...paths.map((path) => line(path === '.' ? '@kavtuai/guildgate' : `@kavtuai/guildgate/${path}`, 'code')),
  ];
}

function storeReferenceOutput(locale, topic) {
  if (topic === 'list') {
    const stores = ['sessions', 'oauthStates', 'credentials', 'rateLimits', 'cache', 'idempotency', 'locks', 'audit', 'outbox', 'policies'];
    return [
      line(locale === 'en' ? 'GuildGateStores (10)' : 'GuildGateStores (10)', 'heading'),
      ...stores.map((name) => line(`✓ ${name}`, 'success')),
    ];
  }
  if (topic === 'contract') {
    return locale === 'en'
      ? [
          line('Adapter contract 1.1', 'heading'),
          line('✓ Atomic per-user session cap', 'success'),
          line('✓ Reservation-owner compare-and-set', 'success'),
          line('✓ Opaque audit cursor paging', 'success'),
          line('✓ Bounded outbox claim leases', 'success'),
          line('Run runStoreContract() and backend race tests in CI.', 'info'),
        ]
      : [
          line('Adapter sözleşmesi 1.1', 'heading'),
          line('✓ Atomik kullanıcı başına session sınırı', 'success'),
          line('✓ Reservation owner compare-and-set', 'success'),
          line('✓ Opak audit cursor sayfalama', 'success'),
          line('✓ Sınırlı outbox claim lease', 'success'),
          line('CI içinde runStoreContract() ve backend yarış testlerini çalıştır.', 'info'),
        ];
  }
  return [line(`${TEXT[locale].usage}: store list|contract`, 'error')];
}

function idempotencyReferenceOutput(locale, topic) {
  if (topic !== 'reservation') return [line(`${TEXT[locale].usage}: idempotency reservation`, 'error')];
  return locale === 'en'
    ? [
        line('Idempotency reservation ownership', 'heading'),
        line('✓ Every inflight record has a reservationId owner token', 'success'),
        line('✓ renew, complete and fail compare the same owner', 'success'),
        line('✓ A stale worker cannot overwrite or remove a newer reservation', 'success'),
        line('Use an idempotency TTL longer than the deadline and late-settlement bound.', 'info'),
      ]
    : [
        line('Idempotency reservation sahipliği', 'heading'),
        line('✓ Her inflight kayıt reservationId owner token taşır', 'success'),
        line('✓ renew, complete ve fail aynı owner değerini karşılaştırır', 'success'),
        line('✓ Eski worker yeni reservation kaydını ezemez veya silemez', 'success'),
        line('Idempotency TTL değerini deadline ve geç tamamlanma sınırından uzun tut.', 'info'),
      ];
}

function transactionReferenceOutput(locale, topic) {
  if (topic !== 'finality') return [line(`${TEXT[locale].usage}: transaction finality`, 'error')];
  return locale === 'en'
    ? [
        line('Transaction finality', 'heading'),
        line('✓ COMMIT is separated from post-commit callback execution', 'success'),
        line('✓ A callback failure does not issue rollback', 'success'),
        line('✓ A committed domain write is not repeated', 'success'),
        line('✓ Nested PostgreSQL work uses savepoints', 'success'),
      ]
    : [
        line('Transaction kesinliği', 'heading'),
        line('✓ COMMIT ile commit sonrası callback yürütmesi ayrıdır', 'success'),
        line('✓ Callback hatası rollback komutu üretmez', 'success'),
        line('✓ Commit edilmiş domain yazımı tekrar çalıştırılmaz', 'success'),
        line('✓ İç içe PostgreSQL işlemleri savepoint kullanır', 'success'),
      ];
}

function deadlineReferenceOutput(locale, topic) {
  if (topic !== 'settlement') return [line(`${TEXT[locale].usage}: deadline settlement`, 'error')];
  return locale === 'en'
    ? [
        line('Deadline and late settlement', 'heading'),
        line('✓ The response returns at the configured deadline', 'success'),
        line('✓ Late work remains observable through settlement', 'success'),
        line('✓ Reservation and lease retention is bounded', 'success'),
        line('Application I/O should still honor AbortSignal.', 'info'),
      ]
    : [
        line('Deadline ve geç tamamlanma', 'heading'),
        line('✓ Yanıt yapılandırılan deadline sınırında döner', 'success'),
        line('✓ Geç iş settlement üzerinden gözlemlenir', 'success'),
        line('✓ Reservation ve lease tutma süresi sınırlıdır', 'success'),
        line('Uygulama I/O çağrıları yine AbortSignal değerini dinlemelidir.', 'info'),
      ];
}

function realtimeReferenceOutput(locale, topic) {
  const content = {
    limits: locale === 'en'
      ? ['Payload size', 'Message rate', 'Channel length', 'Subscriptions', 'Buffered bytes', 'Idle time', 'Connection lifetime']
      : ['Payload boyutu', 'Mesaj hızı', 'Kanal uzunluğu', 'Abonelik sayısı', 'Buffered byte', 'Boşta kalma', 'Bağlantı ömrü'],
    transports: locale === 'en'
      ? ['WebSocket: inbound and outbound', 'Socket.IO: inbound, acknowledgements and replay', 'SSE: bounded server-to-client queue']
      : ['WebSocket: inbound ve outbound', 'Socket.IO: inbound, acknowledgement ve replay', 'SSE: sınırlı server-to-client queue'],
    replay: locale === 'en'
      ? ['Per-channel sequence', 'Bounded replay batches', 'Authorization before subscription', 'Resume before live delivery']
      : ['Kanal başına sequence', 'Sınırlı replay batch', 'Abonelik öncesi yetki', 'Canlı teslimden önce resume'],
  };
  const selected = content[topic];
  if (!selected) return [line(`${TEXT[locale].usage}: realtime limits|transports|replay`, 'error')];
  return [line(locale === 'en' ? `Realtime ${topic}` : `Realtime ${topic}`, 'heading'), ...selected.map((value) => line(`✓ ${value}`, 'success'))];
}

function cliReferenceOutput(locale, topic) {
  const rows = {
    doctor: ['guildgate-doctor [--json]', locale === 'en' ? 'Checks security, storage, analytics and production settings.' : 'Güvenlik, depolama, analitik ve production ayarlarını kontrol eder.'],
    'writing-check': ['guildgate-writing-check [--root <path>]', locale === 'en' ? 'Checks documentation files in a project directory.' : 'Proje klasöründeki doküman dosyalarını kontrol eder.'],
    migration: ['guildgate-migration [--prefix <name>]', locale === 'en' ? 'Prints PostgreSQL migration SQL.' : 'PostgreSQL migration SQL çıktısını üretir.'],
  };
  const selected = rows[topic];
  if (!selected) return [line(`${TEXT[locale].usage}: cli doctor|writing-check|migration`, 'error')];
  return [line(selected[0], 'heading'), line(selected[1], 'info'), line(locale === 'en' ? 'Use the installed package in a terminal for the actual help output.' : 'Gerçek yardım çıktısı için kurulu paketi terminalde çalıştır.', 'code')];
}

function commandResult(command, lines, extra = {}) {
  return {
    ok: !lines.some((item) => item.tone === 'error'),
    command,
    lines,
    ...extra,
  };
}

export function executeCommand(rawInput, options = {}) {
  const locale = localeOf(options.locale);
  const input = String(rawInput ?? '').trim();
  const rejection = rejectUnsafeInput(input, locale);
  if (rejection) return {ok: false, command: input, lines: [line(rejection, 'error')]};

  try {
    const tokens = tokenize(input);
    const command = tokens[0]?.toLowerCase();
    const subcommand = tokens[1]?.toLowerCase();
    const parsedAfterSubcommand = parseFlags(tokens.slice(2));
    const parsedAfterCommand = parseFlags(tokens.slice(1));

    switch (command) {
      case 'help':
        return commandResult(input, helpOutput(locale));
      case 'examples':
        return commandResult(input, examplesOutput(locale));
      case 'version':
        return commandResult(input, [line(`${releaseMetadata.packageName} ${releaseMetadata.packageVersion}`, 'success')]);
      case 'contracts':
        return commandResult(input, contractOutput(locale));
      case 'exports':
        return commandResult(input, exportOutput(locale));
      case 'doctor':
        return commandResult(input, doctorOutput(locale, parsedAfterCommand.flags.has('json')));
      case 'config':
        if (subcommand !== 'check') return {ok: false, command: input, lines: [line(`${TEXT[locale].usage}: config check --preset development|production`, 'error')]};
        return commandResult(input, configOutput(locale, String(parsedAfterSubcommand.flags.get('preset') ?? '')));
      case 'origin':
        if (subcommand !== 'check' || !parsedAfterSubcommand.args[0]) return {ok: false, command: input, lines: [line(`${TEXT[locale].usage}: origin check https://panel.example.com`, 'error')]};
        return commandResult(input, originOutput(locale, parsedAfterSubcommand.args[0]));
      case 'session':
        if (subcommand !== 'policy') return {ok: false, command: input, lines: [line(`${TEXT[locale].usage}: session policy --ttl 86400000 --idle 1800000 --rotate 900000 --max 5`, 'error')]};
        return commandResult(input, sessionPolicyOutput(locale, parsedAfterSubcommand.flags));
      case 'store':
        if (subcommand === 'check') return commandResult(input, storeCheckOutput(locale, parsedAfterSubcommand.flags));
        return commandResult(input, storeReferenceOutput(locale, subcommand));
      case 'idempotency':
        return commandResult(input, idempotencyReferenceOutput(locale, subcommand));
      case 'transaction':
        return commandResult(input, transactionReferenceOutput(locale, subcommand));
      case 'deadline':
        return commandResult(input, deadlineReferenceOutput(locale, subcommand));
      case 'action':
        if (subcommand !== 'test' || !parsedAfterSubcommand.args[0]) return {ok: false, command: input, lines: [line(`${TEXT[locale].usage}: action test ACTION_NAME [flags]`, 'error')]};
        return commandResult(input, actionOutput(locale, parsedAfterSubcommand.args[0], parsedAfterSubcommand.flags));
      case 'rate-limit':
        if (subcommand !== 'test') return {ok: false, command: input, lines: [line(`${TEXT[locale].usage}: rate-limit test --requests 8 --limit 5`, 'error')]};
        return commandResult(input, rateLimitOutput(locale, parsedAfterSubcommand.flags));
      case 'realtime':
        if (subcommand === 'check') return commandResult(input, realtimeOutput(locale, parsedAfterSubcommand.flags));
        return commandResult(input, realtimeReferenceOutput(locale, subcommand));
      case 'cli':
        return commandResult(input, cliReferenceOutput(locale, subcommand));
      case 'security':
        if (subcommand !== 'explain' || !parsedAfterSubcommand.args[0]) return {ok: false, command: input, lines: [line(`${TEXT[locale].usage}: security explain csrf|origin|session|locks`, 'error')]};
        return commandResult(input, securityExplainOutput(locale, parsedAfterSubcommand.args[0].toLowerCase()));
      case 'clear':
        return {ok: true, clear: true, command: input, lines: []};
      default:
        return {ok: false, command: input, lines: [line(TEXT[locale].unknown(command), 'error'), line(TEXT[locale].useHelp, 'info')]};
    }
  } catch {
    return {
      ok: false,
      command: input,
      lines: [line(locale === 'en' ? 'The command could not be evaluated. Review its format and try again.' : 'Komut değerlendirilemedi. Biçimi kontrol edip tekrar dene.', 'error')],
    };
  }
}

export const commandEngineLimits = Object.freeze({
  maxCommandLength: MAX_COMMAND_LENGTH,
  maxCommandsPerMinute: MAX_COMMANDS_PER_MINUTE,
  maxTokens: MAX_TOKENS,
  maxTokenLength: MAX_TOKEN_LENGTH,
  maxFlags: MAX_FLAGS,
});
