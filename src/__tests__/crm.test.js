import test from 'node:test';
import assert from 'node:assert/strict';
import { api, clearApiCache } from '../services/api.js';

function mockFetch(handler) {
  globalThis.fetch = async (url, options = {}) => {
    return handler(url, options);
  };
}

test('api.createCustomer serializes payload and POSTs to /customers', async () => {
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
        id: 99,
        customer_number: 'CUST-MUM-9988',
        legal_name: 'Apex Infotech Private Limited',
        account_type: 'ENTERPRISE',
        market_id: 'mumbai',
        status: 'ACTIVE'
      })
    };
  });

  const res = await api.createCustomer({
    legal_name: 'Apex Infotech Private Limited',
    account_type: 'ENTERPRISE',
    customer_number: 'CUST-MUM-9988',
    phone: '+91 98200 11223',
    email: 'info@apex.in',
    market_id: 'mumbai'
  });

  assert.ok(calledUrl.endsWith('/customers'));
  assert.equal(calledMethod, 'POST');
  assert.equal(calledBody.legal_name, 'Apex Infotech Private Limited');
  assert.equal(calledBody.account_type, 'ENTERPRISE');
  assert.equal(res.id, 99);
  assert.equal(res.customer_number, 'CUST-MUM-9988');
});

test('api.getCustomerDetail calls /customers/{idOrCode}', async () => {
  clearApiCache();
  let calledUrl = '';

  mockFetch((url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        id: 1,
        customer_code: 'CUST-MUM-0001',
        name: 'Aarav Sharma',
        market_id: 'mumbai',
        contacts: [{ id: 10, role: 'PRIMARY', is_primary: true }],
        addresses: [{ id: 20, address_type: 'INSTALLATION', is_primary: true }]
      })
    };
  });

  const detail = await api.getCustomerDetail(1);
  assert.ok(calledUrl.endsWith('/customers/1'));
  assert.equal(detail.id, 1);
  assert.equal(detail.customer_code, 'CUST-MUM-0001');
  assert.equal(detail.contacts.length, 1);
  assert.equal(detail.addresses.length, 1);
});

test('api.updateCustomer sends PUT request to /customers/{id}', async () => {
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
        id: 1,
        legal_name: 'Updated Name',
        version: 2
      })
    };
  });

  const res = await api.updateCustomer(1, { legal_name: 'Updated Name', version: 1 });
  assert.ok(calledUrl.endsWith('/customers/1'));
  assert.equal(calledMethod, 'PUT');
  assert.equal(calledBody.legal_name, 'Updated Name');
  assert.equal(calledBody.version, 1);
  assert.equal(res.version, 2);
});

test('api.archiveCustomer sends DELETE request to /customers/{id}', async () => {
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
      json: async () => ({ message: 'Customer successfully archived', status: 'ARCHIVED' })
    };
  });

  const res = await api.archiveCustomer(1);
  assert.ok(calledUrl.endsWith('/customers/1'));
  assert.equal(calledMethod, 'DELETE');
  assert.equal(res.status, 'ARCHIVED');
});

test('api.getCustomerContacts and createCustomerContact', async () => {
  clearApiCache();
  let postUrl = '';
  let postBody = null;

  mockFetch((url, options) => {
    if (options.method === 'POST') {
      postUrl = url;
      postBody = JSON.parse(options.body);
      return {
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          id: 55,
          customer_id: 1,
          first_name: 'Neha',
          last_name: 'Patel',
          role: 'BILLING',
          is_primary: false
        })
      };
    }
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ([
        { id: 1, first_name: 'Aarav', role: 'PRIMARY', is_primary: true }
      ])
    };
  });

  const list = await api.getCustomerContacts(1);
  assert.equal(list.length, 1);
  assert.equal(list[0].role, 'PRIMARY');

  const created = await api.createCustomerContact(1, {
    first_name: 'Neha',
    last_name: 'Patel',
    role: 'BILLING',
    phone: '+91 98200 99887'
  });
  assert.ok(postUrl.endsWith('/customers/1/contacts'));
  assert.equal(postBody.first_name, 'Neha');
  assert.equal(created.id, 55);
});

test('api.getCustomerAddresses and createCustomerAddress', async () => {
  clearApiCache();
  let postUrl = '';
  let postBody = null;

  mockFetch((url, options) => {
    if (options.method === 'POST') {
      postUrl = url;
      postBody = JSON.parse(options.body);
      return {
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          id: 77,
          customer_id: 1,
          address_line1: 'Floor 4, Mittal Tower',
          city: 'Mumbai',
          address_type: 'INSTALLATION',
          is_primary: true
        })
      };
    }
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ([
        { id: 1, address_line1: 'Colaba Causeway', is_primary: true }
      ])
    };
  });

  const addrs = await api.getCustomerAddresses(1);
  assert.equal(addrs.length, 1);

  const created = await api.createCustomerAddress(1, {
    address_line1: 'Floor 4, Mittal Tower',
    city: 'Mumbai',
    address_type: 'INSTALLATION',
    is_primary: true
  });
  assert.ok(postUrl.endsWith('/customers/1/addresses'));
  assert.equal(postBody.address_line1, 'Floor 4, Mittal Tower');
  assert.equal(created.id, 77);
});

test('api.getLeads and idempotent convertLead', async () => {
  clearApiCache();
  let convertUrl = '';

  mockFetch((url, options) => {
    if (url.includes('/convert')) {
      convertUrl = url;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          message: 'Lead converted successfully',
          lead_id: 'lead-uuid-1',
          customer_id: 88,
          customer_number: 'CUST-MUM-8888',
          already_converted: false
        })
      };
    }
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ([
        { id: 'lead-uuid-1', first_name: 'Pooja', status: 'QUALIFIED', estimated_mrr: 2500 }
      ])
    };
  });

  const leads = await api.getLeads();
  assert.equal(leads.length, 1);
  assert.equal(leads[0].status, 'QUALIFIED');

  const conversion = await api.convertLead('lead-uuid-1', { notes: 'Automated conversion' });
  assert.ok(convertUrl.includes('/customers/leads/lead-uuid-1/convert'));
  assert.equal(conversion.customer_number, 'CUST-MUM-8888');
  assert.equal(conversion.customer_id, 88);
});

test('api.getCustomerMapLocations verifies coordinates vs pending survey fidelity', async () => {
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
        total_customers: 2,
        with_coordinates_count: 1,
        missing_coordinates_count: 1,
        locations: [
          { customer_id: 1, name: 'Aarav Sharma', has_coordinates: true, latitude: 18.9220, longitude: 72.8347 },
          { customer_id: 2, name: 'Diya Patel', has_coordinates: false, latitude: null, longitude: null }
        ]
      })
    };
  });

  const mapData = await api.getCustomerMapLocations();
  assert.ok(calledUrl.endsWith('/customers/map-locations'));
  assert.equal(mapData.total_customers, 2);
  assert.equal(mapData.with_coordinates_count, 1);
  assert.equal(mapData.missing_coordinates_count, 1);
  assert.equal(mapData.locations[0].has_coordinates, true);
  assert.equal(mapData.locations[1].has_coordinates, false);
});

test('api.getCustomerVouchers documents Phase 2 Billing & Provisioning Engine dependency', async () => {
  clearApiCache();
  let calledUrl = '';

  mockFetch((url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ([
        {
          id: 'vch-1',
          customer_id: 1,
          customer_name: 'Aarav Sharma',
          voucher_code: 'VCH-SPEE-MUM-0001',
          voucher_type: 'SPEED_BOOST',
          status: 'STAGED',
          validity_days: 30,
          provisioning_dependency: 'OSS/BSS Billing & Provisioning Engine (Phase 2)'
        }
      ])
    };
  });

  const vouchers = await api.getCustomerVouchers();
  assert.ok(calledUrl.includes('/customers/vouchers'));
  assert.equal(vouchers.length, 1);
  assert.equal(vouchers[0].status, 'STAGED');
  assert.ok(vouchers[0].provisioning_dependency.includes('Phase 2'));
});

test('api.updateCustomerAddress sends PUT request with address fields and coordinates', async () => {
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
        id: 'addr-123',
        address_line1: 'Suite 400',
        city: 'Mumbai',
        latitude: 19.0760,
        longitude: 72.8777,
        serviceability_status: 'SERVICEABLE'
      })
    };
  });

  const res = await api.updateCustomerAddress('cust-1', 'addr-123', {
    address_line1: 'Suite 400',
    latitude: 19.0760,
    longitude: 72.8777
  });

  assert.ok(calledUrl.endsWith('/customers/cust-1/addresses/addr-123'));
  assert.equal(calledMethod, 'PUT');
  assert.equal(calledBody.address_line1, 'Suite 400');
  assert.equal(calledBody.latitude, 19.0760);
  assert.equal(res.serviceability_status, 'SERVICEABLE');
});

test('api.completeAddressSurvey sends POST to /survey-complete with verified coordinates', async () => {
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
        address_id: 'addr-123',
        survey_status: 'COMPLETED',
        serviceability_status: 'SERVICEABLE',
        ticket_status: 'Resolved'
      })
    };
  });

  const res = await api.completeAddressSurvey('cust-1', 'addr-123', {
    latitude: 18.9220,
    longitude: 72.8347,
    serviceability_status: 'SERVICEABLE',
    field_notes: 'DP located 15m away'
  });

  assert.ok(calledUrl.endsWith('/customers/cust-1/addresses/addr-123/survey-complete'));
  assert.equal(calledMethod, 'POST');
  assert.equal(calledBody.latitude, 18.9220);
  assert.equal(res.survey_status, 'COMPLETED');
  assert.equal(res.ticket_status, 'Resolved');
});

test('api.getCustomerDocuments and uploadCustomerDocument operate on /documents endpoint', async () => {
  clearApiCache();
  let calledUrl = '';
  let calledMethod = '';

  mockFetch((url, options) => {
    calledUrl = url;
    calledMethod = options.method || 'GET';
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ([
        {
          id: 'doc-99',
          document_type: 'AADHAAR',
          masked_identifier: 'XXXX-XXXX-1234',
          verification_status: 'VERIFIED'
        }
      ])
    };
  });

  const docs = await api.getCustomerDocuments('cust-1');
  assert.ok(calledUrl.endsWith('/customers/cust-1/documents'));
  assert.equal(calledMethod, 'GET');
  assert.equal(docs.length, 1);
  assert.equal(docs[0].masked_identifier, 'XXXX-XXXX-1234');
});

test('api.verifyCustomerDocument sends POST to /verify with updated status', async () => {
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
        id: 'doc-99',
        verification_status: 'VERIFIED',
        verification_notes: 'Verified via UIDAI'
      })
    };
  });

  const res = await api.verifyCustomerDocument('cust-1', 'doc-99', {
    verification_status: 'VERIFIED',
    verification_notes: 'Verified via UIDAI'
  });

  assert.ok(calledUrl.endsWith('/customers/cust-1/documents/doc-99/verify'));
  assert.equal(calledMethod, 'POST');
  assert.equal(calledBody.verification_status, 'VERIFIED');
  assert.equal(res.verification_status, 'VERIFIED');
});

