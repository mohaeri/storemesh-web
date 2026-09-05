import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('web exposes self-service password change and permission-filtered admin reset',async()=>{
  const app=await readFile(new URL('../app.js',import.meta.url),'utf8'),html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  assert.match(html,/id="passwordForm"/);assert.match(html,/name="currentPassword"/);assert.match(html,/name="newPassword"/);
  assert.match(app,/\/api\/auth\/password\/change/);assert.match(app,/data-password-reset/);assert.match(app,/\/password\/reset/);assert.match(app,/credentials:issue/);
});
