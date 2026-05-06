import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useIsDesktop from '../hooks/useIsDesktop';
import WpIcon from '../components/WpIcon';
import DriverDocsForm from '../components/DriverDocsForm';

export default function DriverApplicationScreen() {
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const status = currentUser?.driverStatus;
  const isReapplying = status === 'REJECTED';

  const handleSuccess = () => navigate('/pending-approval');

  if (status === 'PENDING') {
    return (
      <div style={{ padding: 32, textAlign: 'center', fontFamily: 'var(--font-sans)' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--asphalt-900)', marginBottom: 8 }}>
          Application already submitted
        </h2>
        <p style={{ fontSize: 14, color: 'var(--asphalt-500)', marginBottom: 20 }}>
          Your driver verification is currently under review.
        </p>
        <button
          onClick={() => navigate('/pending-approval')}
          style={{ padding: '12px 24px', borderRadius: 999, background: 'var(--ink-600)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
        >
          View status
        </button>
      </div>
    );
  }

  if (status === 'APPROVED') {
    return (
      <div style={{ padding: 32, textAlign: 'center', fontFamily: 'var(--font-sans)' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--asphalt-900)', marginBottom: 8 }}>
          You're already a verified driver
        </h2>
        <button
          onClick={() => navigate('/driver/inbox')}
          style={{ padding: '12px 24px', borderRadius: 999, background: 'var(--ink-600)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', marginTop: 12 }}
        >
          Go to driver inbox
        </button>
      </div>
    );
  }

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100%', padding: '32px 40px', fontFamily: 'var(--font-sans)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--asphalt-500)', fontSize: 14, fontWeight: 600, padding: 0, marginBottom: 16 }}
          >
            <WpIcon name="chevron-left" size={16} color="var(--asphalt-500)" /> Back
          </button>

          <div style={{ background: '#fff', borderRadius: 16, padding: 40, boxShadow: '0 4px 24px rgba(7,10,38,0.06)', border: '1px solid var(--asphalt-100)' }}>
            <div style={{ font: '500 12px var(--font-mono)', color: 'var(--asphalt-400)', marginBottom: 6 }}>
              {isReapplying ? 'RE-APPLY' : 'BECOME A DRIVER'}
            </div>
            <h1 style={{ font: '700 26px/1.2 var(--font-sans)', color: 'var(--asphalt-900)', letterSpacing: '-0.02em', marginBottom: 6 }}>
              Driver verification
            </h1>
            <p style={{ font: '500 14px var(--font-sans)', color: 'var(--asphalt-500)', marginBottom: 28 }}>
              {isReapplying
                ? 'Your previous application was rejected. Resubmit corrected documents below.'
                : 'Upload your documents for admin review. This typically takes 1–2 business days.'}
            </p>

            <DriverDocsForm onSuccess={handleSuccess} submitLabel="Submit for verification" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-0)', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans)' }}>
      <div style={{ background: 'var(--ink-950)', padding: '60px 24px 32px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, padding: 0, marginBottom: 20 }}
        >
          <WpIcon name="chevron-left" size={16} color="rgba(255,255,255,0.6)" /> Back
        </button>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
          {isReapplying ? 'RE-APPLY' : 'BECOME A DRIVER'}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Driver documents</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
          Upload for admin review · 1–2 business days
        </p>
      </div>

      <div style={{ flex: 1, padding: '32px 24px', overflowY: 'auto' }}>
        <DriverDocsForm onSuccess={handleSuccess} submitLabel="Submit for verification" />
      </div>
    </div>
  );
}
