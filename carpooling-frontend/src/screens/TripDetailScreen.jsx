import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WpAppBar from '../components/WpAppBar';
import WpButton from '../components/WpButton';
import WpAvatar from '../components/WpAvatar';
import WpPill from '../components/WpPill';
import WpIcon from '../components/WpIcon';
import useIsDesktop from '../hooks/useIsDesktop';
import { useAuth } from '../context/AuthContext';
import { getTripById, bookTrip, cancelBooking, getMyBookings } from '../api/trips';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2);
}

function formatDep(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export default function TripDetailScreen() {
  const { tripId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [booking_loading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadTrip();
    loadMyBooking();
  }, [tripId]);

  const loadTrip = async () => {
    setLoading(true);
    try {
      const res = await getTripById(tripId);
      setTrip(res.data?.data);
    } catch {
      setError('Failed to load trip details.');
    } finally {
      setLoading(false);
    }
  };

  const loadMyBooking = async () => {
    try {
      const res = await getMyBookings();
      const bookings = res.data?.data || [];
      const existing = bookings.find(b => String(b.tripId) === String(tripId) && b.status !== 'CANCELLED');
      setBooking(existing || null);
    } catch {
      // ignore
    }
  };

  const handleBook = async () => {
    setBookingLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = {};
      if (currentUser?.homeAddress) {
        payload.pickupLat = currentUser.homeLat;
        payload.pickupLng = currentUser.homeLng;
        payload.pickupLabel = currentUser.homeAddress;
      }
      if (currentUser?.secondaryAddress) {
        payload.dropoffLat = currentUser.secondaryLat;
        payload.dropoffLng = currentUser.secondaryLng;
        payload.dropoffLabel = currentUser.secondaryAddress;
      }
      const res = await bookTrip(tripId, payload);
      setBooking(res.data?.data);
      setSuccess('Seat booked! You\'re confirmed on this trip.');
      loadTrip();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to book seat. Try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    if (!window.confirm('Cancel your booking on this trip?')) return;
    setBookingLoading(true);
    setError('');
    try {
      await cancelBooking(tripId, booking.id);
      setBooking(null);
      setSuccess('Booking cancelled.');
      loadTrip();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)' }}>
        {!isDesktop && <WpAppBar title="Trip details" onBack={() => navigate(-1)} dark />}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[180, 120, 80].map(h => (
            <div key={h} style={{ height: h, borderRadius: 'var(--radius-xl)', background: 'linear-gradient(90deg, var(--asphalt-100) 25%, var(--asphalt-50) 50%, var(--asphalt-100) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
          ))}
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <WpIcon name="x-circle" size={40} color="var(--danger-400)" />
          <p style={{ marginTop: 12, fontSize: 15, color: 'var(--asphalt-600)' }}>Trip not found.</p>
          <button onClick={() => navigate(-1)} style={{ marginTop: 16, padding: '8px 20px', borderRadius: 'var(--radius-pill)', border: '1.5px solid var(--asphalt-300)', background: 'none', cursor: 'pointer', fontSize: 13 }}>Go back</button>
        </div>
      </div>
    );
  }

  const isOwn = currentUser && String(trip.driverId) === String(currentUser.id);
  const isFull = trip.seatsLeft <= 0;
  const isUnavailable = trip.status === 'CANCELLED' || trip.status === 'COMPLETED';

  const Detail = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Driver card */}
      <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', padding: 20, boxShadow: 'var(--shadow-2)', border: '1px solid var(--asphalt-100)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <WpAvatar initials={getInitials(trip.driverName)} size={56} tone="ink" />
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--asphalt-900)' }}>{trip.driverName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <WpIcon name="star" size={14} color="var(--warning-500)" stroke={0} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--asphalt-700)', fontFamily: 'var(--font-mono)' }}>
                {trip.driverRating ? Number(trip.driverRating).toFixed(1) : '—'}
              </span>
            </div>
            {trip.vehicleNumber && (
              <div style={{ fontSize: 12, color: 'var(--asphalt-500)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                {trip.vehicleNumber}
              </div>
            )}
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink-700)', fontFamily: 'var(--font-mono)' }}>
              ₹{trip.fare != null ? Number(trip.fare).toFixed(0) : '—'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>per seat</div>
          </div>
        </div>
      </div>

      {/* Route */}
      <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', padding: 20, boxShadow: 'var(--shadow-2)', border: '1px solid var(--asphalt-100)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--asphalt-400)', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>Route</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--ink-500)', border: '2px solid var(--ink-200)' }} />
              <div style={{ width: 2, height: 32, background: 'var(--asphalt-200)', margin: '4px 0' }} />
              <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--voltage-400)', border: '2px solid var(--voltage-200)' }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--asphalt-900)' }}>{trip.pickupLabel || 'Pickup'}</div>
                <div style={{ fontSize: 11, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{formatDep(trip.departureTime)}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--asphalt-900)' }}>{trip.dropoffLabel || 'Drop-off'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seats */}
      <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', padding: 20, boxShadow: 'var(--shadow-2)', border: '1px solid var(--asphalt-100)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--asphalt-400)', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>Availability</div>
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { label: 'Total seats', value: trip.availableSeats },
            { label: 'Booked', value: trip.bookedSeats },
            { label: 'Available', value: trip.seatsLeft },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: '12px 0', background: 'var(--asphalt-50)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--asphalt-900)', fontFamily: 'var(--font-mono)' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
          {trip.recurringDays && <WpPill tone="warn">↻ {trip.recurringDays}</WpPill>}
          {trip.genderPreference && trip.genderPreference !== 'ANY' && <WpPill tone="completed">{trip.genderPreference} only</WpPill>}
          <WpPill tone={trip.status === 'CREATED' ? 'live' : 'cancelled'}>{trip.status}</WpPill>
        </div>
      </div>

      {/* Feedback */}
      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--danger-100)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--danger-700)', border: '1px solid var(--danger-200)' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '12px 16px', background: 'var(--success-100)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--success-700)', border: '1px solid var(--success-300)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <WpIcon name="check" size={15} color="var(--success-700)" />
          {success}
        </div>
      )}

      {/* Action */}
      {!isOwn && !isUnavailable && (
        booking ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ padding: '12px 16px', background: 'var(--success-50)', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 600, color: 'var(--success-700)', border: '1px solid var(--success-200)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <WpIcon name="check-circle" size={16} color="var(--success-600)" />
              You have a confirmed seat on this trip
            </div>
            <WpButton kind="danger" size="md" full onClick={handleCancelBooking} disabled={booking_loading}>
              {booking_loading ? 'Cancelling…' : 'Cancel my booking'}
            </WpButton>
          </div>
        ) : (
          <WpButton kind="accent" size="lg" full onClick={handleBook} disabled={booking_loading || isFull}>
            {booking_loading ? 'Booking…' : isFull ? 'No seats available' : 'Book a seat'}
          </WpButton>
        )
      )}

      {isOwn && (
        <div style={{ padding: '12px 16px', background: 'var(--ink-50)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--ink-600)', border: '1px solid var(--ink-100)', textAlign: 'center', fontWeight: 600 }}>
          This is your trip · {trip.bookedSeats || 0} passenger{trip.bookedSeats !== 1 ? 's' : ''} booked
        </div>
      )}

      {isUnavailable && (
        <div style={{ padding: '12px 16px', background: 'var(--asphalt-100)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--asphalt-600)', textAlign: 'center' }}>
          This trip is {trip.status.toLowerCase()} and no longer available.
        </div>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)' }}>
        <div style={{ padding: '32px 40px 0' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--asphalt-500)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontFamily: 'var(--font-sans)', padding: 0, marginBottom: 16 }}>
            <WpIcon name="chevron-left" size={18} color="var(--asphalt-500)" /> Back to trips
          </button>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--asphalt-900)', letterSpacing: '-0.02em' }}>Trip details</h1>
        </div>
        <div style={{ maxWidth: 600, padding: '24px 40px 40px' }}>
          <Detail />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', paddingBottom: 40 }}>
      <WpAppBar title="Trip details" onBack={() => navigate(-1)} dark />
      <div style={{ padding: 16 }}>
        <Detail />
      </div>
    </div>
  );
}
