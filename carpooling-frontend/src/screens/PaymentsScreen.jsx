import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WpAppBar from '../components/WpAppBar';
import WpPill from '../components/WpPill';
import WpIcon from '../components/WpIcon';
import useIsDesktop from '../hooks/useIsDesktop';
import { getMyTransactions } from '../api/payments';

const TONE = { SUCCESS: 'completed', INITIATED: 'warn', FAILED: 'cancelled', REFUNDED: 'cancelled' };
const LABEL = { SUCCESS: 'PAID', INITIATED: 'PENDING', FAILED: 'FAILED', REFUNDED: 'REFUNDED' };

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function routeLabel(txn) {
  if (txn.pickupLabel || txn.dropoffLabel) {
    return `${txn.pickupLabel || '?'} → ${txn.dropoffLabel || '?'}`;
  }
  return `Ride #${txn.rideId}`;
}

function TxnCard({ txn }) {
  const status = txn.status || 'INITIATED';
  const displayStatus = LABEL[status] || status;
  const tone = TONE[status] || 'warn';

  return (
    <div style={{
      background: '#fff', borderRadius: 'var(--radius-lg)', padding: '14px 16px',
      boxShadow: 'var(--shadow-1)', border: '1px solid var(--asphalt-100)',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--radius-md)', flexShrink: 0,
        background: status === 'SUCCESS' ? 'var(--success-100)' : status === 'REFUNDED' ? 'var(--asphalt-100)' : 'var(--warning-100)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <WpIcon
          name={status === 'SUCCESS' ? 'check' : status === 'REFUNDED' ? 'arrow-right' : 'clock'}
          size={18}
          color={status === 'SUCCESS' ? 'var(--success-700)' : status === 'REFUNDED' ? 'var(--asphalt-500)' : 'var(--warning-700)'}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--asphalt-900)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {routeLabel(txn)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>
          {txn.driverName ? `${txn.driverName} · ` : ''}
          {txn.paymentMethod ? `${txn.paymentMethod} · ` : ''}
          {formatDate(txn.departureTime || txn.createdAt)}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--asphalt-900)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
          ₹{txn.amount != null ? Number(txn.amount).toLocaleString('en-IN') : '—'}
        </div>
        <WpPill tone={tone}>{displayStatus}</WpPill>
      </div>
    </div>
  );
}

export default function PaymentsScreen() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [filter, setFilter] = useState('ALL');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getMyTransactions()
      .then(res => {
        const data = res.data?.data ?? res.data ?? [];
        setTransactions(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setError('Could not load transactions.');
        setTransactions([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filters = ['ALL', 'SUCCESS', 'INITIATED', 'REFUNDED'];
  const shown = filter === 'ALL' ? transactions : transactions.filter(t => t.status === filter);

  const paid = transactions.filter(t => t.status === 'SUCCESS');
  const totalPaid = paid.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const pending = transactions.filter(t => t.status === 'INITIATED').length;

  const byMethod = paid.reduce((acc, t) => {
    const method = t.paymentMethod || 'Other';
    acc[method] = (acc[method] || 0) + (Number(t.amount) || 0);
    return acc;
  }, {});

  const driverRides = transactions.reduce((acc, t) => {
    if (t.driverName) acc[t.driverName] = (acc[t.driverName] || 0) + 1;
    return acc;
  }, {});
  const topDriver = Object.entries(driverRides).sort((a, b) => b[1] - a[1])[0];

  const FilterBar = () => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {filters.map(f => (
        <button key={f} onClick={() => setFilter(f)} style={{
          padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
          fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)',
          background: filter === f ? 'var(--ink-950)' : 'var(--asphalt-100)',
          color: filter === f ? '#fff' : 'var(--asphalt-600)',
        }}>{f === 'SUCCESS' ? 'PAID' : f}</button>
      ))}
    </div>
  );

  const SummaryRow = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
      {[
        { label: 'Total spent', value: `₹${totalPaid.toLocaleString('en-IN')}`, icon: 'wallet', bg: 'var(--success-100)', color: 'var(--success-700)' },
        { label: 'Pending', value: pending, icon: 'clock', bg: 'var(--warning-100)', color: 'var(--warning-700)' },
        { label: 'Rides paid', value: paid.length, icon: 'car', bg: 'var(--ink-50)', color: 'var(--ink-600)' },
      ].map(s => (
        <div key={s.label} style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '14px 16px', boxShadow: 'var(--shadow-1)', border: '1px solid var(--asphalt-100)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 'var(--radius-sm)', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WpIcon name={s.icon} size={14} color={s.color} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--asphalt-500)', fontFamily: 'var(--font-sans)' }}>{s.label}</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--asphalt-900)', fontFamily: 'var(--font-sans)' }}>{s.value}</div>
        </div>
      ))}
    </div>
  );

  const TxnList = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 76, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(90deg, var(--asphalt-100) 25%, var(--asphalt-50) 50%, var(--asphalt-100) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
          ))}
        </div>
      );
    }
    if (error) {
      return <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--danger-600)', fontSize: 14 }}>{error}</div>;
    }
    if (shown.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 20px', border: '1.5px dashed var(--asphalt-200)', borderRadius: 'var(--radius-lg)', background: '#fff' }}>
          <WpIcon name="wallet" size={36} color="var(--asphalt-300)" />
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--asphalt-600)', marginTop: 12 }}>No transactions yet</p>
          <p style={{ fontSize: 13, color: 'var(--asphalt-400)', marginTop: 4 }}>Paid rides will appear here</p>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {shown.map(t => <TxnCard key={t.id} txn={t} />)}
      </div>
    );
  };

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)' }}>
        <div style={{ padding: '32px 40px 0' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--asphalt-900)', letterSpacing: '-0.02em' }}>Payments</h1>
          <p style={{ fontSize: 13, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>Fare history and pending payments</p>
        </div>
        <div style={{ padding: '20px 40px 0' }}>
          <SummaryRow />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, padding: '20px 40px 40px', alignItems: 'start' }}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', padding: 24, boxShadow: 'var(--shadow-2)', border: '1px solid var(--asphalt-100)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--asphalt-900)' }}>Transaction history</h2>
              <FilterBar />
            </div>
            <TxnList />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.keys(byMethod).length > 0 && (
              <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', padding: 24, boxShadow: 'var(--shadow-2)', border: '1px solid var(--asphalt-100)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--asphalt-400)', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>By payment method</div>
                {Object.entries(byMethod).map(([method, amount]) => (
                  <div key={method} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--ink-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <WpIcon name="wallet" size={14} color="var(--ink-600)" />
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--asphalt-600)', fontFamily: 'var(--font-sans)' }}>{method}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--asphalt-900)', fontFamily: 'var(--font-mono)' }}>₹{amount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            )}
            {topDriver && (
              <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', padding: 24, boxShadow: 'var(--shadow-2)', border: '1px solid var(--asphalt-100)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--asphalt-400)', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>Most frequent driver</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--ink-950)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--voltage-400)', fontFamily: 'var(--font-mono)' }}>
                      {topDriver[0].split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--asphalt-900)' }}>{topDriver[0]}</div>
                    <div style={{ fontSize: 11, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>{topDriver[1]} rides together</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', paddingBottom: 40 }}>
      <WpAppBar title="Payments" onBack={() => navigate(-1)} dark />
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SummaryRow />
        <FilterBar />
        <TxnList />
      </div>
    </div>
  );
}
