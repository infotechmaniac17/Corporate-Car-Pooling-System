import React, { lazy, Suspense, useEffect, useState } from 'react';
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
import { fetchRouteAlternatives } from '../api/routing';
import { getOrgOffices } from '../api/organisations';
import { getUser } from '../api/users';

const RoutePreviewMap = lazy(() => import('../components/RoutePreviewMap'));

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
  const { currentUser, updateUser } = useAuth();
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
  const [offices, setOffices] = useState([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState(null);

  const [routes, setRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    if (!currentUser?.id) return;
    const init = async () => {
      let profile = {};
      try {
        const res = await getUser(currentUser.id);
        profile = res.data?.data || {};
        updateUser({
          homeAddress: profile.homeAddress, homeLat: profile.homeLat, homeLng: profile.homeLng,
          secondaryAddress: profile.secondaryAddress, secondaryLat: profile.secondaryLat, secondaryLng: profile.secondaryLng,
          organisationId: profile.organisationId, organisationName: profile.organisationName,
        });
      } catch {}

      const ha = profile.homeAddress || currentUser.homeAddress;
      const hl = profile.homeLat ?? currentUser.homeLat;
      const hlng = profile.homeLng ?? currentUser.homeLng;
      if (ha && hl != null && hlng != null) {
        setPickupAddr({ label: ha, lat: hl, lng: hlng });
      }

      const orgId = profile.organisationId || currentUser.organisationId;
      const saFallback = profile.secondaryAddress || currentUser.secondaryAddress;
      const slFallback = profile.secondaryLat ?? currentUser.secondaryLat;
      const slngFallback = profile.secondaryLng ?? currentUser.secondaryLng;

      const applyFallback = () => {
        if (saFallback && slFallback != null && slngFallback != null) {
          setDropoffAddr({ label: saFallback, lat: slFallback, lng: slngFallback });
        }
      };

      if (!orgId) { applyFallback(); return; }
      try {
        const res = await getOrgOffices(orgId);
        const list = res.data?.data || [];
        setOffices(list);
        if (list.length > 0) {
          const primary = list.find(o => o.isPrimary) || list[0];
          setSelectedOfficeId(primary.id);
          setDropoffAddr({ label: primary.address, lat: primary.lat, lng: primary.lng });
        } else {
          applyFallback();
        }
      } catch {
        applyFallback();
      }
    };
    init();
  }, [currentUser?.id]);

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

  // Fetch route alternatives when pickup/dropoff change
  useEffect(() => {
    if (!pickupAddr?.lat || !dropoffAddr?.lat) { setRoutes([]); return; }
    let cancelled = false;
    setRouteLoading(true);
    fetchRouteAlternatives(pickupAddr, dropoffAddr)
      .then(r => { if (!cancelled) { setRoutes(r); setSelectedRouteIndex(0); } })
      .finally(() => { if (!cancelled) setRouteLoading(false); });
    return () => { cancelled = true; };
  }, [pickupAddr?.lat, pickupAddr?.lng, dropoffAddr?.lat, dropoffAddr?.lng]);

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

  const swapAddresses = () => {
    const t = pickupAddr;
    setPickupAddr(dropoffAddr);
    setDropoffAddr(t);
  };

  const SearchInputs = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <AddressInput
        label="Pickup"
        value={pickupAddr}
        onChange={setPickupAddr}
        placeholder="Where are you starting from?"
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 2px', marginTop: -6, marginBottom: -6 }}>
        <button
          type="button"
          onClick={swapAddresses}
          title="Swap pickup and drop-off"
          style={{
            width: 32, height: 32, borderRadius: '50%', background: 'var(--asphalt-50)',
            border: '1.5px solid var(--asphalt-200)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', zIndex: 1, position: 'relative',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--asphalt-600)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 2L2 4l2 2M2 4h8M10 12l2-2-2-2M12 10H4" />
          </svg>
        </button>
      </div>
      {offices.length > 0 ? (
        <div style={{ marginBottom: 0 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--asphalt-500)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
            Drop-off office
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {offices.map(o => {
              const sel = selectedOfficeId === o.id;
              return (
                <button key={o.id} type="button"
                  onClick={() => { setSelectedOfficeId(o.id); setDropoffAddr({ label: o.address, lat: o.lat, lng: o.lng }); }}
                  style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: `1.5px solid ${sel ? 'var(--ink-600)' : 'var(--asphalt-200)'}`, background: sel ? 'var(--ink-950)' : '#fff', textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-sans)', width: '100%' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: sel ? '#fff' : 'var(--asphalt-900)' }}>
                    {o.name}{o.isPrimary ? ' · Primary' : ''}
                  </div>
                  <div style={{ fontSize: 11, color: sel ? 'rgba(255,255,255,0.6)' : 'var(--asphalt-500)', marginTop: 2 }}>{o.address}</div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <AddressInput
          label="Drop-off"
          value={dropoffAddr}
          onChange={setDropoffAddr}
          placeholder="Where are you going?"
        />
      )}
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

  const formatDist = (m) => m == null ? '' : m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
  const formatDur  = (s) => s == null ? '' : s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.round((s % 3600) / 60)}m` : `${Math.round(s / 60)} min`;

  const formatDeparture = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const hasMapCoords = pickupAddr?.lat != null || dropoffAddr?.lat != null;

  const RouteSection = ({ height = 260 }) => (
    <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', boxShadow: 'var(--shadow-1)', border: '1px solid var(--asphalt-100)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px 8px', fontSize: 11, fontWeight: 700, color: 'var(--asphalt-400)', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Your route</span>
        {routeLoading && <span style={{ fontSize: 10, color: 'var(--asphalt-400)', fontWeight: 400 }}>Finding routes…</span>}
      </div>
      {routes.length > 1 && (
        <div style={{ display: 'flex', gap: 6, padding: '0 12px 8px', flexWrap: 'wrap' }}>
          {routes.map((r, i) => (
            <button
              key={i}
              onClick={() => setSelectedRouteIndex(i)}
              style={{
                padding: '5px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid',
                borderColor: selectedRouteIndex === i ? 'var(--ink-600)' : 'var(--asphalt-200)',
                background: selectedRouteIndex === i ? 'var(--ink-950)' : '#fff',
                color: selectedRouteIndex === i ? '#fff' : 'var(--asphalt-700)',
                fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)',
                display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'left',
              }}
            >
              <span>Route {i + 1}{i === 0 ? ' · Shortest' : ''}</span>
              <span style={{ fontWeight: 400, fontSize: 10, opacity: 0.8 }}>
                {formatDist(r.distanceM)} · {formatDur(r.durationS)}
              </span>
            </button>
          ))}
        </div>
      )}
      <Suspense fallback={<div style={{ height, background: 'var(--asphalt-50)' }} />}>
        <RoutePreviewMap
          pickup={pickupAddr} dropoff={dropoffAddr} height={height}
          routes={routes} selectedRouteIndex={selectedRouteIndex}
          onSelectRoute={setSelectedRouteIndex}
        />
      </Suspense>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 500 }}>
            {RouteSection({ height: hasMapCoords ? 420 : 320 })}
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

      {hasMapCoords && (
        <div style={{ padding: '12px 16px 0' }}>
          {RouteSection({ height: 220 })}
        </div>
      )}

      <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid var(--asphalt-100)', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        <FilterChips />
      </div>

      <div style={{ padding: '16px', paddingBottom: '32px' }}>
        <RideList />
      </div>
    </div>
  );
}
