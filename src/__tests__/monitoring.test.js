import test from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../services/api.js';

// ─── Helper for mocking fetch responses ──────────────────────────────────────────

function mockFetch(handler) {
  globalThis.fetch = async (url, options = {}) => {
    return handler(url, options);
  };
}

// ─── 1. Monitoring API Client Unit Tests ─────────────────────────────────────────

test('api.getMonitoringOverview calls /network/monitoring/overview and preserves synthetic source', async () => {
  let calledUrl = '';
  mockFetch((url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        market_id: 'mumbai',
        total_monitored_devices: 45,
        healthy_count: 40,
        warning_count: 3,
        critical_count: 2,
        active_monitoring_alarms: 5,
        telemetry_source: 'Synthetic / Demo Telemetry',
      }),
    };
  });

  const overview = await api.getMonitoringOverview();
  assert.ok(calledUrl.includes('/network/monitoring/overview'));
  assert.equal(overview.total_monitored_devices, 45);
  assert.equal(overview.healthy_count, 40);
  assert.equal(overview.warning_count, 3);
  assert.equal(overview.critical_count, 2);
  assert.equal(overview.telemetry_source, 'Synthetic / Demo Telemetry');
});

test('api.getMonitoringThresholds calls /network/monitoring/thresholds with optional type filter', async () => {
  let calledUrl = '';
  mockFetch((url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ([
        {
          id: 1,
          market_id: 'mumbai',
          device_type: 'OLT',
          metric_type: 'CPU_UTILIZATION',
          warning_threshold: 75.0,
          critical_threshold: 90.0,
          unit: '%',
        },
        {
          id: 2,
          market_id: 'mumbai',
          device_type: 'OLT',
          metric_type: 'TEMPERATURE',
          warning_threshold: 65.0,
          critical_threshold: 80.0,
          unit: '°C',
        }
      ]),
    };
  });

  const thresholds = await api.getMonitoringThresholds('OLT');
  assert.ok(calledUrl.includes('/network/monitoring/thresholds?device_type=OLT'));
  assert.equal(thresholds.length, 2);
  assert.equal(thresholds[0].device_type, 'OLT');
  assert.equal(thresholds[0].metric_type, 'CPU_UTILIZATION');
  assert.equal(thresholds[0].warning_threshold, 75.0);
  assert.equal(thresholds[0].critical_threshold, 90.0);
});

test('api.updateMonitoringThreshold sends PUT request with updated setpoints', async () => {
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
        market_id: 'mumbai',
        device_type: 'OLT',
        metric_type: 'CPU_UTILIZATION',
        warning_threshold: 70.0,
        critical_threshold: 85.0,
        unit: '%',
      }),
    };
  });

  const updated = await api.updateMonitoringThreshold(1, 70.0, 85.0);
  assert.ok(calledUrl.includes('/network/monitoring/thresholds/1'));
  assert.equal(calledMethod, 'PUT');
  assert.equal(calledBody.warning_threshold, 70.0);
  assert.equal(calledBody.critical_threshold, 85.0);
  assert.equal(updated.warning_threshold, 70.0);
  assert.equal(updated.critical_threshold, 85.0);
});

test('api.getMonitoringAlarms queries alarms with severity and status filters', async () => {
  let calledUrl = '';
  mockFetch((url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ([
        {
          id: 1,
          device_id: 10,
          alarm_code: 'ALM-CPU-10',
          severity: 'CRITICAL',
          status: 'ACTIVE',
          message: 'CPU load reached 94%',
        }
      ]),
    };
  });

  const alarms = await api.getMonitoringAlarms('CRITICAL', 'ACTIVE');
  assert.ok(calledUrl.includes('/network/monitoring/alarms'));
  assert.ok(calledUrl.includes('severity=CRITICAL'));
  assert.ok(calledUrl.includes('status=ACTIVE'));
  assert.equal(alarms.length, 1);
  assert.equal(alarms[0].alarm_code, 'ALM-CPU-10');
  assert.equal(alarms[0].severity, 'CRITICAL');
});

test('api.getDeviceMetrics retrieves multi-dimensional health metrics payload', async () => {
  let calledUrl = '';
  mockFetch((url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        device_id: 1,
        device_code: 'OLT-BND-01',
        health_status: 'HEALTHY',
        health_reasons: ['All metrics within nominal operating thresholds.'],
        cpu: { load_pct: 42.5, status: 'NORMAL', warning_threshold: 75.0, critical_threshold: 90.0 },
        memory: { used_gb: 7.7, total_gb: 16.0, used_pct: 48.1, status: 'NORMAL' },
        temperature: { current_celsius: 42.0, status: 'NORMAL' },
        uptime: { seconds: 1209600, formatted: '14d 0h 0m' },
        optical: { rx_power_dbm: -19.5, tx_power_dbm: 2.5, status: 'NORMAL' },
        freshness: 'LIVE',
        telemetry_source: 'Synthetic / Demo Telemetry',
      }),
    };
  });

  const metrics = await api.getDeviceMetrics(1);
  assert.ok(calledUrl.includes('/network/devices/1/metrics'));
  assert.equal(metrics.device_code, 'OLT-BND-01');
  assert.equal(metrics.health_status, 'HEALTHY');
  assert.equal(metrics.cpu.load_pct, 42.5);
  assert.equal(metrics.memory.total_gb, 16.0);
  assert.equal(metrics.temperature.current_celsius, 42.0);
  assert.equal(metrics.freshness, 'LIVE');
  assert.equal(metrics.telemetry_source, 'Synthetic / Demo Telemetry');
});

test('api.getDeviceMetricsHistory fetches time-series data with time range and metric filter', async () => {
  let calledUrl = '';
  mockFetch((url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        device_id: 1,
        time_range: '6h',
        metric_type: 'CPU_UTILIZATION',
        data_points: [
          { timestamp: '2026-09-30T10:00:00Z', value: 41.2, status: 'NORMAL' },
          { timestamp: '2026-09-30T11:00:00Z', value: 43.8, status: 'NORMAL' },
          { timestamp: '2026-09-30T12:00:00Z', value: 45.1, status: 'NORMAL' }
        ],
        telemetry_source: 'Synthetic / Demo Telemetry',
      }),
    };
  });

  const history = await api.getDeviceMetricsHistory(1, '6h', 'CPU_UTILIZATION');
  assert.ok(calledUrl.includes('/network/devices/1/metrics/history?time_range=6h&metric_type=CPU_UTILIZATION'));
  assert.equal(history.data_points.length, 3);
  assert.equal(history.data_points[0].value, 41.2);
  assert.equal(history.telemetry_source, 'Synthetic / Demo Telemetry');
});

test('api.simulateDeviceScenario triggers safe diagnostic scenario', async () => {
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
        device_id: 1,
        scenario: 'CRITICAL',
        health_status: 'CRITICAL',
        health_reasons: ['CRITICAL: CPU load at 94.0% exceeds threshold 90.0%'],
        metrics: {
          cpu_utilization_pct: 94.0,
          memory_utilization_pct: 91.0,
          chassis_temperature_celsius: 82.0,
        },
        alarms_triggered: 3,
        telemetry_source: 'Synthetic / Demo Telemetry',
      }),
    };
  });

  const simResult = await api.simulateDeviceScenario(1, 'CRITICAL');
  assert.ok(calledUrl.includes('/network/devices/1/simulate'));
  assert.equal(calledBody.scenario, 'CRITICAL');
  assert.equal(simResult.health_status, 'CRITICAL');
  assert.equal(simResult.metrics.cpu_utilization_pct, 94.0);
  assert.equal(simResult.alarms_triggered, 3);
});

// ─── 2. Health Classification & Threshold Rule Logic ─────────────────────────────

function classifyMetricStatus(value, warnThreshold, critThreshold) {
  if (value >= critThreshold) return 'CRITICAL';
  if (value >= warnThreshold) return 'WARNING';
  return 'NORMAL';
}

function classifyOverallHealth(metricStatuses) {
  if (metricStatuses.includes('DOWN')) return 'DOWN';
  if (metricStatuses.includes('CRITICAL')) return 'CRITICAL';
  if (metricStatuses.includes('WARNING')) return 'WARNING';
  if (metricStatuses.includes('DEGRADED')) return 'DEGRADED';
  return 'HEALTHY';
}

test('Metric status classification honors configured warning and critical thresholds', () => {
  // Test CPU thresholds: warn=75, crit=90
  assert.equal(classifyMetricStatus(45.0, 75.0, 90.0), 'NORMAL');
  assert.equal(classifyMetricStatus(75.0, 75.0, 90.0), 'WARNING');
  assert.equal(classifyMetricStatus(82.5, 75.0, 90.0), 'WARNING');
  assert.equal(classifyMetricStatus(90.0, 75.0, 90.0), 'CRITICAL');
  assert.equal(classifyMetricStatus(98.2, 75.0, 90.0), 'CRITICAL');
});

test('Overall health status priority follows DOWN > CRITICAL > WARNING > HEALTHY', () => {
  // All normal -> HEALTHY
  assert.equal(classifyOverallHealth(['NORMAL', 'NORMAL', 'NORMAL']), 'HEALTHY');

  // Single warning -> WARNING
  assert.equal(classifyOverallHealth(['NORMAL', 'WARNING', 'NORMAL']), 'WARNING');

  // Warning and Critical -> CRITICAL takes precedence
  assert.equal(classifyOverallHealth(['NORMAL', 'WARNING', 'CRITICAL']), 'CRITICAL');

  // Down takes absolute precedence
  assert.equal(classifyOverallHealth(['WARNING', 'CRITICAL', 'DOWN']), 'DOWN');
});

// ─── 3. Telemetry Freshness Computation ──────────────────────────────────────────

function computeTelemetryFreshness(lastUpdatedTimestamp, now = Date.now()) {
  if (!lastUpdatedTimestamp) return 'OFFLINE';
  const ageSeconds = (now - new Date(lastUpdatedTimestamp).getTime()) / 1000;
  if (ageSeconds <= 300) return 'LIVE';        // <= 5 minutes
  if (ageSeconds <= 1800) return 'STALE';      // <= 30 minutes
  return 'OFFLINE';
}

test('Telemetry freshness computes LIVE, STALE, and OFFLINE accurately', () => {
  const now = new Date('2026-09-30T12:00:00Z').getTime();

  // 1 minute ago -> LIVE
  const oneMinAgo = new Date(now - 60 * 1000).toISOString();
  assert.equal(computeTelemetryFreshness(oneMinAgo, now), 'LIVE');

  // 4 minutes ago -> LIVE
  const fourMinAgo = new Date(now - 4 * 60 * 1000).toISOString();
  assert.equal(computeTelemetryFreshness(fourMinAgo, now), 'LIVE');

  // 10 minutes ago -> STALE
  const tenMinAgo = new Date(now - 10 * 60 * 1000).toISOString();
  assert.equal(computeTelemetryFreshness(tenMinAgo, now), 'STALE');

  // 25 minutes ago -> STALE
  const twentyFiveMinAgo = new Date(now - 25 * 60 * 1000).toISOString();
  assert.equal(computeTelemetryFreshness(twentyFiveMinAgo, now), 'STALE');

  // 45 minutes ago -> OFFLINE
  const fortyFiveMinAgo = new Date(now - 45 * 60 * 1000).toISOString();
  assert.equal(computeTelemetryFreshness(fortyFiveMinAgo, now), 'OFFLINE');

  // null timestamp -> OFFLINE
  assert.equal(computeTelemetryFreshness(null, now), 'OFFLINE');
});
