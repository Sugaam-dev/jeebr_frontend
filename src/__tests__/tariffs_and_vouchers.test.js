import test from 'node:test';
import assert from 'node:assert/strict';
import { api, clearApiCache } from '../services/api.js';

function mockFetch(handler) {
  globalThis.fetch = async (url, options = {}) => {
    return handler(url, options);
  };
}

test('api.getTariffs fetches list of active tariff plans', async () => {
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
          id: 'b1a1c1d1-0000-0000-0000-000000000001',
          tariff_code: 'TRF-PLAN-PRE-HERO-1.5G-V1',
          name: 'Hero Unlimited 1.5GB/Day',
          service_plan_code: 'PLAN-PRE-HERO-1.5G',
          billing_type: 'PREPAID',
          billing_frequency: '28_DAYS',
          base_recurring_charge: '299.00',
          setup_fee: '0.00',
          tax_rate_percent: '18.00',
          status: 'ACTIVE'
        }
      ]
    };
  });

  const res = await api.getTariffs({ billing_type: 'PREPAID' });
  assert.ok(calledUrl.includes('/tariffs?billing_type=PREPAID'));
  assert.equal(res.length, 1);
  assert.equal(res[0].tariff_code, 'TRF-PLAN-PRE-HERO-1.5G-V1');
  assert.equal(res[0].base_recurring_charge, '299.00');
});

test('api.createTariff posts tariff payload with decimal charge breakdown', async () => {
  clearApiCache();
  let calledUrl = '';
  let calledBody = null;

  mockFetch((url, options) => {
    calledUrl = url;
    calledBody = JSON.parse(options.body);
    return {
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        id: 'b1a1c1d1-0000-0000-0000-000000000002',
        ...calledBody
      })
    };
  });

  const payload = {
    tariff_code: 'TRF-POST-ULTRA-200M-V1',
    name: 'Ultra 200M Postpaid',
    service_plan_code: 'PLAN-POST-INFINITY-75G',
    market_id: 'mumbai',
    version: 1,
    billing_type: 'POSTPAID',
    billing_frequency: 'MONTHLY',
    billing_timing: 'IN_ARREARS',
    base_recurring_charge: 899.0,
    setup_fee: 500.0,
    tax_rate_percent: 18.0,
    status: 'ACTIVE'
  };

  const res = await api.createTariff(payload);
  assert.ok(calledUrl.includes('/tariffs'));
  assert.equal(calledBody.tariff_code, 'TRF-POST-ULTRA-200M-V1');
  assert.equal(res.base_recurring_charge, 899.0);
});

test('api.calculateTariffCharges computes 18% GST and net payable breakdown', async () => {
  let calledUrl = '';
  let calledBody = null;

  mockFetch((url, options) => {
    calledUrl = url;
    calledBody = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        tariff_code: 'TRF-TEST-CALC',
        service_plan_code: 'PLAN-100M',
        currency: 'INR',
        base_recurring_charge: 1000.0,
        setup_fee: 500.0,
        usage_charge: 200.0,
        gross_subtotal: 1700.0,
        plan_discount_amount: 170.0,
        voucher_discount_amount: 0.0,
        taxable_amount: 1530.0,
        tax_rate_percent: 18.0,
        tax_amount: 275.4,
        total_amount_payable: 1805.4
      })
    };
  });

  const res = await api.calculateTariffCharges({
    tariff_code: 'TRF-TEST-CALC',
    usage_gb: 20.0,
    apply_setup_fee: true
  });

  assert.ok(calledUrl.includes('/tariffs/calculate'));
  assert.equal(res.gross_subtotal, 1700.0);
  assert.equal(res.taxable_amount, 1530.0);
  assert.equal(res.tax_amount, 275.4);
  assert.equal(res.total_amount_payable, 1805.4);
});

test('api.getVouchers retrieves campaign definitions with quota limits', async () => {
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
          id: 'v1a1c1d1-0000-0000-0000-000000000001',
          voucher_code: 'WELCOME100',
          campaign_name: 'New Subscriber Welcome',
          voucher_type: 'BILL_DISCOUNT',
          discount_amount: '100.00',
          max_redemptions: 1000,
          current_redemptions: 42,
          per_customer_limit: 1,
          status: 'ACTIVE'
        }
      ]
    };
  });

  const res = await api.getVouchers({ status: 'ACTIVE' });
  assert.ok(calledUrl.includes('/vouchers?status=ACTIVE'));
  assert.equal(res.length, 1);
  assert.equal(res[0].voucher_code, 'WELCOME100');
  assert.equal(res[0].current_redemptions, 42);
});

test('api.bulkCreateVouchers generates batch of unique coupons', async () => {
  clearApiCache();
  let calledUrl = '';
  let calledBody = null;

  mockFetch((url, options) => {
    calledUrl = url;
    calledBody = JSON.parse(options.body);
    return {
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => [
        { id: '1', voucher_code: 'PROMO-A1', max_redemptions: 1 },
        { id: '2', voucher_code: 'PROMO-B2', max_redemptions: 1 },
        { id: '3', voucher_code: 'PROMO-C3', max_redemptions: 1 }
      ]
    };
  });

  const res = await api.bulkCreateVouchers({
    prefix: 'PROMO',
    count: 3,
    campaign_name: 'Flash Sale Batch',
    voucher_type: 'BILL_DISCOUNT',
    discount_amount: 50.0,
    valid_until: '2026-12-31T23:59:59Z'
  });

  assert.ok(calledUrl.includes('/vouchers/bulk'));
  assert.equal(calledBody.prefix, 'PROMO');
  assert.equal(res.length, 3);
});

test('api.validateVoucher pre-validates eligibility and discount cap', async () => {
  let calledUrl = '';

  mockFetch((url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        is_valid: true,
        voucher_code: 'RETENTION20',
        voucher_type: 'PERCENT_DISCOUNT',
        calculated_discount: 200.0,
        reason: null
      })
    };
  });

  const res = await api.validateVoucher({
    voucher_code: 'RETENTION20',
    customer_id: 101,
    invoice_amount: 1000.0
  });

  assert.ok(calledUrl.includes('/vouchers/validate'));
  assert.equal(res.is_valid, true);
  assert.equal(res.calculated_discount, 200.0);
});
