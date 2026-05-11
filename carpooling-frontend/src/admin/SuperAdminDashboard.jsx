import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import WpIcon from '../components/WpIcon';
import WpAvatar from '../components/WpAvatar';
import WpPill from '../components/WpPill';
import api from '../api/client';

// ─── Shared sub-components ────────────────────────────────────────────────────

function PageHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--asphalt-900)', marginBottom: 4, letterSpacing: '-0.02em' }}>{title}</h1>
      {sub && <p style={{ fontSize: 13, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>{sub}</p>}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--asphalt-200)',
      boxShadow: 'var(--shadow-1)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardHeader({ title, meta, children }) {
  return (
    <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--asphalt-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--asphalt-900)' }}>{title}</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {meta && <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--asphalt-400)' }}>{meta}</span>}
        {children}
      </div>
    </div>
  );
}

function Table({ cols, rows, renderRow }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'var(--asphalt-50)' }}>
            {cols.map(col => (
              <th key={col} style={{
                padding: '10px 16px', textAlign: 'left',
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                letterSpacing: '.06em', textTransform: 'uppercase',
                color: 'var(--asphalt-400)', borderBottom: '1px solid var(--asphalt-100)',
                whiteSpace: 'nowrap',
              }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}
              style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--asphalt-100)' : 'none', cursor: 'default' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--asphalt-50)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {renderRow(row)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TD({ children, mono, bold, muted }) {
  return (
    <td style={{
      padding: '14px 16px',
      fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
      fontWeight: bold ? 700 : 500,
      color: muted ? 'var(--asphalt-500)' : 'var(--asphalt-800)',
      whiteSpace: 'nowrap',
    }}>{children}</td>
  );
}

function StatCard({ label, value, change, changeUp, danger, icon, iconBg, sub }) {
  return (
    <Card style={{ padding: 20, ...(danger ? { borderColor: 'var(--danger-500)' } : {}) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--asphalt-500)' }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: iconBg || 'var(--ink-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: danger ? 'var(--danger-600)' : 'var(--asphalt-900)', marginBottom: 6 }}>{value}</div>
      {(change || sub) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600,
          color: danger ? 'var(--danger-600)' : changeUp ? 'var(--success-700)' : 'var(--asphalt-400)',
          fontFamily: 'var(--font-mono)' }}>
          {changeUp && <WpIcon name="trending-up" size={14} color="var(--success-700)" />}
          {change || sub}
        </div>
      )}
    </Card>
  );
}

function OrgStatusPill({ status }) {
  const tone = status === 'ACTIVE' ? 'live' : status === 'PENDING' ? 'warn' : 'cancelled';
  return <WpPill tone={tone}>{status}</WpPill>;
}

function FormField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--asphalt-600)', fontFamily: 'var(--font-mono)', letterSpacing: '.04em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  padding: '9px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1.5px solid var(--asphalt-200)',
  fontSize: 13,
  fontFamily: 'var(--font-sans)',
  color: 'var(--asphalt-900)',
  outline: 'none',
  background: '#fff',
  width: '100%',
  boxSizing: 'border-box',
};

const selectStyle = { ...inputStyle, cursor: 'pointer' };

function Alert({ type, children }) {
  const isError = type === 'error';
  return (
    <div style={{
      padding: '12px 16px',
      borderRadius: 'var(--radius-md)',
      background: isError ? 'var(--danger-100)' : '#dcfce7',
      border: `1.5px solid ${isError ? 'var(--danger-400)' : '#86efac'}`,
      color: isError ? 'var(--danger-800)' : '#166534',
      fontSize: 13,
      fontWeight: 500,
    }}>
      {children}
    </div>
  );
}

// ─── Page: Overview ───────────────────────────────────────────────────────────

function OverviewPage({ orgs }) {
  const total = orgs.length;
  const active = orgs.filter(o => o.status === 'ACTIVE').length;
  const pending = orgs.filter(o => o.status === 'PENDING').length;

  return (
    <>
      <PageHeader title="Platform overview" sub="All organisations across the Waypoint network" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total organisations" value={total}  change="Registered on platform" changeUp iconBg="var(--ink-50)"      icon={<WpIcon name="building"  size={16} color="var(--ink-600)"     />} />
        <StatCard label="Active"              value={active} change="Onboarded & running"    changeUp iconBg="var(--success-100)" icon={<WpIcon name="check"     size={16} color="var(--success-700)" />} />
        <StatCard label="Pending activation"  value={pending} change={pending > 0 ? 'Awaiting activation' : 'None pending'} danger={pending > 0} iconBg="var(--warning-100)" icon={<WpIcon name="clock" size={16} color="var(--warning-700)" />} />
      </div>
      <Card style={{ overflow: 'hidden' }}>
        <CardHeader title="All organisations" meta={`${total} total`} />
        {orgs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            No organisations found.
          </div>
        ) : (
          <Table
            cols={['Name', 'Domain', 'Office Address', 'Status', 'Employees']}
            rows={orgs}
            renderRow={o => (<>
              <TD bold>{o.name}</TD>
              <TD mono muted>{o.domain}</TD>
              <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--asphalt-600)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {o.officeAddress || '—'}
              </td>
              <TD><OrgStatusPill status={o.status} /></TD>
              <TD mono muted>—</TD>
            </>)}
          />
        )}
      </Card>
    </>
  );
}

// ─── Page: Organisations ─────────────────────────────────────────────────────

const EMPTY_ORG_FORM = { name: '', domain: '', officeAddress: '', officeLat: '', officeLng: '' };

function OrganisationsPage({ orgs, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_ORG_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activatingId, setActivatingId] = useState(null);

  const handleFormChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleAddOrg = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.domain.trim() || !form.officeAddress.trim()) {
      setError('Name, domain and office address are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        domain: form.domain.trim(),
        officeAddress: form.officeAddress.trim(),
        ...(form.officeLat !== '' ? { officeLat: parseFloat(form.officeLat) } : {}),
        ...(form.officeLng !== '' ? { officeLng: parseFloat(form.officeLng) } : {}),
      };
      await api.post('/organisations', payload);
      setForm(EMPTY_ORG_FORM);
      setShowForm(false);
      onRefresh();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create organisation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async (id) => {
    setActivatingId(id);
    try {
      await api.post(`/organisations/${id}/activate`);
      onRefresh();
    } catch {
      // silent
    } finally {
      setActivatingId(null);
    }
  };

  return (
    <>
      <PageHeader title="Organisations" sub={`${orgs.length} organisations registered`} />

      {showForm && (
        <Card style={{ marginBottom: 24, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--asphalt-900)', marginBottom: 20 }}>Add Organisation</h3>
          <form onSubmit={handleAddOrg}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <FormField label="Organisation name">
                <input style={inputStyle} value={form.name} onChange={e => handleFormChange('name', e.target.value)} placeholder="e.g. Acme Corp" />
              </FormField>
              <FormField label="Domain">
                <input style={inputStyle} value={form.domain} onChange={e => handleFormChange('domain', e.target.value)} placeholder="e.g. acme.com" />
              </FormField>
            </div>
            <div style={{ marginBottom: 16 }}>
              <FormField label="Office address">
                <input style={inputStyle} value={form.officeAddress} onChange={e => handleFormChange('officeAddress', e.target.value)} placeholder="e.g. Magarpatta City, Pune" />
              </FormField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <FormField label="Office latitude (optional)">
                <input style={inputStyle} type="number" step="any" value={form.officeLat} onChange={e => handleFormChange('officeLat', e.target.value)} placeholder="e.g. 18.5195" />
              </FormField>
              <FormField label="Office longitude (optional)">
                <input style={inputStyle} type="number" step="any" value={form.officeLng} onChange={e => handleFormChange('officeLng', e.target.value)} placeholder="e.g. 73.9234" />
              </FormField>
            </div>
            {error && <div style={{ marginBottom: 16 }}><Alert type="error">{error}</Alert></div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={submitting} style={{
                padding: '9px 22px', borderRadius: 999, background: 'var(--ink-950)', color: '#fff',
                border: 'none', fontSize: 13, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1,
              }}>
                {submitting ? 'Creating…' : 'Create organisation'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_ORG_FORM); setError(''); }} style={{
                padding: '9px 20px', borderRadius: 999, background: 'var(--asphalt-100)', color: 'var(--asphalt-700)',
                border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card style={{ overflow: 'hidden' }}>
        <CardHeader title="All organisations" meta={`${orgs.length} total`}>
          {!showForm && (
            <button onClick={() => setShowForm(true)} style={{
              padding: '7px 16px', borderRadius: 999, background: 'var(--ink-950)', color: '#fff',
              border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <WpIcon name="plus" size={13} color="#fff" /> Add Organisation
            </button>
          )}
        </CardHeader>
        {orgs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            No organisations found.
          </div>
        ) : (
          <Table
            cols={['Name', 'Domain', 'Office Address', 'Status', 'Action']}
            rows={orgs}
            renderRow={o => (<>
              <TD bold>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <WpAvatar initials={o.name.split(' ').map(n => n[0]).join('').slice(0, 2)} size={28} tone="asphalt" />
                  {o.name}
                </div>
              </TD>
              <TD mono muted>{o.domain}</TD>
              <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--asphalt-600)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {o.officeAddress || '—'}
              </td>
              <TD><OrgStatusPill status={o.status} /></TD>
              <td style={{ padding: '10px 16px' }}>
                {o.status === 'PENDING' ? (
                  <button
                    disabled={activatingId === o.id}
                    onClick={() => handleActivate(o.id)}
                    style={{
                      padding: '5px 14px', borderRadius: 999,
                      background: activatingId === o.id ? 'var(--asphalt-200)' : 'var(--voltage-400)',
                      color: activatingId === o.id ? 'var(--asphalt-500)' : 'var(--ink-950)',
                      border: '1.5px solid var(--ink-950)',
                      fontSize: 11, fontWeight: 700, cursor: activatingId === o.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {activatingId === o.id ? 'Activating…' : 'Activate'}
                  </button>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--success-700)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    <WpIcon name="check" size={13} color="var(--success-700)" /> Active
                  </span>
                )}
              </td>
            </>)}
          />
        )}
      </Card>
    </>
  );
}

// ─── Page: Create Admin ───────────────────────────────────────────────────────

const EMPTY_ADMIN_FORM = { organisationId: '', name: '', email: '', phone: '', gender: 'MALE', password: '' };

function CreateAdminPage({ orgs }) {
  const [form, setForm] = useState(EMPTY_ADMIN_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (error) setError('');
    if (success) setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { organisationId, name, email, phone, gender, password } = form;
    if (!organisationId || !name.trim() || !email.trim() || !phone.trim() || !password) {
      setError('All fields are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess(null);
    try {
      await api.post('/organisations/admins', {
        organisationId: parseInt(organisationId),
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        gender,
        password,
      });
      setSuccess({ email: email.trim(), password });
      setForm(EMPTY_ADMIN_FORM);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create admin.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeOrgs = orgs.filter(o => o.status === 'ACTIVE');

  return (
    <>
      <PageHeader title="Create Admin" sub="Provision an organisation admin account" />
      <div style={{ maxWidth: 560 }}>
        <Card style={{ padding: 28 }}>
          {success && (
            <div style={{ marginBottom: 20 }}>
              <Alert type="success">
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Admin created successfully.</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span>Email: <strong>{success.email}</strong></span>
                  <span>Password: <strong>{success.password}</strong></span>
                </div>
              </Alert>
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormField label="Organisation">
              <select style={selectStyle} value={form.organisationId} onChange={e => handleChange('organisationId', e.target.value)}>
                <option value="">Select organisation…</option>
                {activeOrgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                {activeOrgs.length === 0 && orgs.filter(o => o.status !== 'ACTIVE').map(o => (
                  <option key={o.id} value={o.id}>{o.name} (pending)</option>
                ))}
              </select>
              {activeOrgs.length === 0 && orgs.length > 0 && (
                <span style={{ fontSize: 11, color: 'var(--warning-700)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  No active orgs — activate one first in Organisations tab.
                </span>
              )}
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FormField label="Full name">
                <input style={inputStyle} value={form.name} onChange={e => handleChange('name', e.target.value)} placeholder="Ravi Kumar" />
              </FormField>
              <FormField label="Email">
                <input style={inputStyle} type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="ravi@acme.com" />
              </FormField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FormField label="Phone">
                <input style={inputStyle} value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+91 98765 43210" />
              </FormField>
              <FormField label="Gender">
                <select style={selectStyle} value={form.gender} onChange={e => handleChange('gender', e.target.value)}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </FormField>
            </div>
            <FormField label="Password">
              <input style={inputStyle} type="password" value={form.password} onChange={e => handleChange('password', e.target.value)} placeholder="Minimum 8 characters" />
            </FormField>
            {error && <Alert type="error">{error}</Alert>}
            <div style={{ paddingTop: 4 }}>
              <button type="submit" disabled={submitting} style={{
                padding: '10px 28px', borderRadius: 999,
                background: submitting ? 'var(--asphalt-200)' : 'var(--ink-950)',
                color: submitting ? 'var(--asphalt-500)' : '#fff',
                border: 'none', fontSize: 13, fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}>
                {submitting ? 'Creating…' : 'Create admin'}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}

// ─── Sidebar nav config ───────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: 'Platform',
    items: [
      { id: 'overview', label: 'Overview', live: true },
    ],
  },
  {
    label: 'Manage',
    items: [
      { id: 'organisations', label: 'Organisations' },
      { id: 'create-admin',  label: 'Create Admin' },
    ],
  },
];

// ─── Root component ───────────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const { currentUser, logout } = useAuth();
  const [activeNav, setActiveNav] = useState('overview');
  const [orgs, setOrgs] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(true);

  const fetchOrgs = () => {
    setOrgsLoading(true);
    api.get('/organisations')
      .then(res => setOrgs(res.data?.data || res.data || []))
      .catch(() => setOrgs([]))
      .finally(() => setOrgsLoading(false));
  };

  useEffect(() => { fetchOrgs(); }, []);

  function renderPage() {
    if (orgsLoading) {
      return (
        <Card style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>Loading…</div>
        </Card>
      );
    }
    switch (activeNav) {
      case 'overview':      return <OverviewPage orgs={orgs} />;
      case 'organisations': return <OrganisationsPage orgs={orgs} onRefresh={fetchOrgs} />;
      case 'create-admin':  return <CreateAdminPage orgs={orgs} />;
      default:              return <OverviewPage orgs={orgs} />;
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-sans)', background: 'var(--asphalt-50)' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside style={{
        width: 240, flexShrink: 0, background: 'var(--ink-950)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, bottom: 0, left: 0, overflowY: 'auto', zIndex: 50,
      }}>
        {/* Logo + access level */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <svg width="32" height="32" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="14" fill="var(--voltage-400)" />
              <path d="M22 8C16.477 8 12 12.477 12 18C12 24 22 36 22 36C22 36 32 24 32 18C32 12.477 27.523 8 22 8Z" fill="var(--ink-950)" />
              <circle cx="22" cy="18" r="4" fill="var(--voltage-400)" />
            </svg>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>waypoint</span>
          </div>
          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>Access level</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <WpIcon name="shield" size={14} color="var(--voltage-400)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--voltage-400)' }}>Super Admin</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: 12 }}>
          {NAV_SECTIONS.map(section => (
            <div key={section.label} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-mono)', marginBottom: 6, padding: '0 8px' }}>
                {section.label}
              </div>
              {section.items.map(item => {
                const isActive = activeNav === item.id;
                return (
                  <button key={item.id} onClick={() => setActiveNav(item.id)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 10px', borderRadius: 'var(--radius-md)',
                    background: isActive ? 'var(--voltage-400)' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    color: isActive ? 'var(--ink-950)' : 'rgba(255,255,255,0.55)',
                    fontSize: 13, fontWeight: isActive ? 700 : 500,
                    fontFamily: 'var(--font-sans)', textAlign: 'left', marginBottom: 2,
                    transition: 'all 0.1s',
                  }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; } }}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; } }}
                  >
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.live && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: isActive ? 'var(--ink-950)' : 'var(--voltage-400)', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? 'var(--ink-950)' : 'var(--voltage-400)' }} />LIVE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User + logout */}
        <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginBottom: 4 }}>
            <WpAvatar initials={(currentUser?.name || currentUser?.email || 'SA').split(' ').map(n => n[0]).join('').slice(0, 2)} size={28} tone="ink" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser?.name || currentUser?.email || 'Super Admin'}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>SUPER_ADMIN</div>
            </div>
          </div>
          <button onClick={logout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 10px', borderRadius: 'var(--radius-md)',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'var(--font-sans)', textAlign: 'left',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
          >
            <WpIcon name="settings" size={16} color="currentColor" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top bar */}
        <div style={{
          background: '#fff', borderBottom: '1px solid var(--asphalt-200)',
          padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 16,
          position: 'sticky', top: 0, zIndex: 40,
        }}>
          <div style={{ flex: 1, maxWidth: 360, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', border: '1.5px solid var(--asphalt-200)', borderRadius: 'var(--radius-pill)', background: 'var(--asphalt-50)' }}>
            <WpIcon name="search" size={16} color="var(--asphalt-400)" />
            <input type="text" placeholder="Search organisations, admins…" style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--asphalt-800)' }} />
          </div>
          <div style={{ flex: 1 }} />
          <WpAvatar initials={(currentUser?.name || 'SA').split(' ').map(n => n[0]).join('').slice(0, 2)} size={36} tone="ink" />
        </div>

        {/* Page content */}
        <div style={{ padding: 28, flex: 1 }}>
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
