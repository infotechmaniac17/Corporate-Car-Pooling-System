import React, { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import WpAppBar from '../components/WpAppBar';
import WpButton from '../components/WpButton';
import WpAvatar from '../components/WpAvatar';
import WpPill from '../components/WpPill';
import WpIcon from '../components/WpIcon';
import AddressInput from '../components/AddressInput';
import useIsDesktop from '../hooks/useIsDesktop';
import { useAuth } from '../context/AuthContext';
import { getTripFeed } from '../api/trips';
import { fetchRouteAlternatives } from '../api/routing';
import { getOrgOffices } from '../api/organisations';
import { getUser } from '../api/users';

const RoutePreviewMap = lazy(() => import('../components/RoutePreviewMap'));

const SORTS = ['Soonest', 'Most seats', 'Cheapest', 'Top rated'];

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2);
}

function StarRating({ value }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      <WpIcon name="star" size={12} color="var(--warning-500)" stroke={0} />
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--asphalt-700)', fontFamily: 'var(--font-mono)' }}>
        {value ? Number(value).toFixed(1) : '—'}
      </span>
    </span>
  );
}

function formatDep(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function SeatsBar({ seatsLeft, availableSeats }) {
  const pct = availableSeats > 0 ? (seatsLeft / availableSeats) * 100 : 0;
  const color = pct > 50 ? 'var(--success-500)' : pct > 20 ? 'var(--warning-500)' : 'var(--danger-500)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 4, background: 'var(--asphalt-100)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
        {seatsLeft} left
      </span>
    </div>
  );
}

function TripCard({ trip, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 'var(--radius-xl)', padding: 16,
        boxShadow: 'var(--shadow-2)', border: '1px solid var(--asphalt-100)',
        cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-3)'; e.currentTarget.style.borderColor = 'var(--ink-200)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-2)'; e.currentTarget.style.borderColor = 'var(--asphalt-100)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <WpAvatar initials={getInitials(trip.driverName)} size={44} tone="ink" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--asphalt-900)' }}>{trip.driverName || 'Driver'}</div>
          <StarRating value={trip.driverRating} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink-700)', fontFamily: 'var(--font-mono)' }}>
            ₹{trip.fare != null ? Number(trip.fare).toFixed(0) : '—'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>per seat</div>
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
          <div style={{ marginTop: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ink-500)', border: '2px solid var(--ink-200)' }} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--asphalt-700)', lineHeight: 1.4, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {trip.pickupLabel || 'Pickup'}
          </div>
        </div>
        <div style={{ marginLeft: 3, width: 2, height: 12, background: 'var(--asphalt-200)', margin: '2px 0 2px 3px' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ marginTop: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: 1, background: 'var(--voltage-400)', border: '2px solid var(--voltage-200)' }} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--asphalt-700)', lineHeight: 1.4, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {trip.dropoffLabel || 'Drop-off'}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <SeatsBar seatsLeft={trip.seatsLeft} availableSeats={trip.availableSeats} />
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <WpPill tone="matched">{formatDep(trip.departureTime)}</WpPill>
        {trip.vehicleNumber && <WpPill tone="live">{trip.vehicleNumber}</WpPill>}
        {trip.recurringDays && <WpPill tone="warn">↻ {trip.recurringDays}</WpPill>}
        {trip.genderPreference && trip.genderPreference !== 'ANY' && (
          <WpPill tone="completed">{trip.genderPreference} only</WpPill>
        )}
      </div>
    </div>
  );
}

export default function TripFeedScreen({ onBack }) {
  const { currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSort, setActiveSort] = useState('Soonest');
  const [dateFilter, setDateFilter] = useState('');

  const [pickupAddr, setPickupAddr] = useState(null);
  const [dropoffAddr, setDropoffAddr] = useState(null);
  const [offices, setOffices] = useState([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState(null);

  const [routes, setRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [routeLoading, setRouteLoading] = useState(false);

  // Load user profile + org offices on mount
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

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (dateFilter) params.date = dateFilter;
      if (pickupAddr?.lat != null && pickupAddr?.lng != null) {
        params.pickupLat = pickupAddr.lat;
        params.pickupLng = pickupAddr.lng;
      }
      if (dropoffAddr?.lat != null && dropoffAddr?.lng != null) {
        params.dropoffLat = dropoffAddr.lat;
        params.dropoffLng = dropoffAddr.lng;
      }
      const res = await getTripFeed(params);
      setTrips(res.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load trips.');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, pickupAddr?.lat, pickupAddr?.lng, dropoffAddr?.lat, dropoffAddr?.lng]);

  // Reload when filters change
  useEffect(() => { load(); }, [load]);

  // Fetch route preview when pickup/dropoff change
  useEffect(() => {
    if (!pickupAddr?.lat || !dropoffAddr?.lat) { setRoutes([]); return; }
    let cancelled = false;
    setRouteLoading(true);
    fetchRouteAlternatives(pickupAddr, dropoffAddr)
      .then(r => { if (!cancelled) { setRoutes(r); setSelectedRouteIndex(0); } })
      .finally(() => { if (!cancelled) setRouteLoading(false); });
    return () => { cancelled = true; };
  }, [pickupAddr?.lat, pickupAddr?.lng, dropoffAddr?.lat, dropoffAddr?.lng]);

  const sorted = [...trips].sort((a, b) => {
    if (activeSort === 'Cheapest') return Number(a.fare || 0) - Number(b.fare || 0);
    if (activeSort === 'Most seats') return (b.seatsLeft || 0) - (a.seatsLeft || 0);
    if (activeSort === 'Top rated') return Number(b.driverRating || 0) - Number(a.driverRating || 0);
    return new Date(a.departureTime || 0) - new Date(b.departureTime || 0);
  });

  const hasMapCoords = pickupAddr?.lat != null || dropoffAddr?.lat != null;

  const formatDist = (m) => m == null ? '' : m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
  const formatDur  = (s) => s == null ? '' : s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.round((s % 3600) / 60)}m` : `${Math.round(s / 60)} min`;

  const swapAddresses = () => {
    const t = pickupAddr;
    setPickupAddr(dropoffAddr);
    setDropoffAddr(t);
  };

  const SearchInputs = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
        <div>
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
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--asphalt-500)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
            Filter by date
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--asphalt-200)', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--asphalt-900)', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        {dateFilter && (
          <button onClick={() => setDateFilter('')} style={{ marginTop: 22, padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--asphalt-200)', background: 'none', fontSize: 12, color: 'var(--asphalt-600)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Clear
          </button>
        )}
      </div>
    </div>
  );

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

  const SortChips = ({ vertical = false }) => (
    <div style={{ display: 'flex', flexDirection: vertical ? 'column' : 'row', gap: 8, overflowX: vertical ? 'visible' : 'auto' }}>
      {SORTS.map(s => (
        <button
          key={s}
          onClick={() => setActiveSort(s)}
          style={{
            flexShrink: 0, padding: '7px 16px', borderRadius: 'var(--radius-pill)',
            border: `1.5px solid ${activeSort === s ? 'var(--ink-500)' : 'var(--asphalt-200)'}`,
            background: activeSort === s ? 'var(--ink-50)' : '#fff',
            color: activeSort === s ? 'var(--ink-700)' : 'var(--asphalt-600)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)',
            textAlign: 'left',
          }}
        >{s}</button>
      ))}
    </div>
  );

  const TripList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--danger-100)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--danger-700)' }}>
          {error}
        </div>
      )}
      {loading ? (
        [1, 2, 3].map(i => (
          <div key={i} style={{ height: 180, borderRadius: 'var(--radius-xl)', background: 'linear-gradient(90deg, var(--asphalt-100) 25%, var(--asphalt-50) 50%, var(--asphalt-100) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
        ))
      ) : sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--asphalt-400)' }}>
          <WpIcon name="car" size={40} color="var(--asphalt-300)" />
          <p style={{ marginTop: 12, fontSize: 15, fontWeight: 600 }}>No trips available</p>
          <p style={{ marginTop: 4, fontSize: 12, color: 'var(--asphalt-300)' }}>
            {(pickupAddr?.lat || dropoffAddr?.lat)
              ? 'No trips match your route. Try widening your search or clearing location.'
              : dateFilter ? 'No trips on this date.' : 'No upcoming trips in your organisation.'}
          </p>
          {(pickupAddr?.lat || dropoffAddr?.lat || dateFilter) && (
            <button
              onClick={() => { setPickupAddr(null); setDropoffAddr(null); setDateFilter(''); }}
              style={{ marginTop: 14, padding: '8px 20px', borderRadius: 'var(--radius-pill)', border: '1.5px solid var(--asphalt-300)', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--asphalt-600)' }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : sorted.map(trip => (
        <TripCard
          key={trip.id}
          trip={trip}
          onClick={() => navigate(`/trips/${trip.id}`)}
        />
      ))}
    </div>
  );

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)' }}>
        <div style={{ padding: '32px 40px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--asphalt-900)', letterSpacing: '-0.02em' }}>Find a Ride</h1>
              <p style={{ fontSize: 13, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                {loading ? 'Searching…' : `${sorted.length} trip${sorted.length !== 1 ? 's' : ''} available`}
              </p>
            </div>
            <WpButton kind="primary" size="sm" onClick={load}>
              <WpIcon name="refresh-cw" size={14} color="#fff" /> Refresh
            </WpButton>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, padding: '24px 40px 40px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', padding: 16, boxShadow: 'var(--shadow-1)', border: '1px solid var(--asphalt-100)' }}>
              <SearchInputs />
            </div>
            <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', padding: 16, boxShadow: 'var(--shadow-1)', border: '1px solid var(--asphalt-100)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>Sort by</div>
              <SortChips vertical />
            </div>
            <TripList />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 500 }}>
            {RouteSection({ height: hasMapCoords ? 500 : 380 })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)' }}>
      <WpAppBar title="Find a Ride" sub={loading ? 'Searching…' : `${sorted.length} trip${sorted.length !== 1 ? 's' : ''} available`} onBack={onBack} />

      <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid var(--asphalt-100)' }}>
        <SearchInputs />
      </div>

      {hasMapCoords && (
        <div style={{ padding: '12px 16px 0' }}>
          {RouteSection({ height: 220 })}
        </div>
      )}

      <div style={{ background: '#fff', borderBottom: '1px solid var(--asphalt-100)', padding: '8px 16px', display: 'flex', gap: 8, overflowX: 'auto' }}>
        <SortChips />
      </div>

      <div style={{ padding: '16px', paddingBottom: 32 }}>
        <TripList />
      </div>
    </div>
  );
}
