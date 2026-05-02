import React, { useEffect, useRef, useState } from 'react';

export default function WpMap({ height = 360, showRoute = false, showDriver = false, driverPos = 0, dark = false }) {
  const [animPos, setAnimPos] = useState(driverPos);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    setAnimPos(driverPos);
  }, [driverPos]);

  const bg = dark ? 'var(--asphalt-900)' : 'var(--asphalt-100)';
  const gridColor = dark ? 'rgba(255,255,255,0.04)' : 'rgba(13,18,64,0.06)';
  const roadColor = dark ? 'rgba(255,255,255,0.08)' : 'rgba(13,18,64,0.08)';
  const routeColor = 'var(--ink-500)';

  // Route path points (simplified polyline)
  const routePoints = [
    [40, 280], [80, 260], [130, 240], [170, 210], [210, 190], [250, 160], [290, 130], [340, 100]
  ];

  // Interpolate driver position along route
  const totalSegments = routePoints.length - 1;
  const segment = Math.min(Math.floor(animPos * totalSegments), totalSegments - 1);
  const t = (animPos * totalSegments) - segment;
  const [x1, y1] = routePoints[segment];
  const [x2, y2] = routePoints[Math.min(segment + 1, routePoints.length - 1)];
  const driverX = x1 + (x2 - x1) * t;
  const driverY = y1 + (y2 - y1) * t;

  const routePath = routePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');

  return (
    <div style={{ width: '100%', height, background: bg, position: 'relative', overflow: 'hidden', borderRadius: 0 }}>
      <svg width="100%" height={height} viewBox={`0 0 390 ${height}`} preserveAspectRatio="xMidYMid slice">
        {/* Grid pattern */}
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d={`M 30 0 L 0 0 0 30`} fill="none" stroke={gridColor} strokeWidth="1" />
          </pattern>
          <pattern id="bigGrid" width="90" height="90" patternUnits="userSpaceOnUse">
            <path d={`M 90 0 L 0 0 0 90`} fill="none" stroke={gridColor} strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="390" height={height} fill={bg} />
        <rect width="390" height={height} fill="url(#grid)" />
        <rect width="390" height={height} fill="url(#bigGrid)" />

        {/* Roads */}
        <line x1="0" y1="180" x2="390" y2="180" stroke={roadColor} strokeWidth="12" strokeLinecap="round" />
        <line x1="0" y1="120" x2="390" y2="120" stroke={roadColor} strokeWidth="8" strokeLinecap="round" />
        <line x1="130" y1="0" x2="130" y2={height} stroke={roadColor} strokeWidth="12" strokeLinecap="round" />
        <line x1="260" y1="0" x2="260" y2={height} stroke={roadColor} strokeWidth="8" strokeLinecap="round" />
        <line x1="0" y1="280" x2="390" y2="280" stroke={roadColor} strokeWidth="6" strokeLinecap="round" />
        <line x1="60" y1="0" x2="60" y2={height} stroke={roadColor} strokeWidth="6" strokeLinecap="round" />
        <line x1="320" y1="0" x2="320" y2={height} stroke={roadColor} strokeWidth="6" strokeLinecap="round" />

        {/* Route line */}
        {showRoute && (
          <>
            <path
              d={routePath}
              fill="none"
              stroke={dark ? 'rgba(42,58,163,0.4)' : 'rgba(42,58,163,0.2)'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={routePath}
              fill="none"
              stroke={routeColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="8 4"
            />
            {/* Origin marker */}
            <circle cx={routePoints[0][0]} cy={routePoints[0][1]} r="7" fill="var(--ink-500)" stroke="#fff" strokeWidth="2" />
            {/* Destination marker */}
            <rect
              x={routePoints[routePoints.length - 1][0] - 7}
              y={routePoints[routePoints.length - 1][1] - 7}
              width="14"
              height="14"
              rx="3"
              fill="var(--voltage-400)"
              stroke="#fff"
              strokeWidth="2"
            />
          </>
        )}

        {/* Driver dot */}
        {showDriver && (
          <g transform={`translate(${driverX}, ${driverY})`}>
            {/* Pulse rings */}
            <circle r="20" fill="rgba(174,228,20,0.12)">
              <animate attributeName="r" values="14;28;14" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle r="12" fill="rgba(174,228,20,0.2)" />
            <circle r="8" fill="var(--voltage-400)" stroke="#fff" strokeWidth="2.5" />
            {/* Car icon dot */}
            <circle r="3" fill="var(--ink-950)" />
          </g>
        )}
      </svg>

      {/* Overlay gradient at bottom */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        background: `linear-gradient(to top, ${dark ? 'rgba(22,25,34,0.9)' : 'rgba(247,248,251,0.9)'}, transparent)`,
        pointerEvents: 'none',
      }} />
    </div>
  );
}
