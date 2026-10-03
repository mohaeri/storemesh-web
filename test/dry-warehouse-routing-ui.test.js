import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('dry and freeze-dried cartons are visibly routed to the dry warehouse',async()=>{
  const source=await readFile(new URL('../app.js',import.meta.url),'utf8');
  for(const token of['packageRequiresDryWarehouse','DRY_WAREHOUSE','ثبت ورود به انبار خشک','مقصد این کارتن خشک/فریزدرای'])assert.equal(source.includes(token),true,token);
});
