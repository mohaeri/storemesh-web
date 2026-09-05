import test from'node:test';
import assert from'node:assert/strict';
import{randomUUID}from'node:crypto';
import{prepareQcSubmission}from'../qc-response.js';
import{StoreMesh}from'../../storemesh-site-server/src/domain.js';
import{PostgresRepository}from'../../storemesh-site-server/src/postgres-repository.js';
import{readFile}from'node:fs/promises';

const key=()=>randomUUID();

test('form submission preserves a required FAIL response through PostgreSQL',{skip:!process.env.DATABASE_URL},async()=>{const site=`FR86-${Date.now()}`,repository=new PostgresRepository({connectionString:process.env.DATABASE_URL,siteCode:site});try{const app=new StoreMesh({site,initialState:await repository.load(),seedDemoReferences:true});app.repository=repository;const session=app.openSession('quality-user','TEST-DEVICE','QC','QUALITY_OPERATOR'),container=app.createContainer({capacityKg:20},key()),batch=app.receive({sessionId:session.id,containerId:container.id,supplier:'S',product:'T',grade:'A',size:'L',weightKg:5},key()),checklist=app.createQcChecklist({code:'FR86-QC',product:'T',stage:'RECEIVING',name:'Receiving QC',items:[{code:'VISUAL',prompt:'Visual condition',required:true}]},key()),prepared=prepareQcSubmission(checklist,[{itemCode:'VISUAL',value:'FAIL'}],'REJECTED'),record=app.qualityCheck({sessionId:session.id,batchId:batch.id,stage:'RECEIVING',checklistId:checklist.id,responses:prepared.responses,result:'REJECTED',attestation:{confirmed:true,role:'QUALITY_OPERATOR'},actorRoles:['QUALITY_OPERATOR'],inspectorId:'quality-user'},key());assert.equal(record.responses[0].value,'FAIL');await app.flush();const restored=await repository.load();assert.equal(restored.qualityChecks.find(x=>x.id===record.id).responses[0].value,'FAIL')}finally{await repository.close()}});

test('form submission still blocks an unanswered required item',()=>{const checklist={items:[{code:'VISUAL',required:true},{code:'NOTE',required:false}]};assert.throws(()=>prepareQcSubmission(checklist,[{itemCode:'VISUAL',value:''}],'REJECTED'),/پاسخ همه آیتم‌های الزامی/)});

test('approved result with a required FAIL produces a visible warning without blocking',()=>{const prepared=prepareQcSubmission({items:[{code:'VISUAL',required:true}]},[{itemCode:'VISUAL',value:'FAIL'}],'APPROVED');assert.equal(prepared.responses[0].value,'FAIL');assert.match(prepared.warning,/سازگار نیست/)});

test('quality form renders explicit Pass Fail and N/A choices instead of a checkbox',async()=>{const source=await readFile(new URL('../app.js',import.meta.url),'utf8'),quality=source.slice(source.indexOf("case'quality'"),source.indexOf("case'packaging'"));for(const value of['data-qc-item','value="PASS"','value="FAIL"','value="NA"'])assert.match(quality,new RegExp(value));assert.doesNotMatch(quality,/name="qc-response"/)});
