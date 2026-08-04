import fs from 'node:fs';
const source = fs.readFileSync('src/data/release-metadata.mjs', 'utf8');
const docs = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const value = (name) => source.match(new RegExp(`${name}: ['\"]([^'\"]+)['\"]`, 'u'))?.[1];
const expected = {packageName: '@kavtuai/guildgate', packageVersion: '1.1.1', adapterContract: '1.1', actionContract: '1.0', realtimeContract: '1.0', docsVersion: docs.version};
for (const [key, item] of Object.entries(expected)) if (value(key) !== item) throw new Error(`${key} metadata mismatch`);
if (docs.version !== '0.4.0') throw new Error('Documentation version must be 0.4.0');
console.log(`Release metadata passed: ${expected.packageName}@${expected.packageVersion}; docs ${docs.version}.`);
