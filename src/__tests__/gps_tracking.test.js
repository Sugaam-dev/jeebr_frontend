import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// 1. Production Service & Provider Imports
import {
  BrowserLocationProvider,
  SimulatorLocationProvider,
  LocationError,
  calculateDistanceMeters
} from '../services/locationProvider.js';

import { GPS_TRACKING_STATES } from '../constants/gpsConstants.js';
import { api } from '../services/api.js';
import { GpsTrackingProvider, useGpsTracking } from '../context/GpsTrackingContext.js';

// Helper to mock navigator.geolocation on Node 22
function mockGeolocation(geoMock) {
  if (geoMock === null) {
    delete globalThis.navigator.geolocation;
    return;
  }
  Object.defineProperty(globalThis.navigator, 'geolocation', {
    value: geoMock,
    configurable: true,
    writable: true
  });
}

function mockPermissions(permissionMock) {
  if (permissionMock === null) {
    delete globalThis.navigator.permissions;
    return;
  }
  Object.defineProperty(globalThis.navigator, 'permissions', {
    value: permissionMock,
    configurable: true,
    writable: true
  });
}

// --- 1. Production BrowserLocationProvider Unit Tests ---

test('BrowserLocationProvider - isSupported detects geolocation presence', () => {
  mockGeolocation({ getCurrentPosition: () => {}, watchPosition: () => {} });
  const provider = new BrowserLocationProvider();
  assert.equal(provider.isSupported(), true);

  mockGeolocation(null);
  assert.equal(provider.isSupported(), false);
});

test('BrowserLocationProvider - watchPosition successfully invokes onSuccess with normalized coordinates', () => {
  let watchCallback = null;
  mockGeolocation({
    watchPosition: (success) => {
      watchCallback = success;
      return 42;
    },
    clearWatch: () => {}
  });

  const provider = new BrowserLocationProvider();
  let receivedPosition = null;

  const watchId = provider.watchPosition((pos) => {
    receivedPosition = pos;
  });

  assert.equal(watchId, 42);

  watchCallback({
    coords: {
      latitude: 19.0551234,
      longitude: 72.8354567,
      accuracy: 12.4,
      heading: 180.2,
      speed: 3.5
    },
    timestamp: 1727270400000
  });

  assert.notEqual(receivedPosition, null);
  assert.equal(receivedPosition.latitude, 19.055123);
  assert.equal(receivedPosition.longitude, 72.835457);
  assert.equal(receivedPosition.accuracy, 12);
  assert.equal(receivedPosition.heading, 180.2);
  assert.equal(receivedPosition.speedMps, 3.5);
  assert.equal(receivedPosition.isMock, false);
});

test('BrowserLocationProvider - watchPosition maps GeolocationPositionError codes to standard LocationError', () => {
  let errorCallback = null;
  mockGeolocation({
    watchPosition: (success, error) => {
      errorCallback = error;
      return 1;
    },
    clearWatch: () => {}
  });

  const provider = new BrowserLocationProvider();
  let capturedError = null;
  provider.watchPosition(() => {}, (err) => { capturedError = err; });

  // Code 1: PERMISSION_DENIED
  errorCallback({ code: 1, message: 'User denied Geolocation' });
  assert.equal(capturedError instanceof LocationError, true);
  assert.equal(capturedError.code, 'PERMISSION_DENIED');

  // Code 2: POSITION_UNAVAILABLE
  errorCallback({ code: 2, message: 'Position unavailable' });
  assert.equal(capturedError.code, 'POSITION_UNAVAILABLE');

  // Code 3: TIMEOUT
  errorCallback({ code: 3, message: 'Timeout' });
  assert.equal(capturedError.code, 'TIMEOUT');
});

test('BrowserLocationProvider - accuracy filter discards readings > 150m with LOW_ACCURACY', () => {
  let watchCallback = null;
  mockGeolocation({
    watchPosition: (success) => {
      watchCallback = success;
      return 1;
    },
    clearWatch: () => {}
  });

  const provider = new BrowserLocationProvider({ maxAcceptableAccuracyMeters: 150.0 });
  let successCount = 0;
  let capturedError = null;

  provider.watchPosition(
    () => { successCount++; },
    (err) => { capturedError = err; }
  );

  // Send reading with 300m accuracy radius
  watchCallback({
    coords: { latitude: 19.055, longitude: 72.835, accuracy: 300.0, speed: 0, heading: 0 },
    timestamp: Date.now()
  });

  assert.equal(successCount, 0, 'Inaccurate reading must not trigger success callback');
  assert.notEqual(capturedError, null);
  assert.equal(capturedError.code, 'LOW_ACCURACY');
});

test('BrowserLocationProvider - throttling filters pings under minIntervalMs and minDistanceMeters', () => {
  let watchCallback = null;
  mockGeolocation({
    watchPosition: (success) => {
      watchCallback = success;
      return 1;
    },
    clearWatch: () => {}
  });

  const provider = new BrowserLocationProvider({
    minIntervalMs: 5000,
    minDistanceMeters: 8.0
  });

  let successCount = 0;
  provider.watchPosition(() => { successCount++; });

  const now = Date.now();

  // First ping at (19.055, 72.835) -> Accepted
  watchCallback({
    coords: { latitude: 19.055, longitude: 72.835, accuracy: 10, speed: 0, heading: 0 },
    timestamp: now
  });
  assert.equal(successCount, 1);

  // Second ping 1 second later, moved only 2 meters -> Filtered out
  watchCallback({
    coords: { latitude: 19.05501, longitude: 72.83501, accuracy: 10, speed: 0, heading: 0 },
    timestamp: now + 1000
  });
  assert.equal(successCount, 1, 'Ping under 5s and under 8m movement must be throttled');

  // Third ping 6 seconds later -> Accepted
  provider.lastAcceptedTime = now - 6000;
  watchCallback({
    coords: { latitude: 19.05501, longitude: 72.83501, accuracy: 10, speed: 0, heading: 0 },
    timestamp: now + 6000
  });
  assert.equal(successCount, 2, 'Ping after minIntervalMs must be accepted');
});

test('BrowserLocationProvider - clearWatch cleanly unsubscribes navigator watchId', () => {
  let clearedId = null;
  mockGeolocation({
    watchPosition: () => 999,
    clearWatch: (id) => { clearedId = id; }
  });

  const provider = new BrowserLocationProvider();
  const id = provider.watchPosition(() => {});
  provider.clearWatch(id);

  assert.equal(clearedId, 999);
});

// --- 2. Production API: api.sendLocationPing Contract Verification ---

test('api.sendLocationPing - serializes canonical payload and dispatches to endpoint', async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = null;
  let capturedOptions = null;

  globalThis.fetch = async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return {
      ok: true,
      status: 200,
      json: async () => ({ status: 'recorded', ping_id: 101 })
    };
  };

  try {
    const res = await api.sendLocationPing(42, {
      latitude: 19.055123,
      longitude: 72.835456,
      accuracy: 12.5,
      speed: 3.2,
      heading: 180.0,
      battery_level: 88,
      is_mock: false,
      recorded_at: '2026-09-28T09:00:00.000Z'
    });

    assert.equal(res.status, 'recorded');
    assert.equal(res.ping_id, 101);
    assert.equal(capturedUrl.includes('/field/jobs/42/ping'), true);
    assert.equal(capturedOptions.method, 'POST');

    const body = JSON.parse(capturedOptions.body);
    assert.equal(body.latitude, 19.055123);
    assert.equal(body.longitude, 72.835456);
    assert.equal(body.accuracy, 12.5);
    assert.equal(body.speed, 3.2);
    assert.equal(body.heading, 180.0);
    assert.equal(body.battery_level, 88);
    assert.equal(body.is_mock, false);
    assert.equal(body.recorded_at, '2026-09-28T09:00:00.000Z');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('api.sendLocationPing - maps legacy alias keys and floors negative accuracy/speed at zero', async () => {
  const originalFetch = globalThis.fetch;
  let capturedOptions = null;

  globalThis.fetch = async (url, options) => {
    capturedOptions = options;
    return {
      ok: true,
      status: 200,
      json: async () => ({ status: 'recorded', ping_id: 102 })
    };
  };

  try {
    // Pass legacy alias keys and negative accuracy/speed
    await api.sendLocationPing(42, {
      latitude: 19.055,
      longitude: 72.835,
      accuracy_meters: -15.0,
      speed_mps: -2.5,
      heading_degrees: 270.0
    });

    const body = JSON.parse(capturedOptions.body);
    // Negative accuracy and speed must be floored at 0
    assert.equal(body.accuracy, 0.0);
    assert.equal(body.speed, 0.0);
    assert.equal(body.heading, 270.0);
    assert.equal(body.is_mock, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// --- 3. Production React Context: GpsTrackingContext Lifecycle ---

test('GpsTrackingContext - renders and initializes with NOT_TRACKING state', () => {
  let contextValue = null;
  function TestConsumer() {
    contextValue = useGpsTracking();
    return React.createElement('div', { id: 'status' }, contextValue.trackingStatus);
  }

  const html = renderToStaticMarkup(
    React.createElement(GpsTrackingProvider, null, React.createElement(TestConsumer))
  );

  assert.equal(html.includes('NOT_TRACKING'), true);
  assert.notEqual(contextValue, null);
  assert.equal(contextValue.trackingStatus, GPS_TRACKING_STATES.NOT_TRACKING);
  assert.equal(typeof contextValue.setTrackingStatus, 'function');
  assert.equal(typeof contextValue.resetTracking, 'function');
});

test('GPS Tracking States - all 7 standard states are defined and distinct', () => {
  const expectedStates = [
    'NOT_TRACKING',
    'STARTING',
    'LIVE',
    'STALE',
    'LOCATION_DENIED',
    'GPS_UNAVAILABLE',
    'OFFLINE'
  ];

  for (const s of expectedStates) {
    assert.equal(GPS_TRACKING_STATES[s], s);
  }
});

// --- 4. Permission & Auto-Resume Detection Logic ---

test('BrowserLocationProvider - checkPermissionStatus queries navigator.permissions', async () => {
  mockPermissions({
    query: async ({ name }) => {
      assert.equal(name, 'geolocation');
      return { state: 'granted' };
    }
  });

  const provider = new BrowserLocationProvider();
  const status = await provider.checkPermissionStatus();
  assert.equal(status, 'granted');

  // Test denied
  mockPermissions({
    query: async () => ({ state: 'denied' })
  });
  const statusDenied = await provider.checkPermissionStatus();
  assert.equal(statusDenied, 'denied');
});

// --- 5. Mock Telemetry Isolation & Real GPS Integrity ---

test('Telemetry Provenance - BrowserLocationProvider marks isMock:false, Simulator marks isMock:true', () => {
  const browserProvider = new BrowserLocationProvider();
  mockGeolocation({
    getCurrentPosition: (success) => {
      success({
        coords: { latitude: 19.055, longitude: 72.835, accuracy: 10, speed: 0, heading: 0 },
        timestamp: Date.now()
      });
    }
  });

  browserProvider.getCurrentPosition().then((pos) => {
    assert.equal(pos.isMock, false, 'Operational browser location MUST NOT be marked mock');
  });

  const simProvider = new SimulatorLocationProvider(19.05, 72.83);
  const simPos = simProvider.stepTowards(19.06, 72.84);
  assert.equal(simPos.isMock, true, 'Simulator telemetry MUST be explicitly marked mock');
});

// --- 6. Haversine Distance Calculation ---

test('calculateDistanceMeters - returns accurate distance between two coordinates', () => {
  // Mumbai Bandra (19.0596, 72.8295) to Mumbai Khar (19.0688, 72.8340) ~ 1.12 km
  const dist = calculateDistanceMeters(19.0596, 72.8295, 19.0688, 72.8340);
  assert.equal(dist > 1000 && dist < 1200, true);

  // Same coordinates -> 0 meters
  assert.equal(calculateDistanceMeters(19.0596, 72.8295, 19.0596, 72.8295), 0);
});
