import test from 'node:test';
import assert from 'node:assert/strict';
import { api, clearApiCache } from '../services/api.js';

function mockFetch(handler) {
  globalThis.fetch = async (url, options = {}) => {
    return handler(url, options);
  };
}

test('api.getFinanceOverview fetches overview and serializes market query parameter', async () => {
  clearApiCache();
  let calledUrl = '';

  mockFetch((url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        market_id: 'mumbai',
        kpis: {
          total_invoiced: 25000.0,
          total_collected: 18000.0,
          outstanding_receivables: 7000.0,
          overdue_count: 2
        },
        ledger_is_balanced: true
      })
    };
  });

  const res = await api.getFinanceOverview('mumbai');
  assert.ok(calledUrl.includes('/finance/overview'));
  assert.ok(calledUrl.includes('market=mumbai'));
  assert.equal(res.market_id, 'mumbai');
  assert.equal(res.kpis.total_invoiced, 25000.0);
  assert.equal(res.ledger_is_balanced, true);
});

test('api.getGatewayStatus returns provider mode and simulated warning banner info', async () => {
  clearApiCache();
  let calledUrl = '';

  mockFetch((url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        provider_name: 'SimulatedPaymentProvider',
        provider_mode: 'SIMULATED',
        is_simulated: true,
        credentials_configured: false,
        note: 'Simulated payment provider active for local development and test automation.'
      })
    };
  });

  const res = await api.getGatewayStatus();
  assert.ok(calledUrl.includes('/finance/gateway-status'));
  assert.equal(res.provider_mode, 'SIMULATED');
  assert.equal(res.is_simulated, true);
});

test('api.getBillingAccounts serializes market and status filters', async () => {
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
          id: 'acc-1',
          account_code: 'BA-MUM-2026-00001',
          customer_id: 'CUST-001',
          market_id: 'mumbai',
          account_type: 'POSTPAID',
          status: 'ACTIVE',
          balance: 0.0,
          credit_limit: 10000.0
        }
      ]
    };
  });

  const res = await api.getBillingAccounts('mumbai', 'ACTIVE');
  assert.ok(calledUrl.includes('/finance/accounts'));
  assert.ok(calledUrl.includes('market=mumbai'));
  assert.ok(calledUrl.includes('status=ACTIVE'));
  assert.equal(res.length, 1);
  assert.equal(res[0].account_code, 'BA-MUM-2026-00001');
});

test('api.createBillingAccount posts valid payload to /finance/accounts', async () => {
  clearApiCache();
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
        id: 'acc-new-1',
        account_code: 'BA-MUM-2026-00002',
        customer_id: calledBody.customer_id,
        account_type: calledBody.account_type,
        status: 'ACTIVE',
        balance: 0.0
      })
    };
  });

  const payload = {
    customer_id: 'CUST-MUM-0002',
    account_type: 'PREPAID',
    credit_limit: 5000.0,
    currency: 'INR'
  };
  const res = await api.createBillingAccount(payload);
  assert.ok(calledUrl.includes('/finance/accounts'));
  assert.equal(calledBody.customer_id, 'CUST-MUM-0002');
  assert.equal(calledBody.account_type, 'PREPAID');
  assert.equal(res.account_code, 'BA-MUM-2026-00002');
});

test('api.getBillingSubscriptions queries subscriptions by account_id and customer_id', async () => {
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
          id: 'sub-1',
          subscription_code: 'SUB-MUM-2026-00001',
          customer_id: 'CUST-001',
          plan_id: 'PLAN-POST-INFINITY-75G',
          status: 'ACTIVE'
        }
      ]
    };
  });

  const res = await api.getBillingSubscriptions('acc-1', 'CUST-001', 'ACTIVE');
  assert.ok(calledUrl.includes('/finance/subscriptions'));
  assert.ok(calledUrl.includes('account_id=acc-1'));
  assert.ok(calledUrl.includes('customer_id=CUST-001'));
  assert.ok(calledUrl.includes('status=ACTIVE'));
  assert.equal(res[0].plan_id, 'PLAN-POST-INFINITY-75G');
});

test('api.transitionSubscription posts lifecycle action and reason', async () => {
  clearApiCache();
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
        id: 'sub-1',
        status: 'SUSPENDED',
        subscription_code: 'SUB-MUM-2026-00001'
      })
    };
  });

  const res = await api.transitionSubscription('sub-1', 'SUSPEND', 'Temporary non-payment');
  assert.ok(calledUrl.includes('/finance/subscriptions/sub-1/transition'));
  assert.equal(calledBody.action, 'SUSPEND');
  assert.equal(calledBody.reason, 'Temporary non-payment');
  assert.equal(res.status, 'SUSPENDED');
});

test('api.getFinanceInvoices queries invoices with market and status filters', async () => {
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
          id: 'inv-1',
          invoice_code: 'INV-MUM-2026-00001',
          customer_id: 'CUST-001',
          total_amount: 588.82,
          paid_amount: 588.82,
          outstanding_amount: 0.0,
          status: 'Paid'
        }
      ]
    };
  });

  const res = await api.getFinanceInvoices('mumbai', 'Paid');
  assert.ok(calledUrl.includes('/finance/invoices'));
  assert.ok(calledUrl.includes('market=mumbai'));
  assert.ok(calledUrl.includes('status=Paid'));
  assert.equal(res.length, 1);
  assert.equal(res[0].total_amount, 588.82);
});

test('api.issueInvoice creates a cycle invoice with GST computation', async () => {
  clearApiCache();
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
        id: 'inv-new',
        invoice_code: 'INV-MUM-2026-00002',
        subtotal: 499.0,
        tax_amount: 89.82,
        total_amount: 588.82,
        status: 'Issued'
      })
    };
  });

  const res = await api.issueInvoice({
    subscription_id: 'sub-1',
    discount_amount: 0.0,
    notes: 'Regular cycle'
  });
  assert.ok(calledUrl.includes('/finance/invoices/issue'));
  assert.equal(calledBody.subscription_id, 'sub-1');
  assert.equal(res.total_amount, 588.82);
  assert.equal(res.status, 'Issued');
});

test('api.recordPayment records payment and handles auto allocation', async () => {
  clearApiCache();
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
        id: 'pay-1',
        payment_code: 'PAY-MUM-2026-00001',
        amount: calledBody.amount,
        allocated_amount: calledBody.amount,
        unallocated_amount: 0.0,
        status: 'ALLOCATED',
        is_simulated: true
      })
    };
  });

  const payload = {
    customer_id: 'CUST-001',
    amount: 588.82,
    payment_method: 'UPI',
    invoice_id: 'inv-1',
    idempotency_key: 'idemp-pay-1'
  };
  const res = await api.recordPayment(payload);
  assert.ok(calledUrl.includes('/finance/payments'));
  assert.equal(calledBody.amount, 588.82);
  assert.equal(res.status, 'ALLOCATED');
  assert.equal(res.is_simulated, true);
});

test('api.verifyLedger verifies double-entry debit-credit equality', async () => {
  clearApiCache();
  let calledUrl = '';

  mockFetch((url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        is_balanced: true,
        total_debits: 15420.5,
        total_credits: 15420.5,
        discrepancy: 0.0,
        entries_evaluated: 12
      })
    };
  });

  const res = await api.verifyLedger('mumbai');
  assert.ok(calledUrl.includes('/finance/ledger/verify'));
  assert.equal(res.is_balanced, true);
  assert.equal(res.total_debits, res.total_credits);
  assert.equal(res.discrepancy, 0.0);
});

test('api.redeemVoucher routes fulfillment and returns benefit details', async () => {
  clearApiCache();
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
        success: true,
        voucher_code: calledBody.voucher_code,
        benefit_type: 'BILL_DISCOUNT',
        status: 'REDEEMED',
        credit_note_id: 'cn-1',
        message: 'Bill discount credit note issued successfully'
      })
    };
  });

  const res = await api.redeemVoucher({
    customer_id: 'CUST-001',
    voucher_code: 'DISCOUNT-500',
    idempotency_key: 'idemp-vouch-1'
  });
  assert.ok(calledUrl.includes('/finance/vouchers/redeem'));
  assert.equal(res.success, true);
  assert.equal(res.benefit_type, 'BILL_DISCOUNT');
  assert.equal(res.status, 'REDEEMED');
});

test('api.runBillingJob and api.runDunningJob execute background workflows', async () => {
  clearApiCache();

  mockFetch((url) => {
    if (url.includes('/billing-run')) {
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          status: 'COMPLETED',
          subscriptions_evaluated: 15,
          invoices_created: 15
        })
      };
    }
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        status: 'COMPLETED',
        invoices_evaluated: 20,
        invoices_flagged_overdue: 3
      })
    };
  });

  const billJob = await api.runBillingJob({ market_id: 'mumbai' });
  assert.equal(billJob.status, 'COMPLETED');
  assert.equal(billJob.invoices_created, 15);

  const dunnJob = await api.runDunningJob({ market_id: 'mumbai' });
  assert.equal(dunnJob.status, 'COMPLETED');
  assert.equal(dunnJob.invoices_flagged_overdue, 3);
});
