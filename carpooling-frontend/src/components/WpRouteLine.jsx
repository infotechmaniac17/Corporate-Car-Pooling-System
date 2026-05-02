import React from 'react';

export default function WpRouteLine({ origin, destination, distance, eta, vertical = false }) {
  if (vertical) {
    return (
      <div style={{ display: 'flex', gap: '12px' }}>
        {/* Icon column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '2px' }}>
          {/* Origin dot */}
          <div style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'var(--ink-500)',
            border: '2px solid var(--ink-300)',
            flexShrink: 0,
          }} />
          {/* Dashed line */}
          <div style={{
            width: 2,
            flex: 1,
            margin: '4px 0',
            backgroundImage: 'repeating-linear-gradient(to bottom, var(--asphalt-300) 0, var(--asphalt-300) 4px, transparent 4px, transparent 8px)',
            minHeight: '28px',
          }} />
          {/* Destination square */}
          <div style={{
            width: 10,
            height: 10,
            borderRadius: '2px',
            background: 'var(--voltage-400)',
            flexShrink: 0,
          }} />
        </div>
        {/* Text column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '56px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Pickup</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--asphalt-900)', marginTop: '1px' }}>{origin}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Drop</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--asphalt-900)', marginTop: '1px' }}>{destination}</div>
          </div>
        </div>
        {/* Distance/ETA column */}
        {(distance || eta) && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: '4px' }}>
            {distance && <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-600)', fontFamily: 'var(--font-mono)' }}>{distance}</span>}
            {eta && <span style={{ fontSize: '11px', color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>{eta}</span>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {/* Origin dot */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: 'var(--ink-500)',
          border: '2px solid var(--ink-300)',
          flexShrink: 0,
        }} />
        <div style={{ fontSize: '11px', color: 'var(--asphalt-500)', marginTop: '3px', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>{origin}</div>
      </div>
      {/* Dashed line */}
      <div style={{ flex: 1, height: 2, backgroundImage: 'repeating-linear-gradient(to right, var(--asphalt-300) 0, var(--asphalt-300) 5px, transparent 5px, transparent 10px)' }} />
      {/* Center badge */}
      {(distance || eta) && (
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-600)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
          {distance || eta}
        </div>
      )}
      <div style={{ flex: 1, height: 2, backgroundImage: 'repeating-linear-gradient(to right, var(--asphalt-300) 0, var(--asphalt-300) 5px, transparent 5px, transparent 10px)' }} />
      {/* Destination square */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: 10,
          height: 10,
          borderRadius: '2px',
          background: 'var(--voltage-400)',
          flexShrink: 0,
        }} />
        <div style={{ fontSize: '11px', color: 'var(--asphalt-500)', marginTop: '3px', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>{destination}</div>
      </div>
    </div>
  );
}
