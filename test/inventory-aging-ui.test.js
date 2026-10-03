import test from'node:test';
import assert from'node:assert/strict';
import{readFileSync}from'node:fs';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('inventory shows and sorts aging with its linked operator task',()=>{for(const token of['agingDays','agingWarningDaysByZone','agingTaskId','agingTaskPriority','کار اپراتور','در حال پیرشدن','سن نگهداری',"scope==='STORAGE'"])assert.ok(app.includes(token),token)});
