import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import WpIcon from '../components/WpIcon';
import WpAvatar from '../components/WpAvatar';
import WpPill from '../components/WpPill';
import AddressInput from '../components/AddressInput';
import api from '../api/client';

// ─── Shared sub-components ────────────────────────────────────────────────────

function PageHeader({ title, sub, back, onBack }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {back && (
        <button onClick={onBack} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--asphalt-500)', fontSize: 13, fontWeight: 600, padding: 0,
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--asphalt-900)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--asphalt-500)'}
        >
          <span style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}><WpIcon name="arrow-right" size={14} color="currentColor" /></span>
          {back}
        </button>
      )}
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--asphalt-900)', marginBottom: 4, letterSpacing: '-0.02em' }}>{title}</h1>
      {sub && <p style={{ fontSize: 13, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>{sub}</p>}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--asphalt-200)', boxShadow: 'var(--shadow-1)', ...style,
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

function Table({ cols, rows, renderRow, onRowClick }) {
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
                color: 'var(--asphalt-400)', borderBottom: '1px solid var(--asphalt-100)', whiteSpace: 'nowrap',
              }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--asphalt-100)' : 'none', cursor: onRowClick ? 'pointer' : 'default' }}
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
      color: muted ? 'var(--asphalt-500)' : 'var(--asphalt-800)', whiteSpace: 'nowrap',
    }}>{children}</td>
  );
}

function StatCard({ label, value, sub, icon, iconBg, danger, changeUp }) {
  return (
    <Card style={{ padding: 20, ...(danger ? { borderColor: 'var(--danger-500)' } : {}) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--asphalt-500)' }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: iconBg || 'var(--ink-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: danger ? 'var(--danger-600)' : 'var(--asphalt-900)', marginBottom: 6 }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 12, fontWeight: 600, color: danger ? 'var(--danger-600)' : changeUp ? 'var(--success-700)' : 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {changeUp && <WpIcon name="trending-up" size={14} color="var(--success-700)" />}
          {sub}
        </div>
      )}
    </Card>
  );
}

function OrgStatusPill({ status }) {
  const tone = status === 'ACTIVE' ? 'live' : status === 'SUSPENDED' ? 'cancelled' : 'warn';
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
  padding: '9px 14px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--asphalt-200)',
  fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--asphalt-900)',
  outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box',
};

const selectStyle = { ...inputStyle, cursor: 'pointer' };

function Alert({ type, children }) {
  const isError = type === 'error';
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 'var(--radius-md)',
      background: isError ? 'var(--danger-100)' : '#dcfce7',
      border: `1.5px solid ${isError ? 'var(--danger-400)' : '#86efac'}`,
      color: isError ? 'var(--danger-800)' : '#166534',
      fontSize: 13, fontWeight: 500,
    }}>
      {children}
    </div>
  );
}

function Btn({ onClick, disabled, variant = 'primary', size = 'md', children, style, type = 'button' }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    borderRadius: 999, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--font-sans)', fontWeight: 700, opacity: disabled ? 0.6 : 1,
    transition: 'opacity 0.1s',
    ...size === 'sm' ? { padding: '5px 14px', fontSize: 11 } : { padding: '9px 22px', fontSize: 13 },
  };
  const variants = {
    primary: { background: 'var(--ink-950)', color: '#fff' },
    secondary: { background: 'var(--asphalt-100)', color: 'var(--asphalt-700)' },
    danger: { background: 'var(--danger-600)', color: '#fff' },
    warning: { background: 'var(--voltage-400)', color: 'var(--ink-950)', border: '1.5px solid var(--ink-950)' },
    success: { background: 'var(--success-600)', color: '#fff' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function SectionDivider({ label }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', letterSpacing: '.08em', textTransform: 'uppercase', margin: '28px 0 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
      {label}
      <div style={{ flex: 1, height: 1, background: 'var(--asphalt-100)' }} />
    </div>
  );
}

// ─── Page: Overview ───────────────────────────────────────────────────────────

function OverviewPage({ orgs }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/platform/stats')
      .then(r => setStats(r.data?.data || r.data))
      .catch(() => {});
  }, []);

  const total = orgs.length;
  const active = orgs.filter(o => o.status === 'ACTIVE').length;
  const pending = orgs.filter(o => o.status === 'PENDING').length;
  const suspended = orgs.filter(o => o.status === 'SUSPENDED').length;

  return (
    <>
      <PageHeader title="Platform overview" sub="All organisations across the Waypoint network" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total organisations" value={total} sub="Registered on platform" changeUp iconBg="var(--ink-50)" icon={<WpIcon name="building" size={16} color="var(--ink-600)" />} />
        <StatCard label="Active" value={active} sub="Onboarded & running" changeUp iconBg="var(--success-100)" icon={<WpIcon name="check" size={16} color="var(--success-700)" />} />
        <StatCard label="Pending" value={pending} sub={pending > 0 ? 'Awaiting activation' : 'None pending'} danger={pending > 0} iconBg="var(--warning-100)" icon={<WpIcon name="clock" size={16} color="var(--warning-700)" />} />
      </div>
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard label="Suspended" value={stats.suspendedOrgs} sub="Blocked organisations" danger={stats.suspendedOrgs > 0} iconBg="var(--danger-100)" icon={<WpIcon name="shield" size={16} color="var(--danger-600)" />} />
          <StatCard label="Total users" value={stats.totalUsers} sub="Across all orgs" changeUp iconBg="var(--ink-50)" icon={<WpIcon name="users" size={16} color="var(--ink-600)" />} />
          <StatCard label="Admins" value={stats.totalAdmins} sub="Org administrators" iconBg="var(--ink-50)" icon={<WpIcon name="shield" size={16} color="var(--ink-600)" />} />
        </div>
      )}
      <Card style={{ overflow: 'hidden' }}>
        <CardHeader title="All organisations" meta={`${total} total`} />
        {orgs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>No organisations found.</div>
        ) : (
          <Table
            cols={['Name', 'Domain', 'Status']}
            rows={orgs}
            renderRow={o => (<>
              <TD bold>{o.name}</TD>
              <TD mono muted>{o.domain}</TD>
              <TD><OrgStatusPill status={o.status} /></TD>
            </>)}
          />
        )}
      </Card>
    </>
  );
}

// ─── Page: Organisations (list) ───────────────────────────────────────────────

const EMPTY_ORG_FORM = { name: '', domain: '', address: null };

function OrganisationsPage({ orgs, onRefresh, onSelectOrg }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_ORG_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activatingId, setActivatingId] = useState(null);

  const handleAddOrg = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.domain.trim()) { setError('Name and domain are required.'); return; }
    setSubmitting(true); setError('');
    try {
      await api.post('/organisations', {
        name: form.name.trim(),
        domain: form.domain.trim(),
        officeAddress: form.address?.label || '',
        officeLat: form.address?.lat || null,
        officeLng: form.address?.lng || null,
      });
      setForm(EMPTY_ORG_FORM); setShowForm(false); onRefresh();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create organisation.');
    } finally { setSubmitting(false); }
  };

  const handleActivate = async (e, id) => {
    e.stopPropagation();
    setActivatingId(id);
    try { await api.post(`/organisations/${id}/activate`); onRefresh(); } catch { }
    finally { setActivatingId(null); }
  };

  return (
    <>
      <PageHeader title="Organisations" sub={`${orgs.length} organisations registered — click a row to manage`} />

      {showForm && (
        <Card style={{ marginBottom: 24, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--asphalt-900)', marginBottom: 20 }}>Add Organisation</h3>
          <form onSubmit={handleAddOrg}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <FormField label="Organisation name">
                <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Acme Corp" />
              </FormField>
              <FormField label="Domain">
                <input style={inputStyle} value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} placeholder="e.g. acme.com" />
              </FormField>
            </div>
            <div style={{ marginBottom: 20 }}>
              <AddressInput
                label="Primary office address"
                value={form.address}
                onChange={addr => setForm(f => ({ ...f, address: addr }))}
                placeholder="Search office location…"
              />
            </div>
            {error && <div style={{ marginBottom: 16 }}><Alert type="error">{error}</Alert></div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create organisation'}</Btn>
              <Btn variant="secondary" onClick={() => { setShowForm(false); setForm(EMPTY_ORG_FORM); setError(''); }}>Cancel</Btn>
            </div>
          </form>
        </Card>
      )}

      <Card style={{ overflow: 'hidden' }}>
        <CardHeader title="All organisations" meta={`${orgs.length} total`}>
          {!showForm && (
            <Btn size="sm" onClick={() => setShowForm(true)}>
              <WpIcon name="plus" size={13} color="#fff" /> Add Organisation
            </Btn>
          )}
        </CardHeader>
        {orgs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>No organisations found.</div>
        ) : (
          <Table
            cols={['Name', 'Domain', 'Office Address', 'Status', 'Action']}
            rows={orgs}
            onRowClick={onSelectOrg}
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
              <td style={{ padding: '10px 16px' }} onClick={e => e.stopPropagation()}>
                {o.status === 'PENDING' ? (
                  <Btn size="sm" variant="warning" disabled={activatingId === o.id} onClick={(e) => handleActivate(e, o.id)}>
                    {activatingId === o.id ? 'Activating…' : 'Activate'}
                  </Btn>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>
                    <WpIcon name="arrow-right" size={13} color="var(--asphalt-400)" /> Click row
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

// ─── Org Detail: Office card ──────────────────────────────────────────────────

const EMPTY_OFFICE_FORM = { name: '', address: null, isPrimary: false };

function OfficeCard({ orgId, onRefreshOffices }) {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOffice, setEditingOffice] = useState(null);
  const [form, setForm] = useState(EMPTY_OFFICE_FORM);
  const [syncToUsers, setSyncToUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/organisations/${orgId}/offices`)
      .then(r => setOffices(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  const startAdd = () => { setEditingOffice(null); setForm(EMPTY_OFFICE_FORM); setSyncToUsers(false); setShowForm(true); setError(''); };
  const startEdit = (o) => {
    setEditingOffice(o);
    setForm({ name: o.name, address: o.address ? { label: o.address, lat: o.lat, lng: o.lng } : null, isPrimary: o.isPrimary });
    setSyncToUsers(false); setShowForm(true); setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Office name is required.'); return; }
    setSubmitting(true); setError('');
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address?.label || null,
        lat: form.address?.lat || null,
        lng: form.address?.lng || null,
        isPrimary: form.isPrimary,
      };
      if (editingOffice) {
        await api.put(`/organisations/${orgId}/offices/${editingOffice.id}?syncToUsers=${syncToUsers}`, payload);
      } else {
        await api.post(`/organisations/${orgId}/offices`, payload);
      }
      setShowForm(false); setEditingOffice(null); setForm(EMPTY_OFFICE_FORM);
      load(); if (onRefreshOffices) onRefreshOffices();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save office.');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (o) => {
    if (!window.confirm(`Delete office "${o.name}"? This cannot be undone.`)) return;
    setDeletingId(o.id);
    try { await api.delete(`/organisations/${orgId}/offices/${o.id}`); load(); }
    catch (err) { alert(err?.response?.data?.message || 'Failed to delete office.'); }
    finally { setDeletingId(null); }
  };

  return (
    <Card style={{ overflow: 'hidden', marginBottom: 24 }}>
      <CardHeader title="Offices" meta={`${offices.length} location${offices.length !== 1 ? 's' : ''}`}>
        <Btn size="sm" onClick={startAdd}><WpIcon name="plus" size={13} color="#fff" /> Add Office</Btn>
      </CardHeader>

      {showForm && (
        <div style={{ padding: 20, borderBottom: '1px solid var(--asphalt-100)', background: 'var(--asphalt-50)' }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--asphalt-900)', marginBottom: 16 }}>
            {editingOffice ? `Edit "${editingOffice.name}"` : 'New Office'}
          </h4>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <FormField label="Office name">
                <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Pune HQ" />
              </FormField>
              <FormField label="Primary office">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8 }}>
                  <input type="checkbox" id="isPrimary" checked={form.isPrimary} onChange={e => setForm(f => ({ ...f, isPrimary: e.target.checked }))} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                  <label htmlFor="isPrimary" style={{ fontSize: 13, color: 'var(--asphalt-700)', cursor: 'pointer' }}>Mark as primary office</label>
                </div>
              </FormField>
            </div>
            <div style={{ marginBottom: 14 }}>
              <AddressInput
                label="Office address"
                value={form.address}
                onChange={addr => setForm(f => ({ ...f, address: addr }))}
                placeholder="Search office location…"
              />
            </div>
            {editingOffice && (
              <div style={{ marginBottom: 14, padding: '10px 14px', background: '#fff', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--asphalt-200)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="syncUsers" checked={syncToUsers} onChange={e => setSyncToUsers(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <label htmlFor="syncUsers" style={{ fontSize: 13, color: 'var(--asphalt-700)', cursor: 'pointer' }}>
                  <strong>Apply new address to all employees at this office</strong>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    Updates secondaryAddress for {editingOffice.userCount || 0} employee(s) linked to this office
                  </span>
                </label>
              </div>
            )}
            {error && <div style={{ marginBottom: 12 }}><Alert type="error">{error}</Alert></div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn type="submit" disabled={submitting}>{submitting ? 'Saving…' : editingOffice ? 'Save Changes' : 'Add Office'}</Btn>
              <Btn variant="secondary" onClick={() => { setShowForm(false); setEditingOffice(null); setError(''); }}>Cancel</Btn>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 30, textAlign: 'center', color: 'var(--asphalt-400)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>Loading…</div>
      ) : offices.length === 0 ? (
        <div style={{ padding: 30, textAlign: 'center', color: 'var(--asphalt-400)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>No offices yet. Add the first one.</div>
      ) : (
        <div>
          {offices.map((o, i) => (
            <div key={o.id} style={{ padding: '16px 20px', borderBottom: i < offices.length - 1 ? '1px solid var(--asphalt-100)' : 'none', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: o.isPrimary ? 'var(--ink-950)' : 'var(--asphalt-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <WpIcon name="map-pin" size={16} color={o.isPrimary ? 'var(--voltage-400)' : 'var(--asphalt-500)'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--asphalt-900)' }}>{o.name}</span>
                  {o.isPrimary && <WpPill tone="live">Primary</WpPill>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--asphalt-500)' }}>{o.address || 'No address set'}</div>
                {o.lat && <div style={{ fontSize: 11, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{o.lat.toFixed(5)}, {o.lng.toFixed(5)}</div>}
                <div style={{ fontSize: 11, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>{o.userCount} employee{o.userCount !== 1 ? 's' : ''} assigned</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn size="sm" variant="secondary" onClick={() => startEdit(o)}>Edit</Btn>
                <Btn size="sm" variant="danger" disabled={deletingId === o.id} onClick={() => handleDelete(o)}>
                  {deletingId === o.id ? '…' : 'Delete'}
                </Btn>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Org Detail: Admins card ──────────────────────────────────────────────────

const EMPTY_ADMIN_FORM = { name: '', email: '', phone: '', gender: 'MALE', password: '' };

function AdminsCard({ orgId }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_ADMIN_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/organisations/${orgId}/admins`)
      .then(r => setAdmins(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const { name, email, phone, gender, password } = form;
    if (!name.trim() || !email.trim() || !phone.trim() || !password) { setError('All fields required.'); return; }
    setSubmitting(true); setError(''); setSuccess(null);
    try {
      await api.post('/organisations/admins', { organisationId: orgId, name: name.trim(), email: email.trim(), phone: phone.trim(), gender, password });
      setSuccess({ email: email.trim(), password });
      setForm(EMPTY_ADMIN_FORM); setShowForm(false); load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create admin.');
    } finally { setSubmitting(false); }
  };

  const handleRemove = async (admin) => {
    if (!window.confirm(`Remove admin "${admin.name}"? They will no longer have admin access.`)) return;
    setRemovingId(admin.id);
    try { await api.delete(`/organisations/${orgId}/admins/${admin.id}`); load(); }
    catch (err) { alert(err?.response?.data?.message || 'Failed to remove admin.'); }
    finally { setRemovingId(null); }
  };

  return (
    <Card style={{ overflow: 'hidden', marginBottom: 24 }}>
      <CardHeader title="Admins" meta={`${admins.length} admin${admins.length !== 1 ? 's' : ''}`}>
        <Btn size="sm" onClick={() => { setShowForm(s => !s); setError(''); setSuccess(null); }}>
          <WpIcon name="plus" size={13} color="#fff" /> Add Admin
        </Btn>
      </CardHeader>

      {success && (
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--asphalt-100)' }}>
          <Alert type="success">
            <strong>Admin created.</strong>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, marginTop: 4 }}>
              Email: <strong>{success.email}</strong> &nbsp;·&nbsp; Password: <strong>{success.password}</strong>
            </div>
          </Alert>
        </div>
      )}

      {showForm && (
        <div style={{ padding: 20, borderBottom: '1px solid var(--asphalt-100)', background: 'var(--asphalt-50)' }}>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <FormField label="Full name"><input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ravi Kumar" /></FormField>
              <FormField label="Email"><input style={inputStyle} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ravi@acme.com" /></FormField>
              <FormField label="Phone"><input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" /></FormField>
              <FormField label="Gender">
                <select style={selectStyle} value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                  <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>
                </select>
              </FormField>
            </div>
            <div style={{ marginBottom: 14 }}>
              <FormField label="Password"><input style={inputStyle} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" /></FormField>
            </div>
            {error && <div style={{ marginBottom: 12 }}><Alert type="error">{error}</Alert></div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create Admin'}</Btn>
              <Btn variant="secondary" onClick={() => { setShowForm(false); setError(''); }}>Cancel</Btn>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 30, textAlign: 'center', color: 'var(--asphalt-400)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>Loading…</div>
      ) : admins.length === 0 ? (
        <div style={{ padding: 30, textAlign: 'center', color: 'var(--asphalt-400)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>No admins. Add the first one.</div>
      ) : (
        <div>
          {admins.map((a, i) => (
            <div key={a.id} style={{ padding: '14px 20px', borderBottom: i < admins.length - 1 ? '1px solid var(--asphalt-100)' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
              <WpAvatar initials={a.name.split(' ').map(n => n[0]).join('').slice(0, 2)} size={32} tone="ink" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--asphalt-900)' }}>{a.name}</div>
                <div style={{ fontSize: 12, color: 'var(--asphalt-500)', fontFamily: 'var(--font-mono)' }}>{a.email} · {a.phone}</div>
              </div>
              <Btn size="sm" variant="danger" disabled={removingId === a.id} onClick={() => handleRemove(a)}>
                {removingId === a.id ? '…' : 'Remove'}
              </Btn>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Page: Org Detail ─────────────────────────────────────────────────────────

function OrgDetailPage({ org, onBack, onRefresh }) {
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: org.name, domain: org.domain, address: org.officeAddress ? { label: org.officeAddress, lat: org.officeLat, lng: org.officeLng } : null });
  const [saving, setSaving] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/organisations/${org.id}/stats`)
      .then(r => setStats(r.data?.data || null))
      .catch(() => {});
  }, [org.id]);

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.domain.trim()) { setError('Name and domain required.'); return; }
    setSaving(true); setError('');
    try {
      await api.put(`/organisations/${org.id}`, {
        name: editForm.name.trim(),
        domain: editForm.domain.trim(),
        officeAddress: editForm.address?.label || null,
        officeLat: editForm.address?.lat || null,
        officeLng: editForm.address?.lng || null,
      });
      setEditing(false); onRefresh();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update.');
    } finally { setSaving(false); }
  };

  const handleStatus = async (action) => {
    if (!window.confirm(`${action === 'suspend' ? 'Suspend' : action === 'reactivate' ? 'Reactivate' : 'Activate'} "${org.name}"?`)) return;
    setStatusLoading(true);
    try {
      await api.post(`/organisations/${org.id}/${action}`);
      onRefresh();
    } catch (err) {
      alert(err?.response?.data?.message || 'Action failed.');
    } finally { setStatusLoading(false); }
  };

  return (
    <>
      <PageHeader
        title={org.name}
        sub={`${org.domain} · Created ${new Date(org.createdAt).toLocaleDateString()}`}
        back="All Organisations"
        onBack={onBack}
      />

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard label="Employees" value={stats.totalEmployees} sub="Active users" changeUp iconBg="var(--ink-50)" icon={<WpIcon name="users" size={16} color="var(--ink-600)" />} />
          <StatCard label="Admins" value={stats.totalAdmins} sub="Org admins" iconBg="var(--ink-50)" icon={<WpIcon name="shield" size={16} color="var(--ink-600)" />} />
          <StatCard label="Offices" value={stats.totalOffices} sub="Registered locations" iconBg="var(--ink-50)" icon={<WpIcon name="map-pin" size={16} color="var(--ink-600)" />} />
        </div>
      )}

      {/* Status + Actions */}
      <Card style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--asphalt-400)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Status</div>
            <OrgStatusPill status={org.status} />
          </div>
          <div style={{ flex: 1 }} />
          {org.status === 'PENDING' && (
            <Btn variant="warning" disabled={statusLoading} onClick={() => handleStatus('activate')}>
              {statusLoading ? '…' : 'Activate Organisation'}
            </Btn>
          )}
          {org.status === 'ACTIVE' && (
            <Btn variant="danger" disabled={statusLoading} onClick={() => handleStatus('suspend')}>
              {statusLoading ? '…' : 'Suspend Organisation'}
            </Btn>
          )}
          {org.status === 'SUSPENDED' && (
            <Btn variant="success" disabled={statusLoading} onClick={() => handleStatus('reactivate')}>
              {statusLoading ? '…' : 'Reactivate Organisation'}
            </Btn>
          )}
        </div>
        {org.status === 'SUSPENDED' && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--danger-100)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger-300)', fontSize: 12, color: 'var(--danger-800)', fontWeight: 500 }}>
            All employees of this organisation are blocked from logging in. Reactivate to restore access.
          </div>
        )}
      </Card>

      {/* Edit Info */}
      <Card style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: editing ? 20 : 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--asphalt-900)' }}>Organisation Info</div>
          {!editing && <Btn size="sm" variant="secondary" onClick={() => { setEditing(true); setError(''); }}>Edit</Btn>}
        </div>
        {editing ? (
          <form onSubmit={handleSaveInfo}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <FormField label="Name"><input style={inputStyle} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></FormField>
              <FormField label="Domain"><input style={inputStyle} value={editForm.domain} onChange={e => setEditForm(f => ({ ...f, domain: e.target.value }))} /></FormField>
            </div>
            <div style={{ marginBottom: 16 }}>
              <AddressInput label="Primary office address (legacy)" value={editForm.address} onChange={addr => setEditForm(f => ({ ...f, address: addr }))} placeholder="Search office location…" />
            </div>
            {error && <div style={{ marginBottom: 12 }}><Alert type="error">{error}</Alert></div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn>
              <Btn variant="secondary" onClick={() => { setEditing(false); setError(''); }}>Cancel</Btn>
            </div>
          </form>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16 }}>
            {[['Name', org.name], ['Domain', org.domain], ['Address', org.officeAddress || '—'], ['Created', new Date(org.createdAt).toLocaleDateString()]].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{k}</div>
                <div style={{ fontSize: 13, color: 'var(--asphalt-800)', fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Offices */}
      <SectionDivider label="Office Locations" />
      <OfficeCard orgId={org.id} />

      {/* Admins */}
      <SectionDivider label="Administrators" />
      <AdminsCard orgId={org.id} />
    </>
  );
}

// ─── Page: Create Admin (standalone) ─────────────────────────────────────────

function CreateAdminPage({ orgs }) {
  const [form, setForm] = useState({ organisationId: '', name: '', email: '', phone: '', gender: 'MALE', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const handleChange = (field, value) => { setForm(f => ({ ...f, [field]: value })); if (error) setError(''); if (success) setSuccess(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { organisationId, name, email, phone, gender, password } = form;
    if (!organisationId || !name.trim() || !email.trim() || !phone.trim() || !password) { setError('All fields are required.'); return; }
    setSubmitting(true); setError(''); setSuccess(null);
    try {
      await api.post('/organisations/admins', { organisationId: parseInt(organisationId), name: name.trim(), email: email.trim(), phone: phone.trim(), gender, password });
      setSuccess({ email: email.trim(), password });
      setForm(f => ({ ...f, name: '', email: '', phone: '', password: '' }));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create admin.');
    } finally { setSubmitting(false); }
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
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Admin created.</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>Email: <strong>{success.email}</strong> &nbsp;·&nbsp; Password: <strong>{success.password}</strong></div>
              </Alert>
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormField label="Organisation">
              <select style={selectStyle} value={form.organisationId} onChange={e => handleChange('organisationId', e.target.value)}>
                <option value="">Select organisation…</option>
                {activeOrgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FormField label="Full name"><input style={inputStyle} value={form.name} onChange={e => handleChange('name', e.target.value)} placeholder="Ravi Kumar" /></FormField>
              <FormField label="Email"><input style={inputStyle} type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="ravi@acme.com" /></FormField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FormField label="Phone"><input style={inputStyle} value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+91 98765 43210" /></FormField>
              <FormField label="Gender">
                <select style={selectStyle} value={form.gender} onChange={e => handleChange('gender', e.target.value)}>
                  <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>
                </select>
              </FormField>
            </div>
            <FormField label="Password"><input style={inputStyle} type="password" value={form.password} onChange={e => handleChange('password', e.target.value)} placeholder="Min 8 characters" /></FormField>
            {error && <Alert type="error">{error}</Alert>}
            <div style={{ paddingTop: 4 }}>
              <Btn type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create admin'}</Btn>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}

// ─── Page: All Users ──────────────────────────────────────────────────────────

function AllUsersPage({ orgs }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterOrg, setFilterOrg] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterOrg) params.set('orgId', filterOrg);
    if (filterRole) params.set('role', filterRole);
    api.get(`/platform/users?${params}`)
      .then(r => setUsers(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterOrg, filterRole]);

  useEffect(() => { load(); }, [load]);

  const handleSuspend = async (user) => {
    if (!window.confirm(`Suspend "${user.name}"? They will be blocked from logging in.`)) return;
    setActionLoading(user.id);
    try { await api.post(`/users/${user.id}/suspend`); load(); }
    catch (err) { alert(err?.response?.data?.message || 'Failed.'); }
    finally { setActionLoading(null); }
  };

  const handleActivate = async (user) => {
    setActionLoading(user.id);
    try { await api.post(`/users/${user.id}/activate`); load(); }
    catch (err) { alert(err?.response?.data?.message || 'Failed.'); }
    finally { setActionLoading(null); }
  };

  return (
    <>
      <PageHeader title="All Users" sub="Cross-organisation user management" />
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select style={{ ...selectStyle, width: 200 }} value={filterOrg} onChange={e => setFilterOrg(e.target.value)}>
          <option value="">All organisations</option>
          {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <select style={{ ...selectStyle, width: 160 }} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="PASSENGER">Passenger</option>
          <option value="DRIVER">Driver</option>
          <option value="ADMIN">Admin</option>
          <option value="BOTH">Both</option>
        </select>
      </div>
      <Card style={{ overflow: 'hidden' }}>
        <CardHeader title="Users" meta={loading ? 'Loading…' : `${users.length} result${users.length !== 1 ? 's' : ''}`} />
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading…</div>
        ) : users.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>No users found.</div>
        ) : (
          <Table
            cols={['Name', 'Email', 'Organisation', 'Role', 'Status', 'Action']}
            rows={users}
            renderRow={u => (<>
              <TD bold>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <WpAvatar initials={u.name.split(' ').map(n => n[0]).join('').slice(0, 2)} size={28} tone="asphalt" />
                  {u.name}
                </div>
              </TD>
              <TD mono muted>{u.email}</TD>
              <TD muted>{u.organisationName}</TD>
              <TD><WpPill tone={u.role === 'ADMIN' ? 'live' : 'matched'}>{u.role}</WpPill></TD>
              <TD>
                {u.isSuspended
                  ? <WpPill tone="cancelled">Suspended</WpPill>
                  : <WpPill tone="live">Active</WpPill>}
              </TD>
              <td style={{ padding: '10px 16px' }}>
                {u.isSuspended ? (
                  <Btn size="sm" variant="success" disabled={actionLoading === u.id} onClick={() => handleActivate(u)}>
                    {actionLoading === u.id ? '…' : 'Activate'}
                  </Btn>
                ) : (
                  <Btn size="sm" variant="danger" disabled={actionLoading === u.id} onClick={() => handleSuspend(u)}>
                    {actionLoading === u.id ? '…' : 'Suspend'}
                  </Btn>
                )}
              </td>
            </>)}
          />
        )}
      </Card>
    </>
  );
}

// ─── Sidebar nav config ───────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: 'Platform',
    items: [
      { id: 'overview', label: 'Overview', live: true },
      { id: 'users', label: 'All Users' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { id: 'organisations', label: 'Organisations' },
      { id: 'create-admin', label: 'Create Admin' },
    ],
  },
];

// ─── Root component ───────────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const { currentUser, logout } = useAuth();
  const [activeNav, setActiveNav] = useState('overview');
  const [orgs, setOrgs] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState(null);

  const fetchOrgs = useCallback(() => {
    setOrgsLoading(true);
    api.get('/organisations')
      .then(res => setOrgs(res.data?.data || res.data || []))
      .catch(() => setOrgs([]))
      .finally(() => setOrgsLoading(false));
  }, []);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  const handleSelectOrg = (org) => { setSelectedOrg(org); setActiveNav('org-detail'); };
  const handleBackFromOrg = () => { setSelectedOrg(null); setActiveNav('organisations'); };

  const handleOrgRefresh = () => {
    fetchOrgs();
    // Refresh the selected org data too
    if (selectedOrg) {
      api.get(`/organisations/${selectedOrg.id}`)
        .then(r => setSelectedOrg(r.data?.data || r.data))
        .catch(() => {});
    }
  };

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
      case 'organisations': return <OrganisationsPage orgs={orgs} onRefresh={fetchOrgs} onSelectOrg={handleSelectOrg} />;
      case 'org-detail':    return selectedOrg ? <OrgDetailPage org={selectedOrg} onBack={handleBackFromOrg} onRefresh={handleOrgRefresh} /> : <OrganisationsPage orgs={orgs} onRefresh={fetchOrgs} onSelectOrg={handleSelectOrg} />;
      case 'create-admin':  return <CreateAdminPage orgs={orgs} />;
      case 'users':         return <AllUsersPage orgs={orgs} />;
      default:              return <OverviewPage orgs={orgs} />;
    }
  }

  const navActiveId = activeNav === 'org-detail' ? 'organisations' : activeNav;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-sans)', background: 'var(--asphalt-50)' }}>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside style={{
        width: 240, flexShrink: 0, background: 'var(--ink-950)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, bottom: 0, left: 0, overflowY: 'auto', zIndex: 50,
      }}>
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

        <nav style={{ flex: 1, padding: 12 }}>
          {NAV_SECTIONS.map(section => (
            <div key={section.label} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-mono)', marginBottom: 6, padding: '0 8px' }}>
                {section.label}
              </div>
              {section.items.map(item => {
                const isActive = navActiveId === item.id;
                return (
                  <button key={item.id} onClick={() => { setActiveNav(item.id); if (item.id !== 'organisations') setSelectedOrg(null); }} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 10px', borderRadius: 'var(--radius-md)',
                    background: isActive ? 'var(--voltage-400)' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    color: isActive ? 'var(--ink-950)' : 'rgba(255,255,255,0.55)',
                    fontSize: 13, fontWeight: isActive ? 700 : 500,
                    fontFamily: 'var(--font-sans)', textAlign: 'left', marginBottom: 2,
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

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{
          background: '#fff', borderBottom: '1px solid var(--asphalt-200)',
          padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 16,
          position: 'sticky', top: 0, zIndex: 40,
        }}>
          <div style={{ flex: 1, maxWidth: 360, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', border: '1.5px solid var(--asphalt-200)', borderRadius: 'var(--radius-pill)', background: 'var(--asphalt-50)' }}>
            <WpIcon name="search" size={16} color="var(--asphalt-400)" />
            <input type="text" placeholder="Search organisations, users…" style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--asphalt-800)' }} />
          </div>
          <div style={{ flex: 1 }} />
          <WpAvatar initials={(currentUser?.name || 'SA').split(' ').map(n => n[0]).join('').slice(0, 2)} size={36} tone="ink" />
        </div>

        <div style={{ padding: 28, flex: 1 }}>
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
