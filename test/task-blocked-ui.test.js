import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8'),css=fs.readFileSync(new URL('../style.css',import.meta.url),'utf8');
test('blocked task cards identify the blocking exception and expose no action',()=>{assert.match(app,/task-blocked/);assert.match(app,/blockingException\.type/);assert.match(app,/blockingException\.severity/);assert.match(app,/t\.status!==\x27BLOCKED\x27/);assert.match(css,/\.task-blocked/)});
