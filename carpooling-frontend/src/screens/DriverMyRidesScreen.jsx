import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WpAppBar from '../components/WpAppBar';
import WpButton from '../components/WpButton';
import WpPill from '../components/WpPill';
import WpIcon from '../components/WpIcon';
import WpToast, { useToast } from '../components/WpToast';
import RoutePreviewMap from '../components/RoutePreviewMap';
import useIsDesktop from '../hooks/useIsDesktop';
import useCountdown from '../hooks/useCountdown';
import useDriverLocationStream from '../hooks/useDriverLocationStream';
import useRideEventsSubscription from '../hooks/useRideEventsSubscription';
import { getMyDriverTrips } from '../api/trips';
import { cancelSchedule, updateScheduleStatus } from '../api/rides';
import {
  areaLabel, co2Saved, driverCo2Saved, totalEarnings, virtualStatus,
} from '../utils/rideCalc';
import RideDetailSheet from '../components/RideDetailSheet';

// ─── Style constants ───────────────────────────────────────────────────────────

const SHIMMER = {
  background: 'linear-gradient(90deg, var(--asphalt-100) 25%, var(--asphalt-50) 50%, var(--asphalt-100) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s infinite',
};

const BTN_BASE = {
  height: 36, padding: '0 14px', borderRadius: 'var(--radius-md)',
  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)',
  border: 'none', transition: 'opacity 0.15s',
};
const BTN_PRIMARY = { ...BTN_BASE, background: 'var(--ink-600)', color: '#fff' };
const BTN_GHOST   = { ...BTN_BASE, background: '#fff', color: 'var(--asphalt-700)', border: '1.5px solid var(--asphalt-200)' };
const BTN_DANGER  = { ...BTN_BASE, background: 'var(--danger-600)', color: '#fff' };

// ─── Helpers ───────────────────────────────────────────────────────────────────

function pillConfig(vStatus) {
  switch (vStatus) {
    case 'STARTED':   return { tone: 'live',      label: '● LIVE' };
    case 'COMPLETED': return { tone: 'completed',  label: 'COMPLETED' };
    case 'CANCELLED': return { tone: 'cancelled',  label: 'CANCELLED' };
    case 'OVERDUE':   return { tone: 'cancelled',  label: 'OVERDUE' };
    case 'DELAYED':   return { tone: 'warn',       label: 'DELAYED' };
    case 'IMMINENT':  return { tone: 'matched',    label: 'SOON' };
    case 'ACTIVE':    return { tone: 'matched',    label: 'ACTIVE' };
    default:          return { tone: 'matched',    label: 'SCHEDULED' };
  }
}

function bookedCount(ride) {
  if (ride.bookedSeats != null) return ride.bookedSeats;
  return Math.max(0, (ride.availableSeats ?? 0) - (ride.seatsLeft ?? 0));
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return <div style={{ height: 120, borderRadius: 'var(--radius-xl)', ...SHIMMER }} />;
}

function SkeletonRow() {
  return <div style={{ height: 56, borderRadius: 'var(--radius-lg)', ...SHIMMER }} />;
}

// ─── ConfirmBlock (inline action confirmation) ─────────────────────────────────

function ConfirmBlock({ title, lines, confirmLabel, cancelLabel, disabled, onConfirm, onCancel }) {
  return (
    <div onClick={e => e.stopPropagation()} style={{ borderTop: '1px solid var(--asphalt-100)', paddingTop: 12, marginTop: 4 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--asphalt-900)', marginBottom: 6 }}>{title}</div>
      {lines.filter(Boolean).map((line, i) => (
        <div key={i} style={{ fontSize: 12, color: 'var(--asphalt-600)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>
          {line}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button onClick={onConfirm} disabled={disabled} style={{ ...BTN_PRIMARY, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
          {confirmLabel}
        </button>
        <button onClick={onCancel} style={BTN_GHOST}>{cancelLabel}</button>
      </div>
    </div>
  );
}

// ─── ActiveRideCard ────────────────────────────────────────────────────────────

function ActiveRideCard({ ride, selected, onSelect, onStart, onEnd, onCancel, statusChanging, cancelling }) {
  const navigate = useNavigate();
  const [confirmMode, setConfirmMode] = useState(null); // 'start'|'end'|'cancel'
  const [cancelNote, setCancelNote] = useState('');
  const [cardError, setCardError] = useState(null);
  const errorTimerRef = useRef(null);

  const vStatus = virtualStatus(ride);
  const { tone, label } = pillConfig(vStatus);

  const dep = ride.departureTime ? new Date(ride.departureTime) : null;
  const dateStr = dep ? dep.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '—';
  const timeStr = dep ? dep.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
  const countdown = useCountdown(ride.departureTime);

  const booked = bookedCount(ride);
  const totalSeats = ride.availableSeats ?? 0;
  const seatsFull = totalSeats > 0 && booked >= totalSeats;
  const isOverdue = vStatus === 'OVERDUE';

  const showCardError = (msg) => {
    setCardError(msg);
    clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setCardError(null), 5000);
  };

  useEffect(() => () => clearTimeout(errorTimerRef.current), []);

  // Escape key dismisses confirm
  useEffect(() => {
    if (!confirmMode) return;
    const handler = (e) => { if (e.key === 'Escape') setConfirmMode(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [confirmMode]);

  const canStart  = ['CREATED', 'ACTIVE', 'IMMINENT', 'DELAYED'].includes(vStatus);
  const canEnd    = vStatus === 'STARTED' || vStatus === 'OVERDUE';
  const canCancel = ['CREATED', 'ACTIVE', 'STARTED', 'OVERDUE', 'DELAYED', 'IMMINENT'].includes(vStatus);

  return (
    <div
      onClick={() => onSelect(ride.id)}
      style={{
        background: isOverdue ? 'var(--danger-50)' : '#fff',
        borderRadius: 'var(--radius-xl)',
        border: `1.5px solid ${selected ? 'var(--ink-400)' : isOverdue ? 'var(--danger-200)' : 'var(--asphalt-100)'}`,
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
            {areaLabel(ride.pickupLabel)}
          </span>
          <span style={{ fontSize: 13, color: 'var(--asphalt-400)', flexShrink: 0 }}>→</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--asphalt-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {areaLabel(ride.dropoffLabel)}
          </span>
        </div>
        <div style={{ flexShrink: 0 }}>
          <WpPill tone={tone}>{label}</WpPill>
        </div>
      </div>

      {/* Row 2 — Meta chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 10px', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--asphalt-500)', marginBottom: 14 }}>
        <span>🗓 {dateStr}</span>
        <span>·</span>
        <span>⏰ {timeStr}</span>
        <span>·</span>
        <span style={{ color: seatsFull ? '#d97706' : undefined }}>👥 {booked}/{totalSeats} seats</span>
        {ride.fare != null && <><span>·</span><span>₹{ride.fare}/seat</span></>}
        {countdown && !['STARTED', 'OVERDUE'].includes(vStatus) && (
          <>
            <span>·</span>
            <span style={{ color: countdown.urgent ? 'var(--danger-600)' : 'var(--ink-500)', fontWeight: countdown.urgent ? 700 : 500 }}>
              {countdown.urgent ? '🔴 ' : '🕐 '}{countdown.label}
            </span>
          </>
        )}
      </div>

      {/* Overdue notice */}
      {isOverdue && (
        <div style={{ fontSize: 12, color: 'var(--danger-700)', fontWeight: 500, marginBottom: 10 }}>
          This ride was scheduled for {timeStr}. It may have been auto-cancelled.
        </div>
      )}

      {/* Card-level error */}
      {cardError && (
        <div style={{ fontSize: 12, color: 'var(--danger-700)', background: 'var(--danger-50)', border: '1px solid var(--danger-200)', borderRadius: 'var(--radius-md)', padding: '8px 12px', marginBottom: 10 }}>
          {cardError}
        </div>
      )}

      {/* View bookings link */}
      {booked > 0 && !confirmMode && (
        <div style={{ marginBottom: 10 }}>
          <button
            onClick={e => { e.stopPropagation(); navigate(`/driver/trips/${ride.id}/bookings`); }}
            aria-label="View passenger bookings"
            style={{ background: 'none', border: 'none', color: 'var(--ink-500)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'var(--font-sans)' }}
          >
            View {booked} passenger{booked !== 1 ? 's' : ''} →
          </button>
        </div>
      )}

      {/* Inline: Start confirm */}
      {confirmMode === 'start' && (
        <ConfirmBlock
          title="Start this ride now?"
          lines={[
            `Passengers booked: ${booked}`,
            dep ? `Departure: ${timeStr}` : null,
            booked === 0 ? 'No passengers on this ride.' : null,
          ]}
          confirmLabel={statusChanging ? 'Starting…' : 'Confirm start'}
          cancelLabel="Not yet"
          disabled={statusChanging}
          onConfirm={() => { setConfirmMode(null); onStart(ride.id, showCardError); }}
          onCancel={() => setConfirmMode(null)}
        />
      )}

      {/* Inline: End confirm */}
      {confirmMode === 'end' && (
        <ConfirmBlock
          title={isOverdue ? 'Mark ride as completed?' : 'Complete this ride?'}
          lines={[`Passengers: ${booked}`]}
          confirmLabel={statusChanging ? 'Completing…' : isOverdue ? 'Mark completed' : 'Complete ride'}
          cancelLabel="Still going"
          disabled={statusChanging}
          onConfirm={() => { setConfirmMode(null); onEnd(ride.id, showCardError); }}
          onCancel={() => setConfirmMode(null)}
        />
      )}

      {/* Inline: Cancel confirm */}
      {confirmMode === 'cancel' && (
        <div onClick={e => e.stopPropagation()} style={{ borderTop: '1px solid var(--asphalt-100)', paddingTop: 12, marginTop: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--asphalt-900)', marginBottom: 8 }}>Cancel this ride?</div>
          <textarea
            placeholder="Reason (optional)"
            value={cancelNote}
            onChange={e => setCancelNote(e.target.value)}
            rows={2}
            style={{
              width: '100%', fontSize: 13, fontFamily: 'var(--font-sans)', borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--asphalt-200)', padding: '8px 10px', resize: 'none',
              boxSizing: 'border-box', marginBottom: 8, outline: 'none',
            }}
          />
          {booked > 0 && (
            <div style={{ fontSize: 12, color: '#d97706', marginBottom: 8 }}>
              ⚠ {booked} passenger{booked !== 1 ? 's' : ''} will be notified
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setConfirmMode(null); onCancel(ride, cancelNote, showCardError); }}
              disabled={cancelling}
              aria-label="Confirm cancel ride"
              style={{ ...BTN_DANGER, opacity: cancelling ? 0.5 : 1, cursor: cancelling ? 'not-allowed' : 'pointer' }}
            >
              {cancelling ? 'Cancelling…' : 'Yes, cancel'}
            </button>
            <button onClick={() => setConfirmMode(null)} style={BTN_GHOST} aria-label="Keep ride">
              Keep ride
            </button>
          </div>
        </div>
      )}

      {/* Normal action buttons */}
      {!confirmMode && (
        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {canStart && (
            <button
              onClick={() => setConfirmMode('start')}
              disabled={statusChanging}
              aria-label="Start ride"
              style={{
                ...BTN_BASE, border: '1.5px solid var(--success-300)', background: 'var(--success-50)', color: 'var(--success-700)',
                opacity: statusChanging ? 0.5 : 1, cursor: statusChanging ? 'not-allowed' : 'pointer',
              }}
            >
              {vStatus === 'DELAYED' ? 'Start now (late)' : 'Start ride'}
            </button>
          )}
          {canEnd && vStatus !== 'OVERDUE' && (
            <button
              onClick={() => setConfirmMode('end')}
              disabled={statusChanging}
              aria-label="End ride"
              style={{
                ...BTN_BASE, border: '1.5px solid var(--ink-300)', background: 'var(--ink-50)', color: 'var(--ink-700)',
                opacity: statusChanging ? 0.5 : 1, cursor: statusChanging ? 'not-allowed' : 'pointer',
              }}
            >
              {statusChanging ? 'Ending…' : 'End ride'}
            </button>
          )}
          {vStatus === 'OVERDUE' && (
            <button
              onClick={() => setConfirmMode('end')}
              disabled={statusChanging}
              aria-label="Mark ride as completed"
              style={{
                ...BTN_BASE, border: '1.5px solid var(--ink-300)', background: 'var(--ink-50)', color: 'var(--ink-700)',
                opacity: statusChanging ? 0.5 : 1, cursor: statusChanging ? 'not-allowed' : 'pointer',
              }}
            >
              Mark as completed
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => { setCancelNote(''); setConfirmMode('cancel'); }}
              disabled={cancelling}
              aria-label="Cancel ride"
              style={{
                ...BTN_BASE, border: '1.5px solid var(--danger-200)', background: 'var(--danger-50)', color: 'var(--danger-700)',
                opacity: cancelling ? 0.5 : 1, cursor: cancelling ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PastRideRow ──────────────────────────────────────────────────────────────

function PastRideRow({ ride, onClick, isDesktop }) {
  const { tone, label } = pillConfig(virtualStatus(ride));
  const dep = ride.departureTime ? new Date(ride.departureTime) : null;
  const dateStr = dep ? dep.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';
  const booked = bookedCount(ride);
  const earnings = ride.status === 'COMPLETED' && booked > 0 ? `₹${(ride.fare ?? 0) * booked}` : '—';
  const co2 = ride.status === 'COMPLETED' ? (co2Saved(ride) ?? '—') : '—';

  const rowStyle = {
    background: '#fff', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--asphalt-100)', padding: '14px 16px',
    cursor: 'pointer', transition: 'background 0.1s',
  };

  const handleKey = (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); };
  const hoverOn = (e) => { e.currentTarget.style.background = 'var(--asphalt-50)'; };
  const hoverOff = (e) => { e.currentTarget.style.background = '#fff'; };

  if (isDesktop) {
    return (
      <div
        onClick={onClick} tabIndex={0} role="button" onKeyDown={handleKey}
        onMouseEnter={hoverOn} onMouseLeave={hoverOff}
        style={rowStyle}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 64, flexShrink: 0, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--asphalt-500)' }}>
            {dateStr}
          </span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: 'var(--asphalt-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {areaLabel(ride.pickupLabel)} → {areaLabel(ride.dropoffLabel)}
          </span>
          <span style={{ width: 52, flexShrink: 0, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--asphalt-500)' }}>
            👥 {booked}
          </span>
          <span style={{ width: 64, flexShrink: 0, fontSize: 13, fontWeight: 700, color: 'var(--asphalt-900)', fontFamily: 'var(--font-mono)' }}>
            {earnings}
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
    <div
      onClick={onClick} tabIndex={0} role="button" onKeyDown={handleKey}
      onMouseEnter={hoverOn} onMouseLeave={hoverOff}
      style={rowStyle}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--asphalt-800)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>
          {areaLabel(ride.pickupLabel)} → {areaLabel(ride.dropoffLabel)}
        </span>
        <WpPill tone={tone}>{label}</WpPill>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 8px', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--asphalt-500)' }}>
        <span>{dateStr}</span>
        <span>·</span>
        <span>👥 {booked}</span>
        <span>·</span>
        <span>{earnings}</span>
        <span>·</span>
        <span>🌿 {co2}</span>
      </div>
    </div>
  );
}

// ─── StatsBar ─────────────────────────────────────────────────────────────────

function StatsBar({ rides }) {
  const earned = rides
    .filter(r => r.status === 'COMPLETED')
    .reduce((s, r) => s + totalEarnings(r), 0);
  const co2 = driverCo2Saved(rides);

  const chips = [
    { icon: 'car',    iconBg: 'var(--ink-50)',     iconColor: 'var(--ink-600)',     label: 'TOTAL RIDES', value: rides.length },
    { icon: 'wallet', iconBg: 'var(--success-100)', iconColor: 'var(--success-700)', label: 'EARNED',      value: `₹${earned}` },
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

function ImminentBanner({ ride, onStart, onDismiss }) {
  const dep = ride.departureTime ? new Date(ride.departureTime).getTime() : null;
  const diffMin = dep ? (dep - Date.now()) / 60000 : 0;

  let bg, borderColor, message;
  if (diffMin > 15) {
    bg = '#fff8e1'; borderColor = '#ffe082';
    message = `⏰ Your ride to ${areaLabel(ride.dropoffLabel)} starts in ${Math.round(diffMin)} min — tap to start`;
  } else if (diffMin > 0) {
    bg = '#fff3e0'; borderColor = '#ffb74d';
    message = `⏰ Starting soon — ${Math.round(diffMin)} min left`;
  } else {
    bg = 'var(--danger-50)'; borderColor = 'var(--danger-200)';
    message = `Was scheduled ${Math.round(-diffMin)} min ago — start or mark delayed`;
  }

  return (
    <div style={{ background: bg, border: `1px solid ${borderColor}`, borderRadius: 'var(--radius-xl)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--asphalt-800)', flex: 1 }}>{message}</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <button
          onClick={() => onStart(ride.id)}
          aria-label="Start ride"
          style={{ ...BTN_BASE, background: 'var(--ink-600)', color: '#fff', whiteSpace: 'nowrap' }}
        >
          Start ride →
        </button>
        <button
          onClick={onDismiss}
          aria-label="Dismiss banner"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1, color: 'var(--asphalt-500)', padding: '0 4px' }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ onOffer }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 'var(--radius-xl)', padding: '48px 24px',
      textAlign: 'center', border: '1.5px dashed var(--asphalt-200)',
    }}>
      <WpIcon name="car" size={36} color="var(--asphalt-300)" />
      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--asphalt-700)', marginTop: 14, marginBottom: 4 }}>No rides yet</p>
      <p style={{ fontSize: 13, color: 'var(--asphalt-400)', marginBottom: 20 }}>Offer your first ride to start earning</p>
      <WpButton kind="accent" size="md" onClick={onOffer}>Offer a ride</WpButton>
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DriverMyRidesScreen() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [toast, showToast, dismissToast] = useToast();

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedRideId, setSelectedRideId] = useState(null);
  const [detailRide, setDetailRide] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [statusChangingId, setStatusChangingId] = useState(null);
  const [imminent, setImminent] = useState(null);

  const startedRideId = rides.find(r => r.status === 'STARTED')?.id ?? null;
  useDriverLocationStream(startedRideId);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const res = await getMyDriverTrips();
      const data = res.data?.data || [];
      setRides(data);
      setSelectedRideId(prev => {
        const stillExists = prev && data.find(r => r.id === prev);
        if (stillExists) return prev;
        return data.find(r => !['COMPLETED', 'CANCELLED'].includes(r.status))?.id ?? null;
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

  // Poll 30s while any ride is STARTED
  useEffect(() => {
    if (!rides.some(r => r.status === 'STARTED')) return;
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [rides, load]);

  // Derived lists
  const upcoming = rides.filter(r => !['COMPLETED', 'CANCELLED'].includes(r.status));
  const past     = rides.filter(r =>  ['COMPLETED', 'CANCELLED'].includes(r.status));

  // Real-time status sync for own published rides
  const upcomingIds = upcoming.map(r => r.id).filter(Boolean);
  useRideEventsSubscription(upcomingIds, () => load());

  // Imminent banner — check every 60s
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const found = upcoming.find(ride => {
        if (!ride.departureTime || ride.status === 'STARTED') return false;
        const diffMin = (new Date(ride.departureTime).getTime() - now) / 60000;
        const dismissed = localStorage.getItem(`dismissed_imminent_${ride.id}`);
        return diffMin <= 30 && diffMin > -30 && !dismissed;
      });
      setImminent(found ?? null);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [upcoming]);

  // Map wiring
  const mapRide    = rides.find(r => r.id === selectedRideId) ?? null;
  const mapPickup  = mapRide ? { lat: mapRide.pickupLat,  lng: mapRide.pickupLng,  label: mapRide.pickupLabel  } : null;
  const mapDropoff = mapRide ? { lat: mapRide.dropoffLat, lng: mapRide.dropoffLng, label: mapRide.dropoffLabel } : null;

  // ── Action handlers ──────────────────────────────────────────────────────────

  const handleStartRide = useCallback(async (rideId, showCardError) => {
    setStatusChangingId(rideId);
    try {
      await updateScheduleStatus(rideId, 'STARTED');
      setImminent(null);
      await load();
      showToast({ message: 'Ride started — passengers notified', colour: 'green', duration: 3000 });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to start ride. Check connection and try again.';
      showCardError?.(msg);
    } finally {
      setStatusChangingId(null);
    }
  }, [load, showToast]);

  const handleEndRide = useCallback(async (rideId, showCardError) => {
    setStatusChangingId(rideId);
    const ride = rides.find(r => r.id === rideId);
    try {
      await updateScheduleStatus(rideId, 'COMPLETED');
      const earned = ride ? (ride.fare ?? 0) * bookedCount(ride) : 0;
      await load();
      showToast({ message: earned > 0 ? `Ride completed! ₹${earned} earned` : 'Ride completed!', colour: 'green', duration: 4000 });
      setSelectedRideId(rides.find(r => r.id !== rideId && !['COMPLETED', 'CANCELLED'].includes(r.status))?.id ?? null);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to end ride. Try again.';
      showCardError?.(msg);
    } finally {
      setStatusChangingId(null);
    }
  }, [load, rides, showToast]);

  const handleCancelRide = useCallback(async (ride, note, showCardError) => {
    setCancellingId(ride.id);
    try {
      await cancelSchedule(ride.id, 'OTHER', note || '');
      const booked = bookedCount(ride);
      await load();
      showToast({
        message: booked > 0 ? `Ride cancelled — ${booked} passenger${booked !== 1 ? 's' : ''} notified` : 'Ride cancelled',
        colour: 'grey', duration: 3000,
      });
      setSelectedRideId(rides.find(r => r.id !== ride.id && !['COMPLETED', 'CANCELLED'].includes(r.status))?.id ?? null);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to cancel. Try again.';
      showCardError?.(msg);
    } finally {
      setCancellingId(null);
    }
  }, [load, rides, showToast]);

  // ── Render helpers ───────────────────────────────────────────────────────────

  const hasUpcoming = upcoming.length > 0;
  const hasPast     = past.length > 0;
  const hasRides    = rides.length > 0;
  const initialLoading = loading && rides.length === 0;

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
      <div>
        <h1 style={{ fontSize: isDesktop ? 26 : 22, fontWeight: 800, color: 'var(--asphalt-900)', letterSpacing: '-0.02em', margin: 0 }}>
          My rides
        </h1>
        <p style={{ fontSize: 13, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: 4, marginBottom: 0 }}>
          {upcoming.length} upcoming · {past.length} past
        </p>
      </div>
      <WpButton kind="accent" size="sm" onClick={() => navigate('/driver/offer-ride')}>
        <WpIcon name="plus" size={15} color="var(--ink-950)" />
        New ride
      </WpButton>
    </div>
  );

  const errorBanner = loadError && (
    <div style={{ background: 'var(--danger-50)', border: '1px solid var(--danger-200)', borderRadius: 'var(--radius-lg)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: 'var(--danger-700)' }}>Failed to load rides.</span>
      <button onClick={load} style={{ ...BTN_BASE, background: 'none', border: '1px solid var(--danger-300)', color: 'var(--danger-700)', height: 30 }}>
        Retry
      </button>
    </div>
  );

  const imminentBanner = imminent && (
    <ImminentBanner
      ride={imminent}
      onStart={(id) => handleStartRide(id, null)}
      onDismiss={() => {
        localStorage.setItem(`dismissed_imminent_${imminent.id}`, '1');
        setImminent(null);
      }}
    />
  );

  const upcomingCards = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {initialLoading
        ? [1, 2].map(i => <SkeletonCard key={i} />)
        : upcoming.map(r => (
            <ActiveRideCard
              key={r.id}
              ride={r}
              selected={selectedRideId === r.id}
              onSelect={setSelectedRideId}
              onStart={handleStartRide}
              onEnd={handleEndRide}
              onCancel={handleCancelRide}
              statusChanging={statusChangingId === r.id}
              cancelling={cancellingId === r.id}
            />
          ))
      }
    </div>
  );

  const statsBar = hasPast && <StatsBar rides={rides} />;

  const pastSection = hasPast && (
    <div>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--asphalt-400)', textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'var(--font-mono)', marginBottom: 10, marginTop: 0 }}>
        Past rides
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {initialLoading
          ? [1, 2, 3, 4].map(i => <SkeletonRow key={i} />)
          : past.map(r => (
              <PastRideRow
                key={r.id}
                ride={r}
                onClick={() => setDetailRide(r)}
                isDesktop={isDesktop}
              />
            ))
        }
      </div>
    </div>
  );

  // ── Multiple upcoming warning ─────────────────────────────────────────────────
  const multipleUpcomingWarn = upcoming.length > 1 && (
    <div style={{ background: 'var(--voltage-50)', border: '1px solid var(--voltage-200)', borderRadius: 'var(--radius-lg)', padding: '10px 14px', fontSize: 12, color: 'var(--asphalt-700)' }}>
      ⚠ You have multiple open rides — this may be a data issue. Contact support.
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
            {multipleUpcomingWarn}

            {!hasRides && !initialLoading
              ? <EmptyState onOffer={() => navigate('/driver/offer-ride')} />
              : (
                <>
                  {/* Case A: upcoming exist → 50/50 hero */}
                  {(hasUpcoming || initialLoading) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
                      {/* Left: upcoming cards */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
                        {upcomingCards}
                      </div>
                      {/* Right: sticky map */}
                      <div style={{ position: 'sticky', top: 24 }}>
                        <div style={{ borderRadius: 'var(--radius-2xl)', overflow: 'hidden', height: 'calc(100vh - 200px)', maxHeight: 500 }}>
                          <RoutePreviewMap pickup={mapPickup} dropoff={mapDropoff} height={500} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stats bar */}
                  {statsBar}

                  {/* Past rides */}
                  {pastSection}
                </>
              )
            }
          </div>
        </div>

        <WpToast toast={toast} onDismiss={dismissToast} isDesktop />
        {detailRide && <RideDetailSheet ride={detailRide} onClose={() => setDetailRide(null)} isDesktop />}
      </div>
    );
  }

  // ── Mobile layout ─────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', paddingBottom: 60 }}>
      <WpAppBar title="My rides" onBack={() => navigate(-1)} dark />

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {header}
        {errorBanner}
        {imminentBanner}
        {multipleUpcomingWarn}

        {!hasRides && !initialLoading
          ? <EmptyState onOffer={() => navigate('/driver/offer-ride')} />
          : (
            <>
              {/* Case A: upcoming → card + map */}
              {(hasUpcoming || initialLoading) && (
                <>
                  {upcomingCards}
                  {/* Map block */}
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
      {detailRide && <RideDetailSheet ride={detailRide} onClose={() => setDetailRide(null)} isDesktop={false} />}
    </div>
  );
}
