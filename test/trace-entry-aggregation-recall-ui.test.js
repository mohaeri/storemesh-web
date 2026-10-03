import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('trace UI exposes code supplier customer and recall entry points',async()=>{const source=await readFile(new URL('../app.js',import.meta.url),'utf8'),page=source.slice(source.indexOf("case'trace'"),source.indexOf("case'master-data'"));for(const token of['value="lookup"','value="supplier"','value="customer"','value="recall"','کد شیء','تأمین‌کننده','مشتری'])assert.match(page,new RegExp(token));for(const route of['/api/trace/search?code=','/api/trace/supplier/','/api/trace/customer/','/recall'])assert.match(source,new RegExp(route.replace(/[?]/g,'\\?')))});
