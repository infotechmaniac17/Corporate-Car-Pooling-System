import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WpAppBar from '../components/WpAppBar';
import WpButton from '../components/WpButton';
import WpPill from '../components/WpPill';
import WpIcon from '../components/WpIcon';
import WpToast, { useToast } from '../components/WpToast';
import RoutePreviewMap from '../components/RoutePreviewMap';
import useIsDesktop from '../hooks/useIsDesktop';
import { getMyBookings, cancelBooking } from '../api/trips';
import { areaLabel, haversineKm, passengerCo2Saved } from '../utils/rideCalc';
import BookingDetailSheet from '../components/BookingDetailSheet';

// ─── Style constants ───────────────────────────────────────────────────────────

const SHIMMER = {
  background: 'linear-gradient(90deg, var(--asphalt-100) 25%, var(--asphalt-50) 50%, var(--asphalt-100) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s infinite',
};

const BTN_BASE = {
  height: 36, padding: '0 14px', borderRadius: 'var(--radius-md)',
  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)',
  border: 'none',
};
const BTN_PRIMARY = { ...BTN_BASE, background: 'var(--ink-600)', color: '#fff' };
const BTN_GHOST   = { ...BTN_BASE, background: '#fff', color: 'var(--asphalt-700)', border: '1.5px solid var(--asphalt-200)' };
const BTN_DANGER  = { ...BTN_BASE, background: 'var(--danger-600)', color: '#fff' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function passengerVirtualStatus(booking) {
  const s  = booking.status;
  const ss = booking.scheduleStatus;
  if (s === 'COMPLETED') return 'COMPLETED';
  if (s === 'CANCELLED') return 'CANCELLED';
  if (ss === 'STARTED')   return 'LIVE';
  if (ss === 'COMPLETED') return 'COMPLETED';
  if (ss === 'CANCELLED') return 'CANCELLED';
  const dep = booking.departureTime ? new Date(booking.departureTime).getTime() : null;
  if (!dep) return 'UPCOMING';
  const diffMin = (dep - Date.now()) / 60000;
  if (diffMin < -30) return 'OVERDUE';
  if (diffMin <= 30 && diffMin > 0) return 'IMMINENT';
  return 'UPCOMING';
}

function pillConfig(vStatus) {
  switch (vStatus) {
    case 'LIVE':      return { tone: 'live',      label: '● LIVE' };
    case 'COMPLETED': return { tone: 'completed',  label: 'COMPLETED' };
    case 'CANCELLED': return { tone: 'cancelled',  label: 'CANCELLED' };
    case 'OVERDUE':   return { tone: 'cancelled',  label: 'DELAYED' };
    case 'IMMINENT':  return { tone: 'matched',    label: 'SOON' };
    default:          return { tone: 'matched',    label: 'UPCOMING' };
  }
}

function bookingCo2(b) {
  if (!b.pickupLat || !b.dropoffLat || b.status !== 'COMPLETED') return null;
  const km = haversineKm(b.pickupLat, b.pickupLng, b.dropoffLat, b.dropoffLng);
  const g = km * 120;
  return g >= 1000 ? `${(g / 1000).toFixed(1)} kg` : `${Math.round(g)} g`;
}

function hasRated(bookingId) {
  try {
    const arr = JSON.parse(localStorage.getItem('rated_bookings') || '[]');
    return arr.includes(bookingId);
  } catch { return false; }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return <div style={{ height: 120, borderRadius: 'var(--radius-xl)', ...SHIMMER }} />;
}

function SkeletonRow() {
  return <div style={{ height: 56, borderRadius: 'var(--radius-lg)', ...SHIMMER }} />;
}

// ─── ActiveBookingCard ────────────────────────────────────────────────────────

function ActiveBookingCard({ booking, selected, onSelect, onCancelClick, cancelling }) {
  const navigate = useNavigate();
  const vStatus = passengerVirtualStatus(booking);
  const { tone, label } = pillConfig(vStatus);

  const dep = booking.departureTime ? new Date(booking.departureTime) : null;
  const dateStr = dep ? dep.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '—';
  const timeStr = dep ? dep.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';

  const rideId = booking.tripId ?? booking.rideId;
  const inProgress = booking.scheduleStatus === 'STARTED';
  const canCancel = !['COMPLETED', 'CANCELLED'].includes(vStatus) && !inProgress;
  const rated = hasRated(booking.id);

  return (
    <div
      onClick={() => onSelect(booking.id)}
      style={{
        background: '#fff',
        borderRadius: 'var(--radius-xl)',
        border: `1.5px solid ${selected ? 'var(--ink-400)' : 'var(--asphalt-100)'}`,
        boxShadow: selected ? 'var(--shadow-2)' : 'var(--shadow-1)',
        padding: 20,
        cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      {/* Row 1 — Route + pill */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--asphalt-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {areaLabel(booking.pickupLabel)}
          </span>
          <span style={{ fontSize: 13, color: 'var(--asphalt-400)', flexShrink: 0 }}>→</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--asphalt-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {areaLabel(booking.dropoffLabel)}
          </span>
        </div>
        <div style={{ flexShrink: 0 }}><WpPill tone={tone}>{label}</WpPill></div>
      </div>

      {/* Row 2 — Date + time */}
      <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--asphalt-500)', marginBottom: 10 }}>
        🗓 {dateStr} · ⏰ {timeStr}
      </div>

      {/* Row 3 — Driver + vehicle */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
        {booking.driverName && (
          <span style={{ fontSize: 13, color: 'var(--asphalt-700)' }}>
            <WpIcon name="user" size={13} color="var(--asphalt-400)" /> {booking.driverName}
          </span>
        )}
        {booking.vehicleNumber && (
          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--asphalt-500)' }}>
            {booking.vehicleNumber}
          </span>
        )}
        {booking.fare != null && (
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--asphalt-900)', fontFamily: 'var(--font-mono)' }}>
            ₹{booking.fare}
          </span>
        )}
      </div>

      {/* Row 4 — Actions */}
      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {vStatus === 'LIVE' && (
          <>
            <button
              onClick={() => navigate(`/tracking/${rideId}`)}
              aria-label="Track ride"
              style={{ ...BTN_BASE, border: '1.5px solid var(--ink-200)', background: 'var(--ink-50)', color: 'var(--ink-700)' }}
            >
              Track ride
            </button>
            <button
              onClick={() => navigate(`/chat/${rideId}`)}
              aria-label="Chat with driver"
              style={{ ...BTN_BASE, border: '1.5px solid var(--asphalt-200)', background: '#fff', color: 'var(--asphalt-700)' }}
            >
              Chat
            </button>
          </>
        )}
        {vStatus === 'COMPLETED' && !rated && (
          <button
            onClick={() => navigate(`/rate/${rideId}?driverId=${booking.driverId}`)}
            aria-label="Rate driver"
            style={{ ...BTN_BASE, border: '1.5px solid var(--success-300)', background: 'var(--success-50)', color: 'var(--success-700)' }}
          >
            ⭐ Rate driver
          </button>
        )}
        {inProgress && !canCancel && (
          <span style={{ fontSize: 12, color: 'var(--asphalt-400)', alignSelf: 'center' }}>
            Ride is in progress — you cannot cancel now.
          </span>
        )}
        {canCancel && (
          <button
            onClick={() => onCancelClick(booking)}
            disabled={cancelling}
            aria-label="Cancel booking"
            style={{
              ...BTN_BASE, border: '1.5px solid var(--danger-200)', background: 'var(--danger-50)', color: 'var(--danger-700)',
              opacity: cancelling ? 0.5 : 1, cursor: cancelling ? 'not-allowed' : 'pointer',
            }}
          >
            {cancelling ? 'Cancelling…' : 'Cancel booking'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── PastTripRow ──────────────────────────────────────────────────────────────

function PastTripRow({ booking, onClick, isDesktop }) {
  const { tone, label } = pillConfig(passengerVirtualStatus(booking));
  const dep = booking.departureTime ? new Date(booking.departureTime) : null;
  const dateStr = dep ? dep.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';
  const co2 = bookingCo2(booking) ?? '—';

  const rowStyle = {
    background: '#fff', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--asphalt-100)', padding: '14px 16px',
    cursor: 'pointer', transition: 'background 0.1s',
  };
  const hoverOn  = e => { e.currentTarget.style.background = 'var(--asphalt-50)'; };
  const hoverOff = e => { e.currentTarget.style.background = '#fff'; };
  const handleKey = e => { if (e.key === 'Enter' || e.key === ' ') onClick(); };

  if (isDesktop) {
    return (
      <div onClick={onClick} tabIndex={0} role="button" onKeyDown={handleKey}
        onMouseEnter={hoverOn} onMouseLeave={hoverOff} style={rowStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 64, flexShrink: 0, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--asphalt-500)' }}>
            {dateStr}
          </span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: 'var(--asphalt-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {areaLabel(booking.pickupLabel)} → {areaLabel(booking.dropoffLabel)}
          </span>
          <span style={{ width: 100, flexShrink: 0, fontSize: 12, color: 'var(--asphalt-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {booking.driverName ?? '—'}
          </span>
          <span style={{ width: 52, flexShrink: 0, fontSize: 13, fontWeight: 700, color: 'var(--asphalt-900)', fontFamily: 'var(--font-mono)' }}>
            {booking.fare != null ? `₹${booking.fare}` : '—'}
          </span>
          <span style={{ width: 64, flexShrink: 0, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--asphalt-500)' }}>
            🌿 {co2}
          </span>
          <WpPill tone={tone}>{label}</WpPill>
          <span style={{ color: 'var(--asphalt-300)', fontSize: 16, flexShrink: 0 }}>›</span>
        </div>
      </div>
    );
  }

  return (
    <div onClick={onClick} tabIndex={0} role="button" onKeyDown={handleKey}
      onMouseEnter={hoverOn} onMouseLeave={hoverOff} style={rowStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--asphalt-800)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>
          {areaLabel(booking.pickupLabel)} → {areaLabel(booking.dropoffLabel)}
        </span>
        <WpPill tone={tone}>{label}</WpPill>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 8px', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--asphalt-500)' }}>
        <span>{dateStr}</span>
        <span>·</span>
        <span>{booking.driverName ?? '—'}</span>
        <span>·</span>
        <span>{booking.fare != null ? `₹${booking.fare}` : '—'}</span>
      </div>
    </div>
  );
}

// ─── StatsBar ─────────────────────────────────────────────────────────────────

function StatsBar({ bookings }) {
  const completed = bookings.filter(b => b.status === 'COMPLETED');
  const spent = completed.reduce((s, b) => s + (b.fare ?? 0), 0);
  const co2 = passengerCo2Saved(completed);

  const chips = [
    { icon: 'car',    iconBg: 'var(--ink-50)',     iconColor: 'var(--ink-600)',     label: 'TOTAL TRIPS', value: completed.length },
    { icon: 'wallet', iconBg: 'var(--success-100)', iconColor: 'var(--success-700)', label: 'TOTAL SPENT', value: `₹${spent}` },
    { icon: 'leaf',   iconBg: '#f0fdf4',            iconColor: '#16a34a',            label: 'CO₂ SAVED',   value: co2 },
  ];

  return (
    <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', border: '1px solid var(--asphalt-100)', padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        {chips.map(c => (
          <div key={c.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WpIcon name={c.icon} size={14} color={c.iconColor} />
            </div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--asphalt-400)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              {c.label}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--asphalt-900)', fontFamily: 'var(--font-mono)' }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ImminentBanner ───────────────────────────────────────────────────────────

function ImminentBanner({ booking, onDismiss, navigate }) {
  const dep = booking.departureTime ? new Date(booking.departureTime).getTime() : null;
  const diffMin = dep ? (dep - Date.now()) / 60000 : 0;
  const rideId = booking.tripId ?? booking.rideId;
  const isLive = booking.scheduleStatus === 'STARTED';

  let bg, borderColor, message;
  if (diffMin > 15) {
    bg = '#fff8e1'; borderColor = '#ffe082';
    message = `⏰ Your ride starts in ${Math.round(diffMin)} min — be at pickup`;
  } else if (diffMin > 0) {
    bg = '#fff3e0'; borderColor = '#ffb74d';
    message = `⏰ Ride starting soon — ${Math.round(diffMin)} min left`;
  } else {
    bg = 'var(--danger-50)'; borderColor = 'var(--danger-200)';
    message = 'Driver may be delayed — check ride status';
  }

  return (
    <div style={{ background: bg, border: `1px solid ${borderColor}`, borderRadius: 'var(--radius-xl)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--asphalt-800)', flex: 1 }}>{message}</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        {isLive && (
          <button onClick={() => navigate(`/tracking/${rideId}`)} aria-label="Track ride"
            style={{ ...BTN_BASE, background: 'var(--ink-600)', color: '#fff', whiteSpace: 'nowrap' }}>
            Track ride →
          </button>
        )}
        <button onClick={onDismiss} aria-label="Dismiss banner"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1, color: 'var(--asphalt-500)', padding: '0 4px' }}>
          ×
        </button>
      </div>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ onFind }) {
  return (
    <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', padding: '48px 24px', textAlign: 'center', border: '1.5px dashed var(--asphalt-200)' }}>
      <WpIcon name="search" size={36} color="var(--asphalt-300)" />
      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--asphalt-700)', marginTop: 14, marginBottom: 4 }}>No trips yet</p>
      <p style={{ fontSize: 13, color: 'var(--asphalt-400)', marginBottom: 20 }}>Find a ride to get started</p>
      <WpButton kind="accent" size="md" onClick={onFind}>Find a ride</WpButton>
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PassengerTripsScreen() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [toast, showToast, dismissToast] = useToast();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [detailBooking, setDetailBooking] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [imminent, setImminent] = useState(null);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const res = await getMyBookings();
      const raw = res.data?.data || [];
      const data = raw.map(b => ({
        ...b,
        scheduleStatus: b.tripStatus ?? b.scheduleStatus,
        status: b.status === 'CONFIRMED' ? 'ACTIVE' : b.status,
      }));
      setBookings(data);
      setSelectedBookingId(prev => {
        const stillExists = prev && data.find(b => b.id === prev);
        if (stillExists) return prev;
        return data.find(b => !['COMPLETED', 'CANCELLED'].includes(b.status))?.id ?? null;
      });
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Re-fetch on tab focus
  useEffect(() => {
    const onVisible = () => { if (!document.hidden) load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  // Poll 30s while any booking has STARTED schedule
  useEffect(() => {
    if (!bookings.some(b => b.scheduleStatus === 'STARTED')) return;
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [bookings, load]);

  // Derived lists
  const active = bookings.filter(b => !['COMPLETED', 'CANCELLED'].includes(b.status));
  const past   = bookings.filter(b =>  ['COMPLETED', 'CANCELLED'].includes(b.status));

  // Imminent banner
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const found = active.find(b => {
        if (!b.departureTime) return false;
        const diffMin = (new Date(b.departureTime).getTime() - now) / 60000;
        const dismissed = localStorage.getItem(`dismissed_passenger_imminent_${b.id}`);
        return diffMin <= 30 && diffMin > -30 && !dismissed;
      });
      setImminent(found ?? null);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [active]);

  // Map wiring
  const mapBooking = bookings.find(b => b.id === selectedBookingId) ?? null;
  const mapPickup  = mapBooking ? { lat: mapBooking.pickupLat,  lng: mapBooking.pickupLng,  label: mapBooking.pickupLabel  } : null;
  const mapDropoff = mapBooking ? { lat: mapBooking.dropoffLat, lng: mapBooking.dropoffLng, label: mapBooking.dropoffLabel } : null;

  // Cancel handler
  const handleConfirmCancel = useCallback(async () => {
    const booking = confirmCancel;
    setConfirmCancel(null);
    setCancellingId(booking.id);
    try {
      await cancelBooking(booking.tripId ?? booking.rideId, booking.id);
      await load();
      showToast({ message: 'Booking cancelled', colour: 'grey', duration: 3000 });
    } catch {
      showToast({ message: 'Failed to cancel. Try again.', colour: 'red', duration: 5000 });
    } finally {
      setCancellingId(null);
    }
  }, [confirmCancel, load, showToast]);

  // ── Derived flags ─────────────────────────────────────────────────────────────

  const hasActive  = active.length > 0;
  const hasPast    = past.length > 0;
  const hasAny     = bookings.length > 0;
  const initLoad   = loading && bookings.length === 0;

  // ── Shared blocks ─────────────────────────────────────────────────────────────

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
      <div>
        <h1 style={{ fontSize: isDesktop ? 26 : 22, fontWeight: 800, color: 'var(--asphalt-900)', letterSpacing: '-0.02em', margin: 0 }}>
          My trips
        </h1>
        <p style={{ fontSize: 13, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: 4, marginBottom: 0 }}>
          {active.length} active · {past.length} past
        </p>
      </div>
      <WpButton kind="accent" size="sm" onClick={() => navigate('/trips')}>
        <WpIcon name="search" size={15} color="var(--ink-950)" />
        Find a ride
      </WpButton>
    </div>
  );

  const errorBanner = loadError && (
    <div style={{ background: 'var(--danger-50)', border: '1px solid var(--danger-200)', borderRadius: 'var(--radius-lg)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: 'var(--danger-700)' }}>Failed to load trips.</span>
      <button onClick={load} style={{ ...BTN_BASE, background: 'none', border: '1px solid var(--danger-300)', color: 'var(--danger-700)', height: 30 }}>Retry</button>
    </div>
  );

  const imminentBanner = imminent && (
    <ImminentBanner
      booking={imminent}
      navigate={navigate}
      onDismiss={() => {
        localStorage.setItem(`dismissed_passenger_imminent_${imminent.id}`, '1');
        setImminent(null);
      }}
    />
  );

  // Inline cancel confirm block
  const cancelConfirmBlock = confirmCancel && (() => {
    const dep = confirmCancel.departureTime ? new Date(confirmCancel.departureTime) : null;
    const ds = dep ? dep.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';
    const ts = dep ? dep.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
    return (
      <div style={{ background: 'var(--danger-50)', border: '1px solid var(--danger-200)', borderRadius: 'var(--radius-xl)', padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--asphalt-900)', marginBottom: 4 }}>Cancel this booking?</div>
        <div style={{ fontSize: 12, color: 'var(--asphalt-500)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
          Ride to {areaLabel(confirmCancel.dropoffLabel)} on {ds} at {ts}
        </div>
        <div style={{ fontSize: 12, color: '#d97706', marginBottom: 12 }}>⚠ Cancellations may affect your reliability score</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleConfirmCancel} disabled={!!cancellingId}
            style={{ ...BTN_DANGER, opacity: cancellingId ? 0.5 : 1, cursor: cancellingId ? 'not-allowed' : 'pointer' }}>
            {cancellingId ? 'Cancelling…' : 'Yes, cancel'}
          </button>
          <button onClick={() => setConfirmCancel(null)} style={BTN_GHOST}>Keep booking</button>
        </div>
      </div>
    );
  })();

  const activeCards = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {initLoad
        ? [1, 2].map(i => <SkeletonCard key={i} />)
        : active.map(b => (
            <ActiveBookingCard
              key={b.id}
              booking={b}
              selected={selectedBookingId === b.id}
              onSelect={setSelectedBookingId}
              onCancelClick={setConfirmCancel}
              cancelling={cancellingId === b.id}
            />
          ))
      }
    </div>
  );

  const statsBar = hasPast && <StatsBar bookings={bookings} />;

  const pastSection = hasPast && (
    <div>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--asphalt-400)', textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'var(--font-mono)', marginBottom: 10, marginTop: 0 }}>
        Past trips
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {initLoad
          ? [1, 2, 3, 4].map(i => <SkeletonRow key={i} />)
          : past.map(b => (
              <PastTripRow key={b.id} booking={b} onClick={() => setDetailBooking(b)} isDesktop={isDesktop} />
            ))
        }
      </div>
    </div>
  );


  // ── Desktop layout ────────────────────────────────────────────────────────────

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 40px 60px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {header}
            {errorBanner}
            {imminentBanner}
            {cancelConfirmBlock}

            {!hasAny && !initLoad
              ? <EmptyState onFind={() => navigate('/trips')} />
              : (
                <>
                  {(hasActive || initLoad) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
                        {activeCards}
                      </div>
                      <div style={{ position: 'sticky', top: 24 }}>
                        <div style={{ borderRadius: 'var(--radius-2xl)', overflow: 'hidden', height: 'calc(100vh - 200px)', maxHeight: 500 }}>
                          <RoutePreviewMap pickup={mapPickup} dropoff={mapDropoff} height={500} />
                        </div>
                      </div>
                    </div>
                  )}
                  {statsBar}
                  {pastSection}
                </>
              )
            }
          </div>
        </div>
        <WpToast toast={toast} onDismiss={dismissToast} isDesktop />
        {detailBooking && <BookingDetailSheet booking={detailBooking} onClose={() => setDetailBooking(null)} isDesktop />}
      </div>
    );
  }

  // ── Mobile layout ─────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', paddingBottom: 60 }}>
      <WpAppBar title="My trips" onBack={() => navigate(-1)} dark />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {header}
        {errorBanner}
        {imminentBanner}
        {cancelConfirmBlock}

        {!hasAny && !initLoad
          ? <EmptyState onFind={() => navigate('/trips')} />
          : (
            <>
              {(hasActive || initLoad) && (
                <>
                  {activeCards}
                  <div style={{ borderRadius: 'var(--radius-2xl)', overflow: 'hidden', height: 220, background: '#fff', border: '1px solid var(--asphalt-100)' }}>
                    <RoutePreviewMap pickup={mapPickup} dropoff={mapDropoff} height={220} />
                  </div>
                </>
              )}
              {statsBar}
              {pastSection}
            </>
          )
        }
      </div>
      <WpToast toast={toast} onDismiss={dismissToast} isDesktop={false} />
      {detailBooking && <BookingDetailSheet booking={detailBooking} onClose={() => setDetailBooking(null)} isDesktop={false} />}
    </div>
  );
}
