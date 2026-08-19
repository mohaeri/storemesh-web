import { submitVerifiedReprint } from './reprint-verification.js';
import { bindScannerInputs } from './scanner-capture.js';
import { browserUuid } from './browser-uuid.js';

const API=localStorage.api||'http://127.0.0.1:3000';
const CLOUD=localStorage.cloudApi||'http://127.0.0.1:4000';
const state={token:sessionStorage.token||'',sessionId:sessionStorage.sessionId||'',route:location.hash.slice(1)||'dashboard',data:{},loading:false};
const $=s=>document.querySelector(s);
const esc=v=>String(v??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fa=n=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:2}).format(Number(n)||0);
const dt=v=>v?new Intl.DateTimeFormat('fa-IR',{dateStyle:'short',timeStyle:'short'}).format(new Date(v)):'—';
const key=()=>browserUuid();
const claims=()=>{try{return JSON.parse(atob(state.token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))}catch{return{}}};
const actor=()=>claims().sub||'web-user';
const deviceId=()=>{let id=localStorage.deviceId;if(!id){id=`WEB-${browserUuid()}`;localStorage.deviceId=id}return id};
const routes=[
 ['dashboard','⌂','داشبورد','نمای کلی عملیات'],
 ['receiving','⇲','دریافت','ثبت ورود و توزین'],
 ['inventory','▦','موجودی','بچ‌ها و جابه‌جایی'],
 ['containers','□','کانتینرها','ظرف‌ها و ظرفیت'],
 ['production','⚙','تولید','فرآوری و افت تولید'],
 ['quality','✓','کنترل کیفیت','قرنطینه و اصلاح'],
 ['packaging','▣','بسته‌بندی','ایجاد بسته'],
 ['shipments','➜','ارسال‌ها','بارگیری و تحویل'],
 ['transfers','⇄','انتقال بین سایت','مانیفست ورودی'],
 ['tasks','☷','کارها','صف وظایف'],
 ['printing','▤','چاپ و لیبل','صف چاپگر'],
 ['trace','⌁','رهگیری','شجره محصول'],
 ['config','⚒','تنظیمات','نسخه و تأیید'],
 ['overrides','!','استثناها','درخواست و تصویب'],
 ['audit','≡','رویدادها','ممیزی و همگام‌سازی'],
 ['cloud','☁','مرکز چندسایتی','وضعیت سایت‌ها'],
 ['system','●','سلامت سامانه','سرویس‌ها و نشست‌ها']
];
const endpoints=['inventory','containers','packages','shipments','tasks','print-jobs','quality-checks','configurations','overrides','audit','outbox','sessions','internal-transfers','inventory-adjustments'];

async function request(path,options={}){
  const r=await fetch(API+path,{...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(state.token?{Authorization:`Bearer ${state.token}`}:{}) ,...(options.headers||{})}});
  const j=await r.json();if(!r.ok)throw Error(j.message||j.errorCode||'خطای ارتباط');return j.data??j;
}
const post=(path,body={})=>request(path,{method:'POST',headers:{'Idempotency-Key':key()},body:JSON.stringify(body)});
async function ensureSession(){if(!state.sessionId){state.sessionId=(await post('/api/sessions',{operatorId:actor(),deviceId:deviceId(),station:'web-console'})).id;sessionStorage.sessionId=state.sessionId}return state.sessionId}
function scannedContainer(code,input){const normalized=String(code||'').trim();if(!normalized||input?.dataset.scanVerified!=='true')throw Error('اسکن سخت‌افزاری ظرف یا سینی الزامی است');const container=(state.data.containers?.items||[]).find(x=>x.code===normalized);if(!container)throw Error('کد اسکن‌شده در فهرست ظروف معتبر نیست');return container}
function toast(message,type='ok'){const el=$('#toast');el.textContent=message;el.className=`show ${type}`;setTimeout(()=>el.className='',3200)}
function status(value){const cls=/APPROVED|ACTIVE|AVAILABLE|COMPLETED|DELIVERED|CONFIRMED|RECEIVED|RELEASED/.test(value)?'good':/FAILED|REJECTED|CANCELLED|WASTED/.test(value)?'bad':/QUARANTINE|PENDING|SUSPENDED/.test(value)?'warn':'neutral';return `<span class="status ${cls}">${esc(value)}</span>`}
function empty(text='هنوز داده‌ای ثبت نشده است'){return `<div class="empty"><b>◇</b><p>${text}</p></div>`}
function table(headers,rows){return rows.length?`<div class="table-wrap"><table><thead><tr>${headers.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`:empty()}
function options(items,label='code'){return items.map(x=>`<option value="${esc(x.id)}">${esc(x[label]||x.title||x.id)}</option>`).join('')}
function panel(title,body,extra=''){return `<section class="panel"><div class="panel-head"><div><h2>${title}</h2>${extra}</div></div>${body}</section>`}
function field(label,name,type='text',value='',attrs=''){return `<label><span>${label}</span><input name="${name}" type="${type}" value="${esc(value)}" ${attrs}></label>`}
function scanField(label,name='containerCode'){return `<label><span>${label}</span><input name="${name}" data-scanner-input data-scan-verified="false" readonly inputmode="none" autocomplete="off" required placeholder="برای اسکن لمس کنید"></label>`}
function select(label,name,items){return `<label><span>${label}</span><select name="${name}">${items.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select></label>`}

function shell(){
 const user=claims();
 return `<div class="app-shell">
 <aside><div class="logo"><span>SM</span><div><b>StoreMesh</b><small>Operations OS</small></div></div>
 <nav>${routes.map(([id,icon,title])=>`<a href="#${id}" class="${state.route===id?'active':''}"><i>${icon}</i><span>${title}</span></a>`).join('')}</nav>
 <div class="side-foot"><span class="live-dot"></span><div><b>سایت ایران</b><small>متصل به سرور محلی</small></div></div></aside>
 <main><header><button id="menuButton" class="icon-btn">☰</button><div class="breadcrumbs"><small>STOREMESH / IRAN</small><h1>${esc(routes.find(x=>x[0]===state.route)?.[2]||'داشبورد')}</h1></div>
 <div class="header-actions"><button class="site-switch">IRAN⌄</button><button class="icon-btn" title="اعلان‌ها">●</button><div class="user"><span>${esc((user.username||'U')[0].toUpperCase())}</span><div><b>${esc(user.username||'کاربر')}</b><small>${esc((user.roles||[]).join('، '))}</small></div></div><button id="logout" class="icon-btn" title="خروج">↪</button></div></header>
 <div class="content"><div id="page">${renderPage()}</div></div></main></div>`;
}

function renderPage(){
 const d=state.data,inv=d.inventory?.items||[],containers=d.containers?.items||[],packages=d.packages?.items||[],shipments=d.shipments?.items||[],tasks=d.tasks?.items||[],prints=d['print-jobs']?.items||[];
 if(state.loading)return '<div class="loading"><span></span><p>در حال دریافت اطلاعات عملیات…</p></div>';
 switch(state.route){
 case'dashboard':{
  const total=inv.reduce((n,x)=>n+x.weightKg,0),quarantine=inv.filter(x=>x.zone==='QUARANTINE').length,open=tasks.filter(x=>x.status==='OPEN').length;
  return `<div class="hero"><div><span class="eyebrow">مرکز فرمان عملیات</span><h2>امروز در سایت ایران</h2><p>وضعیت زنده جریان مواد از دریافت تا ارسال</p></div><button data-go="receiving" class="primary">＋ دریافت جدید</button></div>
  <div class="kpis">${[['بچ فعال',inv.length,'▦','green'],['موجودی کل',fa(total)+' kg','◒','blue'],['وظیفه باز',open,'☷','orange'],['قرنطینه',quarantine,'!','red'],['ارسال فعال',shipments.filter(x=>!['DELIVERED','CANCELLED'].includes(x.status)).length,'➜','purple']].map(x=>`<article><span class="kpi-icon ${x[3]}">${x[2]}</span><div><small>${x[0]}</small><b>${x[1]}</b></div></article>`).join('')}</div>
  <div class="two-col">${panel('توزیع موجودی در زون‌ها',zoneChart(inv))}${panel('کارهای اولویت‌دار',taskCards(tasks.slice(0,5)))}</div>
  <div class="two-col">${panel('آخرین بچ‌ها',inventoryTable(inv.slice(-6).reverse()))}${panel('وضعیت چاپ و لیبل',printCards(prints.slice(-5).reverse()))}</div>`;
 }
 case'receiving':return `<div class="page-intro"><div><h2>دریافت و توزین ورودی</h2><p>ایجاد بچ قابل رهگیری و صدور خودکار لیبل QR</p></div><span class="device-chip">◉ ترازو آماده</span></div>
  ${panel('فرم دریافت جدید',`<form data-action="receive" class="form-grid">${scanField('اسکن QR سبد')}${field('تأمین‌کننده','supplier','','تأمین‌کننده نمونه','required')}${field('محصول','product','','Truffle','required')}${select('گرید','grade',['A','B','C','INDUSTRIAL'])}${select('اندازه','size',['Small','Medium','Large','Mixed'])}${field('دوره برداشت','harvestPeriod','','2026-Q3')}${field('وزن خالص (kg)','weightKg','number','12.5','step=".001" min=".001" required')}<div class="scale-readout"><small>خوانش ترازو</small><b>12.500 <em>kg</em></b><span>پایدار ✓</span></div><button class="primary">ثبت دریافت و چاپ لیبل</button></form>`)}
  ${panel('دریافت‌های اخیر',inventoryTable(inv.filter(x=>x.status==='RECEIVED').slice(-8).reverse()))}`;
 case'inventory':return `<div class="toolbar"><div class="search">⌕ <input id="inventorySearch" placeholder="جست‌وجوی کد، محصول، گرید یا زون"></div><button data-export="inventory">دریافت CSV</button><button data-go="receiving" class="primary">＋ بچ جدید</button></div>
  <div class="filters"><button class="active">همه ${inv.length}</button>${['RECEIVING','COLD_ROOM','SORTING','PROCESSING','PACKAGING','QUARANTINE'].map(z=>`<button data-zone="${z}">${z} ${inv.filter(x=>x.zone===z).length}</button>`).join('')}</div>
  ${panel('موجودی لحظه‌ای',`<div id="inventoryTable">${inventoryTable(inv)}</div>`)}
  ${panel('انتقال بچ بین زون‌ها',`<form data-action="move" class="inline-form"><label><span>بچ</span><select name="batchId">${options(inv)}</select></label>${select('زون مقصد','zone',['COLD_ROOM','SORTING','WASHING','SLICING','FREEZING','PROCESSING','PACKAGING','SHIPPING','QUARANTINE'])}<button class="primary">ثبت جابه‌جایی</button></form>`)}`;
 case'containers':return `<div class="split-head"><div><h2>مدیریت کانتینرها</h2><p>کنترل ظرفیت، محصول یکتا و جابه‌جایی گروهی</p></div></div>
  <div class="two-col">${panel('ایجاد کانتینر',`<form data-action="container" class="stack-form">${select('نوع','type',['BASKET','CRATE','TRAY'])}${field('ظرفیت kg','capacityKg','number','100','min="1"')}${select('زون اولیه','zone',['RECEIVING','COLD_ROOM','SORTING','PROCESSING'])}<button class="primary">ایجاد و چاپ کد</button></form>`)}
  ${panel('تخصیص بچ',`<form data-action="assign-container" class="stack-form"><label><span>کانتینر</span><select name="containerId">${options(containers)}</select></label><label><span>بچ</span><select name="batchId">${options(inv)}</select></label><button class="primary">تخصیص به کانتینر</button></form>`)}</div>
  <div class="container-grid">${containers.length?containers.map(c=>`<article class="container-card"><div><span class="box-icon">□</span>${status(c.status)}</div><h3>${esc(c.code)}</h3><p>${esc(c.type)} · ${esc(c.zone)}</p><div class="meter"><span style="width:${Math.min(100,(c.batchIds?.reduce((n,id)=>n+(inv.find(x=>x.id===id)?.weightKg||0),0)/c.capacityKg)*100)}%"></span></div><small>${c.batchIds?.length||0} بچ از ظرفیت ${fa(c.capacityKg)} kg</small></article>`).join(''):empty()}</div>`;
 case'production':return `<div class="process-strip">${['SORT','WASH','SLICE','FREEZE','FREEZE_DRY','DRY','MERGE'].map((x,i)=>`<div><span>${i+1}</span><b>${x}</b></div>`).join('')}</div>
  <div class="two-col">${panel('اجرای فرآیند تولید',`<form data-action="transform" class="stack-form"><label><span>بچ ورودی</span><select name="batchId">${options(inv.filter(x=>x.weightKg>0))}</select></label>${scanField('اسکن QR ظرف/سینی')}${select('فرآیند','process',['WASH','SLICE','FREEZE','FREEZE_DRY','DRY'])}${field('وزن مصرفی kg','consumeWeightKg','number','10','step=".001"')}${field('وزن خروجی kg','outputWeightKg','number','9.2','step=".001"')}<div class="form-row">${field('محصول خروجی','product','','Truffle')}${field('گرید','grade','','A')}</div><button class="primary">ثبت فرآوری و شجره</button></form>`)}
  ${panel('تفکیک چندخروجی',`<form data-action="sorting" class="stack-form"><label><span>بچ ورودی</span><select name="batchId">${options(inv.filter(x=>x.weightKg>0))}</select></label>${scanField('اسکن QR سبد')}<div class="form-row">${field('خروجی A kg','a','number','5')}${field('خروجی B kg','b','number','3')}</div><button class="primary">اجرای Sorting</button></form>`)}</div>
  ${panel('بچ‌های فرآوری‌شده',inventoryTable(inv.filter(x=>x.process||/WASH|SLIC|FROZEN|DRIED|SORTED|MERGED/.test(x.status))))}`;
 case'quality':{const checks=d['quality-checks']?.items||[],quarantined=inv.filter(x=>x.zone==='QUARANTINE');return `<div class="kpis compact"><article><span class="kpi-icon green">✓</span><div><small>تأیید شده</small><b>${checks.filter(x=>x.result==='APPROVED').length}</b></div></article><article><span class="kpi-icon orange">!</span><div><small>قرنطینه</small><b>${quarantined.length}</b></div></article><article><span class="kpi-icon red">×</span><div><small>رد شده</small><b>${checks.filter(x=>x.result==='REJECTED').length}</b></div></article></div>
  <div class="two-col">${panel('ثبت نتیجه بازرسی',`<form data-action="quality" class="stack-form"><label><span>بچ</span><select name="batchId">${options(inv)}</select></label>${select('نتیجه','result',['APPROVED','QUARANTINED','REJECTED'])}${field('توضیحات','notes','','بازرسی ظاهری و دمایی')}<button class="primary">ثبت نتیجه QC</button></form>`)}
  ${panel('آزادسازی قرنطینه',quarantined.length?`<form data-action="release" class="stack-form"><label><span>بچ قرنطینه</span><select name="batchId">${options(quarantined)}</select></label>${field('دلیل آزادسازی','reason','','تأیید آزمایش تکمیلی')}${select('زون مقصد','destinationZone',['COLD_ROOM','PROCESSING','PACKAGING'])}<button class="primary">آزادسازی با تأیید</button></form>`:empty('بچ قرنطینه‌ای وجود ندارد'))}</div>
  ${panel('سوابق کنترل کیفیت',table(['بچ','نتیجه','بازرس','توضیح','زمان'],checks.slice().reverse().map(q=>`<tr><td>${esc(inv.find(x=>x.id===q.batchId)?.code)}</td><td>${status(q.result)}</td><td>${esc(q.inspectorId)}</td><td>${esc(q.notes)}</td><td>${dt(q.createdAt)}</td></tr>`)))}`;}
 case'packaging':return `<div class="two-col">${panel('ایجاد بسته',`<form data-action="package" class="stack-form">${select('سطح بسته','level',['CARTON','EPS','PALLET'])}${select('نوع بسته','type',['CARTON','EPS','PALLET','BAG','JAR'])}<label><span>بچ موجود (برای کارتن)</span><select name="batchId"><option value="">—</option>${options(inv.filter(x=>x.weightKg>0))}</select></label><label><span>بسته فرزند (برای EPS/پالت)</span><select name="childPackageId"><option value="">—</option>${options(packages.filter(x=>x.status==='READY_TO_SHIP'&&!x.parentPackageId))}</select></label>${field('وزن بسته kg','weightKg','number','2','step=".001"')}<button class="primary">ایجاد بسته</button></form>`)}
  ${panel('خلاصه بسته‌بندی',`<div class="big-stat"><b>${packages.length}</b><span>بسته ایجادشده</span></div><div class="big-stat"><b>${fa(packages.reduce((n,p)=>n+(p.items||[]).reduce((s,x)=>s+x.weightKg,0),0))}</b><span>کیلوگرم بسته‌بندی</span></div>`)}</div>
  ${panel('فهرست بسته‌ها',table(['کد','سطح','محتوا','وزن','وضعیت','عملیات'],packages.map(p=>`<tr><td><b>${esc(p.code)}</b></td><td>${esc(p.level||p.type)}</td><td>${p.items?.length||p.childPackageIds?.length||0}</td><td>${fa((p.items||[]).reduce((n,x)=>n+x.weightKg,0))} kg</td><td>${status(p.status)}</td><td class="actions">${packageAction(p)}</td></tr>`)))}`;
 case'shipments':return `<div class="two-col">${panel('ایجاد محموله',`<form data-action="shipment" class="stack-form">${select('سایت مقصد','destinationSite',['DUBAI','ROME','IRAN'])}<label><span>بسته‌های آماده</span><select name="packageId">${options(packages.filter(x=>x.status==='READY_TO_SHIP'&&!x.shipmentId&&!x.parentPackageId))}</select></label><button class="primary">ایجاد Shipment</button></form>`)}${panel('چرخه ارسال','<div class="timeline"><span class="done">READY</span><i></i><span>LOADED</span><i></i><span>DISPATCHED</span><i></i><span>DELIVERED</span></div>')}</div>
  ${panel('محموله‌ها',table(['کد','مقصد','بسته‌ها','وضعیت','عملیات'],shipments.map(s=>`<tr><td><b>${esc(s.code)}</b></td><td>${esc(s.destinationSite)}</td><td>${s.packageIds?.length||0}</td><td>${status(s.status)}</td><td class="actions">${shipmentActions(s)}</td></tr>`)))}`;
 case'transfers':{const transfers=d['internal-transfers']?.items||[];return `<div class="two-col">${panel('دریافت مانیفست سایت دیگر',`<form data-action="transfer" class="stack-form"><label><span>JSON مانیفست</span><textarea name="manifest" rows="10" placeholder='{"sourceSite":"IRAN",...}'></textarea></label><button class="primary">اعتبارسنجی و دریافت</button></form>`)}${panel('قواعد انتقال',`<ul class="rules"><li>هر سایت دیتابیس مستقل دارد</li><li>فقط مانیفست DISPATCHED پذیرفته می‌شود</li><li>دریافت تکراری مسدود می‌شود</li><li>منبع خارجی در شجره حفظ می‌شود</li></ul>`)}</div>
  ${panel('انتقال‌های دریافت‌شده',table(['سایت مبدأ','Shipment','بچ‌های ایجادشده','دریافت‌کننده','زمان'],transfers.map(x=>`<tr><td>${esc(x.sourceSite)}</td><td>${esc(x.shipmentCode)}</td><td>${x.batchIds?.length||0}</td><td>${esc(x.receivedBy)}</td><td>${dt(x.receivedAt)}</td></tr>`)))}`;}
 case'tasks':return `<div class="two-col">${panel('ایجاد وظیفه',`<form data-action="task" class="stack-form">${field('عنوان کار','title','','تفکیک سفارش جدید')}${select('زون','zone',['RECEIVING','SORTING','WASHING','PACKAGING','SHIPPING'])}${field('اولویت','priority','number','50','min="1" max="100"')}<button class="primary">افزودن به صف</button></form>`)}${panel('نمای صف',`<div class="task-summary"><div><b>${tasks.filter(x=>x.status==='OPEN').length}</b><span>باز</span></div><div><b>${tasks.filter(x=>x.status==='IN_PROGRESS').length}</b><span>در حال انجام</span></div></div>`)}</div>${panel('وظایف عملیات',taskCards(tasks))}`;
 case'printing':return `<div class="printer-head"><div><span class="printer-icon">▤</span><div><h2>Zebra ZT411</h2><p>چاپگر اصلی سایت · 300 dpi</p></div></div><span class="device-chip">● متصل</span></div>${panel('صف چاپ',printCards(prints))}`;
 case'trace':return `<div class="trace-search"><h2>رهگیری کامل محصول</h2><p>کد بچ را وارد کنید تا منشأ، فرآیندها، اندازه‌گیری‌ها و جابه‌جایی‌ها نمایش داده شود.</p><form data-action="trace"><input name="code" placeholder="B-IRAN-000001"><button class="primary">نمایش شجره</button></form></div><div id="traceResult">${empty('برای شروع یک کد Batch جست‌وجو کنید')}</div>`;
 case'config':{const configs=d.configurations?.items||[];return `<div class="two-col">${panel('نسخه تنظیمات جدید',`<form data-action="config" class="stack-form">${field('دامنه','scope','','SITE_OPERATION')}${field('مقادیر JSON','values','','{&quot;maxLossPercent&quot;: 15}')}<button class="primary">ایجاد Draft</button></form>`)}${panel('چرخه چهارچشمی','<div class="approval-flow"><span>DRAFT</span><b>←</b><span>APPROVED</span><b>←</b><span>ACTIVE</span></div><p class="muted">سازنده اجازه تأیید نسخه خودش را ندارد.</p>')}</div>${panel('نسخه‌ها',table(['دامنه','نسخه','وضعیت','سازنده','عملیات'],configs.map(c=>`<tr><td>${esc(c.scope)}</td><td>v${c.sequence}</td><td>${status(c.status)}</td><td>${esc(c.createdBy)}</td><td class="actions">${c.status==='DRAFT'? `<button data-config="${c.id}" data-transition="approve">تأیید</button>`:c.status==='APPROVED'? `<button data-config="${c.id}" data-transition="activate">فعال‌سازی</button>`:'—'}</td></tr>`)))}`;}
 case'overrides':{const items=d.overrides?.items||[];return `<div class="two-col">${panel('درخواست استثنا',`<form data-action="override" class="stack-form">${field('کد قانون','ruleCode','','CAPACITY_LIMIT')}${field('شناسه موجودیت','entityId','','manual')}${field('دلیل','reason','','شرایط اضطراری مستندشده')}<button class="primary">ارسال برای تأیید</button></form>`)}${panel('اصل کنترل داخلی','<div class="shield">◆</div><h3>تفکیک وظایف</h3><p class="muted">درخواست‌کننده نمی‌تواند استثنای خودش را تصویب کند.</p>')}</div>${panel('درخواست‌ها',table(['قانون','دلیل','درخواست‌کننده','وضعیت','عملیات'],items.map(o=>`<tr><td>${esc(o.ruleCode)}</td><td>${esc(o.reason)}</td><td>${esc(o.requestedBy)}</td><td>${status(o.status)}</td><td class="actions">${o.status==='PENDING'? `<button data-override="${o.id}" data-decision="APPROVED">تأیید</button><button class="danger-link" data-override="${o.id}" data-decision="REJECTED">رد</button>`:'—'}</td></tr>`)))}`;}
 case'audit':{const audit=d.audit?.items||[],outbox=d.outbox?.items||[];return `<div class="kpis compact"><article><span class="kpi-icon blue">≡</span><div><small>کل رویدادها</small><b>${audit.length}</b></div></article><article><span class="kpi-icon orange">↻</span><div><small>در انتظار Cloud</small><b>${outbox.filter(x=>x.status==='PENDING').length}</b></div></article></div>${panel('دفتر رویداد تغییرناپذیر',table(['نوع رویداد','موجودیت','سایت','زمان'],audit.slice().reverse().map(e=>`<tr><td><b>${esc(e.type)}</b></td><td class="mono">${esc(e.entityId)}</td><td>${esc(e.site)}</td><td>${dt(e.occurredAt)}</td></tr>`)))}`;}
 case'cloud':return `<div id="cloudContent"><div class="loading small"><span></span><p>دریافت وضعیت سایت‌ها…</p></div></div>`;
 case'system':{const sessions=d.sessions?.items||[];return `<div class="service-grid"><article><span class="service-ok">●</span><h3>Site API</h3><p>IRAN · Port 3000</p><b>Operational</b></article><article><span class="service-ok">●</span><h3>PostgreSQL</h3><p>پایگاه داده مستقل سایت</p><b>Ready</b></article><article><span class="service-ok">●</span><h3>Cloud Sync</h3><p>Outbox Publisher</p><b>Connected</b></article><article><span class="service-ok">●</span><h3>Web Console</h3><p>نسخه کامل UI</p><b>Online</b></article></div>${panel('نشست‌های عملیاتی',table(['اپراتور','ایستگاه','وضعیت','شروع','عملیات'],sessions.slice().reverse().map(s=>`<tr><td>${esc(s.operatorId)}</td><td>${esc(s.station)}</td><td>${status(s.status)}</td><td>${dt(s.startedAt)}</td><td class="actions">${s.status==='ACTIVE'? `<button data-session="${s.id}" data-session-action="suspend">تعلیق</button><button data-session="${s.id}" data-session-action="complete">پایان</button>`:s.status==='SUSPENDED'? `<button data-session="${s.id}" data-session-action="resume">ادامه</button>`:'—'}</td></tr>`)))}`;}
 default:return empty('صفحه پیدا نشد');
 }}

function inventoryTable(items){return table(['کد بچ','محصول','گرید/اندازه','وزن','زون','وضعیت'],items.map(x=>`<tr><td><b class="mono">${esc(x.code)}</b></td><td>${esc(x.product)}</td><td>${esc(x.grade)} · ${esc(x.size)}</td><td><b>${fa(x.weightKg)}</b> kg</td><td>${esc(x.zone)}</td><td>${status(x.status)}</td></tr>`))}
function taskCards(items){return items.length?`<div class="task-list">${items.map(t=>`<article><span class="priority p${Math.ceil((t.priority||50)/25)}">${t.priority||50}</span><div><b>${esc(t.title)}</b><small>${esc(t.zone)} · ${dt(t.createdAt)}</small></div>${status(t.status)}${t.status==='OPEN'?`<button data-task="${t.id}">شروع</button>`:''}</article>`).join('')}</div>`:empty('کاری در صف نیست')}
function printCards(items){return items.length?`<div class="print-list">${items.map(j=>`<article><span class="label-icon">▤</span><div><b>${esc(j.label)}</b><small>${esc(j.entityType)} · تلاش ${j.attempts||0}</small></div>${status(j.status)}<div class="actions">${j.status==='PENDING'?`<button data-print="${j.id}" data-print-action="complete">چاپ شد</button><button data-print="${j.id}" data-print-action="fail">خطا</button>`:j.status==='FAILED'?`<label class="reprint-scan"><span>اسکن لیبل موجود</span><input data-reprint-scan data-scanner-input data-scan-verified="false" readonly inputmode="none" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="اسکنر را روی لیبل بگیرید"></label><button data-print="${j.id}" data-print-action="retry">تأیید اسکن و چاپ مجدد</button>`:''}</div></article>`).join('')}</div>`:empty('صف چاپ خالی است')}
function zoneChart(inv){const groups=Object.entries(inv.reduce((a,x)=>(a[x.zone]=(a[x.zone]||0)+x.weightKg,a),{})).sort((a,b)=>b[1]-a[1]),max=Math.max(1,...groups.map(x=>x[1]));return groups.length?`<div class="bar-chart">${groups.map(([z,n])=>`<div><span>${esc(z)}</span><i><b style="width:${n/max*100}%"></b></i><strong>${fa(n)} kg</strong></div>`).join('')}</div>`:empty()}
function shipmentActions(s){const next={READY:'load',LOADED:'dispatch',DISPATCHED:'deliver'}[s.status];return next?`<button data-shipment="${s.id}" data-shipment-action="${next}">${{load:'بارگیری',dispatch:'ارسال',deliver:'تحویل'}[next]}</button>`:'—'}
function packageAction(p){const next={DRAFT:'pack',PACKING:'seal',READY_FOR_LABEL:'print',PRINTING:'print_success',LABEL_PENDING:'retry',LABEL_PRINTED:'ready'}[p.status];return next?`<button data-package="${p.id}" data-package-action="${next}">${{pack:'شروع',seal:'پلمب',print:'چاپ',print_success:'تأیید چاپ',retry:'تلاش مجدد',ready:'آماده ارسال'}[next]}</button>`:'—'}

async function loadData(){
 state.loading=true;render();
 try{const results=await Promise.all(endpoints.map(async e=>[e,await request('/api/'+e).catch(()=>({items:[]}))]));state.data=Object.fromEntries(results)}
 catch(e){toast(e.message,'bad')}finally{state.loading=false;render();if(state.route==='cloud')loadCloud()}
}
function render(){if(!state.token){$('#loginDialog').showModal();return}$('#app').innerHTML=shell();bindShell();bindScannerInputs($('#app'))}
function bindShell(){
 $('#logout')?.addEventListener('click',()=>{sessionStorage.clear();state.token='';state.sessionId='';location.reload()});
 $('#menuButton')?.addEventListener('click',()=>document.querySelector('aside').classList.toggle('open'));
 document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>location.hash=b.dataset.go);
 document.querySelectorAll('form[data-action]').forEach(f=>f.onsubmit=handleForm);
 $('#inventorySearch')?.addEventListener('input',e=>{$('#inventoryTable').innerHTML=inventoryTable((state.data.inventory?.items||[]).filter(x=>Object.values(x).some(v=>String(v).toLowerCase().includes(e.target.value.toLowerCase()))))});
 document.querySelectorAll('[data-zone]').forEach(b=>b.onclick=()=>{$('#inventoryTable').innerHTML=inventoryTable((state.data.inventory?.items||[]).filter(x=>x.zone===b.dataset.zone));document.querySelectorAll('[data-zone]').forEach(x=>x.classList.remove('active'));b.classList.add('active')});
 document.querySelectorAll('[data-task]').forEach(b=>b.onclick=()=>act(()=>post(`/api/tasks/${b.dataset.task}/claim`,{operatorId:actor()}),'وظیفه به شما تخصیص یافت'));
 document.querySelectorAll('[data-print]').forEach(b=>b.onclick=()=>act(async()=>{
  const sessionId=await ensureSession();let body=JSON.stringify({sessionId});
  if(b.dataset.printAction==='fail')body=JSON.stringify({reason:'خطای چاپگر',sessionId});
  if(b.dataset.printAction==='retry'){
   const job=(state.data['print-jobs']?.items||[]).find(j=>String(j.id)===b.dataset.print);
   const scanned=b.closest('article')?.querySelector('[data-reprint-scan]')?.value;
   return submitVerifiedReprint({jobId:b.dataset.print,scannedValue:scanned,expectedIdentity:job?.label,sessionId,send:request});
  }
  return request(`/api/print-jobs/${b.dataset.print}/${b.dataset.printAction}`,{method:'POST',body});
 }, 'وضعیت چاپ به‌روزرسانی شد'));
 document.querySelectorAll('[data-shipment]').forEach(b=>b.onclick=()=>act(()=>post(`/api/shipments/${b.dataset.shipment}/${b.dataset.shipmentAction}`),'وضعیت محموله تغییر کرد'));
 document.querySelectorAll('[data-package]').forEach(b=>b.onclick=()=>act(()=>post(`/api/packages/${b.dataset.package}/${b.dataset.packageAction}`),'وضعیت بسته تغییر کرد'));
 document.querySelectorAll('[data-session]').forEach(b=>b.onclick=()=>act(()=>post(`/api/sessions/${b.dataset.session}/${b.dataset.sessionAction}`),'نشست به‌روزرسانی شد'));
 document.querySelectorAll('[data-config]').forEach(b=>b.onclick=()=>act(()=>post(`/api/configurations/${b.dataset.config}/${b.dataset.transition}`,{userId:actor()==='admin-1'?'approver-2':actor()}),'نسخه تنظیمات به‌روزرسانی شد'));
 document.querySelectorAll('[data-override]').forEach(b=>b.onclick=()=>act(()=>post(`/api/overrides/${b.dataset.override}/resolve`,{decision:b.dataset.decision,resolvedBy:actor()==='admin-1'?'approver-2':actor(),note:'بررسی در کنسول وب'}),'درخواست تعیین تکلیف شد'));
 document.querySelector('[data-export]')?.addEventListener('click',exportInventory);
}
async function act(fn,message){try{await fn();toast(message);await loadData()}catch(e){toast(e.message,'bad')}}
async function handleForm(e){
 e.preventDefault();const f=e.currentTarget,a=f.dataset.action,v=Object.fromEntries(new FormData(f));try{
  let result;
  if(a==='receive'){const container=scannedContainer(v.containerCode,f.elements.containerCode);result=await post('/api/receiving',{supplier:v.supplier,product:v.product,grade:v.grade,size:v.size,harvestPeriod:v.harvestPeriod,weightKg:Number(v.weightKg),containerId:container.id,sessionId:await ensureSession()})}
  if(a==='move')result=await post('/api/movements',{...v,sessionId:await ensureSession()});
  if(a==='container')result=await post('/api/containers',{...v,capacityKg:Number(v.capacityKg)});
  if(a==='assign-container')result=await post(`/api/containers/${v.containerId}/assign`,{batchId:v.batchId,sessionId:await ensureSession()});
  if(a==='transform'){const container=scannedContainer(v.containerCode,f.elements.containerCode),scanKey=['FREEZE','FREEZE_DRY'].includes(v.process)?'trayId':'containerId';result=await post('/api/transforms',{process:v.process,inputs:[{batchId:v.batchId,consumeWeightKg:Number(v.consumeWeightKg)}],outputWeightKg:Number(v.outputWeightKg),product:v.product,grade:v.grade,[scanKey]:container.id,sessionId:await ensureSession()})}
  if(a==='sorting'){const container=scannedContainer(v.containerCode,f.elements.containerCode);result=await post('/api/sorting',{batchId:v.batchId,containerId:container.id,outputs:[{grade:'A',size:'Large',weightKg:Number(v.a)},{grade:'B',size:'Mixed',weightKg:Number(v.b)}],sessionId:await ensureSession()})}
  if(a==='quality')result=await post('/api/quality-checks',{...v,inspectorId:actor()});
  if(a==='release')result=await post('/api/quality-checks/release',{...v,inspectorId:actor()});
  if(a==='package')result=await post('/api/packages',{type:v.type,level:v.level,sessionId:await ensureSession(),...(v.childPackageId?{childPackageIds:[v.childPackageId]}:{items:[{batchId:v.batchId,weightKg:Number(v.weightKg)}]})});
  if(a==='shipment')result=await post('/api/shipments',{destinationSite:v.destinationSite,packageIds:[v.packageId]});
  if(a==='transfer')result=await post('/api/internal-transfers/receive',{manifest:JSON.parse(v.manifest),receivedBy:actor(),sessionId:await ensureSession()});
  if(a==='task')result=await post('/api/tasks',{...v,priority:Number(v.priority)});
  if(a==='trace'){const batch=(state.data.inventory?.items||[]).find(x=>x.code===v.code.trim());if(!batch)throw Error('کد بچ پیدا نشد');const trace=await request('/api/trace/'+batch.id);$('#traceResult').innerHTML=traceView(trace);return}
  if(a==='config')result=await post('/api/configurations',{scope:v.scope,values:JSON.parse(v.values),userId:actor()});
  if(a==='override')result=await post('/api/overrides',{...v,requestedBy:actor()});
  toast(result?.code?`${result.code} با موفقیت ثبت شد`:'عملیات با موفقیت ثبت شد');await loadData();
 }catch(err){toast(err.message,'bad')}
}
function traceView(t){return `<div class="trace-card"><div class="trace-root"><span>بچ فعلی</span><h3>${esc(t.batch.code)}</h3><p>${esc(t.batch.product)} · ${fa(t.batch.weightKg)} kg</p>${status(t.batch.status)}</div><div class="trace-lines">${t.ancestors.length?t.ancestors.map(a=>`<article><span>↑</span><div><b>${esc(a.code)}</b><small>${esc(a.process||'RECEIVING')} · ${fa(a.weightKg)} kg</small></div></article>`).join(''):empty('این بچ ورودی اولیه است')}</div><div class="two-col">${panel('اندازه‌گیری‌ها',table(['وزن','دلیل','زمان'],t.measurements.map(m=>`<tr><td>${fa(m.weightKg)} kg</td><td>${esc(m.reason)}</td><td>${dt(m.measuredAt)}</td></tr>`)))}${panel('جابه‌جایی‌ها',table(['از','به','زمان'],t.movements.map(m=>`<tr><td>${esc(m.from)}</td><td>${esc(m.to)}</td><td>${dt(m.movedAt)}</td></tr>`)))}</div></div>`}
async function loadCloud(){try{const [health,summary]=await Promise.all([fetch(CLOUD+'/health').then(r=>r.json()),fetch(CLOUD+'/api/summary').then(r=>r.json())]);$('#cloudContent').innerHTML=`<div class="cloud-hero"><span>☁</span><div><h2>StoreMesh Cloud Control</h2><p>دید یکپارچه بدون دخالت در عملیات محلی سایت‌ها</p></div>${status(health.status==='ok'?'ACTIVE':'FAILED')}</div><div class="site-grid">${['IRAN','DUBAI','ROME'].map(s=>{const x=summary.sites?.[s]||{};return `<article><div><span class="flag">${{IRAN:'IR',DUBAI:'AE',ROME:'IT'}[s]}</span>${status(x.lastSync?'CONNECTED':'PENDING')}</div><h3>${s}</h3><b>${fa(x.events||0)}</b><small>رویداد همگام‌شده</small><p>آخرین ارتباط: ${dt(x.lastSync)}</p></article>`}).join('')}</div>`}catch(e){$('#cloudContent').innerHTML=empty('Cloud در این اجرای محلی فعال نیست')}}
function exportInventory(){const rows=state.data.inventory?.items||[],csv=['code,product,grade,size,weightKg,zone,status',...rows.map(x=>[x.code,x.product,x.grade,x.size,x.weightKg,x.zone,x.status].join(','))].join('\n'),blob=new Blob([csv],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='storemesh-inventory.csv';a.click();URL.revokeObjectURL(a.href)}

$('#loginForm').addEventListener('submit',async e=>{e.preventDefault();try{const v=Object.fromEntries(new FormData(e.currentTarget)),r=await request('/api/auth/login',{method:'POST',body:JSON.stringify(v)});state.token=r.token;sessionStorage.token=r.token;$('#loginDialog').close();await loadData()}catch(err){$('#loginError').textContent=err.message}});
addEventListener('hashchange',()=>{state.route=location.hash.slice(1)||'dashboard';render();if(state.route==='cloud')loadCloud()});
if(state.token)loadData();else $('#loginDialog').showModal();
