import React, { useEffect, useRef, useState } from 'react';
import WpPill from './WpPill';
import WpIcon from './WpIcon';
import WpAvatar from './WpAvatar';
import RoutePreviewMap from './RoutePreviewMap';
import { getTripBookings } from '../api/trips';
import { areaLabel, co2Saved, haversineKm } from '../utils/rideCalc';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
}

const STEP_ORDER = ['CREATED', 'ACTIVE', 'STARTED', 'COMPLETED'];

function statusTimeline(ride) {
  const vStatus = ride.status;
  const cancelled = vStatus === 'CANCELLED';
  const steps = STEP_ORDER.map((step, i) => {
    const reached = STEP_ORDER.indexOf(vStatus) >= i || cancelled;
    const isCancelledStep = cancelled && step === STEP_ORDER[STEP_ORDER.indexOf(vStatus === 'CANCELLED' ? 'CREATED' : vStatus)];
    return { step, reached, isCancelledStep: cancelled && i === 0 };
  });
  return { steps, cancelled };
}

const LABEL_MAP = {
  CREATED: 'Scheduled', ACTIVE: 'Active', STARTED: 'In progress', COMPLETED: 'Completed',
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div style={{ borderTop: '1px solid var(--asphalt-100)', paddingTop: 18, marginTop: 2 }}>
      {title && (
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--asphalt-400)', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Trip info grid ───────────────────────────────────────────────────────────

function InfoGrid({ rows }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
      {rows.filter(r => r.value != null).map(({ label, value, mono }) => (
        <div key={label}>
          <div style={{ fontSize: 11, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--asphalt-800)', fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)' }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Status timeline ──────────────────────────────────────────────────────────

function StatusTimeline({ ride }) {
  const { steps, cancelled } = statusTimeline(ride);
  const reachedIdx = STEP_ORDER.indexOf(ride.status === 'CANCELLED' ? 'CREATED' : ride.status);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {STEP_ORDER.map((step, i) => {
        const reached = i <= reachedIdx;
        const isLast = i === STEP_ORDER.length - 1;
        const isCancelledFinal = cancelled && i === 0;

        return (
          <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            {/* Circle + line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16 }}>
              <div style={{
                width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                background: reached ? (cancelled && i === 0 ? 'var(--danger-500)' : 'var(--success-500)') : 'transparent',
                border: reached ? 'none' : '2px solid var(--asphalt-200)',
                marginTop: 2,
              }} />
              {!isLast && (
                <div style={{ width: 2, flex: 1, minHeight: 20, background: i < reachedIdx ? 'var(--success-200)' : 'var(--asphalt-100)', margin: '3px 0' }} />
              )}
            </div>
            {/* Label */}
            <div style={{ paddingBottom: isLast ? 0 : 14 }}>
              <div style={{
                fontSize: 13, fontWeight: reached ? 600 : 400,
                color: reached ? 'var(--asphalt-900)' : 'var(--asphalt-300)',
              }}>
                {LABEL_MAP[step]}
              </div>
              {cancelled && step === 'CREATED' && (
                <div style={{ fontSize: 11, color: 'var(--danger-600)', marginTop: 2 }}>Cancelled</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Passenger row ────────────────────────────────────────────────────────────

function PassengerRow({ booking }) {
  const name = booking.passengerName ?? booking.userName ?? 'Passenger';
  const tone = booking.status === 'CANCELLED' ? 'cancelled' : 'completed';
  const pillLabel = booking.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--asphalt-50)' }}>
      <WpAvatar initials={initials(name)} size={32} tone="ink" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--asphalt-800)' }}>{name}</div>
        {(booking.pickupLabel || booking.dropoffLabel) && (
          <div style={{ fontSize: 11, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {areaLabel(booking.pickupLabel)} → {areaLabel(booking.dropoffLabel)}
          </div>
        )}
      </div>
      <WpPill tone={tone}>{pillLabel}</WpPill>
    </div>
  );
}

// ─── Main sheet ───────────────────────────────────────────────────────────────

export default function RideDetailSheet({ ride, onClose, isDesktop }) {
  const [bookings, setBookings] = useState(null); // null = loading
  const [bookingsError, setBookingsError] = useState(false);
  const sheetRef = useRef(null);
  const closeRef = useRef(null);

  // Fetch bookings on mount
  useEffect(() => {
    let cancelled = false;
    getTripBookings(ride.id)
      .then(res => { if (!cancelled) setBookings(res.data?.data || []); })
      .catch(() => { if (!cancelled) setBookingsError(true); setBookings([]); });
    return () => { cancelled = true; };
  }, [ride.id]);

  // Focus close button on mount
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Escape closes
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Focus trap
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const focusable = sheet.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const trap = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last?.focus(); } }
      else { if (document.activeElement === last) { e.preventDefault(); first?.focus(); } }
    };
    sheet.addEventListener('keydown', trap);
    return () => sheet.removeEventListener('keydown', trap);
  }, []);

  // Derived values
  const dep = ride.departureTime ? new Date(ride.departureTime) : null;
  const dateStr = dep ? dep.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const timeStr = dep ? dep.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';

  const bookedSeats = ride.bookedSeats ?? Math.max(0, (ride.availableSeats ?? 0) - (ride.seatsLeft ?? 0));
  const earnings = ride.status === 'COMPLETED' && bookedSeats > 0 ? (ride.fare ?? 0) * bookedSeats : 0;
  const co2 = co2Saved(ride);

  const distKm = ride.pickupLat && ride.dropoffLat
    ? haversineKm(ride.pickupLat, ride.pickupLng, ride.dropoffLat, ride.dropoffLng).toFixed(1)
    : null;

  const mapPickup  = { lat: ride.pickupLat,  lng: ride.pickupLng,  label: ride.pickupLabel  };
  const mapDropoff = { lat: ride.dropoffLat, lng: ride.dropoffLng, label: ride.dropoffLabel };

  const recurringStr = ride.recurringDays?.length
    ? ride.recurringDays.join(', ')
    : 'One-time';

  const infoRows = [
    { label: 'Date',            value: dateStr },
    { label: 'Departure',       value: timeStr,               mono: true },
    { label: 'Vehicle',         value: ride.vehicleNumber,    mono: true },
    { label: 'Fare',            value: ride.fare != null ? `₹${ride.fare}/seat` : null, mono: true },
    { label: 'Available seats', value: ride.availableSeats },
    { label: 'Status',          value: ride.status },
    { label: 'Recurring',       value: recurringStr },
  ];

  // ── Sheet styles ────────────────────────────────────────────────────────────

  const backdropStyle = {
    position: 'fixed', inset: 0, zIndex: 1200,
    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: isDesktop ? 'center' : 'flex-end',
    justifyContent: 'center',
  };

  const sheetStyle = isDesktop
    ? {
        width: 560, maxHeight: '85vh',
        borderRadius: 'var(--radius-2xl)',
        background: '#fff',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        animation: 'rdsIn 0.22s ease-out',
      }
    : {
        width: '100%', maxHeight: '90vh',
        borderRadius: '20px 20px 0 0',
        background: '#fff',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        animation: 'rdsSlideUp 0.28s ease-out',
      };

  return (
    <>
      <style>{`
        @keyframes rdsIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
        @keyframes rdsSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>

      {/* Backdrop */}
      <div style={backdropStyle} onClick={onClose} aria-hidden="true" />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Ride details"
        style={{ ...sheetStyle, position: 'fixed', ...(isDesktop ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1201 } : { bottom: 0, left: 0, right: 0, zIndex: 1201 }) }}
      >
        {/* Drag handle (mobile only) */}
        {!isDesktop && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4, flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--asphalt-200)' }} />
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isDesktop ? '20px 24px 16px' : '12px 20px 16px', flexShrink: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--asphalt-900)' }}>Ride details</span>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close ride details"
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--asphalt-100)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <WpIcon name="x" size={16} color="var(--asphalt-600)" />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: isDesktop ? '0 24px 24px' : '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Section 1 — Route map thumbnail */}
          <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', height: 180, pointerEvents: 'none', flexShrink: 0 }}>
            <RoutePreviewMap pickup={mapPickup} dropoff={mapDropoff} height={180} />
          </div>

          {/* Section 2 — Trip info */}
          <Section title="Trip info">
            <InfoGrid rows={infoRows} />
          </Section>

          {/* Section 3 — Passengers */}
          <Section title={`Passengers (${bookings?.length ?? '…'})`}>
            {bookings === null && (
              <div style={{ height: 40, borderRadius: 'var(--radius-md)', background: 'linear-gradient(90deg, var(--asphalt-100) 25%, var(--asphalt-50) 50%, var(--asphalt-100) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
            )}
            {bookings?.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--asphalt-400)', margin: 0 }}>No passengers booked</p>
            )}
            {bookings?.map((b, i) => <PassengerRow key={b.id ?? i} booking={b} />)}
            {bookingsError && (
              <p style={{ fontSize: 12, color: 'var(--danger-600)', margin: 0 }}>Failed to load passengers</p>
            )}
          </Section>

          {/* Section 4 — Earnings */}
          <Section title="Earnings">
            {ride.status === 'CANCELLED' || earnings === 0
              ? <p style={{ fontSize: 13, color: 'var(--asphalt-400)', margin: 0 }}>No earnings from this ride</p>
              : (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--asphalt-500)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                    ₹{ride.fare} × {bookedSeats} passenger{bookedSeats !== 1 ? 's' : ''}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--asphalt-900)', fontFamily: 'var(--font-mono)' }}>
                    ₹{earnings}
                  </div>
                </div>
              )
            }
          </Section>

          {/* Section 5 — CO₂ */}
          {co2 && ride.status === 'COMPLETED' && (
            <Section title="Environmental impact">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>🌿</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--asphalt-900)' }}>~{co2}</div>
                  <div style={{ fontSize: 12, color: 'var(--asphalt-500)', marginTop: 2 }}>
                    Estimated CO₂ avoided by sharing this ride{distKm ? ` · ~${distKm} km route` : ''}
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Section 6 — Status timeline */}
          <Section title="Status timeline">
            <StatusTimeline ride={ride} />
          </Section>

        </div>
      </div>
    </>
  );
}
