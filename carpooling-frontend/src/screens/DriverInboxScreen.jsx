import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WpAppBar from '../components/WpAppBar';
import WpBottomNav from '../components/WpBottomNav';
import WpAvatar from '../components/WpAvatar';
import WpPill from '../components/WpPill';
import WpButton from '../components/WpButton';
import WpIcon from '../components/WpIcon';
import useIsDesktop from '../hooks/useIsDesktop';
import { getDriverRequests, getAllDriverRequests, updateRequestStatus } from '../api/rides';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2);
}

function StarRating({ value }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
      <WpIcon name="star" size={12} color="var(--warning-500)" stroke={0} />
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--asphalt-700)', fontFamily: 'var(--font-mono)' }}>
        {value ? value.toFixed(1) : '—'}
      </span>
    </span>
  );
}

export default function DriverInboxScreen({ rideId }) {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionStates, setActionStates] = useState({});

  const resolvedRideId = rideId;

  useEffect(() => {
    setLoading(true);
    const promise = resolvedRideId
      ? getDriverRequests(resolvedRideId)
      : getAllDriverRequests();
    promise
      .then(res => setRequests(res.data?.data || []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, [resolvedRideId]);

  const handleAction = async (reqId, status) => {
    setActionStates(prev => ({ ...prev, [reqId]: status }));
    try {
      await updateRequestStatus(reqId, status);
      setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status } : r));
    } catch {
      setActionStates(prev => ({ ...prev, [reqId]: null }));
    }
  };

  const RequestCard = ({ req }) => {
    const isPending = req.status === 'PENDING' || !req.status;
    const actionState = actionStates[req.id];
    const isActing = !!actionState;

    return (
      <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', padding: '16px', boxShadow: 'var(--shadow-2)', border: '1px solid var(--asphalt-100)', animation: 'fade-in-up 0.2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <WpAvatar initials={getInitials(req.passengerName || req.userName)} size={44} tone="asphalt" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--asphalt-900)', fontFamily: 'var(--font-sans)' }}>
              {req.passengerName || req.userName || 'Passenger'}
            </div>
            <StarRating value={req.passengerRating || req.rating} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink-700)', fontFamily: 'var(--font-mono)' }}>
            ₹{req.fare || '—'}
          </div>
        </div>

        <div style={{ padding: '10px 12px', background: 'var(--asphalt-50)', borderRadius: 'var(--radius-md)', marginBottom: '12px', fontSize: '13px', color: 'var(--asphalt-700)', fontFamily: 'var(--font-sans)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ink-500)', flexShrink: 0 }} />
            {req.pickupLabel || req.pickupLocation || 'Pickup'}
          </div>
          <div style={{ width: 1, height: 10, background: 'var(--asphalt-300)', margin: '2px 3px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '2px', background: 'var(--voltage-400)', flexShrink: 0 }} />
            {req.dropoffLabel || req.dropoffLocation || 'Dropoff'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {req.detourKm != null && <WpPill tone="warn">+{req.detourKm}km detour</WpPill>}
          {req.distanceKm != null && <WpPill tone="matched">{req.distanceKm}km away</WpPill>}
          {req.status && req.status !== 'PENDING' && (
            <WpPill tone={req.status === 'ACCEPTED' ? 'live' : req.status === 'REJECTED' ? 'cancelled' : 'matched'}>
              {req.status}
            </WpPill>
          )}
        </div>

        {isPending && !isActing ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <WpButton kind="danger" size="sm" full onClick={() => handleAction(req.id, 'REJECTED')}>Decline</WpButton>
            <WpButton kind="accent" size="sm" full onClick={() => handleAction(req.id, 'ACCEPTED')}>Accept</WpButton>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {req.status === 'ACCEPTED' || actionState === 'ACCEPTED' ? (
              <WpPill tone="live">Accepted</WpPill>
            ) : req.status === 'REJECTED' || actionState === 'REJECTED' ? (
              <WpPill tone="cancelled">Declined</WpPill>
            ) : (
              <span style={{ fontSize: '13px', color: 'var(--asphalt-400)', fontFamily: 'var(--font-sans)' }}>Processing…</span>
            )}
          </div>
        )}
      </div>
    );
  };

  const EmptyState = () => (
    <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', padding: '48px 24px', textAlign: 'center', border: '1.5px dashed var(--asphalt-200)' }}>
      <WpIcon name="users" size={40} color="var(--asphalt-300)" />
      <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--asphalt-700)', marginTop: '12px', fontFamily: 'var(--font-sans)' }}>No pending requests</p>
      <p style={{ fontSize: '13px', color: 'var(--asphalt-400)', marginTop: '4px', fontFamily: 'var(--font-sans)' }}>
        {resolvedRideId ? 'No riders have requested this ride yet' : 'Start a ride to see requests'}
      </p>
    </div>
  );

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)' }}>
        <div style={{ padding: '32px 40px 0' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--asphalt-900)', fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Ride Requests
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)' }}>
            {resolvedRideId ? `Ride #${resolvedRideId}` : 'Incoming requests'}
            {!loading && requests.length > 0 && ` · ${requests.filter(r => !r.status || r.status === 'PENDING').length} pending`}
          </p>
        </div>

        <div style={{ padding: '24px 40px 40px' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px', maxWidth: 1200 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: '220px', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(90deg, var(--asphalt-100) 25%, var(--asphalt-50) 50%, var(--asphalt-100) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div style={{ maxWidth: '480px' }}>
              <EmptyState />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px', maxWidth: 1200 }}>
              {requests.map(req => <RequestCard key={req.id} req={req} />)}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', paddingBottom: '80px' }}>
      <WpAppBar title="Ride Requests" sub={resolvedRideId ? `Ride #${resolvedRideId}` : 'Incoming requests'} dark />

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} style={{ height: '160px', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(90deg, var(--asphalt-100) 25%, var(--asphalt-50) 50%, var(--asphalt-100) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
          ))
        ) : requests.length === 0 ? (
          <EmptyState />
        ) : (
          requests.map(req => <RequestCard key={req.id} req={req} />)
        )}
      </div>

      <WpBottomNav active="rides" onTap={(t) => {
        if (t === 'home') navigate('/home');
        if (t === 'chat') navigate('/chat/current');
        if (t === 'you') navigate('/login');
      }} />
    </div>
  );
}
