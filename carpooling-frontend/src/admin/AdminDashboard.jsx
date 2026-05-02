import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WpIcon from '../components/WpIcon';
import WpAvatar from '../components/WpAvatar';
import WpPill from '../components/WpPill';
import api from '../api/client';

// --- Mock data ---
const MOCK_RIDES = [
  { id: 'R001', route: 'Koramangala → Whitefield', driver: 'Arjun Mehta', riders: 3, status: 'LIVE', eta: '9:12 AM', fare: '₹360' },
  { id: 'R002', route: 'HSR Layout → Electronic City', driver: 'Priya Sharma', riders: 2, status: 'LIVE', eta: '9:28 AM', fare: '₹190' },
  { id: 'R003', route: 'Indiranagar → Marathahalli', driver: 'Ravi Kumar', riders: 4, status: 'MATCHED', eta: '9:45 AM', fare: '₹560' },
  { id: 'R004', route: 'Jayanagar → MG Road', driver: 'Sneha Patel', riders: 1, status: 'PENDING', eta: '10:00 AM', fare: '₹95' },
  { id: 'R005', route: 'BTM Layout → Outer Ring Rd', driver: 'Kiran Das', riders: 3, status: 'LIVE', eta: '9:35 AM', fare: '₹315' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const RIDE_DATA = [95, 112, 108, 120, 128, 45, 22, 98, 115, 124, 118, 128, 48, 20];
const CO2_DATA = [228, 269, 259, 288, 307, 108, 53, 235, 276, 298, 283, 307, 115, 48];

function StatCard({ label, value, change, changeUp, danger, icon, iconBg }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      border: `1px solid ${danger ? 'var(--danger-500)' : 'var(--asphalt-200)'}`,
      boxShadow: 'var(--shadow-1)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--asphalt-500)', fontFamily: 'var(--font-sans)' }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: iconBg || 'var(--ink-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '28px', fontWeight: 800, color: danger ? 'var(--danger-600)' : 'var(--asphalt-900)', fontFamily: 'var(--font-sans)', marginBottom: '6px' }}>
        {value}
      </div>
      {change && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: changeUp ? 'var(--success-700)' : 'var(--danger-600)', fontFamily: 'var(--font-mono)' }}>
          <WpIcon name="trending-up" size={14} color={changeUp ? 'var(--success-700)' : 'var(--danger-600)'} />
          {change}
        </div>
      )}
    </div>
  );
}

function BarChart({ data, labels, color = 'var(--ink-600)', lineColor = 'var(--voltage-400)', showLine = false }) {
  const max = Math.max(...data, ...( showLine ? CO2_DATA : []));
  const chartH = 160;
  const barW = 16;
  const gap = 8;
  const totalW = data.length * (barW + gap);

  // Line path for CO2
  const linePoints = CO2_DATA.map((v, i) => {
    const x = i * (barW + gap) + barW / 2;
    const y = chartH - (v / max) * chartH;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={totalW} height={chartH + 24} style={{ display: 'block' }}>
        {data.map((v, i) => {
          const x = i * (barW + gap);
          const h = (v / max) * chartH;
          const y = chartH - h;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx="4"
                fill={color}
                opacity="0.85"
              />
              <text x={x + barW / 2} y={chartH + 16} textAnchor="middle" fontSize="9" fill="var(--asphalt-400)" fontFamily="var(--font-mono)">
                {labels[i]}
              </text>
            </g>
          );
        })}
        {showLine && (
          <polyline
            points={linePoints}
            fill="none"
            stroke={lineColor}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
}

const NAV_SECTIONS = [
  {
    label: 'Operate',
    items: [
      { id: 'overview', label: 'Overview', active: true, live: true },
      { id: 'active', label: 'Active rides', badge: '128' },
      { id: 'safety', label: 'Safety', badge: '2', danger: true },
      { id: 'backup', label: 'Backup drivers' },
      { id: 'routes', label: 'Routes' },
    ],
  },
  {
    label: 'People',
    items: [
      { id: 'employees', label: 'Employees' },
      { id: 'vehicles', label: 'Vehicles' },
      { id: 'ratings', label: 'Ratings' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'transactions', label: 'Transactions' },
      { id: 'reimbursements', label: 'Reimbursements' },
    ],
  },
];

function getStatusTone(status) {
  const map = { LIVE: 'live', MATCHED: 'matched', PENDING: 'warn', COMPLETED: 'completed', CANCELLED: 'cancelled' };
  return map[status] || 'matched';
}

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [activeNav, setActiveNav] = useState('overview');
  const [rides] = useState(MOCK_RIDES);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    api.get('/organisations')
      .then(res => {
        setOrgs(res.data || []);
        if (res.data?.[0]) setSelectedOrg(res.data[0]);
      })
      .catch(() => setOrgs([]));
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-sans)', background: 'var(--asphalt-50)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px',
        flexShrink: 0,
        background: 'var(--ink-950)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        overflowY: 'auto',
        zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <svg width="32" height="32" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="14" fill="var(--voltage-400)" />
              <path d="M22 8C16.477 8 12 12.477 12 18C12 24 22 36 22 36C22 36 32 24 32 18C32 12.477 27.523 8 22 8Z" fill="var(--ink-950)" />
              <circle cx="22" cy="18" r="4" fill="var(--voltage-400)" />
            </svg>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>waypoint</span>
          </div>

          {/* Org selector */}
          <div style={{
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
          }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '3px' }}>
              Organization
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <WpIcon name="building" size={14} color="rgba(255,255,255,0.7)" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                {selectedOrg?.name || orgs[0]?.name || 'Acme Corp'}
              </span>
            </div>
          </div>
        </div>

        {/* Nav sections */}
        <nav style={{ flex: 1, padding: '12px 12px' }}>
          {NAV_SECTIONS.map(section => (
            <div key={section.label} style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-mono)', marginBottom: '6px', padding: '0 8px' }}>
                {section.label}
              </div>
              {section.items.map(item => {
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveNav(item.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 400,
                      fontFamily: 'var(--font-sans)',
                      textAlign: 'left',
                      marginBottom: '2px',
                      transition: 'all 0.12s',
                    }}
                  >
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.live && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: 'var(--voltage-400)', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--voltage-400)' }} />
                        LIVE
                      </span>
                    )}
                    {item.badge && !item.live && (
                      <span style={{
                        minWidth: '20px',
                        height: '20px',
                        borderRadius: '10px',
                        background: item.danger ? 'var(--danger-600)' : 'rgba(255,255,255,0.15)',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 5px',
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom settings */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={logout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.45)',
              fontSize: '13px',
              fontFamily: 'var(--font-sans)',
              textAlign: 'left',
            }}
          >
            <WpIcon name="settings" size={16} color="rgba(255,255,255,0.45)" />
            Settings
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top bar */}
        <div style={{
          background: '#fff',
          borderBottom: '1px solid var(--asphalt-200)',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}>
          {/* Search */}
          <div style={{
            flex: 1,
            maxWidth: '360px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 16px',
            border: '1.5px solid var(--asphalt-200)',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--asphalt-50)',
          }}>
            <WpIcon name="search" size={16} color="var(--asphalt-400)" />
            <input
              type="text"
              placeholder="Search rides, drivers, employees…"
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '14px',
                fontFamily: 'var(--font-sans)',
                color: 'var(--asphalt-800)',
              }}
            />
          </div>

          <div style={{ flex: 1 }} />

          {/* Add ride button */}
          <button style={{
            padding: '10px 20px',
            background: 'var(--ink-600)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-pill)',
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <WpIcon name="plus" size={16} color="#fff" />
            Add ride
          </button>

          {/* Avatar */}
          <WpAvatar
            initials={(currentUser?.name || 'Admin').split(' ').map(n => n[0]).join('').slice(0, 2)}
            size={36}
            tone="ink"
          />
        </div>

        {/* Page content */}
        <div style={{ padding: '28px', flex: 1 }}>
          {/* Page header */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--asphalt-900)', marginBottom: '4px' }}>
              Today's overview
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>{today}</p>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <StatCard
              label="Active rides"
              value="128"
              change="↑12% from yesterday"
              changeUp
              iconBg="var(--ink-50)"
              icon={<WpIcon name="car" size={16} color="var(--ink-600)" />}
            />
            <StatCard
              label="Pool fill rate"
              value="76%"
              change="↑4pts from last week"
              changeUp
              iconBg="var(--voltage-100)"
              icon={<WpIcon name="users" size={16} color="var(--voltage-700)" />}
            />
            <StatCard
              label="CO₂ saved"
              value="412 kg"
              change="↑18% this month"
              changeUp
              iconBg="var(--success-100)"
              icon={<WpIcon name="leaf" size={16} color="var(--success-700)" />}
            />
            <StatCard
              label="SOS incidents"
              value="2"
              change="Needs attention"
              changeUp={false}
              danger
              iconBg="var(--danger-100)"
              icon={<WpIcon name="shield" size={16} color="var(--danger-600)" />}
            />
          </div>

          {/* Charts + Safety */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '16px', marginBottom: '24px' }}>
            {/* Bar chart */}
            <div style={{
              background: '#fff',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              border: '1px solid var(--asphalt-200)',
              boxShadow: 'var(--shadow-1)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--asphalt-900)' }}>Ride volume</h3>
                  <p style={{ fontSize: '11px', color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>Last 14 days</p>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--ink-600)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '2px', background: 'var(--ink-600)', display: 'inline-block' }} />
                    Rides
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--voltage-600)' }}>
                    <span style={{ width: 10, height: 2, background: 'var(--voltage-400)', display: 'inline-block' }} />
                    CO₂ saved
                  </span>
                </div>
              </div>
              <BarChart data={RIDE_DATA} labels={DAYS} showLine />
            </div>

            {/* Safety panel */}
            <div style={{
              background: '#fff',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              border: '1px solid var(--asphalt-200)',
              boxShadow: 'var(--shadow-1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--asphalt-900)', marginBottom: '4px' }}>Safety</h3>

              {/* Active SOS */}
              <div style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--danger-500)',
                background: 'var(--danger-100)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <WpPill tone="sos">SOS Active</WpPill>
                  <span style={{ fontSize: '10px', color: 'var(--danger-700)', fontFamily: 'var(--font-mono)' }}>2 min ago</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--danger-800)', fontFamily: 'var(--font-sans)' }}>
                  Meera Nair · Route R-042
                </div>
                <div style={{ fontSize: '11px', color: 'var(--danger-700)', fontFamily: 'var(--font-mono)', marginTop: '3px' }}>
                  Koramangala → Whitefield
                </div>
                <button style={{
                  marginTop: '10px',
                  width: '100%',
                  padding: '8px',
                  background: 'var(--danger-600)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                }}>
                  Respond now
                </button>
              </div>

              {/* Backup needed */}
              <div style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--warning-500)',
                background: 'var(--warning-100)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <WpPill tone="warn">Backup Needed</WpPill>
                  <span style={{ fontSize: '10px', color: 'var(--warning-700)', fontFamily: 'var(--font-mono)' }}>15 min ago</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--asphalt-900)', fontFamily: 'var(--font-sans)' }}>
                  Route R-018 uncovered
                </div>
                <div style={{ fontSize: '11px', color: 'var(--warning-700)', fontFamily: 'var(--font-mono)', marginTop: '3px' }}>
                  3 riders need a driver
                </div>
              </div>
            </div>
          </div>

          {/* Active rides table */}
          <div style={{
            background: '#fff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--asphalt-200)',
            boxShadow: 'var(--shadow-1)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--asphalt-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--asphalt-900)' }}>Active rides</h3>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--asphalt-400)' }}>{rides.length} total</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--asphalt-50)' }}>
                    {['Route', 'Driver', 'Riders', 'Status', 'ETA', 'Fare'].map(col => (
                      <th key={col} style={{
                        padding: '10px 16px',
                        textAlign: 'left',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '.06em',
                        textTransform: 'uppercase',
                        color: 'var(--asphalt-400)',
                        borderBottom: '1px solid var(--asphalt-100)',
                        whiteSpace: 'nowrap',
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rides.map((ride, i) => (
                    <tr
                      key={ride.id}
                      style={{
                        borderBottom: i < rides.length - 1 ? '1px solid var(--asphalt-100)' : 'none',
                        transition: 'background 0.1s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--asphalt-50)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 500, color: 'var(--asphalt-900)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ride.route}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--asphalt-700)' }}>{ride.driver}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--asphalt-700)' }}>
                          <WpIcon name="users" size={14} color="var(--asphalt-400)" />
                          {ride.riders}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <WpPill tone={getStatusTone(ride.status)}>{ride.status}</WpPill>
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', color: 'var(--asphalt-600)', fontSize: '12px' }}>
                        {ride.eta}
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ink-700)' }}>
                        {ride.fare}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
