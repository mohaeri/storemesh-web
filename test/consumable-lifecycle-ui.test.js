import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('consumables UI exposes permission-gated edit and lifecycle actions',()=>{assert.match(app,/data-consumable-edit/);assert.match(app,/data-consumable-toggle/);assert.match(app,/method:'PATCH'/);assert.match(app,/active\?'deactivate':'activate'/);assert.match(app,/can\('master-data:write'\)/)});
