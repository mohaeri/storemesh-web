import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source=()=>readFile(new URL('../app.js',import.meta.url),'utf8');

test('grade and size rows display existing product associations in editable and read-only modes',async()=>{
  const text=await source(),table=text.slice(text.indexOf('function masterDataTable'),text.indexOf('function taskCards'));
  assert.match(table,/\['grades','sizes'\]\.includes\(type\).*name="productCodes".*x\.productCodes/);
  assert.match(table,/\['grades','sizes'\]\.includes\(type\).*x\.productCodes.*بدون محدودیت محصول/);
});

test('master-data edit parses and submits changed grade or size product codes',async()=>{
  const text=await source(),handler=text.slice(text.indexOf("if(a==='master-update')"),text.indexOf("if(a==='harvest-create')"));
  assert.match(handler,/\/api\/master-data\/\$\{f\.dataset\.masterType\}\/\$\{f\.dataset\.masterId\}\/update/);
  assert.match(handler,/\['grades','sizes'\]\.includes\(f\.dataset\.masterType\)/);
  assert.match(handler,/productCodes:v\.productCodes\.split\(','\)\.map\(x=>x\.trim\(\)\)\.filter\(Boolean\)/);
});
