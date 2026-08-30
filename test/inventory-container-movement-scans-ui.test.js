import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';

test('container movement uses physical container and configured destination scans',async()=>{const text=await readFile(new URL('../app.js',import.meta.url),'utf8'),page=text.slice(text.indexOf("case'containers'"),text.indexOf("case'production'"));for(const token of["scope==='WAREHOUSE_MOVEMENT'",'requireDestinationScan','moveContainerCode','destinationZoneCode','data-require-destination-scan'])assert.ok(page.includes(token),token);assert.match(text,/scannedContainer\(v\.moveContainerCode,f\.elements\.moveContainerCode\)/);assert.match(text,/scannedContainerId:container\.id/);assert.match(text,/v\.destinationZoneCode!==v\.zone/)});
