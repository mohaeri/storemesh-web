import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';

test('QC checklist authoring is rendered only for config:write sessions',async()=>{
  const source=await readFile(new URL('../app.js',import.meta.url),'utf8');
  const quality=source.slice(source.indexOf("case'quality'"),source.indexOf("case'fresh-export'"));
  assert.match(quality,/can\('config:write'\)\?panel\('تعریف چک‌لیست QC',[\s\S]*data-action="qc-checklist"[\s\S]*\):''/);
  const authoringGate=quality.indexOf("can('config:write')"),inspection=quality.indexOf("panel('ثبت نتیجه بازرسی'");
  assert.ok(authoringGate>=0&&inspection>authoringGate);
  assert.ok(quality.slice(authoringGate,inspection).endsWith("<div class=\"two-col\">${"));
  assert.doesNotMatch(quality.slice(inspection),/can\('config:write'\)/);
});
