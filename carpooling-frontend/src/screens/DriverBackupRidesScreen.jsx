import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WpAppBar from '../components/WpAppBar';
import WpPill from '../components/WpPill';
import WpIcon from '../components/WpIcon';
import useIsDesktop from '../hooks/useIsDesktop';
import api from '../api/client';

const STATUS_TONE = {
  PENDING: 'matched',
  ACTIVATED: 'live',
  USED: 'completed',
  EXPIRED: 'cancelled',
};

function BackupCard({ item }) {
  const ride = item.rideSchedule;
  const dep = ride?.departureTime ? new Date(ride.departureTime) : null;
  const when = dep
    ? `${dep.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${dep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '—';

  return (
    <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '16px', boxShadow: 'var(--shadow-1)', border: '1px solid var(--asphalt-100)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--asphalt-900)', marginBottom: 3 }}>
            {ride?.pickupLabel || 'Pickup'} → {ride?.dropoffLabel || 'Drop-off'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>{when}</div>
        </div>
        <WpPill tone={STATUS_TONE[item.status] || 'matched'}>{item.status}</WpPill>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <WpIcon name="car" size={13} color="var(--asphalt-500)" />
          <span style={{ fontSize: 12, color: 'var(--asphalt-600)', fontFamily: 'var(--font-mono)' }}>
            Priority #{item.priority}
          </span>
        </div>
        {item.activatedAt && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <WpIcon name="clock" size={13} color="var(--asphalt-500)" />
            <span style={{ fontSize: 12, color: 'var(--asphalt-600)', fontFamily: 'var(--font-mono)' }}>
              Activated {new Date(item.activatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DriverBackupRidesScreen() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/driver/backup-rides')
      .then(r => setItems(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pending = items.filter(i => i.status === 'PENDING');
  const others = items.filter(i => i.status !== 'PENDING');

  const Content = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <p style={{ fontSize: 13, color: 'var(--asphalt-500)', margin: 0 }}>
        Rides where you are assigned as backup driver.
      </p>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2].map(i => (
            <div key={i} style={{ height: 90, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(90deg, var(--asphalt-100) 25%, var(--asphalt-50) 50%, var(--asphalt-100) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '40px 20px', textAlign: 'center', border: '1.5px dashed var(--asphalt-200)' }}>
          <WpIcon name="car" size={36} color="var(--asphalt-300)" />
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--asphalt-600)', marginTop: 12 }}>No backup assignments</p>
          <p style={{ fontSize: 13, color: 'var(--asphalt-400)', marginTop: 4 }}>You have not been assigned as backup on any rides yet</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--asphalt-700)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'var(--font-mono)' }}>
                Upcoming ({pending.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pending.map(i => <BackupCard key={i.id} item={i} />)}
              </div>
            </div>
          )}
          {others.length > 0 && (
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--asphalt-400)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'var(--font-mono)' }}>
                Past
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {others.map(i => <BackupCard key={i.id} item={i} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)' }}>
        <div style={{ padding: '32px 40px 0' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--asphalt-900)', letterSpacing: '-0.02em' }}>Backup assignments</h1>
          <p style={{ fontSize: 13, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>Rides where you stand in as backup</p>
        </div>
        <div style={{ maxWidth: 720, padding: '24px 40px 40px' }}>
          <Content />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', paddingBottom: 40 }}>
      <WpAppBar title="Backup assignments" onBack={() => navigate(-1)} dark />
      <div style={{ padding: 16 }}>
        <Content />
      </div>
    </div>
  );
}
