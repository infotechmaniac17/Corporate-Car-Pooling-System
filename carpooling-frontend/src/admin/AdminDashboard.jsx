import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import WpIcon from '../components/WpIcon';
import WpAvatar from '../components/WpAvatar';
import WpPill from '../components/WpPill';
import api from '../api/client';
import { adminGetRoleRequests, adminApproveRequest, adminRejectRequest } from '../api/roleRequests';

// ─── No-endpoint stubs (empty — no real API yet) ──────────────────────────────

const MOCK_VEHICLES = [];
const MOCK_ROUTES = [];
const MOCK_RATINGS = [];
const MOCK_TRANSACTIONS = [];
const MOCK_REIMBURSEMENTS = [];
const MOCK_SOS = [];
const MOCK_BACKUP = [];

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
        <CardHeader title="Active rides" meta="See Active rides tab" />
        <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'var(--asphalt-400)' }}>No data available</div>
      </Card>
    </>
  );
}

function ActiveRidesPage() {
  const [filter, setFilter] = useState('ALL');
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const statuses = ['ALL', 'CREATED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get('/rides/schedules/search')
      .then(res => setRides(res.data?.data || []))
      .catch(() => setError('Failed to load rides'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? rides : rides.filter(r => r.status === filter);

  const fmtTime = (iso) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); } catch { return '—'; }
  };
  const fmtFare = (f) => f != null ? `₹${parseFloat(f).toLocaleString('en-IN')}` : '—';

  return (
    <>
      <PageHeader title="Active rides" sub={loading ? 'Loading…' : `${rides.length} rides · updating live`} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Created"   value={rides.filter(r=>r.status==='CREATED').length}   change="Scheduled"   changeUp iconBg="var(--voltage-100)" icon={<WpIcon name="activity" size={16} color="var(--voltage-700)" />} />
        <StatCard label="Active"    value={rides.filter(r=>r.status==='ACTIVE').length}    change="En route"    changeUp iconBg="var(--ink-50)"      icon={<WpIcon name="users"    size={16} color="var(--ink-600)"     />} />
        <StatCard label="Completed" value={rides.filter(r=>r.status==='COMPLETED').length} change="Today so far" changeUp iconBg="var(--success-100)" icon={<WpIcon name="check"    size={16} color="var(--success-700)" />} />
        <StatCard label="Cancelled" value={rides.filter(r=>r.status==='CANCELLED').length} change="Cancelled"           iconBg="var(--warning-100)" icon={<WpIcon name="clock"    size={16} color="var(--warning-700)" />} />
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
        {error && <div style={{ padding: '16px 20px', fontSize: 13, color: 'var(--danger-600)' }}>{error}</div>}
        {loading && <div style={{ padding: '16px 20px', fontSize: 13, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>Loading…</div>}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'var(--asphalt-400)' }}>No data available</div>
        )}
        {!loading && !error && filtered.length > 0 && (
        <Table
          cols={['Route', 'Driver', 'Seats', 'Status', 'Departs', 'Fare']}
          rows={filtered}
          renderRow={r => (<>
            <TD><MiniRoute origin={r.pickupLabel || 'Pickup'} dest={r.dropoffLabel || 'Dropoff'} /></TD>
            <TD>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <WpAvatar initials={(r.driverName || 'D').split(' ').map(n=>n[0]).join('')} size={28} tone="ink" />
                {r.driverName || '—'}
              </div>
            </TD>
            <TD mono>{r.availableSeats ?? '—'} / {r.vehicleCapacity ?? '—'}</TD>
            <TD><StatusPill status={r.status} /></TD>
            <TD mono muted>{fmtTime(r.departureTime)}</TD>
            <TD mono bold>{fmtFare(r.fare)}</TD>
          </>)}
        />
        )}
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
          <CardHeader title="SOS incidents" meta="0 today" />
          <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'var(--asphalt-400)' }}>No data available</div>
        </Card>
        <Card>
          <CardHeader title="Backup alerts" meta="0 open" />
          <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'var(--asphalt-400)' }}>No data available</div>
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
        <CardHeader title="Backup driver pool" meta="0 registered" />
        <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'var(--asphalt-400)' }}>No data available</div>
      </Card>
    </>
  );
}

function RoutesPage() {
  return (
    <>
      <PageHeader title="Routes" sub="0 routes configured" />
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
        <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'var(--asphalt-400)' }}>No data available</div>
      </Card>
    </>
  );
}

function EmployeesPage({ orgId }) {
  const [search, setSearch] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    api.get(`/users/organisation/${orgId}`)
      .then(res => setEmployees(res.data?.data || []))
      .catch(() => setError('Failed to load employees'))
      .finally(() => setLoading(false));
  }, [orgId]);

  const filtered = employees.filter(e =>
    (e.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.email || '').toLowerCase().includes(search.toLowerCase())
  );
  return (
    <>
      <PageHeader title="Employees" sub={loading ? 'Loading…' : `${employees.length} registered employees`} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total employees" value={employees.length} change="Across all orgs"   changeUp iconBg="var(--ink-50)"      icon={<WpIcon name="users"    size={16} color="var(--ink-600)"     />} />
        <StatCard label="Drivers"         value={employees.filter(e=>e.role==='DRIVER').length} change="Active drivers" changeUp iconBg="var(--voltage-100)" icon={<WpIcon name="car"      size={16} color="var(--voltage-700)" />} />
        <StatCard label="Passengers"      value={employees.filter(e=>e.role==='PASSENGER').length} change="Active riders" changeUp iconBg="var(--success-100)" icon={<WpIcon name="user"     size={16} color="var(--success-700)" />} />
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
        {error && <div style={{ padding: '16px 20px', fontSize: 13, color: 'var(--danger-600)' }}>{error}</div>}
        {loading && <div style={{ padding: '16px 20px', fontSize: 13, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>Loading…</div>}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'var(--asphalt-400)' }}>No data available</div>
        )}
        {!loading && !error && filtered.length > 0 && (
        <Table
          cols={['Employee', 'Email', 'Org', 'Role', 'Rating']}
          rows={filtered}
          renderRow={e => (<>
            <TD>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <WpAvatar initials={(e.name || 'U').split(' ').map(n=>n[0]).join('')} size={32} tone={e.role === 'DRIVER' ? 'ink' : 'asphalt'} />
                <span style={{ fontWeight: 600 }}>{e.name}</span>
              </div>
            </TD>
            <TD mono muted>{e.email}</TD>
            <TD muted>{e.organisationName || '—'}</TD>
            <TD>
              <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-sans)',
                background: e.role === 'DRIVER' ? 'var(--ink-50)' : 'var(--asphalt-100)',
                color: e.role === 'DRIVER' ? 'var(--ink-700)' : 'var(--asphalt-600)' }}>
                {e.role}
              </span>
            </TD>
            <TD><Stars rating={parseFloat(e.rating) || 0} /></TD>
          </>)}
        />
        )}
      </Card>
    </>
  );
}

function VehiclesPage() {
  return (
    <>
      <PageHeader title="Vehicles" sub="0 vehicles registered" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Active"   value={0} change="On road today" changeUp iconBg="var(--success-100)" icon={<WpIcon name="car"   size={16} color="var(--success-700)" />} />
        <StatCard label="Inactive" value={0} change="Not active"           iconBg="var(--asphalt-100)" icon={<WpIcon name="x"     size={16} color="var(--asphalt-500)" />} />
        <StatCard label="Avg seats" value="—" change="Fleet capacity"     changeUp iconBg="var(--ink-50)"      icon={<WpIcon name="users" size={16} color="var(--ink-600)"     />} />
      </div>
      <Card style={{ overflow: 'hidden' }}>
        <CardHeader title="Fleet">
          <button style={{ padding: '7px 14px', borderRadius: 999, background: 'var(--ink-600)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <WpIcon name="plus" size={14} color="#fff" /> Add vehicle
          </button>
        </CardHeader>
        <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'var(--asphalt-400)' }}>No data available</div>
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
      <Card style={{ padding: '32px 20px' }}>
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--asphalt-400)' }}>No data available</div>
      </Card>
    </>
  );
}

function TransactionsPage() {
  return (
    <>
      <PageHeader title="Transactions" sub="Fare payments and Razorpay settlements" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total collected" value="₹0"    change="Today" changeUp iconBg="var(--success-100)" icon={<WpIcon name="wallet"    size={16} color="var(--success-700)" />} />
        <StatCard label="Paid"    value={0} change="Settled"         changeUp iconBg="var(--ink-50)"      icon={<WpIcon name="check"      size={16} color="var(--ink-600)"     />} />
        <StatCard label="Pending" value={0} change="Awaiting"                iconBg="var(--warning-100)" icon={<WpIcon name="clock"      size={16} color="var(--warning-700)" />} />
        <StatCard label="Refunded" value={0} change="Returned"              iconBg="var(--asphalt-100)" icon={<WpIcon name="arrow-right" size={16} color="var(--asphalt-500)" />} />
      </div>
      <Card style={{ overflow: 'hidden' }}>
        <CardHeader title="Payment history" meta="0 transactions" />
        <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'var(--asphalt-400)' }}>No data available</div>
      </Card>
    </>
  );
}

function ReimbursementsPage() {
  return (
    <>
      <PageHeader title="Reimbursements" sub="Employee transport expense claims" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total approved" value="₹0" change="No data" changeUp iconBg="var(--success-100)" icon={<WpIcon name="wallet" size={16} color="var(--success-700)" />} />
        <StatCard label="Approved" value={0} change="Processed"  changeUp iconBg="var(--ink-50)"      icon={<WpIcon name="check" size={16} color="var(--ink-600)"     />} />
        <StatCard label="Pending"  value={0} change="Awaiting review"   iconBg="var(--warning-100)" icon={<WpIcon name="clock" size={16} color="var(--warning-700)" />} />
        <StatCard label="Rejected" value={0} change="Declined"           danger iconBg="var(--danger-100)"  icon={<WpIcon name="x"     size={16} color="var(--danger-600)"  />} />
      </div>
      <Card style={{ overflow: 'hidden' }}>
        <CardHeader title="Claims" meta="0 total" />
        <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'var(--asphalt-400)' }}>No data available</div>
      </Card>
    </>
  );
}

function UsersPage({ orgId }) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    api.get(`/users/organisation/${orgId}`)
      .then(res => setUsers(res.data?.data || []))
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, [orgId]);

  const filtered = users.filter(u =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );
  return (
    <>
      <PageHeader title="Users" sub={loading ? 'Loading…' : `${users.length} registered users`} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total users"   value={users.length}                                           change="All time"        changeUp iconBg="var(--ink-50)"      icon={<WpIcon name="users"  size={16} color="var(--ink-600)"     />} />
        <StatCard label="Drivers"       value={users.filter(u=>u.role==='DRIVER').length}              change="Active"          changeUp iconBg="var(--voltage-100)" icon={<WpIcon name="car"    size={16} color="var(--voltage-700)" />} />
        <StatCard label="Passengers"    value={users.filter(u=>u.role==='PASSENGER').length}           change="Active"          changeUp iconBg="var(--success-100)" icon={<WpIcon name="user"   size={16} color="var(--success-700)" />} />
        <StatCard label="Suspended"     value={users.filter(u=>u.status==='SUSPENDED').length}         change="Review needed"           danger iconBg="var(--danger-100)"  icon={<WpIcon name="x"      size={16} color="var(--danger-600)"  />} />
      </div>
      <Card style={{ overflow: 'hidden' }}>
        <CardHeader title="User directory" meta={`${filtered.length} showing`}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name or email…"
            style={{ padding: '7px 14px', borderRadius: 999, border: '1px solid var(--asphalt-200)', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', width: 200 }}
          />
        </CardHeader>
        {error && <div style={{ padding: '16px 20px', fontSize: 13, color: 'var(--danger-600)' }}>{error}</div>}
        {loading && <div style={{ padding: '16px 20px', fontSize: 13, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>Loading…</div>}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'var(--asphalt-400)' }}>No data available</div>
        )}
        {!loading && !error && filtered.length > 0 && (
        <Table
          cols={['User', 'Email', 'Org', 'Role', 'Driver status', 'Rating']}
          rows={filtered}
          renderRow={u => (<>
            <TD>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <WpAvatar initials={(u.name || 'U').split(' ').map(n=>n[0]).join('')} size={32} tone={u.role === 'DRIVER' ? 'ink' : 'asphalt'} />
                <span style={{ fontWeight: 600 }}>{u.name}</span>
              </div>
            </TD>
            <TD mono muted>{u.email}</TD>
            <TD muted>{u.organisationName || '—'}</TD>
            <TD>
              <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                background: u.role === 'DRIVER' ? 'var(--ink-50)' : 'var(--asphalt-100)',
                color: u.role === 'DRIVER' ? 'var(--ink-700)' : 'var(--asphalt-600)' }}>
                {u.role}
              </span>
            </TD>
            <TD muted>{u.driverStatus || '—'}</TD>
            <TD><Stars rating={parseFloat(u.rating) || 0} /></TD>
          </>)}
        />
        )}
      </Card>
    </>
  );
}

function DriverKycPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = () => {
    setLoading(true);
    adminGetRoleRequests('PENDING')
      .then(res => setRequests(res.data?.data || []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = (id) => {
    adminApproveRequest(id).then(load).catch(() => {});
  };

  const handleReject = (id) => {
    adminRejectRequest(id, rejectReason).then(() => {
      setRejectingId(null);
      setRejectReason('');
      load();
    }).catch(() => {});
  };

  const DocLink = ({ label, url }) => (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
        background: 'var(--success-100)', color: 'var(--success-700)', textDecoration: 'none' }}>
      <WpIcon name="check" size={11} color="var(--success-700)" />
      {label}
    </a>
  );

  const pending = requests.filter(r => r.status === 'PENDING');

  return (
    <>
      <PageHeader title="Driver KYC" sub="Verify driving licenses and vehicle documents" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Pending review"  value={pending.length} change="Requires action"   danger={pending.length > 0} iconBg="var(--warning-100)" icon={<WpIcon name="clock"  size={16} color="var(--warning-700)" />} />
        <StatCard label="Total fetched"   value={requests.length} change="All applications" changeUp iconBg="var(--ink-50)" icon={<WpIcon name="users" size={16} color="var(--ink-600)" />} />
        <StatCard label="Viewing"         value="PENDING"         change="Filter active"    changeUp iconBg="var(--asphalt-100)" icon={<WpIcon name="search" size={16} color="var(--asphalt-500)" />} />
      </div>
      {loading ? (
        <Card style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>Loading…</div>
        </Card>
      ) : requests.length === 0 ? (
        <Card style={{ padding: 40, textAlign: 'center' }}>
          <WpIcon name="check" size={32} color="var(--success-700)" />
          <div style={{ fontSize: 14, color: 'var(--asphalt-500)', marginTop: 12 }}>No pending applications</div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {requests.map(k => (
            <Card key={k.id} style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <WpAvatar initials={(k.userName || 'U').split(' ').map(n=>n[0]).join('')} size={40} tone="ink" />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--asphalt-900)' }}>{k.userName}</div>
                    <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--asphalt-400)', marginTop: 2 }}>
                      {k.userEmail} · {k.vehiclePlate} · {k.vehicleModel}
                    </div>
                  </div>
                </div>
                <StatusPill status={k.status} />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                <DocLink label="License" url={k.licenseDocUrl} />
                <DocLink label="ID proof" url={k.idProofDocUrl} />
                <DocLink label="RC book" url={k.rcDocUrl} />
                <DocLink label="Insurance" url={k.insuranceDocUrl} />
              </div>
              {k.status === 'PENDING' && rejectingId !== k.id && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => handleApprove(k.id)} style={{ padding: '8px 20px', borderRadius: 999, background: 'var(--success-500)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Approve
                  </button>
                  <button onClick={() => { setRejectingId(k.id); setRejectReason(''); }} style={{ padding: '8px 20px', borderRadius: 999, background: 'var(--asphalt-100)', color: 'var(--asphalt-700)', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Reject
                  </button>
                </div>
              )}
              {rejectingId === k.id && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection…"
                    style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--asphalt-300)', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none' }}
                  />
                  <button onClick={() => handleReject(k.id)} style={{ padding: '8px 16px', borderRadius: 999, background: 'var(--danger-600)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Confirm reject
                  </button>
                  <button onClick={() => setRejectingId(null)} style={{ padding: '8px 14px', borderRadius: 999, background: 'var(--asphalt-100)', color: 'var(--asphalt-700)', border: 'none', fontSize: 12, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
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
      { id: 'users',     label: 'Users',           badge: '8' },
      { id: 'kyc',       label: 'Driver KYC',      badge: '3', danger: true },
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
  const [orgId, setOrgId] = useState(null);
  const [activeNav, setActiveNav] = useState('overview');

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    api.get('/organisations')
      .then(res => { setOrgs(res.data || []); if (res.data?.[0]) setSelectedOrg(res.data[0]); })
      .catch(() => setOrgs([]));
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    api.get(`/users/${currentUser.id}`)
      .then(res => {
        const id = res.data?.data?.organisationId || res.data?.organisationId;
        if (id) setOrgId(id);
      })
      .catch(() => {});
  }, [currentUser?.id]);

  function renderPage() {
    switch (activeNav) {
      case 'overview':        return <OverviewPage today={today} />;
      case 'active':          return <ActiveRidesPage />;
      case 'safety':          return <SafetyPage />;
      case 'backup':          return <BackupDriversPage />;
      case 'routes':          return <RoutesPage />;
      case 'users':           return <UsersPage orgId={orgId} />;
      case 'kyc':             return <DriverKycPage />;
      case 'employees':       return <EmployeesPage orgId={orgId} />;
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
