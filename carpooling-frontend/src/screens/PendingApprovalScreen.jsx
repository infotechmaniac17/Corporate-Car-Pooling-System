import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WpButton from '../components/WpButton';
import WpAppBar from '../components/WpAppBar';
import useIsDesktop from '../hooks/useIsDesktop';
import { getMyRoleRequests } from '../api/roleRequests';

function TimelineStep({ number, label, state }) {
  const isDone = state === 'done';
  const isActive = state === 'active';
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isDone ? 'var(--success-700)' : isActive ? 'var(--ink-600)' : 'var(--asphalt-200)',
          color: isDone || isActive ? '#fff' : 'var(--asphalt-500)',
          fontSize: 13, fontWeight: 700, flexShrink: 0,
          boxShadow: isActive ? '0 0 0 4px rgba(67,56,202,0.15)' : 'none',
        }}>
          {isDone ? '✓' : number}
        </div>
        {number < 3 && (
          <div style={{ width: 2, height: 32, background: isDone ? 'var(--success-700)' : 'var(--asphalt-200)', marginTop: 2 }} />
        )}
      </div>
      <div style={{ paddingTop: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: isDone ? 'var(--success-700)' : isActive ? 'var(--asphalt-900)' : 'var(--asphalt-400)', fontFamily: 'var(--font-sans)' }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function Content({ navigate, currentUser }) {
  const [status, setStatus] = useState(null);
  const [checking, setChecking] = useState(false);

  const handleCheckStatus = () => {
    setChecking(true);
    getMyRoleRequests()
      .then(res => {
        const requests = res.data?.data || [];
        const latest = requests[requests.length - 1];
        setStatus(latest?.status || 'PENDING');
      })
      .catch(() => setStatus('PENDING'))
      .finally(() => setChecking(false));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
          Application status
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--asphalt-900)', letterSpacing: '-0.01em', marginBottom: 4 }}>
          Under review
        </h2>
        <p style={{ fontSize: 13, color: 'var(--asphalt-500)', fontFamily: 'var(--font-sans)' }}>
          Your driver application is being verified by our team.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <TimelineStep number={1} label="Documents submitted" state="done" />
        <TimelineStep number={2} label="Under admin review" state="active" />
        <TimelineStep number={3} label="Decision" state="pending" />
      </div>

      <div style={{ background: 'var(--ink-50)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', border: '1px solid var(--asphalt-200)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 4 }}>
          Typically takes 1–2 business days
        </div>
        <div style={{ fontSize: 12, color: 'var(--asphalt-500)', lineHeight: 1.5 }}>
          You can use Waypoint as a rider while we review your application.
        </div>
      </div>

      {status && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--radius-md)',
          background: status === 'APPROVED' ? 'var(--success-100)' : status === 'REJECTED' ? 'var(--danger-100)' : 'var(--asphalt-100)',
          color: status === 'APPROVED' ? 'var(--success-700)' : status === 'REJECTED' ? 'var(--danger-700)' : 'var(--asphalt-600)',
          fontSize: 13, fontWeight: 600,
        }}>
          {status === 'APPROVED' && 'Your application was approved! Please log out and back in.'}
          {status === 'REJECTED' && 'Your application was not approved. Check your email for details.'}
          {status === 'PENDING' && 'Still under review. Check back later.'}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <WpButton kind="accent" size="md" full onClick={() => navigate('/home')}>
          Start riding →
        </WpButton>
        <WpButton kind="ghost" size="md" full onClick={handleCheckStatus} disabled={checking}>
          {checking ? 'Checking…' : 'Check status'}
        </WpButton>
      </div>
    </div>
  );
}

export default function PendingApprovalScreen() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', padding: 40, maxWidth: 440, width: '100%', boxShadow: 'var(--shadow-3)', border: '1px solid var(--asphalt-100)' }}>
          <Content navigate={navigate} currentUser={currentUser} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', paddingBottom: 40 }}>
      <div style={{ background: 'var(--ink-950)', padding: '60px 24px 32px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
          waypoint
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-sans)' }}>
          Application submitted
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontFamily: 'var(--font-sans)' }}>
          Hi {currentUser?.name?.split(' ')[0] || 'there'}, we're reviewing your driver documents.
        </p>
      </div>
      <div style={{ padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', padding: 20, boxShadow: 'var(--shadow-1)', border: '1px solid var(--asphalt-100)' }}>
          <Content navigate={navigate} currentUser={currentUser} />
        </div>
      </div>
    </div>
  );
}
