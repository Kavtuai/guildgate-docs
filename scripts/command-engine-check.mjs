import assert from 'node:assert/strict';
import {commandEngineLimits, executeCommand} from '../src/lib/command-engine.mjs';

assert.equal(commandEngineLimits.maxCommandLength, 240);
assert.equal(commandEngineLimits.maxCommandsPerMinute, 20);

const safeCommands = [
  'help',
  'version',
  'doctor',
  'doctor --json',
  'config check --preset production',
  'origin check https://panel.example.com',
  'session policy --ttl 86400000 --idle 1800000 --rotate 900000 --max 5',
  'store check --session persistent --oauth persistent --rate redis --lock redis --audit persistent',
  'action test guild.settings.update --method PATCH --origin https://panel.example.com --session valid --csrf valid --permission MANAGE_GUILD --bot-permission VIEW_CHANNEL',
  'rate-limit test --requests 8 --limit 5',
  'realtime check --transport websocket --sequence 42 --resume 40',
  'security explain csrf',
  'examples',
];

for (const locale of ['tr', 'en']) {
  for (const command of safeCommands) {
    const result = executeCommand(command, {locale});
    assert.equal(result.ok, true, `${locale}: ${command}`);
    assert.ok(Array.isArray(result.lines), `${locale}: ${command}`);
    assert.ok(result.lines.length > 0, `${locale}: ${command}`);
    for (const item of result.lines) {
      assert.equal(typeof item.text, 'string');
      assert.ok(!/stack|trace|debug|system message|internal error object/iu.test(item.text), `${locale}: unsafe output in ${command}`);
    }
  }
}

for (const unsafe of [
  'doctor && whoami',
  'doctor; rm -rf',
  'echo $(${whoami})',
  'cat > secret.txt',
  'first\nsecond',
  'ghp_abcdefghijklmnopqrstuvwxyz123456',
  'Bearer abcdefghijklmnopqrstuvwxyz123456',
]) {
  const result = executeCommand(unsafe, {locale: 'en'});
  assert.equal(result.ok, false, unsafe);
}

const denied = executeCommand(
  'action test guild.settings.update --method PATCH --origin https://evil.example --session valid --csrf valid --permission MANAGE_GUILD --bot-permission VIEW_CHANNEL',
  {locale: 'en'},
);
assert.equal(denied.ok, false);
assert.ok(denied.lines.some((item) => item.tone === 'error'));

const clear = executeCommand('clear', {locale: 'tr'});
assert.equal(clear.clear, true);

console.log('Komut motoru kontrolü tamam: iki dil, izin listesi, sır engeli ve güvenli çıktı kuralları doğrulandı.');
