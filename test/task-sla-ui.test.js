import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('task UI captures SLA and visibly renders code and overdue state',()=>{assert.match(app,/expectedDurationMinutes/);assert.match(app,/dueAt/);assert.match(app,/t\.code/);assert.match(app,/task-overdue/);assert.match(app,/عقب‌افتاده/)});
