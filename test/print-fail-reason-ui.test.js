import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';

test('print failure sends the operator-selected structured reason code',async()=>{const source=await readFile(new URL('../app.js',import.meta.url),'utf8'),handler=source.slice(source.indexOf("if(b.dataset.printAction==='fail')"),source.indexOf("if(b.dataset.printAction==='retry')"));for(const code of['PRINTER_ERROR','PAPER_FINISHED','RIBBON_FINISHED','DAMAGED_LABEL','LOST_LABEL','POOR_PRINT_QUALITY','CUSTOMER_REQUEST','OTHER'])assert.match(source,new RegExp(code));assert.match(source,/data-print-fail-reason/);assert.match(handler,/reasonCode/);assert.doesNotMatch(handler,/خطای چاپگر/);assert.doesNotMatch(handler,/\{reason:/)});
