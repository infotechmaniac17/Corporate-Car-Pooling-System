import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import WpButton from '../components/WpButton';
import WpIcon from '../components/WpIcon';
import useIsDesktop from '../hooks/useIsDesktop';
import { resetPassword } from '../api/auth';

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

export default function ResetPasswordScreen() {
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!token) {
      setError('Invalid or missing reset token. Please request a new link.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset link is invalid or has expired. Please request a new one.');
    } finally {
      setLoading(false);
    }
  }

  const SuccessState = () => (
    <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--success-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <WpIcon name="check" size={30} color="var(--success-700)" />
      </div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--asphalt-900)', fontFamily: 'var(--font-sans)', marginBottom: 10 }}>
        Password updated
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--asphalt-500)', fontFamily: 'var(--font-sans)', lineHeight: 1.6, marginBottom: 28 }}>
        Your password has been changed successfully. You can now sign in with your new password.
      </p>
      <Link to="/login" style={{ display: 'inline-block', padding: '13px 32px', borderRadius: 999, background: 'var(--ink-600)', color: '#fff', font: '700 14px var(--font-sans)', textDecoration: 'none' }}>
        Sign in
      </Link>
    </div>
  );

  const formContent = (
    <>
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--danger-100)', color: 'var(--danger-700)', font: '500 13px var(--font-sans)', marginBottom: 20 }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', font: '600 11px var(--font-mono)', color: 'var(--asphalt-500)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            New password
          </label>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = 'var(--ink-500)'; e.target.style.background = '#fff'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--asphalt-200)'; e.target.style.background = 'var(--asphalt-50)'; }}
          />
        </div>
        <div>
          <label style={{ display: 'block', font: '600 11px var(--font-mono)', color: 'var(--asphalt-500)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            Confirm new password
          </label>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Repeat your new password"
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
          {loading ? 'Updating…' : 'Set new password'}
        </button>
      </form>
    </>
  );

  if (isDesktop) {
    return (
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
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <pattern id="rp-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" stroke="rgba(255,255,255,0.04)" strokeWidth="1" fill="none" />
            </pattern>
          </defs>
          <rect width="1440" height="900" fill="url(#rp-grid)" />
          <path d="M120 780 Q 400 600 720 450 T 1380 80" stroke="var(--voltage-400)" strokeWidth="2.5" fill="none" opacity="0.4" strokeLinecap="round" />
        </svg>

        <div style={{ position: 'relative', background: '#fff', borderRadius: '20px', padding: '48px', width: '100%', maxWidth: '440px', boxShadow: '0 32px 80px rgba(7,10,38,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--voltage-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="26" viewBox="0 0 32 38" fill="none" aria-hidden="true">
                <path d="M16 2 C 8 2 2 8 2 16 c 0 9 14 20 14 20 s 14-11 14-20 c 0-8-6-14-14-14 z" fill="var(--ink-950)" />
                <circle cx="16" cy="15" r="5" fill="var(--voltage-400)" />
              </svg>
            </div>
            <span style={{ font: '800 20px/1 var(--font-sans)', letterSpacing: '-0.02em', color: 'var(--ink-950)' }}>waypoint</span>
          </div>

          {done ? <SuccessState /> : (
            <>
              <h1 style={{ font: '700 26px/1.2 var(--font-sans)', color: 'var(--asphalt-900)', letterSpacing: '-0.02em', marginBottom: 6 }}>
                Set new password
              </h1>
              <p style={{ font: '500 14px var(--font-sans)', color: 'var(--asphalt-500)', marginBottom: 28 }}>
                Choose a strong password for your account.{' '}
                <Link to="/login" style={{ color: 'var(--ink-600)', fontWeight: 600, textDecoration: 'none' }}>Back to sign in →</Link>
              </p>
              {formContent}
            </>
          )}

          <p style={{ font: '500 12px var(--font-mono)', color: 'var(--asphalt-400)', textAlign: 'center', marginTop: 24, letterSpacing: '.03em' }}>
            WAYPOINT · CORPORATE CARPOOL PLATFORM
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-0)', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans)' }}>
      <div style={{ background: 'var(--ink-950)', padding: '60px 24px 32px', position: 'relative', overflow: 'hidden' }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }} viewBox="0 0 390 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <pattern id="rp-m-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" stroke="var(--ink-300)" strokeWidth="0.5" fill="none" />
            </pattern>
          </defs>
          <rect width="390" height="200" fill="url(#rp-m-grid)" />
          <path d="M0 160 Q 100 120 200 100 T 390 60" stroke="var(--voltage-400)" strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round" />
        </svg>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <button onClick={() => navigate('/login')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontFamily: 'var(--font-sans)', fontWeight: 600, padding: 0, marginBottom: 20 }}>
            <WpIcon name="chevron-left" size={16} color="rgba(255,255,255,0.6)" /> Back
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: 4 }}>Set new password</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Choose a strong password for your account</p>
        </div>
      </div>

      <div style={{ flex: 1, padding: '28px 24px' }}>
        {done ? <SuccessState /> : formContent}
        {!done && (
          <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--asphalt-500)', marginTop: 24 }}>
            Remember it?{' '}
            <Link to="/login" style={{ color: 'var(--ink-600)', fontWeight: 600, textDecoration: 'none' }}>
              Back to sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
