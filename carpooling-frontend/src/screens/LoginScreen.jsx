import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WpButton from '../components/WpButton';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/home');
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    fontSize: '15px',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    color: 'var(--asphalt-900)',
    background: 'var(--asphalt-50)',
    border: '1.5px solid var(--asphalt-200)',
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-0)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'var(--ink-950)', padding: '60px 24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <svg width="32" height="32" viewBox="0 0 44 44" fill="none">
            <rect width="44" height="44" rx="14" fill="var(--voltage-400)" />
            <path d="M22 8C16.477 8 12 12.477 12 18C12 24 22 36 22 36C22 36 32 24 32 18C32 12.477 27.523 8 22 8Z" fill="var(--ink-950)" />
            <circle cx="22" cy="18" r="4" fill="var(--voltage-400)" />
          </svg>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em' }}>waypoint</span>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-sans)' }}>Welcome back</h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', fontFamily: 'var(--font-sans)' }}>Sign in to your work account</p>
      </div>

      {/* Form */}
      <div style={{ flex: 1, padding: '32px 24px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--asphalt-700)', marginBottom: '6px', fontFamily: 'var(--font-sans)' }}>
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--ink-500)'}
                onBlur={e => e.target.style.borderColor = 'var(--asphalt-200)'}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--asphalt-700)', marginBottom: '6px', fontFamily: 'var(--font-sans)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--ink-500)'}
                onBlur={e => e.target.style.borderColor = 'var(--asphalt-200)'}
              />
            </div>

            {error && (
              <div style={{
                padding: '12px 16px',
                background: 'var(--danger-100)',
                border: '1px solid var(--danger-500)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                color: 'var(--danger-700)',
                fontFamily: 'var(--font-sans)',
              }}>
                {error}
              </div>
            )}

            <WpButton kind="primary" size="lg" full type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </WpButton>
          </div>
        </form>

        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--asphalt-500)', marginTop: '24px', fontFamily: 'var(--font-sans)' }}>
          New to Waypoint?{' '}
          <Link to="/register" style={{ color: 'var(--ink-600)', fontWeight: 600, textDecoration: 'none' }}>
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
