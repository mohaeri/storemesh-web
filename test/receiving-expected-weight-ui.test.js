import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';

const source=()=>readFile(new URL('../app.js',import.meta.url),'utf8');

test('receiving exposes optional expected weight and omits it from empty requests',async()=>{const text=await source();assert.match(text,/وزن موردانتظار \(kg\) — اختیاری/);assert.match(text,/'expectedWeightKg','number'/);assert.match(text,/\.\.\.\(v\.expectedWeightKg\?\{expectedWeightKg:Number\(v\.expectedWeightKg\)\}:\{\}\)/)});
