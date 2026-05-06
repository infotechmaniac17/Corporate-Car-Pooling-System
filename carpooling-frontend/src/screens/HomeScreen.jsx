import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WpAppBar from '../components/WpAppBar';
import WpButton from '../components/WpButton';
import WpBottomNav from '../components/WpBottomNav';
import WpPill from '../components/WpPill';
import WpIcon from '../components/WpIcon';
import useIsDesktop from '../hooks/useIsDesktop';
import { getMyRequests, getSchedule, getDriverRequests } from '../api/rides';

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

// ─── Shared sub-components ────────────────────────────────────────────────────

function RideCard({ ride, onClick }) {
  return (
    <div
      onClick={onClick}
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
  );
}

function StatCard({ icon, iconBg, iconColor, label, value, unit }) {
  return (
    <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '16px', boxShadow: 'var(--shadow-1)', border: '1px solid var(--asphalt-100)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <WpIcon name={icon} size={15} color={iconColor} />
        </div>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--asphalt-500)', fontFamily: 'var(--font-sans)' }}>{label}</span>
      </div>
      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--asphalt-900)', fontFamily: 'var(--font-sans)' }}>
        {value} {unit && <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--asphalt-400)' }}>{unit}</span>}
      </div>
    </div>
  );
}

function QuickAction({ icon, label, onClick, accent = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 8, padding: '16px 8px', borderRadius: 'var(--radius-lg)',
        background: accent ? 'var(--ink-950)' : '#fff',
        border: accent ? 'none' : '1px solid var(--asphalt-100)',
        boxShadow: 'var(--shadow-1)', cursor: 'pointer', flex: 1,
      }}
    >
      <WpIcon name={icon} size={22} color={accent ? 'var(--voltage-400)' : 'var(--ink-700)'} />
      <span style={{ fontSize: 12, fontWeight: 600, color: accent ? '#fff' : 'var(--asphalt-700)', fontFamily: 'var(--font-sans)' }}>{label}</span>
    </button>
  );
}

// ─── Rider Home ───────────────────────────────────────────────────────────────

function RiderHome({ activityState }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('home');

  const firstName = currentUser?.name?.split(' ')[0] || 'there';
  const { hasActiveSchedule } = activityState || {};
  const riderBlocked = hasActiveSchedule;

  useEffect(() => {
    getMyRequests()
      .then(res => setRides(res.data?.data || []))
      .catch(() => setRides([]))
      .finally(() => setLoading(false));
  }, []);

  const upcomingRides = rides.filter(r =>
    r.status === 'PENDING' || r.status === 'MATCHED' || r.status === 'ACCEPTED'
  ).slice(0, 3);

  const completedCount = rides.filter(r => r.status === 'COMPLETED').length;
  const co2Saved = completedCount * 2.4;
  const moneySaved = completedCount * 145;

  const handleTabTap = (t) => {
    setTab(t);
    if (t === 'rides') navigate('/match');
    if (t === 'payments') navigate('/payments');
    if (t === 'chat') currentUser?.activeRideId && navigate(`/chat/${currentUser.activeRideId}`);
    if (t === 'you') navigate('/profile');
  };

  const CommuteCard = () => (
    <div style={{
      background: 'var(--ink-950)',
      borderRadius: 'var(--radius-2xl)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-3)',
      position: 'relative',
    }}>
      <svg style={{ position: 'absolute', top: 0, right: 0, opacity: 0.12 }} width="180" height="140" viewBox="0 0 180 140" fill="none">
        <path d="M 160 20 Q 120 50 90 70 Q 60 90 20 120" stroke="var(--voltage-400)" strokeWidth="3" strokeDasharray="8 4" fill="none" />
        <circle cx="160" cy="20" r="6" fill="var(--ink-400)" />
        <rect x="14" y="114" width="12" height="12" rx="2" fill="var(--voltage-400)" />
      </svg>
      <div style={{ padding: '20px 20px 8px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-300)', fontFamily: 'var(--font-mono)' }}>
          Today's commute
        </span>
      </div>
      <div style={{ padding: '8px 20px 20px' }}>
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
        {riderBlocked && (
          <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'rgba(255,200,0,0.15)', border: '1px solid rgba(255,200,0,0.3)', color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'var(--font-sans)', marginBottom: 12 }}>
            Active driver ride scheduled — cancel it to request a ride.
          </div>
        )}
        <WpButton kind="accent" size="md" full onClick={() => !riderBlocked && navigate('/match')} disabled={riderBlocked}>
          <WpIcon name="search" size={18} color="var(--ink-950)" />
          Find a ride
        </WpButton>
      </div>
    </div>
  );

  const StatsRow = ({ compact = false }) => (
    <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr 1fr' : '1fr 1fr 1fr', gap: '10px' }}>
      <StatCard icon="leaf" iconBg="var(--success-100)" iconColor="var(--success-700)" label="CO₂ Saved" value={co2Saved.toFixed(1)} unit="kg" />
      <StatCard icon="wallet" iconBg="var(--ink-50)" iconColor="var(--ink-600)" label="Money Saved" value={`₹${moneySaved}`} unit="/mo" />
      {!compact && (
        <StatCard icon="car" iconBg="var(--voltage-50, #f5ffe0)" iconColor="var(--ink-600)" label="Total Rides" value={completedCount} />
      )}
    </div>
  );

  const UpcomingSection = () => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--asphalt-900)', fontFamily: 'var(--font-sans)' }}>Upcoming</h2>
        <button onClick={() => navigate('/match')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--ink-600)', fontFamily: 'var(--font-sans)' }}>
          See all
        </button>
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2].map(i => (
            <div key={i} style={{ height: '88px', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(90deg, var(--asphalt-100) 25%, var(--asphalt-50) 50%, var(--asphalt-100) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
          ))}
        </div>
      ) : upcomingRides.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '28px 20px', textAlign: 'center', border: '1.5px dashed var(--asphalt-200)' }}>
          <WpIcon name="car" size={32} color="var(--asphalt-300)" />
          <p style={{ fontSize: '14px', color: 'var(--asphalt-500)', marginTop: '10px', fontFamily: 'var(--font-sans)' }}>No upcoming rides</p>
          <button onClick={() => navigate('/match')} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-600)', background: 'none', border: 'none', cursor: 'pointer', marginTop: '6px', fontFamily: 'var(--font-sans)' }}>
            Find a ride →
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {upcomingRides.map(ride => (
            <RideCard key={ride.id} ride={ride} onClick={() => navigate(`/tracking/${ride.rideId || ride.id}`)} />
          ))}
        </div>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)' }}>
        <div style={{ padding: '32px 40px 0' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--asphalt-900)', fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em' }}>
            Hi, {firstName}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {getDayTime()}
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', padding: '24px 40px 40px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <CommuteCard />
            <StatsRow />
          </div>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', padding: '24px', boxShadow: 'var(--shadow-2)', border: '1px solid var(--asphalt-100)' }}>
            <UpcomingSection />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', paddingBottom: '80px' }}>
      <WpAppBar
        title={`Hi, ${firstName}`}
        sub={getDayTime()}
        dark
        trailing={
          <button onClick={() => {}} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
            <WpIcon name="bell" size={22} color="rgba(255,255,255,0.7)" />
            <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: 'var(--voltage-400)', borderRadius: '50%', border: '1.5px solid var(--ink-950)' }} />
          </button>
        }
      />
      <div style={{ margin: '16px' }}><CommuteCard /></div>
      <div style={{ margin: '0 16px 20px' }}><StatsRow compact /></div>
      <div style={{ margin: '0 16px' }}><UpcomingSection /></div>
      <WpBottomNav active={tab} onTap={handleTabTap} />
    </div>
  );
}

// ─── Driver Home ──────────────────────────────────────────────────────────────

function DriverHome({ activityState }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [schedule, setSchedule] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('home');

  const firstName = currentUser?.name?.split(' ')[0] || 'there';
  const { hasOpenRequest } = activityState || {};

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getSchedule(currentUser.id);
        const schedules = res.data?.data || res.data || [];
        const active = Array.isArray(schedules)
          ? schedules.find(s => s.status === 'SCHEDULED' || s.status === 'LIVE')
          : schedules;
        setSchedule(active || null);

        if (active?.rideId || active?.id) {
          const rideId = active.rideId || active.id;
          const reqRes = await getDriverRequests(rideId);
          const reqs = reqRes.data || [];
          setPendingRequests(reqs.filter(r => !r.status || r.status === 'PENDING'));
        }
      } catch {
        setSchedule(null);
      }
      setLoading(false);
    };
    load();
  }, [currentUser.id]);

  const handleTabTap = (t) => {
    setTab(t);
    if (t === 'offer') navigate('/driver/offer-ride');
    if (t === 'my-rides') navigate('/driver/my-rides');
    if (t === 'inbox') navigate('/driver/inbox');
    if (t === 'payments') navigate('/payments');
    if (t === 'you') navigate('/profile');
  };

  const OfferCard = () => {
    if (loading) {
      return <div style={{ height: 160, borderRadius: 'var(--radius-2xl)', background: 'linear-gradient(90deg, var(--asphalt-100) 25%, var(--asphalt-50) 50%, var(--asphalt-100) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />;
    }

    if (schedule) {
      const timeStr = schedule.scheduledTime
        ? new Date(schedule.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '8:30 AM';
      const isLive = schedule.status === 'LIVE';
      return (
        <div style={{
          background: isLive ? 'var(--success-700)' : 'var(--ink-950)',
          borderRadius: 'var(--radius-2xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-3)',
          position: 'relative',
        }}>
          <svg style={{ position: 'absolute', top: 0, right: 0, opacity: 0.1 }} width="180" height="140" viewBox="0 0 180 140" fill="none">
            <path d="M 160 20 Q 120 50 90 70 Q 60 90 20 120" stroke="var(--voltage-400)" strokeWidth="3" strokeDasharray="8 4" fill="none" />
          </svg>
          <div style={{ padding: '20px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: isLive ? 'rgba(255,255,255,0.7)' : 'var(--ink-300)', fontFamily: 'var(--font-mono)' }}>
              {isLive ? 'Live ride' : "Today's schedule"}
            </span>
            {isLive && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 0 3px rgba(74,222,128,0.3)' }} />
                IN PROGRESS
              </span>
            )}
          </div>
          <div style={{ padding: '8px 20px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--ink-400)', border: '2px solid var(--ink-200)' }} />
                <div style={{ width: 1.5, height: 24, backgroundImage: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.3) 0, rgba(255,255,255,0.3) 4px, transparent 4px, transparent 8px)' }} />
                <div style={{ width: 10, height: 10, borderRadius: '2px', background: 'var(--voltage-400)' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', fontFamily: 'var(--font-sans)' }}>
                    {schedule.pickupLocation || 'Home'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>Pickup · {timeStr}</div>
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', fontFamily: 'var(--font-sans)' }}>
                    {schedule.dropoffLocation || 'Office'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>Drop · available seats: {schedule.availableSeats ?? '—'}</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <WpButton kind="accent" size="md" full onClick={() => navigate('/driver/inbox')}>
                <WpIcon name="inbox" size={16} color="var(--ink-950)" />
                View requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
              </WpButton>
              <WpButton kind="ghost" size="md" onClick={() => navigate('/driver/my-rides')} style={{ flexShrink: 0 }}>
                Manage
              </WpButton>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{
        background: 'var(--ink-950)',
        borderRadius: 'var(--radius-2xl)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-3)',
        position: 'relative',
      }}>
        <svg style={{ position: 'absolute', top: 0, right: 0, opacity: 0.12 }} width="180" height="140" viewBox="0 0 180 140" fill="none">
          <path d="M 160 20 Q 120 50 90 70 Q 60 90 20 120" stroke="var(--voltage-400)" strokeWidth="3" strokeDasharray="8 4" fill="none" />
          <circle cx="160" cy="20" r="6" fill="var(--ink-400)" />
          <rect x="14" y="114" width="12" height="12" rx="2" fill="var(--voltage-400)" />
        </svg>
        <div style={{ padding: '20px 20px 8px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-300)', fontFamily: 'var(--font-mono)' }}>
            No ride today
          </span>
        </div>
        <div style={{ padding: '8px 20px 20px' }}>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-sans)', marginBottom: 16 }}>
            Share your commute and earn while you drive.
          </p>
          {hasOpenRequest && (
            <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'rgba(255,200,0,0.15)', border: '1px solid rgba(255,200,0,0.3)', color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'var(--font-sans)', marginBottom: 12 }}>
              Active rider request — cancel it to offer a ride.
            </div>
          )}
          <WpButton kind="accent" size="md" full onClick={() => !hasOpenRequest && navigate('/driver/offer-ride')} disabled={!!hasOpenRequest}>
            <WpIcon name="plus" size={18} color="var(--ink-950)" />
            Offer a ride
          </WpButton>
        </div>
      </div>
    );
  };

  const PendingRequestsBanner = () => {
    if (!schedule || pendingRequests.length === 0) return null;
    return (
      <div
        onClick={() => navigate('/driver/inbox')}
        style={{
          background: 'var(--warning-50, #fffbeb)', border: '1px solid var(--warning-200, #fde68a)',
          borderRadius: 'var(--radius-lg)', padding: '14px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', boxShadow: 'var(--shadow-1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--warning-100, #fef3c7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <WpIcon name="users" size={18} color="var(--warning-700, #b45309)" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--asphalt-900)', fontFamily: 'var(--font-sans)' }}>
              {pendingRequests.length} rider{pendingRequests.length > 1 ? 's' : ''} waiting
            </div>
            <div style={{ fontSize: 11, color: 'var(--asphalt-500)', fontFamily: 'var(--font-mono)' }}>Tap to accept or decline</div>
          </div>
        </div>
        <WpIcon name="chevron-right" size={18} color="var(--asphalt-400)" />
      </div>
    );
  };

  const EarningsCard = () => (
    <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', padding: '20px', boxShadow: 'var(--shadow-1)', border: '1px solid var(--asphalt-100)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--asphalt-900)', fontFamily: 'var(--font-sans)' }}>This month</h2>
        <button onClick={() => navigate('/payments')} style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-600)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          See all
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <StatCard icon="wallet" iconBg="var(--success-100)" iconColor="var(--success-700)" label="Earned" value="₹2,840" />
        <StatCard icon="car" iconBg="var(--ink-50)" iconColor="var(--ink-600)" label="Rides given" value="18" />
        <StatCard icon="leaf" iconBg="var(--voltage-50, #f5ffe0)" iconColor="var(--ink-600)" label="CO₂ saved" value="43.2" unit="kg" />
      </div>
    </div>
  );

  const QuickActions = () => (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--asphalt-900)', fontFamily: 'var(--font-sans)', marginBottom: 12 }}>Quick actions</h2>
      <div style={{ display: 'flex', gap: 10 }}>
        <QuickAction icon="plus" label="Offer ride" onClick={() => navigate('/driver/offer-ride')} accent />
        <QuickAction icon="inbox" label="Inbox" onClick={() => navigate('/driver/inbox')} />
        <QuickAction icon="list" label="My rides" onClick={() => navigate('/driver/my-rides')} />
        <QuickAction icon="car" label="Vehicles" onClick={() => navigate('/driver/vehicles')} />
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)' }}>
        <div style={{ padding: '32px 40px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--asphalt-900)', fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em' }}>
                Hi, {firstName}
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {getDayTime()} · Driver mode
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'var(--ink-950)', borderRadius: 999 }}>
              <WpIcon name="car" size={14} color="var(--voltage-400)" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)', letterSpacing: '.05em' }}>DRIVER</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', padding: '24px 40px 40px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <OfferCard />
            <PendingRequestsBanner />
            <EarningsCard />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', padding: '24px', boxShadow: 'var(--shadow-2)', border: '1px solid var(--asphalt-100)' }}>
              <QuickActions />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', paddingBottom: '80px' }}>
      <WpAppBar
        title={`Hi, ${firstName}`}
        sub={`${getDayTime()} · Driver`}
        dark
        trailing={
          <button onClick={() => {}} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
            <WpIcon name="bell" size={22} color="rgba(255,255,255,0.7)" />
            {pendingRequests.length > 0 && (
              <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: 'var(--voltage-400)', borderRadius: '50%', border: '1.5px solid var(--ink-950)' }} />
            )}
          </button>
        }
      />

      <div style={{ margin: '16px' }}><OfferCard /></div>
      <div style={{ margin: '0 16px 16px' }}><PendingRequestsBanner /></div>

      <div style={{ margin: '0 16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <StatCard icon="wallet" iconBg="var(--success-100)" iconColor="var(--success-700)" label="Earned (month)" value="₹2,840" />
          <StatCard icon="car" iconBg="var(--ink-50)" iconColor="var(--ink-600)" label="Rides given" value="18" />
        </div>
      </div>

      <div style={{ margin: '0 16px 20px' }}>
        <QuickActions />
      </div>

      <WpBottomNav active={tab} onTap={handleTabTap} />
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function HomeScreen({ activityState }) {
  const { activeMode } = useAuth();
  return activeMode === 'driver'
    ? <DriverHome activityState={activityState} />
    : <RiderHome activityState={activityState} />;
}
