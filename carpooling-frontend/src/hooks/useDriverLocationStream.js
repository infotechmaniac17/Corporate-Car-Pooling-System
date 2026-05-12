import { useEffect, useRef } from 'react';
import { sendPing } from '../api/tracking';

const THROTTLE_MS = 5000;

export default function useDriverLocationStream(rideId) {
  const watchIdRef = useRef(null);
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (!rideId) return;
    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSentRef.current < THROTTLE_MS) return;
        lastSentRef.current = now;
        sendPing(rideId, pos.coords.latitude, pos.coords.longitude).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [rideId]);
}
