import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WpAppBar from '../components/WpAppBar';
import WpPill from '../components/WpPill';
import WpIcon from '../components/WpIcon';
import useIsDesktop from '../hooks/useIsDesktop';

const MOCK_PAYMENTS = [
  { id: 'TXN001', route: 'Home → Office', driver: 'Priya Sharma', amount: '₹360', date: 'May 3, 2026', status: 'PAID',    method: 'UPI'    },
  { id: 'TXN002', route: 'Office → Home', driver: 'Kiran Das',    amount: '₹315', date: 'May 2, 2026', status: 'PAID',    method: 'Card'   },
  { id: 'TXN003', route: 'Home → Office', driver: 'Sneha Patel',  amount: '₹190', date: 'May 2, 2026', status: 'PENDING', method: 'UPI'    },
  { id: 'TXN004', route: 'Home → Office', driver: 'Vijay Kumar',  amount: '₹560', date: 'May 1, 2026', status: 'PAID',    method: 'Wallet' },
  { id: 'TXN005', route: 'Office → Home', driver: 'Arjun Mehta',  amount: '₹360', date: 'Apr 30, 2026', status: 'REFUNDED', method: 'UPI'  },
  { id: 'TXN006', route: 'Home → Office', driver: 'Priya Sharma', amount: '₹95',  date: 'Apr 29, 2026', status: 'PAID',    method: 'UPI'  },
];

const TONE = { PAID: 'completed', PENDING: 'warn', REFUNDED: 'cancelled' };

function TxnCard({ txn }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 'var(--radius-lg)', padding: '14px 16px',
      boxShadow: 'var(--shadow-1)', border: '1px solid var(--asphalt-100)',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--radius-md)', flexShrink: 0,
        background: txn.status === 'PAID' ? 'var(--success-100)' : txn.status === 'REFUNDED' ? 'var(--asphalt-100)' : 'var(--warning-100)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <WpIcon
          name={txn.status === 'PAID' ? 'check' : txn.status === 'REFUNDED' ? 'arrow-right' : 'clock'}
          size={18}
          color={txn.status === 'PAID' ? 'var(--success-700)' : txn.status === 'REFUNDED' ? 'var(--asphalt-500)' : 'var(--warning-700)'}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--asphalt-900)', marginBottom: 2 }}>
          {txn.route}
        </div>
        <div style={{ fontSize: 11, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>
          {txn.driver} · {txn.method} · {txn.date}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--asphalt-900)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
          {txn.amount}
        </div>
        <WpPill tone={TONE[txn.status]}>{txn.status}</WpPill>
      </div>
    </div>
  );
}

export default function PaymentsScreen() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [filter, setFilter] = useState('ALL');

  const filters = ['ALL', 'PAID', 'PENDING', 'REFUNDED'];
  const shown = filter === 'ALL' ? MOCK_PAYMENTS : MOCK_PAYMENTS.filter(t => t.status === filter);
  const totalPaid = MOCK_PAYMENTS.filter(t => t.status === 'PAID').reduce((s, t) => s + parseInt(t.amount.replace(/[₹,]/g, '')), 0);
  const pending = MOCK_PAYMENTS.filter(t => t.status === 'PENDING').length;

  const FilterBar = () => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {filters.map(f => (
        <button key={f} onClick={() => setFilter(f)} style={{
          padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
          fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)',
          background: filter === f ? 'var(--ink-950)' : 'var(--asphalt-100)',
          color: filter === f ? '#fff' : 'var(--asphalt-600)',
        }}>{f}</button>
      ))}
    </div>
  );

  const SummaryRow = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
      {[
        { label: 'Total spent', value: `₹${totalPaid.toLocaleString('en-IN')}`, icon: 'wallet', bg: 'var(--success-100)', color: 'var(--success-700)' },
        { label: 'Pending', value: pending, icon: 'clock', bg: 'var(--warning-100)', color: 'var(--warning-700)' },
        { label: 'Rides paid', value: MOCK_PAYMENTS.filter(t => t.status === 'PAID').length, icon: 'car', bg: 'var(--ink-50)', color: 'var(--ink-600)' },
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

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)' }}>
        <div style={{ padding: '32px 40px 0' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--asphalt-900)', letterSpacing: '-0.02em' }}>Payments</h1>
          <p style={{ fontSize: 13, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>Fare history and pending payments</p>
        </div>
        <div style={{ padding: '24px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SummaryRow />
          <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', padding: 24, boxShadow: 'var(--shadow-2)', border: '1px solid var(--asphalt-100)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--asphalt-900)' }}>Transaction history</h2>
              <FilterBar />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {shown.map(t => <TxnCard key={t.id} txn={t} />)}
            </div>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shown.length === 0
            ? <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--asphalt-400)', fontSize: 14 }}>No transactions</div>
            : shown.map(t => <TxnCard key={t.id} txn={t} />)
          }
        </div>
      </div>
    </div>
  );
}
