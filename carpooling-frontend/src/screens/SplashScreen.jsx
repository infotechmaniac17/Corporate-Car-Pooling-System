import React from 'react';
import WpButton from '../components/WpButton';
import useIsDesktop from '../hooks/useIsDesktop';

export default function SplashScreen({ onLogin, onSSO }) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--ink-950)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)',
      }}>
        {/* Background grid */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <pattern id="splash-grid-d" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--ink-300)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="1440" height="900" fill="url(#splash-grid-d)" />
          <line x1="0" y1="450" x2="1440" y2="450" stroke="var(--ink-300)" strokeWidth="1" />
          <line x1="720" y1="0" x2="720" y2="900" stroke="var(--ink-300)" strokeWidth="1" />
          <line x1="0" y1="225" x2="1440" y2="225" stroke="var(--ink-300)" strokeWidth="0.6" />
          <line x1="0" y1="675" x2="1440" y2="675" stroke="var(--ink-300)" strokeWidth="0.6" />
          <line x1="360" y1="0" x2="360" y2="900" stroke="var(--ink-300)" strokeWidth="0.6" />
          <line x1="1080" y1="0" x2="1080" y2="900" stroke="var(--ink-300)" strokeWidth="0.6" />
        </svg>

        {/* Left — branding + CTA */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 72px',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '56px' }}>
            <svg width="52" height="52" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="14" fill="var(--voltage-400)" />
              <path d="M22 8C16.477 8 12 12.477 12 18C12 24 22 36 22 36C22 36 32 24 32 18C32 12.477 27.523 8 22 8Z" fill="var(--ink-950)" />
              <circle cx="22" cy="18" r="4" fill="var(--voltage-400)" />
            </svg>
            <span style={{ fontSize: '32px', fontWeight: 800, color: '#fff', letterSpacing: '-0.025em' }}>waypoint</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: '56px', fontWeight: 800, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '20px' }}>
            Same route.<br />
            <span style={{ color: 'var(--voltage-400)' }}>Shared ride.</span>
          </h1>

          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.55)', fontWeight: 500, lineHeight: 1.6, maxWidth: '400px', marginBottom: '48px' }}>
            Corporate carpooling that gets your team to work — together.
            Cut costs, cut emissions, cut the parking queue.
          </p>

          {/* Feature bullets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '52px' }}>
            {[
              { icon: '→', text: 'Smart route matching across your org' },
              { icon: '→', text: 'Live tracking & in-ride chat' },
              { icon: '→', text: 'Safety SOS & guardian alerts' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '16px', color: 'var(--voltage-400)', fontWeight: 700 }}>{item.icon}</span>
                <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-sans)' }}>{item.text}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={onLogin}
              style={{
                padding: '16px 36px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--voltage-400)',
                color: 'var(--ink-950)',
                border: 'none',
                fontSize: '16px',
                fontWeight: 700,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                letterSpacing: '-0.01em',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              Sign in with work email
            </button>
            <button
              onClick={onSSO}
              style={{
                padding: '16px 36px',
                borderRadius: 'var(--radius-pill)',
                background: 'transparent',
                color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.3)',
                fontSize: '16px',
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                letterSpacing: '-0.01em',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'transparent'; }}
            >
              Continue with SSO
            </button>
          </div>

          <p style={{ marginTop: '32px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.25)', letterSpacing: '.06em' }}>
            WAYPOINT · CORPORATE CARPOOL PLATFORM
          </p>
        </div>

        {/* Right — map visual */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          {/* City block overlay */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.25 }} viewBox="0 0 720 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <rect x="40" y="80"  width="140" height="90"  rx="6" fill="none" stroke="var(--ink-400)" strokeWidth="1.2" />
            <rect x="220" y="60" width="200" height="70"  rx="6" fill="none" stroke="var(--ink-400)" strokeWidth="1.2" />
            <rect x="460" y="90" width="180" height="120" rx="6" fill="none" stroke="var(--ink-400)" strokeWidth="1.2" />
            <rect x="40" y="220" width="100" height="140" rx="6" fill="none" stroke="var(--ink-300)" strokeWidth="1" />
            <rect x="180" y="200" width="160" height="100" rx="6" fill="none" stroke="var(--ink-300)" strokeWidth="1" />
            <rect x="500" y="240" width="140" height="80"  rx="6" fill="none" stroke="var(--ink-300)" strokeWidth="1" />
            <rect x="60" y="420"  width="120" height="100" rx="6" fill="none" stroke="var(--ink-300)" strokeWidth="0.8" />
            <rect x="240" y="400" width="180" height="120" rx="6" fill="none" stroke="var(--ink-300)" strokeWidth="0.8" />
            <rect x="480" y="380" width="160" height="90"  rx="6" fill="none" stroke="var(--ink-300)" strokeWidth="0.8" />
            <line x1="0" y1="180" x2="720" y2="180" stroke="var(--ink-400)" strokeWidth="1.5" />
            <line x1="0" y1="370" x2="720" y2="370" stroke="var(--ink-400)" strokeWidth="1.5" />
            <line x1="160" y1="0"  x2="160" y2="900" stroke="var(--ink-400)" strokeWidth="1.5" />
            <line x1="420" y1="0"  x2="420" y2="900" stroke="var(--ink-400)" strokeWidth="1.5" />
          </svg>

          {/* Route arc */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 720 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <linearGradient id="routeGrad-d" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--ink-500)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="var(--voltage-400)" stopOpacity="0.9" />
              </linearGradient>
              <filter id="glow-d">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M 80 760 Q 160 640 260 530 Q 360 420 460 320 Q 560 220 620 120"
              fill="none"
              stroke="url(#routeGrad-d)"
              strokeWidth="3"
              strokeDasharray="14 6"
              filter="url(#glow-d)"
              opacity="0.85"
            />
            {/* Origin */}
            <circle cx="80"  cy="760" r="8"  fill="var(--ink-400)"    stroke="var(--ink-200)"    strokeWidth="2.5" opacity="0.9" />
            <circle cx="80"  cy="760" r="18" fill="none"              stroke="var(--ink-400)"    strokeWidth="1"   opacity="0.35" />
            {/* Destination */}
            <rect   x="612" y="112"  width="16" height="16" rx="3" fill="var(--voltage-400)" stroke="var(--voltage-200)" strokeWidth="2.5" opacity="0.95" />
            <circle cx="620" cy="120" r="26" fill="none" stroke="var(--voltage-400)" strokeWidth="1.2" opacity="0.4" />
            <circle cx="620" cy="120" r="40" fill="none" stroke="var(--voltage-400)" strokeWidth="0.7" opacity="0.2" />
            {/* Moving car dot */}
            <circle cx="350" cy="440" r="10" fill="var(--voltage-400)" stroke="var(--ink-950)" strokeWidth="2.5" />
            <circle cx="350" cy="440" r="22" fill="none" stroke="var(--voltage-400)" strokeWidth="1.5" opacity="0.5" />
          </svg>

          {/* ETA overlay card */}
          <div style={{
            position: 'absolute',
            bottom: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px 28px',
            border: '1px solid rgba(255,255,255,0.14)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            whiteSpace: 'nowrap',
          }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>Arriving in</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--voltage-400)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>8 min</div>
            </div>
            <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.15)' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', fontFamily: 'var(--font-sans)', marginBottom: '2px' }}>Arjun Mehta</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-mono)' }}>★ 4.8 · KA 01 AB 1234</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        <rect x="20" y="60" width="80" height="50" rx="4" fill="none" stroke="var(--ink-400)" strokeWidth="0.8" />
        <rect x="120" y="80" width="120" height="40" rx="4" fill="none" stroke="var(--ink-400)" strokeWidth="0.8" />
        <rect x="260" y="50" width="100" height="70" rx="4" fill="none" stroke="var(--ink-400)" strokeWidth="0.8" />
        <rect x="20" y="140" width="60" height="80" rx="4" fill="none" stroke="var(--ink-300)" strokeWidth="0.6" />
        <rect x="300" y="140" width="70" height="60" rx="4" fill="none" stroke="var(--ink-300)" strokeWidth="0.6" />
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
        <path
          d="M 40 600 Q 80 480 150 420 Q 220 360 280 300 Q 330 250 350 180"
          fill="none"
          stroke="url(#routeGrad)"
          strokeWidth="2.5"
          strokeDasharray="12 5"
          filter="url(#glow)"
          opacity="0.7"
        />
        <circle cx="40" cy="600" r="6" fill="var(--ink-400)" stroke="var(--ink-200)" strokeWidth="2" opacity="0.9" />
        <circle cx="40" cy="600" r="12" fill="none" stroke="var(--ink-400)" strokeWidth="1" opacity="0.4" />
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
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="14" fill="var(--voltage-400)" />
              <path
                d="M22 8C16.477 8 12 12.477 12 18C12 24 22 36 22 36C22 36 32 24 32 18C32 12.477 27.523 8 22 8Z"
                fill="var(--ink-950)"
              />
              <circle cx="22" cy="18" r="4" fill="var(--voltage-400)" />
            </svg>
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
