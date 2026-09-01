import React from 'react';

export const MumbaiNetworkMap = ({ nodes = [], selectedNodeId, onSelectNode }) => {
  const coordinates = {
    "Borivali": { x: 130, y: 40 },
    "Malad West": { x: 110, y: 90 },
    "Andheri East": { x: 180, y: 135 },
    "Powai": { x: 250, y: 130 },
    "Juhu": { x: 95, y: 155 },
    "Bandra West": { x: 115, y: 200 },
    "BKC": { x: 180, y: 210 },
    "Ghatkopar": { x: 260, y: 190 },
    "Dadar": { x: 140, y: 265 },
    "Lower Parel": { x: 120, y: 310 },
    "Worli": { x: 85, y: 320 },
    "Thane West": { x: 280, y: 65 }
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
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 card-shadow">
      {/* Card Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">
            Mumbai fiber topology &amp; live optical status
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">Optical Rx power attenuation and trunk link connectivity</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-rose-600">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs"></span>
            <span>Critical (&lt; -26.5 dBm)</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-600">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs"></span>
            <span>Degraded</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs"></span>
            <span>Nominal</span>
          </span>
        </div>
      </div>

      {/* Map Canvas */}
      <div
        className="relative h-80 w-full flex items-center justify-center bg-slate-50/60 rounded-xl border border-slate-200/80 overflow-hidden"
      >
        <svg viewBox="0 0 360 360" className="w-full h-full p-3 select-none">
          {/* Subtle Grid Background Pattern */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E2E8F0" strokeWidth="0.5" opacity="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Trunk Lines */}
          {trunkLines.map(([fromArea, toArea], i) => {
            const p1 = coordinates[fromArea];
            const p2 = coordinates[toArea];
            if (!p1 || !p2) return null;

            return (
              <line
                key={i}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#94A3B8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                strokeOpacity="0.7"
              />
            );
          })}

          {/* Active Nodes */}
          {nodes.map((node) => {
            const pos = coordinates[node.area] || { x: 180, y: 180 };
            const isSelected = selectedNodeId === node.node_id;
            const isCritical = node.degradation_risk_score >= 60;
            const isMedium = node.degradation_risk_score >= 35 && node.degradation_risk_score < 60;

            const nodeFill = isCritical ? '#EF4444' : isMedium ? '#F59E0B' : '#10B981';

            return (
              <g
                key={node.node_id}
                onClick={() => onSelectNode(node)}
                className="cursor-pointer group"
              >
                {isSelected && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="15"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                    className="animate-spin origin-center"
                    style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                  />
                )}

                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="7"
                  fill={nodeFill}
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  className="filter drop-shadow-sm transition-transform duration-150 group-hover:scale-125"
                  style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                />

                <text
                  x={pos.x}
                  y={pos.y - 11}
                  textAnchor="middle"
                  fill={isSelected ? '#1E3A8A' : '#1E293B'}
                  fontSize="9.5"
                  fontWeight={isSelected ? "700" : "600"}
                  fontFamily="sans-serif"
                >
                  {node.area}
                </text>

                <text
                  x={pos.x}
                  y={pos.y + 16}
                  textAnchor="middle"
                  fill={isCritical ? '#DC2626' : '#64748B'}
                  fontSize="8.5"
                  fontWeight="600"
                  fontFamily="monospace"
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
