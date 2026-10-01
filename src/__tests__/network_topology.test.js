import test from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../services/api.js';

// Mock fetch for API testing
function mockFetch(mockResponse, status = 200) {
  globalThis.fetch = async (url, options) => {
    return {
      ok: status >= 200 && status < 300,
      status,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockResponse,
      text: async () => JSON.stringify(mockResponse),
    };
  };
}

// ─── 1. Network API Client Endpoint Tests ─────────────────────────────────────

test('api.getNetworkOverview calls /network/overview with auth headers', async () => {
  let calledUrl = '';
  let calledHeaders = {};
  globalThis.fetch = async (url, options) => {
    calledUrl = url;
    calledHeaders = options?.headers || {};
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        market_id: 'mumbai',
        total_olts: 3,
        total_fiber_cabinets: 6,
        total_splitters: 12,
        total_ont_onus: 36,
        active_alarms: 2,
        telemetry_source: 'Synthetic / Demo Telemetry'
      }),
    };
  };

  const overview = await api.getNetworkOverview();
  assert.ok(calledUrl.includes('/network/overview'));
  assert.equal(overview.total_olts, 3);
  assert.equal(overview.total_fiber_cabinets, 6);
  assert.equal(overview.telemetry_source, 'Synthetic / Demo Telemetry');
});

test('api.getNetworkMapLayers returns GIS layers and telemetry source', async () => {
  let calledUrl = '';
  globalThis.fetch = async (url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        olts: [{ id: 1, name: 'OLT-MUM-01', lat: 19.11, lng: 72.84 }],
        fiber_cabinets: [{ id: 1, code: 'FDC-01', lat: 19.112, lng: 72.842 }],
        splitters: [{ id: 1, code: 'SPL-01', lat: 19.113, lng: 72.843 }],
        onts: [{ id: 1, code: 'ONT-01', lat: 19.114, lng: 72.844 }],
        links: [{ id: 1, source_id: 1, target_id: 2, coordinates: [[72.84, 19.11], [72.842, 19.112]] }],
        telemetry_source: 'Synthetic / Demo Telemetry'
      }),
    };
  };

  const layers = await api.getNetworkMapLayers();
  assert.ok(calledUrl.includes('/network/map-layers'));
  assert.equal(layers.olts.length, 1);
  assert.equal(layers.fiber_cabinets.length, 1);
  assert.equal(layers.links.length, 1);
  assert.equal(layers.telemetry_source, 'Synthetic / Demo Telemetry');
});

test('api.getCustomerNetworkTopology retrieves reverse path from customer to OLT', async () => {
  let calledUrl = '';
  globalThis.fetch = async (url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        customer_id: 101,
        customer_name: 'Aditya Sharma',
        path: [
          { type: 'OLT', id: 1, name: 'OLT-MUM-ANDHERI-01' },
          { type: 'PON_PORT', id: 1, port_number: '1/1/1' },
          { type: 'FIBER_CABINET', id: 1, device_code: 'FDC-MUM-AND-01' },
          { type: 'SPLITTER', id: 1, device_code: 'SPL-AND-01-A' },
          { type: 'ONT', id: 1, device_code: 'ONT-MUM-0001' }
        ],
        ont: {
          id: 1,
          device_code: 'ONT-MUM-0001',
          health: { optical_rx_dbm: -19.5, optical_tx_dbm: 2.3, status: 'NORMAL' }
        },
        telemetry_source: 'Synthetic / Demo Telemetry'
      }),
    };
  };

  const top = await api.getCustomerNetworkTopology(101);
  assert.ok(calledUrl.includes('/network/topology/customer/101'));
  assert.equal(top.customer_id, 101);
  assert.equal(top.path.length, 5);
  assert.equal(top.path[0].type, 'OLT');
  assert.equal(top.path[1].type, 'PON_PORT');
  assert.equal(top.path[2].type, 'FIBER_CABINET');
  assert.equal(top.path[3].type, 'SPLITTER');
  assert.equal(top.path[4].type, 'ONT');
  assert.equal(top.ont.health.optical_rx_dbm, -19.5);
});

test('api.getDeviceImpact retrieves deterministic downstream impact analysis', async () => {
  let calledUrl = '';
  globalThis.fetch = async (url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        device_id: 'FDC-MUM-AND-01',
        device_type: 'FIBER_CABINET',
        total_downstream_devices: 14,
        total_affected_customers: 6,
        affected_customers: [
          { id: 101, name: 'Aditya Sharma', locality: 'Andheri West' },
          { id: 102, name: 'Pooja Patel', locality: 'Andheri West' }
        ],
        telemetry_source: 'Synthetic / Demo Telemetry'
      }),
    };
  };

  const impact = await api.getDeviceImpact('FDC-MUM-AND-01');
  assert.ok(calledUrl.includes('/network/impact/FDC-MUM-AND-01'));
  assert.equal(impact.total_downstream_devices, 14);
  assert.equal(impact.total_affected_customers, 6);
  assert.equal(impact.affected_customers.length, 2);
  assert.equal(impact.telemetry_source, 'Synthetic / Demo Telemetry');
});

test('api.getNetworkAlarms filters by severity or returns all alarms', async () => {
  let calledUrl = '';
  globalThis.fetch = async (url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ([
        { id: 1, alarm_code: 'LOS', severity: 'CRITICAL', message: 'Loss of optical signal' },
        { id: 2, alarm_code: 'HIGH_TEMP', severity: 'WARNING', message: 'Chassis temperature above threshold' }
      ]),
    };
  };

  const alarms = await api.getNetworkAlarms('CRITICAL');
  assert.ok(calledUrl.includes('/network/alarms?severity=CRITICAL'));
  assert.equal(alarms.length, 2);
  assert.equal(alarms[0].alarm_code, 'LOS');
  assert.equal(alarms[0].severity, 'CRITICAL');
});

test('api.getNetworkOltPorts retrieves port metrics for an OLT', async () => {
  let calledUrl = '';
  globalThis.fetch = async (url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ([
        { id: 1, port_number: '1/1/1', status: 'UP', connected_ont_count: 24, max_capacity: 64, optical_tx_power_dbm: 2.5 },
        { id: 2, port_number: '1/1/2', status: 'UP', connected_ont_count: 18, max_capacity: 64, optical_tx_power_dbm: 2.4 }
      ]),
    };
  };

  const ports = await api.getNetworkOltPorts(1);
  assert.ok(calledUrl.includes('/network/olts/1/ports'));
  assert.equal(ports.length, 2);
  assert.equal(ports[0].port_number, '1/1/1');
  assert.equal(ports[0].connected_ont_count, 24);
});
