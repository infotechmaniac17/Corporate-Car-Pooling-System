import React, { useState, useCallback, useRef, useEffect } from 'react';

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_PLACES_KEY;
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// ─── Google Places (New API) ──────────────────────────────────────────────────

async function fetchGoogleSuggestions(query) {
  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY,
    },
    body: JSON.stringify({
      input: query,
      includedRegionCodes: ['in'],
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('[AddressInput] Google autocomplete failed', res.status, data);
    throw new Error(data?.error?.message || `Google API ${res.status}`);
  }
  return (data.suggestions || []).map(s => ({
    id: s.placePrediction.placeId,
    label: s.placePrediction.text.text,
    source: 'google',
  }));
}

async function fetchGoogleDetails(placeId) {
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}?fields=displayName,formattedAddress,location`,
    { headers: { 'X-Goog-Api-Key': GOOGLE_KEY, 'X-Goog-FieldMask': 'displayName,formattedAddress,location' } }
  );
  const data = await res.json();
  if (!res.ok) {
    console.error('[AddressInput] Google details failed', res.status, data);
    throw new Error(data?.error?.message || `Google API ${res.status}`);
  }
  return {
    label: data.formattedAddress || data.displayName?.text || '',
    lat: data.location?.latitude ?? null,
    lng: data.location?.longitude ?? null,
  };
}

// ─── Mapbox Geocoding (fallback) ──────────────────────────────────────────────

async function fetchMapboxSuggestions(query) {
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=in&limit=5&types=address,place,poi`
  );
  const data = await res.json();
  if (!res.ok) {
    console.error('[AddressInput] Mapbox geocoding failed', res.status, data);
    throw new Error(data?.message || `Mapbox API ${res.status}`);
  }
  return (data.features || []).map(f => ({
    id: f.id,
    label: f.place_name,
    lat: f.center[1],
    lng: f.center[0],
    source: 'mapbox',
  }));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddressInput({ value, onChange, placeholder = 'Search address…', label }) {
  const [query, setQuery] = useState(value?.label || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  const provider = GOOGLE_KEY ? 'Google' : MAPBOX_TOKEN ? 'Mapbox' : null;

  // Inject spin keyframe once
  useEffect(() => {
    if (!document.getElementById('wp-addr-spin')) {
      const s = document.createElement('style');
      s.id = 'wp-addr-spin';
      s.textContent = '@keyframes wp-addr-spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(s);
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync label when value changes externally
  useEffect(() => {
    const incoming = value?.label || '';
    if (incoming !== query) setQuery(incoming);
  }, [value?.label]);

  const search = useCallback(async (q) => {
    if (q.length < 3) { setSuggestions([]); setOpen(false); return; }
    setFetching(true);
    try {
      const results = GOOGLE_KEY
        ? await fetchGoogleSuggestions(q)
        : MAPBOX_TOKEN
          ? await fetchMapboxSuggestions(q)
          : [];
      setSuggestions(results);
      setOpen(results.length > 0);
    } catch (err) {
      console.error('[AddressInput] search error:', err.message);
      setSuggestions([]);
    } finally {
      setFetching(false);
    }
  }, []);

  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);
    if (!q) { onChange(null); setSuggestions([]); setOpen(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 350);
  };

  const handleSelect = async (item) => {
    setOpen(false);
    setQuery(item.label);
    if (item.source === 'mapbox' || item.lat != null) {
      onChange({ label: item.label, lat: item.lat, lng: item.lng });
    } else {
      setFetching(true);
      try {
        const details = await fetchGoogleDetails(item.id);
        setQuery(details.label);
        onChange(details);
      } catch {
        onChange({ label: item.label, lat: null, lng: null });
      } finally {
        setFetching(false);
      }
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      {label && (
        <label style={{
          display: 'block', fontSize: 11, fontWeight: 700,
          color: 'var(--asphalt-500)', fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6,
        }}>
          {label}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={provider ? placeholder : 'Enter address manually (no map provider set)'}
          style={{
            width: '100%', padding: '10px 36px 10px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--asphalt-200)',
            fontSize: 14, fontFamily: 'var(--font-sans)',
            color: 'var(--asphalt-900)', background: '#fff',
            outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--ink-600)'}
          onBlur={e => e.target.style.borderColor = 'var(--asphalt-200)'}
        />
        <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
          {fetching ? (
            <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--asphalt-200)', borderTopColor: 'var(--ink-600)', animation: 'wp-addr-spin 0.7s linear infinite' }} />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--asphalt-400)" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          )}
        </div>
      </div>

      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 999,
          background: '#fff', borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-3)', border: '1px solid var(--asphalt-100)',
          overflow: 'hidden', maxHeight: 260, overflowY: 'auto',
        }}>
          {suggestions.map((s, i) => (
            <button
              key={s.id || i}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
              style={{
                width: '100%', padding: '11px 14px', background: 'none', border: 'none',
                textAlign: 'left', cursor: 'pointer', fontSize: 13,
                color: 'var(--asphalt-800)', fontFamily: 'var(--font-sans)',
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--asphalt-50)' : 'none',
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--asphalt-50)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--asphalt-400)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              <span style={{ lineHeight: 1.4 }}>{s.label}</span>
            </button>
          ))}
          {provider && (
            <div style={{ padding: '5px 14px', fontSize: 10, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', borderTop: '1px solid var(--asphalt-100)', background: 'var(--asphalt-50)' }}>
              Powered by {provider}
            </div>
          )}
        </div>
      )}

      {!provider && (
        <div style={{ fontSize: 11, color: 'var(--asphalt-400)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
          Add VITE_GOOGLE_PLACES_KEY or VITE_MAPBOX_TOKEN to .env to enable autocomplete.
        </div>
      )}
    </div>
  );
}
