import test from 'node:test';
import assert from 'node:assert/strict';
import { api, clearApiCache } from '../services/api.js';

function mockFetch(handler) {
  globalThis.fetch = async (url, options = {}) => {
    return handler(url, options);
  };
}

test('api.getProvisioningPlans serializes account_type and billing_type query params', async () => {
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
          plan_id: 'PLAN-PRE-HERO-1.5G',
          name: 'Hero Unlimited 1.5GB/Day (28d)',
          account_type: 'RESIDENTIAL',
          billing_type: 'PREPAID',
          price_inr: 299.0,
          speed_mbps: 50,
          data_quota_gb: 42.0,
          validity_days: 28,
          service_vlan: 101
        }
      ]
    };
  });

  const res = await api.getProvisioningPlans('RESIDENTIAL', 'PREPAID');
  assert.ok(calledUrl.includes('/provisioning/plans'));
  assert.ok(calledUrl.includes('account_type=RESIDENTIAL'));
  assert.ok(calledUrl.includes('billing_type=PREPAID'));
  assert.equal(res.length, 1);
  assert.equal(res[0].plan_id, 'PLAN-PRE-HERO-1.5G');
  assert.equal(res[0].speed_mbps, 50);
});

test('api.getCustomerEligibility queries /customer/{id}/eligibility with target plan_id', async () => {
  clearApiCache();
  let calledUrl = '';

  mockFetch((url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        customer_id: 1,
        market_id: 'mumbai',
        eligible: true,
        customer_lifecycle_status: 'ACTIVE',
        serviceability_status: 'SERVICEABLE',
        suggested_device_id: 20,
        suggested_device_code: 'ONU-MUM-0001',
        olt_device_code: 'OLT-BND-01',
        suggested_port_id: 1,
        blocking_reasons: []
      })
    };
  });

  const res = await api.getCustomerEligibility(1, 'PLAN-PRE-HERO-1.5G');
  assert.ok(calledUrl.includes('/provisioning/customer/1/eligibility'));
  assert.ok(calledUrl.includes('plan_id=PLAN-PRE-HERO-1.5G'));
  assert.equal(res.eligible, true);
  assert.equal(res.suggested_device_code, 'ONU-MUM-0001');
  assert.equal(res.olt_device_code, 'OLT-BND-01');
});

test('api.getProvisioningOrders parses pagination headers and payload', async () => {
  clearApiCache();
  let calledUrl = '';

  mockFetch((url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({
        'content-type': 'application/json',
        'X-Total-Count': '42',
        'X-Page': '2',
        'X-Page-Size': '20',
        'X-Total-Pages': '3'
      }),
      json: async () => [
        {
          order_code: 'ACT-MUM-2026-0001',
          customer_name: 'Aarav Sharma',
          status: 'ACTIVE',
          execution_mode: 'SIMULATED'
        }
      ]
    };
  });

  const res = await api.getProvisioningOrders('ACTIVE', null, 2, 20);
  assert.ok(calledUrl.includes('/provisioning/orders'));
  assert.ok(calledUrl.includes('page=2'));
  assert.ok(calledUrl.includes('page_size=20'));
  assert.ok(calledUrl.includes('status=ACTIVE'));
  assert.equal(res.totalCount, 42);
  assert.equal(res.page, 2);
  assert.equal(res.totalPages, 3);
  assert.equal(res.orders.length, 1);
  assert.equal(res.orders[0].order_code, 'ACT-MUM-2026-0001');
});

test('api.createProvisioningOrder serializes order creation with idempotency key', async () => {
  clearApiCache();
  let calledUrl = '';
  let calledMethod = '';
  let calledBody = null;

  mockFetch((url, options) => {
    calledUrl = url;
    calledMethod = options.method;
    calledBody = JSON.parse(options.body);
    return {
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        order_code: 'ACT-MUM-2026-9876',
        idempotency_key: 'IDEM-TEST-1234',
        status: 'REQUESTED',
        execution_mode: 'SIMULATED',
        telemetry_source: 'Synthetic / Demo Telemetry'
      })
    };
  });

  const res = await api.createProvisioningOrder({
    customer_id: 1,
    plan_id: 'PLAN-PRE-HERO-1.5G',
    idempotency_key: 'IDEM-TEST-1234'
  });

  assert.ok(calledUrl.endsWith('/provisioning/orders'));
  assert.equal(calledMethod, 'POST');
  assert.equal(calledBody.customer_id, 1);
  assert.equal(calledBody.plan_id, 'PLAN-PRE-HERO-1.5G');
  assert.equal(calledBody.idempotency_key, 'IDEM-TEST-1234');
  assert.equal(res.order_code, 'ACT-MUM-2026-9876');
  assert.equal(res.status, 'REQUESTED');
});

test('api.getProvisioningOrderDetail fetches order by code', async () => {
  clearApiCache();
  let calledUrl = '';

  mockFetch((url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        order_code: 'ACT-MUM-2026-1122',
        status: 'PROVISIONING',
        logs: [
          {
            id: 1,
            action: 'ORDER_CREATED',
            from_status: null,
            to_status: 'REQUESTED',
            actor_email: 'care@pmrg.in'
          }
        ]
      })
    };
  });

  const res = await api.getProvisioningOrderDetail('ACT-MUM-2026-1122');
  assert.ok(calledUrl.endsWith('/provisioning/orders/ACT-MUM-2026-1122'));
  assert.equal(res.status, 'PROVISIONING');
  assert.equal(res.logs.length, 1);
});

test('api.approveProvisioningOrder sends POST with notes', async () => {
  clearApiCache();
  let calledUrl = '';
  let calledMethod = '';
  let calledBody = null;

  mockFetch((url, options) => {
    calledUrl = url;
    calledMethod = options.method;
    calledBody = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        order_code: 'ACT-MUM-2026-1122',
        status: 'APPROVED'
      })
    };
  });

  const res = await api.approveProvisioningOrder('ACT-MUM-2026-1122', 'Authorized by NOC Lead');
  assert.ok(calledUrl.endsWith('/provisioning/orders/ACT-MUM-2026-1122/approve'));
  assert.equal(calledMethod, 'POST');
  assert.equal(calledBody.notes, 'Authorized by NOC Lead');
  assert.equal(res.status, 'APPROVED');
});

test('api.triggerProvisioning sends POST to /provision', async () => {
  clearApiCache();
  let calledUrl = '';
  let calledMethod = '';

  mockFetch((url, options) => {
    calledUrl = url;
    calledMethod = options.method;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        order_code: 'ACT-MUM-2026-1122',
        status: 'ACTIVE',
        execution_mode: 'SIMULATED'
      })
    };
  });

  const res = await api.triggerProvisioning('ACT-MUM-2026-1122');
  assert.ok(calledUrl.endsWith('/provisioning/orders/ACT-MUM-2026-1122/provision'));
  assert.equal(calledMethod, 'POST');
  assert.equal(res.status, 'ACTIVE');
});

test('api.retryProvisioning sends POST to /retry', async () => {
  clearApiCache();
  let calledUrl = '';
  let calledMethod = '';

  mockFetch((url, options) => {
    calledUrl = url;
    calledMethod = options.method;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        order_code: 'ACT-MUM-2026-1122',
        status: 'ACTIVE',
        retry_count: 1
      })
    };
  });

  const res = await api.retryProvisioning('ACT-MUM-2026-1122');
  assert.ok(calledUrl.endsWith('/provisioning/orders/ACT-MUM-2026-1122/retry'));
  assert.equal(calledMethod, 'POST');
  assert.equal(res.status, 'ACTIVE');
  assert.equal(res.retry_count, 1);
});

test('api.cancelProvisioningOrder requires mandatory reason and posts to /cancel', async () => {
  clearApiCache();
  let calledUrl = '';
  let calledMethod = '';
  let calledBody = null;

  mockFetch((url, options) => {
    calledUrl = url;
    calledMethod = options.method;
    calledBody = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        order_code: 'ACT-MUM-2026-1122',
        status: 'CANCELLED',
        cancellation_reason: 'Subscriber shifted residence'
      })
    };
  });

  const res = await api.cancelProvisioningOrder('ACT-MUM-2026-1122', 'Subscriber shifted residence');
  assert.ok(calledUrl.endsWith('/provisioning/orders/ACT-MUM-2026-1122/cancel'));
  assert.equal(calledMethod, 'POST');
  assert.equal(calledBody.reason, 'Subscriber shifted residence');
  assert.equal(res.status, 'CANCELLED');
});

test('api.reconcileProvisioningOrder sends POST to /reconcile', async () => {
  clearApiCache();
  let calledUrl = '';
  let calledMethod = '';

  mockFetch((url, options) => {
    calledUrl = url;
    calledMethod = options.method;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        order_code: 'ACT-MUM-2026-1122',
        status: 'ACTIVE',
        execution_mode: 'SIMULATED'
      })
    };
  });

  const res = await api.reconcileProvisioningOrder('ACT-MUM-2026-1122');
  assert.ok(calledUrl.endsWith('/provisioning/orders/ACT-MUM-2026-1122/reconcile'));
  assert.equal(calledMethod, 'POST');
  assert.equal(res.status, 'ACTIVE');
});
