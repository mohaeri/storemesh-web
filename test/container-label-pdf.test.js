import test from 'node:test';
import assert from 'node:assert/strict';
import { buildContainerLabelPdf } from '../container-label-pdf.js';

test('offline container label is a real PDF with QR geometry and readable identity',()=>{const qrFactory=()=>({addData(value){this.value=value},make(){},getModuleCount(){return 2},isDark(row,col){return row===col}}),text=new TextDecoder().decode(buildContainerLabelPdf({code:'C-IRAN-000123',type:'BASKET'},qrFactory));assert.match(text,/^%PDF-1\.4/);assert.match(text,/C-IRAN-000123/);assert.match(text,/Type: BASKET/);assert.equal((text.match(/ re f/g)||[]).length,2);assert.match(text,/%%EOF$/)});
