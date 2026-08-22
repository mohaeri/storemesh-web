import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const modules=['dashboard','receiving','inventory','containers','production','quality','packaging','shipments','transfers','tasks','printing','trace','config','master-data','users','overrides','audit','cloud','system'];
const source=()=>readFile(new URL('../app.js',import.meta.url),'utf8');

test('operations console exposes every promised domain module',async()=>{const text=await source();for(const module of modules)assert.ok(text.includes(`['${module}'`)||text.includes(`case'${module}'`),`missing UI module ${module}`)});
test('UI uses site APIs and decodes standard JWT claims',async()=>{const text=await source();for(const endpoint of['inventory','containers','packages','shipments','configurations','audit'])assert.ok(text.includes(`'${endpoint}'`),`missing API integration ${endpoint}`);assert.ok(text.includes('fetch('));assert.ok(text.includes("split('.')[1]"))});
test('production cycles use scanned carriers and an admin-configured fixed machine',async()=>{const text=await source();assert.match(text,/data-action="cycle"/);assert.match(text,/scannedContainer\(v\.cycleContainerCode/);assert.match(text,/scope==='STATION_MACHINES'.*status==='ACTIVE'/);assert.doesNotMatch(text,/name="machineId"/);for(const action of['start','pause','resume','complete','finish','cancel'])assert.ok(text.includes(action))});
test('re-containerization requires a separately verified destination scan',async()=>{const text=await source();assert.match(text,/destinationContainerCode/);assert.match(text,/scannedContainer\(v\.destinationContainerCode/);assert.doesNotMatch(text,/name="containerId">\$\{options\(containers\)/)});
test('admin configuration phase one exposes real catalogs and identity assignments',async()=>{const text=await source();for(const endpoint of['master-data/packageTypes','harvest-periods','users','roles','skills'])assert.ok(text.includes(`'${endpoint}'`));for(const action of['master-create','harvest-create','user-role','user-skill','role-create','skill-create'])assert.ok(text.includes(`data-action="${action}"`));assert.match(text,/data-badge=/);assert.match(text,/data-revoke-role=/);assert.match(text,/data-revoke-skill=/);assert.match(text,/can\('roles:write'\)/)});
