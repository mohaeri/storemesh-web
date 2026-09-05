const escapeHtml = value => String(value ?? '—').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

const number = value => new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(Number(value) || 0);
const dateTime = value => value
  ? new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
  : '—';
const table = (headers, rows) => `<div class="table-wrap"><table><thead><tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;

export async function openConsumableLedgerDialog({ document, item, apiBase, token = '', fetchImpl = fetch }) {
  const load = async suffix => {
    const response = await fetchImpl(`${apiBase}/api/consumables/${item.id}/${suffix}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    const payload = await response.json();
    if (!response.ok) throw Error(payload.message || payload.errorCode || 'خطای ارتباط');
    return payload.data ?? payload;
  };
  const [receipts, transactions] = await Promise.all([load('receipts'), load('transactions')]);
  const dialog = document.createElement('dialog');
  dialog.innerHTML = `<h3>${escapeHtml(item.name)} — دفتر گردش</h3>${table(['نوع', 'مقدار', 'مانده', 'زمان'], transactions.items.map(entry => `<tr><td>${escapeHtml(entry.type)}</td><td>${number(entry.quantity)}</td><td>${number(entry.balance)}</td><td>${dateTime(entry.occurredAt || entry.receivedAt)}</td></tr>`))}<h3>رسیدها</h3>${table(['منبع', 'مقدار', 'زمان'], receipts.items.map(entry => `<tr><td>${escapeHtml(entry.source)}</td><td>${number(entry.quantity)}</td><td>${dateTime(entry.receivedAt)}</td></tr>`))}<button data-close>بستن</button>`;
  document.body.append(dialog);
  dialog.querySelector('[data-close]').onclick = () => {
    dialog.close();
    dialog.remove();
  };
  dialog.showModal();
  return dialog;
}
