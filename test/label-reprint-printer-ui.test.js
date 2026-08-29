import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('printing page exposes search-driven existing-label reprint with fixed reasons',async()=>{
  const source=await readFile(new URL('../app.js',import.meta.url),'utf8'),page=source.slice(source.indexOf("case'printing'"),source.indexOf("case'trace'"));
  assert.match(page,/data-action="label-reprint"/);assert.match(page,/BASKET.*TRAY.*PACKAGE.*CARTON.*FRESH_SHIPPING_BOX/s);
  for(const reason of['PRINTER_ERROR','PAPER_FINISHED','RIBBON_FINISHED','DAMAGED_LABEL','LOST_LABEL','POOR_PRINT_QUALITY','CUSTOMER_REQUEST','OTHER'])assert.match(page,new RegExp(reason));
  assert.match(source,/post\('\/api\/labels\/reprint'/);
});

test('printing page shows resolved printer and supports one-job override',async()=>{
  const source=await readFile(new URL('../app.js',import.meta.url),'utf8');assert.match(source,/selectedPrinterId/);assert.match(source,/printerOverride/);assert.match(source,/data-print-printer=/);assert.match(source,/\/api\/print-jobs\/\$\{b\.dataset\.printPrinter\}\/printer/);
});
