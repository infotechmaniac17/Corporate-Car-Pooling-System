import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WpIcon from './WpIcon';
import WpAvatar from './WpAvatar';
import { getUnreadCount, getMyNotifications, markAllRead } from '../api/notifications';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const RIDER_NAV = [
  { id: 'home',     label: 'Home',        icon: 'home',    path: '/home' },
  { id: 'match',    label: 'Find a ride', icon: 'search',  path: '/trips' },
  { id: 'trips',    label: 'My trips',    icon: 'car',     path: '/my-trips' },
  { id: 'payments', label: 'Payments',    icon: 'wallet',  path: '/payments' },
  { id: 'profile',  label: 'Profile',     icon: 'user',    path: '/profile' },
];

const DRIVER_NAV = [
  { id: 'home',     label: 'Home',       icon: 'home',     path: '/home' },
  { id: 'offer',    label: 'Offer ride', icon: 'plus',     path: '/driver/offer-ride' },
  { id: 'my-rides', label: 'My rides',   icon: 'car',      path: '/driver/my-rides' },
  { id: 'inbox',    label: 'Requests',   icon: 'bell',     path: '/driver/inbox' },
  { id: 'backup',   label: 'Backup',     icon: 'clock',    path: '/driver/backup-rides' },
  { id: 'vehicles', label: 'Vehicles',   icon: 'settings', path: '/driver/vehicles' },
  { id: 'profile',  label: 'Profile',    icon: 'user',     path: '/profile' },
];

function ModeSwitchPill({ activeMode, onSwitch, blocked }) {
  const isDriver = activeMode === 'driver';
  const pillStyle = (selected) => ({
    flex: 1, padding: '6px 0', borderRadius: 999, border: 'none',
    cursor: blocked ? 'not-allowed' : 'pointer',
    background: selected ? 'var(--voltage-400)' : 'transparent',
    color: selected ? 'var(--ink-950)' : 'rgba(255,255,255,0.5)',
    fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-sans)',
    transition: 'all 0.15s',
    opacity: blocked && !selected ? 0.4 : 1,
  });

  return (
    <div style={{
      display: 'flex', background: 'rgba(255,255,255,0.08)',
      borderRadius: 999, padding: 3, margin: '12px 12px 0',
    }}>
      <button
        style={pillStyle(!isDriver)}
        onClick={() => onSwitch('rider')}
        title={blocked ? 'Cannot switch during an active trip' : ''}
      >
        Rider
      </button>
      <button
        style={pillStyle(isDriver)}
        onClick={() => onSwitch('driver')}
        title={blocked ? 'Cannot switch during an active trip' : ''}
      >
        Driver
      </button>
    </div>
  );
}

export default function AppShell({ children, activityState }) {
  const { currentUser, isBothRole, activeMode, setActiveMode, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const hasInProgressTrip = activityState?.hasInProgressTrip ?? false;
  const navItems = activeMode === 'driver' ? DRIVER_NAV : RIDER_NAV;
  const roleLabel = activeMode === 'driver' ? 'DRIVER' : 'RIDER';

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(false);

  useEffect(() => {
    const fetchCount = () => getUnreadCount().then(r => setUnreadCount(r.data?.data?.count ?? 0)).catch(() => {});
    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, []);

  // WS: increment badge on real-time notification push
  useEffect(() => {
    if (!currentUser?.id) return;
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8081/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/user/${currentUser.id}/notifications`, () => {
          setUnreadCount(c => c + 1);
        });
      },
    });
    client.activate();
    return () => client.deactivate();
  }, [currentUser?.id]);

  const openNotifs = async () => {
    setNotifOpen(o => !o);
    if (!notifOpen) {
      setNotifsLoading(true);
      try {
        const r = await getMyNotifications();
        setNotifs(r.data?.data || []);
        if (unreadCount > 0) {
          await markAllRead();
          setUnreadCount(0);
        }
      } finally {
        setNotifsLoading(false);
      }
    }
  };

  const handleModeSwitch = (mode) => {
    if (mode === activeMode || hasInProgressTrip) return;
    setActiveMode(mode);
    navigate('/home');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-sans)', background: 'var(--asphalt-50)' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside style={{
        width: 220, flexShrink: 0, background: 'var(--ink-950)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, bottom: 0, left: 0, overflowY: 'auto', zIndex: 150,
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <svg width="32" height="32" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="14" fill="var(--voltage-400)" />
              <path d="M22 8C16.477 8 12 12.477 12 18C12 24 22 36 22 36C22 36 32 24 32 18C32 12.477 27.523 8 22 8Z" fill="var(--ink-950)" />
              <circle cx="22" cy="18" r="4" fill="var(--voltage-400)" />
            </svg>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>waypoint</span>
          </div>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            {roleLabel} portal
          </span>
        </div>

        {/* Mode switcher pill — BOTH role only */}
        {isBothRole && (
          <ModeSwitchPill
            activeMode={activeMode}
            onSwitch={handleModeSwitch}
            blocked={hasInProgressTrip}
          />
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: 12 }}>
          {navItems.map(item => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 'var(--radius-md)',
                  background: isActive ? 'var(--voltage-400)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  color: isActive ? 'var(--ink-950)' : 'rgba(255,255,255,0.6)',
                  fontSize: 14, fontWeight: isActive ? 700 : 500,
                  fontFamily: 'var(--font-sans)', textAlign: 'left',
                  marginBottom: 4, transition: 'all 0.1s',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; } }}
              >
                <WpIcon name={item.icon} size={18} color="currentColor" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Notifications */}
        <div style={{ padding: '0 12px', marginBottom: 4 }}>
          <button
            onClick={openNotifs}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 'var(--radius-md)',
              background: notifOpen ? 'rgba(255,255,255,0.07)' : 'transparent',
              border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)', fontSize: 14, fontFamily: 'var(--font-sans)', textAlign: 'left',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { if (!notifOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; } }}
          >
            <div style={{ position: 'relative' }}>
              <WpIcon name="bell" size={18} color="currentColor" />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%', background: 'var(--voltage-400)', color: 'var(--ink-950)', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            Notifications
          </button>
        </div>

        {/* User + sign out */}
        <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 4 }}>
            <WpAvatar
              initials={(currentUser?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
              size={30}
              tone="ink"
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser?.name || 'User'}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                {roleLabel}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'var(--font-sans)', textAlign: 'left' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
          >
            <WpIcon name="settings" size={15} color="currentColor" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <main style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {children}
      </main>

      {/* ── Notifications panel ─────────────────────────────────────────── */}
      {notifOpen && (
        <>
          <div onClick={() => setNotifOpen(false)} style={{ position: 'fixed', top: 0, bottom: 0, left: 220, right: 0, zIndex: 99 }} />
          <div style={{
            position: 'fixed', left: 232, bottom: 60, zIndex: 100,
            background: '#fff', borderRadius: 'var(--radius-xl)', width: 360,
            boxShadow: '0 16px 48px rgba(7,10,38,0.18)', border: '1px solid var(--asphalt-100)',
            maxHeight: 480, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--asphalt-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--asphalt-900)' }}>Notifications</span>
              <button onClick={() => setNotifOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--asphalt-400)', fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {notifsLoading ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--asphalt-400)', fontSize: 13 }}>Loading…</div>
              ) : notifs.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--asphalt-400)', fontSize: 13 }}>No notifications yet</div>
              ) : (
                notifs.map(n => (
                  <div key={n.id} style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--asphalt-50)',
                    background: n.isRead ? '#fff' : 'var(--ink-50)',
                    cursor: n.rideId ? 'pointer' : 'default',
                  }}
                    onClick={() => n.rideId && navigate(`/tracking/${n.rideId}`)}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--asphalt-900)', marginBottom: 2 }}>{n.title}</div>
                    {n.body && <div style={{ fontSize: 12, color: 'var(--asphalt-500)' }}>{n.body}</div>}
                    <div style={{ fontSize: 11, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                      {n.createdAt ? new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
