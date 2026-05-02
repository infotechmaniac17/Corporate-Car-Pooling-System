import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WpButton from '../components/WpButton';

export default function RegisterScreen() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'PASSENGER',
    orgId: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/login');
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.');
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

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--asphalt-700)',
    marginBottom: '6px',
    fontFamily: 'var(--font-sans)',
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
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-sans)' }}>Create account</h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', fontFamily: 'var(--font-sans)' }}>Join your company's carpool network</p>
      </div>

      {/* Form */}
      <div style={{ flex: 1, padding: '32px 24px', overflowY: 'auto' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={handleChange('name')}
                placeholder="Jane Smith"
                required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--ink-500)'}
                onBlur={e => e.target.style.borderColor = 'var(--asphalt-200)'}
              />
            </div>
            <div>
              <label style={labelStyle}>Work Email</label>
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="you@company.com"
                required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--ink-500)'}
                onBlur={e => e.target.style.borderColor = 'var(--asphalt-200)'}
              />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={handleChange('password')}
                placeholder="••••••••"
                required
                minLength={8}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--ink-500)'}
                onBlur={e => e.target.style.borderColor = 'var(--asphalt-200)'}
              />
            </div>
            <div>
              <label style={labelStyle}>Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={handleChange('phone')}
                placeholder="+1 555 000 0000"
                required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--ink-500)'}
                onBlur={e => e.target.style.borderColor = 'var(--asphalt-200)'}
              />
            </div>
            <div>
              <label style={labelStyle}>Organization ID</label>
              <input
                type="text"
                value={form.orgId}
                onChange={handleChange('orgId')}
                placeholder="org-abc123"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--ink-500)'}
                onBlur={e => e.target.style.borderColor = 'var(--asphalt-200)'}
              />
            </div>

            {/* Role selector */}
            <div>
              <label style={labelStyle}>I am a</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['PASSENGER', 'DRIVER'].map(role => (
                  <label
                    key={role}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '14px 16px',
                      border: `1.5px solid ${form.role === role ? 'var(--ink-500)' : 'var(--asphalt-200)'}`,
                      borderRadius: 'var(--radius-md)',
                      background: form.role === role ? 'var(--ink-50)' : 'var(--asphalt-50)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: form.role === role ? 'var(--ink-700)' : 'var(--asphalt-600)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={form.role === role}
                      onChange={handleChange('role')}
                      style={{ display: 'none' }}
                    />
                    <div style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      border: `2px solid ${form.role === role ? 'var(--ink-500)' : 'var(--asphalt-300)'}`,
                      background: form.role === role ? 'var(--ink-500)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {form.role === role && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    {role === 'PASSENGER' ? 'Rider' : 'Driver'}
                  </label>
                ))}
              </div>
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
              {loading ? 'Creating account…' : 'Create account'}
            </WpButton>
          </div>
        </form>

        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--asphalt-500)', marginTop: '24px', marginBottom: '32px', fontFamily: 'var(--font-sans)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--ink-600)', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
