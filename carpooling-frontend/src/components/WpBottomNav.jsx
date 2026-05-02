import React from 'react';
import WpIcon from './WpIcon';

const tabs = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'rides', label: 'Rides', icon: 'car' },
  { id: 'chat', label: 'Chat', icon: 'message' },
  { id: 'you', label: 'You', icon: 'user' },
];

export default function WpBottomNav({ active, onTap }) {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '390px',
        background: '#fff',
        borderTop: '1px solid var(--asphalt-100)',
        display: 'flex',
        alignItems: 'center',
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        zIndex: 200,
        boxShadow: '0 -4px 16px rgba(13,18,64,0.06)',
      }}
    >
      {tabs.map(tab => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTap && onTap(tab.id)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '10px 0',
              color: isActive ? 'var(--ink-600)' : 'var(--asphalt-400)',
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              fontWeight: isActive ? 700 : 500,
              transition: 'color 0.15s',
              position: 'relative',
            }}
          >
            {isActive && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '32px',
                height: '3px',
                background: 'var(--ink-600)',
                borderRadius: '0 0 3px 3px',
              }} />
            )}
            <WpIcon name={tab.icon} size={22} color={isActive ? 'var(--ink-600)' : 'var(--asphalt-400)'} stroke={isActive ? 2 : 1.75} />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
