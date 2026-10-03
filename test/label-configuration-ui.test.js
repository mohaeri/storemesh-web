import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('configuration UI authors and activates per-site LABEL templates',async()=>{const source=await readFile(new URL('../app.js',import.meta.url),'utf8'),page=source.slice(source.indexOf("case'config'"),source.indexOf("case'overrides'"));for(const token of["'LABEL'",'fieldsByType','QR_TRACEABILITY','CONTAINER_TYPE','allowedReprintReasons','reprintApprovalByType','reprintThreshold','چاپ بدون نسخه فعال LABEL متوقف می‌شود'])assert.ok(page.includes(token),token);assert.match(page,/data-config="\$\{c\.id\}" data-transition="activate"/)});
