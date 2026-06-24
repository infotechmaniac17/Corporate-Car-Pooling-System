import { useEffect, useState } from 'react';

function computeLabel(depMs) {
  const diffMs = depMs - Date.now();
  if (diffMs <= 0) return null;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return { label: 'departing now', urgent: true };
  if (diffMin < 60) return { label: `departs in ${diffMin} min`, urgent: diffMin <= 30 };
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  const mStr = m > 0 ? ` ${m}m` : '';
  return { label: `departs in ${h}h${mStr}`, urgent: false };
}

export default function useCountdown(departureTime) {
  const depMs = departureTime ? new Date(departureTime).getTime() : null;
  const withinWindow = depMs && (depMs - Date.now()) <= 2 * 60 * 60 * 1000;

  const [result, setResult] = useState(() =>
    depMs && withinWindow ? computeLabel(depMs) : null
  );

  useEffect(() => {
    if (!depMs || !withinWindow) return;
    const tick = () => {
      const r = computeLabel(depMs);
      setResult(r);
      if (!r) clearInterval(id);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [depMs]); // eslint-disable-line react-hooks/exhaustive-deps

  return result;
}
