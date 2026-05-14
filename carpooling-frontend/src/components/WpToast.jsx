import React, { useEffect, useRef } from 'react';

const COLOURS = {
  green:  { bg: 'var(--success-700)', color: '#fff' },
  red:    { bg: 'var(--danger-600)',  color: '#fff' },
  grey:   { bg: 'var(--asphalt-700)', color: '#fff' },
  amber:  { bg: '#f59e0b',            color: '#fff' },
};

/**
 * WpToast — single toast message rendered at bottom-center (mobile) / top-right (desktop).
 *
 * Props:
 *   toast  — { id, message, colour: 'green'|'red'|'grey'|'amber', duration?: ms } | null
 *   onDismiss — () => void
 *   isDesktop — bool
 */
export default function WpToast({ toast, onDismiss, isDesktop }) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!toast) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onDismiss, toast.duration ?? 3000);
    return () => clearTimeout(timerRef.current);
  }, [toast?.id]); // re-arm timer each time a new toast arrives

  if (!toast) return null;

  const c = COLOURS[toast.colour] ?? COLOURS.grey;

  const pos = isDesktop
    ? { top: 24, right: 24, bottom: 'auto', left: 'auto' }
    : { bottom: 24, left: 16, right: 16, top: 'auto', maxWidth: 400, margin: '0 auto' };

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={onDismiss}
      style={{
        position: 'fixed',
        ...pos,
        zIndex: 1500,
        background: c.bg,
        color: c.color,
        borderRadius: 'var(--radius-lg)',
        padding: '12px 20px',
        fontSize: '14px',
        fontWeight: 600,
        fontFamily: 'var(--font-sans)',
        boxShadow: 'var(--shadow-3)',
        maxWidth: 360,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        animation: 'wpToastIn 0.22s ease-out',
        pointerEvents: 'auto',
      }}
    >
      {toast.message}
    </div>
  );
}

/**
 * useToast — returns [toast, showToast] pair for use in screen components.
 *
 * showToast({ message, colour, duration })
 */
export function useToast() {
  const [toast, setToast] = React.useState(null);
  const counter = useRef(0);

  const showToast = React.useCallback(({ message, colour = 'grey', duration = 3000 }) => {
    counter.current += 1;
    setToast({ id: counter.current, message, colour, duration });
  }, []);

  const dismiss = React.useCallback(() => setToast(null), []);

  return [toast, showToast, dismiss];
}
