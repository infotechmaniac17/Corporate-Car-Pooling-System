import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import WpPill from './WpPill';
import WpIcon from './WpIcon';
import WpButton from './WpButton';
import RoutePreviewMap from './RoutePreviewMap';
import { areaLabel, haversineKm } from '../utils/rideCalc';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function statusTone(status) {
  if (status === 'COMPLETED') return 'completed';
  if (status === 'CANCELLED') return 'cancelled';
  if (status === 'ACTIVE' || status === 'CONFIRMED') return 'live';
  return 'matched';
}

function statusLabel(status) {
  if (status === 'CONFIRMED') return 'CONFIRMED';
  return status ?? '—';
}

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

// ─── Info grid ────────────────────────────────────────────────────────────────

function InfoGrid({ rows }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
      {rows.filter(r => r.value != null && r.value !== '').map(({ label, value, mono, pill, pillTone }) => (
        <div key={label}>
          <div style={{ fontSize: 11, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>{label}</div>
          {pill
            ? <WpPill tone={pillTone ?? 'matched'}>{value}</WpPill>
            : (
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--asphalt-800)', fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)' }}>
                {value}
              </div>
            )
          }
        </div>
      ))}
    </div>
  );
}

// ─── Main sheet ───────────────────────────────────────────────────────────────

export default function BookingDetailSheet({ booking, onClose, isDesktop }) {
  const navigate = useNavigate();
  const sheetRef = useRef(null);
  const closeRef = useRef(null);

  // Focus close button on mount
  useEffect(() => { closeRef.current?.focus(); }, []);

  // Escape closes
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Focus trap
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const focusable = sheet.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    const trap = e => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last?.focus(); } }
      else            { if (document.activeElement === last)  { e.preventDefault(); first?.focus(); } }
    };
    sheet.addEventListener('keydown', trap);
    return () => sheet.removeEventListener('keydown', trap);
  }, []);

  // Derived values
  const dep = booking.departureTime ? new Date(booking.departureTime) : null;
  const dateStr = dep ? dep.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const timeStr = dep ? dep.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';

  const co2     = bookingCo2(booking);
  const rated   = hasRated(booking.id);
  const rideId  = booking.tripId ?? booking.rideId;
  const distKm  = booking.pickupLat && booking.dropoffLat
    ? haversineKm(booking.pickupLat, booking.pickupLng, booking.dropoffLat, booking.dropoffLng).toFixed(1)
    : null;

  const mapPickup  = { lat: booking.pickupLat,  lng: booking.pickupLng,  label: booking.pickupLabel  };
  const mapDropoff = { lat: booking.dropoffLat, lng: booking.dropoffLng, label: booking.dropoffLabel };

  const tripInfoRows = [
    { label: 'Date',       value: dateStr },
    { label: 'Departure',  value: timeStr, mono: true },
    { label: 'Booking ID', value: booking.id ? `#${booking.id}` : null, mono: true },
    { label: 'Status',     value: statusLabel(booking.status), pill: true, pillTone: statusTone(booking.status) },
  ];

  const driverRows = [
    { label: 'Driver',      value: booking.driverName },
    { label: 'Vehicle',     value: booking.vehicleNumber, mono: true },
    { label: 'Vehicle type', value: booking.vehicleType },
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
    ? { width: 560, maxHeight: '85vh', borderRadius: 'var(--radius-2xl)', background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'bdsIn 0.22s ease-out' }
    : { width: '100%', maxHeight: '90vh', borderRadius: '20px 20px 0 0', background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'bdsSlideUp 0.28s ease-out' };

  const fixedPos = isDesktop
    ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    : { bottom: 0, left: 0, right: 0 };

  return (
    <>
      <style>{`
        @keyframes bdsIn      { from { opacity:0; transform:translate(-50%,-50%) scale(0.97); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
        @keyframes bdsSlideUp { from { transform:translateY(100%); } to { transform:translateY(0); } }
      `}</style>

      {/* Backdrop */}
      <div style={backdropStyle} onClick={onClose} aria-hidden="true" />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Booking details"
        style={{ ...sheetStyle, position: 'fixed', ...fixedPos, zIndex: 1201 }}
      >
        {/* Drag handle — mobile only */}
        {!isDesktop && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4, flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--asphalt-200)' }} />
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isDesktop ? '20px 24px 16px' : '12px 20px 16px', flexShrink: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--asphalt-900)' }}>Booking details</span>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close booking details"
            style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--asphalt-100)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
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

          {/* Full route labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success-500)', marginTop: 4, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--asphalt-700)', lineHeight: 1.4 }}>{booking.pickupLabel ?? '—'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: 3, background: 'var(--danger-500)', marginTop: 4, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--asphalt-700)', lineHeight: 1.4 }}>{booking.dropoffLabel ?? '—'}</span>
            </div>
          </div>

          {/* Section 2 — Trip info */}
          <Section title="Trip info">
            <InfoGrid rows={tripInfoRows} />
          </Section>

          {/* Section 3 — Driver & vehicle */}
          <Section title="Driver & vehicle">
            <InfoGrid rows={driverRows} />
          </Section>

          {/* Section 4 — Fare */}
          <Section title="Fare">
            {booking.fare != null
              ? (
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--asphalt-900)', fontFamily: 'var(--font-mono)' }}>
                    ₹{booking.fare}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                    per seat
                    {booking.paymentStatus ? ` · ${booking.paymentStatus}` : ''}
                  </div>
                </div>
              )
              : <p style={{ fontSize: 13, color: 'var(--asphalt-400)', margin: 0 }}>Fare not available</p>
            }
          </Section>

          {/* Section 5 — CO₂ */}
          {co2 && (
            <Section title="Environmental impact">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>🌿</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--asphalt-900)' }}>~{co2}</div>
                  <div style={{ fontSize: 12, color: 'var(--asphalt-500)', marginTop: 2 }}>
                    CO₂ avoided by sharing this ride{distKm ? ` · ~${distKm} km route` : ''}
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Section 6 — Passenger actions */}
          {booking.status === 'COMPLETED' && (
            <Section title="Actions">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {!rated && (
                  <WpButton
                    kind="secondary"
                    size="sm"
                    onClick={() => {
                      navigate(`/rate/${rideId}?driverId=${booking.driverId}`);
                      onClose();
                    }}
                  >
                    ⭐ Rate driver
                  </WpButton>
                )}
                {rated && (
                  <div style={{ fontSize: 13, color: 'var(--success-700)', fontWeight: 600 }}>
                    ✓ Driver rated
                  </div>
                )}
                <WpButton
                  kind="ghost"
                  size="sm"
                  onClick={() => {
                    // TODO: receipt download
                    alert('Receipt download coming soon.');
                  }}
                >
                  Download receipt
                </WpButton>
              </div>
            </Section>
          )}

        </div>
      </div>
    </>
  );
}
