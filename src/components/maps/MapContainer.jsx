import React, { useState, useEffect } from 'react';
import { loadGoogleMaps, getMapProviderStatus, MapProviderStatus } from '../../services/mapService';
import { GoogleMapProvider } from './GoogleMapProvider';
import { FallbackSvgMapProvider } from './FallbackSvgMapProvider';
import { Layers, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export const MapContainer = (props) => {
  const [providerStatus, setProviderStatus] = useState(getMapProviderStatus());
  const [activeRenderer, setActiveRenderer] = useState('auto'); // 'auto' | 'google' | 'svg'
  const [routingFailed, setRoutingFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    loadGoogleMaps().then((maps) => {
      if (!isMounted) return;
      if (maps) {
        setProviderStatus(MapProviderStatus.READY);
      } else {
        setProviderStatus(MapProviderStatus.FAILED);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Determine effective provider
  const isGoogleAvailable = providerStatus === MapProviderStatus.READY;
  const useEffectiveGoogle = (activeRenderer === 'google' || (activeRenderer === 'auto' && isGoogleAvailable));

  return (
    <div className="relative w-full space-y-2">
      {/* Provider Selector & Telemetry Status Bar */}
      <div className="flex items-center justify-between text-xs pb-1">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-bold text-gray-700 text-[11px] uppercase tracking-wider">
            GIS Renderer:
          </span>
          <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[10px]">
            <button
              onClick={() => setActiveRenderer('auto')}
              className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                activeRenderer === 'auto'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Auto {isGoogleAvailable ? '(Google)' : '(SVG Fallback)'}
            </button>
            <button
              onClick={() => setActiveRenderer('google')}
              disabled={!isGoogleAvailable}
              className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                activeRenderer === 'google'
                  ? 'bg-white text-sky-600 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title={!isGoogleAvailable ? 'Google Maps API unavailable or key unconfigured' : 'Force Google Maps'}
            >
              Google Maps
            </button>
            <button
              onClick={() => setActiveRenderer('svg')}
              className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                activeRenderer === 'svg'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              SVG Canvas
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10.5px]">
          {useEffectiveGoogle ? (
            <span className="inline-flex items-center gap-1 text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
              <CheckCircle className="w-3 h-3 text-sky-500" />
              <span>Google Maps Engine Active</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Resilient SVG Fallback Active</span>
            </span>
          )}
        </div>
      </div>

      {/* Render Selected Map Provider with Seamless Fallback */}
      {useEffectiveGoogle ? (
        <GoogleMapProvider
          {...props}
          onRoutingFailed={() => setRoutingFailed(true)}
        />
      ) : (
        <FallbackSvgMapProvider
          {...props}
        />
      )}
    </div>
  );
};
