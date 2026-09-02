const escapeHtml=value=>String(value??'—').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const number=value=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:3}).format(Number(value)||0);
const dateTime=value=>value?new Intl.DateTimeFormat('fa-IR',{dateStyle:'short',timeStyle:'short'}).format(new Date(value)):'—';

export async function openInventoryLedgerDialog({document,item,apiBase,token='',fetchImpl=fetch}){
  const response=await fetchImpl(`${apiBase}/api/inventory/BATCH/${item.id}/ledger`,{headers:token?{Authorization:`Bearer ${token}`}:{}}),payload=await response.json();
  if(!response.ok)throw Error(payload.message||payload.errorCode||'خطای ارتباط');
  const rows=(payload.data??payload).items??[],dialog=document.createElement('dialog');
  dialog.innerHTML=`<h3>${escapeHtml(item.code)} — تاریخچه موجودی</h3><div class="table-wrap"><table><thead><tr><th>زمان</th><th>دلیل</th><th>قبل</th><th>تغییر</th><th>بعد</th></tr></thead><tbody>${rows.map(entry=>`<tr><td>${dateTime(entry.occurredAt)}</td><td>${escapeHtml(entry.reason)}</td><td>${number(entry.beforeQty)}</td><td>${number(entry.delta)}</td><td>${number(entry.afterQty)}</td></tr>`).join('')}</tbody></table></div><button data-close>بستن</button>`;
  document.body.append(dialog);dialog.querySelector('[data-close]').onclick=()=>{dialog.close();dialog.remove()};dialog.showModal();return dialog;
}
