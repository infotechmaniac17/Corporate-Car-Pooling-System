import React, { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import WpAppBar from '../components/WpAppBar';
import WpButton from '../components/WpButton';
import WpAvatar from '../components/WpAvatar';
import WpPill from '../components/WpPill';
import WpIcon from '../components/WpIcon';
import useIsDesktop from '../hooks/useIsDesktop';
import { useAuth } from '../context/AuthContext';
import { getTripFeed } from '../api/trips';

const EmbeddedMap = lazy(() => import('../components/EmbeddedMap'));

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
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSort, setActiveSort] = useState('Soonest');
  const [dateFilter, setDateFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (dateFilter) params.date = dateFilter;
      const res = await getTripFeed(params);
      setTrips(res.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load trips.');
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => { load(); }, [load]);

  const sorted = [...trips].sort((a, b) => {
    if (activeSort === 'Cheapest') return Number(a.fare || 0) - Number(b.fare || 0);
    if (activeSort === 'Most seats') return (b.seatsLeft || 0) - (a.seatsLeft || 0);
    if (activeSort === 'Top rated') return Number(b.driverRating || 0) - Number(a.driverRating || 0);
    return new Date(a.departureTime || 0) - new Date(b.departureTime || 0);
  });

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
            {dateFilter ? 'No trips on this date. Try a different day.' : 'No upcoming trips in your organisation.'}
          </p>
          {dateFilter && (
            <button onClick={() => setDateFilter('')} style={{ marginTop: 14, padding: '8px 20px', borderRadius: 'var(--radius-pill)', border: '1.5px solid var(--asphalt-300)', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--asphalt-600)' }}>
              Clear date filter
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
                {loading ? 'Loading…' : `${sorted.length} trip${sorted.length !== 1 ? 's' : ''} available in your organisation`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--asphalt-500)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 4 }}>Filter by date</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--asphalt-200)', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--asphalt-900)', background: '#fff', outline: 'none' }}
                />
              </div>
              <WpButton kind="primary" size="sm" onClick={load}>
                <WpIcon name="refresh-cw" size={14} color="#fff" /> Refresh
              </WpButton>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, padding: '24px 40px 40px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', padding: 16, boxShadow: 'var(--shadow-1)', border: '1px solid var(--asphalt-100)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>Sort by</div>
              <SortChips vertical />
            </div>
            <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-1)', border: '1px solid var(--asphalt-100)' }}>
              {/* Embedded map */}
              <div style={{ position: 'relative', height: 180 }}>
                <Suspense fallback={<div style={{ height: 180, background: 'var(--asphalt-100)' }} />}>
                  <EmbeddedMap
                    lat={currentUser?.homeLat}
                    lng={currentUser?.homeLng}
                    zoom={13}
                    height={180}
                  />
                </Suspense>
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
                  padding: '20px 12px 10px',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-mono)' }}>
                    How it works
                  </span>
                </div>
              </div>
              {/* Steps */}
              <div style={{ padding: '12px 14px' }}>
                {[
                  { icon: 'search', text: 'Browse trips by colleagues' },
                  { icon: 'list', text: 'Click a trip to view details' },
                  { icon: 'users', text: 'Book a seat with one tap' },
                  { icon: 'map', text: 'Track your ride live' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < 3 ? 10 : 0, alignItems: 'center' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--ink-950)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <WpIcon name={s.icon} size={11} color="var(--voltage-400)" />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--asphalt-600)', fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>{s.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ overflowY: 'auto' }}>
            <TripList />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)' }}>
      <WpAppBar title="Find a Ride" sub={loading ? 'Loading…' : `${sorted.length} trip${sorted.length !== 1 ? 's' : ''} available`} onBack={onBack} />

      <div style={{ background: '#fff', borderBottom: '1px solid var(--asphalt-100)', padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--asphalt-200)', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--asphalt-900)', background: '#fff', outline: 'none' }}
        />
        {dateFilter && (
          <button onClick={() => setDateFilter('')} style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--asphalt-200)', background: 'none', fontSize: 12, color: 'var(--asphalt-600)', cursor: 'pointer' }}>
            Clear
          </button>
        )}
      </div>

      <div style={{ background: '#fff', borderBottom: '1px solid var(--asphalt-100)', padding: '8px 16px', display: 'flex', gap: 8, overflowX: 'auto' }}>
        <SortChips />
      </div>

      <div style={{ padding: '16px', paddingBottom: 32 }}>
        <TripList />
      </div>
    </div>
  );
}
