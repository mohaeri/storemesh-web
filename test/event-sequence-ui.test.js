import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('audit UI displays deterministic event sequence',()=>{assert.match(app,/Number\(b\.sequence\?\?0\)-Number\(a\.sequence\?\?0\)/);assert.match(app,/#\$\{fa\(e\.sequence\)\}/)});
