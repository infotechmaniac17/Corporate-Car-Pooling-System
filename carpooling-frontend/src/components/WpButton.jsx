import React from 'react';

const styles = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    borderRadius: 'var(--radius-pill)',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  sizes: {
    sm: { fontSize: '13px', padding: '8px 16px', height: '36px' },
    md: { fontSize: '15px', padding: '12px 24px', height: '48px' },
    lg: { fontSize: '17px', padding: '15px 32px', height: '56px' },
  },
  kinds: {
    primary: {
      background: 'var(--ink-600)',
      color: '#fff',
    },
    accent: {
      background: 'var(--voltage-400)',
      color: 'var(--ink-950)',
      boxShadow: 'var(--glow-voltage)',
    },
    secondary: {
      background: '#fff',
      color: 'var(--ink-700)',
      border: '1.5px solid var(--asphalt-200)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--ink-600)',
    },
    danger: {
      background: 'var(--danger-500)',
      color: '#fff',
    },
    inverse: {
      background: 'rgba(255,255,255,0.12)',
      color: '#fff',
      border: '1.5px solid rgba(255,255,255,0.24)',
    },
  },
};

export default function WpButton({ kind = 'primary', size = 'md', full = false, onClick, children, disabled, type = 'button', style: externalStyle }) {
  const kindStyle = styles.kinds[kind] || styles.kinds.primary;
  const sizeStyle = styles.sizes[size] || styles.sizes.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles.base,
        ...sizeStyle,
        ...kindStyle,
        width: full ? '100%' : undefined,
        opacity: disabled ? 0.52 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...externalStyle,
      }}
    >
      {children}
    </button>
  );
}
