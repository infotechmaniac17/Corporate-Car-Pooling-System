import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WpAppBar from '../components/WpAppBar';
import WpButton from '../components/WpButton';
import WpPill from '../components/WpPill';
import WpIcon from '../components/WpIcon';
import useIsDesktop from '../hooks/useIsDesktop';
import { getSchedule } from '../api/rides';

const STATUS_TONE = { SCHEDULED: 'matched', LIVE: 'live', COMPLETED: 'completed', CANCELLED: 'cancelled' };

function RideCard({ ride, onViewRequests }) {
  const scheduled = ride.scheduledTime ? new Date(ride.scheduledTime) : null;
  const timeStr = scheduled
    ? scheduled.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';
  const dateStr = scheduled
    ? scheduled.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : '—';

  return (
    <div style={{
      background: '#fff', borderRadius: 'var(--radius-lg)', padding: '16px',
      boxShadow: 'var(--shadow-1)', border: '1px solid var(--asphalt-100)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--asphalt-900)', marginBottom: 3 }}>
            {ride.pickupLocation || 'Home'} → {ride.dropoffLocation || 'Office'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>
            {dateStr} · {timeStr}
          </div>
        </div>
        <WpPill tone={STATUS_TONE[ride.status] || 'matched'}>{ride.status || 'SCHEDULED'}</WpPill>
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <WpIcon name="users" size={14} color="var(--asphalt-500)" />
          <span style={{ fontSize: 13, color: 'var(--asphalt-600)', fontFamily: 'var(--font-mono)' }}>
            {ride.bookedSeats || 0} / {ride.availableSeats || 4} seats
          </span>
        </div>
        {ride.fare && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <WpIcon name="wallet" size={14} color="var(--asphalt-500)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--asphalt-800)', fontFamily: 'var(--font-mono)' }}>
              ₹{ride.fare}/seat
            </span>
          </div>
        )}
      </div>

      <button
        onClick={() => onViewRequests(ride.id)}
        style={{
          width: '100%', padding: '8px', borderRadius: 'var(--radius-md)',
          border: '1.5px solid var(--asphalt-200)', background: '#fff',
          fontSize: 13, fontWeight: 600, color: 'var(--asphalt-700)',
          cursor: 'pointer', fontFamily: 'var(--font-sans)',
        }}
      >
        View requests →
      </button>
    </div>
  );
}

export default function DriverMyRidesScreen() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSchedule(currentUser?.id)
      .then(res => setRides(res.data?.data || []))
      .catch(() => setRides([]))
      .finally(() => setLoading(false));
  }, [currentUser?.id]);

  const upcoming = rides.filter(r => r.status !== 'COMPLETED' && r.status !== 'CANCELLED');
  const past = rides.filter(r => r.status === 'COMPLETED' || r.status === 'CANCELLED');

  const Content = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--asphalt-500)' }}>
            {upcoming.length} upcoming · {past.length} past
          </div>
        </div>
        <WpButton kind="accent" size="sm" onClick={() => navigate('/driver/offer-ride')}>
          <WpIcon name="plus" size={15} color="var(--ink-950)" />
          New ride
        </WpButton>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 120, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(90deg, var(--asphalt-100) 25%, var(--asphalt-50) 50%, var(--asphalt-100) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
          ))}
        </div>
      ) : rides.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '40px 20px', textAlign: 'center', border: '1.5px dashed var(--asphalt-200)' }}>
          <WpIcon name="car" size={36} color="var(--asphalt-300)" />
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--asphalt-600)', marginTop: 12 }}>No rides yet</p>
          <p style={{ fontSize: 13, color: 'var(--asphalt-400)', marginTop: 4 }}>Offer your first ride to start earning</p>
          <div style={{ marginTop: 16 }}>
            <WpButton kind="accent" size="md" onClick={() => navigate('/driver/offer-ride')}>
              Offer a ride
            </WpButton>
          </div>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--asphalt-700)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'var(--font-mono)' }}>
                Upcoming
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {upcoming.map(r => (
                  <RideCard key={r.id} ride={r} onViewRequests={id => navigate(`/driver/inbox/${id}`)} />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--asphalt-400)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'var(--font-mono)' }}>
                Past rides
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {past.map(r => (
                  <RideCard key={r.id} ride={r} onViewRequests={id => navigate(`/driver/inbox/${id}`)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (isDesktop) {
    const completed = rides.filter(r => r.status === 'COMPLETED').length;
    const cancelled = rides.filter(r => r.status === 'CANCELLED').length;
    return (
      <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)' }}>
        <div style={{ padding: '32px 40px 0' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--asphalt-900)', letterSpacing: '-0.02em' }}>My rides</h1>
          <p style={{ fontSize: 13, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>Your scheduled and completed rides</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, padding: '24px 40px 40px', alignItems: 'start' }}>
          <Content />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', padding: 24, boxShadow: 'var(--shadow-2)', border: '1px solid var(--asphalt-100)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--asphalt-400)', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>Overview</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Total rides', value: rides.length, icon: 'car', bg: 'var(--ink-50)', color: 'var(--ink-600)' },
                  { label: 'Upcoming', value: upcoming.length, icon: 'clock', bg: 'var(--voltage-50, #f5ffe0)', color: 'var(--ink-600)' },
                  { label: 'Completed', value: completed, icon: 'check', bg: 'var(--success-100)', color: 'var(--success-700)' },
                  { label: 'Cancelled', value: cancelled, icon: 'x', bg: 'var(--asphalt-100)', color: 'var(--asphalt-500)' },
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
            <WpButton kind="accent" size="md" full onClick={() => navigate('/driver/offer-ride')}>
              <WpIcon name="plus" size={15} color="var(--ink-950)" />
              New ride
            </WpButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', paddingBottom: 40 }}>
      <WpAppBar title="My rides" onBack={() => navigate(-1)} dark />
      <div style={{ padding: 16 }}>
        <Content />
      </div>
    </div>
  );
}
