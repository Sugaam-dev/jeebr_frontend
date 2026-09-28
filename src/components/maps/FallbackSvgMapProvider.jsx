import React, { useState } from 'react';
import { ZoomIn, ZoomOut, MapPin, Navigation } from 'lucide-react';

const MARKET_BOUNDS = {
  mumbai: {
    minLat: 18.960,
    maxLat: 19.260,
    minLng: 72.800,
    maxLng: 73.010,
    name: 'Mumbai Metropolitan Region',
    landmarks: [
      { name: 'Borivali Hub', lat: 19.2307, lng: 72.8567 },
      { name: 'Andheri MIDC OLT', lat: 19.1136, lng: 72.8697 },
      { name: 'BKC Core NOC', lat: 19.0657, lng: 72.8690 },
      { name: 'Bandra West Central', lat: 19.0596, lng: 72.8295 },
      { name: 'Lower Parel Hub', lat: 18.9950, lng: 72.8300 },
      { name: 'Thane West Pop', lat: 19.2183, lng: 72.9781 }
    ]
  },
  kolkata: {
    minLat: 22.480,
    maxLat: 22.660,
    minLng: 88.300,
    maxLng: 88.490,
    name: 'Kolkata Metropolitan Area',
    landmarks: [
      { name: 'Dum Dum Airport Core', lat: 22.6450, lng: 88.4230 },
      { name: 'Salt Lake Sector V', lat: 22.5700, lng: 88.4330 },
      { name: 'Park Street Central', lat: 22.5510, lng: 88.3520 },
      { name: 'Howrah Station Hub', lat: 22.5850, lng: 88.3430 },
      { name: 'New Town Action Area', lat: 22.5850, lng: 88.4600 },
      { name: 'Alipore Command Hub', lat: 22.5320, lng: 88.3280 }
    ]
  }
};

function projectGeoToSvg(lat, lng, bounds, width = 860, height = 460, padding = 40) {
  const { minLat, maxLat, minLng, maxLng } = bounds;
  const clampedLat = Math.max(minLat, Math.min(maxLat, lat));
  const clampedLng = Math.max(minLng, Math.min(maxLng, lng));

  const xNorm = (clampedLng - minLng) / (maxLng - minLng || 0.001);
  const yNorm = (maxLat - clampedLat) / (maxLat - minLat || 0.001);

  return {
    x: Math.round(padding + xNorm * (width - 2 * padding)),
    y: Math.round(padding + yNorm * (height - 2 * padding))
  };
}

export const FallbackSvgMapProvider = ({
  engineers = [],
  jobs = [],
  selectedEngineer = null,
  onSelectEngineer = null,
  currentMarket = 'mumbai',
  isCustomerView = false,
  customerLocality = null,
  engineerLat = null,
  engineerLng = null,
  customerLat = null,
  customerLng = null,
  jobStatus = null,
  engineerName = null,
  height = '460px'
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const bounds = MARKET_BOUNDS[currentMarket] || MARKET_BOUNDS.mumbai;

  const svgWidth = 860;
  const svgHeight = 460;

  // Single job / customer view projection
  let custEngPt = null;
  let custDestPt = null;
  if (isCustomerView && engineerLat && engineerLng && customerLat && customerLng) {
    // Dynamic local bounding box for customer tracking
    const minLat = Math.min(engineerLat, customerLat) - 0.005;
    const maxLat = Math.max(engineerLat, customerLat) + 0.005;
    const minLng = Math.min(engineerLng, customerLng) - 0.005;
    const maxLng = Math.max(engineerLng, customerLng) + 0.005;
    const customBounds = { minLat, maxLat, minLng, maxLng };

    custEngPt = projectGeoToSvg(engineerLat, engineerLng, customBounds, svgWidth, svgHeight, 60);
    custDestPt = projectGeoToSvg(customerLat, customerLng, customBounds, svgWidth, svgHeight, 60);
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-gradient-to-br from-slate-950 via-[#0B1528] to-[#0A1020] border border-slate-800 shadow-inner select-none" style={{ height }}>
      {/* Zoom Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center bg-slate-900/90 backdrop-blur-xs rounded-lg p-0.5 border border-slate-700/80 shadow-md">
        <button
          onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
          className="p-1 text-slate-300 hover:text-white cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.1))}
          className="p-1 text-slate-300 hover:text-white cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoomLevel(1)}
          className="px-1.5 py-0.5 text-[10px] font-mono text-slate-300 hover:text-white cursor-pointer"
          title="Reset Zoom"
        >
          {Math.round(zoomLevel * 100)}%
        </button>
      </div>

      {/* SVG Canvas */}
      <svg
        className="w-full h-full cursor-grab active:cursor-grabbing"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.2s ease-out' }}
      >
        <defs>
          <pattern id="fallbackGrid" width="35" height="35" patternUnits="userSpaceOnUse">
            <path d="M 35 0 L 0 0 0 35" fill="none" stroke="#1E293B" strokeWidth="0.8" opacity="0.5" />
          </pattern>
          <radialGradient id="fallbackGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
        </defs>

        <rect width={svgWidth} height={svgHeight} fill="url(#fallbackGrid)" />
        <rect width={svgWidth} height={svgHeight} fill="url(#fallbackGlow)" />

        {!isCustomerView ? (
          <>
            {/* Highway / Trunk Corridors */}
            <g opacity="0.25" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4 4">
              {bounds.landmarks.map((lm, idx) => {
                if (idx === 0) return null;
                const prev = bounds.landmarks[idx - 1];
                const p1 = projectGeoToSvg(prev.lat, prev.lng, bounds);
                const p2 = projectGeoToSvg(lm.lat, lm.lng, bounds);
                return <line key={idx} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} />;
              })}
            </g>

            {/* Regional Landmarks */}
            {bounds.landmarks.map((lm) => {
              const pt = projectGeoToSvg(lm.lat, lm.lng, bounds);
              return (
                <g key={lm.name} transform={`translate(${pt.x}, ${pt.y})`}>
                  <circle r="4" fill="#334155" stroke="#64748B" strokeWidth="1" />
                  <text y="14" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace" opacity="0.8">
                    {lm.name}
                  </text>
                </g>
              );
            })}

            {/* Active Jobs Routes */}
            {jobs.map((job) => {
              const eLat = job.engineer_latitude || job.current_latitude;
              const eLng = job.engineer_longitude || job.current_longitude;
              const cLat = job.service_latitude || job.customer_latitude;
              const cLng = job.service_longitude || job.customer_longitude;
              if (!eLat || !eLng || !cLat || !cLng) return null;

              const ePt = projectGeoToSvg(eLat, eLng, bounds);
              const cPt = projectGeoToSvg(cLat, cLng, bounds);
              const isMoving = job.status === 'EN_ROUTE';

              return (
                <g key={`job-line-${job.id}`}>
                  <line
                    x1={ePt.x}
                    y1={ePt.y}
                    x2={cPt.x}
                    y2={cPt.y}
                    stroke={job.status === 'COMPLETED' ? '#10B981' : '#3B82F6'}
                    strokeWidth={isMoving ? 2.5 : 1.2}
                    strokeDasharray={isMoving ? '6 4' : 'none'}
                    opacity={0.8}
                  >
                    {isMoving && (
                      <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1.5s" repeatCount="indefinite" />
                    )}
                  </line>
                  <g transform={`translate(${cPt.x}, ${cPt.y})`}>
                    <circle r="4" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
                    <text x="7" y="3" fill="#FCA5A5" fontSize="8.5" fontWeight="bold">
                      {job.customer_locality || job.customer_name}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Field Engineers */}
            {engineers.map((eng) => {
              if (!eng.current_latitude || !eng.current_longitude) return null;
              const pt = projectGeoToSvg(eng.current_latitude, eng.current_longitude, bounds);
              const isSelected = selectedEngineer?.id === eng.id;
              const statusColor =
                eng.status === 'ON_SITE' ? '#10B981' : eng.status === 'EN_ROUTE' ? '#3B82F6' : '#94A3B8';

              return (
                <g
                  key={`eng-${eng.id}`}
                  transform={`translate(${pt.x}, ${pt.y})`}
                  className="cursor-pointer"
                  onClick={() => onSelectEngineer && onSelectEngineer(eng)}
                >
                  {(eng.status === 'EN_ROUTE' || eng.status === 'ON_SITE') && (
                    <circle r="14" fill={statusColor} opacity="0.25">
                      <animate attributeName="r" values="8;20;8" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.35;0.05;0.35" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle
                    r={isSelected ? 9 : 7}
                    fill={statusColor}
                    stroke="#FFFFFF"
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                  <rect x="-35" y="-24" width="70" height="14" rx="3" fill="#0F172A" stroke="#334155" strokeWidth="0.8" opacity="0.9" />
                  <text x="0" y="-14" textAnchor="middle" fill="#E2E8F0" fontSize="8" fontWeight="600">
                    {eng.name?.split(' ')[0]} ({eng.speed_kmh ? `${Math.round(eng.speed_kmh)} km/h` : 'Active'})
                  </text>
                </g>
              );
            })}
          </>
        ) : (
          /* Customer Tracking View */
          custEngPt && custDestPt && (
            <g>
              {/* Route line */}
              <line
                x1={custEngPt.x}
                y1={custEngPt.y}
                x2={custDestPt.x}
                y2={custDestPt.y}
                stroke="url(#routeGrad)"
                strokeWidth="3.5"
                strokeDasharray="6 4"
                strokeLinecap="round"
                opacity="0.85"
              >
                <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1.2s" repeatCount="indefinite" />
              </line>

              {/* Customer Destination Marker */}
              <g transform={`translate(${custDestPt.x}, ${custDestPt.y})`}>
                <circle r="14" fill="#EF4444" opacity="0.2">
                  <animate attributeName="r" values="10;22;10" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.35;0.05;0.35" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle r="7" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
                <rect x="-40" y="-30" width="80" height="16" rx="4" fill="#0F172A" stroke="#EF4444" strokeWidth="0.8" opacity="0.9" />
                <text x="0" y="-19" textAnchor="middle" fill="#FCA5A5" fontSize="8.5" fontWeight="bold">
                  Your Premise
                </text>
              </g>

              {/* Engineer Pin */}
              <g transform={`translate(${custEngPt.x}, ${custEngPt.y})`}>
                <circle r="16" fill="#38BDF8" opacity="0.25">
                  <animate attributeName="r" values="10;26;10" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0.05;0.4" dur="1.5s" repeatCount="indefinite" />
                </circle>
                <circle r="8" fill="#0284C7" stroke="#38BDF8" strokeWidth="2.5" />
                <rect x="-42" y="16" width="84" height="16" rx="4" fill="#0F172A" stroke="#38BDF8" strokeWidth="0.8" opacity="0.9" />
                <text x="0" y="27" textAnchor="middle" fill="#38BDF8" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                  {engineerName || 'Technician'}
                </text>
              </g>
            </g>
          )
        )}
      </svg>

      {/* Status Overlay Footer */}
      <div className="absolute bottom-3 left-3 z-10 bg-slate-900/90 backdrop-blur-xs border border-slate-700/80 rounded-xl px-3 py-1.5 text-[10px] text-slate-300 flex items-center gap-3 shadow-lg">
        <span className="flex items-center gap-1.5 font-bold text-amber-300">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Fallback SVG GIS Engine</span>
        </span>
        <span className="text-slate-500">&bull;</span>
        <span className="text-slate-400 font-mono">Autonomous Continuity</span>
      </div>
    </div>
  );
};
