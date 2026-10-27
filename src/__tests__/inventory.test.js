import test from 'node:test';
import assert from 'node:assert/strict';
import { api, clearApiCache } from '../services/api.js';

function mockFetch(handler) {
  globalThis.fetch = async (url, options = {}) => {
    return handler(url, options);
  };
}

test('api.getInventoryStats fetches aggregated hardware stats', async () => {
  clearApiCache();
  let calledUrl = '';

  mockFetch((url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        total_devices: 120,
        devices_in_stock: 80,
        devices_installed: 30,
        devices_reserved: 5,
        devices_damaged: 5,
        total_warehouses: 4,
        low_stock_items_count: 1
      })
    };
  });

  const stats = await api.getInventoryStats();
  assert.ok(calledUrl.includes('/inventory/stats'));
  assert.equal(stats.total_devices, 120);
  assert.equal(stats.devices_in_stock, 80);
  assert.equal(stats.low_stock_items_count, 1);
});

test('api.getInventoryCatalogs serializes equipment_type filter', async () => {
  clearApiCache();
  let calledUrl = '';

  mockFetch((url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => [
        {
          id: 1,
          sku: 'ONT-HUA-HG8145V5',
          name: 'Huawei EchoLife HG8145V5',
          equipment_type: 'ONT',
          model: 'HG8145V5',
          manufacturer: 'Huawei',
          is_serialized: true,
          unit_cost_inr: 2450.0,
          status: 'ACTIVE'
        }
      ]
    };
  });

  const res = await api.getInventoryCatalogs({ equipment_type: 'ONT' });
  assert.ok(calledUrl.includes('/inventory/catalogs'));
  assert.ok(calledUrl.includes('equipment_type=ONT'));
  assert.equal(res.length, 1);
  assert.equal(res[0].sku, 'ONT-HUA-HG8145V5');
});

test('api.receiveInventoryStock sends POST to /inventory/stocks/receipt', async () => {
  clearApiCache();
  let calledUrl = '';
  let payload = null;

  mockFetch((url, opts) => {
    calledUrl = url;
    payload = JSON.parse(opts.body);
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        id: 1,
        warehouse_id: payload.warehouse_id,
        catalog_id: payload.catalog_id,
        quantity_on_hand: 50,
        quantity_reserved: 0,
        quantity_available: 50
      })
    };
  });

  const stock = await api.receiveInventoryStock({
    warehouse_id: 1,
    catalog_id: 1,
    quantity: 2,
    serial_numbers: ['HWTC-001', 'HWTC-002']
  });

  assert.ok(calledUrl.includes('/inventory/stocks/receipt'));
  assert.equal(payload.quantity, 2);
  assert.equal(payload.serial_numbers.length, 2);
  assert.equal(stock.quantity_on_hand, 50);
});

test('api.transferInventoryStock sends POST to /inventory/stocks/transfer', async () => {
  clearApiCache();
  let calledUrl = '';
  let payload = null;

  mockFetch((url, opts) => {
    calledUrl = url;
    payload = JSON.parse(opts.body);
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        success: true,
        movement_code: 'MOV-TRF-001',
        from_warehouse_id: payload.from_warehouse_id,
        to_warehouse_id: payload.to_warehouse_id,
        transferred_quantity: payload.quantity
      })
    };
  });

  const result = await api.transferInventoryStock({
    from_warehouse_id: 1,
    to_warehouse_id: 2,
    catalog_id: 1,
    quantity: 1,
    serial_numbers: ['HWTC-001']
  });

  assert.ok(calledUrl.includes('/inventory/stocks/transfer'));
  assert.equal(result.success, true);
  assert.equal(payload.from_warehouse_id, 1);
  assert.equal(payload.to_warehouse_id, 2);
});

test('api.returnInventoryDevice and replaceInventoryDevice handle RMA workflows', async () => {
  clearApiCache();
  let calledReturnUrl = '';
  let calledReplaceUrl = '';

  mockFetch((url, opts) => {
    if (url.includes('/operations/return')) {
      calledReturnUrl = url;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, serial_number: 'HWTC-001', new_status: 'IN_STOCK' })
      };
    }
    if (url.includes('/operations/replace')) {
      calledReplaceUrl = url;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, old_device: 'HWTC-OLD', new_device: 'HWTC-NEW' })
      };
    }
    return { ok: false, status: 404 };
  });

  const returnRes = await api.returnInventoryDevice({
    serial_number: 'HWTC-001',
    warehouse_id: 1,
    condition: 'WORKING'
  });
  assert.ok(calledReturnUrl.includes('/inventory/operations/return'));
  assert.equal(returnRes.new_status, 'IN_STOCK');

  const replaceRes = await api.replaceInventoryDevice({
    old_serial_number: 'HWTC-OLD',
    new_serial_number: 'HWTC-NEW',
    ticket_id: 42
  });
  assert.ok(calledReplaceUrl.includes('/inventory/operations/replace'));
  assert.equal(replaceRes.success, true);
});
