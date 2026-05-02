import React from 'react';
import WpButton from '../components/WpButton';

export default function SplashScreen({ onLogin, onSSO }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--ink-950)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Cartographic SVG grid overlay */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.18 }}
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <pattern id="splash-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--ink-300)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="390" height="844" fill="url(#splash-grid)" />
        {/* City block rectangles */}
        <rect x="20" y="60" width="80" height="50" rx="4" fill="none" stroke="var(--ink-400)" strokeWidth="0.8" />
        <rect x="120" y="80" width="120" height="40" rx="4" fill="none" stroke="var(--ink-400)" strokeWidth="0.8" />
        <rect x="260" y="50" width="100" height="70" rx="4" fill="none" stroke="var(--ink-400)" strokeWidth="0.8" />
        <rect x="20" y="140" width="60" height="80" rx="4" fill="none" stroke="var(--ink-300)" strokeWidth="0.6" />
        <rect x="300" y="140" width="70" height="60" rx="4" fill="none" stroke="var(--ink-300)" strokeWidth="0.6" />
        {/* Road lines */}
        <line x1="0" y1="130" x2="390" y2="130" stroke="var(--ink-300)" strokeWidth="1" />
        <line x1="100" y1="0" x2="100" y2="400" stroke="var(--ink-300)" strokeWidth="1" />
        <line x1="250" y1="0" x2="250" y2="400" stroke="var(--ink-300)" strokeWidth="1" />
      </svg>

      {/* Voltage route arc */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--ink-500)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--voltage-400)" stopOpacity="0.8" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Main route arc */}
        <path
          d="M 40 600 Q 80 480 150 420 Q 220 360 280 300 Q 330 250 350 180"
          fill="none"
          stroke="url(#routeGrad)"
          strokeWidth="2.5"
          strokeDasharray="12 5"
          filter="url(#glow)"
          opacity="0.7"
        />
        {/* Origin circle */}
        <circle cx="40" cy="600" r="6" fill="var(--ink-400)" stroke="var(--ink-200)" strokeWidth="2" opacity="0.9" />
        <circle cx="40" cy="600" r="12" fill="none" stroke="var(--ink-400)" strokeWidth="1" opacity="0.4" />
        {/* Destination */}
        <rect x="344" y="174" width="12" height="12" rx="2" fill="var(--voltage-400)" stroke="var(--voltage-200)" strokeWidth="2" opacity="0.9" />
        <circle cx="350" cy="180" r="18" fill="none" stroke="var(--voltage-400)" strokeWidth="1" opacity="0.3" />
      </svg>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '0 28px 48px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo + wordmark */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            {/* Voltage pin mark */}
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="14" fill="var(--voltage-400)" />
              <path
                d="M22 8C16.477 8 12 12.477 12 18C12 24 22 36 22 36C22 36 32 24 32 18C32 12.477 27.523 8 22 8Z"
                fill="var(--ink-950)"
              />
              <circle cx="22" cy="18" r="4" fill="var(--voltage-400)" />
            </svg>
            {/* Wordmark */}
            <span
              style={{
                fontSize: '28px',
                fontWeight: 800,
                color: '#fff',
                fontFamily: 'var(--font-sans)',
                letterSpacing: '-0.02em',
              }}
            >
              waypoint
            </span>
          </div>
          <p
            style={{
              fontSize: '16px',
              color: 'rgba(255,255,255,0.55)',
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            Same route. Shared ride.
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <WpButton kind="accent" size="lg" full onClick={onLogin}>
            Sign in with work email
          </WpButton>
          <WpButton kind="inverse" size="lg" full onClick={onSSO}>
            Continue with SSO
          </WpButton>
        </div>
      </div>
    </div>
  );
}
