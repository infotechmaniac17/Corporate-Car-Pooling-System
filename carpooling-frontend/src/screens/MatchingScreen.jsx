import React, { useEffect, useState } from 'react';
import WpAppBar from '../components/WpAppBar';
import WpButton from '../components/WpButton';
import WpAvatar from '../components/WpAvatar';
import WpPill from '../components/WpPill';
import WpIcon from '../components/WpIcon';
import { findMatches } from '../api/matching';
import { createRequest } from '../api/rides';

const FILTERS = ['Closest', 'Earliest', 'Cheapest', 'Top rated'];

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2);
}

function StarRating({ value }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
      <WpIcon name="star" size={12} color="var(--warning-500)" stroke={0} />
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--asphalt-700)', fontFamily: 'var(--font-mono)' }}>
        {value ? value.toFixed(1) : '—'}
      </span>
    </span>
  );
}

const mockRides = [
  { id: '1', driverName: 'Arjun Mehta', rating: 4.8, seats: 2, fare: 120, detourMin: 3, etaMin: 12, origin: 'Koramangala', destination: 'Whitefield', distance: '18.2 km' },
  { id: '2', driverName: 'Priya Sharma', rating: 4.9, seats: 3, fare: 95, detourMin: 6, etaMin: 18, origin: 'HSR Layout', destination: 'Electronic City', distance: '14.5 km' },
  { id: '3', driverName: 'Ravi Kumar', rating: 4.6, seats: 1, fare: 140, detourMin: 2, etaMin: 9, origin: 'Indiranagar', destination: 'Marathahalli', distance: '12.8 km' },
];

export default function MatchingScreen({ pickup, dropoff, onSelect, onBack }) {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Closest');
  const [requesting, setRequesting] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    findMatches({ pickupLocation: pickup || 'Home', dropoffLocation: dropoff || 'Office' })
      .then(res => setRides(res.data?.length ? res.data : mockRides))
      .catch(() => setRides(mockRides))
      .finally(() => setLoading(false));
  }, [pickup, dropoff]);

  const sortedRides = [...rides].sort((a, b) => {
    if (activeFilter === 'Cheapest') return (a.fare || 0) - (b.fare || 0);
    if (activeFilter === 'Earliest') return (a.etaMin || 0) - (b.etaMin || 0);
    if (activeFilter === 'Top rated') return (b.rating || 0) - (a.rating || 0);
    return (a.detourMin || 0) - (b.detourMin || 0);
  });

  const handleRequest = async (ride) => {
    setRequesting(ride.id);
    setError('');
    try {
      await createRequest({
        rideId: ride.id,
        pickupLocation: pickup || 'Home',
        dropoffLocation: dropoff || 'Office',
      });
      if (onSelect) onSelect(ride);
    } catch (err) {
      setError('Could not send request. Please try again.');
    } finally {
      setRequesting(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)' }}>
      <WpAppBar title="Find a Ride" sub="Matching nearby drivers" onBack={onBack} />

      {/* Search inputs */}
      <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid var(--asphalt-100)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'var(--asphalt-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--asphalt-100)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ink-500)', flexShrink: 0 }} />
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--asphalt-900)', fontFamily: 'var(--font-sans)' }}>
              {pickup || 'Home'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'var(--asphalt-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--asphalt-100)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '2px', background: 'var(--voltage-400)', flexShrink: 0 }} />
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--asphalt-900)', fontFamily: 'var(--font-sans)' }}>
              {dropoff || 'Office'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid var(--asphalt-100)', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              flexShrink: 0,
              padding: '7px 16px',
              borderRadius: 'var(--radius-pill)',
              border: `1.5px solid ${activeFilter === f ? 'var(--ink-500)' : 'var(--asphalt-200)'}`,
              background: activeFilter === f ? 'var(--ink-50)' : '#fff',
              color: activeFilter === f ? 'var(--ink-700)' : 'var(--asphalt-600)',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Results */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '32px' }}>
        {error && (
          <div style={{ padding: '12px 16px', background: 'var(--danger-100)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--danger-700)', fontFamily: 'var(--font-sans)' }}>
            {error}
          </div>
        )}

        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} style={{ height: '140px', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(90deg, var(--asphalt-100) 25%, var(--asphalt-50) 50%, var(--asphalt-100) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
          ))
        ) : sortedRides.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--asphalt-400)', fontFamily: 'var(--font-sans)' }}>
            <WpIcon name="car" size={40} color="var(--asphalt-300)" />
            <p style={{ marginTop: '12px', fontSize: '15px' }}>No rides found nearby</p>
          </div>
        ) : (
          sortedRides.map(ride => (
            <div
              key={ride.id}
              style={{
                background: '#fff',
                borderRadius: 'var(--radius-xl)',
                padding: '16px',
                boxShadow: 'var(--shadow-2)',
                border: '1px solid var(--asphalt-100)',
              }}
            >
              {/* Driver info row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <WpAvatar initials={getInitials(ride.driverName)} size={44} tone="ink" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--asphalt-900)', fontFamily: 'var(--font-sans)' }}>
                    {ride.driverName || 'Driver'}
                  </div>
                  <StarRating value={ride.rating} />
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink-700)', fontFamily: 'var(--font-mono)' }}>
                  ₹{ride.fare || '—'}
                </div>
              </div>

              {/* Route */}
              <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--asphalt-600)', fontFamily: 'var(--font-sans)' }}>
                {ride.origin || 'Pickup'} → {ride.destination || 'Drop'}
              </div>

              {/* Badges row */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                {ride.detourMin != null && (
                  <WpPill tone="warn">+{ride.detourMin}min detour</WpPill>
                )}
                {ride.etaMin != null && (
                  <WpPill tone="matched">{ride.etaMin}min away</WpPill>
                )}
                {ride.seats != null && (
                  <WpPill tone="live">{ride.seats} seat{ride.seats !== 1 ? 's' : ''}</WpPill>
                )}
                {ride.distance && (
                  <WpPill tone="completed">{ride.distance}</WpPill>
                )}
              </div>

              <WpButton
                kind="primary"
                size="sm"
                full
                onClick={() => handleRequest(ride)}
                disabled={requesting === ride.id}
              >
                {requesting === ride.id ? 'Requesting…' : 'Request ride'}
              </WpButton>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
