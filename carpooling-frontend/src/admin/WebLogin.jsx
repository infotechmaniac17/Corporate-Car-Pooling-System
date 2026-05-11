import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WpButton from '../components/WpButton';
import useIsDesktop from '../hooks/useIsDesktop';

const Logo = ({ size = 40, textSize = 20, textColor = '#fff' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <div style={{ width: size, height: size, borderRadius: Math.round(size * 0.25), background: 'var(--voltage-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size * 0.55} height={size * 0.65} viewBox="0 0 32 38" fill="none" aria-hidden="true">
        <path d="M16 2 C 8 2 2 8 2 16 c 0 9 14 20 14 20 s 14-11 14-20 c 0-8-6-14-14-14 z" fill="var(--ink-950)" />
        <circle cx="16" cy="15" r="5" fill="var(--voltage-400)" />
      </svg>
    </div>
    <span style={{ fontSize: textSize, fontWeight: 800, color: textColor, fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em' }}>
      waypoint
    </span>
  </div>
);

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 10,
  border: '1.5px solid var(--asphalt-200)',
  font: '500 15px var(--font-sans)',
  color: 'var(--asphalt-900)',
  outline: 'none',
  background: 'var(--asphalt-50)',
  boxSizing: 'border-box',
  transition: 'border-color 0.12s',
};

const labelStyle = {
  display: 'block',
  font: '600 11px var(--font-mono)',
  color: 'var(--asphalt-500)',
  letterSpacing: '.08em',
  textTransform: 'uppercase',
  marginBottom: 6,
};


function RoleSelectionModal({ onSelect }) {
  const options = [
    {
      role: 'PASSENGER',
      label: 'Passenger',
      description: 'Book rides to and from work',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      ),
    },
    {
      role: 'DRIVER',
      label: 'Driver',
      description: 'Offer rides and earn credits',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="9" width="22" height="9" rx="2" /><path d="M16 18v2M8 18v2M3 9l3-5h12l3 5" /><circle cx="7.5" cy="14.5" r="1.5" /><circle cx="16.5" cy="14.5" r="1.5" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(7,10,38,0.6)', backdropFilter: 'blur(4px)', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: '0 32px 80px rgba(7,10,38,0.4)' }}>
        <h2 style={{ font: '700 22px/1.2 var(--font-sans)', color: 'var(--asphalt-900)', marginBottom: 6 }}>How are you commuting today?</h2>
        <p style={{ font: '500 14px var(--font-sans)', color: 'var(--asphalt-500)', marginBottom: 28 }}>Select your role for this session.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {options.map(({ role, label, description, icon }) => (
            <button
              key={role}
              onClick={() => onSelect(role)}
              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 14, border: '2px solid var(--asphalt-200)', background: 'var(--asphalt-50)', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s, background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink-500)'; e.currentTarget.style.background = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--asphalt-200)'; e.currentTarget.style.background = 'var(--asphalt-50)'; }}
            >
              <div style={{ color: 'var(--ink-600)', flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ font: '700 15px var(--font-sans)', color: 'var(--asphalt-900)' }}>{label}</div>
                <div style={{ font: '500 13px var(--font-sans)', color: 'var(--asphalt-500)', marginTop: 2 }}>{description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WebLogin() {
  const { login, confirmRole } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result?.requiresRoleSelection) {
        setShowRoleModal(true);
      } else {
        navigate(result.role === 'SUPER_ADMIN' ? '/super-admin' : result.role === 'ADMIN' ? '/admin' : '/home', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleSelect(role) {
    try {
      const user = await confirmRole(role);
      setShowRoleModal(false);
      navigate('/home', { replace: true });
    } catch (err) {
      setError('Role selection failed. Please try again.');
      setShowRoleModal(false);
    }
  }

  if (isDesktop) {
    return (
      <>
      {showRoleModal && <RoleSelectionModal onSelect={handleRoleSelect} />}
      <div style={{
        minHeight: '100vh',
        background: 'var(--ink-950)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)',
      }}>
        {/* Cartographic background */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <pattern id="wl-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" stroke="rgba(255,255,255,0.04)" strokeWidth="1" fill="none" />
            </pattern>
          </defs>
          <rect width="1440" height="900" fill="url(#wl-grid)" />
          <path d="M0 650 H1440" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
          <path d="M0 380 H1440" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
          <path d="M900 0 V900" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
          <path d="M300 0 V900" stroke="rgba(255,255,255,0.03)" strokeWidth="5" />
          <path d="M120 780 Q 400 600 720 450 T 1380 80" stroke="var(--voltage-400)" strokeWidth="2.5" fill="none" opacity="0.55" strokeLinecap="round" />
          <circle cx="120" cy="780" r="10" fill="white" opacity="0.5" />
          <circle cx="1380" cy="80" r="12" fill="var(--voltage-400)" stroke="var(--ink-950)" strokeWidth="3" />
        </svg>

        {/* Login card */}
        <div style={{ position: 'relative', background: '#fff', borderRadius: '20px', padding: '48px', width: '100%', maxWidth: '460px', boxShadow: '0 32px 80px rgba(7,10,38,0.5)' }}>
          <div style={{ marginBottom: 28 }}>
            <Logo textColor="var(--ink-950)" />
          </div>

          <h1 style={{ font: '700 26px/1.2 var(--font-sans)', color: 'var(--asphalt-900)', letterSpacing: '-0.02em', marginBottom: 6 }}>
            Welcome back
          </h1>
          <p style={{ font: '500 14px var(--font-sans)', color: 'var(--asphalt-500)', marginBottom: 24 }}>
            Sign in to your account.{' '}
            <Link to="/register" style={{ color: 'var(--ink-600)', fontWeight: 600, textDecoration: 'none' }}>
              New here? Create account →
            </Link>
          </p>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--danger-100)', color: 'var(--danger-700)', font: '500 13px var(--font-sans)', marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Work email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'var(--ink-500)'; e.target.style.background = '#fff'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--asphalt-200)'; e.target.style.background = 'var(--asphalt-50)'; }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                <Link to="/forgot-password" style={{ font: '600 11px var(--font-sans)', color: 'var(--ink-500)', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'var(--ink-500)'; e.target.style.background = '#fff'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--asphalt-200)'; e.target.style.background = 'var(--asphalt-50)'; }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ marginTop: 4, width: '100%', padding: '14px', borderRadius: 999, background: 'var(--ink-600)', color: '#fff', border: 'none', font: '700 15px var(--font-sans)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'opacity 0.14s', letterSpacing: '-0.005em' }}
              onMouseEnter={e => { if (!loading) e.target.style.opacity = '0.88'; }}
              onMouseLeave={e => { e.target.style.opacity = loading ? '0.7' : '1'; }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={{ font: '500 12px var(--font-mono)', color: 'var(--asphalt-400)', textAlign: 'center', marginTop: 24, letterSpacing: '.03em' }}>
            WAYPOINT · CORPORATE CARPOOL PLATFORM
          </p>
        </div>
      </div>
      </>
    );
  }

  /* ── Mobile layout ─────────────────────────────────────────────────────── */
  return (
    <>
    {showRoleModal && <RoleSelectionModal onSelect={handleRoleSelect} />}
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-0)', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans)' }}>
      {/* Dark header */}
      <div style={{ background: 'var(--ink-950)', padding: '60px 24px 32px', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle grid */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }} viewBox="0 0 390 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <pattern id="wl-m-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" stroke="var(--ink-300)" strokeWidth="0.5" fill="none" />
            </pattern>
          </defs>
          <rect width="390" height="200" fill="url(#wl-m-grid)" />
          <path d="M0 160 Q 100 120 200 100 T 390 60" stroke="var(--voltage-400)" strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round" />
        </svg>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Logo size={36} textSize={22} />
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginTop: 16, marginBottom: 4 }}>Welcome back</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Sign in to your work account</p>
        </div>
      </div>

      {/* Form area */}
      <div style={{ flex: 1, padding: '28px 24px', overflowY: 'auto' }}>
        {error && (
          <div style={{ padding: '12px 16px', background: 'var(--danger-100)', border: '1px solid var(--danger-500)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--danger-700)', marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--asphalt-700)', marginBottom: 6 }}>
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                style={{ ...inputStyle, padding: '14px 16px', fontSize: '15px', borderRadius: 'var(--radius-md)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--ink-500)'; e.target.style.background = '#fff'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--asphalt-200)'; e.target.style.background = 'var(--asphalt-50)'; }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--asphalt-700)' }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-500)', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ ...inputStyle, padding: '14px 16px', fontSize: '15px', borderRadius: 'var(--radius-md)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--ink-500)'; e.target.style.background = '#fff'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--asphalt-200)'; e.target.style.background = 'var(--asphalt-50)'; }}
              />
            </div>

            <WpButton kind="primary" size="lg" full type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </WpButton>
          </div>
        </form>

        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--asphalt-500)', marginTop: 24, marginBottom: 32 }}>
          New to Waypoint?{' '}
          <Link to="/register" style={{ color: 'var(--ink-600)', fontWeight: 600, textDecoration: 'none' }}>
            Create account
          </Link>
        </p>
      </div>
    </div>
    </>
  );
}
