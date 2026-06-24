import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = `${window.location.protocol}//${window.location.host}/ws`;

export default function useRideEventsSubscription(rideIds, onEvent) {
  const clientRef = useRef(null);
  const ids = Array.isArray(rideIds) ? rideIds.filter(Boolean) : [];
  const idsKey = ids.slice().sort().join(',');

  useEffect(() => {
    if (ids.length === 0) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        ids.forEach(id => {
          client.subscribe(`/topic/ride/${id}/events`, (msg) => {
            try {
              const payload = JSON.parse(msg.body);
              onEvent(payload);
            } catch {}
          });
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [idsKey]); // eslint-disable-line react-hooks/exhaustive-deps
}
