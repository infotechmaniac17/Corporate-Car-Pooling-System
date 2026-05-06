import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WpAppBar from '../components/WpAppBar';
import WpButton from '../components/WpButton';
import WpIcon from '../components/WpIcon';
import WpAvatar from '../components/WpAvatar';
import useIsDesktop from '../hooks/useIsDesktop';
import { submitPassengerRequest } from '../api/roleRequests';
import { getUser } from '../api/users';

function Field({ label, value, onChange, type = 'text', readOnly = false }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--asphalt-500)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange && onChange(e.target.value)}
        readOnly={readOnly}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
          border: '1.5px solid var(--asphalt-200)', fontSize: 14, fontFamily: 'var(--font-sans)',
          color: readOnly ? 'var(--asphalt-400)' : 'var(--asphalt-900)',
          background: readOnly ? 'var(--asphalt-50)' : '#fff',
          outline: 'none', boxSizing: 'border-box',
        }}
        onFocus={e => { if (!readOnly) e.target.style.borderColor = 'var(--ink-600)'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--asphalt-200)'; }}
      />
    </div>
  );
}

export default function ProfileScreen({ activityState }) {
  const { currentUser, logout, updateUser, isBothRole, activeMode, setActiveMode } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const hasInProgressTrip = activityState?.hasInProgressTrip ?? false;

  const [form, setForm] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    pickupLocation: currentUser?.pickupLocation || '',
    dropLocation: currentUser?.dropLocation || '',
  });
  const [saved, setSaved] = useState(false);
  const [riderEnabled, setRiderEnabled] = useState(false);
  const [riderLoading, setRiderLoading] = useState(false);
  const [riderModalOpen, setRiderModalOpen] = useState(false);
  const [riderModalError, setRiderModalError] = useState('');

  useEffect(() => {
    if (!currentUser?.id) return;
    getUser(currentUser.id)
      .then(res => {
        const { role, driverStatus, passengerStatus, name, phone } = res.data.data;
        updateUser({ role, driverStatus, passengerStatus, name, phone });
        setForm(f => ({
          ...f,
          name: name || f.name,
          phone: phone || f.phone,
        }));
      })
      .catch(() => {});
  }, []);

  const initials = (form.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const roleLabel = currentUser?.role === 'DRIVER' ? 'Driver' : currentUser?.role === 'BOTH' ? 'Rider & Driver' : 'Rider';

  const handleSave = () => {
    const updated = { ...currentUser, ...form };
    localStorage.setItem('wp_user', JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const MobileModeSwitcher = () => {
    if (!isBothRole) return null;
    const isDriver = activeMode === 'driver';
    const pillStyle = (selected) => ({
      flex: 1, padding: '8px 0', borderRadius: 999, border: 'none',
      cursor: hasInProgressTrip ? 'not-allowed' : 'pointer',
      background: selected ? 'var(--ink-950)' : 'transparent',
      color: selected ? '#fff' : 'var(--asphalt-500)',
      fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-sans)',
      transition: 'all 0.15s',
      opacity: hasInProgressTrip && !selected ? 0.4 : 1,
    });
    return (
      <div style={{ marginBottom: 20, padding: '14px 16px', background: 'var(--asphalt-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--asphalt-100)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
          Active mode
        </div>
        {hasInProgressTrip && (
          <div style={{ fontSize: 12, color: 'var(--warn-700, #92400e)', background: 'var(--warn-50, #fffbeb)', border: '1px solid var(--warn-200, #fde68a)', borderRadius: 8, padding: '6px 10px', marginBottom: 8 }}>
            Cannot switch during an active trip.
          </div>
        )}
        <div style={{ display: 'flex', background: 'var(--asphalt-100)', borderRadius: 999, padding: 3 }}>
          <button style={pillStyle(!isDriver)} onClick={() => !hasInProgressTrip && setActiveMode('rider')}>Rider</button>
          <button style={pillStyle(isDriver)} onClick={() => !hasInProgressTrip && setActiveMode('driver')}>Driver</button>
        </div>
      </div>
    );
  };

  const FormSection = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <MobileModeSwitcher />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '20px 0', marginBottom: 24, borderBottom: '1px solid var(--asphalt-100)',
      }}>
        <WpAvatar initials={initials} size={56} tone="ink" />
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--asphalt-900)', letterSpacing: '-0.01em' }}>
            {form.name || 'User'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>
            {currentUser?.email} · {roleLabel}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--asphalt-400)', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
        Personal info
      </div>
      <Field label="Full name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
      <Field label="Email" value={currentUser?.email || ''} readOnly />
      <Field label="Phone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} type="tel" />

      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--asphalt-400)', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-mono)', marginBottom: 16, marginTop: 8 }}>
        Commute defaults
      </div>
      <Field label="Home / pickup" value={form.pickupLocation} onChange={v => setForm(f => ({ ...f, pickupLocation: v }))} />
      <Field label="Office / drop" value={form.dropLocation} onChange={v => setForm(f => ({ ...f, dropLocation: v }))} />

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <WpButton kind="accent" size="md" full onClick={handleSave}>
          {saved ? <><WpIcon name="check" size={16} color="var(--ink-950)" /> Saved</> : 'Save changes'}
        </WpButton>
      </div>

      <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--asphalt-100)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--asphalt-400)', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>
          Role access
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--asphalt-700)', fontFamily: 'var(--font-sans)' }}>Rider</span>
            {currentUser?.passengerStatus === 'APPROVED' ? (
              <span style={{ padding: '3px 10px', borderRadius: 999, background: 'var(--success-100)', color: 'var(--success-700)', fontSize: 11, fontWeight: 700 }}>✓ Active</span>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--asphalt-400)' }}>Not enabled</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--asphalt-700)', fontFamily: 'var(--font-sans)' }}>Driver</span>
            {currentUser?.driverStatus === 'APPROVED' && (
              <span style={{ padding: '3px 10px', borderRadius: 999, background: 'var(--success-100)', color: 'var(--success-700)', fontSize: 11, fontWeight: 700 }}>✓ Verified</span>
            )}
            {currentUser?.driverStatus === 'PENDING' && (
              <button onClick={() => navigate('/pending-approval')} style={{ padding: '3px 10px', borderRadius: 999, background: 'var(--warning-100)', color: 'var(--warning-700)', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                Pending review →
              </button>
            )}
            {(!currentUser?.driverStatus || currentUser?.driverStatus === 'NONE' || currentUser?.driverStatus === 'REJECTED') && (
              <button onClick={() => navigate('/become-driver')} style={{ padding: '3px 10px', borderRadius: 999, background: 'var(--ink-50)', color: 'var(--ink-700)', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                Apply →
              </button>
            )}
          </div>
          {currentUser?.driverStatus === 'APPROVED' && currentUser?.passengerStatus !== 'APPROVED' && (
            <WpButton
              kind="secondary" size="sm"
              onClick={() => {
                setRiderLoading(true);
                setRiderModalError('');
                submitPassengerRequest()
                  .then(() => {
                    setRiderEnabled(true);
                    updateUser({ passengerStatus: 'APPROVED', role: 'BOTH' });
                    setRiderModalOpen(true);
                  })
                  .catch(err => {
                    setRiderModalError(err?.response?.data?.message || 'Could not enable rider access. Please try again.');
                    setRiderModalOpen(true);
                  })
                  .finally(() => setRiderLoading(false));
              }}
              disabled={riderLoading || riderEnabled}
            >
              {riderEnabled ? '✓ Rider access enabled' : riderLoading ? 'Enabling…' : 'Enable rider mode'}
            </WpButton>
          )}
        </div>
      </div>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--asphalt-100)' }}>
        <button
          onClick={logout}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--danger-600)', fontFamily: 'var(--font-sans)', padding: 0 }}
        >
          <WpIcon name="x" size={16} color="var(--danger-600)" />
          Sign out
        </button>
      </div>
    </div>
  );

  const RiderAccessModal = () => {
    if (!riderModalOpen) return null;
    const isError = !!riderModalError;
    const handleClose = () => {
      setRiderModalOpen(false);
    };
    return (
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(7,10,38,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20, fontFamily: 'var(--font-sans)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: '#fff', borderRadius: 20, padding: 36,
            width: '100%', maxWidth: 420, textAlign: 'center',
            boxShadow: '0 32px 80px rgba(7,10,38,0.5)',
          }}
        >
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: isError ? 'var(--danger-100)' : 'var(--success-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <WpIcon
              name={isError ? 'x' : 'check'}
              size={36}
              color={isError ? 'var(--danger-700)' : 'var(--success-700)'}
            />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--asphalt-900)', marginBottom: 10, letterSpacing: '-0.01em' }}>
            {isError ? 'Could not enable rider access' : 'Rider access enabled!'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--asphalt-500)', lineHeight: 1.6, marginBottom: 28 }}>
            {isError
              ? riderModalError
              : "You can now book rides as a passenger in addition to driving. Your account now has both roles active."}
          </p>
          <button
            onClick={handleClose}
            style={{
              padding: '13px 32px', borderRadius: 999,
              background: 'var(--ink-600)', color: '#fff', border: 'none',
              font: '700 14px var(--font-sans)', cursor: 'pointer',
              minWidth: 160,
            }}
          >
            {isError ? 'Close' : 'Continue'}
          </button>
        </div>
      </div>
    );
  };

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)' }}>
        <div style={{ padding: '32px 40px 0' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--asphalt-900)', letterSpacing: '-0.02em' }}>Profile</h1>
          <p style={{ fontSize: 13, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>Manage your account and commute defaults</p>
        </div>
        <div style={{ padding: '24px 40px', maxWidth: 520 }}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', padding: 28, boxShadow: 'var(--shadow-2)', border: '1px solid var(--asphalt-100)' }}>
            <FormSection />
          </div>
        </div>
        <RiderAccessModal />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', paddingBottom: 40 }}>
      <WpAppBar title="Profile" onBack={() => navigate(-1)} dark />
      <div style={{ padding: '16px' }}>
        <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', padding: 20, boxShadow: 'var(--shadow-1)', border: '1px solid var(--asphalt-100)' }}>
          <FormSection />
        </div>
      </div>
      <RiderAccessModal />
    </div>
  );
}
