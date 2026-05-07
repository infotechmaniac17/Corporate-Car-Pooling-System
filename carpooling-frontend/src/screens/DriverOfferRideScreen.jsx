import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WpAppBar from '../components/WpAppBar';
import WpButton from '../components/WpButton';
import WpIcon from '../components/WpIcon';
import AddressInput from '../components/AddressInput';
import useIsDesktop from '../hooks/useIsDesktop';
import { createSchedule } from '../api/rides';
import { getMyVehicles } from '../api/vehicles';

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--asphalt-500)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
        border: '1.5px solid var(--asphalt-200)', fontSize: 14, fontFamily: 'var(--font-sans)',
        color: 'var(--asphalt-900)', background: '#fff', outline: 'none', boxSizing: 'border-box',
      }}
      onFocus={e => e.target.style.borderColor = 'var(--ink-600)'}
      onBlur={e => e.target.style.borderColor = 'var(--asphalt-200)'}
    />
  );
}

export default function DriverOfferRideScreen({ activityState }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const isBlocked = activityState?.hasOpenRequest ?? false;

  const today = new Date().toISOString().slice(0, 10);

  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState(null);
  const [vehiclesLoaded, setVehiclesLoaded] = useState(false);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('08:30');
  const [seats, setSeats] = useState(3);
  const [fare, setFare] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getMyVehicles()
      .then(res => {
        const list = res.data?.data || [];
        setVehicles(list);
        const firstActive = list.find(v => v.status === 'ACTIVE') || list[0];
        if (firstActive) setVehicleId(firstActive.id);
      })
      .catch(() => setVehicles([]))
      .finally(() => setVehiclesLoaded(true));
  }, []);

  useEffect(() => {
    if (currentUser?.homeAddress && currentUser?.homeLat && currentUser?.homeLng) {
      setPickup({ label: currentUser.homeAddress, lat: currentUser.homeLat, lng: currentUser.homeLng });
    }
  }, [currentUser?.homeAddress, currentUser?.homeLat, currentUser?.homeLng]);

  const handleSubmit = async () => {
    if (!pickup?.lat || !pickup?.lng) { setError('Pick a pickup location from suggestions.'); return; }
    if (!dropoff?.lat || !dropoff?.lng) { setError('Pick a drop-off location from suggestions.'); return; }
    if (!vehicleId) { setError('Select a vehicle.'); return; }
    if (!fare || parseFloat(fare) <= 0) { setError('Enter a valid fare.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await createSchedule({
        vehicleId,
        pickupLat: pickup.lat, pickupLng: pickup.lng, pickupLabel: pickup.label,
        dropoffLat: dropoff.lat, dropoffLng: dropoff.lng, dropoffLabel: dropoff.label,
        departureTime: new Date(`${date}T${time}:00`).toISOString(),
        availableSeats: Number(seats),
        fare: parseFloat(fare),
      });
      setSuccess(true);
      setTimeout(() => navigate('/driver/my-rides'), 1200);
    } catch {
      setError('Failed to create ride. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const noVehicles = vehiclesLoaded && vehicles.length === 0;

  const Form = () => (
    <div>
      {isBlocked && (
        <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--warn-100, #fff8e1)', border: '1px solid var(--warn-300, #ffe082)', color: 'var(--warn-800, #6d4c00)', fontSize: 13, marginBottom: 16, fontFamily: 'var(--font-sans)' }}>
          You have an open rider request. Cancel it first to offer a ride.
        </div>
      )}
      {noVehicles && (
        <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--warn-100, #fff8e1)', border: '1px solid var(--warn-300, #ffe082)', color: 'var(--warn-800, #6d4c00)', fontSize: 13, marginBottom: 16, fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span>You need to add a vehicle before offering rides.</span>
          <button onClick={() => navigate('/driver/vehicles')} style={{ background: 'var(--ink-950)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            Add a vehicle
          </button>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <AddressInput label="Pickup location" value={pickup} onChange={setPickup} placeholder="Where are you starting from?" />
          <div style={{ height: 18 }} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <AddressInput label="Drop-off location" value={dropoff} onChange={setDropoff} placeholder="Where are you going?" />
          <div style={{ height: 18 }} />
        </div>
        {vehicles.length > 0 && (
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Vehicle">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {vehicles.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setVehicleId(v.id)}
                    style={{
                      padding: '0 14px', height: 44, borderRadius: 'var(--radius-md)', border: '1.5px solid',
                      borderColor: vehicleId === v.id ? 'var(--ink-600)' : 'var(--asphalt-200)',
                      background: vehicleId === v.id ? 'var(--ink-950)' : '#fff',
                      color: vehicleId === v.id ? '#fff' : 'var(--asphalt-700)',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)',
                    }}
                  >{v.vehicleNumber || v.plate || `Vehicle ${v.id}`}</button>
                ))}
              </div>
            </Field>
          </div>
        )}
        <Field label="Date">
          <TextInput value={date} onChange={setDate} type="date" />
        </Field>
        <Field label="Departure time">
          <TextInput value={time} onChange={setTime} type="time" />
        </Field>
        <Field label="Available seats">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5, 6].map(n => (
              <button
                key={n}
                onClick={() => setSeats(n)}
                style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-md)', border: '1.5px solid',
                  borderColor: seats === n ? 'var(--ink-600)' : 'var(--asphalt-200)',
                  background: seats === n ? 'var(--ink-950)' : '#fff',
                  color: seats === n ? '#fff' : 'var(--asphalt-700)',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)',
                }}
              >{n}</button>
            ))}
          </div>
        </Field>
        <Field label="Fare per seat (₹)">
          <TextInput value={fare} onChange={setFare} placeholder="e.g. 120" type="number" />
        </Field>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--danger-100)', border: '1px solid var(--danger-300)', color: 'var(--danger-700)', fontSize: 13, marginBottom: 16, fontFamily: 'var(--font-sans)' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--success-100)', border: '1px solid var(--success-300)', color: 'var(--success-700)', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <WpIcon name="check" size={16} color="var(--success-700)" />
          Ride created! Redirecting…
        </div>
      )}

      <WpButton kind="accent" size="md" full onClick={handleSubmit} disabled={submitting || success || isBlocked || noVehicles}>
        {submitting ? 'Creating…' : 'Offer this ride'}
      </WpButton>
    </div>
  );

  if (isDesktop) {
    const tips = [
      { icon: 'wallet', title: 'Set a fair fare', desc: 'Cover fuel costs — ₹100–₹200/seat for city commutes works well.', bg: 'var(--success-100)', color: 'var(--success-700)' },
      { icon: 'users', title: 'Offer more seats', desc: 'More seats = more matches. Even 3 seats doubles your chance of getting riders.', bg: 'var(--ink-50)', color: 'var(--ink-600)' },
      { icon: 'clock', title: 'Be punctual', desc: 'Riders plan their commute around your schedule. A consistent time builds trust.', bg: 'var(--voltage-50, #f5ffe0)', color: 'var(--ink-600)' },
    ];
    const steps = [
      'Post a ride with your route and time',
      'Riders from your organisation request to join',
      'You accept or decline each request',
      'Complete the ride and get rated',
    ];
    return (
      <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)' }}>
        <div style={{ padding: '32px 40px 0' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--asphalt-900)', letterSpacing: '-0.02em' }}>Offer a ride</h1>
          <p style={{ fontSize: 13, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>Create a new ride for riders to book</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: '24px 40px 40px', alignItems: 'start' }}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', padding: 28, boxShadow: 'var(--shadow-2)', border: '1px solid var(--asphalt-100)' }}>
            {Form()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', padding: 24, boxShadow: 'var(--shadow-2)', border: '1px solid var(--asphalt-100)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--asphalt-400)', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>Tips for a great ride</div>
              {tips.map(t => (
                <div key={t.title} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <WpIcon name={t.icon} size={16} color={t.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--asphalt-900)', marginBottom: 2 }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--asphalt-500)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--ink-950)', borderRadius: 'var(--radius-2xl)', padding: 24, boxShadow: 'var(--shadow-2)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>How it works</div>
              {steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--voltage-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--ink-950)', fontFamily: 'var(--font-mono)' }}>{i + 1}</span>
                  </div>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', paddingBottom: 40 }}>
      <WpAppBar title="Offer a ride" onBack={() => navigate(-1)} dark />
      <div style={{ padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', padding: 20, boxShadow: 'var(--shadow-1)', border: '1px solid var(--asphalt-100)' }}>
          {Form()}
        </div>
      </div>
    </div>
  );
}
