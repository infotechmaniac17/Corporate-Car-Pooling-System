import React from 'react';

export default function RouteDisplay({ pickup, dropoff, compact = false }) {
  const dotSize = compact ? 8 : 10;
  const lineHeight = compact ? 18 : 22;
  const fontSize = compact ? 12 : 13;
  const fontWeight = compact ? 500 : 600;

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 10 }}>
      {/* Left: dots + line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 3, gap: 0, flexShrink: 0 }}>
        {/* Green circle = pickup */}
        <div style={{
          width: dotSize, height: dotSize, borderRadius: '50%',
          background: '#22c55e',
          border: '2px solid #fff',
          boxShadow: '0 0 0 1.5px #22c55e',
          flexShrink: 0,
        }} />
        {/* Dashed line */}
        <div style={{
          width: 2, height: lineHeight,
          background: 'repeating-linear-gradient(to bottom, #d1d5db 0px, #d1d5db 4px, transparent 4px, transparent 8px)',
          flexShrink: 0,
        }} />
        {/* Dark red square = dropoff */}
        <div style={{
          width: dotSize, height: dotSize,
          background: '#ef4444',
          borderRadius: 2,
          border: '2px solid #fff',
          boxShadow: '0 0 0 1.5px #ef4444',
          flexShrink: 0,
        }} />
      </div>

      {/* Right: labels */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0, flex: 1, gap: lineHeight - 2 }}>
        <div style={{
          fontSize, fontWeight,
          color: 'var(--asphalt-900)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          lineHeight: 1.2,
        }}>
          {pickup || 'Pickup'}
        </div>
        <div style={{
          fontSize, fontWeight,
          color: 'var(--asphalt-600)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          lineHeight: 1.2,
        }}>
          {dropoff || 'Drop-off'}
        </div>
      </div>
    </div>
  );
}
