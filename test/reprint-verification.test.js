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

test('verified retry still performs no request without a separate reason',async()=>{
  let calls=0;
  await assert.rejects(()=>submitVerifiedReprint({jobId:'job-1',scannedValue:'B-IRAN-000001',expectedIdentity:'B-IRAN-000001',reason:' ',send:async()=>{calls++;}}),/علت چاپ مجدد/);
  assert.equal(calls,0);
});

test('retry sends both physical scan evidence and trimmed reason',async()=>{
  let sent;
  await submitVerifiedReprint({jobId:'job-1',scannedValue:'B-IRAN-000001',expectedIdentity:'B-IRAN-000001',sessionId:'session-1',reason:'  paper changed  ',send:async(path,options)=>{sent={path,body:JSON.parse(options.body)}}});
  assert.deepEqual(sent,{path:'/api/print-jobs/job-1/retry',body:{verifiedScan:'B-IRAN-000001',sessionId:'session-1',reason:'paper changed'}});
});

test('printing dashboard derives presence from registered PRINTER devices',async()=>{
  const source=await readFile(new URL('../app.js',import.meta.url),'utf8');
  const page=source.slice(source.indexOf("case'printing'"),source.indexOf("case'trace'"));
  assert.match(page,/x\.type==='PRINTER'/);assert.match(page,/x\.presence==='ONLINE'/);assert.match(page,/آفلاین/);assert.match(page,/چاپگری ثبت نشده/);assert.doesNotMatch(page,/● متصل/);
});

test('retry button never carries or echoes the expected label identity',async()=>{
  const source=await readFile(new URL('../app.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/data-label=/);
  assert.doesNotMatch(source,/verifiedScan\s*:\s*b\.dataset/);
  assert.match(source,/querySelector\('\[data-reprint-scan\]'\)/);
});
