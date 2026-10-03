import test from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';
const source=await readFile(new URL('../app.js',import.meta.url),'utf8');
test('quality console exposes exception dashboard filters lifecycle and CAPA closure',()=>{for(const token of['exception-filter','IN_PROGRESS','Inventory','Production','Labeling','Quality','Shipping','System','data-exception-start','data-exception-close','rootCause','correctiveAction','preventiveAction','/api/exceptions?'])assert.ok(source.includes(token),`missing ${token}`)});
