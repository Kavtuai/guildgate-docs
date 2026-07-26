import assert from 'node:assert/strict';
import {executeCommand} from '../src/lib/command-engine.mjs';

const cases = [
  ['help', true],
  ['doctor', true],
  ['doctor --json', true],
  ['config check --preset production', true],
  ['origin check https://panel.example.com', true],
  ['action test guild.settings.update --method PATCH --origin https://panel.example.com --session valid --csrf valid --permission MANAGE_GUILD --bot-permission VIEW_CHANNEL', true],
  ['rate-limit test --requests 8 --limit 5', true],
];

for (const [command, expected] of cases) {
  const result = executeCommand(command);
  assert.equal(result.ok, expected, command);
  assert.ok(Array.isArray(result.lines), command);
}

for (const unsafe of ['doctor && whoami', 'doctor; rm -rf', 'echo $(${whoami})', 'ghp_abcdefghijklmnopqrstuvwxyz123456']) {
  const result = executeCommand(unsafe);
  assert.equal(result.ok, false, unsafe);
}

const denied = executeCommand('action test guild.settings.update --origin https://evil.example --session valid --csrf valid');
assert.ok(denied.lines.some((item) => item.tone === 'error'));

console.log('Komut motoru kontrolü tamam: izin listesi ve güvenlik sınırları çalışıyor.');
