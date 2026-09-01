import React from 'react';

export const MumbaiNetworkMap = ({ nodes = [], selectedNodeId, onSelectNode }) => {
  const coordinates = {
    "Borivali": { x: 130, y: 45, label: "Borivali Hub" },
    "Malad West": { x: 105, y: 95, label: "Malad Link FDH" },
    "Andheri East": { x: 185, y: 135, label: "Andheri MIDC OLT" },
    "Powai": { x: 260, y: 130, label: "Powai Tech Hub" },
    "Juhu": { x: 85, y: 155, label: "Juhu Scheme FDH" },
    "Bandra West": { x: 115, y: 205, label: "Bandra Central OLT" },
    "BKC": { x: 185, y: 215, label: "BKC Core OLT" },
    "Ghatkopar": { x: 265, y: 195, label: "Ghatkopar OLT" },
    "Dadar": { x: 140, y: 270, label: "Dadar TT Circle" },
    "Lower Parel": { x: 120, y: 315, label: "Lower Parel OLT" },
    "Worli": { x: 80, y: 320, label: "Worli Sea Face" },
    "Thane West": { x: 285, y: 65, label: "Thane Majiwada" }
  };

  const trunkLines = [
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

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 lg:p-6 space-y-4 card-shadow">
      {/* Card Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">
              AI Risk Topology &amp; Fiber Optical Network
            </h3>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Visual overview of risk and optical power telemetry across your Mumbai AI ecosystem</p>
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

      {/* Map Canvas */}
      <div className="relative h-72 sm:h-84 md:h-96 w-full flex items-center justify-center bg-gradient-to-b from-[#F8FAFD] to-[#F1F5FD] rounded-xl border border-[#E2E8F0] overflow-hidden">
        <svg viewBox="0 0 370 360" preserveAspectRatio="xMidYMid meet" className="w-full h-full p-2 select-none">
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
                {/* Active Selection Pulse Ring */}
                {isSelected && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="16"
                    fill="none"
                    stroke="#2463EB"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    className="animate-spin origin-center"
                    style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                  />
                )}

                {/* Outer halo */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="10"
                  fill={nodeFill}
                  fillOpacity="0.18"
                />

                {/* Node Center */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="6.5"
                  fill={nodeFill}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  filter={filterId}
                  className="transition-transform duration-150 group-hover:scale-125"
                  style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                />

                {/* Label Top */}
                <text
                  x={pos.x}
                  y={pos.y - 11}
                  textAnchor="middle"
                  fill={isSelected ? '#1D4ED8' : '#0F172A'}
                  fontSize="9.5"
                  fontWeight={isSelected ? "700" : "600"}
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {node.area}
                </text>

                {/* Telemetry Metric Bottom */}
                <text
                  x={pos.x}
                  y={pos.y + 17}
                  textAnchor="middle"
                  fill={isCritical ? '#DC2626' : isMedium ? '#D97706' : '#64748B'}
                  fontSize="8.5"
                  fontWeight="600"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
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
