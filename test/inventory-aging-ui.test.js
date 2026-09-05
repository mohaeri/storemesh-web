import test from'node:test';
import assert from'node:assert/strict';
import{readFileSync}from'node:fs';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('inventory shows and sorts aging with the configured storage threshold',()=>{for(const token of['agingDays','agingWarningDaysByZone','در حال پیرشدن','سن نگهداری',"scope==='STORAGE'"])assert.ok(app.includes(token),token)});
