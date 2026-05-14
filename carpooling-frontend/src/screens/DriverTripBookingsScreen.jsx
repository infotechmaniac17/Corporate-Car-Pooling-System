import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WpAppBar from '../components/WpAppBar';
import WpPill from '../components/WpPill';
import WpIcon from '../components/WpIcon';
import useIsDesktop from '../hooks/useIsDesktop';
import { getTripBookings } from '../api/trips';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_META = {
  CONFIRMED: { tone: 'matched', label: 'Confirmed' },
  CANCELLED: { tone: 'cancelled', label: 'Cancelled' },
};

function PassengerCard({ booking }) {
  const meta = STATUS_META[booking.status] || STATUS_META.CONFIRMED;
  const initials = getInitials(booking.passengerName);
  const isCancelled = booking.status === 'CANCELLED';

  return (
    <div style={{
      background: '#fff',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-2)',
      border: `1px solid ${isCancelled ? 'var(--asphalt-150, #e8eaed)' : 'var(--asphalt-100)'}`,
      overflow: 'hidden',
      opacity: isCancelled ? 0.65 : 1,
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px 12px',
        borderBottom: '1px solid var(--asphalt-100)',
      }}>
        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: isCancelled ? 'var(--asphalt-100)' : 'var(--ink-900)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700,
          color: isCancelled ? 'var(--asphalt-400)' : '#fff',
          letterSpacing: '0.02em',
        }}>
          {initials}
        </div>

        {/* Name + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: 'var(--asphalt-900)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {booking.passengerName || `Passenger #${booking.id}`}
          </div>
          <div style={{ fontSize: 11, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
            {timeAgo(booking.createdAt)}
            {booking.fare != null && (
              <span style={{ marginLeft: 8, color: 'var(--asphalt-600)', fontWeight: 600 }}>
                · ₹{Number(booking.fare).toFixed(0)}
              </span>
            )}
          </div>
        </div>

        <WpPill tone={meta.tone}>{meta.label}</WpPill>
      </div>

      {/* Route visualization */}
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ display: 'flex', gap: 14 }}>
          {/* Timeline spine */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 3, flexShrink: 0 }}>
            {/* Pickup dot */}
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: '#fff', border: '2.5px solid var(--ink-700)',
              flexShrink: 0,
            }} />
            {/* Connector */}
            <div style={{
              width: 2, flex: 1, minHeight: 28,
              background: 'repeating-linear-gradient(to bottom, var(--asphalt-300) 0px, var(--asphalt-300) 4px, transparent 4px, transparent 8px)',
              margin: '3px 0',
            }} />
            {/* Dropoff dot */}
            <div style={{
              width: 10, height: 10, borderRadius: 2,
              background: 'var(--ink-700)',
              flexShrink: 0,
            }} />
          </div>

          {/* Labels */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
            {/* Pickup */}
            <div>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase',
                color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginBottom: 2,
              }}>
                Pickup
              </div>
              <div style={{
                fontSize: 13, fontWeight: 600, color: 'var(--asphalt-900)', lineHeight: 1.35,
              }}>
                {booking.pickupLabel || '—'}
              </div>
            </div>

            {/* Dropoff */}
            <div>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase',
                color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginBottom: 2,
              }}>
                Drop-off
              </div>
              <div style={{
                fontSize: 13, fontWeight: 600, color: 'var(--asphalt-900)', lineHeight: 1.35,
              }}>
                {booking.dropoffLabel || '—'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DriverTripBookingsScreen() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getTripBookings(tripId)
      .then(res => setBookings(res.data?.data || []))
      .catch(err => setError(err?.response?.data?.message || 'Failed to load bookings'))
      .finally(() => setLoading(false));
  }, [tripId]);

  const confirmed = bookings.filter(b => b.status === 'CONFIRMED');
  const cancelled = bookings.filter(b => b.status === 'CANCELLED');

  const Content = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stats strip */}
      {!loading && !error && bookings.length > 0 && (
        <div style={{
          display: 'flex', gap: 10,
        }}>
          {[
            { label: 'Confirmed', value: confirmed.length, bg: 'var(--success-50)', color: 'var(--success-700)', border: 'var(--success-200)' },
            { label: 'Cancelled', value: cancelled.length, bg: 'var(--asphalt-50)', color: 'var(--asphalt-500)', border: 'var(--asphalt-200)' },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-lg)',
              background: s.bg, border: `1px solid ${s.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              height: 130, borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(90deg, var(--asphalt-100) 25%, var(--asphalt-50) 50%, var(--asphalt-100) 75%)',
              backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
            }} />
          ))}
        </div>
      ) : error ? (
        <div style={{
          background: 'var(--danger-50)', border: '1px solid var(--danger-200)',
          borderRadius: 'var(--radius-lg)', padding: '16px 18px',
          fontSize: 14, color: 'var(--danger-700)', fontWeight: 500,
        }}>
          {error}
        </div>
      ) : bookings.length === 0 ? (
        <div style={{
          background: '#fff', borderRadius: 'var(--radius-xl)', padding: '48px 24px',
          textAlign: 'center', border: '1.5px dashed var(--asphalt-200)',
          boxShadow: 'var(--shadow-1)',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: 'var(--asphalt-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
          }}>
            <WpIcon name="users" size={26} color="var(--asphalt-400)" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--asphalt-700)', margin: 0 }}>No bookings yet</p>
          <p style={{ fontSize: 13, color: 'var(--asphalt-400)', marginTop: 4 }}>Passengers will appear here once they book</p>
        </div>
      ) : (
        <>
          {confirmed.length > 0 && (
            <div>
              <div style={{
                fontSize: 11, fontWeight: 700, color: 'var(--asphalt-500)',
                textTransform: 'uppercase', letterSpacing: '.08em',
                fontFamily: 'var(--font-mono)', marginBottom: 10,
              }}>
                Confirmed · {confirmed.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {confirmed.map(b => <PassengerCard key={b.id} booking={b} />)}
              </div>
            </div>
          )}
          {cancelled.length > 0 && (
            <div>
              <div style={{
                fontSize: 11, fontWeight: 700, color: 'var(--asphalt-400)',
                textTransform: 'uppercase', letterSpacing: '.08em',
                fontFamily: 'var(--font-mono)', marginBottom: 10,
              }}>
                Cancelled · {cancelled.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cancelled.map(b => <PassengerCard key={b.id} booking={b} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)' }}>
        <div style={{ padding: '32px 40px 0' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: 'var(--asphalt-500)', fontWeight: 600,
              padding: 0, marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <WpIcon name="arrow-left" size={14} color="var(--asphalt-500)" />
            Back to my rides
          </button>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--asphalt-900)', letterSpacing: '-0.02em', margin: 0 }}>
            Trip bookings
          </h1>
          <p style={{ fontSize: 13, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
            Passengers booked for trip #{tripId}
          </p>
        </div>
        <div style={{ padding: '24px 40px 40px', maxWidth: 680 }}>
          <Content />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', paddingBottom: 40 }}>
      <WpAppBar title="Trip bookings" onBack={() => navigate(-1)} dark />
      <div style={{ padding: 16 }}>
        <Content />
      </div>
    </div>
  );
}
