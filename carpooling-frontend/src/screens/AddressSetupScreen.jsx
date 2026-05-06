import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WpButton from '../components/WpButton';
import WpIcon from '../components/WpIcon';
import AddressInput from '../components/AddressInput';
import useIsDesktop from '../hooks/useIsDesktop';
import { updateMe } from '../api/users';

export default function AddressSetupScreen() {
  const { currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  const [homeAddr, setHomeAddr] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!homeAddr?.label) { setError('Please select your home address.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await updateMe({
        homeAddress: homeAddr.label,
        homeLat: homeAddr.lat,
        homeLng: homeAddr.lng,
      });
      const d = res.data.data;
      updateUser({
        homeAddress: d.homeAddress,
        homeLat: d.homeLat,
        homeLng: d.homeLng,
      });
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const card = (
    <div style={{
      background: '#fff', borderRadius: 'var(--radius-2xl)',
      padding: isDesktop ? 40 : 28,
      boxShadow: 'var(--shadow-3)',
      border: '1px solid var(--asphalt-100)',
      width: '100%', maxWidth: 480,
    }}>
      {/* Icon */}
      <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-xl)', background: 'var(--ink-950)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <WpIcon name="home" size={26} color="var(--voltage-400)" />
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--asphalt-900)', letterSpacing: '-0.02em', marginBottom: 6 }}>
        Where do you commute from?
      </h1>
      <p style={{ fontSize: 14, color: 'var(--asphalt-500)', fontFamily: 'var(--font-sans)', lineHeight: 1.6, marginBottom: 28 }}>
        Save your home address to pre-fill rides and get better matches with colleagues on your route.
      </p>

      <div style={{ marginBottom: 20 }}>
        <AddressInput
          label="Home address"
          value={homeAddr}
          onChange={setHomeAddr}
          placeholder="Start typing your address…"
        />
      </div>

      {error && (
        <div style={{ fontSize: 13, color: 'var(--danger-600)', background: 'var(--danger-50)', border: '1px solid var(--danger-200)', borderRadius: 8, padding: '8px 12px', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <WpButton kind="accent" size="md" full onClick={handleSave} disabled={saving || !homeAddr?.label}>
        {saving ? 'Saving…' : 'Save & continue'}
      </WpButton>

      <button
        onClick={() => navigate('/home', { replace: true })}
        style={{ width: '100%', marginTop: 12, padding: '10px 0', background: 'none', border: 'none', fontSize: 13, fontWeight: 600, color: 'var(--asphalt-400)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
      >
        Skip for now
      </button>

      <p style={{ fontSize: 11, color: 'var(--asphalt-300)', fontFamily: 'var(--font-mono)', marginTop: 16, textAlign: 'center' }}>
        You can always update this from your profile.
      </p>
    </div>
  );

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        {card}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {card}
    </div>
  );
}
