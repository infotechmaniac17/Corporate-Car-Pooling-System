import React, { useState } from 'react';
import WpButton from './WpButton';
import { submitDriverRequest } from '../api/roleRequests';

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  fontSize: '15px',
  fontFamily: 'var(--font-sans)',
  fontWeight: 500,
  color: 'var(--asphalt-900)',
  background: 'var(--asphalt-50)',
  border: '1.5px solid var(--asphalt-200)',
  borderRadius: 'var(--radius-md)',
  outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
};

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%278%27 viewBox=%270 0 12 8%27%3E%3Cpath fill=%27%23353b48%27 d=%27M1 1l5 5 5-5%27/%3E%3C/svg%3E")',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '36px',
  cursor: 'pointer',
};

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
  color: 'var(--asphalt-500)',
  marginBottom: '6px',
  fontFamily: 'var(--font-mono)',
};

const sectionLabelStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--asphalt-500)',
  textTransform: 'uppercase',
  letterSpacing: '.08em',
  fontFamily: 'var(--font-mono)',
  marginBottom: 4,
};

const INITIAL_DRIVER_DOCS = {
  vehiclePlate: '',
  vehicleModel: '',
  vehicleType: '',
  vehicleFuel: '',
  vehicleSeats: '',
  licenseNumber: '',
  licenseExpiry: '',
  idProofType: '',
  idProofNumber: '',
  rcNumber: '',
  insuranceNumber: '',
  insuranceExpiry: '',
  licenseDoc: null,
  idProofDoc: null,
  rcDoc: null,
  insuranceDoc: null,
};

function Field({ label, type = 'text', value, onChange, placeholder, required = false }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={inputStyle}
        onFocus={e => { e.target.style.borderColor = 'var(--ink-500)'; e.target.style.background = '#fff'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--asphalt-200)'; e.target.style.background = 'var(--asphalt-50)'; }}
      />
    </div>
  );
}

function FileInput({ label, value, onChange }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <label style={{ display: 'block', cursor: 'pointer' }}>
        <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={onChange} style={{ display: 'none' }} />
        <div style={{ ...inputStyle, color: value ? 'var(--asphalt-900)' : 'var(--asphalt-400)', cursor: 'pointer', fontSize: 14 }}>
          {value ? value.name : 'Choose file (JPG, PNG or PDF)'}
        </div>
      </label>
    </div>
  );
}

export default function DriverDocsForm({ onSuccess, submitLabel = 'Submit for verification' }) {
  const [docs, setDocs] = useState(INITIAL_DRIVER_DOCS);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setField = (field) => (e) =>
    setDocs(prev => ({ ...prev, [field]: e.target.value }));

  const setFile = (field) => (e) => {
    const file = e.target.files?.[0] || null;
    setDocs(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { vehiclePlate, vehicleModel, vehicleType, vehicleFuel, vehicleSeats,
            licenseNumber, licenseExpiry, idProofType, idProofNumber,
            rcNumber, insuranceNumber, insuranceExpiry,
            licenseDoc, idProofDoc, rcDoc, insuranceDoc } = docs;

    if (!licenseDoc || !idProofDoc || !rcDoc || !insuranceDoc) {
      return setError('Please upload all four required documents.');
    }

    const fd = new FormData();
    fd.append('data', new Blob([JSON.stringify({
      vehiclePlate, vehicleModel, vehicleType, vehicleFuel,
      vehicleSeats: Number(vehicleSeats),
      licenseNumber, licenseExpiry,
      idProofType, idProofNumber,
      rcNumber, insuranceNumber, insuranceExpiry,
    })], { type: 'application/json' }));
    fd.append('licenseDoc', licenseDoc);
    fd.append('idProofDoc', idProofDoc);
    fd.append('rcDoc', rcDoc);
    fd.append('insuranceDoc', insuranceDoc);

    setLoading(true);
    try {
      await submitDriverRequest(fd);
      onSuccess?.();
    } catch (err) {
      setError(err?.response?.data?.message || 'Document submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={sectionLabelStyle}>Vehicle details</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Field label="Number plate" value={docs.vehiclePlate} onChange={setField('vehiclePlate')} placeholder="KA 01 AB 1234" required />
        <Field label="Model" value={docs.vehicleModel} onChange={setField('vehicleModel')} placeholder="Honda City" required />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Type</label>
          <select value={docs.vehicleType} onChange={setField('vehicleType')} required style={selectStyle}>
            <option value="">Select</option>
            {['Sedan','Hatchback','SUV','MPV'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Fuel</label>
          <select value={docs.vehicleFuel} onChange={setField('vehicleFuel')} required style={selectStyle}>
            <option value="">Select</option>
            {['Petrol','Diesel','CNG','Electric'].map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <Field label="Seats" type="number" value={docs.vehicleSeats} onChange={setField('vehicleSeats')} placeholder="4" required />
      </div>

      <div style={{ ...sectionLabelStyle, marginTop: 8 }}>Driving license</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Field label="License number" value={docs.licenseNumber} onChange={setField('licenseNumber')} placeholder="MH1234567890123" required />
        <Field label="Expiry date" type="date" value={docs.licenseExpiry} onChange={setField('licenseExpiry')} required />
      </div>
      <FileInput label="License document" value={docs.licenseDoc} onChange={setFile('licenseDoc')} />

      <div style={{ ...sectionLabelStyle, marginTop: 8 }}>ID proof</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>ID type</label>
          <select value={docs.idProofType} onChange={setField('idProofType')} required style={selectStyle}>
            <option value="">Select</option>
            {['Aadhaar','PAN','Passport'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <Field label="ID number" value={docs.idProofNumber} onChange={setField('idProofNumber')} placeholder="XXXX XXXX XXXX" required />
      </div>
      <FileInput label="ID document" value={docs.idProofDoc} onChange={setFile('idProofDoc')} />

      <div style={{ ...sectionLabelStyle, marginTop: 8 }}>Vehicle RC</div>
      <Field label="RC number" value={docs.rcNumber} onChange={setField('rcNumber')} placeholder="MH0120231234567" required />
      <FileInput label="RC document" value={docs.rcDoc} onChange={setFile('rcDoc')} />

      <div style={{ ...sectionLabelStyle, marginTop: 8 }}>Insurance</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Field label="Policy number" value={docs.insuranceNumber} onChange={setField('insuranceNumber')} placeholder="POL12345678" required />
        <Field label="Expiry date" type="date" value={docs.insuranceExpiry} onChange={setField('insuranceExpiry')} required />
      </div>
      <FileInput label="Insurance document" value={docs.insuranceDoc} onChange={setFile('insuranceDoc')} />

      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--danger-100)', border: '1px solid var(--danger-500)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--danger-700)', fontFamily: 'var(--font-sans)' }}>
          {error}
        </div>
      )}

      <WpButton kind="primary" size="lg" full type="submit" disabled={loading}>
        {loading ? 'Submitting…' : submitLabel}
      </WpButton>
    </form>
  );
}
