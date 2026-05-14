import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

function injectPulseStyle() {
  const id = 'rp-pulse-css';
  if (document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id;
  s.textContent = '@keyframes rp-pulse{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(2.2);opacity:0}}';
  document.head.appendChild(s);
}

function makeIcon(L, color, shape = 'circle') {
  const size = 14;
  const html = shape === 'square'
    ? `<div style="width:${size}px;height:${size}px;border-radius:3px;background:${color};border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`
    : `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`;
  return L.divIcon({ className: '', html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

function makeUserIcon(L) {
  const html = `<div style="position:relative;width:16px;height:16px">
    <div style="position:absolute;inset:-5px;border-radius:50%;background:rgba(59,130,246,0.25);animation:rp-pulse 2s ease-in-out infinite"></div>
    <div style="position:absolute;inset:0;border-radius:50%;background:#3b82f6;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(59,130,246,0.5)"></div>
  </div>`;
  return L.divIcon({ className: '', html, iconSize: [16, 16], iconAnchor: [8, 8] });
}

export default function RoutePreviewMap({ pickup, dropoff, height = 260 }) {
  const divRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({ pickup: null, dropoff: null, line: null, userLoc: null });

  // Init map + get current location once
  useEffect(() => {
    let cancelled = false;
    async function init() {
      const L = (await import('leaflet')).default;
      if (!divRef.current || mapRef.current || cancelled) return;

      injectPulseStyle();

      const map = L.map(divRef.current, {
        center: [18.5204, 73.8567],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { subdomains: 'abcd', maxZoom: 20 }
      ).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapRef.current = map;

      // GPS blue dot
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          if (cancelled || !mapRef.current) return;
          const { latitude: lat, longitude: lng } = pos.coords;
          markersRef.current.userLoc = L.marker([lat, lng], { icon: makeUserIcon(L), zIndexOffset: -10 }).addTo(mapRef.current);
          // Only pan to user location if no pickup/dropoff set yet
          if (markersRef.current.pickup == null && markersRef.current.dropoff == null) {
            mapRef.current.setView([lat, lng], 14, { animate: false });
          }
        }, () => {/* denied — silent */}, { timeout: 8000 });
      }
    }
    init();
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      markersRef.current = { pickup: null, dropoff: null, line: null, userLoc: null };
    };
  }, []);

  // Update pickup/dropoff markers + route line when coords change
  useEffect(() => {
    if (!mapRef.current) return;

    async function update() {
      const L = (await import('leaflet')).default;
      const map = mapRef.current;
      if (!map) return;

      const { pickup: pm, dropoff: dm, line: lm } = markersRef.current;

      if (pm) pm.remove();
      if (dm) dm.remove();
      if (lm) lm.remove();
      markersRef.current = { ...markersRef.current, pickup: null, dropoff: null, line: null };

      const hasPickup  = pickup?.lat != null && pickup?.lng != null;
      const hasDropoff = dropoff?.lat != null && dropoff?.lng != null;

      if (hasPickup) {
        markersRef.current.pickup = L.marker([pickup.lat, pickup.lng], { icon: makeIcon(L, '#22c55e') }).addTo(map);
      }
      if (hasDropoff) {
        markersRef.current.dropoff = L.marker([dropoff.lat, dropoff.lng], { icon: makeIcon(L, '#ef4444', 'square') }).addTo(map);
      }
      if (hasPickup && hasDropoff) {
        markersRef.current.line = L.polyline(
          [[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]],
          { color: '#1a1a1a', weight: 3, dashArray: '8 5', opacity: 0.75 }
        ).addTo(map);
        map.fitBounds([[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]], { padding: [40, 40], maxZoom: 15 });
      } else if (hasPickup) {
        map.setView([pickup.lat, pickup.lng], 14, { animate: true });
      } else if (hasDropoff) {
        map.setView([dropoff.lat, dropoff.lng], 14, { animate: true });
      }
    }

    update();
  }, [pickup?.lat, pickup?.lng, dropoff?.lat, dropoff?.lng]);

  const hasAny = pickup?.lat != null || dropoff?.lat != null;

  return (
    <div style={{ position: 'relative', height, borderRadius: 'inherit', overflow: 'hidden' }}>
      <div ref={divRef} style={{ width: '100%', height: '100%' }} />
      {!hasAny && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
          background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(2px)',
          gap: 8,
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          <span style={{ fontSize: 12, color: '#999', fontFamily: 'var(--font-sans)' }}>
            Enter pickup &amp; drop-off to preview route
          </span>
        </div>
      )}
      {/* Legend */}
      {hasAny && (
        <div style={{
          position: 'absolute', bottom: 12, left: 12, zIndex: 999,
          background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(6px)',
          borderRadius: 8, padding: '7px 10px',
          display: 'flex', flexDirection: 'column', gap: 5,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        }}>
          {pickup?.lat != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: '#555', fontFamily: 'var(--font-sans)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pickup.label || 'Pickup'}
              </span>
            </div>
          )}
          {dropoff?.lat != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: '#ef4444', flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: '#555', fontFamily: 'var(--font-sans)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {dropoff.label || 'Drop-off'}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: '#555', fontFamily: 'var(--font-sans)' }}>Your location</span>
          </div>
        </div>
      )}
    </div>
  );
}
