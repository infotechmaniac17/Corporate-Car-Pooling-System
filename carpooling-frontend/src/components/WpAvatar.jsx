import React from 'react';

const tones = {
  ink: { bg: 'var(--ink-100)', color: 'var(--ink-700)' },
  voltage: { bg: 'var(--voltage-100)', color: 'var(--voltage-700)' },
  asphalt: { bg: 'var(--asphalt-200)', color: 'var(--asphalt-700)' },
};

export default function WpAvatar({ initials = '?', size = 36, tone = 'ink' }) {
  const t = tones[tone] || tones.ink;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: t.bg,
        color: t.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-sans)',
        fontWeight: 700,
        fontSize: Math.round(size * 0.38),
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}
