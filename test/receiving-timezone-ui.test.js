import test from'node:test';
import assert from'node:assert/strict';
import{readFileSync}from'node:fs';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('configuration UI provides an explicit receiving timezone example',()=>{for(const token of['operatingHoursStart','operatingHoursEnd','timezone','Asia/Tehran'])assert.ok(app.includes(token),token)});
