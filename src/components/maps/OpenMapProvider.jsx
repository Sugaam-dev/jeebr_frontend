/**
 * OpenMapProvider — MapLibre GL JS + OpenFreeMap (OSM-derived) vector tiles.
 *
 * Props mirror GoogleMapProvider so MapContainer can swap them transparently.
 * Attribution: © OpenFreeMap contributors, © OpenStreetMap contributors
 *
 * IMPORTANT: This file must NOT be imported in environments where maplibre-gl
 * is unavailable. The MapContainer wraps it in a dynamic import guarded by
 * the VITE_MAP_PROVIDER config value.
 *
 * Phase 7A: OLT/ONT/ONU hardware integration is NOT implemented here.
 * Placeholder layer hooks are present for future Phase integration.
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

// Configure bundled MapLibre worker for Vite / Vercel production deployment
if (typeof maplibregl.setWorkerUrl === 'function') {
  maplibregl.setWorkerUrl(maplibreWorkerUrl);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MARKET_CENTERS = {
  mumbai: { lat: 19.076, lng: 72.8777, zoom: 12 },
  kolkata: { lat: 22.5726, lng: 88.3639, zoom: 12 },
};

// Configurable style URL — falls back to OpenFreeMap Liberty style, strips any accidental trailing dots/spaces
const getSanitizedStyleUrl = () => {
  const envUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_OPEN_MAP_STYLE_URL : null;
  if (!envUrl || typeof envUrl !== 'string') {
    return 'https://tiles.openfreemap.org/styles/liberty';
  }
  const cleaned = envUrl.trim().replace(/\.+$/, '');
  return cleaned || 'https://tiles.openfreemap.org/styles/liberty';
};

const STYLE_URL = getSanitizedStyleUrl();

// Status → marker colour mapping (mirrors GoogleMapProvider colours)
const STATUS_COLORS = {
  Available:    '#94A3B8',
  AVAILABLE:    '#94A3B8',
  EN_ROUTE:     '#38BDF8',
  ASSIGNED:     '#818CF8',
  ARRIVED:      '#34D399',
  WORKING:      '#10B981',
  ON_SITE:      '#10B981',
  OTP_REQUESTED:'#F59E0B',
  OTP_VERIFIED: '#22C55E',
  COMPLETED:    '#6B7280',
  Offline:      '#475569',
  OFFLINE:      '#475569',
};

function engineerStatusColor(status) {
  return STATUS_COLORS[status] || '#94A3B8';
}

// ─── GPS Freshness ────────────────────────────────────────────────────────────
const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

function getGpsFreshness(lastPingAt) {
  if (!lastPingAt) return 'OFFLINE';
  const age = Date.now() - new Date(lastPingAt).getTime();
  if (age < STALE_THRESHOLD_MS) return 'LIVE';
  if (age < 15 * 60 * 1000) return 'STALE';
  return 'OFFLINE';
}

// ─── Marker HTML builder ──────────────────────────────────────────────────────

function buildEngineerMarkerEl(eng, isSelected) {
  const color = engineerStatusColor(eng.status);
  const freshness = getGpsFreshness(eng.last_ping_at);
  const freshnessColor = freshness === 'LIVE' ? '#22C55E' : freshness === 'STALE' ? '#F59E0B' : '#6B7280';
  const size = isSelected ? 38 : 30;

  const el = document.createElement('div');
  el.style.cssText = `
    width:${size}px; height:${size}px; border-radius:50%;
    background:${color}; border:${isSelected ? '3px' : '2px'} solid #fff;
    box-shadow:0 2px 8px rgba(0,0,0,0.45);
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; position:relative; transition:all 0.15s ease;
    flex-direction:column;
  `;
  el.setAttribute('data-engineer-id', eng.id);

  // Engineer initials
  const initials = document.createElement('span');
  initials.style.cssText = 'color:#fff; font-size:10px; font-weight:700; font-family:monospace; line-height:1;';
  initials.textContent = (eng.name || 'ENG').slice(0, 2).toUpperCase();
  el.appendChild(initials);

  // GPS freshness dot
  const dot = document.createElement('span');
  dot.style.cssText = `
    position:absolute; bottom:-3px; right:-3px;
    width:9px; height:9px; border-radius:50%;
    background:${freshnessColor}; border:1.5px solid #fff;
  `;
  el.appendChild(dot);

  // Speed badge (if en route)
  if (eng.speed_kmh && eng.speed_kmh > 0.5) {
    const badge = document.createElement('div');
    badge.style.cssText = `
      position:absolute; top:-18px; left:50%; transform:translateX(-50%);
      background:rgba(15,23,42,0.9); color:#38BDF8;
      font-size:9px; font-weight:700; font-family:monospace;
      padding:1px 5px; border-radius:4px; border:1px solid #334155;
      white-space:nowrap;
    `;
    badge.textContent = `${Math.round(eng.speed_kmh)} km/h`;
    el.appendChild(badge);
  }

  return el;
}

function buildCustomerMarkerEl(job) {
  const isActive = ['EN_ROUTE', 'ARRIVED', 'WORKING', 'OTP_REQUESTED', 'ASSIGNED'].includes(job.status);
  const isCompleted = job.status === 'COMPLETED';
  const color = isCompleted ? '#6B7280' : isActive ? '#EF4444' : '#F59E0B';

  const el = document.createElement('div');
  el.style.cssText = `
    width:26px; height:26px; border-radius:50%;
    background:${color}; border:2px solid #fff;
    box-shadow:0 2px 6px rgba(0,0,0,0.4);
    display:flex; align-items:center; justify-content:center;
    cursor:pointer;
  `;

  const pin = document.createElement('span');
  pin.style.cssText = 'color:#fff; font-size:12px;';
  pin.textContent = '📍';
  el.appendChild(pin);

  return el;
}

// ─── Network Infrastructure Marker Builders (Phase 7B) ────────────────────────

function buildOltMarkerEl(olt, isSelected) {
  const isHealthy = (olt.status || '').toUpperCase() === 'HEALTHY';
  const color = isHealthy ? '#7C3AED' : '#DC2626';

  const el = document.createElement('div');
  el.style.cssText = `
    position:relative; width:34px; height:34px; border-radius:10px;
    background:${color}; border:2.5px solid #fff;
    box-shadow:0 3px 10px rgba(0,0,0,0.5);
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; transition:transform 0.15s;
    ${isSelected ? 'transform:scale(1.2); outline:3px solid #C4B5FD;' : ''}
  `;

  const icon = document.createElement('span');
  icon.style.cssText = 'color:#fff; font-size:16px;';
  icon.textContent = '🗼';
  el.appendChild(icon);

  const label = document.createElement('div');
  label.style.cssText = `
    position:absolute; bottom:-16px; left:50%; transform:translateX(-50%);
    background:rgba(15,23,42,0.92); color:#DDD6FE;
    font-size:9px; font-weight:800; font-family:sans-serif;
    padding:1px 4px; border-radius:3px; border:1px solid #7C3AED;
    white-space:nowrap; pointer-events:none;
  `;
  label.textContent = olt.code || olt.device_code || 'OLT';
  el.appendChild(label);

  return el;
}

function buildCabinetMarkerEl(cab, isSelected) {
  const isHealthy = (cab.status || '').toUpperCase() === 'HEALTHY';
  const color = isHealthy ? '#D97706' : '#EA580C';

  const el = document.createElement('div');
  el.style.cssText = `
    position:relative; width:28px; height:28px; border-radius:6px;
    background:${color}; border:2px solid #fff;
    box-shadow:0 2px 8px rgba(0,0,0,0.4);
    display:flex; align-items:center; justify-content:center;
    cursor:pointer;
    ${isSelected ? 'transform:scale(1.2); outline:2px solid #FDE68A;' : ''}
  `;

  const icon = document.createElement('span');
  icon.style.cssText = 'color:#fff; font-size:13px;';
  icon.textContent = '🗄️';
  el.appendChild(icon);

  const label = document.createElement('div');
  label.style.cssText = `
    position:absolute; bottom:-14px; left:50%; transform:translateX(-50%);
    background:rgba(15,23,42,0.92); color:#FDE68A;
    font-size:8.5px; font-weight:700;
    padding:0px 3px; border-radius:3px; border:1px solid #D97706;
    white-space:nowrap; pointer-events:none;
  `;
  label.textContent = cab.code || cab.device_code || 'CAB';
  el.appendChild(label);

  return el;
}

function buildSplitterMarkerEl(spl) {
  const el = document.createElement('div');
  el.style.cssText = `
    width:14px; height:14px; border-radius:50%;
    background:#0891B2; border:2px solid #fff;
    box-shadow:0 2px 4px rgba(0,0,0,0.4);
    cursor:pointer;
  `;
  el.title = `${spl.code || spl.name} (Splitter 1:8)`;
  return el;
}

function buildOntMarkerEl(ont) {
  const isHealthy = (ont.status || '').toUpperCase() === 'HEALTHY';
  const color = isHealthy ? '#10B981' : '#F43F5E';
  const el = document.createElement('div');
  el.style.cssText = `
    width:12px; height:12px; border-radius:50%;
    background:${color}; border:1.5px solid #fff;
    box-shadow:0 1px 3px rgba(0,0,0,0.3);
    cursor:pointer;
  `;
  el.title = `${ont.code || ont.name} (${ont.type || 'ONT'})`;
  return el;
}


// ─── Route drawing helpers ────────────────────────────────────────────────────

function drawRoute(map, sourceId, layerId, waypoints, color = '#38BDF8', dashed = false) {
  if (!waypoints || waypoints.length < 2) return;

  const geojson = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: waypoints.map(wp => [wp.lng ?? wp[1], wp.lat ?? wp[0]]),
    },
  };

  if (map.getSource(sourceId)) {
    map.getSource(sourceId).setData(geojson);
  } else {
    map.addSource(sourceId, { type: 'geojson', data: geojson });
    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': color,
        'line-width': 3.5,
        'line-opacity': 0.88,
        ...(dashed ? { 'line-dasharray': [2, 1.5] } : {}),
      },
    });
  }
}

function removeLayerAndSource(map, layerId, sourceId) {
  if (map.getLayer(layerId)) map.removeLayer(layerId);
  if (map.getSource(sourceId)) map.removeSource(sourceId);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const OpenMapProvider = ({
  engineers = [],
  jobs = [],
  selectedEngineer = null,
  selectedJob = null,
  onSelectEngineer = null,
  onSelectJob = null,
  currentMarket = 'mumbai',
  isCustomerView = false,
  customerLocality = null,
  engineerLat = null,
  engineerLng = null,
  customerLat = null,
  customerLng = null,
  jobStatus = null,
  engineerName = null,
  height = '460px',
  layerVisibility = {
    engineers: true,
    customers: true,
    faults: true,
    network: false,
    route: true,
  },
  routeWaypoints = null,
  networkLayers = null,
  selectedDevice = null,
  onSelectDevice = null,
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({}); // engineerId → maplibre Marker
  const customerMarkersRef = useRef({}); // jobId → maplibre Marker
  const networkMarkersRef = useRef({}); // deviceKey → maplibre Marker
  const popupRef = useRef(null);
  const [mapError, setMapError] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  // ── Initialize Map ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const center = MARKET_CENTERS[currentMarket] || MARKET_CENTERS.mumbai;

    let map;
    try {
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: STYLE_URL,
        center: [center.lng, center.lat],
        zoom: center.zoom,
        attributionControl: true,
      });
      mapRef.current = map;
    } catch (err) {
      setMapError(`MapLibre initialization failed: ${err.message}`);
      return;
    }

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      setMapReady(true);
    });

    let hasFallbackAttempted = false;
    map.on('error', (e) => {
      const errMsg = e.error?.message || (typeof e.message === 'string' ? e.message : '');
      console.warn('[OpenMapProvider] MapLibre error:', errMsg || e);
      if (!hasFallbackAttempted && (errMsg.includes('404') || errMsg.includes('Failed to fetch') || errMsg.includes('AJAXError'))) {
        hasFallbackAttempted = true;
        console.warn('[OpenMapProvider] Primary style failed; attempting fallback to demo tiles style...');
        try {
          map.setStyle('https://demotiles.maplibre.org/style.json');
        } catch {
          // Keep running
        }
      }
    });

    return () => {
      // Clean up markers
      Object.values(markersRef.current).forEach(m => m.remove());
      markersRef.current = {};
      Object.values(customerMarkersRef.current).forEach(m => m.remove());
      customerMarkersRef.current = {};
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [currentMarket]);

  // ── Customer Tracking View ──────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !isCustomerView) return;

    // Clean existing markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    const bounds = new maplibregl.LngLatBounds();
    let hasPoints = false;

    if (customerLat && customerLng) {
      const custEl = document.createElement('div');
      custEl.style.cssText = 'width:24px;height:24px;border-radius:50%;background:#EF4444;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);';
      const m = new maplibregl.Marker({ element: custEl })
        .setLngLat([customerLng, customerLat])
        .addTo(map);
      markersRef.current['customer'] = m;
      bounds.extend([customerLng, customerLat]);
      hasPoints = true;
    }

    if (engineerLat && engineerLng) {
      const engEl = document.createElement('div');
      engEl.style.cssText = 'width:24px;height:24px;border-radius:50%;background:#38BDF8;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;';
      engEl.innerHTML = '<span style="color:#fff;font-size:11px;">→</span>';
      const m = new maplibregl.Marker({ element: engEl })
        .setLngLat([engineerLng, engineerLat])
        .addTo(map);
      markersRef.current['engineer'] = m;
      bounds.extend([engineerLng, engineerLat]);
      hasPoints = true;

      // Draw straight-line route (customer view — no routing API call here)
      if (customerLat && customerLng) {
        drawRoute(map, 'customer-route-source', 'customer-route-layer',
          [{ lat: engineerLat, lng: engineerLng }, { lat: customerLat, lng: customerLng }],
          '#38BDF8', true
        );
      }
    }

    if (hasPoints && !bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 80, maxZoom: 15 });
    }
  }, [mapReady, isCustomerView, engineerLat, engineerLng, customerLat, customerLng]);

  // ── NOC Fleet View: Sync Engineer Markers ──────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || isCustomerView) return;
    if (!layerVisibility.engineers) {
      Object.values(markersRef.current).forEach(m => m.getElement().style.display = 'none');
      return;
    }

    const seenIds = new Set();

    engineers.forEach(eng => {
      if (!eng.current_latitude || !eng.current_longitude) return;
      seenIds.add(String(eng.id));

      const isSelected = selectedEngineer?.id === eng.id;
      const existing = markersRef.current[eng.id];
      if (existing) {
        existing.remove();
      }

      const el = buildEngineerMarkerEl(eng, isSelected);
      el.addEventListener('click', () => {
        if (onSelectEngineer) onSelectEngineer(eng);
      });
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([eng.current_longitude, eng.current_latitude])
        .addTo(map);
      markersRef.current[eng.id] = marker;
    });

    // Remove stale engineer markers
    Object.keys(markersRef.current).forEach(id => {
      if (id !== 'customer' && id !== 'engineer' && !seenIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });
  }, [mapReady, isCustomerView, engineers, selectedEngineer, layerVisibility.engineers]);

  // ── NOC Fleet View: Sync Customer/Job Markers ──────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || isCustomerView) return;
    if (!layerVisibility.customers) {
      Object.values(customerMarkersRef.current).forEach(m => m.getElement().style.display = 'none');
      return;
    }

    const seenJobIds = new Set();

    jobs.forEach(job => {
      const cLat = job.service_latitude || job.customer_latitude;
      const cLng = job.service_longitude || job.customer_longitude;
      if (!cLat || !cLng) return;
      seenJobIds.add(String(job.id));

      if (customerMarkersRef.current[job.id]) {
        customerMarkersRef.current[job.id].setLngLat([cLng, cLat]);
        customerMarkersRef.current[job.id].getElement().style.display = 'block';
      } else {
        const el = buildCustomerMarkerEl(job);
        el.addEventListener('click', () => {
          if (onSelectJob) onSelectJob(job);
        });
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([cLng, cLat])
          .addTo(map);
        customerMarkersRef.current[job.id] = marker;
      }
    });

    // Remove stale job markers
    Object.keys(customerMarkersRef.current).forEach(id => {
      if (!seenJobIds.has(id)) {
        customerMarkersRef.current[id].remove();
        delete customerMarkersRef.current[id];
      }
    });
  }, [mapReady, isCustomerView, jobs, layerVisibility.customers]);

  // ── Route Layer (from pre-computed waypoints or jobs) ─────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || isCustomerView) return;

    // Remove previous route layers
    removeLayerAndSource(map, 'noc-route-layer', 'noc-route-source');

    if (!layerVisibility.route) return;

    // Use provided waypoints first (from routingService)
    if (routeWaypoints && routeWaypoints.length >= 2) {
      drawRoute(map, 'noc-route-source', 'noc-route-layer', routeWaypoints, '#38BDF8');
      return;
    }

    // Fallback: draw straight lines from jobs that have both engineer and customer coords
    const activeJobs = jobs.filter(j => {
      const eLat = j.engineer_latitude || j.current_latitude;
      const eLng = j.engineer_longitude || j.current_longitude;
      const cLat = j.service_latitude || j.customer_latitude;
      const cLng = j.service_longitude || j.customer_longitude;
      return eLat && eLng && cLat && cLng &&
             ['EN_ROUTE', 'ARRIVED', 'WORKING', 'OTP_REQUESTED'].includes(j.status);
    });

    if (!activeJobs.length) return;

    // Draw as a MultiLineString
    const geojson = {
      type: 'FeatureCollection',
      features: activeJobs.map(j => ({
        type: 'Feature',
        properties: { jobId: j.id, status: j.status },
        geometry: {
          type: 'LineString',
          coordinates: [
            [j.engineer_longitude || j.current_longitude, j.engineer_latitude || j.current_latitude],
            [j.service_longitude || j.customer_longitude, j.service_latitude || j.customer_latitude],
          ],
        },
      })),
    };

    if (map.getSource('noc-route-source')) {
      map.getSource('noc-route-source').setData(geojson);
    } else {
      map.addSource('noc-route-source', { type: 'geojson', data: geojson });
      map.addLayer({
        id: 'noc-route-layer',
        type: 'line',
        source: 'noc-route-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['match', ['get', 'status'],
            'EN_ROUTE', '#38BDF8',
            'ARRIVED', '#34D399',
            'WORKING', '#10B981',
            '#94A3B8'
          ],
          'line-width': 2.5,
          'line-opacity': 0.75,
          'line-dasharray': [2, 1.5],
        },
      });
    }
  }, [mapReady, isCustomerView, jobs, routeWaypoints, layerVisibility.route]);

  // ── NOC Fleet View: Sync Network Infrastructure Markers & Links (Phase 7B) ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || isCustomerView) return;

    // Remove logical network link layer
    removeLayerAndSource(map, 'noc-network-links-layer', 'noc-network-links-source');

    if (!layerVisibility.network || !networkLayers) {
      Object.values(networkMarkersRef.current).forEach(m => m.getElement().style.display = 'none');
      return;
    }

    const seenDeviceKeys = new Set();

    // 1. OLT Markers
    (networkLayers.olts || []).forEach(olt => {
      if (!olt.lat || !olt.lng) return;
      const key = `olt-${olt.id}`;
      seenDeviceKeys.add(key);

      const isSelected = selectedDevice?.id === olt.id && selectedDevice?.type === 'OLT';
      if (networkMarkersRef.current[key]) {
        networkMarkersRef.current[key].setLngLat([olt.lng, olt.lat]);
        networkMarkersRef.current[key].getElement().style.display = 'block';
      } else {
        const el = buildOltMarkerEl(olt, isSelected);
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (onSelectDevice) onSelectDevice(olt);
        });
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([olt.lng, olt.lat])
          .addTo(map);
        networkMarkersRef.current[key] = marker;
      }
    });

    // 2. Fiber Cabinet Markers
    (networkLayers.fiber_cabinets || []).forEach(cab => {
      if (!cab.lat || !cab.lng) return;
      const key = `cab-${cab.id}`;
      seenDeviceKeys.add(key);

      const isSelected = selectedDevice?.id === cab.id && selectedDevice?.type === 'FIBER_CABINET';
      if (networkMarkersRef.current[key]) {
        networkMarkersRef.current[key].setLngLat([cab.lng, cab.lat]);
        networkMarkersRef.current[key].getElement().style.display = 'block';
      } else {
        const el = buildCabinetMarkerEl(cab, isSelected);
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (onSelectDevice) onSelectDevice(cab);
        });
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([cab.lng, cab.lat])
          .addTo(map);
        networkMarkersRef.current[key] = marker;
      }
    });

    // 3. Splitter Markers
    (networkLayers.splitters || []).forEach(spl => {
      if (!spl.lat || !spl.lng) return;
      const key = `spl-${spl.id}`;
      seenDeviceKeys.add(key);

      if (networkMarkersRef.current[key]) {
        networkMarkersRef.current[key].setLngLat([spl.lng, spl.lat]);
        networkMarkersRef.current[key].getElement().style.display = 'block';
      } else {
        const el = buildSplitterMarkerEl(spl);
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (onSelectDevice) onSelectDevice(spl);
        });
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([spl.lng, spl.lat])
          .addTo(map);
        networkMarkersRef.current[key] = marker;
      }
    });

    // 4. ONT / ONU Markers
    (networkLayers.onts || []).forEach(ont => {
      if (!ont.lat || !ont.lng) return;
      const key = `ont-${ont.id}`;
      seenDeviceKeys.add(key);

      if (networkMarkersRef.current[key]) {
        networkMarkersRef.current[key].setLngLat([ont.lng, ont.lat]);
        networkMarkersRef.current[key].getElement().style.display = 'block';
      } else {
        const el = buildOntMarkerEl(ont);
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (onSelectDevice) onSelectDevice(ont);
        });
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([ont.lng, ont.lat])
          .addTo(map);
        networkMarkersRef.current[key] = marker;
      }
    });

    // Clean up stale network markers
    Object.keys(networkMarkersRef.current).forEach(key => {
      if (!seenDeviceKeys.has(key)) {
        networkMarkersRef.current[key].remove();
        delete networkMarkersRef.current[key];
      }
    });

    // 5. Draw Logical Network Links (Feeder, Distribution, Drop)
    const links = networkLayers.links || [];
    if (links.length > 0) {
      const geojson = {
        type: 'FeatureCollection',
        features: links.map(l => ({
          type: 'Feature',
          properties: {
            linkType: l.link_type,
            status: l.status,
            label: 'Logical Network Path',
          },
          geometry: {
            type: 'LineString',
            coordinates: l.coordinates,
          },
        })),
      };

      if (map.getSource('noc-network-links-source')) {
        map.getSource('noc-network-links-source').setData(geojson);
      } else {
        map.addSource('noc-network-links-source', { type: 'geojson', data: geojson });
        map.addLayer({
          id: 'noc-network-links-layer',
          type: 'line',
          source: 'noc-network-links-source',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#06B6D4',
            'line-width': 2.0,
            'line-opacity': 0.65,
            'line-dasharray': [3, 2],
          },
        });
      }
    }
  }, [mapReady, isCustomerView, networkLayers, layerVisibility.network, selectedDevice]);


  // ── Fit to selected engineer ───────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !selectedEngineer) return;
    if (selectedEngineer.current_latitude && selectedEngineer.current_longitude) {
      map.easeTo({
        center: [selectedEngineer.current_longitude, selectedEngineer.current_latitude],
        zoom: 15,
        duration: 800,
      });
    }
  }, [mapReady, selectedEngineer?.id]);

  // ── Error display ──────────────────────────────────────────────────────────
  if (mapError) {
    return (
      <div
        className="relative w-full rounded-xl overflow-hidden bg-slate-950 border border-red-900 flex flex-col items-center justify-center gap-3"
        style={{ height }}
      >
        <div className="text-red-400 font-bold text-sm">Open Map Provider Error</div>
        <div className="text-red-300 text-xs max-w-sm text-center">{mapError}</div>
        <div className="text-slate-500 text-xs">
          Check VITE_OPEN_MAP_STYLE_URL and network connectivity
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-700 shadow-inner" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Attribution / Provider Footer */}
      <div className="absolute bottom-8 left-3 z-10 bg-slate-900/90 backdrop-blur-xs border border-slate-700/80 rounded-xl px-3 py-1.5 text-[10px] text-slate-300 flex items-center gap-3 shadow-lg pointer-events-none">
        <span className="flex items-center gap-1.5 font-bold text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>OpenFreeMap · MapLibre GL JS</span>
        </span>
        <span className="text-slate-500">•</span>
        <span className="text-slate-400 font-mono">© OpenStreetMap contributors</span>
      </div>

      {/* Loading overlay */}
      {!mapReady && (
        <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-emerald-400 text-xs font-medium">Loading map tiles…</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenMapProvider;
