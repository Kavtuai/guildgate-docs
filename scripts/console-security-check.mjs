import fs from 'node:fs';
import assert from 'node:assert/strict';
import {executeCommand} from '../src/lib/command-engine.mjs';
const component = fs.readFileSync('src/components/CommandPlayground/index.js', 'utf8');
const engine = fs.readFileSync('src/lib/command-engine.mjs', 'utf8');
for (const [file, source] of [['component', component], ['engine', engine]]) {
  for (const token of ['dangerouslySetInnerHTML', 'innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document.write', 'eval(', 'new Function', 'child_process', 'fetch(', 'XMLHttpRequest', 'WebSocket(', 'EventSource', 'sendBeacon', 'localStorage', 'sessionStorage', 'indexedDB', 'document.cookie']) {
    assert.equal(source.includes(token), false, `${file} contains forbidden console data-path token: ${token}`);
  }
}
for (const input of ['<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '<a href="javascript:alert(1)">x</a>', '${7*7}', "{{constructor.constructor('alert(1)')()}}", '__proto__', 'constructor.prototype', 'doctor --constructor x']) {
  const result=executeCommand(input,{locale:'en'});
  assert.equal(result.ok,false,input);
  assert.equal(JSON.stringify(result.lines).includes('<script>'), false);
}
for (const input of ['x '.repeat(40), `doctor --x ${'a'.repeat(170)}`, 'first\nsecond']) assert.equal(executeCommand(input,{locale:'en'}).ok,false);
console.log('Console security passed: no network/storage/code execution path and malicious inputs are rejected as text.');
