import test from 'node:test';
import assert from 'node:assert/strict';

// Import getHomeRouteForRole helper
import { getHomeRouteForRole } from '../utils/authUtils.js';

test('RBAC - getHomeRouteForRole maps each role to its isolated portal', () => {
  // Customer Portal
  assert.equal(getHomeRouteForRole('Customer'), '/portal/customer/home');

  // Field Engineer Mobile Portal
  assert.equal(getHomeRouteForRole('Field Engineer'), '/portal/engineer/jobs');

  // Governance & Operations Dashboard
  assert.equal(getHomeRouteForRole('Admin'), '/dashboard/cockpit');
  assert.equal(getHomeRouteForRole('NOC'), '/dashboard/cockpit');
  assert.equal(getHomeRouteForRole('Care'), '/dashboard/cockpit');
  assert.equal(getHomeRouteForRole('Revenue'), '/dashboard/cockpit');
  assert.equal(getHomeRouteForRole('Executive'), '/dashboard/cockpit');
  assert.equal(getHomeRouteForRole('Viewer'), '/dashboard/cockpit');
});

test('RBAC - PortalRoute decision logic prevents dead-ends and cross-portal leakage', () => {
  function evaluatePortalAccess(user, allowedRoles) {
    if (!user) {
      return { action: 'REDIRECT', target: '/login' };
    }
    if (user.role === 'SUPER_ADMIN' || user.role === 'Admin') {
      return { action: 'ALLOW' };
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return { action: 'REDIRECT', target: getHomeRouteForRole(user.role) };
    }
    return { action: 'ALLOW' };
  }

  // 1. Unauthenticated user hits any portal -> redirected to /login
  assert.deepEqual(
    evaluatePortalAccess(null, ['Customer']),
    { action: 'REDIRECT', target: '/login' }
  );
  assert.deepEqual(
    evaluatePortalAccess(null, ['Field Engineer']),
    { action: 'REDIRECT', target: '/login' }
  );
  assert.deepEqual(
    evaluatePortalAccess(null, ['NOC', 'Admin']),
    { action: 'REDIRECT', target: '/login' }
  );

  // 2. Customer hits /dashboard/cockpit (allowedRoles: NOC, Admin, etc.) -> redirected to /portal/customer/home
  const customerUser = { role: 'Customer', email: 'customer@pmrg.in' };
  assert.deepEqual(
    evaluatePortalAccess(customerUser, ['Admin', 'NOC', 'Care', 'Revenue', 'Executive', 'Viewer']),
    { action: 'REDIRECT', target: '/portal/customer/home' }
  );

  // 3. Field Engineer hits /portal/customer/home -> redirected to /portal/engineer/jobs
  const engineerUser = { role: 'Field Engineer', email: 'rahul.field@pmrg.in' };
  assert.deepEqual(
    evaluatePortalAccess(engineerUser, ['Customer']),
    { action: 'REDIRECT', target: '/portal/engineer/jobs' }
  );

  // 4. Customer hits /portal/engineer/jobs -> redirected to /portal/customer/home
  assert.deepEqual(
    evaluatePortalAccess(customerUser, ['Field Engineer']),
    { action: 'REDIRECT', target: '/portal/customer/home' }
  );

  // 5. NOC user hits /dashboard/* -> ALLOW
  const nocUser = { role: 'NOC', email: 'noc@pmrg.in' };
  assert.deepEqual(
    evaluatePortalAccess(nocUser, ['Admin', 'NOC', 'Care', 'Revenue', 'Executive', 'Viewer']),
    { action: 'ALLOW' }
  );

  // 6. Admin and SUPER_ADMIN have cross-portal access for audit & troubleshooting
  const adminUser = { role: 'Admin', email: 'admin@pmrg.in' };
  assert.deepEqual(evaluatePortalAccess(adminUser, ['Customer']), { action: 'ALLOW' });
  assert.deepEqual(evaluatePortalAccess(adminUser, ['Field Engineer']), { action: 'ALLOW' });
  assert.deepEqual(evaluatePortalAccess(adminUser, ['NOC']), { action: 'ALLOW' });

  const superAdminUser = { role: 'SUPER_ADMIN', email: 'superadmin@pmrg.in' };
  assert.deepEqual(evaluatePortalAccess(superAdminUser, ['Customer']), { action: 'ALLOW' });
  assert.deepEqual(evaluatePortalAccess(superAdminUser, ['Field Engineer']), { action: 'ALLOW' });
  assert.deepEqual(evaluatePortalAccess(superAdminUser, ['NOC']), { action: 'ALLOW' });
});

test('RBAC - Sidebar navigation filters items according to user role', () => {
  const sections = [
    {
      title: 'AI GOVERNANCE',
      items: [
        { id: 'cockpit', label: 'Overview', allowedRoles: ['Admin', 'NOC', 'Care', 'Revenue', 'Executive', 'Viewer'] },
        { id: 'pilot-bundle', label: 'Risk Topology & Trace', allowedRoles: ['Admin', 'NOC', 'Executive'] },
      ],
    },
    {
      title: 'SCORED INTELLIGENCE',
      items: [
        { id: 'assurance', label: 'Predictive Assurance', allowedRoles: ['Admin', 'NOC', 'Executive'] },
        { id: 'churn', label: 'Churn Prediction', allowedRoles: ['Admin', 'Care', 'Executive'] },
        { id: 'revenue', label: 'Revenue Assurance', allowedRoles: ['Admin', 'Revenue', 'Executive'] },
        { id: 'orchestration', label: 'OSS/BSS Orchestration', allowedRoles: ['Admin', 'NOC', 'Care', 'Executive'] },
      ],
    },
    {
      title: 'GOVERNED WORKFLOWS',
      items: [
        { id: 'ticketing', label: 'Auto-Ticketing', allowedRoles: ['Admin', 'NOC', 'Care'] },
        { id: 'field-operations', label: 'Field Operations', allowedRoles: ['Admin', 'NOC', 'Care', 'Executive'] },
        { id: 'journeys', label: 'Customer Journeys', allowedRoles: ['Admin', 'Care', 'Executive'] },
        { id: 'governance', label: 'Governance & Audits', allowedRoles: ['Admin', 'NOC', 'Executive'] },
        { id: 'customer360', label: 'Customer 360', allowedRoles: ['Admin', 'NOC', 'Care'] },
      ],
    },
  ];

  function getVisibleItemIds(role) {
    const user = { role };
    const visibleSections = sections.map((sec) => ({
      ...sec,
      items: sec.items.filter((item) =>
        !item.allowedRoles ||
        user?.role === 'Admin' ||
        item.allowedRoles.includes(user?.role)
      )
    })).filter((sec) => sec.items.length > 0);

    return visibleSections.flatMap((s) => s.items.map((i) => i.id));
  }

  // Field Engineer has own portal -> zero items in Operations sidebar
  const engVisible = getVisibleItemIds('Field Engineer');
  assert.equal(engVisible.length, 0);

  // Customer has own portal -> zero items in Operations sidebar
  const custVisible = getVisibleItemIds('Customer');
  assert.equal(custVisible.length, 0);

  // NOC lead sees technical assurance and ticketing, but NOT churn or revenue leakages
  const nocVisible = getVisibleItemIds('NOC');
  assert.ok(nocVisible.includes('cockpit'));
  assert.ok(nocVisible.includes('assurance'));
  assert.ok(nocVisible.includes('ticketing'));
  assert.ok(nocVisible.includes('field-operations'));
  assert.ok(!nocVisible.includes('churn'));
  assert.ok(!nocVisible.includes('revenue'));

  // Care lead sees churn, journeys, ticketing, but NOT node assurance
  const careVisible = getVisibleItemIds('Care');
  assert.ok(careVisible.includes('churn'));
  assert.ok(careVisible.includes('journeys'));
  assert.ok(careVisible.includes('ticketing'));
  assert.ok(!careVisible.includes('assurance'));

  // Admin sees all items
  const adminVisible = getVisibleItemIds('Admin');
  assert.equal(adminVisible.length, 11);
});

test('RBAC - Error translation replaces raw 403 backend strings with user-friendly messages', () => {
  function translateError(status, backendDetail) {
    const USER_MESSAGES = {
      401: 'Your session has expired. Please sign in again.',
      403: "You don't have permission to access this resource.",
      404: 'The requested record was not found.',
      400: backendDetail || 'The request could not be completed.',
      500: 'A server error occurred. Please try again shortly.',
    };
    return USER_MESSAGES[status] || backendDetail || `Request failed (${status})`;
  }

  const rawForbiddenDetail = "Access forbidden for role 'Customer'. Requires one of: NOC, Admin, Care, Executive";
  const userMessage403 = translateError(403, rawForbiddenDetail);
  assert.equal(userMessage403, "You don't have permission to access this resource.");
  assert.ok(!userMessage403.includes('Access forbidden for role'));

  const userMessage401 = translateError(401, 'Unauthorized');
  assert.equal(userMessage401, 'Your session has expired. Please sign in again.');

  const userMessage404 = translateError(404, 'Not Found');
  assert.equal(userMessage404, 'The requested record was not found.');

  const userMessage500 = translateError(500, 'Internal Server Error');
  assert.equal(userMessage500, 'A server error occurred. Please try again shortly.');
});

test('RBAC - Field job dispatch call isolation', () => {
  // Simulates job loading dispatcher
  function resolveJobFetcher(role, apiMocks) {
    if (role === 'Field Engineer') {
      return apiMocks.getMyFieldJobs();
    }
    if (['NOC', 'Admin', 'Care', 'Executive'].includes(role)) {
      return apiMocks.getFieldJobs();
    }
    throw new Error("You don't have permission to access this resource.");
  }

  let getMyFieldJobsCalled = false;
  let getFieldJobsCalled = false;

  const mockApi = {
    getMyFieldJobs: () => {
      getMyFieldJobsCalled = true;
      return [{ id: 101, status: 'ASSIGNED' }];
    },
    getFieldJobs: () => {
      getFieldJobsCalled = true;
      return [{ id: 101, status: 'ASSIGNED' }, { id: 102, status: 'WORKING' }];
    }
  };

  // 1. When role is Field Engineer -> calls getMyFieldJobs() strictly
  const engJobs = resolveJobFetcher('Field Engineer', mockApi);
  assert.equal(getMyFieldJobsCalled, true);
  assert.equal(getFieldJobsCalled, false);
  assert.equal(engJobs.length, 1);

  // 2. When role is Customer -> throws user-friendly error without calling getFieldJobs()
  assert.throws(
    () => resolveJobFetcher('Customer', mockApi),
    /You don't have permission to access this resource/
  );
  assert.equal(getFieldJobsCalled, false);
});
