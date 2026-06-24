import React, { useEffect, useRef, useState } from 'react';
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

/**
 * Props:
 *   pickup, dropoff    — { lat, lng, label }
 *   height             — px (default 260)
 *
 * Multi-route mode (driver offer / rider search):
 *   routes             — [{ coordinates: [[lng,lat],...], distanceM, durationS }]
 *   selectedRouteIndex — number (default 0)
 *   onSelectRoute      — (index: number) => void — fires when user clicks an alternate route
 *
 * Passenger read-only mode:
 *   routeGeometry      — [[lng, lat], ...] — driver's stored route
 *
 * Falls back to dashed straight line if no route data.
 */
export default function RoutePreviewMap({
  pickup,
  dropoff,
  height = 260,
  routes,
  selectedRouteIndex = 0,
  onSelectRoute,
  routeGeometry,
}) {
  const divRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({ pickup: null, dropoff: null, userLoc: null });
  const routeLinesRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);

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
      if (!cancelled) setMapReady(true);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          if (cancelled || !mapRef.current) return;
          const { latitude: lat, longitude: lng } = pos.coords;
          markersRef.current.userLoc = L.marker([lat, lng], { icon: makeUserIcon(L), zIndexOffset: -10 }).addTo(mapRef.current);
          if (markersRef.current.pickup == null && markersRef.current.dropoff == null) {
            mapRef.current.setView([lat, lng], 14, { animate: false });
          }
        }, () => {}, { timeout: 8000 });
      }
    }
    init();
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      markersRef.current = { pickup: null, dropoff: null, userLoc: null };
      routeLinesRef.current = [];
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    async function update() {
      const L = (await import('leaflet')).default;
      const map = mapRef.current;
      if (!map) return;

      // Clear route lines
      routeLinesRef.current.forEach(pl => pl.remove());
      routeLinesRef.current = [];

      // Clear markers
      const { pickup: pm, dropoff: dm } = markersRef.current;
      if (pm) { pm.remove(); markersRef.current.pickup = null; }
      if (dm) { dm.remove(); markersRef.current.dropoff = null; }

      const hasPickup  = pickup?.lat != null && pickup?.lng != null;
      const hasDropoff = dropoff?.lat != null && dropoff?.lng != null;

      const hasRoutes = routes && routes.length > 0;
      const hasSingle = routeGeometry && routeGeometry.length >= 2;

      if (hasRoutes) {
        // Draw unselected routes first — dotted grey (lower visual priority)
        routes.forEach((route, i) => {
          if (i === selectedRouteIndex) return;
          const latlngs = route.coordinates.map(([lng, lat]) => [lat, lng]);
          const pl = L.polyline(latlngs, {
            color: '#94a3b8', weight: 4, opacity: 0.6, dashArray: '8 6',
          }).addTo(map);
          if (onSelectRoute) {
            pl.getElement && (pl.options.className = 'route-alt-line');
            pl.on('click', (e) => { L.DomEvent.stopPropagation(e); onSelectRoute(i); });
            pl.on('mouseover', () => { pl.setStyle({ opacity: 0.9, weight: 5 }); map.getContainer().style.cursor = 'pointer'; });
            pl.on('mouseout',  () => { pl.setStyle({ opacity: 0.6, weight: 4 }); map.getContainer().style.cursor = ''; });
          }
          routeLinesRef.current.push(pl);
        });
        // Draw selected route on top — solid dark
        const sel = routes[selectedRouteIndex];
        if (sel) {
          const latlngs = sel.coordinates.map(([lng, lat]) => [lat, lng]);
          const pl = L.polyline(latlngs, { color: '#1a1a1a', weight: 5, opacity: 0.9 }).addTo(map);
          routeLinesRef.current.push(pl);
          map.fitBounds(pl.getBounds(), { padding: [40, 40], maxZoom: 15 });
        }
      } else if (hasSingle) {
        // Passenger read-only: driver's stored route
        const latlngs = routeGeometry.map(([lng, lat]) => [lat, lng]);
        const pl = L.polyline(latlngs, { color: '#1a1a1a', weight: 5, opacity: 0.9 }).addTo(map);
        routeLinesRef.current.push(pl);
        map.fitBounds(pl.getBounds(), { padding: [40, 40], maxZoom: 15 });
      } else if (hasPickup && hasDropoff) {
        // Fallback: dashed straight line
        const pl = L.polyline(
          [[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]],
          { color: '#1a1a1a', weight: 3, dashArray: '8 5', opacity: 0.75 }
        ).addTo(map);
        routeLinesRef.current.push(pl);
        map.fitBounds([[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]], { padding: [40, 40], maxZoom: 15 });
      } else if (hasPickup) {
        map.setView([pickup.lat, pickup.lng], 14, { animate: true });
      } else if (hasDropoff) {
        map.setView([dropoff.lat, dropoff.lng], 14, { animate: true });
      }

      // Draw markers on top of routes
      if (hasPickup) {
        markersRef.current.pickup = L.marker([pickup.lat, pickup.lng], { icon: makeIcon(L, '#22c55e'), zIndexOffset: 10 }).addTo(map);
      }
      if (hasDropoff) {
        markersRef.current.dropoff = L.marker([dropoff.lat, dropoff.lng], { icon: makeIcon(L, '#ef4444', 'square'), zIndexOffset: 10 }).addTo(map);
      }
    }

    update();
  }, [
    mapReady,
    pickup?.lat, pickup?.lng,
    dropoff?.lat, dropoff?.lng,
    routes, selectedRouteIndex,
    onSelectRoute,
    routeGeometry,
  ]);

  const hasAny = pickup?.lat != null || dropoff?.lat != null;
  const hasRoutes = routes && routes.length > 0;
  const hasSingle = routeGeometry && routeGeometry.length >= 2;
  const isEstimate = hasAny && !hasRoutes && !hasSingle;

  return (
    <div style={{ position: 'relative', height, borderRadius: 'inherit', overflow: 'hidden' }}>
      <div ref={divRef} style={{ width: '100%', height: '100%' }} />
      {!hasAny && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
          background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(2px)', gap: 8,
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
          {isEstimate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 3, background: '#1a1a1a', borderRadius: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: '#888', fontFamily: 'var(--font-sans)' }}>Approximate route</span>
            </div>
          )}
          {(hasRoutes || hasSingle) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 3, background: '#1a1a1a', borderRadius: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: '#555', fontFamily: 'var(--font-sans)' }}>
                {hasSingle ? "Driver's route" : 'Selected route'}
              </span>
            </div>
          )}
          {hasRoutes && routes.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 3, background: '#94a3b8', borderRadius: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: '#888', fontFamily: 'var(--font-sans)' }}>Alternate routes</span>
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
