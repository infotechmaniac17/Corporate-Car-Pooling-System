import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WpAppBar from '../components/WpAppBar';
import WpButton from '../components/WpButton';
import WpIcon from '../components/WpIcon';
import AddressInput from '../components/AddressInput';
import useIsDesktop from '../hooks/useIsDesktop';
import { publishTrip } from '../api/trips';
import { getMyVehicles } from '../api/vehicles';
import { fetchRouteAlternatives } from '../api/routing';
import { getOrgOffices } from '../api/organisations';

const RoutePreviewMap = lazy(() => import('../components/RoutePreviewMap'));

function formatDist(m) {
  if (!m) return '—';
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}
function formatDur(s) {
  if (!s) return '—';
  const m = Math.round(s / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
}

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

function TextInput({ value, onChange, placeholder, type = 'text', onBlur }) {
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
      onBlur={e => { e.target.style.borderColor = 'var(--asphalt-200)'; onBlur?.(); }}
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
  const [offices, setOffices] = useState([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState(null);
  const [vehiclesLoaded, setVehiclesLoaded] = useState(false);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('08:30');
  const [seats, setSeats] = useState(3);
  const [fare, setFare] = useState('');
  const [fareEdited, setFareEdited] = useState(false);
  const [recurringDays, setRecurringDays] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [routeLoading, setRouteLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');

  const validateDate = (val) => {
    if (!val) return 'Departure date is required';
    const d = new Date(val);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (d < today) return 'Departure date cannot be in the past';
    const max = new Date(today); max.setDate(max.getDate() + 30);
    if (d > max) return 'You can schedule at most 30 days ahead';
    return '';
  };

  const validateTime = (dateVal, timeVal) => {
    if (!dateVal || !timeVal) return '';
    const dep = new Date(`${dateVal}T${timeVal}:00`);
    const h = dep.getHours();
    if (h < 5 || h >= 23) return 'Rides can only be scheduled between 5 AM and 11 PM';
    const depDate = new Date(dateVal); depDate.setHours(0, 0, 0, 0);
    const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
    if (depDate.getTime() === todayDate.getTime()) {
      const minTime = new Date(Date.now() + 30 * 60 * 1000);
      if (dep < minTime) return 'Departure time must be at least 30 minutes from now';
    }
    return '';
  };

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

  useEffect(() => {
    if (!currentUser?.organisationId) return;
    getOrgOffices(currentUser.organisationId)
      .then(res => {
        const list = res.data?.data || [];
        setOffices(list);
        const primary = list.find(o => o.isPrimary) || list[0];
        if (primary) {
          setSelectedOfficeId(primary.id);
          setDropoff({ label: primary.address, lat: primary.lat, lng: primary.lng });
        }
      })
      .catch(() => {
        // fallback: use secondaryAddress if offices fail
        if (currentUser?.secondaryAddress && currentUser?.secondaryLat && currentUser?.secondaryLng) {
          setDropoff({ label: currentUser.secondaryAddress, lat: currentUser.secondaryLat, lng: currentUser.secondaryLng });
        }
      });
  }, [currentUser?.organisationId]);

  useEffect(() => {
    if (!pickup?.lat || !dropoff?.lat) { setRoutes([]); return; }
    setFareEdited(false);
    let cancelled = false;
    setRouteLoading(true);
    fetchRouteAlternatives(pickup, dropoff)
      .then(r => { if (!cancelled) { setRoutes(r); setSelectedRouteIndex(0); } })
      .finally(() => { if (!cancelled) setRouteLoading(false); });
    return () => { cancelled = true; };
  }, [pickup?.lat, pickup?.lng, dropoff?.lat, dropoff?.lng]);

  useEffect(() => {
    const distM = routes[selectedRouteIndex]?.distanceM;
    if (!distM || fareEdited) return;
    const suggested = Math.max(30, Math.round(distM / 1000 * 8 / 5) * 5);
    setFare(String(suggested));
  }, [routes, selectedRouteIndex]);

  const handleSubmit = async () => {
    if (!pickup?.lat || !pickup?.lng) { setError('Pick a pickup location from suggestions.'); return; }
    if (!dropoff?.lat || !dropoff?.lng) { setError('Pick a drop-off location from suggestions.'); return; }
    if (!vehicleId) { setError('Select a vehicle.'); return; }
    if (!fare || parseFloat(fare) <= 0) { setError('Enter a valid fare.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await publishTrip({
        vehicleId,
        pickupLat: pickup.lat, pickupLng: pickup.lng, pickupLabel: pickup.label,
        dropoffLat: dropoff.lat, dropoffLng: dropoff.lng, dropoffLabel: dropoff.label,
        departureTime: new Date(`${date}T${time}:00`).toISOString(),
        availableSeats: Number(seats),
        fare: parseFloat(fare),
        recurringDays: recurringDays.length > 0 ? recurringDays.join(',') : null,
        routeGeometry: routes[selectedRouteIndex]?.coordinates || null,
      });
      setSuccess(true);
      setTimeout(() => navigate('/driver/my-rides'), 1200);
    } catch (err) {
      const msg = err?.response?.data?.message || '';
      if (msg.toLowerCase().includes('active') || msg.toLowerCase().includes('upcoming')) {
        setError('You already have an active or upcoming ride. Cancel it first.');
      } else if (msg.toLowerCase().includes('vehicle')) {
        setError('This vehicle is not registered to your account.');
      } else {
        setError('Failed to create ride. Try again.');
      }
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
        </div>
        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', padding: '0 2px', marginTop: -10, marginBottom: -10 }}>
          <button
            type="button"
            onClick={() => { const t = pickup; setPickup(dropoff); setDropoff(t); }}
            title="Swap pickup and drop-off"
            style={{
              width: 32, height: 32, borderRadius: '50%', background: 'var(--asphalt-50)',
              border: '1.5px solid var(--asphalt-200)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', zIndex: 1, position: 'relative',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--asphalt-600)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 2L2 4l2 2M2 4h8M10 12l2-2-2-2M12 10H4" />
            </svg>
          </button>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          {offices.length > 0 ? (
            <Field label="Drop-off office">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {offices.map(o => {
                  const sel = selectedOfficeId === o.id;
                  return (
                    <button key={o.id} type="button"
                      onClick={() => { setSelectedOfficeId(o.id); setDropoff({ label: o.address, lat: o.lat, lng: o.lng }); setFareEdited(false); }}
                      style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: `1.5px solid ${sel ? 'var(--ink-600)' : 'var(--asphalt-200)'}`, background: sel ? 'var(--ink-950)' : '#fff', textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: sel ? '#fff' : 'var(--asphalt-900)' }}>
                        {o.name}{o.isPrimary ? ' ·  Primary' : ''}
                      </div>
                      <div style={{ fontSize: 11, color: sel ? 'rgba(255,255,255,0.6)' : 'var(--asphalt-500)', marginTop: 2 }}>{o.address}</div>
                    </button>
                  );
                })}
              </div>
            </Field>
          ) : (
            <AddressInput label="Drop-off location" value={dropoff} onChange={setDropoff} placeholder="Where are you going?" />
          )}
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
          <TextInput
            value={date}
            onChange={val => { setDate(val); setDateError(validateDate(val)); }}
            type="date"
            onBlur={() => setDateError(validateDate(date))}
          />
          {dateError && <div style={{ fontSize: 12, color: 'var(--danger-600)', marginTop: 4, fontFamily: 'var(--font-sans)' }}>{dateError}</div>}
        </Field>
        <Field label="Departure time">
          <TextInput
            value={time}
            onChange={val => { setTime(val); }}
            type="time"
            onBlur={() => setTimeError(validateTime(date, time))}
          />
          {timeError && <div style={{ fontSize: 12, color: 'var(--danger-600)', marginTop: 4, fontFamily: 'var(--font-sans)' }}>{timeError}</div>}
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
          <TextInput
            value={fare}
            onChange={val => { setFare(val); setFareEdited(true); }}
            placeholder="e.g. 120"
            type="number"
          />
          {(() => {
            const distM = routes[selectedRouteIndex]?.distanceM;
            if (!distM) return null;
            const suggested = Math.max(30, Math.round(distM / 1000 * 8 / 5) * 5);
            return (
              <div style={{ fontSize: 11, color: 'var(--asphalt-400)', marginTop: 5, fontFamily: 'var(--font-sans)' }}>
                {fareEdited
                  ? <>Suggested ₹{suggested} for {formatDist(distM)} · <button type="button" onClick={() => { setFare(String(suggested)); setFareEdited(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-500)', fontSize: 11, padding: 0, fontFamily: 'var(--font-sans)', textDecoration: 'underline' }}>Reset</button></>
                  : `₹${suggested} auto-calculated · ₹8/km for ${formatDist(distM)}`
                }
              </div>
            );
          })()}
        </Field>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Recurring days (optional)">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => {
                const active = recurringDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setRecurringDays(prev => active ? prev.filter(d => d !== day) : [...prev, day])}
                    style={{
                      padding: '6px 10px', borderRadius: 'var(--radius-md)', border: '1.5px solid',
                      borderColor: active ? 'var(--ink-600)' : 'var(--asphalt-200)',
                      background: active ? 'var(--ink-950)' : '#fff',
                      color: active ? '#fff' : 'var(--asphalt-600)',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)',
                      letterSpacing: '.04em',
                    }}
                  >{day}</button>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: 'var(--asphalt-400)', marginTop: 6, fontFamily: 'var(--font-sans)' }}>
              Mark which days you usually run this route
            </div>
          </Field>
        </div>
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

      <WpButton kind="accent" size="md" full onClick={handleSubmit} disabled={submitting || success || isBlocked || noVehicles || !!dateError || !!timeError}>
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
            <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', boxShadow: 'var(--shadow-2)', border: '1px solid var(--asphalt-100)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px 10px', fontSize: 11, fontWeight: 700, color: 'var(--asphalt-400)', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Route preview</span>
                {routeLoading && <span style={{ fontSize: 10, color: 'var(--asphalt-400)', fontWeight: 400 }}>Finding routes…</span>}
              </div>
              {routes.length > 1 && (
                <div style={{ display: 'flex', gap: 6, padding: '0 14px 10px', flexWrap: 'wrap' }}>
                  {routes.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedRouteIndex(i)}
                      style={{
                        padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid',
                        borderColor: selectedRouteIndex === i ? 'var(--ink-600)' : 'var(--asphalt-200)',
                        background: selectedRouteIndex === i ? 'var(--ink-950)' : '#fff',
                        color: selectedRouteIndex === i ? '#fff' : 'var(--asphalt-700)',
                        fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)',
                        display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'left',
                      }}
                    >
                      <span>Route {i + 1}</span>
                      <span style={{ fontWeight: 400, fontSize: 10, opacity: 0.8 }}>
                        {formatDist(r.distanceM)} · {formatDur(r.durationS)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <Suspense fallback={<div style={{ height: 280, background: 'var(--asphalt-50)' }} />}>
                <RoutePreviewMap
                  pickup={pickup} dropoff={dropoff} height={280}
                  routes={routes} selectedRouteIndex={selectedRouteIndex}
                  onSelectRoute={setSelectedRouteIndex}
                />
              </Suspense>
            </div>
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', paddingBottom: 40 }}>
      <WpAppBar title="Offer a ride" onBack={() => navigate(-1)} dark />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', boxShadow: 'var(--shadow-1)', border: '1px solid var(--asphalt-100)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px 8px', fontSize: 11, fontWeight: 700, color: 'var(--asphalt-400)', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Route preview</span>
            {routeLoading && <span style={{ fontSize: 10, color: 'var(--asphalt-400)', fontWeight: 400 }}>Finding routes…</span>}
          </div>
          {routes.length > 1 && (
            <div style={{ display: 'flex', gap: 6, padding: '0 12px 8px', flexWrap: 'wrap' }}>
              {routes.map((r, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedRouteIndex(i)}
                  style={{
                    padding: '5px 10px', borderRadius: 'var(--radius-md)', border: '1.5px solid',
                    borderColor: selectedRouteIndex === i ? 'var(--ink-600)' : 'var(--asphalt-200)',
                    background: selectedRouteIndex === i ? 'var(--ink-950)' : '#fff',
                    color: selectedRouteIndex === i ? '#fff' : 'var(--asphalt-700)',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)',
                    display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'left',
                  }}
                >
                  <span>Route {i + 1}</span>
                  <span style={{ fontWeight: 400, fontSize: 10, opacity: 0.8 }}>
                    {formatDist(r.distanceM)} · {formatDur(r.durationS)}
                  </span>
                </button>
              ))}
            </div>
          )}
          <Suspense fallback={<div style={{ height: 220, background: 'var(--asphalt-50)' }} />}>
            <RoutePreviewMap
              pickup={pickup} dropoff={dropoff} height={220}
              routes={routes} selectedRouteIndex={selectedRouteIndex}
              onSelectRoute={setSelectedRouteIndex}
            />
          </Suspense>
        </div>
        <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', padding: 20, boxShadow: 'var(--shadow-1)', border: '1px solid var(--asphalt-100)' }}>
          {Form()}
        </div>
      </div>
    </div>
  );
}
