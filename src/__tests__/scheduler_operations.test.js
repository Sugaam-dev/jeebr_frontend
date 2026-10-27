import test from 'node:test';
import assert from 'node:assert/strict';
import { api, clearApiCache } from '../services/api.js';

function mockFetch(handler) {
  globalThis.fetch = async (url, options = {}) => {
    return handler(url, options);
  };
}

test('api.getSchedulerOverview serializes market query parameter and returns telemetry', async () => {
  clearApiCache();
  let calledUrl = '';

  mockFetch((url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        total_runs: 48,
        successful_runs: 46,
        failed_runs: 2,
        running_jobs: 0,
        active_locks: 0,
        outbox_queued: 12,
        outbox_failed: 1,
        outbox_sent: 115,
        jobs: [
          { job_type: 'RECURRING_BILLING', name: 'Recurring Billing Cycle', is_locked: false },
          { job_type: 'OVERDUE_DUNNING', name: 'Overdue Dunning & Aging Evaluation', is_locked: false },
          { job_type: 'OUTBOX_DISPATCH', name: 'Notification Outbox Dispatcher', is_locked: false }
        ]
      })
    };
  });

  const res = await api.getSchedulerOverview({ market_id: 'mumbai' });
  assert.ok(calledUrl.includes('/finance/scheduler/overview?market_id=mumbai'));
  assert.equal(res.total_runs, 48);
  assert.equal(res.successful_runs, 46);
  assert.equal(res.jobs.length, 3);
  assert.equal(res.active_locks, 0);
});

test('api.getScheduledJobs retrieves list of allowlisted background schedulers', async () => {
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
          job_type: 'RECURRING_BILLING',
          name: 'Recurring Billing Cycle',
          description: 'Evaluates active subscriptions across market tenants',
          cadence: 'Daily at 00:00 UTC',
          is_locked: false,
          allowed_roles: ['Admin', 'SUPER_ADMIN', 'Revenue']
        },
        {
          job_type: 'OVERDUE_DUNNING',
          name: 'Overdue Dunning & Aging Evaluation',
          description: 'Evaluates unpaid past-due invoices and computes aging',
          cadence: 'Daily at 06:00 UTC',
          is_locked: false,
          allowed_roles: ['Admin', 'SUPER_ADMIN', 'Revenue']
        }
      ]
    };
  });

  const res = await api.getScheduledJobs({ market_id: 'kolkata' });
  assert.ok(calledUrl.includes('/finance/scheduler/jobs?market_id=kolkata'));
  assert.equal(res.length, 2);
  assert.equal(res[0].job_type, 'RECURRING_BILLING');
  assert.equal(res[1].job_type, 'OVERDUE_DUNNING');
});

test('api.getBillingJobRuns serializes pagination, status, and job_type filters', async () => {
  clearApiCache();
  let calledUrl = '';

  mockFetch((url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        items: [
          {
            id: 'job-run-uuid-001',
            job_type: 'RECURRING_BILLING',
            market_id: 'mumbai',
            status: 'COMPLETED',
            duration_seconds: 4.25,
            records_processed: 120,
            records_succeeded: 120
          }
        ],
        total: 1,
        page: 1,
        page_size: 10,
        pages: 1
      })
    };
  });

  const res = await api.getBillingJobRuns({
    job_type: 'RECURRING_BILLING',
    status: 'COMPLETED',
    market_id: 'mumbai',
    page: 1,
    page_size: 10
  });

  assert.ok(calledUrl.includes('/finance/scheduler/runs?'));
  assert.ok(calledUrl.includes('job_type=RECURRING_BILLING'));
  assert.ok(calledUrl.includes('status=COMPLETED'));
  assert.ok(calledUrl.includes('market_id=mumbai'));
  assert.ok(calledUrl.includes('page=1'));
  assert.equal(res.total, 1);
  assert.equal(res.items[0].status, 'COMPLETED');
});

test('api.getBillingJobRunDetail retrieves specific execution metrics', async () => {
  clearApiCache();
  let calledUrl = '';

  mockFetch((url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        id: 'job-run-uuid-002',
        job_type: 'OVERDUE_DUNNING',
        status: 'FAILED',
        duration_seconds: 1.15,
        error_details: 'Simulated downstream timeout'
      })
    };
  });

  const res = await api.getBillingJobRunDetail('job-run-uuid-002');
  assert.ok(calledUrl.includes('/finance/scheduler/runs/job-run-uuid-002'));
  assert.equal(res.id, 'job-run-uuid-002');
  assert.equal(res.status, 'FAILED');
  assert.equal(res.error_details, 'Simulated downstream timeout');
});

test('api.runSchedulerJob posts manual execution request under distributed lock', async () => {
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
        job_id: 'job-run-uuid-003',
        status: 'COMPLETED',
        job_type: 'RECURRING_BILLING',
        processed: 85
      })
    };
  });

  const res = await api.runSchedulerJob('RECURRING_BILLING', { market_id: 'mumbai' });
  assert.ok(calledUrl.includes('/finance/scheduler/jobs/RECURRING_BILLING/run'));
  assert.equal(calledBody.market_id, 'mumbai');
  assert.equal(res.status, 'COMPLETED');
  assert.equal(res.processed, 85);
});

test('api.reconcileJobRun posts reconciliation action and clears locks', async () => {
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
        id: 'job-run-uuid-004',
        status: 'RECONCILED',
        summary_metadata: {
          reconciliation_reason: calledBody.reason
        }
      })
    };
  });

  const res = await api.reconcileJobRun('job-run-uuid-004', {
    action: 'RECONCILE',
    reason: 'Cleared stuck worker lock after network restart'
  });

  assert.ok(calledUrl.includes('/finance/scheduler/runs/job-run-uuid-004/reconcile'));
  assert.equal(calledBody.action, 'RECONCILE');
  assert.equal(res.status, 'RECONCILED');
  assert.equal(res.summary_metadata.reconciliation_reason, 'Cleared stuck worker lock after network restart');
});

test('api.getNotificationOutbox serializes channels and status filters with PII masking verification', async () => {
  clearApiCache();
  let calledUrl = '';

  mockFetch((url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        items: [
          {
            id: 'notif-uuid-001',
            recipient_masked: '98******10',
            channel: 'SMS',
            event_type: 'PAYMENT_CONFIRMATION',
            message_preview: 'Thank you! Your payment of Rs 590 has been received.',
            status: 'SENT',
            is_simulated: true,
            attempt_count: 1,
            max_attempts: 3
          }
        ],
        total: 1,
        page: 1,
        page_size: 10,
        summary_by_status: { SENT: 1 }
      })
    };
  });

  const res = await api.getNotificationOutbox({ channel: 'SMS', status: 'SENT', page: 1 });
  assert.ok(calledUrl.includes('/finance/notifications/outbox?'));
  assert.ok(calledUrl.includes('channel=SMS'));
  assert.ok(calledUrl.includes('status=SENT'));
  assert.equal(res.total, 1);
  assert.equal(res.items[0].recipient_masked, '98******10');
  assert.equal(res.items[0].is_simulated, true);
});

test('api.processNotificationOutbox triggers safe idempotent outbox dispatch', async () => {
  clearApiCache();
  let calledUrl = '';

  mockFetch((url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        job_id: 'job-run-uuid-005',
        status: 'COMPLETED',
        job_type: 'OUTBOX_DISPATCH',
        processed: 14
      })
    };
  });

  const res = await api.processNotificationOutbox();
  assert.ok(calledUrl.includes('/finance/notifications/outbox/process'));
  assert.equal(res.status, 'COMPLETED');
  assert.equal(res.job_type, 'OUTBOX_DISPATCH');
  assert.equal(res.processed, 14);
});

test('api.getSchedulerRunnerStatus retrieves automated runner telemetry', async () => {
  clearApiCache();
  let calledUrl = '';

  mockFetch((url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        enabled: true,
        is_running: true,
        is_leader: true,
        leader_id: 'runner-node-01',
        instance_id: 'runner-node-01',
        timezone: 'UTC',
        last_heartbeat: '2026-10-27T10:00:00Z',
        anti_burst_cadence: {
          RECURRING_BILLING: '0 0 * * *',
          OVERDUE_DUNNING: '0 6 * * *',
          OUTBOX_DISPATCH: '300s'
        }
      })
    };
  });

  const res = await api.getSchedulerRunnerStatus();
  assert.ok(calledUrl.includes('/finance/scheduler/runner/status'));
  assert.equal(res.enabled, true);
  assert.equal(res.is_leader, true);
  assert.equal(res.timezone, 'UTC');
  assert.equal(res.anti_burst_cadence.OUTBOX_DISPATCH, '300s');
});

test('api.toggleSchedulerRunner sends enabled payload and receives updated runner state', async () => {
  clearApiCache();
  let calledUrl = '';
  let calledOptions = {};

  mockFetch((url, options) => {
    calledUrl = url;
    calledOptions = options;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        status: 'success',
        enabled: false,
        is_running: false,
        message: 'Scheduler runner disabled.'
      })
    };
  });

  const res = await api.toggleSchedulerRunner(false);
  assert.ok(calledUrl.includes('/finance/scheduler/runner/toggle'));
  assert.equal(calledOptions.method, 'POST');
  assert.deepEqual(JSON.parse(calledOptions.body), { enabled: false });
  assert.equal(res.status, 'success');
  assert.equal(res.enabled, false);
});
