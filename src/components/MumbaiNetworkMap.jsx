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
    <div className="bg-[#1C1F27] border border-[#2C303C] rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-[#2C303C] pb-2.5">
        <div>
          <h4 className="text-xs font-semibold text-[#EDEBE6]">
            Mumbai fiber topology & live optical status
          </h4>
          <p className="text-[11px] text-[#8B8F99]">Optical Rx power attenuation and trunk link connectivity</p>
        </div>
        <div className="flex items-center space-x-3 text-[11px] font-mono">
          <span className="flex items-center space-x-1 text-[#C1514B]">
            <span className="w-2 h-2 rounded-full bg-[#C1514B]"></span>
            <span>Critical (&lt; -26.5 dBm)</span>
          </span>
          <span className="flex items-center space-x-1 text-[#C9822E]">
            <span className="w-2 h-2 rounded-full bg-[#C9822E]"></span>
            <span>Degraded</span>
          </span>
          <span className="flex items-center space-x-1 text-[#4FAE8C]">
            <span className="w-2 h-2 rounded-full bg-[#4FAE8C]"></span>
            <span>Nominal</span>
          </span>
        </div>
      </div>

      <div className="relative h-80 w-full flex items-center justify-center bg-[#14161C] rounded border border-[#2C303C]">
        <svg viewBox="0 0 360 360" className="w-full h-full p-2 select-none">
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
                stroke="#2C303C"
                strokeWidth="2"
                strokeDasharray="3 3"
              />
            );
          })}

          {/* Active Nodes */}
          {nodes.map((node) => {
            const pos = coordinates[node.area] || { x: 180, y: 180 };
            const isSelected = selectedNodeId === node.node_id;
            const isCritical = node.degradation_risk_score >= 60;
            const isMedium = node.degradation_risk_score >= 35 && node.degradation_risk_score < 60;

            const nodeColor = isCritical ? '#C1514B' : isMedium ? '#C9822E' : '#4FAE8C';

            return (
              <g
                key={node.node_id}
                onClick={() => onSelectNode(node)}
                className="cursor-pointer"
              >
                {isSelected && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="13"
                    fill="none"
                    stroke="#EDEBE6"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}

                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="6"
                  fill={nodeColor}
                  stroke="#14161C"
                  strokeWidth="1.5"
                />

                <text
                  x={pos.x}
                  y={pos.y - 9}
                  textAnchor="middle"
                  fill={isSelected ? '#EDEBE6' : '#8B8F99'}
                  fontSize="9"
                  fontWeight={isSelected ? "600" : "500"}
                  fontFamily="sans-serif"
                >
                  {node.area}
                </text>

                <text
                  x={pos.x}
                  y={pos.y + 15}
                  textAnchor="middle"
                  fill={isCritical ? '#C1514B' : '#8B8F99'}
                  fontSize="8"
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
