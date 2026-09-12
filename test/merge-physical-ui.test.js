import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('MERGE UI requires a hardware-verified physical output container',async()=>{
  const source=await readFile(new URL('../app.js',import.meta.url),'utf8');
  assert.match(source,/scanField\('اسکن QR سبد خالی Merge','mergeContainerCode'\)/);
  assert.match(source,/scannedContainer\(v\.mergeContainerCode,f\.elements\.mergeContainerCode\)/);
  assert.match(source,/process:'MERGE',containerId:mergeContainer\.id/);
});
