import React from 'react';
import WpIcon from './WpIcon';

export default function WpAppBar({ title, sub, dark = false, onBack, trailing }) {
  const bg = dark ? 'var(--ink-950)' : 'var(--asphalt-0)';
  const titleColor = dark ? '#fff' : 'var(--asphalt-900)';
  const subColor = dark ? 'rgba(255,255,255,0.45)' : 'var(--asphalt-400)';
  const iconColor = dark ? '#fff' : 'var(--asphalt-700)';

  return (
    <div
      style={{
        background: bg,
        paddingTop: '60px',
        paddingBottom: '12px',
        paddingLeft: '20px',
        paddingRight: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: dark ? 'none' : '1px solid var(--asphalt-100)',
      }}
    >
      {onBack && (
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            marginLeft: '-4px',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: titleColor,
            fontFamily: 'var(--font-sans)',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
        {sub && (
          <div
            style={{
              fontSize: '12px',
              color: subColor,
              fontFamily: 'var(--font-mono)',
              marginTop: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {sub}
          </div>
        )}
      </div>
      {trailing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {trailing}
        </div>
      )}
    </div>
  );
}
