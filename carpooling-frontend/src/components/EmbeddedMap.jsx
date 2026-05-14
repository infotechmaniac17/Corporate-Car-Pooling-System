import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

export default function EmbeddedMap({ lat, lng, zoom = 14, height = 200, markers = [] }) {
  const divRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const L = (await import('leaflet')).default;
      if (!divRef.current || mapRef.current || cancelled) return;

      const centerLat = lat ?? 18.5204;
      const centerLng = lng ?? 73.8567;

      const map = L.map(divRef.current, {
        center: [centerLat, centerLng],
        zoom,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        keyboard: false,
      });

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { subdomains: 'abcd', maxZoom: 20 }
      ).addTo(map);

      // User location dot marker
      const dotIcon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#1a1a1a;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      // Pulse ring
      const pulseIcon = L.divIcon({
        className: '',
        html: `<div style="width:40px;height:40px;border-radius:50%;background:rgba(26,26,26,0.12);animation:em-pulse 2s ease-out infinite"></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      if (lat != null && lng != null) {
        L.marker([centerLat, centerLng], { icon: pulseIcon }).addTo(map);
        L.marker([centerLat, centerLng], { icon: dotIcon }).addTo(map);
      }

      // Extra markers (e.g., office location)
      markers.forEach(m => {
        if (m.lat == null || m.lng == null) return;
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:10px;height:10px;border-radius:2px;background:${m.color || '#f59e0b'};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        });
        L.marker([m.lat, m.lng], { icon }).addTo(map);
      });

      mapRef.current = map;
    }

    init();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng]);

  return (
    <>
      <div ref={divRef} style={{ width: '100%', height, borderRadius: 'inherit' }} />
      <style>{`@keyframes em-pulse { 0%{transform:scale(0.5);opacity:1} 100%{transform:scale(2.5);opacity:0} }`}</style>
    </>
  );
}
