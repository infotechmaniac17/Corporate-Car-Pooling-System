import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WpIcon from './WpIcon';
import WpAvatar from './WpAvatar';

const RIDER_NAV = [
  { id: 'home',     label: 'Home',       icon: 'home',    path: '/home' },
  { id: 'match',    label: 'Find a ride', icon: 'search',  path: '/match' },
  { id: 'payments', label: 'Payments',    icon: 'wallet',  path: '/payments' },
  { id: 'profile',  label: 'Profile',     icon: 'user',    path: '/profile' },
];

const DRIVER_NAV = [
  { id: 'home',       label: 'Home',       icon: 'home',        path: '/home' },
  { id: 'offer',      label: 'Offer ride', icon: 'plus',        path: '/driver/offer-ride' },
  { id: 'my-rides',   label: 'My rides',   icon: 'car',         path: '/driver/my-rides' },
  { id: 'inbox',      label: 'Requests',   icon: 'bell',        path: '/driver/inbox' },
  { id: 'vehicles',   label: 'Vehicles',   icon: 'settings',    path: '/driver/vehicles' },
  { id: 'profile',    label: 'Profile',    icon: 'user',        path: '/profile' },
];

export default function AppShell({ children }) {
  const { currentUser, isDriver, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const navItems = isDriver ? DRIVER_NAV : RIDER_NAV;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-sans)', background: 'var(--asphalt-50)' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'var(--ink-950)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, bottom: 0, left: 0,
        overflowY: 'auto', zIndex: 50,
      }}>
        {/* Logo + role label */}
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
            {isDriver ? 'Driver portal' : 'Rider portal'}
          </span>
        </div>

        {/* Nav items */}
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

        {/* User info + sign out */}
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
                {isDriver ? 'DRIVER' : 'RIDER'}
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

      {/* ── Content area ────────────────────────────────────────────────────── */}
      <main style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
