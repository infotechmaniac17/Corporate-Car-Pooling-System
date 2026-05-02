import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import WpMap from '../components/WpMap';
import WpPill from '../components/WpPill';
import WpAvatar from '../components/WpAvatar';
import WpButton from '../components/WpButton';
import WpIcon from '../components/WpIcon';
import { getLatest } from '../api/tracking';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2);
}

export default function TrackingScreen({ rideId, onSos, onChat, onBack }) {
  const navigate = useNavigate();
  const [tracking, setTracking] = useState(null);
  const [driverPos, setDriverPos] = useState(0.2);
  const intervalRef = useRef(null);

  const resolvedRideId = rideId;

  useEffect(() => {
    const fetchTracking = () => {
      if (!resolvedRideId) return;
      getLatest(resolvedRideId)
        .then(res => {
          setTracking(res.data);
          if (res.data?.progressFraction != null) {
            setDriverPos(res.data.progressFraction);
          }
        })
        .catch(() => {
          // Keep last known state
        });
    };

    fetchTracking();
    intervalRef.current = setInterval(fetchTracking, 5000);

    return () => clearInterval(intervalRef.current);
  }, [resolvedRideId]);

  const driverName = tracking?.driverName || 'Driver';
  const vehicleInfo = tracking?.vehiclePlate || tracking?.vehicle || 'KA 01 AB 1234';
  const etaMin = tracking?.etaMinutes ?? 8;

  return (
    <div style={{ minHeight: '100vh', background: '#000', position: 'relative', overflow: 'hidden' }}>
      {/* Map full screen */}
      <WpMap height={window.innerHeight || 844} showRoute showDriver driverPos={driverPos} dark />

      {/* Top bar overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: '56px',
        padding: '56px 16px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        zIndex: 10,
      }}>
        <button
          onClick={onBack || (() => navigate(-1))}
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <button
          onClick={onSos || (() => navigate(`/sos/${resolvedRideId}`))}
          style={{
            padding: '10px 18px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--danger-600)',
            border: 'none',
            color: '#fff',
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            letterSpacing: '.04em',
            boxShadow: '0 4px 16px rgba(229,56,74,0.4)',
          }}
        >
          <WpIcon name="shield" size={16} color="#fff" />
          SOS
        </button>
      </div>

      {/* Bottom sheet */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(20px)',
        borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
        padding: '20px 20px calc(env(safe-area-inset-bottom, 16px) + 16px)',
        zIndex: 10,
        boxShadow: '0 -8px 32px rgba(13,18,64,0.12)',
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--asphalt-200)', margin: '0 auto 16px' }} />

        {/* Status pill */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <WpPill tone="live">En route · {etaMin} min</WpPill>
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--asphalt-400)' }}>
            {vehicleInfo}
          </span>
        </div>

        {/* Driver info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <WpAvatar initials={getInitials(driverName)} size={48} tone="ink" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--asphalt-900)', fontFamily: 'var(--font-sans)' }}>
              {driverName}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>
              {tracking?.driverRating ? `★ ${tracking.driverRating}` : '★ 4.8'} · Your driver
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            onClick={onChat || (() => navigate(`/chat/${resolvedRideId}`))}
            style={{
              padding: '13px 16px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--ink-50)',
              border: '1.5px solid var(--ink-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--ink-700)',
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
            }}
          >
            <WpIcon name="message" size={18} color="var(--ink-600)" />
            Chat
          </button>
          <a
            href={`tel:${tracking?.driverPhone || ''}`}
            style={{
              padding: '13px 16px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--success-100)',
              border: '1.5px solid rgba(24,169,87,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--success-700)',
              fontFamily: 'var(--font-sans)',
              textDecoration: 'none',
            }}
          >
            <WpIcon name="phone" size={18} color="var(--success-700)" />
            Call
          </a>
        </div>
      </div>
    </div>
  );
}
