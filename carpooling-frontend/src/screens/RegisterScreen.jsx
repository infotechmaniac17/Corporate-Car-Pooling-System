import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WpButton from '../components/WpButton';
import useIsDesktop from '../hooks/useIsDesktop';
import { getAllOrganisations } from '../api/organisations';
import { sendOtp as apiSendOtp } from '../api/auth';
import DriverDocsForm from '../components/DriverDocsForm';

// ─── Module-level constants & components ─────────────────────────────────────

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
  boxSizing: 'border-box',
};

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%278%27 viewBox=%270 0 12 8%27%3E%3Cpath fill=%27%23353b48%27 d=%27M1 1l5 5 5-5%27/%3E%3C/svg%3E")',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '36px',
  cursor: 'pointer',
};

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
  color: 'var(--asphalt-500)',
  marginBottom: '6px',
  fontFamily: 'var(--font-mono)',
};

function Logo({ dark = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--voltage-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="22" height="26" viewBox="0 0 32 38" fill="none" aria-hidden="true">
          <path d="M16 2 C 8 2 2 8 2 16 c 0 9 14 20 14 20 s 14-11 14-20 c 0-8-6-14-14-14 z" fill="var(--ink-950)" />
          <circle cx="16" cy="15" r="5" fill="var(--voltage-400)" />
        </svg>
      </div>
      <span style={{ font: '800 20px/1 var(--font-sans)', letterSpacing: '-0.02em', color: dark ? '#fff' : 'var(--ink-950)' }}>waypoint</span>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder, required = false, minLength, autoComplete }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        style={inputStyle}
        onFocus={e => { e.target.style.borderColor = 'var(--ink-500)'; e.target.style.background = '#fff'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--asphalt-200)'; e.target.style.background = 'var(--asphalt-50)'; }}
      />
    </div>
  );
}

function EmailWithOtp({ email, onChange, onSendOtp, otpSent, otpSending, cooldownSec }) {
  const disabled = otpSending || cooldownSec > 0 || !isValidEmail(email);
  const btnLabel = otpSending
    ? 'Sending…'
    : cooldownSec > 0
      ? `Resend in ${cooldownSec}s`
      : otpSent
        ? 'Resend code'
        : 'Send code';
  return (
    <div>
      <label style={labelStyle}>Work Email</label>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="email"
          value={email}
          onChange={onChange}
          placeholder="you@company.com"
          required
          autoComplete="email"
          style={{ ...inputStyle, flex: 1 }}
          onFocus={e => { e.target.style.borderColor = 'var(--ink-500)'; e.target.style.background = '#fff'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--asphalt-200)'; e.target.style.background = 'var(--asphalt-50)'; }}
        />
        <button
          type="button"
          onClick={onSendOtp}
          disabled={disabled}
          style={{
            padding: '0 14px',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--ink-600)',
            background: disabled ? 'var(--asphalt-100)' : 'var(--ink-600)',
            color: disabled ? 'var(--asphalt-400)' : '#fff',
            font: '700 13px var(--font-sans)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {btnLabel}
        </button>
      </div>
    </div>
  );
}

function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || '').trim());
}

const ROLES = [
  { value: 'PASSENGER', label: 'Rider' },
  { value: 'DRIVER',    label: 'Driver' },
];

const GENDERS = [
  { value: 'MALE',                label: 'Male' },
  { value: 'FEMALE',              label: 'Female' },
  { value: 'OTHER',               label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY',   label: 'Prefer not to say' },
];

function Select({ label, value, onChange, options, placeholder, required = false }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select
        value={value}
        onChange={onChange}
        required={required}
        style={selectStyle}
        onFocus={e => { e.target.style.borderColor = 'var(--ink-500)'; e.target.style.background = '#fff'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--asphalt-200)'; e.target.style.background = 'var(--asphalt-50)'; }}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function OrgSelect({ value, onChange, organisations, loading, required = true }) {
  return (
    <div>
      <label style={labelStyle}>Organization</label>
      <select
        value={value}
        onChange={onChange}
        required={required}
        disabled={loading}
        style={selectStyle}
        onFocus={e => { e.target.style.borderColor = 'var(--ink-500)'; e.target.style.background = '#fff'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--asphalt-200)'; e.target.style.background = 'var(--asphalt-50)'; }}
      >
        <option value="">{loading ? 'Loading orgs...' : 'Select your organization'}</option>
        {organisations.map(org => (
          <option key={org.id} value={org.id}>{org.name}</option>
        ))}
      </select>
    </div>
  );
}

function RoleSelector({ role, onChange }) {
  return (
    <div>
      <label style={labelStyle}>I am a</label>
      <div style={{ display: 'flex', gap: '12px' }}>
        {ROLES.map(({ value: r, label }) => (
          <label
            key={r}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 16px',
              border: `1.5px solid ${role === r ? 'var(--ink-500)' : 'var(--asphalt-200)'}`,
              borderRadius: 'var(--radius-md)',
              background: role === r ? 'var(--ink-50)' : 'var(--asphalt-50)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              fontWeight: 600,
              color: role === r ? 'var(--ink-700)' : 'var(--asphalt-600)',
              transition: 'all 0.15s',
            }}
          >
            <input type="radio" name="role" value={r} checked={role === r} onChange={() => onChange(r)} style={{ display: 'none' }} />
            <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${role === r ? 'var(--ink-500)' : 'var(--asphalt-300)'}`, background: role === r ? 'var(--ink-500)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {role === r && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
            </div>
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  gender: '',
  role: 'PASSENGER',
  organisationId: '',
  otp: '',
};

export default function RegisterScreen() {
  const isDesktop = useIsDesktop();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [organisations, setOrganisations] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [orgsError, setOrgsError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(0);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getAllOrganisations()
      .then(res => setOrganisations(res.data.data || []))
      .catch(() => setOrgsError('Failed to load organizations'))
      .finally(() => setOrgsLoading(false));
  }, []);

  useEffect(() => {
    if (cooldownSec <= 0) return;
    const t = setTimeout(() => setCooldownSec(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldownSec]);

  const set = (field) => (e) => {
    const raw = e.target.value;
    if (field === 'email') {
      setOtpSent(false);
      setForm(prev => ({ ...prev, email: raw, otp: '' }));
      return;
    }
    const value = field === 'organisationId' ? Number(raw) : raw;
    setForm(prev => ({ ...prev, [field]: value }));
  };
  const setRole = (r) => setForm(prev => ({ ...prev, role: r }));

  const handleSendOtp = async () => {
    setError('');
    setInfo('');
    if (!isValidEmail(form.email)) {
      setError('Please enter a valid email before requesting a code.');
      return;
    }
    setOtpSending(true);
    try {
      await apiSendOtp(form.email.trim().toLowerCase());
      setOtpSent(true);
      setCooldownSec(60);
      setInfo('Verification code sent. Check your inbox.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not send code. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!form.organisationId) return setError('Please select an organisation.');
    if (!form.gender)         return setError('Please select your gender.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (!otpSent)             return setError('Please request a verification code for your email.');
    if (!form.otp || form.otp.length < 4) return setError('Please enter the verification code sent to your email.');

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim(),
        gender: form.gender,
        role: form.role,
        organisationId: form.organisationId,
        otp: form.otp.trim(),
      };
      await register(payload);
      if (form.role === 'DRIVER') {
        setStep(2);
        setLoading(false);
        return;
      }
      navigate('/setup-address');
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderFormFields = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Field label="Full Name"    value={form.name}  onChange={set('name')}  placeholder="Jane Smith"        required autoComplete="name" />
        <Field label="Phone Number" type="tel" value={form.phone} onChange={set('phone')} placeholder="+1 555 000 0000" required autoComplete="tel" />
      </div>

      <EmailWithOtp
        email={form.email}
        onChange={set('email')}
        onSendOtp={handleSendOtp}
        otpSent={otpSent}
        otpSending={otpSending}
        cooldownSec={cooldownSec}
      />

      {otpSent && (
        <Field
          label="Verification Code"
          type="text"
          value={form.otp}
          onChange={set('otp')}
          placeholder="6-digit code"
          required
          autoComplete="one-time-code"
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <OrgSelect value={form.organisationId} onChange={set('organisationId')} organisations={organisations} loading={orgsLoading} required />
        <Select label="Gender" value={form.gender} onChange={set('gender')} options={GENDERS} placeholder="Select" required />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Field label="Password"         type="password" value={form.password}        onChange={set('password')}        placeholder="••••••••" required minLength={8} autoComplete="new-password" />
        <Field label="Confirm Password" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="••••••••" required minLength={8} autoComplete="new-password" />
      </div>

      <RoleSelector role={form.role} onChange={setRole} />
    </>
  );

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--ink-950)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-sans)' }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <pattern id="rg-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" stroke="rgba(255,255,255,0.04)" strokeWidth="1" fill="none" />
            </pattern>
          </defs>
          <rect width="1440" height="900" fill="url(#rg-grid)" />
          <path d="M0 650 H1440" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
          <path d="M900 0 V900" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
          <path d="M120 780 Q 400 600 720 450 T 1380 80" stroke="var(--voltage-400)" strokeWidth="2.5" fill="none" opacity="0.45" strokeLinecap="round" />
        </svg>

        <div style={{ position: 'relative', background: '#fff', borderRadius: '20px', padding: '48px', width: '100%', maxWidth: '640px', boxShadow: '0 32px 80px rgba(7,10,38,0.5)' }}>
          <div style={{ marginBottom: '28px' }}>
            <Logo />
          </div>

          {step === 1 ? (
            <>
              <h1 style={{ font: '700 26px/1.2 var(--font-sans)', color: 'var(--asphalt-900)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                Create account
              </h1>
              <p style={{ font: '500 14px var(--font-sans)', color: 'var(--asphalt-500)', marginBottom: '28px' }}>
                Join your company's carpool network.{' '}
                <Link to="/login" style={{ color: 'var(--ink-600)', fontWeight: 600, textDecoration: 'none' }}>Sign in instead →</Link>
              </p>
              {info && <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--ink-50)', color: 'var(--ink-700)', font: '500 13px var(--font-sans)', marginBottom: '16px' }}>{info}</div>}
              {error && <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--danger-100)', color: 'var(--danger-700)', font: '500 13px var(--font-sans)', marginBottom: '20px' }}>{error}</div>}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {renderFormFields()}
                <button
                  type="submit"
                  disabled={loading || orgsLoading}
                  style={{ marginTop: '4px', width: '100%', padding: '14px', borderRadius: 999, background: 'var(--ink-600)', color: '#fff', border: 'none', font: '700 15px var(--font-sans)', cursor: (loading || orgsLoading) ? 'not-allowed' : 'pointer', opacity: (loading || orgsLoading) ? 0.7 : 1, transition: 'opacity 0.14s', letterSpacing: '-0.005em' }}
                >
                  {loading ? 'Creating account…' : form.role === 'DRIVER' ? 'Continue →' : 'Create account'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', font: '600 13px var(--font-sans)', color: 'var(--ink-600)', padding: 0 }}>← Back</button>
                <div style={{ font: '500 12px var(--font-mono)', color: 'var(--asphalt-400)' }}>Step 2 of 2 — Driver documents</div>
              </div>
              <h1 style={{ font: '700 22px/1.2 var(--font-sans)', color: 'var(--asphalt-900)', letterSpacing: '-0.02em', marginBottom: '6px' }}>Driver verification</h1>
              <p style={{ font: '500 13px var(--font-sans)', color: 'var(--asphalt-500)', marginBottom: '24px' }}>Upload your documents for admin review. This typically takes 1–2 business days.</p>
              <DriverDocsForm onSuccess={() => navigate('/pending-approval')} />
            </>
          )}

          <p style={{ font: '500 12px var(--font-mono)', color: 'var(--asphalt-400)', textAlign: 'center', marginTop: '24px', letterSpacing: '.03em' }}>
            WAYPOINT · CORPORATE CARPOOL PLATFORM
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-0)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'var(--ink-950)', padding: '60px 24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <svg width="32" height="32" viewBox="0 0 44 44" fill="none">
            <rect width="44" height="44" rx="14" fill="var(--voltage-400)" />
            <path d="M22 8C16.477 8 12 12.477 12 18C12 24 22 36 22 36C22 36 32 24 32 18C32 12.477 27.523 8 22 8Z" fill="var(--ink-950)" />
            <circle cx="22" cy="18" r="4" fill="var(--voltage-400)" />
          </svg>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em' }}>waypoint</span>
        </div>
        {step === 1 ? (
          <>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-sans)' }}>Create account</h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', fontFamily: 'var(--font-sans)' }}>Join your company's carpool network</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>STEP 2 OF 2</div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-sans)' }}>Driver documents</h1>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', fontFamily: 'var(--font-sans)' }}>Upload for admin review · 1–2 business days</p>
          </>
        )}
      </div>

      <div style={{ flex: 1, padding: '32px 24px', overflowY: 'auto' }}>
        {step === 1 ? (
          <>
            {orgsError && (
              <div style={{ padding: '12px 16px', background: 'var(--warning-100)', border: '1px solid var(--warning-500)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--warning-700)', marginBottom: 20 }}>
                {orgsError}
              </div>
            )}
            {info && (
              <div style={{ padding: '12px 16px', background: 'var(--ink-50)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--ink-700)', marginBottom: 16, fontFamily: 'var(--font-sans)' }}>
                {info}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {renderFormFields()}
                {error && (
                  <div style={{ padding: '12px 16px', background: 'var(--danger-100)', border: '1px solid var(--danger-500)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--danger-700)', fontFamily: 'var(--font-sans)' }}>
                    {error}
                  </div>
                )}
                <WpButton kind="primary" size="lg" full type="submit" disabled={loading || orgsLoading}>
                  {loading ? 'Creating account…' : form.role === 'DRIVER' ? 'Continue →' : 'Create account'}
                </WpButton>
              </div>
            </form>
            <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--asphalt-500)', marginTop: '24px', marginBottom: '32px', fontFamily: 'var(--font-sans)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--ink-600)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </>
        ) : (
          <>
            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', font: '600 13px var(--font-sans)', color: 'var(--ink-600)', padding: '0 0 16px', display: 'block' }}>← Back to info</button>
            <DriverDocsForm onSuccess={() => navigate('/pending-approval')} />
          </>
        )}
      </div>
    </div>
  );
}
