import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WpAppBar from '../components/WpAppBar';
import WpButton from '../components/WpButton';
import WpBottomNav from '../components/WpBottomNav';
import WpPill from '../components/WpPill';
import WpIcon from '../components/WpIcon';
import { getMyRequests } from '../api/rides';

function getDayTime() {
  const now = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const day = days[now.getDay()];
  const h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = (h % 12) || 12;
  return `${day} · ${h12}:${m} ${ampm}`;
}

function getStatusTone(status) {
  const map = { PENDING: 'warn', MATCHED: 'matched', ACCEPTED: 'live', COMPLETED: 'completed', CANCELLED: 'cancelled' };
  return map[status] || 'matched';
}

export default function HomeScreen() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('home');

  const firstName = currentUser?.name?.split(' ')[0] || 'there';

  useEffect(() => {
    getMyRequests()
      .then(res => setRides(res.data || []))
      .catch(() => setRides([]))
      .finally(() => setLoading(false));
  }, []);

  const upcomingRides = rides.filter(r =>
    r.status === 'PENDING' || r.status === 'MATCHED' || r.status === 'ACCEPTED'
  ).slice(0, 3);

  const co2Saved = rides.filter(r => r.status === 'COMPLETED').length * 2.4;
  const moneySaved = rides.filter(r => r.status === 'COMPLETED').length * 145;

  const handleTabTap = (t) => {
    setTab(t);
    if (t === 'rides') navigate('/match');
    if (t === 'chat') currentUser?.activeRideId && navigate(`/chat/${currentUser.activeRideId}`);
    if (t === 'you') navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', paddingBottom: '80px' }}>
      <WpAppBar
        title={`Hi, ${firstName}`}
        sub={getDayTime()}
        dark
        trailing={
          <button
            onClick={() => {}}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', position: 'relative' }}
          >
            <WpIcon name="bell" size={22} color="rgba(255,255,255,0.7)" />
            <span style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 8,
              height: 8,
              background: 'var(--voltage-400)',
              borderRadius: '50%',
              border: '1.5px solid var(--ink-950)',
            }} />
          </button>
        }
      />

      <div style={{ padding: '0' }}>
        {/* Today's commute card */}
        <div style={{
          margin: '16px',
          background: 'var(--ink-950)',
          borderRadius: 'var(--radius-2xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-3)',
          position: 'relative',
        }}>
          {/* SVG route illustration */}
          <svg
            style={{ position: 'absolute', top: 0, right: 0, opacity: 0.12 }}
            width="180" height="140" viewBox="0 0 180 140" fill="none"
          >
            <path d="M 160 20 Q 120 50 90 70 Q 60 90 20 120" stroke="var(--voltage-400)" strokeWidth="3" strokeDasharray="8 4" fill="none" />
            <circle cx="160" cy="20" r="6" fill="var(--ink-400)" />
            <rect x="14" y="114" width="12" height="12" rx="2" fill="var(--voltage-400)" />
          </svg>

          <div style={{ padding: '20px 20px 8px' }}>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: 'var(--ink-300)',
              fontFamily: 'var(--font-mono)',
            }}>
              Today's commute
            </span>
          </div>

          <div style={{ padding: '8px 20px 20px' }}>
            {/* Route visualization */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--ink-400)', border: '2px solid var(--ink-200)' }} />
                <div style={{ width: 1.5, height: 28, backgroundImage: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.3) 0, rgba(255,255,255,0.3) 4px, transparent 4px, transparent 8px)' }} />
                <div style={{ width: 10, height: 10, borderRadius: '2px', background: 'var(--voltage-400)' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', fontFamily: 'var(--font-sans)' }}>
                    {currentUser?.pickupLocation || 'Home'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>Pickup · 8:30 AM</div>
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', fontFamily: 'var(--font-sans)' }}>
                    {currentUser?.dropLocation || 'Office'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>Drop · ~9:15 AM</div>
                </div>
              </div>
            </div>

            <WpButton
              kind="accent"
              size="md"
              full
              onClick={() => navigate('/match')}
            >
              <WpIcon name="search" size={18} color="var(--ink-950)" />
              Find a ride
            </WpButton>
          </div>
        </div>

        {/* Stats mini cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '0 16px 20px' }}>
          <div style={{
            background: '#fff',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            boxShadow: 'var(--shadow-1)',
            border: '1px solid var(--asphalt-100)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--success-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <WpIcon name="leaf" size={15} color="var(--success-700)" />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--asphalt-500)', fontFamily: 'var(--font-sans)' }}>CO₂ Saved</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--asphalt-900)', fontFamily: 'var(--font-sans)' }}>
              {co2Saved.toFixed(1)} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--asphalt-400)' }}>kg</span>
            </div>
          </div>
          <div style={{
            background: '#fff',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            boxShadow: 'var(--shadow-1)',
            border: '1px solid var(--asphalt-100)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--ink-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <WpIcon name="wallet" size={15} color="var(--ink-600)" />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--asphalt-500)', fontFamily: 'var(--font-sans)' }}>Money Saved</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--asphalt-900)', fontFamily: 'var(--font-sans)' }}>
              ₹{moneySaved} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--asphalt-400)' }}>/mo</span>
            </div>
          </div>
        </div>

        {/* Upcoming rides */}
        <div style={{ margin: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--asphalt-900)', fontFamily: 'var(--font-sans)' }}>
              Upcoming
            </h2>
            <button
              onClick={() => navigate('/match')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--ink-600)', fontFamily: 'var(--font-sans)' }}
            >
              See all
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1, 2].map(i => (
                <div key={i} style={{
                  height: '88px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(90deg, var(--asphalt-100) 25%, var(--asphalt-50) 50%, var(--asphalt-100) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.4s infinite',
                }} />
              ))}
            </div>
          ) : upcomingRides.length === 0 ? (
            <div style={{
              background: '#fff',
              borderRadius: 'var(--radius-lg)',
              padding: '28px 20px',
              textAlign: 'center',
              border: '1.5px dashed var(--asphalt-200)',
            }}>
              <WpIcon name="car" size={32} color="var(--asphalt-300)" />
              <p style={{ fontSize: '14px', color: 'var(--asphalt-500)', marginTop: '10px', fontFamily: 'var(--font-sans)' }}>No upcoming rides</p>
              <button
                onClick={() => navigate('/match')}
                style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-600)', background: 'none', border: 'none', cursor: 'pointer', marginTop: '6px', fontFamily: 'var(--font-sans)' }}
              >
                Find a ride →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {upcomingRides.map(ride => (
                <div
                  key={ride.id}
                  onClick={() => navigate(`/tracking/${ride.rideId || ride.id}`)}
                  style={{
                    background: '#fff',
                    borderRadius: 'var(--radius-lg)',
                    padding: '14px 16px',
                    boxShadow: 'var(--shadow-1)',
                    border: '1px solid var(--asphalt-100)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--asphalt-900)', fontFamily: 'var(--font-sans)' }}>
                        {ride.pickupLocation || 'Home'} → {ride.dropoffLocation || 'Office'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        {ride.scheduledTime ? new Date(ride.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '8:30 AM'}
                      </div>
                    </div>
                    <WpPill tone={getStatusTone(ride.status)}>{ride.status}</WpPill>
                  </div>
                  {ride.fare && (
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-700)', fontFamily: 'var(--font-mono)' }}>
                      ₹{ride.fare}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <WpBottomNav active={tab} onTap={handleTabTap} />
    </div>
  );
}
