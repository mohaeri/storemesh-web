import test from 'node:test';
import assert from 'node:assert/strict';
import { openConsumableLedgerDialog } from '../consumable-ledger-dialog.js';

test('consumables drill-down fetches and renders receipt and transaction rows', async () => {
  const calls = [];
  const fetchImpl = async url => {
    calls.push(url);
    const items = url.endsWith('/receipts')
      ? [{ source: 'Vendor Alpha', quantity: 12, receivedAt: '2026-08-30T10:00:00.000Z' }]
      : [{ type: 'CONSUMPTION', quantity: -2, balance: 10, occurredAt: '2026-08-30T11:00:00.000Z' }];
    return { ok: true, json: async () => ({ items }) };
  };
  const dialog = {
    innerHTML: '', shown: false, removed: false,
    querySelector: () => ({ onclick: null }),
    showModal() { this.shown = true; },
    close() {},
    remove() { this.removed = true; }
  };
  const document = {
    createElement: tag => {
      assert.equal(tag, 'dialog');
      return dialog;
    },
    body: { append: element => assert.equal(element, dialog) }
  };

  await openConsumableLedgerDialog({
    document,
    item: { id: 'consumable-1', name: 'Gel Pack' },
    apiBase: 'http://site.test',
    token: 'reader-token',
    fetchImpl
  });

  assert.deepEqual(calls, [
    'http://site.test/api/consumables/consumable-1/receipts',
    'http://site.test/api/consumables/consumable-1/transactions'
  ]);
  assert.equal(dialog.shown, true);
  assert.match(dialog.innerHTML, /Vendor Alpha/);
  assert.match(dialog.innerHTML, /CONSUMPTION/);
  assert.match(dialog.innerHTML, /Gel Pack/);
});
