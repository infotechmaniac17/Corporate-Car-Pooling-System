import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import WpMap from '../components/WpMap';
import WpPill from '../components/WpPill';
import WpAvatar from '../components/WpAvatar';
import WpButton from '../components/WpButton';
import WpIcon from '../components/WpIcon';
import useIsDesktop from '../hooks/useIsDesktop';
import { getLatest } from '../api/tracking';
import { getPartners } from '../api/chat';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2);
}

export default function TrackingScreen({ rideId, onSos, onChat, onBack }) {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [tracking, setTracking] = useState(null);
  const [driverPos, setDriverPos] = useState(0.2);
  const [partner, setPartner] = useState(null);
  const intervalRef = useRef(null);

  const resolvedRideId = rideId;

  useEffect(() => {
    const fetchTracking = () => {
      if (!resolvedRideId) return;
      getLatest(resolvedRideId)
        .then(res => {
          setTracking(res.data);
          if (res.data?.progressFraction != null) setDriverPos(res.data.progressFraction);
        })
        .catch(() => {});
    };

    fetchTracking();
    intervalRef.current = setInterval(fetchTracking, 5000);

    if (resolvedRideId) {
      getPartners(resolvedRideId)
        .then(res => {
          const list = res.data?.data || res.data || [];
          if (list.length > 0) setPartner(list[0]);
        })
        .catch(() => {});
    }
    return () => clearInterval(intervalRef.current);
  }, [resolvedRideId]);

  const driverName = partner?.name || tracking?.driverName || 'Driver';
  const partnerPhone = partner?.phone || tracking?.driverPhone || '';
  const vehicleInfo = tracking?.vehiclePlate || tracking?.vehicle || 'KA 01 AB 1234';
  const etaMin = tracking?.etaMinutes ?? 8;

  if (isDesktop) {
    return (
      <div style={{ height: '100vh', display: 'flex', overflow: 'hidden' }}>
        {/* Left info panel */}
        <div style={{ width: 360, flexShrink: 0, background: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '2px 0 16px rgba(13,18,64,0.08)', zIndex: 10 }}>
          {/* Header */}
          <div style={{ padding: '20px', borderBottom: '1px solid var(--asphalt-100)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={onBack || (() => navigate(-1))}
              style={{ width: 36, height: 36, borderRadius: 'var(--radius-pill)', background: 'var(--asphalt-100)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--asphalt-700)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--asphalt-900)', fontFamily: 'var(--font-sans)' }}>Live Tracking</div>
              <div style={{ fontSize: '11px', color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>Ride #{resolvedRideId || '—'}</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <WpPill tone="live">En route</WpPill>
            </div>
          </div>

          {/* ETA bar */}
          <div style={{ padding: '20px', background: 'var(--ink-950)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--voltage-400)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{etaMin}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>MIN AWAY</div>
            </div>
            <div style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', fontFamily: 'var(--font-sans)' }}>Arriving soon</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>{vehicleInfo}</div>
            </div>
          </div>

          {/* Driver card */}
          <div style={{ padding: '20px', borderBottom: '1px solid var(--asphalt-100)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginBottom: '12px' }}>Your driver</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <WpAvatar initials={getInitials(driverName)} size={54} tone="ink" />
              <div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--asphalt-900)', fontFamily: 'var(--font-sans)' }}>{driverName}</div>
                <div style={{ fontSize: '13px', color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {tracking?.driverRating ? `★ ${tracking.driverRating}` : '★ 4.8'} · Your driver
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ padding: '20px', borderBottom: '1px solid var(--asphalt-100)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--asphalt-500)', fontFamily: 'var(--font-sans)' }}>Route progress</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-600)', fontFamily: 'var(--font-mono)' }}>{Math.round(driverPos * 100)}%</span>
            </div>
            <div style={{ height: 6, background: 'var(--asphalt-100)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${driverPos * 100}%`, background: 'var(--ink-600)', borderRadius: 3, transition: 'width 0.8s ease' }} />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={onChat || (() => navigate(`/chat/${resolvedRideId}`))}
                style={{ padding: '13px 16px', borderRadius: 'var(--radius-lg)', background: 'var(--ink-50)', border: '1.5px solid var(--ink-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--ink-700)', fontFamily: 'var(--font-sans)', cursor: 'pointer' }}
              >
                <WpIcon name="message" size={18} color="var(--ink-600)" /> Chat
              </button>
              <a
                href={partnerPhone ? `tel:${partnerPhone}` : undefined}
                onClick={e => { if (!partnerPhone) e.preventDefault(); }}
                style={{ padding: '13px 16px', borderRadius: 'var(--radius-lg)', background: partnerPhone ? 'var(--success-100)' : 'var(--asphalt-100)', border: `1.5px solid ${partnerPhone ? 'rgba(24,169,87,0.2)' : 'var(--asphalt-200)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: partnerPhone ? 'var(--success-700)' : 'var(--asphalt-400)', fontFamily: 'var(--font-sans)', textDecoration: 'none', cursor: partnerPhone ? 'pointer' : 'not-allowed', opacity: partnerPhone ? 1 : 0.6 }}
                title={partnerPhone ? `Call ${driverName}` : 'Call available once ride starts'}
              >
                <WpIcon name="phone" size={18} color={partnerPhone ? 'var(--success-700)' : 'var(--asphalt-400)'} /> Call
              </a>
            </div>
            <button
              onClick={onSos || (() => navigate(`/sos/${resolvedRideId}`))}
              style={{ padding: '13px 16px', borderRadius: 'var(--radius-lg)', background: 'var(--danger-600)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-sans)', cursor: 'pointer', letterSpacing: '.04em' }}
            >
              <WpIcon name="shield" size={18} color="#fff" /> SOS Emergency
            </button>
          </div>
        </div>

        {/* Right map */}
        <div style={{ flex: 1, position: 'relative' }}>
          <WpMap height={window.innerHeight || 844} showRoute showDriver driverPos={driverPos} dark />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', position: 'relative', overflow: 'hidden' }}>
      <WpMap height={window.innerHeight || 844} showRoute showDriver driverPos={driverPos} dark />

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: '56px', padding: '56px 16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10 }}>
        <button
          onClick={onBack || (() => navigate(-1))}
          style={{ width: 40, height: 40, borderRadius: 'var(--radius-pill)', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          onClick={onSos || (() => navigate(`/sos/${resolvedRideId}`))}
          style={{ padding: '10px 18px', borderRadius: 'var(--radius-pill)', background: 'var(--danger-600)', border: 'none', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '.04em', boxShadow: '0 4px 16px rgba(229,56,74,0.4)' }}
        >
          <WpIcon name="shield" size={16} color="#fff" /> SOS
        </button>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)', borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0', padding: '20px 20px calc(env(safe-area-inset-bottom, 16px) + 16px)', zIndex: 10, boxShadow: '0 -8px 32px rgba(13,18,64,0.12)' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--asphalt-200)', margin: '0 auto 16px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <WpPill tone="live">En route · {etaMin} min</WpPill>
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--asphalt-400)' }}>{vehicleInfo}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <WpAvatar initials={getInitials(driverName)} size={48} tone="ink" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--asphalt-900)', fontFamily: 'var(--font-sans)' }}>{driverName}</div>
            <div style={{ fontSize: '12px', color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>
              {tracking?.driverRating ? `★ ${tracking.driverRating}` : '★ 4.8'} · Your driver
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            onClick={onChat || (() => navigate(`/chat/${resolvedRideId}`))}
            style={{ padding: '13px 16px', borderRadius: 'var(--radius-lg)', background: 'var(--ink-50)', border: '1.5px solid var(--ink-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--ink-700)', fontFamily: 'var(--font-sans)', cursor: 'pointer' }}
          >
            <WpIcon name="message" size={18} color="var(--ink-600)" /> Chat
          </button>
          <a
            href={`tel:${tracking?.driverPhone || ''}`}
            style={{ padding: '13px 16px', borderRadius: 'var(--radius-lg)', background: 'var(--success-100)', border: '1.5px solid rgba(24,169,87,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--success-700)', fontFamily: 'var(--font-sans)', textDecoration: 'none' }}
          >
            <WpIcon name="phone" size={18} color="var(--success-700)" /> Call
          </a>
        </div>
      </div>
    </div>
  );
}
