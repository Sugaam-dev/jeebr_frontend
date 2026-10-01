/**
 * MapContainer — Unified map provider router.
 *
 * Supports three rendering engines:
 *   google  — Google Maps JavaScript API (requires VITE_GOOGLE_MAPS_API_KEY)
 *   open    — MapLibre GL JS + OpenFreeMap (OSM-derived, no API key needed)
 *   svg     — Resilient SVG canvas fallback (no external dependencies)
 *
 * Default provider is determined by VITE_MAP_PROVIDER env var.
 * User may override with the in-UI selector.
 *
 * Phase 7A: This file replaces the original MapContainer while preserving
 * 100% backwards compatibility with all existing call sites.
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { loadGoogleMaps, getMapProviderStatus, MapProviderStatus } from '../../services/mapService';
import { GoogleMapProvider } from './GoogleMapProvider';
import { FallbackSvgMapProvider } from './FallbackSvgMapProvider';
import { Layers, AlertCircle, CheckCircle, Globe, Map } from 'lucide-react';

// ─── Configuration ────────────────────────────────────────────────────────────

/** Read configured default provider from env; fall back to 'google'. */
const ENV_MAP_PROVIDER =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MAP_PROVIDER) || 'google';

// Lazy-load MapLibre provider to keep initial bundle lean
const OpenMapProvider = lazy(() => import('./OpenMapProvider'));

// ─── MapContainer ─────────────────────────────────────────────────────────────

/**
 * @param {string}   [defaultProvider]  Force-override the env-configured provider.
 *                                      Pass 'google'|'open'|'svg'|'auto'.
 * @param {boolean}  [showProviderSelector=true]  Show/hide the provider toggle UI.
 * @param {object}   [layerVisibility]  Per-layer visibility flags forwarded to OpenMapProvider.
 * All other props are forwarded to the active map provider.
 */
export const MapContainer = ({
  defaultProvider,
  showProviderSelector = true,
  layerVisibility,
  ...props
}) => {
  const [googleStatus, setGoogleStatus] = useState(getMapProviderStatus());

  // activeProvider: 'auto' | 'google' | 'open' | 'svg'
  // 'auto' means: use the env-configured provider, fall back gracefully.
  const [activeProvider, setActiveProvider] = useState(defaultProvider || 'auto');

  // Load Google Maps SDK (needed only when google is possible)
  useEffect(() => {
    let isMounted = true;
    loadGoogleMaps().then((maps) => {
      if (!isMounted) return;
      setGoogleStatus(maps ? MapProviderStatus.READY : MapProviderStatus.FAILED);
    });
    return () => { isMounted = false; };
  }, []);

  // Resolve which provider actually renders
  const isGoogleReady = googleStatus === MapProviderStatus.READY;

  function resolveProvider() {
    // If caller explicitly selected a provider (not 'auto'), honour it
    if (activeProvider === 'google') return isGoogleReady ? 'google' : 'svg';
    if (activeProvider === 'open') return 'open';
    if (activeProvider === 'svg') return 'svg';

    // 'auto' mode: prefer env config, fall back
    if (ENV_MAP_PROVIDER === 'open') return 'open';
    if (ENV_MAP_PROVIDER === 'google') return isGoogleReady ? 'google' : 'svg';
    // Unknown env value → try google, fall back to svg
    return isGoogleReady ? 'google' : 'svg';
  }

  const effectiveProvider = resolveProvider();

  if (!showProviderSelector) {
    return renderProvider(effectiveProvider, props, layerVisibility);
  }

  return (
    <div className="relative w-full space-y-2">
      {/* Provider Selector Bar */}
      <div className="flex items-center justify-between text-xs pb-1">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-bold text-gray-700 text-[11px] uppercase tracking-wider">
            Map Engine:
          </span>
          <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[10px]">
            <button
              onClick={() => setActiveProvider('auto')}
              className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                activeProvider === 'auto'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Use env-configured provider (VITE_MAP_PROVIDER)"
            >
              Auto
            </button>
            <button
              onClick={() => setActiveProvider('google')}
              disabled={!isGoogleReady}
              className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                activeProvider === 'google'
                  ? 'bg-white text-sky-600 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title={!isGoogleReady ? 'Google Maps API unavailable or key unconfigured' : 'Google Maps'}
            >
              Google Maps
            </button>
            <button
              onClick={() => setActiveProvider('open')}
              className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                activeProvider === 'open'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="MapLibre GL + OpenFreeMap (OSM)"
            >
              Open Map
            </button>
            <button
              onClick={() => setActiveProvider('svg')}
              className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                activeProvider === 'svg'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="SVG Canvas Fallback"
            >
              SVG Canvas
            </button>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-1.5 text-[10.5px]">
          {effectiveProvider === 'google' && (
            <span className="inline-flex items-center gap-1 text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
              <CheckCircle className="w-3 h-3 text-sky-500" />
              <span>Google Maps</span>
            </span>
          )}
          {effectiveProvider === 'open' && (
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Globe className="w-3 h-3 text-emerald-500" />
              <span>OpenFreeMap · MapLibre</span>
            </span>
          )}
          {effectiveProvider === 'svg' && (
            <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <Map className="w-3 h-3 text-amber-500" />
              <span>SVG Fallback</span>
            </span>
          )}
        </div>
      </div>

      {/* Active Map Provider */}
      {renderProvider(effectiveProvider, props, layerVisibility)}
    </div>
  );
};

function renderProvider(provider, props, layerVisibility) {
  if (provider === 'google') {
    return <GoogleMapProvider {...props} layerVisibility={layerVisibility} networkLayers={props.networkLayers} />;
  }
  if (provider === 'open') {
    return (
      <Suspense fallback={
        <div
          className="w-full rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center"
          style={{ height: props.height || '460px' }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-emerald-400 text-xs">Loading MapLibre…</span>
          </div>
        </div>
      }>
        <OpenMapProvider {...props} layerVisibility={layerVisibility} networkLayers={props.networkLayers} />
      </Suspense>
    );
  }
  // 'svg' fallback
  return <FallbackSvgMapProvider {...props} layerVisibility={layerVisibility} networkLayers={props.networkLayers} />;
}

export default MapContainer;
