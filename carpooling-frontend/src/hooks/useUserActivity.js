import { useState, useEffect, useCallback, useRef } from 'react';
import { getMyActivity } from '../api/activity';
import { useAuth } from '../context/AuthContext';

const POLL_INTERVAL = 60_000;

export default function useUserActivity() {
  const { isAuthenticated } = useAuth();
  const [activity, setActivity] = useState({
    hasOpenRequest: false,
    hasActiveSchedule: false,
    hasInProgressTrip: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await getMyActivity();
      if (mountedRef.current) setActivity(res.data.data);
    } catch {
      // silently ignore — stale state is safe
    }
  }, [isAuthenticated]);

  useEffect(() => {
    mountedRef.current = true;
    if (!isAuthenticated) return;

    setIsLoading(true);
    fetch().finally(() => { if (mountedRef.current) setIsLoading(false); });

    const timer = setInterval(fetch, POLL_INTERVAL);
    return () => {
      clearInterval(timer);
      mountedRef.current = false;
    };
  }, [isAuthenticated, fetch]);

  return { ...activity, isLoading, refresh: fetch };
}
