import React, { useState, useCallback, useRef, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_PLACES_KEY;

// ─── Geocoding helpers ────────────────────────────────────────────────────────

async function reverseGeocode(lat, lng) {
  if (MAPBOX_TOKEN) {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=address,place,poi&limit=1`
      );
      const data = await res.json();
      const f = data.features?.[0];
      if (f) return f.place_name;
    } catch { /* fall through */ }
  }
  if (GOOGLE_KEY) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_KEY}`
      );
      const data = await res.json();
      const r = data.results?.[0];
      if (r) return r.formatted_address;
    } catch { /* fall through */ }
  }
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

async function searchPlaces(q) {
  if (GOOGLE_KEY) {
    try {
      const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GOOGLE_KEY },
        body: JSON.stringify({ input: q, includedRegionCodes: ['in'] }),
      });
      const data = await res.json();
      return (data.suggestions || []).map(s => ({
        id: s.placePrediction.placeId,
        label: s.placePrediction.text.text,
        source: 'google',
      }));
    } catch { /* fall through */ }
  }
  if (MAPBOX_TOKEN) {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&country=in&limit=5&types=address,place,poi`
      );
      const data = await res.json();
      return (data.features || []).map(f => ({
        id: f.id,
        label: f.place_name,
        lat: f.center[1],
        lng: f.center[0],
        source: 'mapbox',
      }));
    } catch { /* fall through */ }
  }
  return [];
}

async function resolveGooglePlace(placeId, fallback) {
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}?fields=displayName,formattedAddress,location`,
    { headers: { 'X-Goog-Api-Key': GOOGLE_KEY, 'X-Goog-FieldMask': 'displayName,formattedAddress,location' } }
  );
  const data = await res.json();
  const name = data.displayName?.text || '';
  const addr = data.formattedAddress || '';
  let label = addr || name || fallback;
  if (name && addr && !addr.toLowerCase().startsWith(name.toLowerCase())) {
    label = `${name}, ${addr}`;
  }
  return { label, lat: data.location?.latitude, lng: data.location?.longitude };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LocationPickerMap({
  onConfirm,
  onClose,
  initialLat,
  initialLng,
  title = 'Set location',
}) {
  const mapRef = useRef(null);       // leaflet map instance
  const mapDivRef = useRef(null);    // DOM div
  const revDebounce = useRef(null);

  const [address, setAddress] = useState('');
  const [loadingAddr, setLoadingAddr] = useState(false);
  const [center, setCenter] = useState({
    lat: initialLat ?? 18.5204,
    lng: initialLng ?? 73.8567,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDebounce = useRef(null);

  // ── Init Leaflet imperatively ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const L = (await import('leaflet')).default;

      if (!mapDivRef.current || mapRef.current) return;

      const startLat = initialLat ?? 18.5204;
      const startLng = initialLng ?? 73.8567;

      const map = L.map(mapDivRef.current, {
        center: [startLat, startLng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { subdomains: 'abcd', maxZoom: 20 }
      ).addTo(map);

      map.on('moveend', () => {
        if (cancelled) return;
        const c = map.getCenter();
        setCenter({ lat: c.lat, lng: c.lng });
        clearTimeout(revDebounce.current);
        revDebounce.current = setTimeout(async () => {
          if (cancelled) return;
          setLoadingAddr(true);
          try {
            const label = await reverseGeocode(c.lat, c.lng);
            if (!cancelled) setAddress(label);
          } finally {
            if (!cancelled) setLoadingAddr(false);
          }
        }, 500);
      });

      mapRef.current = map;

      // Initial reverse geocode
      if (!cancelled) {
        setLoadingAddr(true);
        try {
          const label = await reverseGeocode(startLat, startLng);
          if (!cancelled) setAddress(label);
        } finally {
          if (!cancelled) setLoadingAddr(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      clearTimeout(revDebounce.current);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // ── Fly to location ────────────────────────────────────────────────────────
  const flyTo = useCallback((lat, lng) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 16, { duration: 1 });
    }
  }, []);

  // ── Use current GPS location ───────────────────────────────────────────────
  const [gpsLoading, setGpsLoading] = useState(false);
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        flyTo(lat, lng);
        setCenter({ lat, lng });
        setLoadingAddr(true);
        setGpsLoading(false);
        try {
          const label = await reverseGeocode(lat, lng);
          setAddress(label);
        } finally {
          setLoadingAddr(false);
        }
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // ── Search handlers ────────────────────────────────────────────────────────
  const handleSearchInput = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q || q.length < 3) { setSuggestions([]); setSearchOpen(false); return; }
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchPlaces(q);
        setSuggestions(results);
        setSearchOpen(results.length > 0);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
  };

  const handleSelectSuggestion = async (item) => {
    setSearchOpen(false);
    setSearchQuery(item.label);
    if (item.source === 'mapbox' || item.lat != null) {
      flyTo(item.lat, item.lng);
      setCenter({ lat: item.lat, lng: item.lng });
      setAddress(item.label);
    } else {
      setLoadingAddr(true);
      try {
        const details = await resolveGooglePlace(item.id, item.label);
        if (details.lat) flyTo(details.lat, details.lng);
        setAddress(details.label);
      } catch {
        setAddress(item.label);
      } finally {
        setLoadingAddr(false);
      }
    }
  };

  const handleConfirm = () => {
    const c = mapRef.current ? mapRef.current.getCenter() : center;
    onConfirm({ label: address, lat: c.lat, lng: c.lng });
  };

  // ── ESC to close ───────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column',
      background: '#000',
    }}>
      {/* ── Map div (leaflet renders here) ── */}
      <div ref={mapDivRef} style={{ position: 'absolute', inset: 0 }} />

      {/* ── Top bar ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10001,
        padding: '12px 12px 0',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: '#fff', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div style={{
            flex: 1, background: '#fff', borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
            position: 'relative',
          }}>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInput}
              onFocus={() => { if (suggestions.length > 0) setSearchOpen(true); }}
              onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
              placeholder={title}
              style={{
                width: '100%', padding: '12px 40px 12px 14px',
                border: 'none', outline: 'none',
                fontSize: 14, fontFamily: 'var(--font-sans)',
                color: '#1a1a1a', background: 'transparent',
                boxSizing: 'border-box', borderRadius: 12,
              }}
            />
            <div style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}>
              {searchLoading ? (
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #ddd', borderTopColor: '#333', animation: 'lpm-spin 0.7s linear infinite' }} />
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              )}
            </div>
          </div>
        </div>

        {searchOpen && suggestions.length > 0 && (
          <div style={{
            background: '#fff', borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            overflow: 'hidden', maxHeight: 280, overflowY: 'auto',
          }}>
            {suggestions.map((s, i) => (
              <button
                key={s.id || i}
                onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(s); }}
                style={{
                  width: '100%', padding: '12px 14px', background: 'none', border: 'none',
                  textAlign: 'left', cursor: 'pointer', fontSize: 13,
                  color: '#333', fontFamily: 'var(--font-sans)',
                  borderBottom: i < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f7f7f7'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                <span style={{ lineHeight: 1.4 }}>{s.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Center pin ── */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -100%)',
        pointerEvents: 'none', zIndex: 10002,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50% 50% 50% 0',
          background: '#1a1a1a', transform: 'rotate(-45deg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 3px 10px rgba(0,0,0,0.4)',
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', transform: 'rotate(45deg)' }} />
        </div>
        <div style={{ width: 2, height: 12, background: 'rgba(0,0,0,0.5)', borderRadius: 2 }} />
        <div style={{ width: 8, height: 4, borderRadius: '50%', background: 'rgba(0,0,0,0.2)' }} />
      </div>

      {/* ── GPS button ── */}
      <div style={{
        position: 'absolute', bottom: 195, right: 16, zIndex: 10001,
      }}>
        <button
          onClick={handleUseCurrentLocation}
          disabled={gpsLoading}
          title="Use current location"
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: '#fff', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
            opacity: gpsLoading ? 0.6 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {gpsLoading ? (
            <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid #ddd', borderTopColor: '#1a1a1a', animation: 'lpm-spin 0.7s linear infinite' }} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              <circle cx="12" cy="12" r="8" strokeDasharray="2 4" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Bottom sheet ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10001,
        background: '#fff', borderRadius: '20px 20px 0 0',
        padding: '16px 16px 32px',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e0e0e0', margin: '0 auto 16px' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: '#f0f0f0',
            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>
              Selected location
            </div>
            {loadingAddr ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #ddd', borderTopColor: '#333', animation: 'lpm-spin 0.7s linear infinite' }} />
                <span style={{ fontSize: 13, color: '#999' }}>Fetching address…</span>
              </div>
            ) : (
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.4 }}>
                {address || 'Move the map to select a location'}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleConfirm}
          disabled={!address || loadingAddr}
          style={{
            width: '100%', padding: '14px', borderRadius: 12,
            background: address && !loadingAddr ? '#1a1a1a' : '#e0e0e0',
            border: 'none', cursor: address && !loadingAddr ? 'pointer' : 'not-allowed',
            fontSize: 15, fontWeight: 700, color: address && !loadingAddr ? '#fff' : '#aaa',
            fontFamily: 'var(--font-sans)', transition: 'background 0.2s',
          }}
        >
          Confirm location
        </button>
      </div>

      <style>{`
        @keyframes lpm-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
