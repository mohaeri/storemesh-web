import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';

test('receiving UI offers reasoned cancellation for fresh sole-container batches',async()=>{const text=await readFile(new URL('../app.js',import.meta.url),'utf8'),page=text.slice(text.indexOf("case'receiving'"),text.indexOf("case'inventory'"));assert.match(page,/اصلاح دریافت اشتباه/);assert.match(page,/batch\.status==='RECEIVED'&&batch\.zone==='RECEIVING'/);assert.match(text,/data-cancel-receiving/);assert.match(text,/\/api\/batches\/\$\{button\.dataset\.cancelReceiving\}\/cancel-receiving/);assert.match(text,/sessionId:await ensureSession\(\),reason:reason\.trim\(\)/)});
