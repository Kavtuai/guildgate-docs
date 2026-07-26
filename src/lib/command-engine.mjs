const MAX_COMMAND_LENGTH = 180;
const BLOCKED_TOKENS = ['&&', '||', ';', '|', '>', '<', '`', '$(', '${', '\u0000'];
const SECRET_PATTERNS = [
  /\b(?:ghp|gho|github_pat)_[A-Za-z0-9_]{16,}\b/,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bmfa\.[A-Za-z0-9_-]{20,}\b/,
  /\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{20,}\b/,
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

function line(text, tone = 'normal') {
  return {text, tone};
}

function tokenize(input) {
  const tokens = [];
  const pattern = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|([^\s]+)/g;
  let match;

  while ((match = pattern.exec(input)) !== null) {
    tokens.push((match[1] ?? match[2] ?? match[3]).replace(/\\(["'])/g, '$1'));
  }

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
    const next = tokens[index + 1];
    if (!name || !next || next.startsWith('--')) {
      flags.set(name, true);
      continue;
    }

    flags.set(name, next);
    index += 1;
  }

  return {args, flags};
}

function rejectUnsafeInput(input) {
  if (!input) {
    return 'Komut boş bırakılamaz.';
  }

  if (input.length > MAX_COMMAND_LENGTH) {
    return `Komut ${MAX_COMMAND_LENGTH} karakterden uzun olamaz.`;
  }

  if (/\r|\n|\t/.test(input)) {
    return 'Tek seferde yalnızca tek satır komut çalıştırılabilir.';
  }

  if (BLOCKED_TOKENS.some((token) => input.includes(token))) {
    return 'Kabuk operatörleri ve yönlendirme karakterleri bu alanda kabul edilmez.';
  }

  if (SECRET_PATTERNS.some((pattern) => pattern.test(input))) {
    return 'Komut bir sır veya erişim belirteci gibi görünüyor. Bu değeri buraya yapıştırma.';
  }

  return null;
}

function helpOutput() {
  return [
    line('Kullanılabilir komutlar', 'heading'),
    line('help                         Komut listesini gösterir'),
    line('version                      Belgelenen paket sürümünü gösterir'),
    line('doctor [--json]              Örnek ortam tanısı çalıştırır'),
    line('config check --preset NAME   development veya production ayarını denetler'),
    line('origin check URL             Origin değerini izin listesine göre sınar'),
    line('action test NAME [flags]     Korunan işlem adımlarını simüle eder'),
    line('rate-limit test --requests N --limit N'),
    line('examples                     Hazır örnekleri gösterir'),
    line('clear                        Terminal çıktısını temizler'),
  ];
}

function examplesOutput() {
  return [
    line('Örnek komutlar', 'heading'),
    line('doctor'),
    line('doctor --json'),
    line('config check --preset production'),
    line('origin check https://panel.example.com'),
    line('action test guild.settings.update --method PATCH --origin https://panel.example.com --session valid --csrf valid --permission MANAGE_GUILD --bot-permission VIEW_CHANNEL'),
    line('rate-limit test --requests 8 --limit 5'),
  ];
}

function doctorOutput(jsonMode) {
  const report = {
    ok: true,
    runtime: 'Node.js 22.x (simülasyon)',
    environment: 'development',
    checks: {
      csrfSecret: 'present',
      auditIpSalt: 'present',
      allowedOrigins: 2,
      sessionStore: 'memory',
      redis: 'not configured',
    },
    warnings: ['Bellek deposu üretim için uygun değildir.'],
  };

  if (jsonMode) {
    return JSON.stringify(report, null, 2).split('\n').map((text) => line(text, 'code'));
  }

  return [
    line('GuildGate tanısı', 'heading'),
    line('✓ Çalışma sürümü: Node.js 22.x (simülasyon)', 'success'),
    line('✓ CSRF sırrı tanımlı', 'success'),
    line('✓ Audit salt tanımlı', 'success'),
    line('✓ İzin verilen origin sayısı: 2', 'success'),
    line('! Oturum deposu: memory', 'warning'),
    line('! Redis bağlantısı tanımlı değil', 'warning'),
    line('Sonuç: Yerel geliştirme için uygun; üretim için kalıcı depo gerekir.', 'info'),
  ];
}

function configOutput(preset) {
  if (!['development', 'production'].includes(preset)) {
    return [line('Preset development veya production olmalı.', 'error')];
  }

  if (preset === 'development') {
    return [
      line('development yapılandırması', 'heading'),
      line('✓ localhost origin kabul ediliyor', 'success'),
      line('✓ bellek deposu kullanılabilir', 'success'),
      line('✓ Secure çerez geliştirmede kapatılabilir', 'success'),
      line('Not: Bu sonuç üretime uygunluk anlamına gelmez.', 'info'),
    ];
  }

  return [
    line('production yapılandırması', 'heading'),
    line('✓ HTTPS temel adres', 'success'),
    line('✓ localhost origin listede değil', 'success'),
    line('✓ Secure ve HttpOnly oturum çerezi', 'success'),
    line('✓ kalıcı oturum deposu', 'success'),
    line('✓ Redis prefix ortam adına göre ayrılmış', 'success'),
    line('Sonuç: Örnek yapılandırma üretim denetimini geçti.', 'success'),
  ];
}

function originOutput(value) {
  let origin;
  try {
    const url = new URL(value);
    origin = url.origin;
  } catch {
    return [line('Geçerli bir http veya https adresi gir.', 'error')];
  }

  if (!/^https?:$/.test(new URL(value).protocol)) {
    return [line('Yalnızca http ve https origin değerleri desteklenir.', 'error')];
  }

  if (SAFE_ORIGINS.has(origin)) {
    return [
      line(`Origin: ${origin}`, 'heading'),
      line('✓ Tam eşleşme bulundu', 'success'),
      line('İstek origin kontrolünden geçer.', 'success'),
    ];
  }

  return [
    line(`Origin: ${origin}`, 'heading'),
    line('✕ İzin listesinde tam eşleşme yok', 'error'),
    line('İstek çalıştırılmadan reddedilir.', 'error'),
  ];
}

function actionOutput(name, flags) {
  const policy = ACTION_POLICIES.get(name);
  if (!policy) {
    return [
      line(`Bilinmeyen işlem: ${name}`, 'error'),
      line(`İzin verilen işlemler: ${[...ACTION_POLICIES.keys()].join(', ')}`, 'info'),
    ];
  }

  const method = String(flags.get('method') ?? policy.method).toUpperCase();
  const origin = String(flags.get('origin') ?? 'https://panel.example.com');
  const session = String(flags.get('session') ?? 'valid');
  const csrf = String(flags.get('csrf') ?? 'valid');
  const permission = String(flags.get('permission') ?? policy.userPermission).toUpperCase();
  const botPermission = String(flags.get('bot-permission') ?? policy.botPermission).toUpperCase();

  const result = [line(`İşlem: ${name}`, 'heading')];
  const fail = (message) => {
    result.push(line(`✕ ${message}`, 'error'));
    result.push(line('execute adımı çalıştırılmadı.', 'error'));
    return result;
  };

  result.push(line('✓ Girdi izin verilen örnek şemaya uydu', 'success'));
  result.push(line(`✓ Kaynak çözüldü: ${policy.resource}`, 'success'));

  if (method !== policy.method) {
    return fail(`Bu işlem ${policy.method} bekliyor; ${method} kabul edilmedi.`);
  }
  result.push(line(`✓ Yöntem: ${method}`, 'success'));

  let parsedOrigin;
  try {
    parsedOrigin = new URL(origin).origin;
  } catch {
    return fail('Origin değeri geçerli bir URL değil.');
  }

  if (!SAFE_ORIGINS.has(parsedOrigin)) {
    return fail(`Origin izin listesinde değil: ${parsedOrigin}`);
  }
  result.push(line('✓ Origin tam eşleşti', 'success'));

  if (session !== 'valid') {
    return fail('Oturum geçersiz veya süresi dolmuş.');
  }
  result.push(line('✓ Oturum geçerli', 'success'));

  if (csrf !== 'valid') {
    return fail('CSRF belirteci oturumla eşleşmedi.');
  }
  result.push(line('✓ CSRF belirteci geçerli', 'success'));

  if (!ALLOWED_PERMISSIONS.has(permission) || permission !== policy.userPermission) {
    return fail(`Kullanıcı izni ${policy.userPermission} olmalı; alınan değer ${permission}.`);
  }
  result.push(line(`✓ Kullanıcı izni: ${permission}`, 'success'));

  if (!ALLOWED_PERMISSIONS.has(botPermission) || botPermission !== policy.botPermission) {
    return fail(`Bot izni ${policy.botPermission} olmalı; alınan değer ${botPermission}.`);
  }
  result.push(line(`✓ Bot izni: ${botPermission}`, 'success'));
  result.push(line('✓ İstek sınırı ve kaynak kilidi uygun', 'success'));
  result.push(line('✓ execute adımı simülasyonda tamamlandı', 'success'));
  result.push(line('Gerçek sunucuya istek gönderilmedi.', 'info'));
  return result;
}

function rateLimitOutput(flags) {
  const requests = Number(flags.get('requests') ?? 8);
  const limit = Number(flags.get('limit') ?? 5);

  if (!Number.isInteger(requests) || !Number.isInteger(limit) || requests < 1 || limit < 1 || requests > 50 || limit > 50) {
    return [line('requests ve limit 1 ile 50 arasında tam sayı olmalı.', 'error')];
  }

  const accepted = Math.min(requests, limit);
  const rejected = Math.max(0, requests - limit);
  return [
    line('İstek sınırı simülasyonu', 'heading'),
    line(`Kabul edilen: ${accepted}`, 'success'),
    line(`Reddedilen: ${rejected}`, rejected ? 'warning' : 'success'),
    line(`Sonuç: ${requests} isteğin ${accepted} tanesi pencere içinde çalışır.`, 'info'),
  ];
}

export function executeCommand(rawInput) {
  const input = String(rawInput ?? '').trim();
  const rejection = rejectUnsafeInput(input);
  if (rejection) {
    return {ok: false, command: input, lines: [line(rejection, 'error')]};
  }

  const tokens = tokenize(input);
  const command = tokens[0]?.toLowerCase();
  const subcommand = tokens[1]?.toLowerCase();
  const {args, flags} = parseFlags(tokens.slice(2));

  switch (command) {
    case 'help':
      return {ok: true, command: input, lines: helpOutput()};
    case 'examples':
      return {ok: true, command: input, lines: examplesOutput()};
    case 'version':
      return {ok: true, command: input, lines: [line('@kavtuai/guildgate 0.1.0', 'success')]};
    case 'doctor': {
      const doctorFlags = parseFlags(tokens.slice(1)).flags;
      return {ok: true, command: input, lines: doctorOutput(doctorFlags.has('json'))};
    }
    case 'config':
      if (subcommand !== 'check') {
        return {ok: false, command: input, lines: [line('Kullanım: config check --preset development|production', 'error')]};
      }
      return {ok: true, command: input, lines: configOutput(String(flags.get('preset') ?? ''))};
    case 'origin':
      if (subcommand !== 'check' || !args[0]) {
        return {ok: false, command: input, lines: [line('Kullanım: origin check https://panel.example.com', 'error')]};
      }
      return {ok: true, command: input, lines: originOutput(args[0])};
    case 'action':
      if (subcommand !== 'test' || !args[0]) {
        return {ok: false, command: input, lines: [line('Kullanım: action test ACTION_NAME [flags]', 'error')]};
      }
      return {ok: true, command: input, lines: actionOutput(args[0], flags)};
    case 'rate-limit':
      if (subcommand !== 'test') {
        return {ok: false, command: input, lines: [line('Kullanım: rate-limit test --requests 8 --limit 5', 'error')]};
      }
      return {ok: true, command: input, lines: rateLimitOutput(flags)};
    case 'clear':
      return {ok: true, clear: true, command: input, lines: []};
    default:
      return {
        ok: false,
        command: input,
        lines: [
          line(`Bilinmeyen komut: ${command ?? ''}`, 'error'),
          line('Komut listesini görmek için help yaz.', 'info'),
        ],
      };
  }
}

export const commandEngineLimits = Object.freeze({
  maxCommandLength: MAX_COMMAND_LENGTH,
  maxCommandsPerMinute: 20,
});
