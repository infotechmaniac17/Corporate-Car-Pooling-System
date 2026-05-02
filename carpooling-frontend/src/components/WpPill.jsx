import React from 'react';

const toneMap = {
  matched: { bg: 'var(--ink-50)', color: 'var(--ink-700)', dot: 'var(--ink-400)' },
  live: { bg: 'var(--voltage-100)', color: 'var(--voltage-700)', dot: 'var(--voltage-500)' },
  completed: { bg: 'var(--success-100)', color: 'var(--success-700)', dot: 'var(--success-500)' },
  cancelled: { bg: 'var(--asphalt-100)', color: 'var(--asphalt-600)', dot: 'var(--asphalt-400)' },
  sos: { bg: 'var(--danger-100)', color: 'var(--danger-700)', dot: 'var(--danger-500)' },
  warn: { bg: 'var(--warning-100)', color: 'var(--warning-700)', dot: 'var(--warning-500)' },
};

export default function WpPill({ tone = 'matched', children }) {
  const t = toneMap[tone] || toneMap.matched;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        background: t.bg,
        color: t.color,
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        borderRadius: 'var(--radius-pill)',
        padding: '4px 10px',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: t.dot,
          flexShrink: 0,
        }}
      />
      {children}
    </span>
  );
}
