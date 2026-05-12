import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = 'http://localhost:8081/ws';

export default function useTrackingSubscription(rideId, onLocation) {
  const clientRef = useRef(null);

  useEffect(() => {
    if (!rideId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/ride/${rideId}/location`, (msg) => {
          try {
            const coords = JSON.parse(msg.body);
            if (Array.isArray(coords) && coords.length === 2) {
              onLocation({ lat: coords[0], lng: coords[1] });
            }
          } catch {}
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [rideId]);
}
