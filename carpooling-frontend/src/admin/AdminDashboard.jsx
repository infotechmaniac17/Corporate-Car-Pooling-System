import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import WpIcon from '../components/WpIcon';
import WpAvatar from '../components/WpAvatar';
import WpPill from '../components/WpPill';
import api from '../api/client';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_RIDES = [
  { id: 'R001', origin: 'Koramangala', dest: 'Whitefield',    driver: 'Arjun Mehta',  riders: 3, capacity: 4, status: 'LIVE',      eta: '9:12 AM',  fare: '₹360', dept: '8:45 AM' },
  { id: 'R002', origin: 'HSR Layout',  dest: 'Electronic City',driver: 'Priya Sharma', riders: 2, capacity: 3, status: 'LIVE',      eta: '9:28 AM',  fare: '₹190', dept: '8:55 AM' },
  { id: 'R003', origin: 'Indiranagar', dest: 'Marathahalli',  driver: 'Ravi Kumar',   riders: 4, capacity: 4, status: 'MATCHED',   eta: '9:45 AM',  fare: '₹560', dept: '9:10 AM' },
  { id: 'R004', origin: 'Jayanagar',   dest: 'MG Road',       driver: 'Sneha Patel',  riders: 1, capacity: 4, status: 'PENDING',   eta: '10:00 AM', fare: '₹95',  dept: '9:30 AM' },
  { id: 'R005', origin: 'BTM Layout',  dest: 'Outer Ring Rd', driver: 'Kiran Das',    riders: 3, capacity: 4, status: 'LIVE',      eta: '9:35 AM',  fare: '₹315', dept: '9:00 AM' },
  { id: 'R006', origin: 'Bellandur',   dest: 'Hebbal',        driver: 'Amit Rao',     riders: 2, capacity: 3, status: 'COMPLETED', eta: '—',        fare: '₹420', dept: '7:30 AM' },
  { id: 'R007', origin: 'Marathahalli',dest: 'Silk Board',    driver: 'Deepa V.',     riders: 4, capacity: 4, status: 'COMPLETED', eta: '—',        fare: '₹280', dept: '7:45 AM' },
];

const MOCK_EMPLOYEES = [
  { id: 'E001', name: 'Aarav Joshi',    email: 'aarav@acme.com',    role: 'PASSENGER', org: 'Acme Corp',    rides: 48, rating: 4.7 },
  { id: 'E002', name: 'Priya Sharma',   email: 'priya@acme.com',    role: 'DRIVER',    org: 'Acme Corp',    rides: 132, rating: 4.9 },
  { id: 'E003', name: 'Meera Nair',     email: 'meera@zomato.com',  role: 'PASSENGER', org: 'Zomato',       rides: 24, rating: 4.8 },
  { id: 'E004', name: 'Kiran Das',      email: 'kiran@acme.com',    role: 'DRIVER',    org: 'Acme Corp',    rides: 89, rating: 4.6 },
  { id: 'E005', name: 'Sneha Patel',    email: 'sneha@zomato.com',  role: 'DRIVER',    org: 'Zomato',       rides: 67, rating: 4.8 },
  { id: 'E006', name: 'Rahul Gupta',    email: 'rahul@acme.com',    role: 'PASSENGER', org: 'Acme Corp',    rides: 35, rating: 4.5 },
  { id: 'E007', name: 'Anita Mehta',    email: 'anita@zomato.com',  role: 'PASSENGER', org: 'Zomato',       rides: 19, rating: 4.9 },
  { id: 'E008', name: 'Vijay Kumar',    email: 'vijay@acme.com',    role: 'DRIVER',    org: 'Acme Corp',    rides: 104, rating: 4.7 },
];

const MOCK_VEHICLES = [
  { id: 'V001', driver: 'Priya Sharma',  plate: 'KA 01 MH 4521', type: 'SUV',    model: 'Toyota Innova',  seats: 6, status: 'ACTIVE',    fuel: 'Petrol' },
  { id: 'V002', driver: 'Kiran Das',     plate: 'KA 03 AB 1234', type: 'Sedan',  model: 'Honda City',     seats: 4, status: 'ACTIVE',    fuel: 'CNG'    },
  { id: 'V003', driver: 'Sneha Patel',   plate: 'MH 12 CD 5678', type: 'Hatch',  model: 'Maruti Swift',   seats: 4, status: 'ACTIVE',    fuel: 'Petrol' },
  { id: 'V004', driver: 'Vijay Kumar',   plate: 'KA 05 EF 9012', type: 'SUV',    model: 'Mahindra XUV',   seats: 6, status: 'INACTIVE',  fuel: 'Diesel' },
  { id: 'V005', driver: 'Arjun Mehta',   plate: 'KA 02 GH 3456', type: 'Sedan',  model: 'Hyundai Verna',  seats: 4, status: 'ACTIVE',    fuel: 'Petrol' },
];

const MOCK_ROUTES = [
  { id: 'RT001', origin: 'Koramangala', dest: 'Whitefield',     driver: 'Arjun Mehta',  dept: '8:45 AM', dist: '18 km', riders: 28, status: 'ACTIVE'   },
  { id: 'RT002', origin: 'HSR Layout',  dest: 'Electronic City', driver: 'Priya Sharma', dept: '8:55 AM', dist: '12 km', riders: 15, status: 'ACTIVE'   },
  { id: 'RT003', origin: 'Indiranagar', dest: 'Marathahalli',   driver: 'Ravi Kumar',   dept: '9:10 AM', dist: '14 km', riders: 22, status: 'ACTIVE'   },
  { id: 'RT004', origin: 'Jayanagar',   dest: 'MG Road',        driver: 'Sneha Patel',  dept: '9:30 AM', dist: '8 km',  riders: 10, status: 'INACTIVE' },
  { id: 'RT005', origin: 'BTM Layout',  dest: 'Outer Ring Rd',  driver: 'Kiran Das',    dept: '9:00 AM', dist: '11 km', riders: 18, status: 'ACTIVE'   },
];

const MOCK_RATINGS = [
  { driver: 'Priya Sharma',  initials: 'PS', avg: 4.9, total: 132, five: 89, four: 35, three: 6, two: 2, one: 0 },
  { driver: 'Vijay Kumar',   initials: 'VK', avg: 4.7, total: 104, five: 71, four: 25, three: 7, two: 1, one: 0 },
  { driver: 'Kiran Das',     initials: 'KD', avg: 4.6, total: 89,  five: 55, four: 26, three: 5, two: 3, one: 0 },
  { driver: 'Sneha Patel',   initials: 'SP', avg: 4.8, total: 67,  five: 48, four: 14, three: 4, two: 1, one: 0 },
  { driver: 'Arjun Mehta',   initials: 'AM', avg: 4.5, total: 58,  five: 32, four: 18, three: 6, two: 2, one: 0 },
];

const MOCK_TRANSACTIONS = [
  { id: 'TXN001', rider: 'Aarav Joshi',   driver: 'Priya Sharma',  route: 'Koramangala → Whitefield',  amount: '₹360', date: 'May 3, 2026', status: 'PAID',    method: 'UPI'   },
  { id: 'TXN002', rider: 'Meera Nair',    driver: 'Kiran Das',     route: 'BTM Layout → Outer Ring Rd', amount: '₹315', date: 'May 3, 2026', status: 'PAID',    method: 'Card'  },
  { id: 'TXN003', rider: 'Rahul Gupta',   driver: 'Sneha Patel',   route: 'HSR Layout → Electronic City',amount:'₹190', date: 'May 3, 2026', status: 'PENDING', method: 'UPI'   },
  { id: 'TXN004', rider: 'Anita Mehta',   driver: 'Vijay Kumar',   route: 'Indiranagar → Marathahalli', amount: '₹560', date: 'May 2, 2026', status: 'PAID',    method: 'Wallet'},
  { id: 'TXN005', rider: 'Vijay Kumar',   driver: 'Arjun Mehta',   route: 'Koramangala → Whitefield',  amount: '₹360', date: 'May 2, 2026', status: 'REFUNDED', method: 'UPI'  },
  { id: 'TXN006', rider: 'Aarav Joshi',   driver: 'Priya Sharma',  route: 'Jayanagar → MG Road',       amount: '₹95',  date: 'May 1, 2026', status: 'PAID',    method: 'UPI'   },
];

const MOCK_REIMBURSEMENTS = [
  { id: 'RMB001', employee: 'Aarav Joshi',   org: 'Acme Corp',  rides: 22, amount: '₹3,960', period: 'Apr 2026', status: 'APPROVED' },
  { id: 'RMB002', employee: 'Meera Nair',    org: 'Zomato',     rides: 12, amount: '₹1,800', period: 'Apr 2026', status: 'PENDING'  },
  { id: 'RMB003', employee: 'Rahul Gupta',   org: 'Acme Corp',  rides: 18, amount: '₹2,700', period: 'Apr 2026', status: 'APPROVED' },
  { id: 'RMB004', employee: 'Anita Mehta',   org: 'Zomato',     rides: 9,  amount: '₹1,350', period: 'Apr 2026', status: 'REJECTED' },
  { id: 'RMB005', employee: 'Vijay Kumar',   org: 'Acme Corp',  rides: 30, amount: '₹4,500', period: 'Apr 2026', status: 'PENDING'  },
];

const MOCK_SOS = [
  { id: 'SOS001', rider: 'Meera Nair',    driver: 'Arjun Mehta',  route: 'Koramangala → Whitefield',    time: '2 min ago',  status: 'ACTIVE',   contacts: 3 },
  { id: 'SOS002', rider: 'Rahul Gupta',   driver: 'Sneha Patel',  route: 'HSR Layout → Electronic City', time: '38 min ago', status: 'RESOLVED', contacts: 2 },
];

const MOCK_BACKUP = [
  { id: 'BK001', route: 'R-018 · BTM → Outer Ring', riders: 3, time: '9:00 AM', available: ['Vijay K.', 'Amit R.', 'Deepa V.'], status: 'PENDING' },
  { id: 'BK002', route: 'R-024 · Jayanagar → MG Rd', riders: 2, time: '9:30 AM', available: ['Kiran D.', 'Sneha P.'],            status: 'ASSIGNED' },
];

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun','Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const RIDE_DATA = [95,112,108,120,128,45,22,98,115,124,118,128,48,20];
const CO2_DATA  = [228,269,259,288,307,108,53,235,276,298,283,307,115,48];

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
              style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--asphalt-100)' : 'none', cursor: 'pointer' }}
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

function MiniRoute({ origin, dest }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--asphalt-700)' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ink-600)', flexShrink: 0 }} />
      <span style={{ fontWeight: 600, color: 'var(--asphalt-900)' }}>{origin}</span>
      <span style={{ flex: '0 0 20px', height: 0, borderTop: '1.5px dashed var(--asphalt-300)' }} />
      <span style={{ fontWeight: 600, color: 'var(--asphalt-900)' }}>{dest}</span>
      <span style={{ width: 7, height: 7, borderRadius: 2, background: 'var(--voltage-400)', border: '1.5px solid var(--ink-950)', flexShrink: 0 }} />
    </div>
  );
}

function Stars({ rating }) {
  const full = Math.floor(rating);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < full ? '#f5a524' : 'var(--asphalt-300)', fontSize: 13 }}>★</span>
      ))}
      <span style={{ marginLeft: 4, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--asphalt-700)', fontWeight: 600 }}>{rating}</span>
    </span>
  );
}

function StatCard({ label, value, change, changeUp, danger, icon, iconBg }) {
  return (
    <Card style={{ padding: 20, ...(danger ? { borderColor: 'var(--danger-500)' } : {}) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--asphalt-500)' }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: iconBg || 'var(--ink-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: danger ? 'var(--danger-600)' : 'var(--asphalt-900)', marginBottom: 6 }}>{value}</div>
      {change && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: changeUp ? 'var(--success-700)' : 'var(--danger-600)', fontFamily: 'var(--font-mono)' }}>
          <WpIcon name="trending-up" size={14} color={changeUp ? 'var(--success-700)' : 'var(--danger-600)'} />
          {change}
        </div>
      )}
    </Card>
  );
}

function BarChart({ data, showLine }) {
  const max = Math.max(...data, ...(showLine ? CO2_DATA : []));
  const chartH = 160, barW = 16, gap = 8;
  const totalW = data.length * (barW + gap);
  const linePoints = CO2_DATA.map((v, i) => `${i * (barW + gap) + barW / 2},${chartH - (v / max) * chartH}`).join(' ');
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={totalW} height={chartH + 24} style={{ display: 'block' }}>
        {data.map((v, i) => {
          const h = (v / max) * chartH;
          return (
            <g key={i}>
              <rect x={i * (barW + gap)} y={chartH - h} width={barW} height={h} rx="4" fill="var(--ink-600)" opacity="0.85" />
              <text x={i * (barW + gap) + barW / 2} y={chartH + 16} textAnchor="middle" fontSize="9" fill="var(--asphalt-400)" fontFamily="var(--font-mono)">{DAYS[i]}</text>
            </g>
          );
        })}
        {showLine && <polyline points={linePoints} fill="none" stroke="var(--voltage-400)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
      </svg>
    </div>
  );
}

function RatingBar({ label, count, total }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--asphalt-500)', width: 12, textAlign: 'right' }}>{label}</span>
      <span style={{ color: '#f5a524', fontSize: 11 }}>★</span>
      <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--asphalt-100)', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 999, background: 'var(--ink-600)', width: `${pct}%`, transition: 'width .4s' }} />
      </div>
      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--asphalt-400)', width: 24, textAlign: 'right' }}>{count}</span>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    LIVE: 'live', ACTIVE: 'live',
    MATCHED: 'matched', APPROVED: 'completed', PAID: 'completed', RESOLVED: 'completed',
    PENDING: 'warn', ASSIGNED: 'warn',
    COMPLETED: 'completed',
    INACTIVE: 'cancelled', REJECTED: 'sos',
    REFUNDED: 'cancelled',
  };
  return <WpPill tone={map[status] || 'matched'}>{status}</WpPill>;
}

// ─── Page Views ───────────────────────────────────────────────────────────────

function OverviewPage({ today }) {
  return (
    <>
      <PageHeader title="Today's overview" sub={today} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Active rides"   value="128"    change="↑12% from yesterday" changeUp iconBg="var(--ink-50)"      icon={<WpIcon name="car"    size={16} color="var(--ink-600)"     />} />
        <StatCard label="Pool fill rate" value="76%"    change="↑4pts from last week" changeUp iconBg="var(--voltage-100)" icon={<WpIcon name="users"  size={16} color="var(--voltage-700)" />} />
        <StatCard label="CO₂ saved"      value="412 kg" change="↑18% this month"      changeUp iconBg="var(--success-100)" icon={<WpIcon name="leaf"   size={16} color="var(--success-700)" />} />
        <StatCard label="SOS incidents"  value="2"      change="Needs attention"                danger iconBg="var(--danger-100)"  icon={<WpIcon name="shield" size={16} color="var(--danger-600)"  />} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, marginBottom: 24 }}>
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--asphalt-900)' }}>Ride volume</h3>
              <p style={{ fontSize: 11, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>Last 14 days</p>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--ink-600)' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--ink-600)', display: 'inline-block' }} />Rides</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--voltage-600)' }}><span style={{ width: 10, height: 2, background: 'var(--voltage-400)', display: 'inline-block' }} />CO₂ saved</span>
            </div>
          </div>
          <BarChart data={RIDE_DATA} showLine />
        </Card>
        <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--asphalt-900)' }}>Safety alerts</h3>
          <div style={{ padding: 14, borderRadius: 'var(--radius-md)', border: '2px solid var(--danger-500)', background: 'var(--danger-100)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <WpPill tone="sos">SOS Active</WpPill>
              <span style={{ fontSize: 10, color: 'var(--danger-700)', fontFamily: 'var(--font-mono)' }}>2 min ago</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger-800)' }}>Meera Nair · Route R-042</div>
            <div style={{ fontSize: 11, color: 'var(--danger-700)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>Koramangala → Whitefield</div>
            <button style={{ marginTop: 10, width: '100%', padding: 8, background: 'var(--danger-600)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Respond now</button>
          </div>
          <div style={{ padding: 14, borderRadius: 'var(--radius-md)', border: '1.5px solid var(--warning-500)', background: 'var(--warning-100)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <WpPill tone="warn">Backup Needed</WpPill>
              <span style={{ fontSize: 10, color: 'var(--warning-700)', fontFamily: 'var(--font-mono)' }}>15 min ago</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Route R-018 uncovered</div>
            <div style={{ fontSize: 11, color: 'var(--warning-700)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>3 riders need a driver</div>
          </div>
        </Card>
      </div>
      <Card style={{ overflow: 'hidden' }}>
        <CardHeader title="Active rides" meta={`${MOCK_RIDES.filter(r => r.status !== 'COMPLETED').length} IN PROGRESS`} />
        <Table
          cols={['Route', 'Driver', 'Riders', 'Status', 'Departs', 'ETA', 'Fare']}
          rows={MOCK_RIDES}
          renderRow={r => (<>
            <TD><MiniRoute origin={r.origin} dest={r.dest} /></TD>
            <TD>{r.driver}</TD>
            <TD mono>{r.riders} / {r.capacity}</TD>
            <TD><StatusPill status={r.status} /></TD>
            <TD mono muted>{r.dept}</TD>
            <TD mono muted>{r.eta}</TD>
            <TD mono bold>{r.fare}</TD>
          </>)}
        />
      </Card>
    </>
  );
}

function ActiveRidesPage() {
  const [filter, setFilter] = useState('ALL');
  const statuses = ['ALL', 'LIVE', 'MATCHED', 'PENDING', 'COMPLETED'];
  const filtered = filter === 'ALL' ? MOCK_RIDES : MOCK_RIDES.filter(r => r.status === filter);
  return (
    <>
      <PageHeader title="Active rides" sub={`${MOCK_RIDES.length} rides today · updating live`} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Live now"    value="3"   change="En route"              changeUp iconBg="var(--voltage-100)" icon={<WpIcon name="activity" size={16} color="var(--voltage-700)" />} />
        <StatCard label="Matched"     value="1"   change="Starting soon"         changeUp iconBg="var(--ink-50)"      icon={<WpIcon name="users"    size={16} color="var(--ink-600)"     />} />
        <StatCard label="Completed"   value="2"   change="Today so far"          changeUp iconBg="var(--success-100)" icon={<WpIcon name="check"    size={16} color="var(--success-700)" />} />
        <StatCard label="Pending"     value="1"   change="Awaiting driver"               iconBg="var(--warning-100)" icon={<WpIcon name="clock"    size={16} color="var(--warning-700)" />} />
      </div>
      <Card style={{ overflow: 'hidden' }}>
        <CardHeader title="All rides" meta={`${filtered.length} showing`}>
          <div style={{ display: 'flex', gap: 6 }}>
            {statuses.map(s => (
              <button key={s} onClick={() => setFilter(s)} style={{
                padding: '5px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
                font: '600 11px var(--font-mono)', letterSpacing: '.04em',
                background: filter === s ? 'var(--ink-950)' : 'var(--asphalt-100)',
                color: filter === s ? '#fff' : 'var(--asphalt-600)',
              }}>{s}</button>
            ))}
          </div>
        </CardHeader>
        <Table
          cols={['Route', 'Driver', 'Riders', 'Status', 'Departs', 'ETA', 'Fare']}
          rows={filtered}
          renderRow={r => (<>
            <TD><MiniRoute origin={r.origin} dest={r.dest} /></TD>
            <TD>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <WpAvatar initials={r.driver.split(' ').map(n=>n[0]).join('')} size={28} tone="ink" />
                {r.driver}
              </div>
            </TD>
            <TD mono>{r.riders} / {r.capacity}</TD>
            <TD><StatusPill status={r.status} /></TD>
            <TD mono muted>{r.dept}</TD>
            <TD mono muted>{r.eta}</TD>
            <TD mono bold>{r.fare}</TD>
          </>)}
        />
      </Card>
    </>
  );
}

function SafetyPage() {
  return (
    <>
      <PageHeader title="Safety" sub="Active SOS incidents and backup alerts" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Active SOS"     value="1"   change="Requires action"           danger iconBg="var(--danger-100)"  icon={<WpIcon name="shield"        size={16} color="var(--danger-600)"  />} />
        <StatCard label="Resolved today" value="1"   change="Avg. resolve: 8 min" changeUp iconBg="var(--success-100)" icon={<WpIcon name="check"         size={16} color="var(--success-700)" />} />
        <StatCard label="Backup pending" value="1"   change="Riders waiting"             iconBg="var(--warning-100)" icon={<WpIcon name="alert-triangle" size={16} color="var(--warning-700)" />} />
        <StatCard label="Contacts notified" value="5" change="This week"          changeUp iconBg="var(--ink-50)"      icon={<WpIcon name="users"         size={16} color="var(--ink-600)"     />} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <CardHeader title="SOS incidents" meta={`${MOCK_SOS.length} today`} />
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MOCK_SOS.map(s => (
              <div key={s.id} style={{
                padding: 16, borderRadius: 'var(--radius-md)',
                border: `2px solid ${s.status === 'ACTIVE' ? 'var(--danger-500)' : 'var(--asphalt-200)'}`,
                background: s.status === 'ACTIVE' ? 'var(--danger-100)' : 'var(--asphalt-50)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <StatusPill status={s.status} />
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--asphalt-500)' }}>{s.time}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--asphalt-900)', marginBottom: 4 }}>{s.rider}</div>
                <div style={{ fontSize: 12, color: 'var(--asphalt-500)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{s.route}</div>
                <div style={{ fontSize: 12, color: 'var(--asphalt-600)' }}>Driver: {s.driver} · {s.contacts} contacts notified</div>
                {s.status === 'ACTIVE' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button style={{ flex: 1, padding: '8px 12px', background: 'var(--danger-600)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Respond now</button>
                    <button style={{ flex: 1, padding: '8px 12px', background: '#fff', color: 'var(--asphalt-900)', border: '1px solid var(--asphalt-300)', borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Call rider</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Backup alerts" meta={`${MOCK_BACKUP.length} open`} />
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MOCK_BACKUP.map(b => (
              <div key={b.id} style={{ padding: 16, borderRadius: 'var(--radius-md)', border: '1.5px solid var(--warning-500)', background: 'var(--warning-100)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <StatusPill status={b.status} />
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--asphalt-600)' }}>{b.time}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--asphalt-900)', marginBottom: 4 }}>{b.route}</div>
                <div style={{ fontSize: 12, color: 'var(--asphalt-600)', marginBottom: 8 }}>{b.riders} riders waiting</div>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--asphalt-500)', marginBottom: b.status === 'PENDING' ? 10 : 0 }}>
                  Available: {b.available.join(' · ')}
                </div>
                {b.status === 'PENDING' && (
                  <button style={{ width: '100%', padding: '8px 12px', background: 'var(--ink-600)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Assign backup driver</button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function BackupDriversPage() {
  return (
    <>
      <PageHeader title="Backup drivers" sub="Available drivers for unassigned or cancelled routes" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Available now"  value="3"  change="Ready to assign"  changeUp iconBg="var(--success-100)" icon={<WpIcon name="check" size={16} color="var(--success-700)" />} />
        <StatCard label="On duty"        value="2"  change="Currently driving" changeUp iconBg="var(--ink-50)"      icon={<WpIcon name="car"   size={16} color="var(--ink-600)"     />} />
        <StatCard label="Pending alerts" value="1"  change="Needs assignment"           iconBg="var(--warning-100)" icon={<WpIcon name="alert-triangle" size={16} color="var(--warning-700)" />} />
      </div>
      <Card style={{ overflow: 'hidden' }}>
        <CardHeader title="Backup driver pool" meta={`${MOCK_VEHICLES.length} registered`} />
        <Table
          cols={['Driver', 'Vehicle', 'Plate', 'Seats', 'Status', 'Action']}
          rows={MOCK_VEHICLES}
          renderRow={v => {
            const emp = MOCK_EMPLOYEES.find(e => e.name.startsWith(v.driver.split(' ')[0]));
            const avail = v.status === 'ACTIVE';
            return (<>
              <TD>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <WpAvatar initials={v.driver.split(' ').map(n=>n[0]).join('')} size={32} tone={avail ? 'ink' : 'asphalt'} />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--asphalt-900)' }}>{v.driver}</div>
                    <div style={{ fontSize: 11, color: 'var(--asphalt-500)', fontFamily: 'var(--font-mono)' }}>★ {emp?.rating || '4.7'} · {emp?.rides || 0} rides</div>
                  </div>
                </div>
              </TD>
              <TD muted>{v.model}</TD>
              <TD mono muted>{v.plate}</TD>
              <TD mono>{v.seats}</TD>
              <TD><StatusPill status={v.status} /></TD>
              <td style={{ padding: '10px 16px' }}>
                {avail
                  ? <button style={{ padding: '6px 14px', borderRadius: 999, background: 'var(--ink-600)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Assign</button>
                  : <span style={{ fontSize: 12, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>On route</span>
                }
              </td>
            </>);
          }}
        />
      </Card>
    </>
  );
}

function RoutesPage() {
  return (
    <>
      <PageHeader title="Routes" sub={`${MOCK_ROUTES.length} routes configured`} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Active routes"   value="4"    change="Running today"  changeUp iconBg="var(--ink-50)"      icon={<WpIcon name="map-pin" size={16} color="var(--ink-600)"     />} />
        <StatCard label="Total riders"    value="93"   change="Across all routes" changeUp iconBg="var(--voltage-100)" icon={<WpIcon name="users"   size={16} color="var(--voltage-700)" />} />
        <StatCard label="Avg fill rate"   value="78%"  change="↑3pts vs last week" changeUp iconBg="var(--success-100)" icon={<WpIcon name="bar-chart" size={16} color="var(--success-700)" />} />
      </div>
      <Card style={{ overflow: 'hidden' }}>
        <CardHeader title="All routes">
          <button style={{ padding: '7px 14px', borderRadius: 999, background: 'var(--ink-600)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <WpIcon name="plus" size={14} color="#fff" /> Add route
          </button>
        </CardHeader>
        <Table
          cols={['Route', 'Driver', 'Departs', 'Distance', 'Riders', 'Status']}
          rows={MOCK_ROUTES}
          renderRow={r => (<>
            <TD><MiniRoute origin={r.origin} dest={r.dest} /></TD>
            <TD>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <WpAvatar initials={r.driver.split(' ').map(n=>n[0]).join('')} size={28} tone="ink" />
                {r.driver}
              </div>
            </TD>
            <TD mono muted>{r.dept}</TD>
            <TD mono muted>{r.dist}</TD>
            <TD mono>{r.riders}</TD>
            <TD><StatusPill status={r.status} /></TD>
          </>)}
        />
      </Card>
    </>
  );
}

function EmployeesPage() {
  const [search, setSearch] = useState('');
  const filtered = MOCK_EMPLOYEES.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <>
      <PageHeader title="Employees" sub={`${MOCK_EMPLOYEES.length} registered employees`} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total employees" value={MOCK_EMPLOYEES.length} change="Across all orgs"   changeUp iconBg="var(--ink-50)"      icon={<WpIcon name="users"    size={16} color="var(--ink-600)"     />} />
        <StatCard label="Drivers"         value={MOCK_EMPLOYEES.filter(e=>e.role==='DRIVER').length} change="Active drivers" changeUp iconBg="var(--voltage-100)" icon={<WpIcon name="car"      size={16} color="var(--voltage-700)" />} />
        <StatCard label="Passengers"      value={MOCK_EMPLOYEES.filter(e=>e.role==='PASSENGER').length} change="Active riders" changeUp iconBg="var(--success-100)" icon={<WpIcon name="user"     size={16} color="var(--success-700)" />} />
      </div>
      <Card style={{ overflow: 'hidden' }}>
        <CardHeader title="Employee directory" meta={`${filtered.length} showing`}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or email…"
            style={{ padding: '7px 14px', borderRadius: 999, border: '1px solid var(--asphalt-200)', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', width: 200 }}
          />
        </CardHeader>
        <Table
          cols={['Employee', 'Email', 'Org', 'Role', 'Rides', 'Rating']}
          rows={filtered}
          renderRow={e => (<>
            <TD>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <WpAvatar initials={e.name.split(' ').map(n=>n[0]).join('')} size={32} tone={e.role === 'DRIVER' ? 'ink' : 'asphalt'} />
                <span style={{ fontWeight: 600 }}>{e.name}</span>
              </div>
            </TD>
            <TD mono muted>{e.email}</TD>
            <TD muted>{e.org}</TD>
            <TD>
              <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-sans)',
                background: e.role === 'DRIVER' ? 'var(--ink-50)' : 'var(--asphalt-100)',
                color: e.role === 'DRIVER' ? 'var(--ink-700)' : 'var(--asphalt-600)' }}>
                {e.role}
              </span>
            </TD>
            <TD mono>{e.rides}</TD>
            <TD><Stars rating={e.rating} /></TD>
          </>)}
        />
      </Card>
    </>
  );
}

function VehiclesPage() {
  return (
    <>
      <PageHeader title="Vehicles" sub={`${MOCK_VEHICLES.length} vehicles registered`} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Active"  value={MOCK_VEHICLES.filter(v=>v.status==='ACTIVE').length}   change="On road today" changeUp iconBg="var(--success-100)" icon={<WpIcon name="car"   size={16} color="var(--success-700)" />} />
        <StatCard label="Inactive" value={MOCK_VEHICLES.filter(v=>v.status==='INACTIVE').length} change="Not active"           iconBg="var(--asphalt-100)" icon={<WpIcon name="x"     size={16} color="var(--asphalt-500)" />} />
        <StatCard label="Avg seats" value="4.8" change="Fleet capacity"     changeUp iconBg="var(--ink-50)"      icon={<WpIcon name="users" size={16} color="var(--ink-600)"     />} />
      </div>
      <Card style={{ overflow: 'hidden' }}>
        <CardHeader title="Fleet">
          <button style={{ padding: '7px 14px', borderRadius: 999, background: 'var(--ink-600)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <WpIcon name="plus" size={14} color="#fff" /> Add vehicle
          </button>
        </CardHeader>
        <Table
          cols={['Driver', 'Model', 'Plate', 'Type', 'Seats', 'Fuel', 'Status']}
          rows={MOCK_VEHICLES}
          renderRow={v => (<>
            <TD>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <WpAvatar initials={v.driver.split(' ').map(n=>n[0]).join('')} size={28} tone="ink" />
                {v.driver}
              </div>
            </TD>
            <TD>{v.model}</TD>
            <TD mono>{v.plate}</TD>
            <TD muted>{v.type}</TD>
            <TD mono>{v.seats}</TD>
            <TD muted>{v.fuel}</TD>
            <TD><StatusPill status={v.status} /></TD>
          </>)}
        />
      </Card>
    </>
  );
}

function RatingsPage() {
  return (
    <>
      <PageHeader title="Ratings" sub="Driver performance and passenger feedback" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Avg driver rating" value="4.7"  change="Fleet average"   changeUp iconBg="var(--warning-100)" icon={<WpIcon name="star"  size={16} color="var(--warning-700)" />} />
        <StatCard label="Total reviews"     value="450"  change="All time"        changeUp iconBg="var(--ink-50)"      icon={<WpIcon name="users" size={16} color="var(--ink-600)"     />} />
        <StatCard label="5-star rides"      value="72%"  change="↑2pts vs last month" changeUp iconBg="var(--success-100)" icon={<WpIcon name="check" size={16} color="var(--success-700)" />} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {MOCK_RATINGS.map(r => (
          <Card key={r.driver} style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <WpAvatar initials={r.initials} size={44} tone="ink" />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--asphalt-900)' }}>{r.driver}</div>
                <div style={{ fontSize: 12, color: 'var(--asphalt-500)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{r.total} rides · driver</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--asphalt-900)', letterSpacing: '-0.02em' }}>{r.avg}</div>
                <div style={{ color: '#f5a524', fontSize: 14 }}>★★★★★</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <RatingBar label="5" count={r.five}  total={r.total} />
              <RatingBar label="4" count={r.four}  total={r.total} />
              <RatingBar label="3" count={r.three} total={r.total} />
              <RatingBar label="2" count={r.two}   total={r.total} />
              <RatingBar label="1" count={r.one}   total={r.total} />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function TransactionsPage() {
  const txnTone = { PAID: 'completed', PENDING: 'warn', REFUNDED: 'cancelled' };
  const total = MOCK_TRANSACTIONS.filter(t=>t.status==='PAID').reduce((s,t) => s + parseInt(t.amount.replace(/[₹,]/g,'')), 0);
  return (
    <>
      <PageHeader title="Transactions" sub="Fare payments and Razorpay settlements" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total collected" value={`₹${total.toLocaleString('en-IN')}`} change="Today" changeUp iconBg="var(--success-100)" icon={<WpIcon name="wallet"    size={16} color="var(--success-700)" />} />
        <StatCard label="Paid"    value={MOCK_TRANSACTIONS.filter(t=>t.status==='PAID').length}    change="Settled"         changeUp iconBg="var(--ink-50)"      icon={<WpIcon name="check"      size={16} color="var(--ink-600)"     />} />
        <StatCard label="Pending" value={MOCK_TRANSACTIONS.filter(t=>t.status==='PENDING').length} change="Awaiting"                iconBg="var(--warning-100)" icon={<WpIcon name="clock"      size={16} color="var(--warning-700)" />} />
        <StatCard label="Refunded" value={MOCK_TRANSACTIONS.filter(t=>t.status==='REFUNDED').length} change="Returned"              iconBg="var(--asphalt-100)" icon={<WpIcon name="arrow-right" size={16} color="var(--asphalt-500)" />} />
      </div>
      <Card style={{ overflow: 'hidden' }}>
        <CardHeader title="Payment history" meta={`${MOCK_TRANSACTIONS.length} transactions`} />
        <Table
          cols={['ID', 'Rider', 'Driver', 'Route', 'Amount', 'Method', 'Date', 'Status']}
          rows={MOCK_TRANSACTIONS}
          renderRow={t => (<>
            <TD mono muted>{t.id}</TD>
            <TD>{t.rider}</TD>
            <TD muted>{t.driver}</TD>
            <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--asphalt-600)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.route}</td>
            <TD mono bold>{t.amount}</TD>
            <TD muted>{t.method}</TD>
            <TD mono muted>{t.date}</TD>
            <TD><WpPill tone={txnTone[t.status] || 'matched'}>{t.status}</WpPill></TD>
          </>)}
        />
      </Card>
    </>
  );
}

function ReimbursementsPage() {
  const rmbTone = { APPROVED: 'completed', PENDING: 'warn', REJECTED: 'sos' };
  const approved = MOCK_REIMBURSEMENTS.filter(r=>r.status==='APPROVED').reduce((s,r) => s + parseInt(r.amount.replace(/[₹,]/g,'')), 0);
  return (
    <>
      <PageHeader title="Reimbursements" sub="Employee transport expense claims" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total approved" value={`₹${approved.toLocaleString('en-IN')}`} change="Apr 2026" changeUp iconBg="var(--success-100)" icon={<WpIcon name="wallet" size={16} color="var(--success-700)" />} />
        <StatCard label="Approved" value={MOCK_REIMBURSEMENTS.filter(r=>r.status==='APPROVED').length}  change="Processed"  changeUp iconBg="var(--ink-50)"      icon={<WpIcon name="check" size={16} color="var(--ink-600)"     />} />
        <StatCard label="Pending"  value={MOCK_REIMBURSEMENTS.filter(r=>r.status==='PENDING').length}   change="Awaiting review"   iconBg="var(--warning-100)" icon={<WpIcon name="clock" size={16} color="var(--warning-700)" />} />
        <StatCard label="Rejected" value={MOCK_REIMBURSEMENTS.filter(r=>r.status==='REJECTED').length}  change="Declined"           danger iconBg="var(--danger-100)"  icon={<WpIcon name="x"     size={16} color="var(--danger-600)"  />} />
      </div>
      <Card style={{ overflow: 'hidden' }}>
        <CardHeader title="Claims · Apr 2026" meta={`${MOCK_REIMBURSEMENTS.length} total`} />
        <Table
          cols={['ID', 'Employee', 'Org', 'Rides', 'Amount', 'Period', 'Status', 'Action']}
          rows={MOCK_REIMBURSEMENTS}
          renderRow={r => (<>
            <TD mono muted>{r.id}</TD>
            <TD>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <WpAvatar initials={r.employee.split(' ').map(n=>n[0]).join('')} size={28} tone="asphalt" />
                {r.employee}
              </div>
            </TD>
            <TD muted>{r.org}</TD>
            <TD mono>{r.rides}</TD>
            <TD mono bold>{r.amount}</TD>
            <TD mono muted>{r.period}</TD>
            <TD><WpPill tone={rmbTone[r.status] || 'matched'}>{r.status}</WpPill></TD>
            <td style={{ padding: '10px 16px' }}>
              {r.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={{ padding: '5px 12px', borderRadius: 999, background: 'var(--success-500)', color: '#fff', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Approve</button>
                  <button style={{ padding: '5px 12px', borderRadius: 999, background: 'var(--asphalt-100)', color: 'var(--asphalt-700)', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Reject</button>
                </div>
              )}
            </td>
          </>)}
        />
      </Card>
    </>
  );
}

// ─── Sidebar nav config ───────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: 'Operate',
    items: [
      { id: 'overview',  label: 'Overview',        live: true },
      { id: 'active',    label: 'Active rides',     badge: '128' },
      { id: 'safety',    label: 'Safety',           badge: '2', danger: true },
      { id: 'backup',    label: 'Backup drivers' },
      { id: 'routes',    label: 'Routes' },
    ],
  },
  {
    label: 'People',
    items: [
      { id: 'employees', label: 'Employees' },
      { id: 'vehicles',  label: 'Vehicles' },
      { id: 'ratings',   label: 'Ratings' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'transactions',     label: 'Transactions' },
      { id: 'reimbursements',   label: 'Reimbursements' },
    ],
  },
];

// ─── Root component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [activeNav, setActiveNav] = useState('overview');

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    api.get('/organisations')
      .then(res => { setOrgs(res.data || []); if (res.data?.[0]) setSelectedOrg(res.data[0]); })
      .catch(() => setOrgs([]));
  }, []);

  function renderPage() {
    switch (activeNav) {
      case 'overview':        return <OverviewPage today={today} />;
      case 'active':          return <ActiveRidesPage />;
      case 'safety':          return <SafetyPage />;
      case 'backup':          return <BackupDriversPage />;
      case 'routes':          return <RoutesPage />;
      case 'employees':       return <EmployeesPage />;
      case 'vehicles':        return <VehiclesPage />;
      case 'ratings':         return <RatingsPage />;
      case 'transactions':    return <TransactionsPage />;
      case 'reimbursements':  return <ReimbursementsPage />;
      default:                return <OverviewPage today={today} />;
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
        {/* Logo + org */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <svg width="32" height="32" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="14" fill="var(--voltage-400)" />
              <path d="M22 8C16.477 8 12 12.477 12 18C12 24 22 36 22 36C22 36 32 24 32 18C32 12.477 27.523 8 22 8Z" fill="var(--ink-950)" />
              <circle cx="22" cy="18" r="4" fill="var(--voltage-400)" />
            </svg>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>waypoint</span>
          </div>
          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>Organization</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <WpIcon name="building" size={14} color="rgba(255,255,255,0.7)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{selectedOrg?.name || orgs[0]?.name || 'Acme Corp'}</span>
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
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = isActive ? 'var(--ink-950)' : '#fff'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isActive ? 'var(--ink-950)' : 'rgba(255,255,255,0.55)'; }}
                  >
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.live && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: isActive ? 'var(--ink-950)' : 'var(--voltage-400)', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? 'var(--ink-950)' : 'var(--voltage-400)' }} />LIVE
                      </span>
                    )}
                    {item.badge && !item.live && (
                      <span style={{
                        minWidth: 20, height: 20, borderRadius: 10, padding: '0 5px',
                        background: item.danger ? 'var(--danger-600)' : 'rgba(255,255,255,0.15)',
                        color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{item.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Settings / logout */}
        <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginBottom: 4 }}>
            <WpAvatar initials={(currentUser?.name || 'Admin').split(' ').map(n=>n[0]).join('').slice(0,2)} size={28} tone="ink" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.name || 'Admin'}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>ADMIN</div>
            </div>
          </div>
          <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 'var(--radius-md)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'var(--font-sans)', textAlign: 'left' }}
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
        <div style={{ background: '#fff', borderBottom: '1px solid var(--asphalt-200)', padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ flex: 1, maxWidth: 360, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', border: '1.5px solid var(--asphalt-200)', borderRadius: 'var(--radius-pill)', background: 'var(--asphalt-50)' }}>
            <WpIcon name="search" size={16} color="var(--asphalt-400)" />
            <input type="text" placeholder="Search rides, drivers, employees…" style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--asphalt-800)' }} />
          </div>
          <div style={{ flex: 1 }} />
          <button style={{ padding: '9px 18px', background: 'var(--ink-600)', color: '#fff', border: 'none', borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-sans)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <WpIcon name="plus" size={16} color="#fff" /> Add ride
          </button>
          <WpAvatar initials={(currentUser?.name || 'Admin').split(' ').map(n=>n[0]).join('').slice(0,2)} size={36} tone="ink" />
        </div>

        {/* Page content */}
        <div style={{ padding: 28, flex: 1 }}>
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
