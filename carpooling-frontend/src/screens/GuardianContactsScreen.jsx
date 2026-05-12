import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WpAppBar from '../components/WpAppBar';
import WpButton from '../components/WpButton';
import WpIcon from '../components/WpIcon';
import useIsDesktop from '../hooks/useIsDesktop';
import { getMyGuardians, addGuardian, deleteGuardian } from '../api/guardians';

const RELATIONS = ['Parent', 'Spouse', 'Sibling', 'Friend', 'Colleague', 'Other'];

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
  border: '1.5px solid var(--asphalt-200)', fontSize: 14, fontFamily: 'var(--font-sans)',
  color: 'var(--asphalt-900)', background: '#fff', outline: 'none', boxSizing: 'border-box',
};

function AddContactForm({ onSave, onCancel, saving }) {
  const [form, setForm] = useState({ name: '', phone: '', relation: 'Parent', email: '' });
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const valid = form.name.trim() && form.phone.trim() && form.relation;

  return (
    <div style={{ background: 'var(--asphalt-50)', borderRadius: 'var(--radius-lg)', padding: 20, border: '1px solid var(--asphalt-200)', marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--asphalt-700)', marginBottom: 16 }}>New emergency contact</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input style={inputStyle} placeholder="Full name *" value={form.name} onChange={e => set('name')(e.target.value)} />
        <input style={inputStyle} placeholder="Phone *" type="tel" value={form.phone} onChange={e => set('phone')(e.target.value)} />
        <input style={inputStyle} placeholder="Email (for SOS alerts)" type="email" value={form.email} onChange={e => set('email')(e.target.value)} />
        <select
          value={form.relation}
          onChange={e => set('relation')(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          {RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <WpButton kind="secondary" size="sm" onClick={onCancel} disabled={saving}>Cancel</WpButton>
        <WpButton kind="accent" size="sm" onClick={() => valid && onSave(form)} disabled={!valid || saving}>
          {saving ? 'Saving…' : 'Add contact'}
        </WpButton>
      </div>
    </div>
  );
}

function ContactCard({ contact, onDelete, deleting }) {
  return (
    <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '16px', boxShadow: 'var(--shadow-1)', border: '1px solid var(--asphalt-100)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--asphalt-900)', marginBottom: 4 }}>{contact.name}</div>
        <div style={{ fontSize: 12, color: 'var(--asphalt-500)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
          {contact.relation} · {contact.phone}
        </div>
        {contact.email && (
          <div style={{ fontSize: 12, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>
            {contact.email}
          </div>
        )}
      </div>
      <button
        onClick={() => onDelete(contact.id)}
        disabled={deleting === contact.id}
        style={{ background: 'none', border: 'none', cursor: deleting === contact.id ? 'wait' : 'pointer', padding: 4, color: 'var(--danger-500)', opacity: deleting === contact.id ? 0.5 : 1 }}
      >
        <WpIcon name="x" size={16} color="var(--danger-500)" />
      </button>
    </div>
  );
}

export default function GuardianContactsScreen() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getMyGuardians()
      .then(r => setContacts(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (form) => {
    setSaving(true);
    setError('');
    try {
      await addGuardian(form);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to add contact.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this emergency contact?')) return;
    setDeleting(id);
    try {
      await deleteGuardian(id);
      setContacts(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to remove contact.');
    } finally {
      setDeleting(null);
    }
  };

  const Content = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: 'var(--asphalt-500)', margin: 0 }}>
          These contacts receive SOS alerts when you trigger an emergency.
        </p>
        {!showForm && (
          <WpButton kind="accent" size="sm" onClick={() => setShowForm(true)}>
            <WpIcon name="plus" size={14} color="var(--ink-950)" /> Add
          </WpButton>
        )}
      </div>

      {showForm && (
        <AddContactForm onSave={handleAdd} onCancel={() => setShowForm(false)} saving={saving} />
      )}

      {error && (
        <div style={{ fontSize: 12, color: 'var(--danger-600)', padding: '8px 12px', background: 'var(--danger-50)', borderRadius: 8, border: '1px solid var(--danger-200)', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2].map(i => (
            <div key={i} style={{ height: 80, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(90deg, var(--asphalt-100) 25%, var(--asphalt-50) 50%, var(--asphalt-100) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
          ))}
        </div>
      ) : contacts.length === 0 && !showForm ? (
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '40px 20px', textAlign: 'center', border: '1.5px dashed var(--asphalt-200)' }}>
          <WpIcon name="user" size={36} color="var(--asphalt-300)" />
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--asphalt-600)', marginTop: 12 }}>No emergency contacts</p>
          <p style={{ fontSize: 13, color: 'var(--asphalt-400)', marginTop: 4 }}>Add contacts to receive SOS alerts</p>
          <div style={{ marginTop: 16 }}>
            <WpButton kind="accent" size="md" onClick={() => setShowForm(true)}>Add contact</WpButton>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {contacts.map(c => (
            <ContactCard key={c.id} contact={c} onDelete={handleDelete} deleting={deleting} />
          ))}
        </div>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)' }}>
        <div style={{ padding: '32px 40px 0' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--asphalt-900)', letterSpacing: '-0.02em' }}>Emergency contacts</h1>
          <p style={{ fontSize: 13, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>Manage who gets notified in an SOS situation</p>
        </div>
        <div style={{ maxWidth: 640, padding: '24px 40px 40px' }}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', padding: 28, boxShadow: 'var(--shadow-2)', border: '1px solid var(--asphalt-100)' }}>
            <Content />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', paddingBottom: 40 }}>
      <WpAppBar title="Emergency contacts" onBack={() => navigate(-1)} dark />
      <div style={{ padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', padding: 20, boxShadow: 'var(--shadow-1)', border: '1px solid var(--asphalt-100)' }}>
          <Content />
        </div>
      </div>
    </div>
  );
}
