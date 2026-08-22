import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Docker image copies every root JavaScript module used by the web app',async()=>{const dockerfile=await readFile(new URL('../Dockerfile',import.meta.url),'utf8');assert.match(dockerfile,/^COPY index\.html style\.css \*\.js \/usr\/share\/nginx\/html\/$/m);for(const module of['scanner-capture.js','browser-uuid.js','reprint-verification.js','container-label-pdf.js'])assert.ok(dockerfile.includes('*.js'),`${module} must be covered by the JavaScript glob`)});
