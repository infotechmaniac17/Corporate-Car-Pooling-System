import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WpAppBar from '../components/WpAppBar';
import WpButton from '../components/WpButton';
import WpIcon from '../components/WpIcon';
import useIsDesktop from '../hooks/useIsDesktop';
import { createSchedule } from '../api/rides';

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

  const [form, setForm] = useState({
    pickup: currentUser?.pickupLocation || '',
    dropoff: currentUser?.dropLocation || '',
    date: today,
    time: '08:30',
    seats: 3,
    fare: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.pickup || !form.dropoff || !form.fare) {
      setError('Fill in pickup, dropoff, and fare.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const scheduledTime = new Date(`${form.date}T${form.time}:00`).toISOString();
      await createSchedule({
        driverId: currentUser?.id,
        pickupLocation: form.pickup,
        dropoffLocation: form.dropoff,
        scheduledTime,
        availableSeats: form.seats,
        fare: parseFloat(form.fare),
      });
      setSuccess(true);
      setTimeout(() => navigate('/driver/my-rides'), 1200);
    } catch {
      setError('Failed to create ride. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const Form = () => (
    <div>
      {isBlocked && (
        <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--warn-100, #fff8e1)', border: '1px solid var(--warn-300, #ffe082)', color: 'var(--warn-800, #6d4c00)', fontSize: 13, marginBottom: 16, fontFamily: 'var(--font-sans)' }}>
          You have an open rider request. Cancel it first to offer a ride.
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Pickup location">
            <TextInput value={form.pickup} onChange={set('pickup')} placeholder="Home address" />
          </Field>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Drop-off location">
            <TextInput value={form.dropoff} onChange={set('dropoff')} placeholder="Office address" />
          </Field>
        </div>
        <Field label="Date">
          <TextInput value={form.date} onChange={set('date')} type="date" />
        </Field>
        <Field label="Departure time">
          <TextInput value={form.time} onChange={set('time')} type="time" />
        </Field>
        <Field label="Available seats">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5, 6].map(n => (
              <button
                key={n}
                onClick={() => set('seats')(n)}
                style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-md)', border: '1.5px solid',
                  borderColor: form.seats === n ? 'var(--ink-600)' : 'var(--asphalt-200)',
                  background: form.seats === n ? 'var(--ink-950)' : '#fff',
                  color: form.seats === n ? '#fff' : 'var(--asphalt-700)',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)',
                }}
              >{n}</button>
            ))}
          </div>
        </Field>
        <Field label="Fare per seat (₹)">
          <TextInput value={form.fare} onChange={set('fare')} placeholder="e.g. 120" type="number" />
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

      <WpButton kind="accent" size="md" full onClick={handleSubmit} disabled={submitting || success || isBlocked}>
        {submitting ? 'Creating…' : 'Offer this ride'}
      </WpButton>
    </div>
  );

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)' }}>
        <div style={{ padding: '32px 40px 0' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--asphalt-900)', letterSpacing: '-0.02em' }}>Offer a ride</h1>
          <p style={{ fontSize: 13, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>Create a new ride for riders to book</p>
        </div>
        <div style={{ padding: '24px 40px', maxWidth: 600 }}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', padding: 28, boxShadow: 'var(--shadow-2)', border: '1px solid var(--asphalt-100)' }}>
            <Form />
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
          <Form />
        </div>
      </div>
    </div>
  );
}
