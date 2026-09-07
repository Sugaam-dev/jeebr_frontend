import React from 'react';
import { useMarket } from '../../context/MarketContext';

const MUMBAI_COORDINATES = {
  "Borivali": { x: 140, y: 55, label: "Borivali Hub" },
  "Thane West": { x: 600, y: 65, label: "Thane Majiwada" },
  "Malad West": { x: 130, y: 135, label: "Malad Link FDH" },
  "Andheri East": { x: 330, y: 145, label: "Andheri MIDC OLT" },
  "Powai": { x: 530, y: 145, label: "Powai Tech Hub" },
  "Juhu": { x: 130, y: 215, label: "Juhu Scheme FDH" },
  "BKC": { x: 360, y: 225, label: "BKC Core OLT" },
  "Ghatkopar": { x: 560, y: 225, label: "Ghatkopar OLT" },
  "Bandra West": { x: 150, y: 295, label: "Bandra Central OLT" },
  "Dadar": { x: 360, y: 310, label: "Dadar TT Circle" },
  "Worli": { x: 150, y: 365, label: "Worli Sea Face" },
  "Lower Parel": { x: 360, y: 375, label: "Lower Parel OLT" }
};

const MUMBAI_TRUNK_LINES = [
  ["Borivali", "Malad West"],
  ["Malad West", "Andheri East"],
  ["Andheri East", "Powai"],
  ["Powai", "Thane West"],
  ["Andheri East", "Juhu"],
  ["Juhu", "Bandra West"],
  ["Bandra West", "BKC"],
  ["BKC", "Ghatkopar"],
  ["BKC", "Dadar"],
  ["Dadar", "Lower Parel"],
  ["Lower Parel", "Worli"],
  ["Ghatkopar", "Powai"]
];

const KOLKATA_COORDINATES = {
  "Dum Dum": { x: 560, y: 55, label: "Dum Dum Airport Core" },
  "Shyambazar": { x: 330, y: 65, label: "Shyambazar Five-Point" },
  "Howrah": { x: 120, y: 140, label: "Howrah Station Hub" },
  "Rajarhat": { x: 620, y: 135, label: "Rajarhat Expressway" },
  "New Town": { x: 580, y: 215, label: "New Town Action Area 1" },
  "Salt Lake Sector V": { x: 420, y: 210, label: "Salt Lake Sector V Hub" },
  "Park Street": { x: 230, y: 215, label: "Park Street Central" },
  "Alipore": { x: 130, y: 295, label: "Alipore Command Hub" },
  "Ballygunge": { x: 320, y: 290, label: "Ballygunge Circular" },
  "Behala": { x: 120, y: 365, label: "Behala Chowrasta" },
  "Gariahat": { x: 380, y: 365, label: "Gariahat Retail Hub" },
  "Jadavpur": { x: 550, y: 360, label: "Jadavpur University" }
};

const KOLKATA_TRUNK_LINES = [
  ["Dum Dum", "Rajarhat"],
  ["Rajarhat", "New Town"],
  ["New Town", "Salt Lake Sector V"],
  ["Shyambazar", "Dum Dum"],
  ["Shyambazar", "Park Street"],
  ["Howrah", "Park Street"],
  ["Park Street", "Salt Lake Sector V"],
  ["Park Street", "Ballygunge"],
  ["Park Street", "Alipore"],
  ["Alipore", "Behala"],
  ["Ballygunge", "Gariahat"],
  ["Gariahat", "Jadavpur"],
  ["Salt Lake Sector V", "Gariahat"]
];

export const MarketNetworkMap = ({ nodes = [], selectedNodeId, onSelectNode, marketOverride }) => {
  const { currentMarket, marketConfig } = useMarket();
  const activeMarket = marketOverride || currentMarket || 'mumbai';
  const isKolkata = activeMarket === 'kolkata';

  const coordinates = isKolkata ? KOLKATA_COORDINATES : MUMBAI_COORDINATES;
  const trunkLines = isKolkata ? KOLKATA_TRUNK_LINES : MUMBAI_TRUNK_LINES;
  const city = isKolkata ? 'Kolkata' : 'Mumbai';

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 lg:p-6 space-y-4 card-shadow">
      {/* Card Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">
              {city} AI Risk Topology &amp; Fiber Optical Network
            </h3>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Visual overview of risk and optical power telemetry across your {city} network ecosystem
          </p>
        </div>

        {/* Responsive Legend */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3.5 text-[11px] font-medium bg-slate-50 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200/70">
          <span className="flex items-center gap-1.5 text-rose-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-xs ring-2 ring-rose-200"></span>
            <span>Critical (&lt; -28 dBm)</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-xs ring-2 ring-amber-200"></span>
            <span>Degraded</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs ring-2 ring-emerald-200"></span>
            <span>Normal</span>
          </span>
        </div>
      </div>

      {/* Map Canvas with generous spacing */}
      <div className="relative h-80 sm:h-96 md:h-[400px] w-full flex items-center justify-center bg-gradient-to-b from-[#F8FAFD] to-[#F1F5FD] rounded-xl border border-[#E2E8F0] overflow-hidden">
        <svg viewBox="0 0 740 410" preserveAspectRatio="xMidYMid meet" className="w-full h-full p-2 select-none">
          {/* Grid Background Pattern */}
          <defs>
            <pattern id="topoGrid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#E2E8F0" strokeWidth="0.6" opacity="0.7" />
            </pattern>
            <filter id="glowCrit" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#EF4444" floodOpacity="0.4" />
            </filter>
            <filter id="glowWarn" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#F59E0B" floodOpacity="0.4" />
            </filter>
            <filter id="glowOk" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#10B981" floodOpacity="0.3" />
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#topoGrid)" />

          {/* Connection Trunk Lines */}
          {trunkLines.map(([fromArea, toArea], i) => {
            const p1 = coordinates[fromArea];
            const p2 = coordinates[toArea];
            if (!p1 || !p2) return null;

            return (
              <g key={i}>
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="#CBD5E1"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  strokeOpacity="0.8"
                />
              </g>
            );
          })}

          {/* Active Interactive Nodes */}
          {nodes.map((node) => {
            const pos = coordinates[node.area] || { x: 180, y: 180, label: node.area };
            const isSelected = selectedNodeId === node.node_id;
            const isCritical = node.degradation_risk_score >= 60;
            const isMedium = node.degradation_risk_score >= 35 && node.degradation_risk_score < 60;

            const nodeFill = isCritical ? '#EF4444' : isMedium ? '#F59E0B' : '#10B981';
            const filterId = isCritical ? 'url(#glowCrit)' : isMedium ? 'url(#glowWarn)' : 'url(#glowOk)';

            return (
              <g
                key={node.node_id}
                onClick={() => onSelectNode && onSelectNode(node)}
                className="cursor-pointer group"
              >
                {/* Node Outer Selection Ring (Static, Non-moving) */}
                {isSelected && (
                  <>
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={13}
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      opacity="0.85"
                    />
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={16}
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="1"
                      opacity="0.25"
                    />
                  </>
                )}

                {/* Soft Static Halo for Critical Nodes (No Blinking / Emission) */}
                {isCritical && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={11}
                    fill="#EF4444"
                    opacity="0.2"
                  />
                )}

                {/* Node Body Circle (Stationary, No Scale Movement) */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isSelected ? 8 : 7}
                  fill={nodeFill}
                  stroke={isSelected ? "#1D4ED8" : "#FFFFFF"}
                  strokeWidth={isSelected ? 2.5 : 2}
                  filter={filterId}
                  className="transition-colors duration-150 group-hover:stroke-blue-400"
                />

                {/* Area Label Tag */}
                <text
                  x={pos.x}
                  y={pos.y + 16}
                  textAnchor="middle"
                  className={`text-[9px] select-none font-semibold transition-colors ${
                    isSelected
                      ? 'fill-blue-700 font-bold text-[10px]'
                      : isCritical
                      ? 'fill-rose-700 font-bold'
                      : 'fill-gray-600 group-hover:fill-gray-900'
                  }`}
                >
                  {pos.label || node.area}
                </text>

                {/* Optical Power Sub-label */}
                <text
                  x={pos.x}
                  y={pos.y + 25}
                  textAnchor="middle"
                  className={`text-[7.5px] select-none font-mono ${
                    isCritical
                      ? 'fill-rose-600 font-bold'
                      : isMedium
                      ? 'fill-amber-600 font-medium'
                      : 'fill-emerald-600'
                  }`}
                >
                  {node.optical_power_dbm} dBm
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// Backward-compatible alias for existing imports
export const MumbaiNetworkMap = (props) => <MarketNetworkMap {...props} />;
export default MarketNetworkMap;
