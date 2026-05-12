import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import WpIcon from '../components/WpIcon';
import useIsDesktop from '../hooks/useIsDesktop';
import { trigger as triggerSos } from '../api/sos';
import { getGuardians } from '../api/users';


export default function SosScreen({ rideId, onCancel }) {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [guardians, setGuardians] = useState([]);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdRef = useRef(null);
  const holdStart = useRef(null);

  const resolvedRideId = rideId;

  useEffect(() => {
    if (resolvedRideId) triggerSos(resolvedRideId).catch(() => {});
    getGuardians()
      .then(res => setGuardians(res.data?.length ? res.data : mockGuardians))
      .catch(() => setGuardians([]));
  }, [resolvedRideId]);

  const handleHoldStart = () => {
    holdStart.current = Date.now();
    holdRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStart.current;
      const progress = Math.min(elapsed / 3000, 1);
      setHoldProgress(progress);
      if (progress >= 1) {
        clearInterval(holdRef.current);
        if (onCancel) onCancel();
        else navigate(-1);
      }
    }, 50);
  };

  const handleHoldEnd = () => {
    clearInterval(holdRef.current);
    setHoldProgress(0);
  };

  const PulseRings = ({ count = 3, scale = 1 }) => (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      {Array.from({ length: count }, (_, i) => i + 1).map(i => (
        <div key={i} style={{ position: 'absolute', width: `${i * 160 * scale}px`, height: `${i * 160 * scale}px`, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', animation: `pulse-ring ${1.2 + i * 0.4}s ease-out infinite`, animationDelay: `${i * 0.3}s` }} />
      ))}
    </div>
  );

  const ContactsCard = () => (
    <div style={{ width: '100%', background: 'rgba(255,255,255,0.12)', borderRadius: 'var(--radius-xl)', padding: '16px', border: '1px solid rgba(255,255,255,0.18)' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)', marginBottom: '12px' }}>
        Notified contacts
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {guardians.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '8px 0' }}>
            No guardian contacts set up.<br />Add contacts in your profile.
          </div>
        ) : guardians.map(g => (
          <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WpIcon name="user" size={18} color="rgba(255,255,255,0.8)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', fontFamily: 'var(--font-sans)' }}>{g.name}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>{g.phone}</div>
            </div>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--voltage-400)' }} />
          </div>
        ))}
      </div>
    </div>
  );

  const CancelButton = () => (
    <div style={{ width: '100%' }}>
      <div
        style={{ width: '100%', height: '56px', borderRadius: 'var(--radius-pill)', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', overflow: 'hidden', position: 'relative', cursor: 'pointer', userSelect: 'none' }}
        onMouseDown={handleHoldStart}
        onMouseUp={handleHoldEnd}
        onMouseLeave={handleHoldEnd}
        onTouchStart={handleHoldStart}
        onTouchEnd={handleHoldEnd}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.25)', width: `${holdProgress * 100}%`, transition: holdProgress === 0 ? 'width 0.2s ease' : 'none' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-sans)', gap: '8px' }}>
          <WpIcon name="x" size={18} color="#fff" />
          Hold to cancel SOS
        </div>
      </div>
      <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
        Hold for 3 seconds to cancel
      </p>
    </div>
  );

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--danger-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <PulseRings count={4} scale={1.2} />

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '520px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          {/* Shield */}
          <div style={{ width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'sos-pulse 2s ease-in-out infinite' }}>
            <WpIcon name="shield" size={58} color="#fff" stroke={1.5} />
          </div>

          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em', marginBottom: '8px' }}>SOS Activated</h1>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-sans)' }}>Sharing live location with your contacts</p>
          </div>

          {/* Ride ref */}
          {resolvedRideId && (
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', padding: '8px 20px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.7)', letterSpacing: '.06em' }}>RIDE #{resolvedRideId}</span>
            </div>
          )}

          <ContactsCard />
          <CancelButton />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--danger-700)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px', position: 'relative', overflow: 'hidden' }}>
      <PulseRings />
      <div style={{ height: '80px' }} />

      <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', animation: 'sos-pulse 2s ease-in-out infinite', position: 'relative', zIndex: 1 }}>
        <WpIcon name="shield" size={52} color="#fff" stroke={1.5} />
      </div>

      <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-sans)', textAlign: 'center', marginBottom: '8px', position: 'relative', zIndex: 1 }}>SOS Activated</h1>
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-sans)', textAlign: 'center', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
        Sharing live location with your contacts
      </p>

      <div style={{ width: '100%', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
        <ContactsCard />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <CancelButton />
      </div>
    </div>
  );
}
