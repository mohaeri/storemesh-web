import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { submitVerifiedReprint,verifiedReprintScan } from '../reprint-verification.js';

test('reprint cannot proceed without a distinct scanner value',()=>{
  assert.throws(()=>verifiedReprintScan('', 'B-IRAN-000001'),/اسکنر/);
  assert.throws(()=>verifiedReprintScan(undefined, 'B-IRAN-000001'),/اسکنر/);
  assert.throws(()=>verifiedReprintScan('B-IRAN-000002', 'B-IRAN-000001'),/مطابقت/);
  assert.equal(verifiedReprintScan('B-IRAN-000001', 'B-IRAN-000001'),'B-IRAN-000001');
});

test('click flow performs no API request when the scan field is empty',async()=>{
  let calls=0;
  await assert.rejects(()=>submitVerifiedReprint({jobId:'job-1',scannedValue:'',expectedIdentity:'B-IRAN-000001',send:async()=>{calls++;}}),/اسکنر/);
  assert.equal(calls,0);
});

test('retry button never carries or echoes the expected label identity',async()=>{
  const source=await readFile(new URL('../app.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/data-label=/);
  assert.doesNotMatch(source,/verifiedScan\s*:\s*b\.dataset/);
  assert.match(source,/querySelector\('\[data-reprint-scan\]'\)/);
});
