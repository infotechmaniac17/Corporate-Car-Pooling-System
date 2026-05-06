import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WpAppBar from '../components/WpAppBar';
import WpButton from '../components/WpButton';
import WpPill from '../components/WpPill';
import WpIcon from '../components/WpIcon';
import useIsDesktop from '../hooks/useIsDesktop';

const MOCK_VEHICLES = [
  { id: 'V001', plate: 'KA 01 MH 4521', type: 'SUV',   model: 'Toyota Innova', seats: 6, fuel: 'Petrol', status: 'ACTIVE'   },
];

const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric'];
const VEHICLE_TYPES = ['Sedan', 'Hatchback', 'SUV', 'MPV'];

function VehicleCard({ v, onRemove }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 'var(--radius-lg)', padding: '16px',
      boxShadow: 'var(--shadow-1)', border: '1px solid var(--asphalt-100)',
      display: 'flex', gap: 14, alignItems: 'flex-start',
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--ink-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <WpIcon name="car" size={22} color="var(--ink-600)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--asphalt-900)' }}>{v.model}</div>
          <WpPill tone={v.status === 'ACTIVE' ? 'live' : 'cancelled'}>{v.status}</WpPill>
        </div>
        <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--asphalt-500)', marginBottom: 8 }}>
          {v.plate} · {v.type} · {v.fuel}
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span style={{ fontSize: 12, color: 'var(--asphalt-600)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <WpIcon name="users" size={13} color="var(--asphalt-400)" />
            {v.seats} seats
          </span>
          <button
            onClick={() => onRemove(v.id)}
            style={{ fontSize: 12, color: 'var(--danger-600)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', padding: 0 }}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DriverVehiclesScreen() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  const [vehicles, setVehicles] = useState(MOCK_VEHICLES);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ plate: '', model: '', type: 'Sedan', seats: 4, fuel: 'Petrol' });
  const [error, setError] = useState('');

  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  const handleAdd = () => {
    if (!form.plate || !form.model) { setError('Plate and model are required.'); return; }
    setVehicles(v => [...v, { ...form, id: `V${Date.now()}`, status: 'ACTIVE' }]);
    setForm({ plate: '', model: '', type: 'Sedan', seats: 4, fuel: 'Petrol' });
    setShowForm(false);
    setError('');
  };

  const handleRemove = id => setVehicles(v => v.filter(x => x.id !== id));

  const AddForm = () => (
    <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 20, border: '1.5px dashed var(--asphalt-300)', boxShadow: 'var(--shadow-1)' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--asphalt-900)', marginBottom: 16 }}>Add vehicle</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {[
          { key: 'plate', label: 'Plate no.', placeholder: 'KA 01 MH 0001' },
          { key: 'model', label: 'Model', placeholder: 'Honda City' },
        ].map(f => (
          <div key={f.key}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--asphalt-500)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>{f.label}</label>
            <input
              value={form[f.key]}
              onChange={e => set(f.key)(e.target.value)}
              placeholder={f.placeholder}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--asphalt-200)', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--asphalt-900)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        ))}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--asphalt-500)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Type</label>
          <select value={form.type} onChange={e => set('type')(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--asphalt-200)', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--asphalt-900)', background: '#fff', outline: 'none', boxSizing: 'border-box' }}>
            {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--asphalt-500)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Fuel</label>
          <select value={form.fuel} onChange={e => set('fuel')(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--asphalt-200)', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--asphalt-900)', background: '#fff', outline: 'none', boxSizing: 'border-box' }}>
            {FUEL_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--asphalt-500)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Seats</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {[2, 3, 4, 5, 6, 7].map(n => (
              <button key={n} onClick={() => set('seats')(n)} style={{
                width: 36, height: 36, borderRadius: 'var(--radius-sm)', border: '1.5px solid',
                borderColor: form.seats === n ? 'var(--ink-600)' : 'var(--asphalt-200)',
                background: form.seats === n ? 'var(--ink-950)' : '#fff',
                color: form.seats === n ? '#fff' : 'var(--asphalt-700)',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>{n}</button>
            ))}
          </div>
        </div>
      </div>
      {error && <div style={{ fontSize: 13, color: 'var(--danger-600)', marginBottom: 12 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 10 }}>
        <WpButton kind="accent" size="sm" onClick={handleAdd}>Add vehicle</WpButton>
        <WpButton kind="ghost" size="sm" onClick={() => { setShowForm(false); setError(''); }}>Cancel</WpButton>
      </div>
    </div>
  );

  const Content = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--asphalt-500)' }}>{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} registered</div>
        {!showForm && (
          <WpButton kind="accent" size="sm" onClick={() => setShowForm(true)}>
            <WpIcon name="plus" size={15} color="var(--ink-950)" />
            Add vehicle
          </WpButton>
        )}
      </div>
      {showForm && <AddForm />}
      {vehicles.length === 0 && !showForm ? (
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '40px 20px', textAlign: 'center', border: '1.5px dashed var(--asphalt-200)' }}>
          <WpIcon name="car" size={36} color="var(--asphalt-300)" />
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--asphalt-600)', marginTop: 12 }}>No vehicles yet</p>
          <p style={{ fontSize: 13, color: 'var(--asphalt-400)', marginTop: 4 }}>Register your vehicle to start offering rides</p>
          <div style={{ marginTop: 16 }}>
            <WpButton kind="accent" size="md" onClick={() => setShowForm(true)}>Add vehicle</WpButton>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {vehicles.map(v => <VehicleCard key={v.id} v={v} onRemove={handleRemove} />)}
        </div>
      )}
    </div>
  );

  if (isDesktop) {
    const totalSeats = vehicles.reduce((s, v) => s + v.seats, 0);
    const activeCount = vehicles.filter(v => v.status === 'ACTIVE').length;
    const docs = ['Registration Certificate (RC)', 'Insurance policy', 'PUC certificate', "Driver's licence"];
    return (
      <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)' }}>
        <div style={{ padding: '32px 40px 0' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--asphalt-900)', letterSpacing: '-0.02em' }}>My vehicles</h1>
          <p style={{ fontSize: 13, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>Register and manage your vehicles</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, padding: '24px 40px 40px', alignItems: 'start' }}>
          <Content />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', padding: 24, boxShadow: 'var(--shadow-2)', border: '1px solid var(--asphalt-100)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--asphalt-400)', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>Fleet summary</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Vehicles', value: vehicles.length, icon: 'car', bg: 'var(--ink-50)', color: 'var(--ink-600)' },
                  { label: 'Total seats', value: totalSeats, icon: 'users', bg: 'var(--success-100)', color: 'var(--success-700)' },
                  { label: 'Active', value: activeCount, icon: 'check', bg: 'var(--voltage-50, #f5ffe0)', color: 'var(--ink-600)' },
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
            <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', padding: 24, boxShadow: 'var(--shadow-2)', border: '1px solid var(--asphalt-100)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--asphalt-400)', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>Document checklist</div>
              {docs.map(doc => (
                <div key={doc} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: 'var(--success-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <WpIcon name="check" size={10} color="var(--success-700)" />
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--asphalt-600)', fontFamily: 'var(--font-sans)' }}>{doc}</span>
                </div>
              ))}
              <div style={{ fontSize: 11, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>Keep all docs current to stay eligible for rides.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', paddingBottom: 40 }}>
      <WpAppBar title="My vehicles" onBack={() => navigate(-1)} dark />
      <div style={{ padding: 16 }}>
        <Content />
      </div>
    </div>
  );
}
