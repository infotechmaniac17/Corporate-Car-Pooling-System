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
        {value ? Number(value).toFixed(1) : '—'}
      </span>
    </span>
  );
}

function defaultDepartureIso() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d.toISOString();
}

export default function MatchingScreen({ onSelect, onBack }) {
  const { currentUser } = useAuth();
  const isDesktop = useIsDesktop();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Closest');
  const [requesting, setRequesting] = useState(null);
  const [error, setError] = useState('');
  const [selectedRide, setSelectedRide] = useState(null);

  const [pickupAddr, setPickupAddr] = useState(null);
  const [dropoffAddr, setDropoffAddr] = useState(null);
  const [departureIso, setDepartureIso] = useState(defaultDepartureIso());

  // Prefill pickup from homeAddress (with coords), dropoff from secondaryAddress (office)
  useEffect(() => {
    if (currentUser?.homeAddress && currentUser?.homeLat != null && currentUser?.homeLng != null) {
      setPickupAddr({ label: currentUser.homeAddress, lat: currentUser.homeLat, lng: currentUser.homeLng });
    }
  }, [currentUser?.homeAddress, currentUser?.homeLat, currentUser?.homeLng]);

  useEffect(() => {
    if (currentUser?.secondaryAddress && currentUser?.secondaryLat != null && currentUser?.secondaryLng != null) {
      setDropoffAddr({ label: currentUser.secondaryAddress, lat: currentUser.secondaryLat, lng: currentUser.secondaryLng });
    }
  }, [currentUser?.secondaryAddress, currentUser?.secondaryLat, currentUser?.secondaryLng]);

  const search = async () => {
    setError('');
    if (!pickupAddr?.lat || !pickupAddr?.lng) { setError('Pick a pickup location.'); return; }
    if (!dropoffAddr?.lat || !dropoffAddr?.lng) { setError('Pick a drop-off location.'); return; }
    setLoading(true);
    setSearched(true);
    try {
      const res = await findMatches({
        pickupLat: pickupAddr.lat,
        pickupLng: pickupAddr.lng,
        dropLat: dropoffAddr.lat,
        dropLng: dropoffAddr.lng,
        desiredDepartureTime: departureIso,
        searchRadiusMeters: 5000,
      });
      setRides(res.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Search failed. Try again.');
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-search once on mount if coords prefilled
  useEffect(() => {
    if (pickupAddr?.lat && dropoffAddr?.lat && !searched) {
      search();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupAddr?.lat, dropoffAddr?.lat]);

  const sortedRides = [...rides].sort((a, b) => {
    if (activeFilter === 'Cheapest')   return Number(a.estimatedFare || 0) - Number(b.estimatedFare || 0);
    if (activeFilter === 'Earliest')   return new Date(a.departureTime || 0) - new Date(b.departureTime || 0);
    if (activeFilter === 'Top rated')  return Number(b.driverRating || 0) - Number(a.driverRating || 0);
    return Number(a.distanceToPickupMeters || 0) - Number(b.distanceToPickupMeters || 0);
  });

  const handleRequest = async (ride) => {
    setRequesting(ride.rideScheduleId);
    setError('');
    try {
      await createRequest({
        rideScheduleId: ride.rideScheduleId,
        pickupLat: pickupAddr.lat,
        pickupLng: pickupAddr.lng,
        dropLat: dropoffAddr.lat,
        dropLng: dropoffAddr.lng,
      });
      if (onSelect) onSelect(ride);
      alert('Request sent. Driver will respond shortly.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not send request. Try again.');
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
      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--asphalt-500)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
          Departure time
        </label>
        <input
          type="datetime-local"
          value={departureIso ? new Date(departureIso).toISOString().slice(0, 16) : ''}
          onChange={e => {
            const v = e.target.value;
            setDepartureIso(v ? new Date(v).toISOString() : defaultDepartureIso());
          }}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--asphalt-200)', fontSize: 14,
            fontFamily: 'var(--font-sans)', color: 'var(--asphalt-900)',
            background: '#fff', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>
      <WpButton kind="accent" size="sm" full onClick={search} disabled={loading}>
        <WpIcon name="search" size={14} color="var(--ink-950)" />
        {loading ? 'Searching…' : 'Search rides'}
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

  const formatDeparture = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

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
      ) : !searched ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--asphalt-400)', fontFamily: 'var(--font-sans)' }}>
          <WpIcon name="search" size={40} color="var(--asphalt-300)" />
          <p style={{ marginTop: '12px', fontSize: '15px' }}>Enter pickup + drop-off and search.</p>
        </div>
      ) : sortedRides.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--asphalt-400)', fontFamily: 'var(--font-sans)' }}>
          <WpIcon name="car" size={40} color="var(--asphalt-300)" />
          <p style={{ marginTop: '12px', fontSize: '15px' }}>No rides found nearby.</p>
          <p style={{ marginTop: 4, fontSize: 12, color: 'var(--asphalt-300)' }}>
            Try a different time or widen pickup search radius.
          </p>
        </div>
      ) : (
        sortedRides.map(ride => {
          const id = ride.rideScheduleId;
          const distKm = ride.distanceToPickupMeters != null
            ? (Number(ride.distanceToPickupMeters) / 1000).toFixed(1) + ' km'
            : null;
          const detour = ride.detourPercent != null ? Math.round(Number(ride.detourPercent)) + '%' : null;
          return (
            <div
              key={id}
              onClick={() => isDesktop && setSelectedRide(id === selectedRide ? null : id)}
              style={{
                background: '#fff',
                borderRadius: 'var(--radius-xl)',
                padding: '16px',
                boxShadow: isDesktop && selectedRide === id ? 'var(--shadow-3)' : 'var(--shadow-2)',
                border: `1px solid ${isDesktop && selectedRide === id ? 'var(--ink-300)' : 'var(--asphalt-100)'}`,
                cursor: isDesktop ? 'pointer' : 'default',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <WpAvatar initials={getInitials(ride.driverName)} size={44} tone="ink" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--asphalt-900)', fontFamily: 'var(--font-sans)' }}>
                    {ride.driverName || 'Driver'}
                  </div>
                  <StarRating value={ride.driverRating} />
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink-700)', fontFamily: 'var(--font-mono)' }}>
                  ₹{ride.estimatedFare != null ? Number(ride.estimatedFare).toFixed(0) : '—'}
                </div>
              </div>
              <div style={{ marginBottom: '8px', fontSize: '13px', color: 'var(--asphalt-600)', fontFamily: 'var(--font-mono)' }}>
                {ride.vehicleNumber || '—'} · {formatDeparture(ride.departureTime)}
              </div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                {detour && <WpPill tone="warn">+{detour} detour</WpPill>}
                {distKm && <WpPill tone="matched">{distKm} to pickup</WpPill>}
                {ride.availableSeats != null && <WpPill tone="live">{ride.availableSeats} seat{ride.availableSeats !== 1 ? 's' : ''}</WpPill>}
              </div>
              <WpButton kind="primary" size="sm" full onClick={(e) => { e.stopPropagation(); handleRequest(ride); }} disabled={requesting === id}>
                {requesting === id ? 'Requesting…' : 'Request ride'}
              </WpButton>
            </div>
          );
        })
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

          <div style={{ background: 'var(--ink-950)', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', position: 'relative', minHeight: '500px' }}>
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M40 0H0V40" stroke="rgba(255,255,255,0.04)" strokeWidth="1" fill="none" />
                </pattern>
              </defs>
              <rect width="800" height="600" fill="url(#grid)" />
              <path d="M100 500 Q 250 380 400 280 T 720 80" stroke="var(--voltage-400)" strokeWidth="3" fill="none" opacity="0.7" strokeLinecap="round" strokeDasharray="12 6" />
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
