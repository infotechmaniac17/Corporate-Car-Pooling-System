import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import WpAppBar from '../components/WpAppBar';
import WpButton from '../components/WpButton';
import useIsDesktop from '../hooks/useIsDesktop';
import { submit as submitRating } from '../api/ratings';

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '24px 0' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 40, lineHeight: 1, padding: 4,
            color: star <= (hovered || value) ? '#f59e0b' : 'var(--asphalt-200)',
            transition: 'color 0.1s',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

const STAR_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent' };

export default function RateRideScreen() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [searchParams] = useSearchParams();
  const driverId = searchParams.get('driverId');

  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const rideId = window.location.pathname.split('/rate/')[1]?.split('?')[0];

  const handleSubmit = async () => {
    if (!score) return;
    setSubmitting(true);
    setError('');
    try {
      await submitRating({ givenToId: Number(driverId), score, comment: comment.trim() || undefined });
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit rating.');
    } finally {
      setSubmitting(false);
    }
  };

  const Content = () => {
    if (done) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>⭐</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--asphalt-900)', marginBottom: 8 }}>Thanks for rating!</h2>
          <p style={{ fontSize: 14, color: 'var(--asphalt-500)', marginBottom: 28 }}>Your feedback helps the community.</p>
          <WpButton kind="accent" size="md" onClick={() => navigate('/my-trips')}>Back to trips</WpButton>
        </div>
      );
    }

    return (
      <div>
        <div style={{ textAlign: 'center', paddingTop: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--asphalt-900)', marginBottom: 4 }}>Rate your driver</h2>
          <p style={{ fontSize: 13, color: 'var(--asphalt-500)' }}>How was your ride?</p>
        </div>

        <StarRating value={score} onChange={setScore} />

        {score > 0 && (
          <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 20 }}>
            {STAR_LABELS[score]}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--asphalt-500)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
            Comment (optional)
          </label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            placeholder="Tell us more about your experience…"
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--asphalt-200)', fontSize: 14, fontFamily: 'var(--font-sans)',
              color: 'var(--asphalt-900)', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--ink-600)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--asphalt-200)'; }}
          />
        </div>

        {error && (
          <div style={{ fontSize: 12, color: 'var(--danger-600)', padding: '8px 12px', background: 'var(--danger-50)', borderRadius: 8, border: '1px solid var(--danger-200)', marginBottom: 12 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <WpButton kind="secondary" size="md" onClick={() => navigate(-1)} disabled={submitting}>
            Skip
          </WpButton>
          <WpButton kind="accent" size="md" full onClick={handleSubmit} disabled={!score || submitting}>
            {submitting ? 'Submitting…' : 'Submit rating'}
          </WpButton>
        </div>
      </div>
    );
  };

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', padding: 36, width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-2)', border: '1px solid var(--asphalt-100)' }}>
          <Content />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--asphalt-50)', paddingBottom: 40 }}>
      <WpAppBar title="Rate your ride" onBack={() => navigate(-1)} dark />
      <div style={{ padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 'var(--radius-2xl)', padding: 20, boxShadow: 'var(--shadow-1)', border: '1px solid var(--asphalt-100)' }}>
          <Content />
        </div>
      </div>
    </div>
  );
}
