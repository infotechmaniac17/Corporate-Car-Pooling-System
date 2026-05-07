import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WpAppBar from '../components/WpAppBar';
import WpButton from '../components/WpButton';
import WpPill from '../components/WpPill';
import WpIcon from '../components/WpIcon';
import useIsDesktop from '../hooks/useIsDesktop';
import { getMyPassengerTrips } from '../api/trips';
import { getMyRequests, cancelMyRequest } from '../api/rides';

const STATUS_TONE = {
  ACTIVE: 'live',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

function TripCard({ trip, onTrack, onChat, onRate }) {
  const scheduled = trip.departureTime ? new Date(trip.departureTime) : null;
  const timeStr = scheduled
    ? scheduled.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';
  const dateStr = scheduled
    ? scheduled.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : '—';

  const isLive = trip.status === 'ACTIVE' &&
    (trip.scheduleStatus === 'STARTED' || trip.scheduleStatus === 'ACTIVE');
  const isCompleted = trip.status === 'COMPLETED';

  return (
    <div style={{
      background: '#fff', borderRadius: 'var(--radius-lg)', padding: '16px',
      boxShadow: 'var(--shadow-1)', border: '1px solid var(--asphalt-100)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--asphalt-900)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {trip.pickupLabel || 'Pickup'} → {trip.dropoffLabel || 'Drop-off'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>
            {dateStr} · {timeStr}
          </div>
        </div>
        <WpPill tone={STATUS_TONE[trip.status] || 'matched'}>{trip.status}</WpPill>
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <WpIcon name="user" size={14} color="var(--asphalt-500)" />
          <span style={{ fontSize: 13, color: 'var(--asphalt-700)', fontFamily: 'var(--font-sans)' }}>
            {trip.driverName || '—'}
          </span>
        </div>
        {trip.vehicleNumber && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <WpIcon name="car" size={14} color="var(--asphalt-500)" />
            <span style={{ fontSize: 13, color: 'var(--asphalt-600)', fontFamily: 'var(--font-mono)' }}>
              {trip.vehicleNumber}
            </span>
          </div>
        )}
        {trip.fare != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <WpIcon name="wallet" size={14} color="var(--asphalt-500)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--asphalt-800)', fontFamily: 'var(--font-mono)' }}>
              ₹{trip.fare}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {isLive && (
          <>
            <button
              onClick={() => onTrack(trip.rideId)}
              style={btnStyle('var(--ink-50)', 'var(--ink-700)', '1.5px solid var(--ink-100)')}
            >
              <WpIcon name="map" size={14} color="var(--ink-600)" /> Track
            </button>
            <button
              onClick={() => onChat(trip.rideId)}
              style={btnStyle('var(--ink-50)', 'var(--ink-700)', '1.5px solid var(--ink-100)')}
            >
              <WpIcon name="message" size={14} color="var(--ink-600)" /> Chat
            </button>
          </>
        )}
        {isCompleted && (
          <button
            onClick={() => onRate(trip)}
            style={btnStyle('var(--success-100)', 'var(--success-700)', '1.5px solid rgba(24,169,87,0.2)')}
          >
            <WpIcon name="star" size={14} color="var(--success-700)" /> Rate driver
          </button>
        )}
      </div>
    </div>
  );
}

const btnStyle = (bg, color, border) => ({
  flex: 1, padding: '9px 12px', borderRadius: 'var(--radius-md)',
  background: bg, border, color,
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
});

export default function PassengerTripsScreen() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [trips, setTrips] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      getMyPassengerTrips().then(r => r.data?.data || []).catch(() => []),
      getMyRequests().then(r => r.data?.data || []).catch(() => []),
    ]).then(([t, q]) => {
      setTrips(t);
      setRequests(q);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCancelRequest = async (req) => {
    if (!window.confirm('Cancel this ride request?')) return;
    setCancellingId(`req-${req.id}`);
    try {
      await cancelMyRequest(req.id);
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to cancel request.');
    } finally {
      setCancellingId(null);
    }
  };

  const sorted = [...trips].sort((a, b) => {
    const ta = a.departureTime ? new Date(a.departureTime).getTime() : 0;
    const tb = b.departureTime ? new Date(b.departureTime).getTime() : 0;
    return tb - ta;
  });
  const upcoming = sorted.filter(t => t.status === 'ACTIVE');
  const past = sorted.filter(t => t.status !== 'ACTIVE');
  const pendingRequests = requests.filter(r => r.status === 'PENDING' || r.status === 'ACCEPTED');

  const handleRate = (trip) => {
    navigate(`/rate/${trip.rideId}?driverId=${trip.driverId}`);
  };

  const Content = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--asphalt-500)' }}>
          {upcoming.length} active · {past.length} past
        </div>
        <WpButton kind="accent" size="sm" onClick={() => navigate('/match')}>
          <WpIcon name="search" size={15} color="var(--ink-950)" />
          Find a ride
        </WpButton>
      </div>

      {!loading && pendingRequests.length > 0 && (
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--asphalt-700)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'var(--font-mono)' }}>
            Pending requests
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendingRequests.map(r => {
              const ride = r.rideSchedule || {};
              const dep = ride.departureTime ? new Date(ride.departureTime) : null;
              const when = dep
                ? `${dep.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${dep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : '—';
              return (
                <div key={`req-${r.id}`} style={{
                  background: '#fff', borderRadius: 'var(--radius-lg)', padding: '16px',
                  boxShadow: 'var(--shadow-1)', border: '1px solid var(--asphalt-100)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--asphalt-900)', marginBottom: 3 }}>
                        {ride.pickupLabel || 'Pickup'} → {ride.dropoffLabel || 'Drop-off'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>
                        {when} · driver {ride.driver?.name || ride.driverName || '—'}
                      </div>
                    </div>
                    <WpPill tone={r.status === 'ACCEPTED' ? 'live' : 'matched'}>{r.status}</WpPill>
                  </div>
                  <button
                    onClick={() => handleCancelRequest(r)}
                    disabled={cancellingId === `req-${r.id}`}
                    style={{
                      width: '100%', padding: '9px', borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--danger-200)', background: 'var(--danger-50)',
                      fontSize: 13, fontWeight: 600, color: 'var(--danger-700)',
                      cursor: cancellingId === `req-${r.id}` ? 'wait' : 'pointer',
                      fontFamily: 'var(--font-sans)',
                      opacity: cancellingId === `req-${r.id}` ? 0.5 : 1,
                    }}
                  >
                    {cancellingId === `req-${r.id}` ? 'Cancelling…' : 'Cancel request'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 130, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(90deg, var(--asphalt-100) 25%, var(--asphalt-50) 50%, var(--asphalt-100) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
          ))}
        </div>
      ) : trips.length === 0 && pendingRequests.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '40px 20px', textAlign: 'center', border: '1.5px dashed var(--asphalt-200)' }}>
          <WpIcon name="search" size={36} color="var(--asphalt-300)" />
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--asphalt-600)', marginTop: 12 }}>No trips yet</p>
          <p style={{ fontSize: 13, color: 'var(--asphalt-400)', marginTop: 4 }}>Find a ride to start commuting</p>
          <div style={{ marginTop: 16 }}>
            <WpButton kind="accent" size="md" onClick={() => navigate('/match')}>Find a ride</WpButton>
          </div>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--asphalt-700)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'var(--font-mono)' }}>
                Active
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {upcoming.map(t => (
                  <TripCard
                    key={t.id}
                    trip={t}
                    onTrack={id => navigate(`/tracking/${id}`)}
                    onChat={id => navigate(`/chat/${id}`)}
                    onRate={handleRate}
                  />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--asphalt-400)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'var(--font-mono)' }}>
                Past trips
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {past.map(t => (
                  <TripCard
                    key={t.id}
                    trip={t}
                    onTrack={id => navigate(`/tracking/${id}`)}
                    onChat={id => navigate(`/chat/${id}`)}
                    onRate={handleRate}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (isDesktop) {
    const completed = trips.filter(t => t.status === 'COMPLETED').length;
    const cancelled = trips.filter(t => t.status === 'CANCELLED').length;
    const totalSpend = trips
      .filter(t => t.status === 'COMPLETED' && t.fare != null)
      .reduce((s, t) => s + Number(t.fare || 0), 0);
    return (
      <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)' }}>
        <div style={{ padding: '32px 40px 0' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--asphalt-900)', letterSpacing: '-0.02em' }}>My trips</h1>
          <p style={{ fontSize: 13, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>Active and past trips you've joined</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, padding: '24px 40px 40px', alignItems: 'start' }}>
          <Content />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', padding: 24, boxShadow: 'var(--shadow-2)', border: '1px solid var(--asphalt-100)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--asphalt-400)', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>Overview</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Total trips', value: trips.length, icon: 'car', bg: 'var(--ink-50)', color: 'var(--ink-600)' },
                  { label: 'Active', value: upcoming.length, icon: 'clock', bg: 'var(--voltage-50, #f5ffe0)', color: 'var(--ink-600)' },
                  { label: 'Completed', value: completed, icon: 'check', bg: 'var(--success-100)', color: 'var(--success-700)' },
                  { label: 'Cancelled', value: cancelled, icon: 'x', bg: 'var(--asphalt-100)', color: 'var(--asphalt-500)' },
                  { label: 'Spent (₹)', value: totalSpend, icon: 'wallet', bg: 'var(--asphalt-100)', color: 'var(--asphalt-700)' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <WpIcon name={s.icon} size={14} color={s.color} />
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--asphalt-600)', fontFamily: 'var(--font-sans)' }}>{s.label}</span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--asphalt-900)', fontFamily: 'var(--font-mono)' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <WpButton kind="accent" size="md" full onClick={() => navigate('/match')}>
              <WpIcon name="search" size={15} color="var(--ink-950)" />
              Find a ride
            </WpButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', paddingBottom: 40 }}>
      <WpAppBar title="My trips" onBack={() => navigate(-1)} dark />
      <div style={{ padding: 16 }}>
        <Content />
      </div>
    </div>
  );
}
