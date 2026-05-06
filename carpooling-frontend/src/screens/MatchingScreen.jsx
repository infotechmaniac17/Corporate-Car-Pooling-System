import React, { useEffect, useState } from 'react';
import WpAppBar from '../components/WpAppBar';
import WpButton from '../components/WpButton';
import WpAvatar from '../components/WpAvatar';
import WpPill from '../components/WpPill';
import WpIcon from '../components/WpIcon';
import AddressInput from '../components/AddressInput';
import useIsDesktop from '../hooks/useIsDesktop';
import { useAuth } from '../context/AuthContext';
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

export default function MatchingScreen({ onSelect, onBack }) {
  const { currentUser } = useAuth();
  const isDesktop = useIsDesktop();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Closest');
  const [requesting, setRequesting] = useState(null);
  const [error, setError] = useState('');
  const [selectedRide, setSelectedRide] = useState(null);

  const [pickupAddr, setPickupAddr] = useState(
    currentUser?.homeAddress ? { label: currentUser.homeAddress } : null
  );
  const [dropoffAddr, setDropoffAddr] = useState(
    currentUser?.organisationName ? { label: currentUser.organisationName } : null
  );

  useEffect(() => {
    const pickupLabel = pickupAddr?.label || 'Home';
    const dropoffLabel = dropoffAddr?.label || 'Office';
    findMatches({ pickupLocation: pickupLabel, dropoffLocation: dropoffLabel })
      .then(res => setRides(res.data?.length ? res.data : mockRides))
      .catch(() => setRides(mockRides))
      .finally(() => setLoading(false));
  }, []);

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
        pickupLocation: pickupAddr?.label || 'Home',
        dropoffLocation: dropoffAddr?.label || 'Office',
      });
      if (onSelect) onSelect(ride);
    } catch (err) {
      setError('Could not send request. Please try again.');
    } finally {
      setRequesting(null);
    }
  };

  const SearchInputs = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <AddressInput
        label="Pickup"
        value={pickupAddr}
        onChange={setPickupAddr}
        placeholder="Where are you starting from?"
      />
      <AddressInput
        label="Drop-off"
        value={dropoffAddr}
        onChange={setDropoffAddr}
        placeholder="Where are you going?"
      />
      <WpButton kind="accent" size="sm" full onClick={() => {
        setLoading(true);
        findMatches({ pickupLocation: pickupAddr?.label || 'Home', dropoffLocation: dropoffAddr?.label || 'Office' })
          .then(res => setRides(res.data?.length ? res.data : mockRides))
          .catch(() => setRides(mockRides))
          .finally(() => setLoading(false));
      }}>
        <WpIcon name="search" size={14} color="var(--ink-950)" />
        Search rides
      </WpButton>
    </div>
  );

  const FilterChips = ({ vertical = false }) => (
    <div style={{ display: 'flex', flexDirection: vertical ? 'column' : 'row', gap: '8px', flexWrap: vertical ? 'nowrap' : 'nowrap', overflowX: vertical ? 'visible' : 'auto' }}>
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
            textAlign: 'left',
          }}
        >
          {f}
        </button>
      ))}
    </div>
  );

  const RideList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
            onClick={() => isDesktop && setSelectedRide(ride.id === selectedRide ? null : ride.id)}
            style={{
              background: '#fff',
              borderRadius: 'var(--radius-xl)',
              padding: '16px',
              boxShadow: isDesktop && selectedRide === ride.id ? 'var(--shadow-3)' : 'var(--shadow-2)',
              border: `1px solid ${isDesktop && selectedRide === ride.id ? 'var(--ink-300)' : 'var(--asphalt-100)'}`,
              cursor: isDesktop ? 'pointer' : 'default',
              transition: 'all 0.15s',
            }}
          >
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
            <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--asphalt-600)', fontFamily: 'var(--font-sans)' }}>
              {ride.origin || 'Pickup'} → {ride.destination || 'Drop'}
            </div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {ride.detourMin != null && <WpPill tone="warn">+{ride.detourMin}min detour</WpPill>}
              {ride.etaMin != null && <WpPill tone="matched">{ride.etaMin}min away</WpPill>}
              {ride.seats != null && <WpPill tone="live">{ride.seats} seat{ride.seats !== 1 ? 's' : ''}</WpPill>}
              {ride.distance && <WpPill tone="completed">{ride.distance}</WpPill>}
            </div>
            <WpButton kind="primary" size="sm" full onClick={(e) => { e.stopPropagation(); handleRequest(ride); }} disabled={requesting === ride.id}>
              {requesting === ride.id ? 'Requesting…' : 'Request ride'}
            </WpButton>
          </div>
        ))
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '32px 40px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            {onBack && (
              <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--asphalt-500)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontFamily: 'var(--font-sans)', padding: 0 }}>
                <WpIcon name="chevron-left" size={18} color="var(--asphalt-500)" /> Back
              </button>
            )}
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--asphalt-900)', fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em' }}>Find a Ride</h1>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', flex: 1, gap: 0, overflow: 'hidden', margin: '24px 40px 40px' }}>
          {/* Left panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '20px' }}>
            <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', padding: '16px', boxShadow: 'var(--shadow-1)', border: '1px solid var(--asphalt-100)' }}>
              {SearchInputs()}
            </div>
            <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', padding: '16px', boxShadow: 'var(--shadow-1)', border: '1px solid var(--asphalt-100)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginBottom: '10px' }}>Sort by</div>
              <FilterChips vertical />
            </div>
            <RideList />
          </div>

          {/* Right panel — map illustration */}
          <div style={{ background: 'var(--ink-950)', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', position: 'relative', minHeight: '500px' }}>
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M40 0H0V40" stroke="rgba(255,255,255,0.04)" strokeWidth="1" fill="none" />
                </pattern>
              </defs>
              <rect width="800" height="600" fill="url(#grid)" />
              <path d="M100 500 Q 250 380 400 280 T 720 80" stroke="var(--voltage-400)" strokeWidth="3" fill="none" opacity="0.7" strokeLinecap="round" strokeDasharray="12 6" />
              <path d="M0 480 H800" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <path d="M0 300 H800" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
              <path d="M500 0 V600" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
              <path d="M200 0 V600" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
              <circle cx="100" cy="500" r="12" fill="rgba(255,255,255,0.3)" />
              <circle cx="100" cy="500" r="6" fill="#fff" />
              <circle cx="720" cy="80" r="16" fill="var(--voltage-400)" stroke="var(--ink-950)" strokeWidth="3" />
              <circle cx="720" cy="80" r="7" fill="var(--ink-950)" />
            </svg>
            <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
              <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: 'var(--radius-xl)', padding: '16px 20px', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)', letterSpacing: '.06em', marginBottom: '6px' }}>MATCHING AREA</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', fontFamily: 'var(--font-sans)' }}>
                  {rides.length} driver{rides.length !== 1 ? 's' : ''} nearby
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)' }}>
      <WpAppBar title="Find a Ride" sub="Matching nearby drivers" onBack={onBack} />

      <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid var(--asphalt-100)' }}>
        {SearchInputs()}
      </div>

      <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid var(--asphalt-100)', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        <FilterChips />
      </div>

      <div style={{ padding: '16px', paddingBottom: '32px' }}>
        <RideList />
      </div>
    </div>
  );
}
