const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export async function fetchRouteAlternatives(pickup, dropoff) {
  if (!pickup?.lat || !dropoff?.lat) return [];
  try {
    if (MAPBOX_TOKEN) return await _mapboxRoutes(pickup, dropoff);
    return await _osrmRoutes(pickup, dropoff);
  } catch {
    return [];
  }
}

async function _mapboxRoutes(pickup, dropoff) {
  const coords = `${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?alternatives=true&geometries=geojson&overview=full&steps=false&access_token=${MAPBOX_TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.routes || []).map(r => ({
    coordinates: r.geometry.coordinates, // [[lng, lat], ...]
    distanceM: r.distance,
    durationS: r.duration,
  }));
}

async function _osrmRoutes(pickup, dropoff) {
  const coords = `${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?alternatives=true&geometries=geojson&overview=full`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.routes || []).map(r => ({
    coordinates: r.geometry.coordinates,
    distanceM: r.distance,
    durationS: r.duration,
  }));
}
